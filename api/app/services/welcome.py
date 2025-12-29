"""Welcome SMS service for sending onboarding messages to new phone numbers."""

import logging
from typing import Literal

from app.services.sms import SMSService, SMSServiceError, get_sms_service

logger = logging.getLogger(__name__)

# Supported languages for welcome messages
SupportedLanguage = Literal["en", "de", "fr", "it", "es"]

# Welcome messages in supported languages
# These messages comply with GSM-7 encoding and are under 160 chars
WELCOME_MESSAGES: dict[str, str] = {
    "en": (
        "Welcome to FieldOps AI! Send your technical questions and I'll search "
        "your manuals. Reply HELP for commands. Note: AI responses - verify before use."
    ),
    "de": (
        "Willkommen bei FieldOps AI! Senden Sie Ihre technischen Fragen und ich "
        "durchsuche Ihre Handbuecher. Antworten Sie HELP fuer Befehle. "
        "Hinweis: KI-Antworten - vor Verwendung pruefen."
    ),
    "fr": (
        "Bienvenue sur FieldOps AI! Envoyez vos questions techniques et je "
        "chercherai dans vos manuels. Repondez HELP pour les commandes. "
        "Note: reponses IA - verifiez avant utilisation."
    ),
    "it": (
        "Benvenuto in FieldOps AI! Invia le tue domande tecniche e cerchero "
        "nei tuoi manuali. Rispondi HELP per i comandi. "
        "Nota: risposte AI - verifica prima dell'uso."
    ),
    "es": (
        "Bienvenido a FieldOps AI! Envia tus preguntas tecnicas y buscare "
        "en tus manuales. Responde HELP para comandos. "
        "Nota: respuestas IA - verifica antes de usar."
    ),
}

# Default language if not supported
DEFAULT_LANGUAGE: SupportedLanguage = "en"


class WelcomeServiceError(Exception):
    """Exception raised for welcome service errors."""


class WelcomeService:
    """Service for sending welcome SMS messages to new phone numbers."""

    def __init__(self, sms_service: SMSService | None = None) -> None:
        """Initialize the welcome service.

        Args:
            sms_service: Optional SMS service instance. If not provided,
                         the singleton instance will be used.
        """
        self._sms_service = sms_service

    def _get_sms_service(self) -> SMSService:
        """Get the SMS service, initializing if needed.

        Returns:
            The SMS service instance.
        """
        if self._sms_service is None:
            self._sms_service = get_sms_service()
        return self._sms_service

    def get_welcome_message(self, lang: str = DEFAULT_LANGUAGE) -> str:
        """Get the welcome message in the specified language.

        Args:
            lang: Language code (en, de, fr, it, es). Defaults to 'en'.

        Returns:
            Welcome message in the specified language.
        """
        # Normalize language code
        lang_lower = lang.lower()[:2] if lang else DEFAULT_LANGUAGE

        # Return message in requested language or fall back to English
        return WELCOME_MESSAGES.get(lang_lower, WELCOME_MESSAGES[DEFAULT_LANGUAGE])

    async def send_welcome_sms(
        self,
        phone_number: str,
        lang: str = DEFAULT_LANGUAGE,
    ) -> list[str]:
        """Send a welcome SMS to a newly registered phone number.

        Args:
            phone_number: The recipient phone number in E.164 format.
            lang: Language code (en, de, fr, it, es). Defaults to 'en'.

        Returns:
            List of Twilio message SIDs.

        Raises:
            WelcomeServiceError: If sending fails.
        """
        try:
            welcome_message = self.get_welcome_message(lang)

            logger.info(
                "Sending welcome SMS to %s in language '%s'",
                phone_number,
                lang,
            )

            sms_service = self._get_sms_service()
            message_sids = await sms_service.send_sms(
                to=phone_number,
                body=welcome_message,
            )

            logger.info(
                "Welcome SMS sent successfully to %s, SIDs: %s",
                phone_number,
                message_sids,
            )

            return message_sids

        except SMSServiceError as e:
            logger.exception("Failed to send welcome SMS to %s: %s", phone_number, e)
            raise WelcomeServiceError(f"Failed to send welcome SMS: {e}") from e

        except Exception as e:
            logger.exception("Unexpected error sending welcome SMS: %s", e)
            raise WelcomeServiceError(f"Unexpected error: {e}") from e


def get_welcome_service() -> WelcomeService:
    """Get a WelcomeService instance.

    Returns:
        A new WelcomeService instance.
    """
    return WelcomeService()
