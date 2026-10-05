"""add enterprise automation, escalation, reports, and calendar modules

Revision ID: 0003_enterprise_modules
Revises: 0002_operations_modules
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_enterprise_modules"
down_revision = "0002_operations_modules"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "automation_rules",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("trigger_type", sa.String(60), nullable=False),
        sa.Column("conditions", sa.Text, nullable=True),
        sa.Column("actions", sa.Text, nullable=False),
        sa.Column("department_id", sa.Integer, sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("created_by_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("execution_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "automation_executions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("rule_id", sa.Integer, sa.ForeignKey("automation_rules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rule_name", sa.String(160), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="SUCCESS"),
        sa.Column("triggered_by", sa.String(100), nullable=False),
        sa.Column("details", sa.Text, nullable=True),
        sa.Column("executed_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "escalations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("source_type", sa.String(50), nullable=False),
        sa.Column("source_id", sa.Integer, nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("reason", sa.Text, nullable=False),
        sa.Column("level", sa.String(30), nullable=False, server_default="LEVEL_1"),
        sa.Column("status", sa.String(30), nullable=False, server_default="OPEN"),
        sa.Column("assigned_to_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("department_id", sa.Integer, sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_notes", sa.Text, nullable=True),
    )

    op.create_table(
        "report_schedules",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("report_type", sa.String(60), nullable=False),
        sa.Column("frequency", sa.String(30), nullable=False, server_default="WEEKLY"),
        sa.Column("day_of_week", sa.String(20), nullable=True),
        sa.Column("time_of_day", sa.String(10), nullable=False, server_default="09:00"),
        sa.Column("format", sa.String(20), nullable=False, server_default="CSV"),
        sa.Column("recipients", sa.Text, nullable=False),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_by_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("department_id", sa.Integer, sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "report_executions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("schedule_id", sa.Integer, sa.ForeignKey("report_schedules.id", ondelete="SET NULL"), nullable=True),
        sa.Column("report_type", sa.String(60), nullable=False),
        sa.Column("format", sa.String(20), nullable=False, server_default="CSV"),
        sa.Column("status", sa.String(30), nullable=False, server_default="COMPLETED"),
        sa.Column("file_name", sa.String(255), nullable=True),
        sa.Column("recipients_sent", sa.Text, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("generated_by_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "calendar_events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False, server_default="PERSONAL"),
        sa.Column("reminder_minutes", sa.Integer, nullable=False, server_default="15"),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("department_id", sa.Integer, sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("is_all_day", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

def downgrade():
    op.drop_table("calendar_events")
    op.drop_table("report_executions")
    op.drop_table("report_schedules")
    op.drop_table("escalations")
    op.drop_table("automation_executions")
    op.drop_table("automation_rules")
