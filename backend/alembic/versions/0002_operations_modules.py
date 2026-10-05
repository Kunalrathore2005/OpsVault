"""add operational modules

Revision ID: 0002_operations_modules
Revises: 0001_initial
"""
from alembic import op
import sqlalchemy as sa
revision="0002_operations_modules"; down_revision="0001_initial"; branch_labels=None; depends_on=None
def upgrade():
    op.create_table("incidents",sa.Column("id",sa.Integer,primary_key=True),sa.Column("title",sa.String(200),nullable=False),sa.Column("description",sa.Text,nullable=False),sa.Column("status",sa.String(30),nullable=False),sa.Column("severity",sa.String(30),nullable=False),sa.Column("reporter_id",sa.Integer,sa.ForeignKey("users.id"),nullable=False),sa.Column("assignee_id",sa.Integer,sa.ForeignKey("users.id")),sa.Column("department_id",sa.Integer,sa.ForeignKey("departments.id")),sa.Column("resolution",sa.Text),sa.Column("created_at",sa.DateTime(timezone=True),nullable=False),sa.Column("updated_at",sa.DateTime(timezone=True),nullable=False))
    op.create_table("assets",sa.Column("id",sa.Integer,primary_key=True),sa.Column("name",sa.String(160),nullable=False),sa.Column("asset_tag",sa.String(100),unique=True,nullable=False),sa.Column("status",sa.String(30),nullable=False),sa.Column("assigned_to_id",sa.Integer,sa.ForeignKey("users.id")),sa.Column("department_id",sa.Integer,sa.ForeignKey("departments.id")),sa.Column("created_at",sa.DateTime(timezone=True),nullable=False))
    op.create_table("documents",sa.Column("id",sa.Integer,primary_key=True),sa.Column("original_name",sa.String(255),nullable=False),sa.Column("stored_name",sa.String(255),unique=True,nullable=False),sa.Column("content_type",sa.String(100),nullable=False),sa.Column("size_bytes",sa.Integer,nullable=False),sa.Column("owner_id",sa.Integer,sa.ForeignKey("users.id"),nullable=False),sa.Column("department_id",sa.Integer,sa.ForeignKey("departments.id")),sa.Column("created_at",sa.DateTime(timezone=True),nullable=False))
    op.create_table("collaborations",sa.Column("id",sa.Integer,primary_key=True),sa.Column("task_id",sa.Integer,sa.ForeignKey("tasks.id"),nullable=False),sa.Column("inviter_id",sa.Integer,sa.ForeignKey("users.id"),nullable=False),sa.Column("invitee_id",sa.Integer,sa.ForeignKey("users.id"),nullable=False),sa.Column("status",sa.String(30),nullable=False),sa.Column("created_at",sa.DateTime(timezone=True),nullable=False),sa.UniqueConstraint("task_id","invitee_id",name="uq_collaboration_invitee"))
def downgrade():
    op.drop_table("collaborations");op.drop_table("documents");op.drop_table("assets");op.drop_table("incidents")
