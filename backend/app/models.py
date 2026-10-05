import enum
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, Enum, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

def utcnow(): return datetime.now(timezone.utc)
class Role(str, enum.Enum): ADMIN="ADMIN"; MANAGER="MANAGER"; EMPLOYEE="EMPLOYEE"
class TaskStatus(str, enum.Enum): PENDING="PENDING"; IN_PROGRESS="IN_PROGRESS"; COMPLETED="COMPLETED"; CANCELLED="CANCELLED"; OVERDUE="OVERDUE"
class Difficulty(str, enum.Enum): EASY="EASY"; MEDIUM="MEDIUM"; HARD="HARD"
class ApprovalStatus(str, enum.Enum): PENDING="PENDING"; APPROVED="APPROVED"; REJECTED="REJECTED"

class Department(Base):
    __tablename__="departments"
    id: Mapped[int]=mapped_column(primary_key=True); name: Mapped[str]=mapped_column(String(120), unique=True); description: Mapped[str|None]=mapped_column(Text, nullable=True)
    users: Mapped[list["User"]]=relationship(back_populates="department")
class User(Base):
    __tablename__="users"
    id: Mapped[int]=mapped_column(primary_key=True); email: Mapped[str]=mapped_column(String(255), unique=True, index=True); password_hash: Mapped[str]=mapped_column(String(255)); full_name: Mapped[str]=mapped_column(String(160)); role: Mapped[Role]=mapped_column(Enum(Role, native_enum=False, length=20), default=Role.EMPLOYEE); department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id"), nullable=True); is_active: Mapped[bool]=mapped_column(Boolean, default=True); xp: Mapped[int]=mapped_column(Integer, default=0); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow)
    department: Mapped[Department|None]=relationship(back_populates="users")
class Task(Base):
    __tablename__="tasks"
    id: Mapped[int]=mapped_column(primary_key=True); title: Mapped[str]=mapped_column(String(200)); description: Mapped[str|None]=mapped_column(Text, nullable=True); status: Mapped[TaskStatus]=mapped_column(Enum(TaskStatus, native_enum=False, length=20), default=TaskStatus.PENDING); priority: Mapped[str]=mapped_column(String(30), default="MEDIUM"); difficulty: Mapped[Difficulty]=mapped_column(Enum(Difficulty, native_enum=False, length=20), default=Difficulty.MEDIUM); due_date: Mapped[datetime|None]=mapped_column(DateTime(timezone=True), nullable=True); creator_id: Mapped[int]=mapped_column(ForeignKey("users.id")); assignee_id: Mapped[int|None]=mapped_column(ForeignKey("users.id"), nullable=True); department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id"), nullable=True); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow); updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow); completed_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True), nullable=True)
class Approval(Base):
    __tablename__="approvals"
    id: Mapped[int]=mapped_column(primary_key=True); subject: Mapped[str]=mapped_column(String(200)); details: Mapped[str]=mapped_column(Text); status: Mapped[ApprovalStatus]=mapped_column(Enum(ApprovalStatus, native_enum=False, length=20), default=ApprovalStatus.PENDING); requester_id: Mapped[int]=mapped_column(ForeignKey("users.id")); reviewer_id: Mapped[int|None]=mapped_column(ForeignKey("users.id"), nullable=True); comment: Mapped[str|None]=mapped_column(Text, nullable=True); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow)
class Notification(Base):
    __tablename__="notifications"
    id: Mapped[int]=mapped_column(primary_key=True); user_id: Mapped[int]=mapped_column(ForeignKey("users.id"), index=True); title: Mapped[str]=mapped_column(String(200)); body: Mapped[str]=mapped_column(Text); type: Mapped[str]=mapped_column(String(50), default="INFO"); is_read: Mapped[bool]=mapped_column(Boolean, default=False); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow)
class XPTransaction(Base):
    __tablename__="xp_transactions"; __table_args__=(UniqueConstraint("user_id","source_type","source_id", name="uq_xp_source"),)
    id: Mapped[int]=mapped_column(primary_key=True); user_id: Mapped[int]=mapped_column(ForeignKey("users.id")); amount: Mapped[int]=mapped_column(Integer); reason: Mapped[str]=mapped_column(String(255)); source_type: Mapped[str]=mapped_column(String(50)); source_id: Mapped[str]=mapped_column(String(100)); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow)
class Incident(Base):
    __tablename__="incidents"
    id: Mapped[int]=mapped_column(primary_key=True); title: Mapped[str]=mapped_column(String(200)); description: Mapped[str]=mapped_column(Text); status: Mapped[str]=mapped_column(String(30),default="OPEN"); severity: Mapped[str]=mapped_column(String(30),default="MEDIUM"); reporter_id: Mapped[int]=mapped_column(ForeignKey("users.id")); assignee_id: Mapped[int|None]=mapped_column(ForeignKey("users.id"),nullable=True); department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id"),nullable=True); resolution: Mapped[str|None]=mapped_column(Text,nullable=True); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow); updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow,onupdate=utcnow)
class Asset(Base):
    __tablename__="assets"
    id: Mapped[int]=mapped_column(primary_key=True); name: Mapped[str]=mapped_column(String(160)); asset_tag: Mapped[str]=mapped_column(String(100),unique=True); status: Mapped[str]=mapped_column(String(30),default="AVAILABLE"); assigned_to_id: Mapped[int|None]=mapped_column(ForeignKey("users.id"),nullable=True); department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id"),nullable=True); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow)
class Document(Base):
    __tablename__="documents"
    id: Mapped[int]=mapped_column(primary_key=True); original_name: Mapped[str]=mapped_column(String(255)); stored_name: Mapped[str]=mapped_column(String(255),unique=True); content_type: Mapped[str]=mapped_column(String(100)); size_bytes: Mapped[int]=mapped_column(Integer); owner_id: Mapped[int]=mapped_column(ForeignKey("users.id")); department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id"),nullable=True); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow)
class Collaboration(Base):
    __tablename__="collaborations"; __table_args__=(UniqueConstraint("task_id","invitee_id",name="uq_collaboration_invitee"),)
    id: Mapped[int]=mapped_column(primary_key=True); task_id: Mapped[int]=mapped_column(ForeignKey("tasks.id")); inviter_id: Mapped[int]=mapped_column(ForeignKey("users.id")); invitee_id: Mapped[int]=mapped_column(ForeignKey("users.id")); status: Mapped[str]=mapped_column(String(30),default="PENDING"); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow)

class AutomationRule(Base):
    __tablename__="automation_rules"
    id: Mapped[int]=mapped_column(primary_key=True)
    name: Mapped[str]=mapped_column(String(160))
    description: Mapped[str|None]=mapped_column(Text, nullable=True)
    enabled: Mapped[bool]=mapped_column(Boolean, default=True)
    trigger_type: Mapped[str]=mapped_column(String(60))
    conditions: Mapped[str|None]=mapped_column(Text, nullable=True)  # JSON formatted
    actions: Mapped[str]=mapped_column(Text)  # JSON formatted
    department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id"), nullable=True)
    created_by_id: Mapped[int]=mapped_column(ForeignKey("users.id"))
    last_run_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True), nullable=True)
    execution_count: Mapped[int]=mapped_column(Integer, default=0)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

class AutomationExecution(Base):
    __tablename__="automation_executions"
    id: Mapped[int]=mapped_column(primary_key=True)
    rule_id: Mapped[int]=mapped_column(ForeignKey("automation_rules.id", ondelete="CASCADE"))
    rule_name: Mapped[str]=mapped_column(String(160))
    status: Mapped[str]=mapped_column(String(30), default="SUCCESS")
    triggered_by: Mapped[str]=mapped_column(String(100))
    details: Mapped[str|None]=mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow)

class Escalation(Base):
    __tablename__="escalations"
    id: Mapped[int]=mapped_column(primary_key=True)
    source_type: Mapped[str]=mapped_column(String(50))  # TASK, REQUEST, INCIDENT, DOCUMENT
    source_id: Mapped[int]=mapped_column(Integer)
    title: Mapped[str]=mapped_column(String(200))
    reason: Mapped[str]=mapped_column(Text)
    level: Mapped[str]=mapped_column(String(30), default="LEVEL_1")  # LEVEL_1, LEVEL_2, CRITICAL
    status: Mapped[str]=mapped_column(String(30), default="OPEN")    # OPEN, INVESTIGATING, RESOLVED, DISMISSED
    assigned_to_id: Mapped[int|None]=mapped_column(ForeignKey("users.id"), nullable=True)
    department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id"), nullable=True)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow)
    resolved_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True), nullable=True)
    resolution_notes: Mapped[str|None]=mapped_column(Text, nullable=True)

class ReportSchedule(Base):
    __tablename__="report_schedules"
    id: Mapped[int]=mapped_column(primary_key=True)
    name: Mapped[str]=mapped_column(String(160))
    report_type: Mapped[str]=mapped_column(String(60))  # DAILY_OPS, WEEKLY_TASKS, EMPLOYEE_WORKLOAD, INCIDENT_SUMMARY, ASSET_INVENTORY, DEPT_PERFORMANCE, REQUEST_SLA
    frequency: Mapped[str]=mapped_column(String(30), default="WEEKLY")  # DAILY, WEEKLY, MONTHLY
    day_of_week: Mapped[str|None]=mapped_column(String(20), nullable=True)  # MONDAY, TUESDAY...
    time_of_day: Mapped[str]=mapped_column(String(10), default="09:00")
    format: Mapped[str]=mapped_column(String(20), default="CSV")  # CSV, PDF, JSON
    recipients: Mapped[str]=mapped_column(Text)  # Emails / roles
    enabled: Mapped[bool]=mapped_column(Boolean, default=True)
    created_by_id: Mapped[int]=mapped_column(ForeignKey("users.id"))
    department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id"), nullable=True)
    last_run_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow)

class ReportExecution(Base):
    __tablename__="report_executions"
    id: Mapped[int]=mapped_column(primary_key=True)
    schedule_id: Mapped[int|None]=mapped_column(ForeignKey("report_schedules.id", ondelete="SET NULL"), nullable=True)
    report_type: Mapped[str]=mapped_column(String(60))
    format: Mapped[str]=mapped_column(String(20), default="CSV")
    status: Mapped[str]=mapped_column(String(30), default="COMPLETED")
    file_name: Mapped[str|None]=mapped_column(String(255), nullable=True)
    recipients_sent: Mapped[str|None]=mapped_column(Text, nullable=True)
    error_message: Mapped[str|None]=mapped_column(Text, nullable=True)
    generated_by_id: Mapped[int|None]=mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow)

class CalendarEvent(Base):
    __tablename__="calendar_events"
    id: Mapped[int]=mapped_column(primary_key=True)
    title: Mapped[str]=mapped_column(String(200))
    description: Mapped[str|None]=mapped_column(Text, nullable=True)
    start_time: Mapped[datetime]=mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime|None]=mapped_column(DateTime(timezone=True), nullable=True)
    event_type: Mapped[str]=mapped_column(String(50), default="PERSONAL")  # PERSONAL, DEADLINE, MEETING, MAINTENANCE, REMINDER
    reminder_minutes: Mapped[int]=mapped_column(Integer, default=15)
    user_id: Mapped[int]=mapped_column(ForeignKey("users.id"))
    department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id"), nullable=True)
    is_all_day: Mapped[bool]=mapped_column(Boolean, default=False)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=utcnow)

class Comment(Base):
    __tablename__ = "comments"
    id: Mapped[int] = mapped_column(primary_key=True)
    target_type: Mapped[str] = mapped_column(String(50), index=True)  # TASK, INCIDENT, REQUEST
    target_id: Mapped[int] = mapped_column(Integer, index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    author: Mapped["User"] = relationship()


