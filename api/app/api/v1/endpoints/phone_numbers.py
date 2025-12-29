"""Phone number management endpoints."""

import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.phone_number import (
    PhoneNumberCreate,
    PhoneNumberCreateResponse,
    PhoneNumberDeleteResponse,
    PhoneNumberListResponse,
    PhoneNumberResponse,
    PhoneNumberUpdate,
)
from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
from app.db.session import get_db
from app.models.organization import Organization
from app.models.phone_number import PhoneNumber
from app.services.welcome import WelcomeService, WelcomeServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/phone-numbers", tags=["phone-numbers"])


# Phone number limits per tier
TIER_PHONE_LIMITS = {
    "basic": 1,
    "professional": 1,
    "enterprise": 5,
}


# TODO: Replace with actual auth dependency once auth is implemented
async def get_current_org_id() -> UUID:
    """Temporary dependency to get organization ID.

    This should be replaced with actual authentication that extracts
    the organization ID from the authenticated user's session.
    """
    # Placeholder: return a fixed UUID for development
    # In production, this will come from Supabase Auth
    return UUID("00000000-0000-0000-0000-000000000001")


async def send_welcome_sms_background(
    phone_number: str,
    language: str,
) -> None:
    """Send welcome SMS in background task.

    Args:
        phone_number: The phone number to send to.
        language: The language preference.
    """
    logger.info("Sending welcome SMS in background to %s", phone_number)

    try:
        welcome_service = WelcomeService()
        await welcome_service.send_welcome_sms(
            phone_number=phone_number,
            lang=language,
        )
    except WelcomeServiceError as e:
        logger.exception("Failed to send welcome SMS in background: %s", e)
    except Exception as e:
        logger.exception("Unexpected error sending welcome SMS: %s", e)


@router.post("", response_model=PhoneNumberCreateResponse)
async def create_phone_number(
    data: PhoneNumberCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> PhoneNumberCreateResponse:
    """Register a new phone number for SMS communications.

    This endpoint:
    1. Validates the phone number format (E.164)
    2. Checks if the organization can add more phone numbers (tier limit)
    3. Creates the phone number record
    4. Sends a welcome SMS (optional, enabled by default)

    Args:
        data: Phone number creation data.
        background_tasks: FastAPI background tasks.
        db: Database session.
        org_id: Organization ID from auth.

    Returns:
        PhoneNumberCreateResponse with the created phone number details.
    """
    # Get organization for tier limits
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    organization = result.scalar_one_or_none()
    if not organization:
        raise NotFoundException(detail="Organization not found")

    # Check tier limit for phone numbers
    tier_limit = TIER_PHONE_LIMITS.get(organization.tier.value, 1)

    count_result = await db.execute(
        select(func.count(PhoneNumber.id)).where(
            PhoneNumber.organization_id == org_id,
            PhoneNumber.is_active.is_(True),
        )
    )
    current_count = count_result.scalar() or 0

    if current_count >= tier_limit:
        raise ForbiddenException(
            detail=f"Phone number limit reached for {organization.tier.value} tier. "
            f"Maximum allowed: {tier_limit}. Current: {current_count}. "
            f"Upgrade your plan to add more phone numbers."
        )

    # Check if phone number already exists (for any organization)
    existing_result = await db.execute(
        select(PhoneNumber).where(PhoneNumber.phone_number == data.phone_number)
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        if existing.organization_id == org_id:
            raise ConflictException(
                detail="This phone number is already registered to your organization."
            )
        raise ConflictException(
            detail="This phone number is registered to another organization."
        )

    # Create phone number record
    phone_record = PhoneNumber(
        id=uuid4(),
        organization_id=org_id,
        phone_number=data.phone_number,
        label=data.label,
        language=data.language,
        is_active=True,
    )
    db.add(phone_record)
    await db.commit()
    await db.refresh(phone_record)

    logger.info(
        "Phone number created: %s for org %s with language %s",
        data.phone_number,
        org_id,
        data.language,
    )

    # Send welcome SMS in background if requested
    welcome_sms_sent = False
    if data.send_welcome_sms:
        background_tasks.add_task(
            send_welcome_sms_background,
            phone_number=data.phone_number,
            language=data.language,
        )
        welcome_sms_sent = True
        logger.info("Welcome SMS scheduled for %s", data.phone_number)

    return PhoneNumberCreateResponse(
        id=phone_record.id,
        phone_number=phone_record.phone_number,
        label=phone_record.label,
        language=phone_record.language,
        is_active=phone_record.is_active,
        welcome_sms_sent=welcome_sms_sent,
        message="Phone number registered successfully."
        + (" Welcome SMS will be sent shortly." if welcome_sms_sent else ""),
    )


@router.get("", response_model=PhoneNumberListResponse)
async def list_phone_numbers(
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
    include_inactive: bool = Query(
        default=False,
        description="Include inactive phone numbers",
    ),
) -> PhoneNumberListResponse:
    """List all phone numbers for the organization.

    Args:
        db: Database session.
        org_id: Organization ID from auth.
        include_inactive: Whether to include inactive phone numbers.

    Returns:
        PhoneNumberListResponse with list of phone numbers.
    """
    query = select(PhoneNumber).where(PhoneNumber.organization_id == org_id)

    if not include_inactive:
        query = query.where(PhoneNumber.is_active.is_(True))

    query = query.order_by(PhoneNumber.created_at.desc())

    result = await db.execute(query)
    phone_numbers = result.scalars().all()

    return PhoneNumberListResponse(
        data=[PhoneNumberResponse.model_validate(p) for p in phone_numbers],
        total=len(phone_numbers),
    )


@router.get("/{phone_id}", response_model=PhoneNumberResponse)
async def get_phone_number(
    phone_id: UUID,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> PhoneNumberResponse:
    """Get a specific phone number by ID.

    Args:
        phone_id: Phone number ID.
        db: Database session.
        org_id: Organization ID from auth.

    Returns:
        PhoneNumberResponse with phone number details.
    """
    result = await db.execute(
        select(PhoneNumber).where(
            PhoneNumber.id == phone_id,
            PhoneNumber.organization_id == org_id,
        )
    )
    phone_record = result.scalar_one_or_none()

    if not phone_record:
        raise NotFoundException(detail="Phone number not found")

    return PhoneNumberResponse.model_validate(phone_record)


@router.patch("/{phone_id}", response_model=PhoneNumberResponse)
async def update_phone_number(
    phone_id: UUID,
    data: PhoneNumberUpdate,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> PhoneNumberResponse:
    """Update a phone number's settings.

    Args:
        phone_id: Phone number ID.
        data: Update data.
        db: Database session.
        org_id: Organization ID from auth.

    Returns:
        PhoneNumberResponse with updated phone number details.
    """
    result = await db.execute(
        select(PhoneNumber).where(
            PhoneNumber.id == phone_id,
            PhoneNumber.organization_id == org_id,
        )
    )
    phone_record = result.scalar_one_or_none()

    if not phone_record:
        raise NotFoundException(detail="Phone number not found")

    # Update fields if provided
    if data.label is not None:
        phone_record.label = data.label
    if data.language is not None:
        phone_record.language = data.language
    if data.is_active is not None:
        phone_record.is_active = data.is_active

    await db.commit()
    await db.refresh(phone_record)

    logger.info("Phone number updated: %s", phone_id)

    return PhoneNumberResponse.model_validate(phone_record)


@router.delete("/{phone_id}", response_model=PhoneNumberDeleteResponse)
async def delete_phone_number(
    phone_id: UUID,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> PhoneNumberDeleteResponse:
    """Delete a phone number.

    Note: This permanently removes the phone number. To temporarily
    disable it, use PATCH to set is_active=false instead.

    Args:
        phone_id: Phone number ID.
        db: Database session.
        org_id: Organization ID from auth.

    Returns:
        PhoneNumberDeleteResponse confirming deletion.
    """
    result = await db.execute(
        select(PhoneNumber).where(
            PhoneNumber.id == phone_id,
            PhoneNumber.organization_id == org_id,
        )
    )
    phone_record = result.scalar_one_or_none()

    if not phone_record:
        raise NotFoundException(detail="Phone number not found")

    phone_number_value = phone_record.phone_number

    await db.delete(phone_record)
    await db.commit()

    logger.info("Phone number deleted: %s (%s)", phone_id, phone_number_value)

    return PhoneNumberDeleteResponse(
        id=phone_id,
        message="Phone number deleted successfully",
    )


@router.post("/{phone_id}/resend-welcome", response_model=dict)
async def resend_welcome_sms(
    phone_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> dict[str, str]:
    """Resend the welcome SMS to a phone number.

    Args:
        phone_id: Phone number ID.
        background_tasks: FastAPI background tasks.
        db: Database session.
        org_id: Organization ID from auth.

    Returns:
        Confirmation message.
    """
    result = await db.execute(
        select(PhoneNumber).where(
            PhoneNumber.id == phone_id,
            PhoneNumber.organization_id == org_id,
        )
    )
    phone_record = result.scalar_one_or_none()

    if not phone_record:
        raise NotFoundException(detail="Phone number not found")

    if not phone_record.is_active:
        raise ValidationException(
            detail="Cannot send welcome SMS to inactive phone number"
        )

    # Send welcome SMS in background
    background_tasks.add_task(
        send_welcome_sms_background,
        phone_number=phone_record.phone_number,
        language=phone_record.language,
    )

    logger.info("Welcome SMS resend scheduled for %s", phone_record.phone_number)

    return {
        "message": "Welcome SMS will be sent shortly",
        "phone_number": phone_record.phone_number,
    }
