"""Pydantic schemas for admin configuration endpoints."""

from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import TierEnum


class TierConfigResponse(BaseModel):
    """Schema for tier configuration response."""

    tier: TierEnum = Field(..., description="Tier identifier")
    name: str = Field(..., description="Display name of the tier")
    monthly_price: float = Field(..., description="Monthly price in EUR")
    yearly_price: float = Field(..., description="Yearly price in EUR")
    quota_limit_euro: float = Field(..., description="Quota limit in EUR")
    storage_limit_mb: int | None = Field(
        None, description="Storage limit in MB (null = unlimited)"
    )
    max_phone_numbers: int = Field(..., description="Maximum phone numbers allowed")
    max_file_size_mb: int = Field(..., description="Maximum file size in MB")
    max_pdf_pages: int = Field(..., description="Maximum PDF pages allowed")
    is_active: bool = Field(..., description="Whether the tier is active")

    class Config:
        """Pydantic model config."""

        from_attributes = True


class TierConfigUpdate(BaseModel):
    """Schema for updating tier configuration."""

    name: str | None = Field(None, description="Display name of the tier")
    monthly_price: Decimal | None = Field(
        None, ge=Decimal("0"), description="Monthly price in EUR"
    )
    yearly_price: Decimal | None = Field(
        None, ge=Decimal("0"), description="Yearly price in EUR"
    )
    quota_limit_euro: Decimal | None = Field(
        None, ge=Decimal("0"), description="Quota limit in EUR"
    )
    storage_limit_mb: int | None = Field(
        None, ge=0, description="Storage limit in MB (null = unlimited)"
    )
    max_phone_numbers: int | None = Field(
        None, ge=1, description="Maximum phone numbers allowed"
    )
    max_file_size_mb: int | None = Field(
        None, ge=1, description="Maximum file size in MB"
    )
    max_pdf_pages: int | None = Field(
        None, ge=1, description="Maximum PDF pages allowed"
    )
    is_active: bool | None = Field(None, description="Whether the tier is active")


class TierConfigListResponse(BaseModel):
    """Schema for list of tier configurations."""

    tiers: list[TierConfigResponse] = Field(..., description="List of tier configs")


class SystemSettingsResponse(BaseModel):
    """Schema for system settings response."""

    burst_limit: int = Field(
        default=50, description="Maximum queries per hour per organization"
    )
    sms_templates: dict[str, str] = Field(
        default_factory=dict, description="SMS template messages"
    )
    welcome_sms_enabled: bool = Field(
        default=True, description="Whether welcome SMS is enabled"
    )
    default_language: str = Field(default="en", description="Default response language")
    max_conversation_history: int = Field(
        default=5, description="Maximum messages in conversation history"
    )
    llm_timeout_seconds: int = Field(
        default=360, description="LLM timeout in seconds"
    )
    rate_limit_enabled: bool = Field(
        default=True, description="Whether rate limiting is enabled"
    )


class SystemSettingsUpdate(BaseModel):
    """Schema for updating system settings."""

    burst_limit: int | None = Field(
        None, ge=1, le=1000, description="Maximum queries per hour per organization"
    )
    sms_templates: dict[str, str] | None = Field(
        None, description="SMS template messages"
    )
    welcome_sms_enabled: bool | None = Field(
        None, description="Whether welcome SMS is enabled"
    )
    default_language: str | None = Field(None, description="Default response language")
    max_conversation_history: int | None = Field(
        None, ge=1, le=20, description="Maximum messages in conversation history"
    )
    llm_timeout_seconds: int | None = Field(
        None, ge=30, le=600, description="LLM timeout in seconds"
    )
    rate_limit_enabled: bool | None = Field(
        None, description="Whether rate limiting is enabled"
    )
