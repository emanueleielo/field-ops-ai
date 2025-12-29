"""Pydantic schemas for admin user management endpoints."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import TierEnum


class OrganizationSummary(BaseModel):
    """Summary of organization details."""

    id: UUID = Field(..., description="Organization UUID")
    name: str = Field(..., description="Organization name")
    tier: TierEnum = Field(..., description="Subscription tier")
    created_at: datetime = Field(..., description="Organization creation date")


class QuotaInfo(BaseModel):
    """Quota usage information."""

    limit_euro: Decimal = Field(..., description="Quota limit in EUR")
    used_euro: Decimal = Field(..., description="Quota used in EUR")
    percentage: float = Field(..., description="Usage percentage (0-100+)")


class UserListItem(BaseModel):
    """Schema for a user item in the list."""

    id: UUID = Field(..., description="Organization UUID (acts as user ID)")
    email: str = Field(..., description="User email")
    name: str = Field(..., description="Organization/user name")
    tier: TierEnum = Field(..., description="Subscription tier")
    is_active: bool = Field(..., description="Whether user is active")
    quota_percentage: float = Field(..., description="Quota usage percentage")
    documents_count: int = Field(..., description="Number of documents")
    created_at: datetime = Field(..., description="Account creation date")
    last_activity: datetime | None = Field(
        default=None, description="Last activity timestamp"
    )


class PaginationMeta(BaseModel):
    """Pagination metadata."""

    page: int = Field(..., ge=1, description="Current page number")
    limit: int = Field(..., ge=1, le=100, description="Items per page")
    total: int = Field(..., ge=0, description="Total number of items")
    total_pages: int = Field(..., ge=0, description="Total number of pages")


class UserListResponse(BaseModel):
    """Schema for paginated user list response."""

    users: list[UserListItem] = Field(..., description="List of users")
    meta: PaginationMeta = Field(..., description="Pagination metadata")


class PhoneNumberInfo(BaseModel):
    """Phone number information."""

    id: UUID = Field(..., description="Phone number UUID")
    number: str = Field(..., description="E.164 formatted phone number")
    is_primary: bool = Field(..., description="Whether this is the primary number")
    created_at: datetime = Field(..., description="Creation date")


class DocumentSummary(BaseModel):
    """Document summary information."""

    id: UUID = Field(..., description="Document UUID")
    filename: str = Field(..., description="Document filename")
    status: str = Field(..., description="Processing status")
    file_size_bytes: int = Field(..., description="File size in bytes")
    created_at: datetime = Field(..., description="Upload date")


class UserDetailResponse(BaseModel):
    """Schema for detailed user information."""

    id: UUID = Field(..., description="Organization UUID")
    email: str = Field(..., description="User email")
    name: str = Field(..., description="Organization name")
    tier: TierEnum = Field(..., description="Subscription tier")
    is_active: bool = Field(..., description="Whether user is active")
    quota: QuotaInfo = Field(..., description="Quota information")
    billing_day: int = Field(..., description="Billing cycle day (1-31)")
    stripe_customer_id: str | None = Field(
        default=None, description="Stripe customer ID"
    )
    stripe_subscription_id: str | None = Field(
        default=None, description="Stripe subscription ID"
    )
    phone_numbers: list[PhoneNumberInfo] = Field(
        default_factory=list, description="Registered phone numbers"
    )
    documents: list[DocumentSummary] = Field(
        default_factory=list, description="Uploaded documents"
    )
    documents_count: int = Field(..., description="Total document count")
    messages_count: int = Field(..., description="Total message count")
    created_at: datetime = Field(..., description="Account creation date")
    updated_at: datetime = Field(..., description="Last update date")


class UserUpdateRequest(BaseModel):
    """Schema for updating user information."""

    tier: TierEnum | None = Field(default=None, description="New subscription tier")
    quota_limit_euro: Decimal | None = Field(
        default=None, ge=0, description="New quota limit in EUR"
    )
    is_active: bool | None = Field(
        default=None, description="Activate or deactivate user"
    )
    name: str | None = Field(
        default=None, min_length=1, max_length=255, description="Organization name"
    )


class UserUpdateResponse(BaseModel):
    """Schema for user update response."""

    id: UUID = Field(..., description="Organization UUID")
    tier: TierEnum = Field(..., description="Current subscription tier")
    quota_limit_euro: Decimal = Field(..., description="Current quota limit")
    is_active: bool = Field(..., description="Current active status")
    name: str = Field(..., description="Organization name")
    updated_at: datetime = Field(..., description="Update timestamp")


class UserDeleteResponse(BaseModel):
    """Schema for user deletion response."""

    id: UUID = Field(..., description="Deleted user's organization UUID")
    email: str = Field(..., description="Deleted user's email")
    message: str = Field(
        default="User and all associated data have been deleted",
        description="Deletion confirmation message",
    )
    deleted_documents: int = Field(..., description="Number of deleted documents")
    deleted_messages: int = Field(..., description="Number of deleted messages")


class ImpersonateRequest(BaseModel):
    """Schema for impersonation request (empty, ID comes from URL)."""

    pass


class ImpersonateResponse(BaseModel):
    """Schema for impersonation response."""

    access_token: str = Field(..., description="JWT token for user session")
    token_type: str = Field(default="bearer", description="Token type")
    user_id: UUID = Field(..., description="Impersonated user's organization UUID")
    user_email: str = Field(..., description="Impersonated user's email")
    admin_token: str = Field(
        ..., description="Original admin token to restore session"
    )
    session_id: UUID = Field(..., description="Impersonation session UUID")
    expires_at: datetime = Field(..., description="Session expiration time")
