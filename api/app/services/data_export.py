"""GDPR data export service for user data portability."""

import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityLog
from app.models.document import Document
from app.models.organization import Organization
from app.models.phone_number import PhoneNumber

logger = logging.getLogger(__name__)

# Export format version for future compatibility
EXPORT_VERSION = "1.0.0"


class DataExportError(Exception):
    """Exception raised for data export service errors."""


@dataclass
class ExportSummary:
    """Summary of exported data."""

    organization_id: str
    phone_numbers_count: int
    documents_count: int
    activity_logs_count: int
    export_timestamp: str


def _format_datetime(dt: datetime | None) -> str | None:
    """Format datetime to ISO 8601 string.

    Args:
        dt: Datetime to format.

    Returns:
        ISO 8601 formatted string or None.
    """
    if dt is None:
        return None
    # Ensure datetime is timezone-aware (UTC)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.isoformat()


def _format_decimal(value: Decimal | None) -> str | None:
    """Format Decimal to string for JSON serialization.

    Args:
        value: Decimal value to format.

    Returns:
        String representation or None.
    """
    if value is None:
        return None
    return str(value)


def _serialize_event_data(event_data: dict[str, Any] | None) -> dict[str, Any] | None:
    """Serialize event data, ensuring all values are JSON-serializable.

    Args:
        event_data: Event data dictionary.

    Returns:
        Serialized event data or None.
    """
    if event_data is None:
        return None

    def serialize_value(val: Any) -> Any:
        if isinstance(val, datetime):
            return _format_datetime(val)
        if isinstance(val, Decimal):
            return _format_decimal(val)
        if isinstance(val, UUID):
            return str(val)
        if isinstance(val, dict):
            return {k: serialize_value(v) for k, v in val.items()}
        if isinstance(val, list):
            return [serialize_value(v) for v in val]
        return val

    return {k: serialize_value(v) for k, v in event_data.items()}


class DataExportService:
    """Service for exporting user data for GDPR compliance."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the data export service.

        Args:
            db: The database session.
        """
        self.db = db

    async def export_user_data(self, org_id: UUID) -> dict[str, Any]:
        """Export all user data for an organization in GDPR-compliant format.

        This method collects:
        - Organization information
        - Phone numbers list
        - Documents metadata (no content)
        - Activity log entries
        - Quota usage summary

        Note: Message content is NOT included for privacy reasons
        (already deleted after 30 days per retention policy).
        Document content is NOT included due to size constraints.

        Args:
            org_id: The organization ID to export data for.

        Returns:
            Dictionary containing all exportable user data.

        Raises:
            DataExportError: If organization not found or export fails.
        """
        export_timestamp = datetime.now(UTC)

        # Get organization
        organization = await self._get_organization(org_id)
        if not organization:
            raise DataExportError(f"Organization not found: {org_id}")

        # Collect all data
        organization_data = self._format_organization(organization)
        phone_numbers_data = await self._get_phone_numbers(org_id)
        documents_data = await self._get_documents(org_id)
        activity_logs_data = await self._get_activity_logs(org_id)
        quota_summary = self._format_quota_summary(organization)

        # Build export response
        export_data: dict[str, Any] = {
            "export_info": {
                "version": EXPORT_VERSION,
                "exported_at": _format_datetime(export_timestamp),
                "organization_id": str(org_id),
                "data_retention_note": (
                    "Message content is not included per privacy policy "
                    "(auto-deleted after 30 days). Document content is not "
                    "included due to size constraints."
                ),
            },
            "organization": organization_data,
            "phone_numbers": phone_numbers_data,
            "documents": documents_data,
            "activity_logs": activity_logs_data,
            "quota_summary": quota_summary,
            "summary": {
                "organization_id": str(org_id),
                "phone_numbers_count": len(phone_numbers_data),
                "documents_count": len(documents_data),
                "activity_logs_count": len(activity_logs_data),
                "export_timestamp": _format_datetime(export_timestamp),
            },
        }

        logger.info(
            "Exported data for org=%s: phones=%d, docs=%d, logs=%d",
            org_id,
            len(phone_numbers_data),
            len(documents_data),
            len(activity_logs_data),
        )

        return export_data

    async def _get_organization(self, org_id: UUID) -> Organization | None:
        """Get organization by ID.

        Args:
            org_id: Organization ID.

        Returns:
            Organization instance or None if not found.
        """
        result = await self.db.execute(
            select(Organization).where(Organization.id == org_id)
        )
        return result.scalar_one_or_none()

    def _format_organization(self, org: Organization) -> dict[str, Any]:
        """Format organization data for export.

        Args:
            org: Organization instance.

        Returns:
            Dictionary with organization data.
        """
        return {
            "id": str(org.id),
            "name": org.name,
            "tier": org.tier.value,
            "billing_day": org.billing_day,
            "created_at": _format_datetime(org.created_at),
            "updated_at": _format_datetime(org.updated_at),
            # Note: Stripe IDs are not included for security
        }

    async def _get_phone_numbers(self, org_id: UUID) -> list[dict[str, Any]]:
        """Get all phone numbers for an organization.

        Args:
            org_id: Organization ID.

        Returns:
            List of phone number dictionaries.
        """
        result = await self.db.execute(
            select(PhoneNumber)
            .where(PhoneNumber.organization_id == org_id)
            .order_by(PhoneNumber.created_at.desc())
        )
        phone_numbers = result.scalars().all()

        return [
            {
                "id": str(pn.id),
                "phone_number": pn.phone_number,
                "label": pn.label,
                "is_active": pn.is_active,
                "language": pn.language,
                "created_at": _format_datetime(pn.created_at),
                "updated_at": _format_datetime(pn.updated_at),
            }
            for pn in phone_numbers
        ]

    async def _get_documents(self, org_id: UUID) -> list[dict[str, Any]]:
        """Get all document metadata for an organization.

        Note: Document content is NOT included due to size constraints.

        Args:
            org_id: Organization ID.

        Returns:
            List of document metadata dictionaries.
        """
        result = await self.db.execute(
            select(Document)
            .where(Document.organization_id == org_id)
            .order_by(Document.created_at.desc())
        )
        documents = result.scalars().all()

        return [
            {
                "id": str(doc.id),
                "filename": doc.filename,
                "original_filename": doc.original_filename,
                "file_type": doc.file_type,
                "file_size_bytes": doc.file_size_bytes,
                "status": doc.status.value,
                "chunk_count": doc.chunk_count,
                "created_at": _format_datetime(doc.created_at),
                "updated_at": _format_datetime(doc.updated_at),
                # Note: storage_path and file_hash not included (internal use only)
            }
            for doc in documents
        ]

    async def _get_activity_logs(self, org_id: UUID) -> list[dict[str, Any]]:
        """Get all activity log entries for an organization.

        Args:
            org_id: Organization ID.

        Returns:
            List of activity log dictionaries.
        """
        result = await self.db.execute(
            select(ActivityLog)
            .where(ActivityLog.organization_id == org_id)
            .order_by(ActivityLog.created_at.desc())
        )
        logs = result.scalars().all()

        return [
            {
                "id": str(log.id),
                "event_type": log.event_type,
                "event_data": _serialize_event_data(log.event_data),
                "created_at": _format_datetime(log.created_at),
            }
            for log in logs
        ]

    def _format_quota_summary(self, org: Organization) -> dict[str, Any]:
        """Format quota usage summary.

        Args:
            org: Organization instance.

        Returns:
            Dictionary with quota summary.
        """
        quota_limit = org.quota_limit_euro
        quota_used = org.quota_used_euro
        quota_remaining = max(quota_limit - quota_used, Decimal("0"))

        usage_percentage = Decimal("0")
        if quota_limit > 0:
            usage_percentage = (quota_used / quota_limit) * 100

        rounded_percentage = usage_percentage.quantize(Decimal("0.01"))
        return {
            "quota_limit_euro": _format_decimal(quota_limit),
            "quota_used_euro": _format_decimal(quota_used),
            "quota_remaining_euro": _format_decimal(quota_remaining),
            "usage_percentage": _format_decimal(rounded_percentage),
            "tier": org.tier.value,
        }
