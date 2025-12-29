"""Auth endpoints that proxy to Supabase Auth."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from gotrue.errors import AuthApiError

from app.api.v1.schemas.auth import (
    AuthResponse,
    AuthUserResponse,
    LoginRequest,
    MessageResponse,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
    UserResponse,
)
from app.core.auth import CurrentUser, get_current_user
from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(request: RegisterRequest) -> AuthUserResponse:
    """Register a new user via Supabase Auth.

    Args:
        request: Registration data with email and password.

    Returns:
        User data and authentication tokens.

    Raises:
        HTTPException: 400 if registration fails.
    """
    client = get_supabase_client()

    try:
        # Build options for sign up
        options = {}
        if request.full_name:
            options["data"] = {"full_name": request.full_name}

        response = client.auth.sign_up(
            {
                "email": request.email,
                "password": request.password,
                "options": options if options else None,
            }
        )

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed",
            )

        if not response.session:
            # Email confirmation required
            return AuthUserResponse(
                user=UserResponse(
                    id=str(response.user.id),
                    email=response.user.email or "",
                    full_name=response.user.user_metadata.get("full_name"),
                    created_at=response.user.created_at,
                ),
                session=AuthResponse(
                    access_token="",
                    refresh_token="",
                    token_type="bearer",
                    expires_in=0,
                    expires_at=0,
                ),
            )

        return AuthUserResponse(
            user=UserResponse(
                id=str(response.user.id),
                email=response.user.email or "",
                full_name=response.user.user_metadata.get("full_name"),
                created_at=response.user.created_at,
            ),
            session=AuthResponse(
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                token_type="bearer",
                expires_in=response.session.expires_in or 3600,
                expires_at=response.session.expires_at or 0,
            ),
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.post("/login", response_model=AuthUserResponse)
async def login(request: LoginRequest) -> AuthUserResponse:
    """Login user via Supabase Auth.

    Args:
        request: Login credentials.

    Returns:
        User data and authentication tokens.

    Raises:
        HTTPException: 401 if credentials invalid.
    """
    client = get_supabase_client()

    try:
        response = client.auth.sign_in_with_password(
            {"email": request.email, "password": request.password}
        )

        if not response.user or not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        return AuthUserResponse(
            user=UserResponse(
                id=str(response.user.id),
                email=response.user.email or "",
                full_name=response.user.user_metadata.get("full_name"),
                created_at=response.user.created_at,
            ),
            session=AuthResponse(
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                token_type="bearer",
                expires_in=response.session.expires_in or 3600,
                expires_at=response.session.expires_at or 0,
            ),
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: RefreshRequest) -> AuthResponse:
    """Refresh authentication tokens.

    Args:
        request: Refresh token.

    Returns:
        New authentication tokens.

    Raises:
        HTTPException: 401 if refresh token invalid.
    """
    client = get_supabase_client()

    try:
        response = client.auth.refresh_session(request.refresh_token)

        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
            expires_in=response.session.expires_in or 3600,
            expires_at=response.session.expires_at or 0,
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> UserResponse:
    """Get current authenticated user.

    Args:
        current_user: Current user from JWT.

    Returns:
        User data.
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=None,  # Not stored in JWT
    )


@router.post("/password/reset", response_model=MessageResponse)
async def reset_password(request: PasswordResetRequest) -> MessageResponse:
    """Request password reset email.

    Args:
        request: Email address for password reset.

    Returns:
        Success message.
    """
    client = get_supabase_client()

    try:
        client.auth.reset_password_for_email(request.email)
        return MessageResponse(
            message="If an account exists with this email, a reset link has been sent"
        )
    except AuthApiError:
        # Don't reveal if email exists
        return MessageResponse(
            message="If an account exists with this email, a reset link has been sent"
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],  # noqa: ARG001
) -> MessageResponse:
    """Logout current user.

    Note: This is mostly a client-side operation. The server just acknowledges
    the logout request. The client should discard the tokens.

    Args:
        current_user: Current authenticated user.

    Returns:
        Success message.
    """
    # In a Supabase-proxied setup, logout is handled client-side
    # by discarding tokens. We just acknowledge the request.
    return MessageResponse(message="Logged out successfully")
