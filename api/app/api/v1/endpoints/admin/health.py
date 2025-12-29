"""Admin health monitoring endpoints."""

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.admin.auth import get_current_admin
from app.api.v1.schemas.admin.health import (
    HealthResponse,
    LogEntry,
    LogsResponse,
)
from app.db.session import get_db
from app.models.admin import Admin
from app.services.admin.health_service import HealthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin-health"])


@router.get("/health", response_model=HealthResponse)
async def get_health(
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> HealthResponse:
    """Get health status of all services.

    Checks connectivity and status of:
    - Database
    - Qdrant vector store
    - Twilio SMS service
    - LLM providers (Anthropic, OpenAI, Google)

    Returns overall status (healthy/degraded/down) and individual service details.
    Requires admin authentication.
    """
    health_service = HealthService()
    return await health_service.get_overall_health(db)


@router.get("/logs", response_model=LogsResponse)
async def get_logs(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=50, ge=1, le=500, description="Logs per page"),
    level: str | None = Query(
        default=None,
        description="Filter by log level (INFO, WARNING, ERROR, etc.)",
    ),
    since: str | None = Query(
        default=None,
        description="Filter logs since this timestamp (ISO format)",
    ),
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> LogsResponse:
    """Get application logs.

    Returns paginated application logs from the last 24 hours.
    In production, this would read from a centralized logging system.
    For MVP, we return placeholder data or recent logs from memory.

    Requires admin authentication.
    """
    # Note: In a production environment, this would query a logging service
    # like CloudWatch, Datadog, or ELK stack. For now, we return placeholder data.

    # Parse since parameter
    since_dt = datetime.utcnow() - timedelta(hours=24)
    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
        except ValueError:
            pass

    # Generate placeholder logs for MVP
    # In production, replace with actual log retrieval
    placeholder_logs = _generate_placeholder_logs(page, limit, level, since_dt)

    return LogsResponse(
        logs=placeholder_logs,
        total=len(placeholder_logs),
        page=page,
        limit=limit,
    )


def _generate_placeholder_logs(
    page: int,
    limit: int,
    level_filter: str | None,
    since: datetime,
) -> list[LogEntry]:
    """Generate placeholder log entries for MVP.

    In production, this would be replaced with actual log retrieval
    from a logging service.

    Args:
        page: Page number.
        limit: Entries per page.
        level_filter: Optional log level filter.
        since: Filter logs since this time.

    Returns:
        List of log entries.
    """
    # Sample log entries showing typical application activity
    sample_logs = [
        LogEntry(
            timestamp=datetime.utcnow().isoformat(),
            level="INFO",
            logger="app.services.sms_handler",
            message="SMS received and processing started",
            extra={"phone": "+39***1234"},
        ),
        LogEntry(
            timestamp=(datetime.utcnow() - timedelta(minutes=5)).isoformat(),
            level="INFO",
            logger="app.services.agent",
            message="RAG query completed successfully",
            extra={"duration_ms": 1234, "model": "claude-3-haiku"},
        ),
        LogEntry(
            timestamp=(datetime.utcnow() - timedelta(minutes=10)).isoformat(),
            level="WARNING",
            logger="app.services.quota",
            message="Organization approaching quota limit (85%)",
            extra={"org_id": "***", "quota_used": 0.85},
        ),
        LogEntry(
            timestamp=(datetime.utcnow() - timedelta(minutes=15)).isoformat(),
            level="INFO",
            logger="app.services.document_processor",
            message="Document indexed successfully",
            extra={"document_id": "***", "chunks": 45},
        ),
        LogEntry(
            timestamp=(datetime.utcnow() - timedelta(minutes=20)).isoformat(),
            level="ERROR",
            logger="app.services.llm",
            message="Primary LLM timeout, falling back to secondary",
            extra={"primary": "anthropic", "fallback": "openai"},
        ),
        LogEntry(
            timestamp=(datetime.utcnow() - timedelta(minutes=30)).isoformat(),
            level="INFO",
            logger="app.api.webhooks.twilio",
            message="Twilio webhook received",
            extra=None,
        ),
        LogEntry(
            timestamp=(datetime.utcnow() - timedelta(minutes=45)).isoformat(),
            level="INFO",
            logger="app.services.sms",
            message="SMS sent successfully",
            extra={"segments": 1},
        ),
        LogEntry(
            timestamp=(datetime.utcnow() - timedelta(hours=1)).isoformat(),
            level="WARNING",
            logger="app.services.vector_store",
            message="Qdrant response time elevated",
            extra={"latency_ms": 850},
        ),
        LogEntry(
            timestamp=(datetime.utcnow() - timedelta(hours=2)).isoformat(),
            level="INFO",
            logger="app.tasks.quota_reset",
            message="Quota reset completed for organization",
            extra={"org_id": "***"},
        ),
        LogEntry(
            timestamp=(datetime.utcnow() - timedelta(hours=3)).isoformat(),
            level="INFO",
            logger="app.api.v1.endpoints.admin.auth",
            message="Admin login successful",
            extra={"email": "admin@***"},
        ),
    ]

    # Apply level filter
    if level_filter:
        sample_logs = [log for log in sample_logs if log.level == level_filter.upper()]

    # Apply pagination (simple offset for placeholder)
    offset = (page - 1) * limit
    return sample_logs[offset : offset + limit]
