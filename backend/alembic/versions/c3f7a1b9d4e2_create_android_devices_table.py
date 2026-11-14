"""create android devices table

Revision ID: c3f7a1b9d4e2
Revises: 70e8fa9ea9cc
Create Date: 2026-11-14 10:00:00.000000

Adds the ``devices`` table used by Android device authentication. Existing
tables and rows are untouched, so this migration is safe to apply on a live
SQLite or PostgreSQL database and reversible in one step.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3f7a1b9d4e2'
down_revision: Union[str, Sequence[str], None] = '70e8fa9ea9cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the devices table and its indexes."""
    op.create_table(
        'devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_name', sa.String(length=100), nullable=False),
        sa.Column('device_token_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_devices_token_hash', 'devices', ['device_token_hash'], unique=True
    )
    op.create_index(
        'ix_devices_user_active', 'devices', ['user_id', 'is_active'], unique=False
    )
    op.create_index('ix_devices_expires_at', 'devices', ['expires_at'], unique=False)


def downgrade() -> None:
    """Drop the devices table. No other table is affected."""
    op.drop_index('ix_devices_expires_at', table_name='devices')
    op.drop_index('ix_devices_user_active', table_name='devices')
    op.drop_index('ix_devices_token_hash', table_name='devices')
    op.drop_table('devices')
