"""KPI calculation service for admin dashboard."""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, ClassVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.enums import MessageDirectionEnum, TierEnum
from app.models.message import Message
from app.models.organization import Organization


class KPIService:
    """Service for calculating business and technical KPIs.

    Provides metrics for the admin dashboard including MRR, ARR,
    active subscriptions, query counts, error rates, etc.
    """

    # Tier pricing for MRR calculation (from project.md)
    TIER_MONTHLY_PRICES: ClassVar[dict[TierEnum, Decimal]] = {
        TierEnum.basic: Decimal("79.00"),
        TierEnum.professional: Decimal("149.00"),
        TierEnum.enterprise: Decimal("399.00"),
    }

    async def get_dashboard_kpis(self, db: AsyncSession) -> dict[str, Any]:
        """Get all dashboard KPIs.

        Args:
            db: Database session.

        Returns:
            Dictionary containing all dashboard KPIs.
        """
        business_kpis = await self._get_business_kpis(db)
        technical_kpis = await self._get_technical_kpis(db)

        return {
            "business": business_kpis,
            "technical": technical_kpis,
            "generated_at": datetime.utcnow().isoformat(),
        }

    async def _get_business_kpis(self, db: AsyncSession) -> dict[str, Any]:
        """Calculate business KPIs.

        Args:
            db: Database session.

        Returns:
            Dictionary containing business KPIs.
        """
        # Get active subscriptions count by tier
        tier_counts = await self._get_subscriptions_by_tier(db)

        # Calculate MRR and ARR
        mrr = self._calculate_mrr(tier_counts)
        arr = mrr * 12

        # Get total active users
        total_users = sum(tier_counts.values())

        # Calculate ARPU (Average Revenue Per User)
        arpu = mrr / total_users if total_users > 0 else Decimal("0.00")

        # Get new users this month
        new_users_month = await self._get_new_users_count(db, days=30)

        # Get new users this week
        new_users_week = await self._get_new_users_count(db, days=7)

        return {
            "mrr": float(mrr),
            "arr": float(arr),
            "arpu": float(arpu),
            "total_users": total_users,
            "new_users_month": new_users_month,
            "new_users_week": new_users_week,
            "subscriptions_by_tier": {
                tier.value: count for tier, count in tier_counts.items()
            },
        }

    async def _get_technical_kpis(self, db: AsyncSession) -> dict[str, Any]:
        """Calculate technical KPIs.

        Args:
            db: Database session.

        Returns:
            Dictionary containing technical KPIs.
        """
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())

        # Queries today (inbound messages)
        queries_today = await self._get_message_count(
            db, direction=MessageDirectionEnum.inbound, since=today_start
        )

        # SMS sent today (outbound messages)
        sms_sent_today = await self._get_message_count(
            db, direction=MessageDirectionEnum.outbound, since=today_start
        )

        # Total queries this month
        month_start = today.replace(day=1)
        month_start_dt = datetime.combine(month_start, datetime.min.time())
        queries_month = await self._get_message_count(
            db, direction=MessageDirectionEnum.inbound, since=month_start_dt
        )

        # LLM costs today
        llm_costs_today = await self._get_llm_costs(db, since=today_start)

        # LLM costs this month
        llm_costs_month = await self._get_llm_costs(db, since=month_start_dt)

        # Average response time (last 24 hours)
        avg_response_time = await self._get_avg_response_time(
            db, since=today_start - timedelta(days=1)
        )

        # Total storage used (MB)
        total_storage_mb = await self._get_total_storage(db)

        # Total documents indexed
        total_documents = await self._get_document_count(db)

        return {
            "queries_today": queries_today,
            "sms_sent_today": sms_sent_today,
            "queries_month": queries_month,
            "llm_costs_today": float(llm_costs_today),
            "llm_costs_month": float(llm_costs_month),
            "avg_response_time_ms": avg_response_time,
            "total_storage_mb": float(total_storage_mb),
            "total_documents": total_documents,
        }

    async def _get_subscriptions_by_tier(
        self, db: AsyncSession
    ) -> dict[TierEnum, int]:
        """Get count of active subscriptions by tier.

        Args:
            db: Database session.

        Returns:
            Dictionary mapping tier to count.
        """
        result = await db.execute(
            select(Organization.tier, func.count(Organization.id))
            .group_by(Organization.tier)
        )

        tier_counts: dict[TierEnum, int] = dict.fromkeys(TierEnum, 0)
        for tier, count in result.all():
            tier_counts[tier] = count

        return tier_counts

    def _calculate_mrr(self, tier_counts: dict[TierEnum, int]) -> Decimal:
        """Calculate Monthly Recurring Revenue.

        Args:
            tier_counts: Dictionary mapping tier to user count.

        Returns:
            Total MRR.
        """
        mrr = Decimal("0.00")
        for tier, count in tier_counts.items():
            mrr += self.TIER_MONTHLY_PRICES.get(tier, Decimal("0.00")) * count
        return mrr

    async def _get_new_users_count(
        self, db: AsyncSession, days: int
    ) -> int:
        """Get count of new users in the specified time period.

        Args:
            db: Database session.
            days: Number of days to look back.

        Returns:
            Count of new users.
        """
        since = datetime.utcnow() - timedelta(days=days)
        result = await db.execute(
            select(func.count(Organization.id)).where(
                Organization.created_at >= since
            )
        )
        return result.scalar() or 0

    async def _get_message_count(
        self,
        db: AsyncSession,
        direction: MessageDirectionEnum | None = None,
        since: datetime | None = None,
    ) -> int:
        """Get count of messages with optional filters.

        Args:
            db: Database session.
            direction: Optional direction filter.
            since: Optional start date filter.

        Returns:
            Message count.
        """
        query = select(func.count(Message.id))

        if direction:
            query = query.where(Message.direction == direction)

        if since:
            query = query.where(Message.created_at >= since)

        result = await db.execute(query)
        return result.scalar() or 0

    async def _get_llm_costs(
        self, db: AsyncSession, since: datetime
    ) -> Decimal:
        """Get total LLM costs since a specific date.

        Args:
            db: Database session.
            since: Start date for cost calculation.

        Returns:
            Total LLM costs.
        """
        result = await db.execute(
            select(func.sum(Message.cost_euro)).where(
                Message.created_at >= since
            )
        )
        return result.scalar() or Decimal("0.00")

    async def _get_avg_response_time(
        self, db: AsyncSession, since: datetime
    ) -> int | None:
        """Get average response time in milliseconds.

        Args:
            db: Database session.
            since: Start date for calculation.

        Returns:
            Average response time in ms, or None if no data.
        """
        result = await db.execute(
            select(func.avg(Message.response_time_ms)).where(
                Message.created_at >= since,
                Message.response_time_ms.isnot(None),
            )
        )
        avg = result.scalar()
        return int(avg) if avg else None

    async def _get_total_storage(self, db: AsyncSession) -> Decimal:
        """Get total storage used across all organizations.

        Args:
            db: Database session.

        Returns:
            Total storage in MB.
        """
        result = await db.execute(
            select(func.sum(Document.file_size_bytes))
        )
        total_bytes = result.scalar() or 0
        return Decimal(total_bytes) / Decimal(1024 * 1024)

    async def _get_document_count(self, db: AsyncSession) -> int:
        """Get total count of documents.

        Args:
            db: Database session.

        Returns:
            Document count.
        """
        result = await db.execute(select(func.count(Document.id)))
        return result.scalar() or 0
