"""QuotaNotification model for tracking sent quota notifications."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class QuotaNotification(Base):
    """Track which quota notifications have been sent to avoid duplicates.

    This table tracks when notifications have been sent for specific quota
    thresholds (90%, 100%, 110%). Records are cleared when quota resets.
    """

    __tablename__ = "quota_notifications"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    threshold_percent: Mapped[int] = mapped_column(nullable=False)
    sent_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        # Unique constraint: only one notification per org per threshold
        Index(
            "uq_quota_notifications_org_threshold",
            "organization_id",
            "threshold_percent",
            unique=True,
        ),
        # Index for efficient lookup by organization
        Index("ix_quota_notifications_organization_id", "organization_id"),
    )
