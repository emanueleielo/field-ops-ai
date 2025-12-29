"""Authentication utilities for Supabase JWT validation."""

from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

# HTTP Bearer scheme for JWT tokens
security = HTTPBearer(auto_error=False)


class AuthenticationError(Exception):
    """Exception raised for authentication failures."""


@dataclass
class CurrentUser:
    """Authenticated user data extracted from Supabase JWT."""

    id: UUID
    email: str
    role: str | None = None
    organization_id: UUID | None = None


def decode_supabase_jwt(token: str) -> dict:
    """Decode and validate a Supabase JWT token.

    Args:
        token: JWT token string.

    Returns:
        Decoded JWT payload.

    Raises:
        AuthenticationError: If token is invalid or expired.
    """
    settings = get_settings()

    if not settings.supabase_jwt_secret:
        raise AuthenticationError("SUPABASE_JWT_SECRET is not configured")

    try:
        # Supabase uses HS256 algorithm
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        raise AuthenticationError("Token has expired") from e
    except jwt.InvalidTokenError as e:
        raise AuthenticationError(f"Invalid token: {e}") from e


def get_current_user_from_token(token: str) -> CurrentUser:
    """Extract current user from JWT token.

    Args:
        token: JWT token string.

    Returns:
        CurrentUser with user data from token.

    Raises:
        AuthenticationError: If token is invalid or missing required claims.
    """
    payload = decode_supabase_jwt(token)

    # Extract user ID (sub claim in Supabase JWT)
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Token missing user ID (sub)")

    # Extract email
    email = payload.get("email")
    if not email:
        raise AuthenticationError("Token missing email")

    # Extract role (from user_metadata or app_metadata)
    user_metadata = payload.get("user_metadata", {})
    app_metadata = payload.get("app_metadata", {})
    role = app_metadata.get("role") or user_metadata.get("role")

    # Extract organization_id from metadata
    org_id_str = (
        app_metadata.get("organization_id")
        or user_metadata.get("organization_id")
    )
    organization_id = UUID(org_id_str) if org_id_str else None

    return CurrentUser(
        id=UUID(user_id),
        email=email,
        role=role,
        organization_id=organization_id,
    )


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ],
) -> CurrentUser:
    """FastAPI dependency to get current authenticated user.

    Args:
        credentials: HTTP Bearer credentials from request.

    Returns:
        CurrentUser extracted from valid JWT.

    Raises:
        HTTPException: 401 if not authenticated or token invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return get_current_user_from_token(credentials.credentials)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_optional_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ],
) -> CurrentUser | None:
    """FastAPI dependency to optionally get current user.

    Returns None if no credentials provided, raises exception if
    credentials are provided but invalid.

    Args:
        credentials: HTTP Bearer credentials from request.

    Returns:
        CurrentUser if authenticated, None if no credentials.

    Raises:
        HTTPException: 401 if credentials provided but invalid.
    """
    if not credentials:
        return None

    try:
        return get_current_user_from_token(credentials.credentials)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


def require_organization(user: CurrentUser) -> UUID:
    """Require user to have an organization.

    Args:
        user: Current authenticated user.

    Returns:
        Organization ID.

    Raises:
        HTTPException: 403 if user has no organization.
    """
    if not user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with an organization",
        )
    return user.organization_id
