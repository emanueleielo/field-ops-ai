"""Auth schemas for Supabase proxy endpoints."""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Request schema for user registration."""

    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = None


class LoginRequest(BaseModel):
    """Request schema for user login."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Request schema for token refresh."""

    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Request schema for password reset."""

    email: EmailStr


class PasswordUpdateRequest(BaseModel):
    """Request schema for updating password with reset token."""

    access_token: str
    new_password: str = Field(min_length=8)


class AuthResponse(BaseModel):
    """Response schema for authentication operations."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    expires_at: int


class UserResponse(BaseModel):
    """Response schema for user data."""

    id: str
    email: str
    full_name: str | None = None
    created_at: str | None = None


class AuthUserResponse(BaseModel):
    """Response schema combining auth tokens and user data."""

    user: UserResponse
    session: AuthResponse


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
