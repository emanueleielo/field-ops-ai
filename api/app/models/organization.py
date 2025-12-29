"""Organization model for tenant management."""

from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import TierEnum

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.phone_number import PhoneNumber


class Organization(Base, TimestampMixin):
    """Organization model representing a tenant in the system."""

    __tablename__ = "organizations"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    tier: Mapped[TierEnum] = mapped_column(default=TierEnum.basic, nullable=False)
    quota_limit_euro: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("15.00"), nullable=False
    )
    quota_used_euro: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00"), nullable=False
    )
    billing_day: Mapped[int] = mapped_column(default=1, nullable=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    # Relationships
    phone_numbers: Mapped[list["PhoneNumber"]] = relationship(
        "PhoneNumber", back_populates="organization", lazy="selectin"
    )
    documents: Mapped[list["Document"]] = relationship(
        "Document", back_populates="organization", lazy="selectin"
    )
