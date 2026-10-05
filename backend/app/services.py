from sqlalchemy.orm import Session
from fastapi import HTTPException
from .models import User, Task, TaskStatus, Difficulty, XPTransaction, utcnow

XP_VALUES = {Difficulty.EASY: 50, Difficulty.MEDIUM: 100, Difficulty.HARD: 200}

TRANSITIONS = {
    TaskStatus.PENDING: {TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED},
    TaskStatus.IN_PROGRESS: {TaskStatus.PENDING, TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.OVERDUE},
    TaskStatus.OVERDUE: {TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED},
    TaskStatus.COMPLETED: {TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED},
    TaskStatus.CANCELLED: {TaskStatus.PENDING, TaskStatus.IN_PROGRESS}
}

def level_for_xp(xp: int):
    # cumulative quadratic curve, capped at level 100
    level = min(100, int((xp / 75) ** 0.5) + 1)
    current = 75 * (level - 1) ** 2
    next_xp = None if level == 100 else 75 * level ** 2
    return {
        "level": level,
        "xp_for_current_level": current,
        "xp_for_next_level": next_xp,
        "xp_progress": 100 if next_xp is None else round((xp - current) / (next_xp - current) * 100, 1)
    }

def award_task_xp(db: Session, task: Task):
    recipient = task.assignee_id or task.creator_id
    existing = db.query(XPTransaction).filter_by(
        user_id=recipient,
        source_type="TASK_COMPLETION",
        source_id=str(task.id)
    ).first()
    if existing:
        return
    amount = XP_VALUES.get(task.difficulty, 50)
    user = db.get(User, recipient)
    if user:
        user.xp += amount
        db.add(XPTransaction(
            user_id=recipient,
            amount=amount,
            reason=f"Completed {task.difficulty.value.lower() if hasattr(task.difficulty, 'value') else task.difficulty} task",
            source_type="TASK_COMPLETION",
            source_id=str(task.id)
        ))

def transition_task(db: Session, task: Task, new: TaskStatus):
    if new not in TRANSITIONS.get(task.status, set()):
        raise HTTPException(status_code=409, detail=f"Illegal task transition from {task.status.value} to {new.value}")
    task.status = new
    if new == TaskStatus.COMPLETED:
        task.completed_at = utcnow()
        award_task_xp(db, task)
    else:
        task.completed_at = None

# ----------------- SLA MANAGEMENT CALCULATIONS -----------------

from datetime import timedelta
from .models import Approval, ApprovalStatus, Incident, Escalation

def calculate_task_sla(task: Task) -> str:
    """Returns ON_TRACK, DUE_SOON, OVERDUE, RESOLVED, or DROPPED based on task state and deadline."""
    if task.status == TaskStatus.COMPLETED:
        return "RESOLVED"
    if task.status == TaskStatus.CANCELLED:
        return "DROPPED"
    if not task.due_date:
        return "ON_TRACK"
    
    now = utcnow()
    if task.due_date < now:
        return "OVERDUE"
    if task.due_date - now <= timedelta(hours=24):
        return "DUE_SOON"
    return "ON_TRACK"

def calculate_request_sla(approval: Approval) -> str:
    """Standard 48-hour SLA for management request decisions."""
    if approval.status != ApprovalStatus.PENDING:
        return "RESOLVED"
    
    now = utcnow()
    age = now - approval.created_at
    if age > timedelta(hours=48):
        return "OVERDUE"
    if age > timedelta(hours=24):
        return "DUE_SOON"
    return "ON_TRACK"

def calculate_incident_sla(incident: Incident) -> str:
    """Incident SLA based on severity target resolution time."""
    if incident.status in ("RESOLVED", "CLOSED"):
        return "RESOLVED"
    
    now = utcnow()
    age = now - incident.created_at
    
    # Severity thresholds: Critical=4h, High=12h, Medium=24h, Low=48h
    thresholds = {
        "CRITICAL": (timedelta(hours=4), timedelta(hours=2)),
        "HIGH": (timedelta(hours=12), timedelta(hours=8)),
        "MEDIUM": (timedelta(hours=24), timedelta(hours=16)),
        "LOW": (timedelta(hours=48), timedelta(hours=36)),
    }
    max_sla, warn_sla = thresholds.get(incident.severity.upper(), (timedelta(hours=24), timedelta(hours=16)))
    
    if age > max_sla:
        return "OVERDUE"
    if age > warn_sla:
        return "DUE_SOON"
    return "ON_TRACK"

def get_sla_summary(db: Session, department_id: int | None = None) -> dict:
    task_q = db.query(Task)
    appr_q = db.query(Approval)
    inc_q = db.query(Incident)
    esc_q = db.query(Escalation)

    if department_id:
        task_q = task_q.filter(Task.department_id == department_id)
        inc_q = inc_q.filter(Incident.department_id == department_id)
        esc_q = esc_q.filter(Escalation.department_id == department_id)

    tasks = task_q.all()
    approvals = appr_q.all()
    incidents = inc_q.all()
    escalations = esc_q.all()

    tasks_on_track = sum(1 for t in tasks if calculate_task_sla(t) == "ON_TRACK")
    tasks_due_soon = sum(1 for t in tasks if calculate_task_sla(t) == "DUE_SOON")
    tasks_overdue = sum(1 for t in tasks if calculate_task_sla(t) == "OVERDUE")

    req_on_track = sum(1 for a in approvals if calculate_request_sla(a) == "ON_TRACK")
    req_due_soon = sum(1 for a in approvals if calculate_request_sla(a) == "DUE_SOON")
    req_overdue = sum(1 for a in approvals if calculate_request_sla(a) == "OVERDUE")

    inc_on_track = sum(1 for i in incidents if calculate_incident_sla(i) == "ON_TRACK")
    inc_due_soon = sum(1 for i in incidents if calculate_incident_sla(i) == "DUE_SOON")
    inc_overdue = sum(1 for i in incidents if calculate_incident_sla(i) == "OVERDUE")

    open_esc = sum(1 for e in escalations if e.status in ("OPEN", "INVESTIGATING"))
    crit_esc = sum(1 for e in escalations if e.status in ("OPEN", "INVESTIGATING") and e.level == "CRITICAL")

    return {
        "tasks_on_track": tasks_on_track,
        "tasks_due_soon": tasks_due_soon,
        "tasks_overdue": tasks_overdue,
        "requests_on_track": req_on_track,
        "requests_due_soon": req_due_soon,
        "requests_overdue": req_overdue,
        "incidents_on_track": inc_on_track,
        "incidents_due_soon": inc_due_soon,
        "incidents_overdue": inc_overdue,
        "open_escalations": open_esc,
        "critical_escalations": crit_esc
    }


