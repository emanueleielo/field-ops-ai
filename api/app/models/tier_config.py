"""Tier configuration model for dynamic pricing management."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import TierEnum


class TierConfig(Base):
    """Tier configuration model for dynamic pricing and limits.

    Stores editable tier configurations including prices and resource limits.
    Changes to this table affect new subscriptions; existing subscriptions
    retain their original terms until renewal.
    """

    __tablename__ = "tier_configs"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    tier: Mapped[TierEnum] = mapped_column(unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Pricing
    monthly_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    yearly_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )

    # Limits
    quota_limit_euro: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    storage_limit_mb: Mapped[int | None] = mapped_column(
        nullable=True
    )  # NULL = unlimited
    max_phone_numbers: Mapped[int] = mapped_column(nullable=False)
    max_file_size_mb: Mapped[int] = mapped_column(nullable=False)
    max_pdf_pages: Mapped[int] = mapped_column(nullable=False)

    # Status
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Timestamps
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
