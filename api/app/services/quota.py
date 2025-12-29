"""Quota management service for tracking and enforcing usage limits."""

import logging
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.models.organization import Organization
from app.models.quota_notification import QuotaNotification

logger = logging.getLogger(__name__)

# Burst protection: max queries per hour per organization
MAX_QUERIES_PER_HOUR = 50

# Quota warning thresholds (percentage of quota used)
WARNING_THRESHOLD_80 = Decimal("0.80")
WARNING_THRESHOLD_90 = Decimal("0.90")
WARNING_THRESHOLD_100 = Decimal("1.00")
WARNING_THRESHOLD_110 = Decimal("1.10")

# Notification thresholds (percentage)
NOTIFICATION_THRESHOLDS = [90, 100, 110]

# Tier quota limits (monthly EUR)
TIER_QUOTA_LIMITS = {
    "basic": Decimal("15.00"),
    "professional": Decimal("35.00"),
    "enterprise": Decimal("80.00"),
}

# Model pricing per 1M tokens (input, output) in USD
MODEL_PRICING = {
    "claude-3-haiku": {
        "input": Decimal("0.25"),
        "output": Decimal("1.25"),
    },
    "claude-3-haiku-20240307": {
        "input": Decimal("0.25"),
        "output": Decimal("1.25"),
    },
    "gpt-4o-mini": {
        "input": Decimal("0.15"),
        "output": Decimal("0.60"),
    },
    "gpt-4o-mini-2024-07-18": {
        "input": Decimal("0.15"),
        "output": Decimal("0.60"),
    },
    "gemini-1.5-flash": {
        "input": Decimal("0.075"),
        "output": Decimal("0.30"),
    },
    "gemini-1.5-flash-latest": {
        "input": Decimal("0.075"),
        "output": Decimal("0.30"),
    },
}

# USD to EUR conversion rate (approximate)
USD_TO_EUR = Decimal("0.92")


@dataclass
class QuotaStatus:
    """Current quota status for an organization."""

    org_id: UUID
    quota_limit_euro: Decimal
    quota_used_euro: Decimal
    quota_remaining_euro: Decimal
    usage_percentage: Decimal
    is_exceeded: bool
    is_near_limit: bool
    is_hard_blocked: bool  # True when usage >= 110%
    queries_this_hour: int
    burst_limit_exceeded: bool
    reset_date: date | None = None


class QuotaServiceError(Exception):
    """Exception raised for quota service errors."""


class QuotaService:
    """Service for managing organization quotas and burst protection."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the quota service.

        Args:
            db: The database session.
        """
        self.db = db

    async def check_quota(self, org_id: UUID) -> QuotaStatus:
        """Check the current quota status for an organization.

        Args:
            org_id: The organization ID to check.

        Returns:
            QuotaStatus with current usage information.

        Raises:
            QuotaServiceError: If organization not found.
        """
        # Get organization
        result = await self.db.execute(
            select(Organization).where(Organization.id == org_id)
        )
        org = result.scalar_one_or_none()

        if not org:
            raise QuotaServiceError(f"Organization not found: {org_id}")

        # Calculate remaining quota
        quota_remaining = max(
            org.quota_limit_euro - org.quota_used_euro,
            Decimal("0"),
        )

        # Calculate usage percentage
        if org.quota_limit_euro > 0:
            usage_percentage = (org.quota_used_euro / org.quota_limit_euro) * 100
        else:
            usage_percentage = Decimal("100")

        # Check burst protection (queries in last hour)
        queries_this_hour = await self._count_queries_last_hour(org_id)

        # Calculate next reset date
        reset_date = self._calculate_next_reset_date(org.billing_day)

        return QuotaStatus(
            org_id=org_id,
            quota_limit_euro=org.quota_limit_euro,
            quota_used_euro=org.quota_used_euro,
            quota_remaining_euro=quota_remaining,
            usage_percentage=usage_percentage,
            is_exceeded=org.quota_used_euro >= org.quota_limit_euro,
            is_near_limit=usage_percentage >= WARNING_THRESHOLD_80 * 100,
            is_hard_blocked=usage_percentage >= WARNING_THRESHOLD_110 * 100,
            queries_this_hour=queries_this_hour,
            burst_limit_exceeded=queries_this_hour >= MAX_QUERIES_PER_HOUR,
            reset_date=reset_date,
        )

    def _calculate_next_reset_date(self, billing_day: int) -> date:
        """Calculate the next quota reset date based on billing day.

        Args:
            billing_day: The day of month when billing resets (1-28).

        Returns:
            The next reset date.
        """
        today = date.today()
        current_month = today.month
        current_year = today.year

        # If billing day hasn't passed this month, reset is this month
        if today.day < billing_day:
            reset_date = date(current_year, current_month, billing_day)
        elif current_month == 12:
            # Reset is next year January
            reset_date = date(current_year + 1, 1, billing_day)
        else:
            # Reset is next month
            reset_date = date(current_year, current_month + 1, billing_day)

        return reset_date

    async def _count_queries_last_hour(self, org_id: UUID) -> int:
        """Count the number of queries in the last hour.

        Args:
            org_id: The organization ID.

        Returns:
            Number of inbound messages in the last hour.
        """
        one_hour_ago = datetime.now(UTC) - timedelta(hours=1)

        result = await self.db.execute(
            select(func.count(Message.id)).where(
                Message.organization_id == org_id,
                Message.direction == "inbound",
                Message.created_at >= one_hour_ago,
            )
        )
        count = result.scalar()
        return count or 0

    async def consume_quota(
        self,
        org_id: UUID,
        cost_euro: float | Decimal,
    ) -> QuotaStatus:
        """Consume quota for an organization.

        Args:
            org_id: The organization ID.
            cost_euro: The cost to deduct from quota.

        Returns:
            Updated QuotaStatus.

        Raises:
            QuotaServiceError: If organization not found.
        """
        cost = Decimal(str(cost_euro))

        # Get organization
        result = await self.db.execute(
            select(Organization).where(Organization.id == org_id)
        )
        org = result.scalar_one_or_none()

        if not org:
            raise QuotaServiceError(f"Organization not found: {org_id}")

        # Update quota usage
        org.quota_used_euro = org.quota_used_euro + cost

        await self.db.flush()

        logger.info(
            "Consumed quota for org=%s: cost=%.4f EUR, total_used=%.2f EUR",
            org_id,
            cost,
            org.quota_used_euro,
        )

        # Return updated status
        return await self.check_quota(org_id)

    async def can_process_query(self, org_id: UUID) -> tuple[bool, str | None]:
        """Check if a query can be processed (quota + burst protection).

        This method performs the following checks:
        1. Burst limit (50 queries/hour) - blocks if exceeded
        2. Hard quota block (110%) - blocks if exceeded
        3. Soft quota limit (100%) - allows processing but warns

        Args:
            org_id: The organization ID.

        Returns:
            Tuple of (can_process, error_message).
        """
        status = await self.check_quota(org_id)

        # Check burst protection first (50 queries/hour)
        if status.burst_limit_exceeded:
            return False, "rate_limit"

        # Block at 110% - hard limit
        if status.is_hard_blocked:
            return False, "quota_exceeded"

        # Allow processing at 100% but warn (warnings handled elsewhere)
        # Queries are allowed until 110% is reached
        return True, None

    def get_warning_message(
        self,
        quota_status: QuotaStatus,
        lang: str = "en",
    ) -> str | None:
        """Get a warning message based on quota status.

        Args:
            quota_status: The current quota status.
            lang: Language code ('en', 'de', 'fr', 'it', 'es').

        Returns:
            Warning message or None if no warning needed.
        """
        messages = {
            "en": {
                "exceeded": (
                    "\n[QUOTA EXCEEDED: Contact support to upgrade your plan]"
                ),
                "warning_90": (
                    "\n[WARNING: 90% of monthly quota used. Contact support to upgrade]"
                ),
                "warning_80": ("\n[WARNING: 80% of monthly quota used]"),
                "rate_limit": (
                    "\n[RATE LIMIT: Too many requests. Please wait a few minutes]"
                ),
            },
            "de": {
                "exceeded": (
                    "\n[KONTINGENT ERSCHOEPFT: Kontaktieren Sie den Support]"
                ),
                "warning_90": (
                    "\n[WARNUNG: 90% des Monatskontingents verbraucht. "
                    "Kontaktieren Sie den Support]"
                ),
                "warning_80": ("\n[WARNUNG: 80% des Monatskontingents verbraucht]"),
                "rate_limit": (
                    "\n[LIMIT: Zu viele Anfragen. Bitte warten Sie einige Minuten]"
                ),
            },
            "fr": {
                "exceeded": (
                    "\n[QUOTA DEPASSE: Contactez le support pour mettre a niveau]"
                ),
                "warning_90": (
                    "\n[ATTENTION: 90% du quota mensuel utilise. "
                    "Contactez le support]"
                ),
                "warning_80": ("\n[ATTENTION: 80% du quota mensuel utilise]"),
                "rate_limit": (
                    "\n[LIMITE: Trop de demandes. Veuillez patienter quelques minutes]"
                ),
            },
            "it": {
                "exceeded": ("\n[QUOTA ESAURITA: Contatta il supporto per aggiornare]"),
                "warning_90": (
                    "\n[ATTENZIONE: 90% della quota mensile utilizzata. "
                    "Contatta il supporto per aggiornare]"
                ),
                "warning_80": ("\n[ATTENZIONE: 80% della quota mensile utilizzata]"),
                "rate_limit": ("\n[LIMITE: Troppe richieste. Attendi qualche minuto]"),
            },
            "es": {
                "exceeded": (
                    "\n[CUOTA AGOTADA: Contacta soporte para actualizar tu plan]"
                ),
                "warning_90": (
                    "\n[AVISO: 90% de la cuota mensual utilizada. "
                    "Contacta soporte]"
                ),
                "warning_80": ("\n[AVISO: 80% de la cuota mensual utilizada]"),
                "rate_limit": (
                    "\n[LIMITE: Demasiadas solicitudes. Espera unos minutos]"
                ),
            },
        }

        # Default to English if language not supported
        lang_messages = messages.get(lang, messages["en"])

        if quota_status.burst_limit_exceeded:
            return lang_messages["rate_limit"]

        if quota_status.is_exceeded:
            return lang_messages["exceeded"]

        if quota_status.usage_percentage >= WARNING_THRESHOLD_90 * 100:
            return lang_messages["warning_90"]

        if quota_status.usage_percentage >= WARNING_THRESHOLD_80 * 100:
            return lang_messages["warning_80"]

        return None

    def get_error_message(
        self,
        error_type: str,
        lang: str = "en",
    ) -> str:
        """Get an error message for quota/rate limit errors.

        Args:
            error_type: The type of error ('rate_limit', 'quota_exceeded', etc.).
            lang: Language code ('en', 'de', 'fr', 'it', 'es').

        Returns:
            Error message in the specified language.
        """
        messages = {
            "en": {
                "rate_limit": (
                    "Too many requests. Please wait 30-60 minutes before "
                    "sending another message."
                ),
                "quota_exceeded": (
                    "Your monthly quota has been exceeded. "
                    "Please contact support to upgrade your plan or wait "
                    "until next billing cycle."
                ),
                "empty_message": (
                    "Empty message received. Please send a question about "
                    "your technical documentation."
                ),
                "processing_error": (
                    "Unable to process your request. Please try again later."
                ),
                "timeout": (
                    "Request timed out. Please try again in a few minutes."
                ),
            },
            "de": {
                "rate_limit": (
                    "Zu viele Anfragen. Bitte warten Sie 30-60 Minuten "
                    "bevor Sie eine weitere Nachricht senden."
                ),
                "quota_exceeded": (
                    "Ihr monatliches Kontingent wurde ueberschritten. "
                    "Kontaktieren Sie den Support um Ihren Plan zu aktualisieren "
                    "oder warten Sie auf den naechsten Abrechnungszeitraum."
                ),
                "empty_message": (
                    "Leere Nachricht erhalten. Bitte senden Sie eine Frage "
                    "zu Ihrer technischen Dokumentation."
                ),
                "processing_error": (
                    "Anfrage konnte nicht verarbeitet werden. "
                    "Bitte versuchen Sie es spaeter erneut."
                ),
                "timeout": (
                    "Zeitlimit ueberschritten. Bitte versuchen Sie es "
                    "in einigen Minuten erneut."
                ),
            },
            "fr": {
                "rate_limit": (
                    "Trop de demandes. Veuillez attendre 30-60 minutes "
                    "avant d'envoyer un autre message."
                ),
                "quota_exceeded": (
                    "Votre quota mensuel a ete depasse. "
                    "Contactez le support pour mettre a niveau votre plan "
                    "ou attendez le prochain cycle de facturation."
                ),
                "empty_message": (
                    "Message vide recu. Veuillez envoyer une question sur "
                    "votre documentation technique."
                ),
                "processing_error": (
                    "Impossible de traiter votre demande. "
                    "Veuillez reessayer plus tard."
                ),
                "timeout": (
                    "Delai d'attente depasse. Veuillez reessayer "
                    "dans quelques minutes."
                ),
            },
            "it": {
                "rate_limit": (
                    "Troppe richieste. Attendi 30-60 minuti prima di "
                    "inviare un altro messaggio."
                ),
                "quota_exceeded": (
                    "La tua quota mensile e' stata superata. "
                    "Contatta il supporto per aggiornare il piano o attendi "
                    "il prossimo ciclo di fatturazione."
                ),
                "empty_message": (
                    "Messaggio vuoto ricevuto. Invia una domanda sulla "
                    "tua documentazione tecnica."
                ),
                "processing_error": (
                    "Impossibile elaborare la richiesta. Riprova piu' tardi."
                ),
                "timeout": (
                    "Timeout della richiesta. Riprova tra qualche minuto."
                ),
            },
            "es": {
                "rate_limit": (
                    "Demasiadas solicitudes. Por favor espera 30-60 minutos "
                    "antes de enviar otro mensaje."
                ),
                "quota_exceeded": (
                    "Tu cuota mensual ha sido superada. "
                    "Contacta soporte para actualizar tu plan o espera "
                    "al proximo ciclo de facturacion."
                ),
                "empty_message": (
                    "Mensaje vacio recibido. Por favor envia una pregunta sobre "
                    "tu documentacion tecnica."
                ),
                "processing_error": (
                    "No se pudo procesar tu solicitud. "
                    "Por favor intenta de nuevo mas tarde."
                ),
                "timeout": (
                    "Tiempo de espera agotado. Por favor intenta de nuevo "
                    "en unos minutos."
                ),
            },
        }

        lang_messages = messages.get(lang, messages["en"])
        return lang_messages.get(error_type, lang_messages["processing_error"])

    async def track_usage(
        self,
        org_id: UUID,
        tokens_in: int,
        tokens_out: int,
        model: str,
    ) -> QuotaStatus:
        """Track token usage for a query.

        Args:
            org_id: The organization ID.
            tokens_in: Number of input tokens used.
            tokens_out: Number of output tokens used.
            model: The model used for the query.

        Returns:
            Updated QuotaStatus after tracking usage.

        Raises:
            QuotaServiceError: If organization not found.
        """
        cost_euro = self.calculate_cost(tokens_in, tokens_out, model)

        logger.info(
            "Tracking usage for org=%s: tokens_in=%d, tokens_out=%d, "
            "model=%s, cost=%.6f EUR",
            org_id,
            tokens_in,
            tokens_out,
            model,
            cost_euro,
        )

        return await self.consume_quota(org_id, cost_euro)

    def calculate_cost(
        self,
        tokens_in: int,
        tokens_out: int,
        model: str,
    ) -> Decimal:
        """Calculate cost based on token usage and model pricing.

        Args:
            tokens_in: Number of input tokens.
            tokens_out: Number of output tokens.
            model: The model name.

        Returns:
            Cost in EUR.
        """
        # Get pricing for model, default to gpt-4o-mini if unknown
        pricing = MODEL_PRICING.get(model, MODEL_PRICING["gpt-4o-mini"])

        # Calculate cost in USD (pricing is per 1M tokens)
        input_cost_usd = (Decimal(tokens_in) / Decimal("1000000")) * pricing["input"]
        output_cost_usd = (Decimal(tokens_out) / Decimal("1000000")) * pricing["output"]
        total_cost_usd = input_cost_usd + output_cost_usd

        # Convert to EUR
        cost_euro = total_cost_usd * USD_TO_EUR

        return cost_euro.quantize(Decimal("0.000001"))

    async def check_burst_limit(self, org_id: UUID) -> bool:
        """Check if the burst limit (50 queries/hour) is exceeded.

        Args:
            org_id: The organization ID.

        Returns:
            True if burst limit is exceeded, False otherwise.
        """
        queries_this_hour = await self._count_queries_last_hour(org_id)
        return queries_this_hour >= MAX_QUERIES_PER_HOUR

    async def should_notify(self, org_id: UUID, threshold: int) -> bool:
        """Check if a notification should be sent for a quota threshold.

        This method checks if a notification has already been sent for the
        given threshold in the current billing period.

        Args:
            org_id: The organization ID.
            threshold: The threshold percentage (90, 100, or 110).

        Returns:
            True if notification should be sent (not sent before), False otherwise.
        """
        # Check if notification already sent for this threshold
        result = await self.db.execute(
            select(QuotaNotification).where(
                QuotaNotification.organization_id == org_id,
                QuotaNotification.threshold_percent == threshold,
            )
        )
        existing = result.scalar_one_or_none()

        return existing is None

    async def record_notification(self, org_id: UUID, threshold: int) -> None:
        """Record that a notification has been sent for a quota threshold.

        Args:
            org_id: The organization ID.
            threshold: The threshold percentage (90, 100, or 110).
        """
        notification = QuotaNotification(
            id=uuid4(),
            organization_id=org_id,
            threshold_percent=threshold,
        )
        self.db.add(notification)
        await self.db.flush()

        logger.info(
            "Recorded quota notification for org=%s at threshold=%d%%",
            org_id,
            threshold,
        )

    async def reset_quota(self, org_id: UUID) -> None:
        """Reset quota for an organization (called by cron job).

        This method:
        1. Resets quota_used_euro to 0
        2. Clears all quota notifications for the organization

        Args:
            org_id: The organization ID.

        Raises:
            QuotaServiceError: If organization not found.
        """
        # Get organization
        result = await self.db.execute(
            select(Organization).where(Organization.id == org_id)
        )
        org = result.scalar_one_or_none()

        if not org:
            raise QuotaServiceError(f"Organization not found: {org_id}")

        # Reset quota usage
        old_quota_used = org.quota_used_euro
        org.quota_used_euro = Decimal("0.00")

        # Clear quota notifications
        await self.db.execute(
            delete(QuotaNotification).where(
                QuotaNotification.organization_id == org_id
            )
        )

        await self.db.flush()

        logger.info(
            "Reset quota for org=%s: previous_usage=%.2f EUR",
            org_id,
            old_quota_used,
        )

    async def get_organizations_for_reset(self) -> list[UUID]:
        """Get organizations that need quota reset today.

        Returns:
            List of organization IDs where billing_day equals today.
        """
        today = date.today().day

        result = await self.db.execute(
            select(Organization.id).where(Organization.billing_day == today)
        )
        org_ids = result.scalars().all()

        return list(org_ids)
