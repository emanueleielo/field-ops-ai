"""Pydantic schemas for admin dashboard endpoints."""

from pydantic import BaseModel, Field


class SubscriptionsByTier(BaseModel):
    """Schema for subscription counts by tier."""

    basic: int = Field(default=0, description="Basic tier subscriptions")
    professional: int = Field(default=0, description="Professional tier subscriptions")
    enterprise: int = Field(default=0, description="Enterprise tier subscriptions")


class BusinessKPIs(BaseModel):
    """Schema for business KPIs."""

    mrr: float = Field(..., description="Monthly Recurring Revenue in EUR")
    arr: float = Field(..., description="Annual Recurring Revenue in EUR")
    arpu: float = Field(..., description="Average Revenue Per User in EUR")
    total_users: int = Field(..., description="Total active users")
    new_users_month: int = Field(..., description="New users in the last 30 days")
    new_users_week: int = Field(..., description="New users in the last 7 days")
    subscriptions_by_tier: SubscriptionsByTier = Field(
        ..., description="Subscription counts by tier"
    )


class TechnicalKPIs(BaseModel):
    """Schema for technical KPIs."""

    queries_today: int = Field(..., description="Total queries today")
    sms_sent_today: int = Field(..., description="SMS sent today")
    queries_month: int = Field(..., description="Total queries this month")
    llm_costs_today: float = Field(..., description="LLM costs today in EUR")
    llm_costs_month: float = Field(..., description="LLM costs this month in EUR")
    avg_response_time_ms: int | None = Field(
        ..., description="Average response time in milliseconds"
    )
    total_storage_mb: float = Field(
        ..., description="Total storage used across all users in MB"
    )
    total_documents: int = Field(..., description="Total documents indexed")


class DashboardResponse(BaseModel):
    """Schema for admin dashboard response."""

    business: BusinessKPIs = Field(..., description="Business KPIs")
    technical: TechnicalKPIs = Field(..., description="Technical KPIs")
    generated_at: str = Field(..., description="Timestamp when KPIs were generated")
