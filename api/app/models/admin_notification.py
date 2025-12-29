"""Admin notification model for platform alerts."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class AdminNotificationTypeEnum(str, Enum):
    """Types of admin notifications."""

    critical = "critical"  # Red badge - service issues, low balance
    warning = "warning"  # Yellow badge - quota exceeded, payment failed
    info = "info"  # Blue badge - new signup, subscription changes


class AdminNotification(Base):
    """Admin notification model for platform alerts.

    Stores notifications for admin panel alerts such as system issues,
    payment failures, and user-related events.
    """

    __tablename__ = "admin_notifications"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    type: Mapped[AdminNotificationTypeEnum] = mapped_column(nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict[str, str] | None] = mapped_column(
        JSON, nullable=True
    )  # Additional context
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
