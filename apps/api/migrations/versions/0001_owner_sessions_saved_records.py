"""Create owner auth, server-side sessions, and saved Reliance Records.

Revision ID: 0001_owner_sessions
Revises:
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_owner_sessions"
down_revision = None
branch_labels = None
depends_on = None

JSON_DOCUMENT = sa.JSON().with_variant(postgresql.JSONB(none_as_null=True), "postgresql")


def upgrade() -> None:
    op.create_table(
        "owner_accounts",
        sa.Column("user_id", sa.String(length=32), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=512), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "auth_sessions",
        sa.Column("token_digest", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("owner_accounts.user_id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_auth_sessions_user_expiry", "auth_sessions", ["user_id", "expires_at"])
    op.create_table(
        "saved_reliance_records",
        sa.Column("record_id", sa.String(length=40), primary_key=True),
        sa.Column("owner_id", sa.String(length=32), sa.ForeignKey("owner_accounts.user_id", ondelete="CASCADE"), nullable=False),
        sa.Column("reliance_id", sa.String(length=80), nullable=False),
        sa.Column("analysis_timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("engine_version", sa.String(length=64), nullable=False),
        sa.Column("record_schema_version", sa.String(length=64), nullable=False),
        sa.Column("configuration_version", sa.String(length=128), nullable=False),
        sa.Column("standing", sa.String(length=64), nullable=False),
        sa.Column("payload", JSON_DOCUMENT, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_saved_records_owner_created", "saved_reliance_records", ["owner_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_saved_records_owner_created", table_name="saved_reliance_records")
    op.drop_table("saved_reliance_records")
    op.drop_index("ix_auth_sessions_user_expiry", table_name="auth_sessions")
    op.drop_table("auth_sessions")
    op.drop_table("owner_accounts")
