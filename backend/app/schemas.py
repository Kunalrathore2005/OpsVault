from datetime import datetime
import re
from pydantic import BaseModel, ConfigDict, Field, field_validator
from .models import Role, TaskStatus, Difficulty, ApprovalStatus

class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class Login(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str

    @field_validator("email")
    @classmethod
    def validate_login_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("value is not a valid email address")
        return value

class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8)
    full_name: str
    role: Role = Role.EMPLOYEE
    department_id: int | None = None

    @field_validator("email")
    @classmethod
    def validate_user_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("value is not a valid email address")
        return value

class UserUpdate(BaseModel):
    full_name: str | None = None
    role: Role | None = None
    department_id: int | None = None
    is_active: bool | None = None

class ProfileUpdateIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)

class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

class UserOut(ORM):
    id: int
    email: str
    full_name: str
    role: Role
    department_id: int | None = None
    department_name: str | None = None
    is_active: bool
    xp: int
    created_at: datetime

class PaginatedUsers(BaseModel):
    items: list[UserOut]
    page: int
    page_size: int
    total: int

class DepartmentIn(BaseModel):
    name: str
    description: str | None = None

class DepartmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class DepartmentAssign(BaseModel):
    user_id: int

class DepartmentOut(ORM):
    id: int
    name: str
    description: str | None = None

class DepartmentDetail(DepartmentOut):
    employees: list[UserOut] = []
    employee_count: int = 0

class TaskIn(BaseModel):
    title: str
    description: str | None = None
    priority: str = "MEDIUM"
    difficulty: Difficulty = Difficulty.MEDIUM
    due_date: datetime | None = None
    assignee_id: int | None = None
    department_id: int | None = None

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: str | None = None
    assignee_id: int | None = None
    department_id: int | None = None

class TaskOut(ORM):
    id: int
    title: str
    description: str | None = None
    status: TaskStatus
    priority: str
    difficulty: Difficulty
    due_date: datetime | None = None
    creator_id: int
    creator_name: str | None = None
    assignee_id: int | None = None
    assignee_name: str | None = None
    department_id: int | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None

class PaginatedTasks(BaseModel):
    items: list[TaskOut]
    page: int
    page_size: int
    total: int

class ApprovalIn(BaseModel):
    subject: str
    details: str

class ApprovalOut(ORM):
    id: int
    subject: str
    details: str
    status: ApprovalStatus
    requester_id: int
    requester_name: str | None = None
    requester_email: str | None = None
    reviewer_id: int | None = None
    reviewer_name: str | None = None
    comment: str | None = None
    created_at: datetime

class Decision(BaseModel):
    approved: bool
    comment: str | None = None

class NotificationOut(ORM):
    id: int
    title: str
    body: str
    type: str
    is_read: bool
    created_at: datetime

class XPOut(ORM):
    id: int
    amount: int
    reason: str
    source_type: str
    source_id: str
    created_at: datetime

class IncidentIn(BaseModel):
    title: str
    description: str
    severity: str = "MEDIUM"
    assignee_id: int | None = None
    department_id: int | None = None

class IncidentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    severity: str | None = None
    assignee_id: int | None = None
    resolution: str | None = None

class IncidentOut(ORM):
    id: int
    title: str
    description: str
    status: str
    severity: str
    reporter_id: int
    reporter_name: str | None = None
    assignee_id: int | None = None
    assignee_name: str | None = None
    department_id: int | None = None
    resolution: str | None = None
    created_at: datetime
    updated_at: datetime

class PaginatedIncidents(BaseModel):
    items: list[IncidentOut]
    page: int
    page_size: int
    total: int

class AssetIn(BaseModel):
    name: str
    asset_tag: str
    status: str = "AVAILABLE"
    assigned_to_id: int | None = None
    department_id: int | None = None

class AssetUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    assigned_to_id: int | None = None
    department_id: int | None = None

class AssetOut(ORM):
    id: int
    name: str
    asset_tag: str
    status: str
    assigned_to_id: int | None = None
    assigned_to_name: str | None = None
    department_id: int | None = None
    created_at: datetime

class PaginatedAssets(BaseModel):
    items: list[AssetOut]
    page: int
    page_size: int
    total: int

class DocumentOut(ORM):
    id: int
    original_name: str
    content_type: str
    size_bytes: int
    owner_id: int
    owner_name: str | None = None
    department_id: int | None = None
    created_at: datetime

class CollaborationIn(BaseModel):
    invitee_id: int

class CollaborationOut(ORM):
    id: int
    task_id: int
    inviter_id: int
    invitee_id: int
    status: str
    created_at: datetime

# ----------------- AUTOMATION ENGINE SCHEMAS -----------------

class AutomationCondition(BaseModel):
    field: str
    operator: str  # equals, not_equals, contains, greater_than, less_than
    value: str

class AutomationAction(BaseModel):
    type: str  # NOTIFY_USER, NOTIFY_MANAGER, NOTIFY_ADMIN, CREATE_ESCALATION, AUDIT_LOG
    target: str | None = None
    message: str | None = None
    level: str | None = None

class AutomationRuleIn(BaseModel):
    name: str
    description: str | None = None
    enabled: bool = True
    trigger_type: str
    conditions: list[AutomationCondition] | None = None
    actions: list[AutomationAction]
    department_id: int | None = None

class AutomationRuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    enabled: bool | None = None
    trigger_type: str | None = None
    conditions: list[AutomationCondition] | None = None
    actions: list[AutomationAction] | None = None
    department_id: int | None = None

class AutomationRuleOut(ORM):
    id: int
    name: str
    description: str | None = None
    enabled: bool
    trigger_type: str
    conditions: list[dict] | None = None
    actions: list[dict]
    department_id: int | None = None
    created_by_id: int
    last_run_at: datetime | None = None
    execution_count: int
    created_at: datetime
    updated_at: datetime

class AutomationExecutionOut(ORM):
    id: int
    rule_id: int
    rule_name: str
    status: str
    triggered_by: str
    details: str | None = None
    executed_at: datetime

# ----------------- ESCALATION SCHEMAS -----------------

class EscalationIn(BaseModel):
    source_type: str  # TASK, REQUEST, INCIDENT, DOCUMENT
    source_id: int
    title: str
    reason: str
    level: str = "LEVEL_1"  # LEVEL_1, LEVEL_2, CRITICAL
    assigned_to_id: int | None = None
    department_id: int | None = None

class EscalationUpdate(BaseModel):
    status: str | None = None  # OPEN, INVESTIGATING, RESOLVED, DISMISSED
    assigned_to_id: int | None = None
    resolution_notes: str | None = None

class EscalationOut(ORM):
    id: int
    source_type: str
    source_id: int
    title: str
    reason: str
    level: str
    status: str
    assigned_to_id: int | None = None
    assigned_to_name: str | None = None
    department_id: int | None = None
    created_at: datetime
    resolved_at: datetime | None = None
    resolution_notes: str | None = None

# ----------------- REPORT SCHEMAS -----------------

class ReportGenerateIn(BaseModel):
    report_type: str  # DAILY_OPS, WEEKLY_TASKS, EMPLOYEE_WORKLOAD, INCIDENT_SUMMARY, ASSET_INVENTORY, DEPT_PERFORMANCE, REQUEST_SLA
    format: str = "CSV"  # CSV, PDF, JSON
    department_id: int | None = None
    period: str = "ALL"  # TODAY, THIS_WEEK, THIS_MONTH, ALL

class ReportScheduleIn(BaseModel):
    name: str
    report_type: str
    frequency: str = "WEEKLY"
    day_of_week: str | None = "MONDAY"
    time_of_day: str = "09:00"
    format: str = "CSV"
    recipients: str
    enabled: bool = True
    department_id: int | None = None

class ReportScheduleUpdate(BaseModel):
    name: str | None = None
    report_type: str | None = None
    frequency: str | None = None
    day_of_week: str | None = None
    time_of_day: str | None = None
    format: str | None = None
    recipients: str | None = None
    enabled: bool | None = None
    department_id: int | None = None

class ReportScheduleOut(ORM):
    id: int
    name: str
    report_type: str
    frequency: str
    day_of_week: str | None = None
    time_of_day: str
    format: str
    recipients: str
    enabled: bool
    created_by_id: int
    department_id: int | None = None
    last_run_at: datetime | None = None
    next_run_at: datetime | None = None
    created_at: datetime

class ReportExecutionOut(ORM):
    id: int
    schedule_id: int | None = None
    report_type: str
    format: str
    status: str
    file_name: str | None = None
    recipients_sent: str | None = None
    error_message: str | None = None
    generated_by_id: int | None = None
    created_at: datetime

# ----------------- CALENDAR EVENT SCHEMAS -----------------

class CalendarEventIn(BaseModel):
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime | None = None
    event_type: str = "PERSONAL"  # PERSONAL, DEADLINE, MEETING, MAINTENANCE, REMINDER
    reminder_minutes: int = 15
    is_all_day: bool = False
    department_id: int | None = None

class CalendarEventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    event_type: str | None = None
    reminder_minutes: int | None = None
    is_all_day: bool | None = None

class CalendarEventOut(ORM):
    id: int
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime | None = None
    event_type: str
    reminder_minutes: int
    user_id: int
    department_id: int | None = None
    is_all_day: bool
    source: str = "CALENDAR_EVENT"
    created_at: datetime

# ----------------- SLA SUMMARY SCHEMAS -----------------

class SLASummaryOut(BaseModel):
    tasks_on_track: int
    tasks_due_soon: int
    tasks_overdue: int
    requests_on_track: int
    requests_due_soon: int
    requests_overdue: int
    incidents_on_track: int
    incidents_due_soon: int
    incidents_overdue: int
    open_escalations: int
    critical_escalations: int

# ----------------- COMMENT & SEARCH SCHEMAS -----------------

class CommentIn(BaseModel):
    content: str

class CommentOut(ORM):
    id: int
    target_type: str
    target_id: int
    author_id: int
    author_name: str
    author_role: str
    content: str
    created_at: datetime

class SearchResultItem(BaseModel):
    id: int | str
    type: str  # task, incident, user, asset, document, department
    title: str
    subtitle: str | None = None
    url: str
    badge: str | None = None

class GlobalSearchOut(BaseModel):
    results: list[SearchResultItem]



