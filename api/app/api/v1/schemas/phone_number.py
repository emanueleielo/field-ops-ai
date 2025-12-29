"""Pydantic schemas for phone number endpoints."""

import re
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

# E.164 phone number format regex
E164_PATTERN = re.compile(r"^\+[1-9]\d{6,14}$")

# Supported languages for phone numbers
SupportedLanguage = Literal["en", "de", "fr", "it", "es"]


class PhoneNumberCreate(BaseModel):
    """Schema for creating a new phone number."""

    phone_number: str = Field(
        ...,
        description="Phone number in E.164 format (e.g., +393331234567)",
        examples=["+393331234567", "+491711234567"],
    )
    label: str | None = Field(
        default=None,
        max_length=100,
        description="Optional label for the phone number",
        examples=["Personal", "Work Phone"],
    )
    language: SupportedLanguage = Field(
        default="en",
        description="Preferred language for SMS responses",
    )
    send_welcome_sms: bool = Field(
        default=True,
        description="Whether to send a welcome SMS when registering",
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        """Validate phone number is in E.164 format."""
        # Remove any whitespace
        cleaned = value.strip().replace(" ", "")

        if not E164_PATTERN.match(cleaned):
            raise ValueError(
                "Phone number must be in E.164 format "
                "(e.g., +393331234567). Must start with + followed by country code."
            )

        return cleaned


class PhoneNumberUpdate(BaseModel):
    """Schema for updating a phone number."""

    label: str | None = Field(
        default=None,
        max_length=100,
        description="Optional label for the phone number",
    )
    language: SupportedLanguage | None = Field(
        default=None,
        description="Preferred language for SMS responses",
    )
    is_active: bool | None = Field(
        default=None,
        description="Whether the phone number is active",
    )


class PhoneNumberResponse(BaseModel):
    """Schema for phone number response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    phone_number: str
    label: str | None
    language: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PhoneNumberListResponse(BaseModel):
    """Schema for phone number list response."""

    data: list[PhoneNumberResponse]
    total: int = Field(..., description="Total number of phone numbers")


class PhoneNumberCreateResponse(BaseModel):
    """Schema for phone number creation response."""

    id: UUID = Field(..., description="Phone number ID")
    phone_number: str = Field(..., description="Phone number in E.164 format")
    label: str | None = Field(default=None, description="Optional label")
    language: str = Field(..., description="Preferred language")
    is_active: bool = Field(..., description="Whether the phone number is active")
    welcome_sms_sent: bool = Field(
        ..., description="Whether welcome SMS was sent successfully"
    )
    message: str = Field(..., description="Status message")


class PhoneNumberDeleteResponse(BaseModel):
    """Schema for phone number deletion response."""

    id: UUID = Field(..., description="Deleted phone number ID")
    message: str = Field(..., description="Deletion confirmation message")
