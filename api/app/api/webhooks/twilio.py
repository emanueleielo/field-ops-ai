"""Twilio webhook handler for incoming SMS messages."""

import logging
from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Form,
    Header,
    HTTPException,
    Request,
    status,
)
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from twilio.request_validator import RequestValidator

from app.config import get_settings
from app.db.session import get_async_session_factory, get_db
from app.models.phone_number import PhoneNumber
from app.services.sms_handler import SMSHandler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/twilio", tags=["webhooks"])


async def validate_twilio_signature(
    request: Request,
    x_twilio_signature: Annotated[str | None, Header()] = None,
) -> bool:
    """Validate the Twilio request signature.

    Args:
        request: The incoming request.
        x_twilio_signature: The Twilio signature header.

    Returns:
        True if signature is valid, False otherwise.
    """
    settings = get_settings()

    # Skip validation in development if auth token not set
    if not settings.twilio_auth_token:
        if settings.environment == "development":
            logger.warning("Twilio signature validation skipped (dev mode)")
            return True
        return False

    if not x_twilio_signature:
        logger.warning("Missing X-Twilio-Signature header")
        return False

    # Get the full URL
    url = str(request.url)

    # Get form data
    form_data = await request.form()
    params = {key: str(value) for key, value in form_data.items()}

    # Validate signature
    validator = RequestValidator(settings.twilio_auth_token)
    is_valid: bool = validator.validate(url, params, x_twilio_signature)

    if not is_valid:
        logger.warning("Invalid Twilio signature for URL: %s", url)

    return is_valid


async def process_sms_background(
    from_number: str,
    body: str,
    org_id: str,
    language: str,
) -> None:
    """Process SMS in background task.

    This function creates its own database session to avoid
    issues with session scope in background tasks.

    Args:
        from_number: The sender's phone number.
        body: The message body.
        org_id: The organization ID (as string).
        language: The user's language preference.
    """
    logger.info("Background processing SMS from=%s", from_number)

    session_factory = get_async_session_factory()
    async with session_factory() as db:
        try:
            handler = SMSHandler(db)
            await handler.handle_incoming(
                from_number=from_number,
                body=body,
                org_id=UUID(org_id),
                language=language,
            )
            await db.commit()
        except Exception as e:
            logger.exception("Background SMS processing failed: %s", e)
            await db.rollback()


@router.post(
    "/sms",
    status_code=status.HTTP_200_OK,
    response_class=Response,
    summary="Twilio SMS Webhook",
    description="Receives incoming SMS messages from Twilio and processes them.",
)
async def twilio_sms_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    from_: Annotated[str, Form(alias="From")] = "",
    to: Annotated[str, Form(alias="To")] = "",
    body: Annotated[str, Form(alias="Body")] = "",
    message_sid: Annotated[str, Form(alias="MessageSid")] = "",
    x_twilio_signature: Annotated[str | None, Header()] = None,
) -> Response:
    """Handle incoming SMS webhook from Twilio.

    This endpoint:
    1. Validates the Twilio signature
    2. Looks up the sender's phone number in the database
    3. If registered, processes the message in background
    4. Returns 200 immediately to acknowledge receipt

    Note: Twilio expects a 200 response within a few seconds.
    Processing is done in the background.

    Args:
        request: The incoming request.
        background_tasks: FastAPI background tasks.
        db: Database session.
        from_: The sender's phone number.
        to: The recipient phone number (our Twilio number).
        body: The SMS message body.
        message_sid: The unique Twilio message SID.
        x_twilio_signature: The Twilio signature for validation.

    Returns:
        Empty 200 response with TwiML content type.
    """
    logger.info(
        "Received SMS webhook: from=%s, to=%s, sid=%s, body_length=%d",
        from_,
        to,
        message_sid,
        len(body) if body else 0,
    )

    # Validate Twilio signature
    is_valid = await validate_twilio_signature(request, x_twilio_signature)
    if not is_valid:
        logger.warning("Invalid Twilio signature, rejecting request")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Twilio signature",
        )

    # Look up phone number in database
    result = await db.execute(
        select(PhoneNumber).where(
            PhoneNumber.phone_number == from_,
            PhoneNumber.is_active.is_(True),
        )
    )
    phone_record = result.scalar_one_or_none()

    if not phone_record:
        # Phone number not registered, ignore silently
        logger.info("Unregistered phone number: %s, ignoring", from_)
        return Response(
            content="",
            media_type="text/xml",
            status_code=status.HTTP_200_OK,
        )

    # Get organization info
    org_id = str(phone_record.organization_id)
    language = phone_record.language or "en"

    logger.info(
        "Phone number registered: from=%s, org=%s, language=%s",
        from_,
        org_id,
        language,
    )

    # Process in background
    background_tasks.add_task(
        process_sms_background,
        from_number=from_,
        body=body,
        org_id=org_id,
        language=language,
    )

    # Return empty TwiML response immediately
    # We don't use TwiML <Message> because we send via API
    return Response(
        content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        media_type="text/xml",
        status_code=status.HTTP_200_OK,
    )


@router.post(
    "/sms/status",
    status_code=status.HTTP_200_OK,
    response_class=Response,
    summary="Twilio SMS Status Callback",
    description="Receives SMS delivery status updates from Twilio.",
)
async def twilio_sms_status_callback(
    request: Request,
    message_sid: Annotated[str, Form(alias="MessageSid")] = "",
    message_status: Annotated[str, Form(alias="MessageStatus")] = "",
    to: Annotated[str, Form(alias="To")] = "",
    error_code: Annotated[str | None, Form(alias="ErrorCode")] = None,
    error_message: Annotated[str | None, Form(alias="ErrorMessage")] = None,
    x_twilio_signature: Annotated[str | None, Header()] = None,
) -> Response:
    """Handle SMS status callback from Twilio.

    This endpoint receives delivery status updates for sent messages.
    Currently just logs the status, but can be extended to track
    delivery status in the database.

    Args:
        request: The incoming request.
        message_sid: The unique Twilio message SID.
        message_status: The message status (sent, delivered, failed, etc.).
        to: The recipient phone number.
        error_code: Optional Twilio error code.
        error_message: Optional error message.
        x_twilio_signature: The Twilio signature for validation.

    Returns:
        Empty 200 response.
    """
    # Validate Twilio signature
    is_valid = await validate_twilio_signature(request, x_twilio_signature)
    if not is_valid:
        logger.warning("Invalid Twilio signature on status callback")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Twilio signature",
        )

    # Log the status update
    if error_code:
        logger.warning(
            "SMS delivery failed: sid=%s, status=%s, to=%s, "
            "error_code=%s, error_message=%s",
            message_sid,
            message_status,
            to,
            error_code,
            error_message,
        )
    else:
        logger.info(
            "SMS status update: sid=%s, status=%s, to=%s",
            message_sid,
            message_status,
            to,
        )

    return Response(
        content="",
        media_type="text/plain",
        status_code=status.HTTP_200_OK,
    )
