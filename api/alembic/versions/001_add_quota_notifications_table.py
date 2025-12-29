"""Add quota_notifications table

Revision ID: 001_add_quota_notifications
Revises:
Create Date: 2024-12-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_add_quota_notifications"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create quota_notifications table."""
    op.create_table(
        "quota_notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("threshold_percent", sa.Integer(), nullable=False),
        sa.Column(
            "sent_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_quota_notifications_organization_id_organizations",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_quota_notifications"),
    )

    # Create unique constraint for org + threshold combination
    op.create_index(
        "uq_quota_notifications_org_threshold",
        "quota_notifications",
        ["organization_id", "threshold_percent"],
        unique=True,
    )

    # Create index for efficient lookup by organization
    op.create_index(
        "ix_quota_notifications_organization_id",
        "quota_notifications",
        ["organization_id"],
    )


def downgrade() -> None:
    """Drop quota_notifications table."""
    op.drop_index(
        "ix_quota_notifications_organization_id",
        table_name="quota_notifications",
    )
    op.drop_index(
        "uq_quota_notifications_org_threshold",
        table_name="quota_notifications",
    )
    op.drop_table("quota_notifications")
