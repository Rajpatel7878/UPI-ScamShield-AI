"""create quick scan events table

Revision ID: d5a8e2c1f7b3
Revises: c3f7a1b9d4e2
Create Date: 2026-11-14 12:00:00.000000

Adds ``quick_scan_events``, the opt-in metadata table for Android quick scans
(``STORE_QUICK_SCANS=true``). It stores only user id, device id, score, level,
category, source package and timestamp - no message text of any kind. Existing
tables are untouched and the migration is reversible.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5a8e2c1f7b3'
down_revision: Union[str, Sequence[str], None] = 'c3f7a1b9d4e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the quick_scan_events table and its indexes."""
    op.create_table(
        'quick_scan_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=True),
        sa.Column('risk_score', sa.Integer(), nullable=False),
        sa.Column('risk_level', sa.String(length=20), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('source_app', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_quick_scan_events_user_created_at',
        'quick_scan_events',
        ['user_id', 'created_at'],
        unique=False,
    )
    op.create_index(
        'ix_quick_scan_events_device_created_at',
        'quick_scan_events',
        ['device_id', 'created_at'],
        unique=False,
    )


def downgrade() -> None:
    """Drop the quick_scan_events table. No other table is affected."""
    op.drop_index(
        'ix_quick_scan_events_device_created_at', table_name='quick_scan_events'
    )
    op.drop_index(
        'ix_quick_scan_events_user_created_at', table_name='quick_scan_events'
    )
    op.drop_table('quick_scan_events')
