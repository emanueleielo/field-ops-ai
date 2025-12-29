"""Admin user management endpoints."""

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.admin.auth import get_current_admin
from app.api.v1.schemas.admin.users import (
    DocumentSummary,
    ImpersonateResponse,
    PaginationMeta,
    PhoneNumberInfo,
    QuotaInfo,
    UserDeleteResponse,
    UserDetailResponse,
    UserListItem,
    UserListResponse,
    UserUpdateRequest,
    UserUpdateResponse,
)
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.admin import Admin
from app.models.enums import TierEnum
from app.services.admin.user_service import UserNotFoundError, UserService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/users", tags=["admin-users"])

# HTTP Bearer token security scheme
bearer_scheme = HTTPBearer(auto_error=False)


@router.get("", response_model=UserListResponse)
async def list_users(
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    limit: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    search: Annotated[str | None, Query(description="Search by name or email")] = None,
    tier: Annotated[
        TierEnum | None, Query(description="Filter by subscription tier")
    ] = None,
) -> UserListResponse:
    """List all users with pagination, search, and filtering.

    Returns a paginated list of users with summary information.

    Requires admin authentication.
    """
    user_service = UserService()
    result = await user_service.list_users(
        db=db,
        page=page,
        limit=limit,
        search=search,
        tier_filter=tier,
    )

    return UserListResponse(
        users=[UserListItem(**user) for user in result["users"]],
        meta=PaginationMeta(**result["meta"]),
    )


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> UserDetailResponse:
    """Get detailed information about a specific user.

    Returns user details including organization info, quota,
    phone numbers, and documents.

    Requires admin authentication.
    """
    user_service = UserService()

    try:
        result = await user_service.get_user_detail(db=db, user_id=user_id)
    except UserNotFoundError as e:
        raise NotFoundException(detail=str(e)) from e

    return UserDetailResponse(
        id=result["id"],
        email=result["email"],
        name=result["name"],
        tier=result["tier"],
        is_active=result["is_active"],
        quota=QuotaInfo(**result["quota"]),
        billing_day=result["billing_day"],
        stripe_customer_id=result["stripe_customer_id"],
        stripe_subscription_id=result["stripe_subscription_id"],
        phone_numbers=[PhoneNumberInfo(**pn) for pn in result["phone_numbers"]],
        documents=[DocumentSummary(**doc) for doc in result["documents"]],
        documents_count=result["documents_count"],
        messages_count=result["messages_count"],
        created_at=result["created_at"],
        updated_at=result["updated_at"],
    )


@router.patch("/{user_id}", response_model=UserUpdateResponse)
async def update_user(
    user_id: UUID,
    request: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> UserUpdateResponse:
    """Update user information.

    Allows updating tier, quota limit, active status, and name.

    Requires admin authentication.
    """
    user_service = UserService()

    try:
        result = await user_service.update_user(
            db=db,
            user_id=user_id,
            tier=request.tier,
            quota_limit_euro=request.quota_limit_euro,
            is_active=request.is_active,
            name=request.name,
        )
    except UserNotFoundError as e:
        raise NotFoundException(detail=str(e)) from e

    return UserUpdateResponse(
        id=result["id"],
        tier=result["tier"],
        quota_limit_euro=result["quota_limit_euro"],
        is_active=result["is_active"],
        name=result["name"],
        updated_at=result["updated_at"],
    )


@router.delete("/{user_id}", response_model=UserDeleteResponse)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> UserDeleteResponse:
    """Delete a user and all associated data.

    This is a destructive operation that removes:
    - All documents and their files
    - All vector embeddings
    - All messages
    - All conversation states
    - All activity logs
    - All phone numbers
    - The organization itself

    This action cannot be undone.

    Requires admin authentication.
    """
    user_service = UserService()

    try:
        result = await user_service.delete_user(db=db, user_id=user_id)
    except UserNotFoundError as e:
        raise NotFoundException(detail=str(e)) from e

    logger.warning(f"Admin deleted user {user_id}")

    return UserDeleteResponse(
        id=result["id"],
        email=result["email"],
        message=result["message"],
        deleted_documents=result["deleted_documents"],
        deleted_messages=result["deleted_messages"],
    )


@router.post("/{user_id}/impersonate", response_model=ImpersonateResponse)
async def impersonate_user(
    user_id: UUID,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> ImpersonateResponse:
    """Start an impersonation session for a user.

    Creates a temporary JWT token that allows the admin to view
    the user's dashboard as if logged in as that user.

    The response includes:
    - access_token: JWT token for the user session
    - admin_token: Original admin token to restore the admin session
    - session_id: ID to track the impersonation session

    The impersonation token expires after 2 hours.

    Requires admin authentication.
    """
    user_service = UserService()

    # Get the original admin token for session restoration
    admin_token = credentials.credentials if credentials else ""

    try:
        result = await user_service.impersonate_user(
            db=db,
            admin_id=admin.id,
            user_id=user_id,
            admin_token=admin_token,
        )
    except UserNotFoundError as e:
        raise NotFoundException(detail=str(e)) from e

    logger.info(f"Admin {admin.email} started impersonating user {user_id}")

    return ImpersonateResponse(
        access_token=result["access_token"],
        token_type=result["token_type"],
        user_id=result["user_id"],
        user_email=result["user_email"],
        admin_token=result["admin_token"],
        session_id=result["session_id"],
        expires_at=result["expires_at"],
    )
