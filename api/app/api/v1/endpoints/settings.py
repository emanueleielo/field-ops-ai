"""Settings endpoints including GDPR data export."""

import json
import logging
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.services.data_export import DataExportError, DataExportService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])


# TODO: Replace with actual auth dependency once auth is implemented
async def get_current_org_id() -> UUID:
    """Temporary dependency to get organization ID.

    This should be replaced with actual authentication that extracts
    the organization ID from the authenticated user's session.
    """
    # Placeholder: return a fixed UUID for development
    # In production, this will come from Supabase Auth
    return UUID("00000000-0000-0000-0000-000000000001")


@router.post("/export-data")
async def export_data(
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> Response:
    """Export all organization data in JSON format for GDPR compliance.

    This endpoint generates a complete export of all user data including:
    - Organization information (name, tier, created_at, etc.)
    - Phone numbers list (number, label, created_at)
    - Documents metadata (filename, file_type, file_size, status, created_at)
    - Activity log entries (type, event_data, created_at)
    - Quota usage summary

    Note: Message content and document content are NOT included.
    Message content is auto-deleted after 30 days per privacy policy.
    Document content is excluded due to size constraints.

    Returns:
        JSON file download with all exportable user data.
    """
    export_service = DataExportService(db)

    try:
        export_data = await export_service.export_user_data(org_id)
    except DataExportError as e:
        logger.error("Data export failed for org=%s: %s", org_id, str(e))
        raise NotFoundException(detail=str(e)) from e

    # Generate filename with current date
    date_str = datetime.now(UTC).strftime("%Y-%m-%d")
    filename = f"fieldops-data-export-{date_str}.json"

    # Serialize to JSON with nice formatting
    json_content = json.dumps(export_data, indent=2, ensure_ascii=False)

    logger.info(
        "Generated data export for org=%s, size=%d bytes",
        org_id,
        len(json_content),
    )

    return Response(
        content=json_content,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Content-Type-Options": "nosniff",
        },
    )
