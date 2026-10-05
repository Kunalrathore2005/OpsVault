"""initial OpsVault schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-22
"""
from alembic import op
import sqlalchemy as sa
revision="0001_initial"; down_revision=None; branch_labels=None; depends_on=None
def upgrade():
    op.create_table("departments",sa.Column("id",sa.Integer,primary_key=True),sa.Column("name",sa.String(120),nullable=False,unique=True),sa.Column("description",sa.Text,nullable=True))
    op.create_table("users",sa.Column("id",sa.Integer,primary_key=True),sa.Column("email",sa.String(255),nullable=False,unique=True),sa.Column("password_hash",sa.String(255),nullable=False),sa.Column("full_name",sa.String(160),nullable=False),sa.Column("role",sa.String(20),nullable=False),sa.Column("department_id",sa.Integer,sa.ForeignKey("departments.id")),sa.Column("is_active",sa.Boolean,nullable=False),sa.Column("xp",sa.Integer,nullable=False),sa.Column("created_at",sa.DateTime(timezone=True),nullable=False))
    op.create_table("tasks",sa.Column("id",sa.Integer,primary_key=True),sa.Column("title",sa.String(200),nullable=False),sa.Column("description",sa.Text),sa.Column("status",sa.String(20),nullable=False),sa.Column("priority",sa.String(30),nullable=False),sa.Column("difficulty",sa.String(20),nullable=False),sa.Column("due_date",sa.DateTime(timezone=True)),sa.Column("creator_id",sa.Integer,sa.ForeignKey("users.id"),nullable=False),sa.Column("assignee_id",sa.Integer,sa.ForeignKey("users.id")),sa.Column("department_id",sa.Integer,sa.ForeignKey("departments.id")),sa.Column("created_at",sa.DateTime(timezone=True),nullable=False),sa.Column("updated_at",sa.DateTime(timezone=True),nullable=False),sa.Column("completed_at",sa.DateTime(timezone=True)))
    op.create_table("approvals",sa.Column("id",sa.Integer,primary_key=True),sa.Column("subject",sa.String(200),nullable=False),sa.Column("details",sa.Text,nullable=False),sa.Column("status",sa.String(20),nullable=False),sa.Column("requester_id",sa.Integer,sa.ForeignKey("users.id"),nullable=False),sa.Column("reviewer_id",sa.Integer,sa.ForeignKey("users.id")),sa.Column("comment",sa.Text),sa.Column("created_at",sa.DateTime(timezone=True),nullable=False))
    op.create_table("notifications",sa.Column("id",sa.Integer,primary_key=True),sa.Column("user_id",sa.Integer,sa.ForeignKey("users.id"),nullable=False),sa.Column("title",sa.String(200),nullable=False),sa.Column("body",sa.Text,nullable=False),sa.Column("type",sa.String(50),nullable=False),sa.Column("is_read",sa.Boolean,nullable=False),sa.Column("created_at",sa.DateTime(timezone=True),nullable=False))
    op.create_table("xp_transactions",sa.Column("id",sa.Integer,primary_key=True),sa.Column("user_id",sa.Integer,sa.ForeignKey("users.id"),nullable=False),sa.Column("amount",sa.Integer,nullable=False),sa.Column("reason",sa.String(255),nullable=False),sa.Column("source_type",sa.String(50),nullable=False),sa.Column("source_id",sa.String(100),nullable=False),sa.Column("created_at",sa.DateTime(timezone=True),nullable=False),sa.UniqueConstraint("user_id","source_type","source_id",name="uq_xp_source"))
def downgrade():
    op.drop_table("xp_transactions");op.drop_table("notifications");op.drop_table("approvals");op.drop_table("tasks");op.drop_table("users");op.drop_table("departments")
