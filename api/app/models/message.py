"""Message model for SMS conversation history."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import MessageDirectionEnum


class Message(Base):
    """Message model for storing SMS conversation history."""

    __tablename__ = "messages"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    direction: Mapped[MessageDirectionEnum] = mapped_column(nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tokens_in: Mapped[int] = mapped_column(default=0, nullable=False)
    tokens_out: Mapped[int] = mapped_column(default=0, nullable=False)
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cost_euro: Mapped[Decimal] = mapped_column(
        Numeric(10, 6), default=Decimal("0.00"), nullable=False
    )
    response_time_ms: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
        index=True,
    )
