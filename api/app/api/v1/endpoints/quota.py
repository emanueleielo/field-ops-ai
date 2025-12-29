"""Quota management endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.quota import QuotaStatusResponse
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.services.quota import MAX_QUERIES_PER_HOUR, QuotaService, QuotaServiceError

router = APIRouter(prefix="/quota", tags=["quota"])


# TODO: Replace with actual auth dependency once auth is implemented
async def get_current_org_id() -> UUID:
    """Temporary dependency to get organization ID.

    This should be replaced with actual authentication that extracts
    the organization ID from the authenticated user's session.
    """
    # Placeholder: return a fixed UUID for development
    # In production, this will come from Supabase Auth
    return UUID("00000000-0000-0000-0000-000000000001")


@router.get("", response_model=QuotaStatusResponse)
async def get_quota_status(
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> QuotaStatusResponse:
    """Get current quota status for the organization.

    Returns comprehensive quota information including:
    - Current usage and limits in EUR
    - Usage percentage
    - Burst protection status (50 queries/hour)
    - Next reset date based on billing cycle
    """
    quota_service = QuotaService(db)

    try:
        status = await quota_service.check_quota(org_id)
    except QuotaServiceError as e:
        raise NotFoundException(detail=str(e)) from e

    return QuotaStatusResponse(
        quota_limit_euro=status.quota_limit_euro,
        quota_used_euro=status.quota_used_euro,
        quota_remaining_euro=status.quota_remaining_euro,
        usage_percentage=status.usage_percentage,
        is_exceeded=status.is_exceeded,
        is_near_limit=status.is_near_limit,
        is_hard_blocked=status.is_hard_blocked,
        queries_this_hour=status.queries_this_hour,
        burst_limit=MAX_QUERIES_PER_HOUR,
        burst_limit_exceeded=status.burst_limit_exceeded,
        reset_date=status.reset_date,
    )
