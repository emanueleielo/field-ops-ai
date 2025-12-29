"""Impersonation session model for admin user takeover."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.admin import Admin
    from app.models.organization import Organization


class ImpersonationSession(Base):
    """Impersonation session model for admin user takeover.

    Tracks when an admin logs in as a user to see their dashboard
    for support purposes.
    """

    __tablename__ = "impersonation_sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    admin_id: Mapped[UUID] = mapped_column(
        ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    ended_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Relationships
    admin: Mapped["Admin"] = relationship("Admin", lazy="selectin")
    organization: Mapped["Organization"] = relationship(
        "Organization", lazy="selectin"
    )
