"""Admin authentication endpoints."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.admin.auth import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminLogoutResponse,
)
from app.core.exceptions import UnauthorizedException
from app.db.session import get_db
from app.models.admin import Admin
from app.services.admin.auth_service import AdminAuthError, AdminAuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin-auth"])

# HTTP Bearer token security scheme
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_admin(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> Admin:
    """Dependency to get the current authenticated admin.

    Args:
        credentials: HTTP Bearer token credentials.
        db: Database session.

    Returns:
        Authenticated admin.

    Raises:
        UnauthorizedException: If authentication fails.
    """
    if not credentials:
        raise UnauthorizedException(detail="Missing authentication token")

    auth_service = AdminAuthService()
    try:
        admin = await auth_service.validate_token(db, credentials.credentials)
        return admin
    except AdminAuthError as e:
        raise UnauthorizedException(detail=str(e)) from e


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    request: AdminLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> AdminLoginResponse:
    """Authenticate an admin and return a JWT token.

    Admin authentication is separate from regular user authentication.
    The admin account is created via migration seed from environment variables.
    """
    auth_service = AdminAuthService()

    try:
        admin, token = await auth_service.authenticate(
            db=db,
            email=request.email,
            password=request.password,
        )

        logger.info(f"Admin login successful: {admin.email}")

        return AdminLoginResponse(
            access_token=token,
            token_type="bearer",
            admin_id=admin.id,
            email=admin.email,
            last_login=admin.last_login,
        )

    except AdminAuthError as e:
        logger.warning(f"Admin login failed for email: {request.email}")
        raise UnauthorizedException(detail=str(e)) from e


@router.post("/logout", response_model=AdminLogoutResponse)
async def admin_logout(
    admin: Admin = Depends(get_current_admin),
) -> AdminLogoutResponse:
    """Log out the current admin.

    Note: Since we use stateless JWT tokens, this endpoint primarily serves
    as a confirmation that the token was valid. Client should discard the token.
    """
    logger.info(f"Admin logout: {admin.email}")
    return AdminLogoutResponse(message="Successfully logged out")
