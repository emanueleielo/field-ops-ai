"""Pydantic schemas for quota endpoints."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class QuotaStatusResponse(BaseModel):
    """Schema for quota status response."""

    quota_limit_euro: Decimal = Field(
        ..., description="Monthly quota limit in EUR"
    )
    quota_used_euro: Decimal = Field(
        ..., description="Current quota usage in EUR"
    )
    quota_remaining_euro: Decimal = Field(
        ..., description="Remaining quota in EUR"
    )
    usage_percentage: Decimal = Field(
        ..., description="Percentage of quota used (0-100+)"
    )
    is_exceeded: bool = Field(
        ..., description="True if usage >= 100% of quota"
    )
    is_near_limit: bool = Field(
        ..., description="True if usage >= 80% of quota"
    )
    is_hard_blocked: bool = Field(
        ..., description="True if usage >= 110% (queries blocked)"
    )
    queries_this_hour: int = Field(
        ..., description="Number of queries in the last hour"
    )
    burst_limit: int = Field(
        default=50, description="Maximum queries allowed per hour"
    )
    burst_limit_exceeded: bool = Field(
        ..., description="True if burst limit is exceeded"
    )
    reset_date: date | None = Field(
        default=None, description="Next quota reset date"
    )
