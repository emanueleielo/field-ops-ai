"""Add admin tables and seed data

Revision ID: 002_add_admin_tables
Revises: 001_add_quota_notifications
Create Date: 2024-12-29

"""

import os
from collections.abc import Sequence
from decimal import Decimal
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from passlib.hash import bcrypt

# revision identifiers, used by Alembic.
revision: str = "002_add_admin_tables"
down_revision: str | None = "001_add_quota_notifications"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def hash_password(password: str) -> str:
    """Hash password using passlib bcrypt.

    Args:
        password: Plain text password.

    Returns:
        Bcrypt hash of the password.
    """
    result: str = bcrypt.hash(password)
    return result


def upgrade() -> None:
    """Create admin tables and seed initial data."""

    # Create admins table
    op.create_table(
        "admins",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_login", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_admins"),
        sa.UniqueConstraint("email", name="uq_admins_email"),
    )

    # Create tier_configs table
    op.create_table(
        "tier_configs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "tier",
            sa.Enum("basic", "professional", "enterprise", name="tierenum"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("monthly_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("yearly_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("quota_limit_euro", sa.Numeric(10, 2), nullable=False),
        sa.Column("storage_limit_mb", sa.Integer(), nullable=True),
        sa.Column("max_phone_numbers", sa.Integer(), nullable=False),
        sa.Column("max_file_size_mb", sa.Integer(), nullable=False),
        sa.Column("max_pdf_pages", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_tier_configs"),
        sa.UniqueConstraint("tier", name="uq_tier_configs_tier"),
    )

    # Create admin_notifications table
    op.create_table(
        "admin_notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "type",
            sa.Enum("critical", "warning", "info", name="adminnotificationtypeenum"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("data", sa.JSON(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_admin_notifications"),
    )

    # Create index for unread notifications
    op.create_index(
        "ix_admin_notifications_is_read",
        "admin_notifications",
        ["is_read"],
    )

    # Create impersonation_sessions table
    op.create_table(
        "impersonation_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("admin_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "started_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["admin_id"],
            ["admins.id"],
            name="fk_impersonation_sessions_admin_id_admins",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["organizations.id"],
            name="fk_impersonation_sessions_user_id_organizations",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_impersonation_sessions"),
    )

    # Create indexes for impersonation sessions
    op.create_index(
        "ix_impersonation_sessions_admin_id",
        "impersonation_sessions",
        ["admin_id"],
    )
    op.create_index(
        "ix_impersonation_sessions_user_id",
        "impersonation_sessions",
        ["user_id"],
    )

    # Seed admin user if env vars are set
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if admin_email and admin_password:
        password_hash = hash_password(admin_password)
        admin_id = str(uuid4())

        op.execute(
            sa.text(
                """
                INSERT INTO admins (id, email, password_hash)
                VALUES (:id, :email, :password_hash)
                ON CONFLICT (email) DO NOTHING
                """
            ).bindparams(
                id=admin_id,
                email=admin_email,
                password_hash=password_hash,
            )
        )

    # Seed tier configurations from project.md
    tier_configs = [
        {
            "id": str(uuid4()),
            "tier": "basic",
            "name": "BASIC",
            "monthly_price": Decimal("79.00"),
            "yearly_price": Decimal("869.00"),  # 72/month * 12 = 864, rounded to 869
            "quota_limit_euro": Decimal("15.00"),
            "storage_limit_mb": 50,
            "max_phone_numbers": 1,
            "max_file_size_mb": 50,
            "max_pdf_pages": 1000,
        },
        {
            "id": str(uuid4()),
            "tier": "professional",
            "name": "PROFESSIONAL",
            "monthly_price": Decimal("149.00"),
            "yearly_price": Decimal("1643.00"),  # 137/month * 12 = 1644
            "quota_limit_euro": Decimal("35.00"),
            "storage_limit_mb": None,  # Unlimited
            "max_phone_numbers": 1,
            "max_file_size_mb": 100,
            "max_pdf_pages": 2000,
        },
        {
            "id": str(uuid4()),
            "tier": "enterprise",
            "name": "ENTERPRISE",
            "monthly_price": Decimal("399.00"),
            "yearly_price": Decimal("4399.00"),  # 367/month * 12 = 4404
            "quota_limit_euro": Decimal("80.00"),
            "storage_limit_mb": None,  # Unlimited
            "max_phone_numbers": 5,
            "max_file_size_mb": 100,
            "max_pdf_pages": 2000,
        },
    ]

    for config in tier_configs:
        op.execute(
            sa.text(
                """
                INSERT INTO tier_configs (
                    id, tier, name, monthly_price, yearly_price,
                    quota_limit_euro, storage_limit_mb, max_phone_numbers,
                    max_file_size_mb, max_pdf_pages
                )
                VALUES (
                    :id, :tier, :name, :monthly_price, :yearly_price,
                    :quota_limit_euro, :storage_limit_mb, :max_phone_numbers,
                    :max_file_size_mb, :max_pdf_pages
                )
                ON CONFLICT (tier) DO NOTHING
                """
            ).bindparams(
                id=config["id"],
                tier=config["tier"],
                name=config["name"],
                monthly_price=config["monthly_price"],
                yearly_price=config["yearly_price"],
                quota_limit_euro=config["quota_limit_euro"],
                storage_limit_mb=config["storage_limit_mb"],
                max_phone_numbers=config["max_phone_numbers"],
                max_file_size_mb=config["max_file_size_mb"],
                max_pdf_pages=config["max_pdf_pages"],
            )
        )


def downgrade() -> None:
    """Drop admin tables."""
    op.drop_index(
        "ix_impersonation_sessions_user_id",
        table_name="impersonation_sessions",
    )
    op.drop_index(
        "ix_impersonation_sessions_admin_id",
        table_name="impersonation_sessions",
    )
    op.drop_table("impersonation_sessions")

    op.drop_index(
        "ix_admin_notifications_is_read",
        table_name="admin_notifications",
    )
    op.drop_table("admin_notifications")

    # Drop the enum type for admin notifications
    op.execute(sa.text("DROP TYPE IF EXISTS adminnotificationtypeenum"))

    op.drop_table("tier_configs")
    op.drop_table("admins")
