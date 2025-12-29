"""Pydantic schemas for admin authentication endpoints."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class AdminLoginRequest(BaseModel):
    """Schema for admin login request."""

    email: EmailStr = Field(..., description="Admin email address")
    password: str = Field(..., min_length=1, description="Admin password")


class AdminLoginResponse(BaseModel):
    """Schema for admin login response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    admin_id: UUID = Field(..., description="Admin UUID")
    email: str = Field(..., description="Admin email")
    last_login: datetime | None = Field(
        default=None, description="Previous login timestamp"
    )


class AdminLogoutResponse(BaseModel):
    """Schema for admin logout response."""

    message: str = Field(
        default="Successfully logged out", description="Logout confirmation"
    )
