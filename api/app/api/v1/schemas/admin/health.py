"""Pydantic schemas for admin health monitoring endpoints."""

from enum import Enum

from pydantic import BaseModel, Field


class ServiceStatusEnum(str, Enum):
    """Service health status enum."""

    healthy = "healthy"
    degraded = "degraded"
    down = "down"
    unknown = "unknown"


class ServiceStatus(BaseModel):
    """Schema for individual service status."""

    name: str = Field(..., description="Service name")
    status: ServiceStatusEnum = Field(..., description="Current status")
    latency_ms: int | None = Field(None, description="Response latency in ms")
    message: str | None = Field(None, description="Status message or error details")
    last_checked: str = Field(..., description="Last check timestamp")
    details: dict | None = Field(None, description="Additional service-specific details")


class QdrantStatus(ServiceStatus):
    """Schema for Qdrant service status."""

    collections_count: int | None = Field(None, description="Number of collections")
    points_count: int | None = Field(None, description="Total points in collections")


class TwilioStatus(ServiceStatus):
    """Schema for Twilio service status."""

    account_status: str | None = Field(None, description="Twilio account status")
    balance: float | None = Field(None, description="Account balance if available")


class DatabaseStatus(ServiceStatus):
    """Schema for database status."""

    pool_size: int | None = Field(None, description="Connection pool size")
    active_connections: int | None = Field(None, description="Active connections")


class LLMProviderStatus(BaseModel):
    """Schema for individual LLM provider status."""

    name: str = Field(..., description="Provider name (anthropic, openai, google)")
    status: ServiceStatusEnum = Field(..., description="Current status")
    api_key_valid: bool = Field(..., description="Whether API key is configured")
    latency_ms: int | None = Field(None, description="Response latency in ms")


class LLMStatus(ServiceStatus):
    """Schema for LLM services status."""

    providers: list[LLMProviderStatus] = Field(
        default_factory=list, description="Status of each LLM provider"
    )


class HealthResponse(BaseModel):
    """Schema for overall health check response."""

    overall_status: ServiceStatusEnum = Field(
        ..., description="Overall system health status"
    )
    services: dict[str, ServiceStatus] = Field(
        ..., description="Status of each service"
    )
    generated_at: str = Field(..., description="Timestamp when health was checked")


class LogEntry(BaseModel):
    """Schema for a single log entry."""

    timestamp: str = Field(..., description="Log entry timestamp")
    level: str = Field(..., description="Log level (INFO, WARNING, ERROR, etc.)")
    logger: str = Field(..., description="Logger name")
    message: str = Field(..., description="Log message")
    extra: dict | None = Field(None, description="Additional log data")


class LogsResponse(BaseModel):
    """Schema for logs response."""

    logs: list[LogEntry] = Field(..., description="List of log entries")
    total: int = Field(..., description="Total number of logs matching criteria")
    page: int = Field(..., description="Current page")
    limit: int = Field(..., description="Logs per page")
