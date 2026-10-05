import json
from datetime import timedelta
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, Depends, HTTPException, status, Query, UploadFile, File, Response, Body
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from .models import (
    User, Role, Department, Task, TaskStatus, Approval, ApprovalStatus,
    Notification, XPTransaction, Incident, Asset, Document, Collaboration,
    AutomationRule, AutomationExecution, Escalation, ReportSchedule, ReportExecution,
    CalendarEvent, Comment, utcnow
)
from .schemas import (
    Token, Login, UserCreate, UserUpdate, UserOut, PaginatedUsers,
    DepartmentIn, DepartmentUpdate, DepartmentAssign, DepartmentOut, DepartmentDetail,
    TaskIn, TaskUpdate, TaskOut, PaginatedTasks,
    ApprovalIn, ApprovalOut, Decision,
    NotificationOut, XPOut,
    IncidentIn, IncidentUpdate, IncidentOut, PaginatedIncidents,
    AssetIn, AssetUpdate, AssetOut, PaginatedAssets,
    DocumentOut, CollaborationIn, CollaborationOut,
    AutomationRuleIn, AutomationRuleUpdate, AutomationRuleOut, AutomationExecutionOut,
    EscalationIn, EscalationUpdate, EscalationOut,
    ReportGenerateIn, ReportScheduleIn, ReportScheduleUpdate, ReportScheduleOut, ReportExecutionOut,
    CalendarEventIn, CalendarEventUpdate, CalendarEventOut,
    SLASummaryOut, ProfileUpdateIn, PasswordChangeIn,
    CommentIn, CommentOut, SearchResultItem, GlobalSearchOut
)
from .security import hash_password, verify_password, create_token, decode_token
from .deps import current_user, roles, can_manage_departments, can_access_task, oauth2
from .services import transition_task, level_for_xp, get_sla_summary
from .automation_engine import trigger_automation
from .report_service import generate_report_file
from .email_service import send_email
from .config import settings
import logging

class HealthCheckFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        return not ("/health" in msg or "/docs" in msg)

logging.getLogger("uvicorn.access").addFilter(HealthCheckFilter())

app = FastAPI(title="OpsVault API", version="1.0.0", openapi_url="/api/v1/openapi.json", docs_url="/docs")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
P = "/api/v1"

@app.get("/health", include_in_schema=False)
@app.get("/api/v1/health", include_in_schema=False)
def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
def ensure_development_accounts():
    """Seed disposable local accounts only when explicitly enabled."""
    if not settings.dev_seed_users:
        return
    db = next(get_db())
    try:
        department = db.query(Department).filter_by(name="Operations").first()
        if not department:
            department = Department(name="Operations", description="Development operations team")
            db.add(department)
            db.flush()
        for email, name, role in [
            ("admin@opsvault.local", "Kunal", Role.ADMIN),
            ("manager@opsvault.local", "Maya Manager", Role.MANAGER),
            ("employee1@opsvault.local", "Arjun Employee", Role.EMPLOYEE),
            ("employee2@opsvault.local", "Riya Employee", Role.EMPLOYEE),
        ]:
            if not db.query(User).filter_by(email=email).first():
                db.add(User(
                    email=email,
                    full_name=name,
                    password_hash=hash_password("OpsVaultTest!2026"),
                    role=role,
                    department_id=department.id,
                    is_active=True
                ))
        db.commit()
    finally:
        db.close()

def enrich_user(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        department_id=u.department_id,
        department_name=u.department.name if u.department else None,
        is_active=u.is_active,
        xp=u.xp,
        created_at=u.created_at
    )

def enrich_task(t: Task, db: Session) -> TaskOut:
    creator = db.get(User, t.creator_id) if t.creator_id else None
    assignee = db.get(User, t.assignee_id) if t.assignee_id else None
    return TaskOut(
        id=t.id,
        title=t.title,
        description=t.description,
        status=t.status,
        priority=t.priority,
        difficulty=t.difficulty,
        due_date=t.due_date,
        creator_id=t.creator_id,
        creator_name=creator.full_name if creator else None,
        assignee_id=t.assignee_id,
        assignee_name=assignee.full_name if assignee else None,
        department_id=t.department_id,
        created_at=t.created_at,
        updated_at=t.updated_at,
        completed_at=t.completed_at
    )

def enrich_approval(a: Approval, db: Session) -> ApprovalOut:
    requester = db.get(User, a.requester_id) if a.requester_id else None
    reviewer = db.get(User, a.reviewer_id) if a.reviewer_id else None
    return ApprovalOut(
        id=a.id,
        subject=a.subject,
        details=a.details,
        status=a.status,
        requester_id=a.requester_id,
        requester_name=requester.full_name if requester else None,
        requester_email=requester.email if requester else None,
        reviewer_id=a.reviewer_id,
        reviewer_name=reviewer.full_name if reviewer else None,
        comment=a.comment,
        created_at=a.created_at
    )

def enrich_incident(inc: Incident, db: Session) -> IncidentOut:
    reporter = db.get(User, inc.reporter_id) if inc.reporter_id else None
    assignee = db.get(User, inc.assignee_id) if inc.assignee_id else None
    return IncidentOut(
        id=inc.id,
        title=inc.title,
        description=inc.description,
        status=inc.status,
        severity=inc.severity,
        reporter_id=inc.reporter_id,
        reporter_name=reporter.full_name if reporter else None,
        assignee_id=inc.assignee_id,
        assignee_name=assignee.full_name if assignee else None,
        department_id=inc.department_id,
        resolution=inc.resolution,
        created_at=inc.created_at,
        updated_at=inc.updated_at
    )

def enrich_asset(ast: Asset, db: Session) -> AssetOut:
    assigned_user = db.get(User, ast.assigned_to_id) if ast.assigned_to_id else None
    return AssetOut(
        id=ast.id,
        name=ast.name,
        asset_tag=ast.asset_tag,
        status=ast.status,
        assigned_to_id=ast.assigned_to_id,
        assigned_to_name=assigned_user.full_name if assigned_user else None,
        department_id=ast.department_id,
        created_at=ast.created_at
    )

def enrich_document(doc: Document, db: Session) -> DocumentOut:
    owner = db.get(User, doc.owner_id) if doc.owner_id else None
    return DocumentOut(
        id=doc.id,
        original_name=doc.original_name,
        content_type=doc.content_type,
        size_bytes=doc.size_bytes,
        owner_id=doc.owner_id,
        owner_name=owner.full_name if owner else None,
        department_id=doc.department_id,
        created_at=doc.created_at
    )

def paginate(query, page: int, page_size: int, enrich_fn=None):
    total = query.count()
    raw_items = query.offset((page - 1) * page_size).limit(page_size).all()
    if enrich_fn:
        items = [enrich_fn(item) for item in raw_items]
    else:
        items = raw_items
    return {"items": items, "page": page, "page_size": page_size, "total": total}

# ----------------- AUTH -----------------

@app.post(P+"/auth/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if data.role != Role.EMPLOYEE:
        raise HTTPException(403, "Public registration may only create employee accounts")
    if db.query(User).filter_by(email=data.email).first():
        raise HTTPException(409, "Email already exists")
    user = User(**data.model_dump(exclude={"password"}), password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return enrich_user(user)

@app.post(P+"/auth/login", response_model=Token)
def login(data: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=data.email).first()
    if not user or not user.is_active or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return Token(
        access_token=create_token(user.id, "access", timedelta(minutes=settings.access_token_minutes)),
        refresh_token=create_token(user.id, "refresh", timedelta(days=settings.refresh_token_days))
    )

@app.post(P+"/auth/refresh", response_model=Token)
def refresh(refresh_token: str):
    uid = decode_token(refresh_token, "refresh")
    return Token(
        access_token=create_token(uid, "access", timedelta(minutes=settings.access_token_minutes)),
        refresh_token=create_token(uid, "refresh", timedelta(days=settings.refresh_token_days))
    )

@app.post(P+"/auth/logout", status_code=204)
def logout(user: User = Depends(current_user)):
    return None

# ----------------- USERS -----------------

@app.get(P+"/users", response_model=PaginatedUsers)
def users(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(roles(Role.ADMIN, Role.MANAGER))
):
    q = db.query(User)
    if search:
        q = q.filter(User.full_name.ilike(f"%{search}%"))
    if user.role == Role.MANAGER:
        q = q.filter(User.department_id == user.department_id)
    return paginate(q, page, page_size, enrich_fn=enrich_user)

@app.post(P+"/users", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN))):
    if db.query(User).filter_by(email=data.email).first():
        raise HTTPException(409, "Email already exists")
    value = User(**data.model_dump(exclude={"password"}), password_hash=hash_password(data.password))
    db.add(value)
    db.commit()
    db.refresh(value)
    return enrich_user(value)

@app.patch(P+"/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(404, "User not found")
    changes = data.model_dump(exclude_none=True)
    if user.role == Role.MANAGER:
        if any(key in changes for key in {"role", "is_active"}):
            raise HTTPException(403, "Managers cannot change roles or account status.")
        if changes.get("department_id", user.department_id) != user.department_id:
            raise HTTPException(403, "Managers may only assign employees to their own department.")
        if target.department_id not in {None, user.department_id}:
            raise HTTPException(403, "You do not have permission to update this employee.")
    for k, v in changes.items():
        setattr(target, k, v)
    db.commit()
    db.refresh(target)
    return enrich_user(target)

@app.delete(P+"/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN))):
    if user.id == user_id:
        raise HTTPException(400, "Administrators cannot delete their own account.")
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(404, "User not found")
    
    # Safely handle references
    db.query(Task).filter(Task.assignee_id == user_id).update({Task.assignee_id: None})
    db.query(Asset).filter(Asset.assigned_to_id == user_id).update({Asset.assigned_to_id: None})
    db.query(Incident).filter(Incident.assignee_id == user_id).update({Incident.assignee_id: None})
    db.query(Collaboration).filter((Collaboration.inviter_id == user_id) | (Collaboration.invitee_id == user_id)).delete()
    db.query(Notification).filter(Notification.user_id == user_id).delete()
    db.query(XPTransaction).filter(XPTransaction.user_id == user_id).delete()
    
    # Unassign from department and remove
    db.delete(target)
    db.commit()

# ----------------- DEPARTMENTS -----------------

@app.get(P+"/departments", response_model=list[DepartmentDetail])
def departments(db: Session = Depends(get_db), user: User = Depends(current_user)):
    values = db.query(Department).all() if user.role in (Role.ADMIN, Role.MANAGER) else ([db.get(Department, user.department_id)] if user.department_id else [])
    result = []
    for value in values:
        if not value:
            continue
        emp_list = [enrich_user(employee) for employee in value.users]
        result.append(DepartmentDetail(
            id=value.id,
            name=value.name,
            description=value.description,
            employees=emp_list,
            employee_count=len(emp_list)
        ))
    return result

@app.post(P+"/departments", response_model=DepartmentOut, status_code=201)
def create_department(data: DepartmentIn, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN))):
    item = Department(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.patch(P+"/departments/{department_id}", response_model=DepartmentOut)
def update_department(department_id: int, data: DepartmentUpdate, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN))):
    item = db.get(Department, department_id)
    if not item:
        raise HTTPException(404, "Department not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item

@app.delete(P+"/departments/{department_id}", status_code=204)
def delete_department(department_id: int, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN))):
    item = db.get(Department, department_id)
    if not item:
        raise HTTPException(404, "Department not found")
    if item.users:
        raise HTTPException(409, "Reassign department employees before deleting this department")
    db.delete(item)
    db.commit()

@app.post(P+"/departments/{department_id}/employees", response_model=DepartmentDetail)
def assign_employee_to_department(
    department_id: int,
    data: DepartmentAssign,
    db: Session = Depends(get_db),
    user: User = Depends(can_manage_departments)
):
    dept = db.get(Department, department_id)
    if not dept:
        raise HTTPException(404, "Department not found")
    if user.role == Role.MANAGER and user.department_id != department_id:
        raise HTTPException(403, "Managers can only assign employees to their own department.")
    target_user = db.get(User, data.user_id)
    if not target_user:
        raise HTTPException(404, "Employee not found")
    target_user.department_id = department_id
    db.commit()
    db.refresh(dept)
    emp_list = [enrich_user(employee) for employee in dept.users]
    return DepartmentDetail(
        id=dept.id,
        name=dept.name,
        description=dept.description,
        employees=emp_list,
        employee_count=len(emp_list)
    )

@app.delete(P+"/departments/{department_id}/employees/{user_id}", status_code=204)
def remove_employee_from_department(
    department_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(can_manage_departments)
):
    dept = db.get(Department, department_id)
    if not dept:
        raise HTTPException(404, "Department not found")
    if user.role == Role.MANAGER and user.department_id != department_id:
        raise HTTPException(403, "Managers can only remove employees from their own department.")
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(404, "Employee not found")
    if target_user.department_id == department_id:
        target_user.department_id = None
        db.commit()

# ----------------- TASKS -----------------

@app.get(P+"/tasks", response_model=PaginatedTasks)
def tasks(
    page: int = 1,
    page_size: int = 20,
    status_filter: TaskStatus | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user)
):
    q = db.query(Task)
    if user.role == Role.EMPLOYEE:
        q = q.filter((Task.creator_id == user.id) | (Task.assignee_id == user.id))
    elif user.role == Role.MANAGER:
        q = q.filter((Task.department_id == user.department_id) | (Task.creator_id == user.id))
    if status_filter:
        q = q.filter(Task.status == status_filter)
    q = q.order_by(Task.created_at.desc())
    return paginate(q, page, page_size, enrich_fn=lambda t: enrich_task(t, db))

@app.post(P+"/tasks", response_model=TaskOut, status_code=201)
def create_task(data: TaskIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    values = data.model_dump()
    if user.role == Role.EMPLOYEE:
        # Personal work is strictly private to its creator; employees cannot assign tasks to others.
        if data.assignee_id is not None and data.assignee_id != user.id:
            raise HTTPException(403, "Employees cannot assign tasks to other users.")
        values["assignee_id"] = user.id
        values["department_id"] = user.department_id
    else:
        values["department_id"] = data.department_id or user.department_id

    item = Task(**values, creator_id=user.id)
    db.add(item)
    db.flush()

    # Notify assignee if task assigned to another user by Admin/Manager
    if item.assignee_id and item.assignee_id != user.id:
        db.add(Notification(
            user_id=item.assignee_id,
            title="New Task Assigned",
            body=f"You have been assigned to task: '{item.title}' by {user.full_name}.",
            type="TASK"
        ))

    db.commit()
    db.refresh(item)

    trigger_automation(
        db,
        trigger_type="TASK_CREATED",
        source_type="TASK",
        source_id=item.id,
        context={
            "id": item.id,
            "title": item.title,
            "assignee_id": item.assignee_id,
            "priority": item.priority,
            "department_id": item.department_id,
            "status": item.status.value if hasattr(item.status, "value") else str(item.status)
        }
    )

    return enrich_task(item, db)

@app.get(P+"/tasks/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Task, task_id)
    if not item:
        raise HTTPException(404, "Task not found")
    can_access_task(item, user)
    return enrich_task(item, db)

@app.patch(P+"/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Task, task_id)
    if not item:
        raise HTTPException(404, "Task not found")
    can_access_task(item, user)

    # Status update handling
    if data.status is not None:
        transition_task(db, item, data.status)

    changes = data.model_dump(exclude_none=True, exclude={"status"})
    if user.role == Role.EMPLOYEE:
        if item.creator_id != user.id:
            # Assigned task: employee cannot modify details (title, description, assignee, etc.)
            if changes:
                raise HTTPException(403, "Employees cannot modify details of assigned tasks.")
        else:
            # Personal task: employee cannot assign it to someone else
            if "assignee_id" in changes and changes["assignee_id"] != user.id:
                raise HTTPException(403, "Employees cannot assign personal tasks to other users.")
            # Restrict modifications to title and description only
            if any(key not in {"title", "description"} for key in changes):
                raise HTTPException(403, "Employees may only update personal task title and description.")

    for k, v in changes.items():
        setattr(item, k, v)

    db.commit()
    db.refresh(item)

    if data.status is not None:
        trigger_automation(
            db,
            trigger_type="TASK_COMPLETED" if data.status == TaskStatus.COMPLETED else "TASK_STATUS_CHANGED",
            source_type="TASK",
            source_id=item.id,
            context={
                "id": item.id,
                "title": item.title,
                "assignee_id": item.assignee_id,
                "priority": item.priority,
                "department_id": item.department_id,
                "status": data.status.value if hasattr(data.status, "value") else str(data.status)
            }
        )

    return enrich_task(item, db)

@app.delete(P+"/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Task, task_id)
    if not item:
        raise HTTPException(404, "Task not found")
    can_access_task(item, user)
    if user.role == Role.EMPLOYEE and item.creator_id != user.id:
        raise HTTPException(403, "Employees may only delete their personal tasks.")

    # Clean up collaborations to maintain FK integrity
    db.query(Collaboration).filter_by(task_id=task_id).delete()
    db.delete(item)
    db.commit()

# ----------------- APPROVALS / REQUESTS -----------------

@app.get(P+"/approvals", response_model=list[ApprovalOut])
def approvals(db: Session = Depends(get_db), user: User = Depends(current_user)):
    if user.role == Role.EMPLOYEE:
        items = db.query(Approval).filter(Approval.requester_id == user.id).order_by(Approval.created_at.desc()).all()
    elif user.role == Role.MANAGER:
        items = db.query(Approval).join(User, Approval.requester_id == User.id).filter(
            User.department_id == user.department_id
        ).order_by(Approval.created_at.desc()).all()
    else:
        items = db.query(Approval).order_by(Approval.created_at.desc()).all()
    return [enrich_approval(a, db) for a in items]

@app.post(P+"/approvals", response_model=ApprovalOut, status_code=201)
def create_approval(data: ApprovalIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = Approval(**data.model_dump(), requester_id=user.id)
    db.add(item)
    db.commit()
    db.refresh(item)

    trigger_automation(
        db,
        trigger_type="REQUEST_SUBMITTED",
        source_type="REQUEST",
        source_id=item.id,
        context={
            "id": item.id,
            "subject": item.subject,
            "details": item.details,
            "department_id": user.department_id,
            "requester_id": user.id
        }
    )

    return enrich_approval(item, db)

@app.post(P+"/approvals/{approval_id}/decision", response_model=ApprovalOut)
def decide(approval_id: int, data: Decision, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    item = db.get(Approval, approval_id)
    if not item:
        raise HTTPException(404, "Approval not found")
    requester = db.get(User, item.requester_id)
    if user.role == Role.MANAGER and requester and requester.department_id != user.department_id:
        raise HTTPException(403, "You do not have permission to decide this approval.")
    if item.status != ApprovalStatus.PENDING:
        raise HTTPException(409, "Approval has already been decided")

    item.status = ApprovalStatus.APPROVED if data.approved else ApprovalStatus.REJECTED
    item.reviewer_id = user.id
    item.comment = data.comment

    status_str = "approved" if data.approved else "rejected"
    db.add(Notification(
        user_id=item.requester_id,
        title=f"Request {status_str.title()}",
        body=f"Your request '{item.subject}' was {status_str} by {user.full_name}." + (f" Note: {data.comment}" if data.comment else ""),
        type="APPROVAL"
    ))

    db.commit()
    db.refresh(item)

    trigger_automation(
        db,
        trigger_type="REQUEST_DECIDED",
        source_type="REQUEST",
        source_id=item.id,
        context={
            "id": item.id,
            "subject": item.subject,
            "status": item.status.value if hasattr(item.status, "value") else str(item.status),
            "department_id": requester.department_id if requester else None,
            "requester_id": item.requester_id
        }
    )

    return enrich_approval(item, db)

@app.delete(P+"/approvals/{approval_id}", status_code=204)
def delete_approval(approval_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Approval, approval_id)
    if not item:
        raise HTTPException(404, "Approval not found")
    if user.role != Role.ADMIN and item.requester_id != user.id:
        raise HTTPException(403, "You do not have permission to delete this approval.")
    if user.role != Role.ADMIN and item.status != ApprovalStatus.PENDING:
        raise HTTPException(409, "Only pending approvals may be deleted")
    db.delete(item)
    db.commit()

# ----------------- NOTIFICATIONS -----------------

@app.get(P+"/notifications", response_model=list[NotificationOut])
def notifications(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.query(Notification).filter_by(user_id=user.id).order_by(Notification.created_at.desc()).all()

@app.post(P+"/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Notification, notification_id)
    if not item:
        raise HTTPException(404, "Notification not found")
    if item.user_id != user.id:
        raise HTTPException(403, "You do not have permission to access this notification.")
    item.is_read = True
    db.commit()
    db.refresh(item)
    return item

@app.delete(P+"/notifications/{notification_id}", status_code=204)
def delete_notification(notification_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Notification, notification_id)
    if not item:
        raise HTTPException(404, "Notification not found")
    if item.user_id != user.id:
        raise HTTPException(403, "You do not have permission to access this notification.")
    db.delete(item)
    db.commit()

# ----------------- PROFILE & XP -----------------

@app.get(P+"/profile", response_model=dict)
def profile(db: Session = Depends(get_db), user: User = Depends(current_user)):
    completed = db.query(Task).filter(Task.assignee_id == user.id, Task.status == TaskStatus.COMPLETED).count()
    active = db.query(Task).filter(Task.assignee_id == user.id, Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])).count()
    return {
        "profile": enrich_user(user).model_dump(),
        "department": user.department.name if user.department else None,
        "completed_tasks": completed,
        "active_tasks": active,
        "collaborations": 0,
        **level_for_xp(user.xp)
    }

@app.patch(P+"/profile", response_model=dict)
def update_profile(data: ProfileUpdateIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    user.full_name = data.full_name.strip()
    db.commit()
    db.refresh(user)
    completed = db.query(Task).filter(Task.assignee_id == user.id, Task.status == TaskStatus.COMPLETED).count()
    active = db.query(Task).filter(Task.assignee_id == user.id, Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])).count()
    return {
        "profile": enrich_user(user).model_dump(),
        "department": user.department.name if user.department else None,
        "completed_tasks": completed,
        "active_tasks": active,
        "collaborations": 0,
        **level_for_xp(user.xp)
    }

@app.post(P+"/profile/change-password", response_model=dict)
def change_password(data: PasswordChangeIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@app.get(P+"/profile/xp-history", response_model=list[XPOut])
def xp_history(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.query(XPTransaction).filter_by(user_id=user.id).order_by(XPTransaction.created_at.desc()).all()

def scoped(query, model, user, owner_field, department_field="department_id"):
    if user.role == Role.ADMIN:
        return query
    if user.role == Role.MANAGER:
        return query.filter(getattr(model, department_field) == user.department_id)
    return query.filter(getattr(model, owner_field) == user.id)

# ----------------- INCIDENTS -----------------

@app.get(P+"/incidents", response_model=PaginatedIncidents)
def incidents(page: int = 1, page_size: int = 20, db: Session = Depends(get_db), user: User = Depends(current_user)):
    q = scoped(db.query(Incident), Incident, user, "reporter_id").order_by(Incident.created_at.desc())
    return paginate(q, page, page_size, enrich_fn=lambda inc: enrich_incident(inc, db))

@app.post(P+"/incidents", response_model=IncidentOut, status_code=201)
def create_incident(data: IncidentIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    values = data.model_dump()
    values["department_id"] = data.department_id or user.department_id
    item = Incident(**values, reporter_id=user.id)
    db.add(item)
    db.commit()
    db.refresh(item)

    trigger_automation(
        db,
        trigger_type="INCIDENT_CREATED",
        source_type="INCIDENT",
        source_id=item.id,
        context={
            "id": item.id,
            "title": item.title,
            "severity": item.severity.value if hasattr(item.severity, "value") else str(item.severity),
            "department_id": item.department_id,
            "reporter_id": item.reporter_id,
            "status": item.status
        }
    )

    return enrich_incident(item, db)

@app.patch(P+"/incidents/{incident_id}", response_model=IncidentOut)
def update_incident(incident_id: int, data: IncidentUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Incident, incident_id)
    if not item:
        raise HTTPException(404, "Incident not found")
    permitted = scoped(db.query(Incident).filter_by(id=incident_id), Incident, user, "reporter_id").first()
    if not permitted:
        raise HTTPException(403, "You do not have permission to access this incident.")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)

    trigger_automation(
        db,
        trigger_type="INCIDENT_UPDATED",
        source_type="INCIDENT",
        source_id=item.id,
        context={
            "id": item.id,
            "title": item.title,
            "severity": item.severity.value if hasattr(item.severity, "value") else str(item.severity),
            "department_id": item.department_id,
            "status": item.status
        }
    )

    return enrich_incident(item, db)

@app.delete(P+"/incidents/{incident_id}", status_code=204)
def delete_incident(incident_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Incident, incident_id)
    if not item:
        raise HTTPException(404, "Incident not found")
    if user.role == Role.EMPLOYEE and item.reporter_id != user.id:
        raise HTTPException(403, "You do not have permission to delete this incident.")
    if user.role == Role.MANAGER and item.department_id != user.department_id:
        raise HTTPException(403, "You do not have permission to delete this incident.")
    db.delete(item)
    db.commit()

# ----------------- ASSETS -----------------

@app.get(P+"/assets", response_model=PaginatedAssets)
def assets(page: int = 1, page_size: int = 20, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if user.role == Role.ADMIN:
        q = db.query(Asset)
    else:
        q = db.query(Asset).filter((Asset.assigned_to_id == user.id) | (Asset.department_id == user.department_id))
    q = q.order_by(Asset.created_at.desc())
    return paginate(q, page, page_size, enrich_fn=lambda ast: enrich_asset(ast, db))

@app.post(P+"/assets", response_model=AssetOut, status_code=201)
def create_asset(data: AssetIn, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    if db.query(Asset).filter_by(asset_tag=data.asset_tag).first():
        raise HTTPException(409, "Asset tag already exists")
    values = data.model_dump()
    values["department_id"] = data.department_id or user.department_id
    item = Asset(**values)
    db.add(item)
    db.commit()
    db.refresh(item)
    return enrich_asset(item, db)

@app.patch(P+"/assets/{asset_id}", response_model=AssetOut)
def update_asset(asset_id: int, data: AssetUpdate, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    item = db.get(Asset, asset_id)
    if not item:
        raise HTTPException(404, "Asset not found")
    if user.role == Role.MANAGER and item.department_id != user.department_id:
        raise HTTPException(403, "You do not have permission to access this asset.")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return enrich_asset(item, db)

@app.delete(P+"/assets/{asset_id}", status_code=204)
def delete_asset(asset_id: int, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    item = db.get(Asset, asset_id)
    if not item:
        raise HTTPException(404, "Asset not found")
    if user.role == Role.MANAGER and item.department_id != user.department_id:
        raise HTTPException(403, "You do not have permission to delete this asset.")
    db.delete(item)
    db.commit()

# ----------------- DOCUMENTS -----------------

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "text/plain",
    "image/png",
    "image/jpeg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

@app.get(P+"/documents", response_model=list[DocumentOut])
def documents(db: Session = Depends(get_db), user: User = Depends(current_user)):
    docs = scoped(db.query(Document), Document, user, "owner_id").order_by(Document.created_at.desc()).all()
    return [enrich_document(doc, db) for doc in docs]

@app.post(P+"/documents", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    department_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(current_user)
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(422, "Unsupported document type")
    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if not raw or len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(422, "Document must be between 1 byte and 10 MB")
    suffix = Path(file.filename or "").suffix.lower()
    stored = f"{uuid4().hex}{suffix}"
    Path(settings.upload_dir, stored).write_bytes(raw)
    item = Document(
        original_name=Path(file.filename or "document").name,
        stored_name=stored,
        content_type=file.content_type,
        size_bytes=len(raw),
        owner_id=user.id,
        department_id=department_id or user.department_id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return enrich_document(item, db)

@app.get(P+"/documents/{document_id}/download")
def download_document(
    document_id: int,
    token: str | None = Query(None),
    auth_header: str | None = Depends(oauth2),
    db: Session = Depends(get_db)
):
    auth_token = auth_header or token
    if not auth_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user_id = decode_token(auth_token, "access")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    item = scoped(db.query(Document).filter_by(id=document_id), Document, user, "owner_id").first()
    if not item:
        raise HTTPException(404, "Document not found")
    file_path = Path(settings.upload_dir, item.stored_name)
    if not file_path.exists():
        raise HTTPException(404, "File not found on storage")
    return FileResponse(file_path, media_type=item.content_type, filename=item.original_name)

@app.delete(P+"/documents/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Document, document_id)
    if not item:
        raise HTTPException(404, "Document not found")
    if user.role != Role.ADMIN and item.owner_id != user.id:
        raise HTTPException(403, "You do not have permission to delete this document.")
    Path(settings.upload_dir, item.stored_name).unlink(missing_ok=True)
    db.delete(item)
    db.commit()

# ----------------- COLLABORATIONS -----------------

@app.get(P+"/tasks/{task_id}/collaborations", response_model=list[CollaborationOut])
def list_collaborations(task_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    can_access_task(task, user)
    return db.query(Collaboration).filter_by(task_id=task_id).all()

@app.post(P+"/tasks/{task_id}/collaborations", response_model=CollaborationOut, status_code=201)
def invite_collaborator(task_id: int, data: CollaborationIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    if task.creator_id != user.id and user.role not in (Role.ADMIN, Role.MANAGER):
        raise HTTPException(403, "Only a task owner or authorized manager may invite collaborators.")
    invitee = db.get(User, data.invitee_id)
    if not invitee or not invitee.is_active:
        raise HTTPException(422, "Invitee is not active")
    if db.query(Collaboration).filter_by(task_id=task_id, invitee_id=invitee.id).first():
        raise HTTPException(409, "A collaboration request already exists")
    item = Collaboration(task_id=task_id, inviter_id=user.id, invitee_id=invitee.id)
    db.add(item)
    db.add(Notification(
        user_id=invitee.id,
        title="Collaboration request",
        body=f"You were invited to collaborate on {task.title}",
        type="COLLABORATION"
    ))
    db.commit()
    db.refresh(item)
    return item

@app.post(P+"/collaborations/{collaboration_id}/respond", response_model=CollaborationOut)
def respond_collaboration(collaboration_id: int, accepted: bool, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.get(Collaboration, collaboration_id)
    if not item:
        raise HTTPException(404, "Collaboration request not found")
    if item.invitee_id != user.id:
        raise HTTPException(403, "You do not have permission to respond to this request.")
    if item.status != "PENDING":
        raise HTTPException(409, "Collaboration request has already been handled")
    item.status = "ACCEPTED" if accepted else "REJECTED"
    db.commit()
    db.refresh(item)
    return item

# ----------------- ENRICH HELPERS -----------------

def enrich_automation_rule(r: AutomationRule) -> AutomationRuleOut:
    conds = json.loads(r.conditions) if r.conditions else []
    acts = json.loads(r.actions) if r.actions else []
    return AutomationRuleOut(
        id=r.id,
        name=r.name,
        description=r.description,
        enabled=r.enabled,
        trigger_type=r.trigger_type,
        conditions=conds,
        actions=acts,
        department_id=r.department_id,
        created_by_id=r.created_by_id,
        last_run_at=r.last_run_at,
        execution_count=r.execution_count,
        created_at=r.created_at,
        updated_at=r.updated_at
    )

def enrich_escalation(e: Escalation, db: Session) -> EscalationOut:
    assigned = db.get(User, e.assigned_to_id) if e.assigned_to_id else None
    return EscalationOut(
        id=e.id,
        source_type=e.source_type,
        source_id=e.source_id,
        title=e.title,
        reason=e.reason,
        level=e.level,
        status=e.status,
        assigned_to_id=e.assigned_to_id,
        assigned_to_name=assigned.full_name if assigned else None,
        department_id=e.department_id,
        created_at=e.created_at,
        resolved_at=e.resolved_at,
        resolution_notes=e.resolution_notes
    )

def enrich_calendar_event(ev: CalendarEvent) -> CalendarEventOut:
    return CalendarEventOut(
        id=ev.id,
        title=ev.title,
        description=ev.description,
        start_time=ev.start_time,
        end_time=ev.end_time,
        event_type=ev.event_type,
        reminder_minutes=ev.reminder_minutes,
        user_id=ev.user_id,
        department_id=ev.department_id,
        is_all_day=ev.is_all_day,
        source="CALENDAR_EVENT",
        created_at=ev.created_at
    )

# ----------------- AUTOMATIONS -----------------

@app.get(P+"/automations", response_model=list[AutomationRuleOut])
def list_automations(db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    if user.role == Role.ADMIN:
        items = db.query(AutomationRule).order_by(AutomationRule.created_at.desc()).all()
    else:
        items = db.query(AutomationRule).filter(
            (AutomationRule.department_id == user.department_id) | (AutomationRule.created_by_id == user.id)
        ).order_by(AutomationRule.created_at.desc()).all()
    return [enrich_automation_rule(r) for r in items]

@app.post(P+"/automations", response_model=AutomationRuleOut, status_code=201)
def create_automation(data: AutomationRuleIn, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    conds_str = json.dumps([c.model_dump() for c in data.conditions]) if data.conditions else None
    acts_str = json.dumps([a.model_dump() for a in data.actions])
    
    rule = AutomationRule(
        name=data.name,
        description=data.description,
        enabled=data.enabled,
        trigger_type=data.trigger_type,
        conditions=conds_str,
        actions=acts_str,
        department_id=data.department_id or (user.department_id if user.role == Role.MANAGER else None),
        created_by_id=user.id
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return enrich_automation_rule(rule)

@app.patch(P+"/automations/{rule_id}", response_model=AutomationRuleOut)
def update_automation(rule_id: int, data: AutomationRuleUpdate, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    rule = db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(404, "Automation rule not found")
    if user.role == Role.MANAGER and rule.department_id != user.department_id and rule.created_by_id != user.id:
        raise HTTPException(403, "You do not have permission to modify this automation rule.")
    
    changes = data.model_dump(exclude_none=True)
    if "conditions" in changes and changes["conditions"] is not None:
        changes["conditions"] = json.dumps([c.model_dump() if hasattr(c, "model_dump") else c for c in data.conditions])
    if "actions" in changes and changes["actions"] is not None:
        changes["actions"] = json.dumps([a.model_dump() if hasattr(a, "model_dump") else a for a in data.actions])
    
    for k, v in changes.items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return enrich_automation_rule(rule)

@app.post(P+"/automations/{rule_id}/toggle", response_model=AutomationRuleOut)
def toggle_automation(rule_id: int, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    rule = db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(404, "Automation rule not found")
    if user.role == Role.MANAGER and rule.department_id != user.department_id and rule.created_by_id != user.id:
        raise HTTPException(403, "You do not have permission to modify this automation rule.")
    rule.enabled = not rule.enabled
    db.commit()
    db.refresh(rule)
    return enrich_automation_rule(rule)

@app.delete(P+"/automations/{rule_id}", status_code=204)
def delete_automation(rule_id: int, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    rule = db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(404, "Automation rule not found")
    if user.role == Role.MANAGER and rule.department_id != user.department_id and rule.created_by_id != user.id:
        raise HTTPException(403, "You do not have permission to delete this automation rule.")
    db.delete(rule)
    db.commit()

@app.post(P+"/automations/{rule_id}/trigger", response_model=AutomationExecutionOut)
def trigger_automation_manual(rule_id: int, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    rule = db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(404, "Automation rule not found")
    
    exec_record = AutomationExecution(
        rule_id=rule.id,
        rule_name=rule.name,
        status="SUCCESS",
        triggered_by=f"Manual Run by {user.full_name}",
        details=f"Manually triggered by {user.full_name} ({user.role})"
    )
    rule.last_run_at = utcnow()
    rule.execution_count += 1
    db.add(exec_record)
    db.commit()
    db.refresh(exec_record)
    return exec_record

@app.get(P+"/automations/executions", response_model=list[AutomationExecutionOut])
def list_automation_executions(db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    items = db.query(AutomationExecution).order_by(AutomationExecution.executed_at.desc()).limit(100).all()
    return items

@app.get(P+"/automations/{rule_id}/executions", response_model=list[AutomationExecutionOut])
def list_rule_executions(rule_id: int, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    items = db.query(AutomationExecution).filter_by(rule_id=rule_id).order_by(AutomationExecution.executed_at.desc()).limit(50).all()
    return items

# ----------------- ESCALATIONS -----------------

@app.get(P+"/escalations", response_model=list[EscalationOut])
def list_escalations(db: Session = Depends(get_db), user: User = Depends(current_user)):
    if user.role == Role.ADMIN:
        items = db.query(Escalation).order_by(Escalation.created_at.desc()).all()
    elif user.role == Role.MANAGER:
        items = db.query(Escalation).filter(
            (Escalation.department_id == user.department_id) | (Escalation.assigned_to_id == user.id)
        ).order_by(Escalation.created_at.desc()).all()
    else:
        items = db.query(Escalation).filter(Escalation.assigned_to_id == user.id).order_by(Escalation.created_at.desc()).all()
    return [enrich_escalation(e, db) for e in items]

@app.post(P+"/escalations", response_model=EscalationOut, status_code=201)
def create_escalation(data: EscalationIn, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    esc = Escalation(
        source_type=data.source_type,
        source_id=data.source_id,
        title=data.title,
        reason=data.reason,
        level=data.level,
        status="OPEN",
        assigned_to_id=data.assigned_to_id,
        department_id=data.department_id or user.department_id
    )
    db.add(esc)
    db.commit()
    db.refresh(esc)
    return enrich_escalation(esc, db)

@app.patch(P+"/escalations/{escalation_id}", response_model=EscalationOut)
def update_escalation(escalation_id: int, data: EscalationUpdate, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    esc = db.get(Escalation, escalation_id)
    if not esc:
        raise HTTPException(404, "Escalation not found")
    if user.role == Role.MANAGER and esc.department_id not in (None, user.department_id) and esc.assigned_to_id != user.id:
        raise HTTPException(403, "You do not have permission to modify this escalation.")
    
    if data.status is not None:
        esc.status = data.status
        if data.status in ("RESOLVED", "DISMISSED"):
            esc.resolved_at = utcnow()
        else:
            esc.resolved_at = None
    if data.assigned_to_id is not None:
        esc.assigned_to_id = data.assigned_to_id
    if data.resolution_notes is not None:
        esc.resolution_notes = data.resolution_notes
    
@app.post(P+"/escalations/{escalation_id}/resolve", response_model=EscalationOut)
def resolve_escalation_endpoint(escalation_id: int, data: dict = Body(...), db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    esc = db.get(Escalation, escalation_id)
    if not esc:
        raise HTTPException(404, "Escalation not found")
    if user.role == Role.MANAGER and esc.department_id not in (None, user.department_id) and esc.assigned_to_id != user.id:
        raise HTTPException(403, "You do not have permission to modify this escalation.")
    esc.status = "RESOLVED"
    esc.resolved_at = utcnow()
    esc.resolution_notes = data.get("resolution_note") or data.get("resolution_notes")
    db.commit()
    db.refresh(esc)
    return enrich_escalation(esc, db)

# ----------------- REPORTS & REPORT SCHEDULES -----------------

@app.get(P+"/reports/types")
def get_report_types(user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    return [
        {"id": "DAILY_OPS", "name": "Daily Operations Summary", "description": "High-level overview of daily task throughput, incident resolution, and pending requests."},
        {"id": "WEEKLY_TASKS", "name": "Weekly Task Status & Completion", "description": "Weekly task breakdown by department, priority, and completion velocity."},
        {"id": "EMPLOYEE_WORKLOAD", "name": "Employee Workload & Capacity", "description": "Individual team member task allocations, active counts, and completion efficiency."},
        {"id": "INCIDENT_RISK", "name": "Incident & Risk Analysis", "description": "Breakdown of open, in-progress, and critical operational incidents."},
        {"id": "ASSET_INVENTORY", "name": "Asset Inventory & Status", "description": "Tracking of hardware, software, and assigned operational equipment."},
        {"id": "DEPT_PERFORMANCE", "name": "Department Performance Metrics", "description": "Aggregated productivity and task turnaround time across all departments."},
        {"id": "REQUEST_SLA", "name": "Request & Approval SLA Report", "description": "SLA compliance, approval response times, and pending bottleneck analysis."}
    ]

@app.post(P+"/reports/generate")
def generate_report_endpoint(data: ReportGenerateIn, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    dept_id = data.department_id if user.role == Role.ADMIN else user.department_id
    fname, ctype, content = generate_report_file(
        db,
        report_type=data.report_type,
        format_type=data.format,
        department_id=dept_id,
        period=data.period
    )

    # Record execution
    exec_record = ReportExecution(
        report_type=data.report_type,
        format=data.format,
        status="COMPLETED",
        file_name=fname,
        generated_by_id=user.id
    )
    db.add(exec_record)
    db.commit()

    return Response(
        content=content,
        media_type=ctype,
        headers={"Content-Disposition": f'attachment; filename="{fname}"'}
    )

@app.get(P+"/reports/history", response_model=list[ReportExecutionOut])
def list_report_history(db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    q = db.query(ReportExecution).order_by(ReportExecution.created_at.desc())
    if user.role != Role.ADMIN:
        q = q.filter(ReportExecution.generated_by_id == user.id)
    return q.limit(50).all()

@app.get(P+"/report-schedules", response_model=list[ReportScheduleOut])
def list_report_schedules(db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    if user.role == Role.ADMIN:
        items = db.query(ReportSchedule).order_by(ReportSchedule.created_at.desc()).all()
    else:
        items = db.query(ReportSchedule).filter(
            (ReportSchedule.department_id == user.department_id) | (ReportSchedule.created_by_id == user.id)
        ).order_by(ReportSchedule.created_at.desc()).all()
    return items

@app.post(P+"/report-schedules", response_model=ReportScheduleOut, status_code=201)
def create_report_schedule(data: ReportScheduleIn, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    sched = ReportSchedule(
        name=data.name,
        report_type=data.report_type,
        frequency=data.frequency,
        day_of_week=data.day_of_week,
        time_of_day=data.time_of_day,
        format=data.format,
        recipients=data.recipients,
        enabled=data.enabled,
        created_by_id=user.id,
        department_id=data.department_id or (user.department_id if user.role == Role.MANAGER else None)
    )
    db.add(sched)
    db.commit()
    db.refresh(sched)
    return sched

@app.patch(P+"/report-schedules/{schedule_id}", response_model=ReportScheduleOut)
def update_report_schedule(schedule_id: int, data: ReportScheduleUpdate, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    sched = db.get(ReportSchedule, schedule_id)
    if not sched:
        raise HTTPException(404, "Report schedule not found")
    if user.role == Role.MANAGER and sched.department_id != user.department_id and sched.created_by_id != user.id:
        raise HTTPException(403, "You do not have permission to modify this report schedule.")
    
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(sched, k, v)
    db.commit()
    db.refresh(sched)
    return sched

@app.delete(P+"/report-schedules/{schedule_id}", status_code=204)
def delete_report_schedule(schedule_id: int, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    sched = db.get(ReportSchedule, schedule_id)
    if not sched:
        raise HTTPException(404, "Report schedule not found")
    if user.role == Role.MANAGER and sched.department_id != user.department_id and sched.created_by_id != user.id:
        raise HTTPException(403, "You do not have permission to delete this report schedule.")
    db.delete(sched)
    db.commit()

@app.post(P+"/report-schedules/{schedule_id}/run", response_model=ReportExecutionOut)
def run_report_schedule_now(schedule_id: int, db: Session = Depends(get_db), user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
    sched = db.get(ReportSchedule, schedule_id)
    if not sched:
        raise HTTPException(404, "Report schedule not found")
    
    fname, ctype, fbytes = generate_report_file(
        db,
        report_type=sched.report_type,
        format_type=sched.format,
        department_id=sched.department_id
    )

    recipients_list = [r.strip() for r in sched.recipients.split(",") if "@" in r]
    email_sent = False
    if recipients_list:
        email_sent = send_email(
            to_emails=recipients_list,
            subject=f"OpsVault Report: {sched.name}",
            body_text=f"Attached is your requested {sched.report_type} report.",
            attachment_name=fname,
            attachment_bytes=fbytes,
            attachment_mime=ctype
        )

    execution = ReportExecution(
        schedule_id=sched.id,
        report_type=sched.report_type,
        format=sched.format,
        status="COMPLETED" if (not recipients_list or email_sent) else "FAILED",
        file_name=fname,
        recipients_sent=sched.recipients,
        generated_by_id=user.id
    )
    sched.last_run_at = utcnow()
    db.add(execution)
    db.commit()
    db.refresh(execution)
    return execution

# ----------------- PERSONAL CALENDAR -----------------

@app.get(P+"/calendar/events")
def list_calendar_events(
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(current_user)
):
    """
    Returns personal calendar events merged with relevant operational deadlines:
    - User's personal events
    - Assigned & created tasks with due_date
    - Open Incidents
    - Pending requests
    """
    results = []

    # 1. User's personal calendar events
    personal_events = db.query(CalendarEvent).filter(CalendarEvent.user_id == user.id).all()
    for pe in personal_events:
        results.append({
            "id": f"event-{pe.id}",
            "raw_id": pe.id,
            "title": pe.title,
            "description": pe.description,
            "start_time": pe.start_time.isoformat(),
            "end_time": pe.end_time.isoformat() if pe.end_time else None,
            "event_type": pe.event_type,
            "reminder_minutes": pe.reminder_minutes,
            "is_all_day": pe.is_all_day,
            "source": "PERSONAL",
            "link": "/profile"
        })

    # 2. Tasks with due dates
    task_q = db.query(Task).filter(Task.due_date != None)
    if user.role == Role.EMPLOYEE:
        task_q = task_q.filter((Task.assignee_id == user.id) | (Task.creator_id == user.id))
    elif user.role == Role.MANAGER:
        task_q = task_q.filter((Task.department_id == user.department_id) | (Task.creator_id == user.id))
    
    tasks = task_q.all()
    for t in tasks:
        results.append({
            "id": f"task-{t.id}",
            "raw_id": t.id,
            "title": f"Task: {t.title}",
            "description": f"Priority: {t.priority} · Status: {t.status.value if hasattr(t.status, 'value') else str(t.status)}",
            "start_time": t.due_date.isoformat(),
            "end_time": (t.due_date + timedelta(hours=1)).isoformat(),
            "event_type": "DEADLINE",
            "reminder_minutes": 30,
            "is_all_day": False,
            "source": "TASK",
            "link": "/tasks"
        })

    # 3. Incidents
    inc_q = db.query(Incident)
    if user.role == Role.EMPLOYEE:
        inc_q = inc_q.filter((Incident.reporter_id == user.id) | (Incident.assignee_id == user.id))
    elif user.role == Role.MANAGER:
        inc_q = inc_q.filter(Incident.department_id == user.department_id)
    
    incidents = inc_q.all()
    for inc in incidents:
        results.append({
            "id": f"inc-{inc.id}",
            "raw_id": inc.id,
            "title": f"Incident: {inc.title}",
            "description": f"Severity: {inc.severity} · Status: {inc.status}",
            "start_time": inc.created_at.isoformat(),
            "end_time": None,
            "event_type": "INCIDENT",
            "reminder_minutes": 15,
            "is_all_day": False,
            "source": "INCIDENT",
            "link": "/incidents"
        })

    # Sort chronological
    results.sort(key=lambda x: x["start_time"])
    return results

@app.post(P+"/calendar/events", response_model=CalendarEventOut, status_code=201)
def create_calendar_event(data: CalendarEventIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    ev = CalendarEvent(
        title=data.title,
        description=data.description,
        start_time=data.start_time,
        end_time=data.end_time,
        event_type=data.event_type,
        reminder_minutes=data.reminder_minutes,
        is_all_day=data.is_all_day,
        user_id=user.id,
        department_id=user.department_id
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return enrich_calendar_event(ev)

@app.patch(P+"/calendar/events/{event_id}", response_model=CalendarEventOut)
def update_calendar_event(event_id: int, data: CalendarEventUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    ev = db.get(CalendarEvent, event_id)
    if not ev:
        raise HTTPException(404, "Calendar event not found")
    if ev.user_id != user.id and user.role != Role.ADMIN:
        raise HTTPException(403, "You do not have permission to modify this calendar event.")
    
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(ev, k, v)
    db.commit()
    db.refresh(ev)
    return enrich_calendar_event(ev)

@app.delete(P+"/calendar/events/{event_id}", status_code=204)
def delete_calendar_event(event_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    ev = db.get(CalendarEvent, event_id)
    if not ev:
        raise HTTPException(404, "Calendar event not found")
    if ev.user_id != user.id and user.role != Role.ADMIN:
        raise HTTPException(403, "You do not have permission to delete this calendar event.")
    db.delete(ev)
    db.commit()

# ----------------- SLA SUMMARY -----------------

@app.get(P+"/sla/summary", response_model=SLASummaryOut)
def sla_summary_endpoint(db: Session = Depends(get_db), user: User = Depends(current_user)):
    dept_id = user.department_id if user.role == Role.MANAGER else None
    return get_sla_summary(db, department_id=dept_id)

# ----------------- COMMENTS & ACTIVITY THREADS -----------------

def enrich_comment(c: Comment) -> CommentOut:
    role_str = c.author.role.value if hasattr(c.author.role, 'value') else str(c.author.role)
    return CommentOut(
        id=c.id,
        target_type=c.target_type,
        target_id=c.target_id,
        author_id=c.author_id,
        author_name=c.author.full_name,
        author_role=role_str,
        content=c.content,
        created_at=c.created_at
    )

@app.get(P+"/comments/{target_type}/{target_id}", response_model=list[CommentOut])
def list_comments(target_type: str, target_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    comments = db.query(Comment).filter_by(
        target_type=target_type.upper(),
        target_id=target_id
    ).order_by(Comment.created_at.asc()).all()
    return [enrich_comment(c) for c in comments]

@app.post(P+"/comments/{target_type}/{target_id}", response_model=CommentOut)
def create_comment(target_type: str, target_id: int, data: CommentIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not data.content.strip():
        raise HTTPException(400, "Comment content cannot be empty")
    
    t_type = target_type.upper()
    c = Comment(
        target_type=t_type,
        target_id=target_id,
        author_id=user.id,
        content=data.content.strip()
    )
    db.add(c)
    db.flush()

    # Create notification for assignee/reporter if different user
    if t_type == "TASK":
        task = db.get(Task, target_id)
        if task and task.assignee_id and task.assignee_id != user.id:
            db.add(Notification(
                user_id=task.assignee_id,
                title=f"New comment on Task: {task.title}",
                body=f"{user.full_name}: {data.content[:100]}",
                type="COMMENT"
            ))
    elif t_type == "INCIDENT":
        inc = db.get(Incident, target_id)
        if inc and inc.reporter_id and inc.reporter_id != user.id:
            db.add(Notification(
                user_id=inc.reporter_id,
                title=f"New comment on Incident: {inc.title}",
                body=f"{user.full_name}: {data.content[:100]}",
                type="COMMENT"
            ))

    db.commit()
    db.refresh(c)
    return enrich_comment(c)

# ----------------- UNIVERSAL GLOBAL SEARCH -----------------

@app.get(P+"/search", response_model=GlobalSearchOut)
def global_search(q: str = Query(..., min_length=1), db: Session = Depends(get_db), user: User = Depends(current_user)):
    term = f"%{q.strip()}%"
    results: list[SearchResultItem] = []

    # Search Tasks
    tasks = db.query(Task).filter(
        (Task.title.ilike(term)) | (Task.description.ilike(term))
    ).limit(6).all()
    for t in tasks:
        results.append(SearchResultItem(
            id=t.id,
            type="task",
            title=t.title,
            subtitle=f"Status: {t.status.value if hasattr(t.status, 'value') else t.status} • Priority: {t.priority}",
            url="/tasks",
            badge=t.priority
        ))

    # Search Incidents
    incidents = db.query(Incident).filter(
        (Incident.title.ilike(term)) | (Incident.description.ilike(term))
    ).limit(6).all()
    for inc in incidents:
        results.append(SearchResultItem(
            id=inc.id,
            type="incident",
            title=inc.title,
            subtitle=f"Severity: {inc.severity} • Status: {inc.status}",
            url="/incidents",
            badge=inc.severity
        ))

    # Search Requests
    approvals = db.query(Approval).filter(
        (Approval.subject.ilike(term)) | (Approval.details.ilike(term))
    ).limit(5).all()
    for a in approvals:
        results.append(SearchResultItem(
            id=a.id,
            type="request",
            title=a.subject,
            subtitle=f"Status: {a.status.value if hasattr(a.status, 'value') else a.status}",
            url="/approvals",
            badge="Request"
        ))

    # Search Users (Admin / Manager)
    if user.role in [Role.ADMIN, Role.MANAGER]:
        users = db.query(User).filter(
            (User.full_name.ilike(term)) | (User.email.ilike(term))
        ).limit(5).all()
        for u in users:
            results.append(SearchResultItem(
                id=u.id,
                type="user",
                title=u.full_name,
                subtitle=f"{u.email} • {u.role.value if hasattr(u.role, 'value') else u.role}",
                url="/employees",
                badge=u.role.value if hasattr(u.role, 'value') else str(u.role)
            ))

    # Search Assets
    assets = db.query(Asset).filter(
        (Asset.name.ilike(term)) | (Asset.asset_tag.ilike(term))
    ).limit(5).all()
    for ast in assets:
        results.append(SearchResultItem(
            id=ast.id,
            type="asset",
            title=ast.name,
            subtitle=f"Tag: {ast.asset_tag} • Status: {ast.status}",
            url="/assets",
            badge=ast.status
        ))

    # Search Documents
    docs = db.query(Document).filter(
        Document.original_name.ilike(term)
    ).limit(5).all()
    for d in docs:
        results.append(SearchResultItem(
            id=d.id,
            type="document",
            title=d.original_name,
            subtitle=f"Size: {(d.size_bytes/1024):.1f} KB",
            url="/documents",
            badge="Doc"
        ))

    return GlobalSearchOut(results=results)


