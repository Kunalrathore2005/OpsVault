"""add comments table for tasks, incidents, and requests

Revision ID: 0004_comments_table
Revises: 0003_enterprise_modules
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_comments_table"
down_revision = "0003_enterprise_modules"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("target_type", sa.String(50), nullable=False, index=True),
        sa.Column("target_id", sa.Integer, nullable=False, index=True),
        sa.Column("author_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

def downgrade():
    op.drop_table("comments")

