"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-24
"""
import sqlalchemy as sa
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "announcements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "settings",
        sa.Column("key", sa.String(50), primary_key=True),
        sa.Column("value", sa.String(255), nullable=False),
    )
    op.create_table(
        "email_outbox",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("to_addr", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(10), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("last_error", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_email_outbox_status", "email_outbox", ["status"])

    # teams <-> users reference each other: create teams first, add teams.lead_id FK at the end
    op.create_table(
        "teams",
        sa.Column("id", sa.String(16), primary_key=True),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("lead_id", sa.String(16), nullable=True),
        sa.Column("members_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.String(16), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("participant", "admin", name="role"), nullable=False),
        sa.Column("status", sa.Enum("pending", "accepted", "rejected", name="status"), nullable=False),
        sa.Column("university", sa.String(160), nullable=False),
        sa.Column("field_of_study", sa.String(120), nullable=False),
        sa.Column("level", sa.String(40), nullable=False),
        sa.Column("skills", sa.Text(), nullable=False),
        sa.Column("experience", sa.String(20), nullable=False),
        sa.Column("github", sa.String(255), nullable=False),
        sa.Column("portfolio", sa.String(255), nullable=False),
        sa.Column("motivation", sa.Text(), nullable=False),
        sa.Column("previous_hackathons", sa.String(255), nullable=False),
        sa.Column("special_requirements", sa.String(255), nullable=False),
        sa.Column("submission_url", sa.String(500), nullable=False),
        sa.Column("team_id", sa.String(16), sa.ForeignKey("teams.id", ondelete="SET NULL"), nullable=True),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("checked_in_by", sa.String(16), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_status", "users", ["status"])
    op.create_foreign_key("fk_team_lead", "teams", "users", ["lead_id"], ["id"], ondelete="SET NULL")


def downgrade() -> None:
    op.drop_constraint("fk_team_lead", "teams", type_="foreignkey")
    op.drop_index("ix_users_status", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_table("teams")
    op.drop_index("ix_email_outbox_status", table_name="email_outbox")
    op.drop_table("email_outbox")
    op.drop_table("settings")
    op.drop_table("announcements")
    op.execute("DROP TYPE IF EXISTS status")
    op.execute("DROP TYPE IF EXISTS role")
