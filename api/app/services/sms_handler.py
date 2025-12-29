"""SMS handler service for processing incoming SMS messages."""

import logging
import time
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import MessageDirectionEnum
from app.models.message import Message
from app.services.agent import RAGAgent
from app.services.conversation import ConversationService
from app.services.quota import (
    NOTIFICATION_THRESHOLDS,
    QuotaService,
    QuotaStatus,
)
from app.services.sms import SMSService, SMSServiceError, get_sms_service

logger = logging.getLogger(__name__)


class SMSHandlerError(Exception):
    """Exception raised for SMS handler errors."""


class SMSHandler:
    """Handler for processing incoming SMS messages and generating responses."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the SMS handler.

        Args:
            db: The database session.
        """
        self.db = db
        self._conversation_service = ConversationService(db)
        self._quota_service = QuotaService(db)
        self._sms_service: SMSService | None = None

    def _get_sms_service(self) -> SMSService:
        """Get the SMS service, initializing if needed.

        Returns:
            The SMS service instance.
        """
        if self._sms_service is None:
            self._sms_service = get_sms_service()
        return self._sms_service

    async def handle_incoming(
        self,
        from_number: str,
        body: str,
        org_id: UUID,
        language: str = "en",
    ) -> None:
        """Handle an incoming SMS message.

        This method:
        1. Validates the message
        2. Checks quota and burst limits
        3. Gets conversation history
        4. Invokes the RAG agent
        5. Saves the message exchange
        6. Sends the response via SMS

        Args:
            from_number: The sender's phone number.
            body: The message body.
            org_id: The organization ID.
            language: The user's language preference.

        Raises:
            SMSHandlerError: If processing fails.
        """
        start_time = time.time()

        logger.info(
            "Processing incoming SMS from=%s, org=%s, body_length=%d",
            from_number,
            org_id,
            len(body) if body else 0,
        )

        try:
            # Handle empty messages
            if not body or not body.strip():
                await self._send_error_response(
                    to=from_number,
                    error_type="empty_message",
                    language=language,
                )
                return

            # Check quota and burst limits
            can_process, error_type = await self._quota_service.can_process_query(
                org_id
            )

            if not can_process and error_type:
                await self._send_error_response(
                    to=from_number,
                    error_type=error_type,
                    language=language,
                )
                # Still log the inbound message
                await self._save_message(
                    org_id=org_id,
                    phone_number=from_number,
                    direction=MessageDirectionEnum.inbound,
                    content=body.strip(),
                    tokens_in=0,
                    tokens_out=0,
                    model_used=None,
                    cost_euro=Decimal("0"),
                    response_time_ms=None,
                )
                return

            # Get conversation history
            conversation_history = await self._conversation_service.get_history(
                phone_number=from_number
            )

            # Create and invoke RAG agent
            agent = RAGAgent(org_id=org_id)
            response = await agent.invoke(
                query=body.strip(),
                conversation_history=conversation_history,
            )

            # Calculate response time
            response_time_ms = int((time.time() - start_time) * 1000)

            # Consume quota
            quota_status = await self._quota_service.consume_quota(
                org_id=org_id,
                cost_euro=response.cost_euro,
            )

            # Build response message with possible warning
            response_text = response.answer

            # Handle quota notifications for 90%, 100%, 110% thresholds
            await self._handle_quota_notifications(
                org_id=org_id,
                quota_status=quota_status,
            )

            # Add warning to response if approaching or at quota limit
            warning = self._quota_service.get_warning_message(
                quota_status=quota_status,
                lang=language,
            )
            if warning:
                response_text += warning

            # Save messages to database
            await self._save_message(
                org_id=org_id,
                phone_number=from_number,
                direction=MessageDirectionEnum.inbound,
                content=body.strip(),
                tokens_in=response.tokens_input,
                tokens_out=0,
                model_used=response.model_used,
                cost_euro=Decimal(str(response.cost_euro)),
                response_time_ms=response_time_ms,
            )

            await self._save_message(
                org_id=org_id,
                phone_number=from_number,
                direction=MessageDirectionEnum.outbound,
                content=response_text,
                tokens_in=0,
                tokens_out=response.tokens_output,
                model_used=response.model_used,
                cost_euro=Decimal("0"),  # Cost attributed to inbound
                response_time_ms=None,
            )

            # Update conversation history
            await self._conversation_service.add_exchange(
                phone_number=from_number,
                organization_id=org_id,
                user_message=body.strip(),
                assistant_message=response.answer,  # Store without warning
            )

            # Send SMS response
            await self._send_response(
                to=from_number,
                body=response_text,
            )

            logger.info(
                "SMS processed successfully: from=%s, org=%s, "
                "model=%s, cost=%.4f EUR, response_time=%dms",
                from_number,
                org_id,
                response.model_used,
                response.cost_euro,
                response_time_ms,
            )

        except SMSServiceError as e:
            logger.exception("SMS service error: %s", e)
            raise SMSHandlerError(f"Failed to send SMS: {e}") from e

        except Exception as e:
            logger.exception("Error processing SMS: %s", e)
            # Try to send error response
            try:
                await self._send_error_response(
                    to=from_number,
                    error_type="processing_error",
                    language=language,
                )
            except Exception:
                logger.exception("Failed to send error response")
            raise SMSHandlerError(f"Failed to process SMS: {e}") from e

    async def _save_message(
        self,
        org_id: UUID,
        phone_number: str,
        direction: MessageDirectionEnum,
        content: str,
        tokens_in: int,
        tokens_out: int,
        model_used: str | None,
        cost_euro: Decimal,
        response_time_ms: int | None,
    ) -> Message:
        """Save a message to the database.

        Args:
            org_id: Organization ID.
            phone_number: The phone number.
            direction: Message direction (inbound/outbound).
            content: Message content.
            tokens_in: Input tokens used.
            tokens_out: Output tokens used.
            model_used: The LLM model used.
            cost_euro: The cost in euros.
            response_time_ms: Response time in milliseconds.

        Returns:
            The saved Message object.
        """
        message = Message(
            id=uuid4(),
            organization_id=org_id,
            phone_number=phone_number,
            direction=direction,
            content=content,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            model_used=model_used,
            cost_euro=cost_euro,
            response_time_ms=response_time_ms,
        )

        self.db.add(message)
        await self.db.flush()

        return message

    async def _send_response(
        self,
        to: str,
        body: str,
    ) -> list[str]:
        """Send an SMS response.

        Args:
            to: The recipient phone number.
            body: The message body.

        Returns:
            List of Twilio message SIDs.
        """
        sms_service = self._get_sms_service()
        return await sms_service.send_sms(to=to, body=body)

    async def _send_error_response(
        self,
        to: str,
        error_type: str,
        language: str = "en",
    ) -> list[str]:
        """Send an error response via SMS.

        Args:
            to: The recipient phone number.
            error_type: The type of error.
            language: The user's language preference.

        Returns:
            List of Twilio message SIDs.
        """
        error_message = self._quota_service.get_error_message(
            error_type=error_type,
            lang=language,
        )
        return await self._send_response(to=to, body=error_message)

    async def _handle_quota_notifications(
        self,
        org_id: UUID,
        quota_status: QuotaStatus,
    ) -> None:
        """Handle quota notification tracking for threshold crossings.

        Records when quota thresholds (90%, 100%, 110%) are crossed
        to ensure one-time notifications are sent correctly.

        Args:
            org_id: The organization ID.
            quota_status: The current quota status.
        """
        # Check each threshold and record if crossed for the first time
        for threshold in NOTIFICATION_THRESHOLDS:
            if quota_status.usage_percentage >= threshold:
                should_notify = await self._quota_service.should_notify(
                    org_id=org_id,
                    threshold=threshold,
                )
                if should_notify:
                    await self._quota_service.record_notification(
                        org_id=org_id,
                        threshold=threshold,
                    )
                    logger.info(
                        "Recorded quota notification for org=%s at %d%% threshold",
                        org_id,
                        threshold,
                    )
