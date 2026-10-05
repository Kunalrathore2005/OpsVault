import logging
from datetime import datetime, timezone, timedelta
from celery import Celery
from .config import settings

logger = logging.getLogger(__name__)

# Keep slow work (email, document processing, scheduled cleanup) out of request handlers.
broker_url = "redis://redis:6379/0"
celery = Celery("opsvault", broker=broker_url, backend=broker_url)
celery.conf.update(
    task_track_started=True,
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-slas-and-automations": {
            "task": "opsvault.check_slas_and_automations",
            "schedule": 60.0,  # every minute
        },
        "process-scheduled-reports": {
            "task": "opsvault.process_scheduled_reports",
            "schedule": 300.0,  # every 5 minutes
        },
        "check-calendar-reminders": {
            "task": "opsvault.check_calendar_reminders",
            "schedule": 60.0,  # every minute
        }
    }
)

@celery.task(name="opsvault.healthcheck")
def healthcheck():
    return "ok"

@celery.task(name="opsvault.check_slas_and_automations")
def check_slas_and_automations():
    from .database import get_db
    from .models import Task, TaskStatus, Approval, ApprovalStatus, Incident, Notification, Escalation, utcnow
    from .services import calculate_task_sla, calculate_request_sla, calculate_incident_sla
    from .automation_engine import trigger_automation

    db = next(get_db())
    try:
        now = utcnow()
        # 1. Scan tasks for overdue events
        overdue_tasks = db.query(Task).filter(
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            Task.due_date != None,
            Task.due_date < now
        ).all()

        for t in overdue_tasks:
            # Check if escalation already created
            existing = db.query(Escalation).filter_by(source_type="TASK", source_id=t.id, status="OPEN").first()
            if not existing:
                trigger_automation(
                    db,
                    trigger_type="TASK_OVERDUE",
                    source_type="TASK",
                    source_id=t.id,
                    context={
                        "id": t.id,
                        "title": t.title,
                        "assignee_id": t.assignee_id,
                        "department_id": t.department_id,
                        "due_date": str(t.due_date),
                        "priority": t.priority,
                        "status": "OVERDUE"
                    }
                )

        # 2. Scan requests for SLA breaches (> 48 hours)
        breached_requests = db.query(Approval).filter(
            Approval.status == ApprovalStatus.PENDING,
            Approval.created_at < now - timedelta(hours=48)
        ).all()

        for a in breached_requests:
            existing = db.query(Escalation).filter_by(source_type="REQUEST", source_id=a.id, status="OPEN").first()
            if not existing:
                trigger_automation(
                    db,
                    trigger_type="REQUEST_SLA_BREACH",
                    source_type="REQUEST",
                    source_id=a.id,
                    context={
                        "id": a.id,
                        "subject": a.subject,
                        "requester_id": a.requester_id,
                        "created_at": str(a.created_at),
                        "status": "OVERDUE"
                    }
                )

        # 3. Scan open incidents for SLA breaches
        open_incidents = db.query(Incident).filter(
            Incident.status.in_(["OPEN", "IN_PROGRESS"])
        ).all()

        for inc in open_incidents:
            if calculate_incident_sla(inc) == "OVERDUE":
                existing = db.query(Escalation).filter_by(source_type="INCIDENT", source_id=inc.id, status="OPEN").first()
                if not existing:
                    trigger_automation(
                        db,
                        trigger_type="INCIDENT_SLA_BREACH",
                        source_type="INCIDENT",
                        source_id=inc.id,
                        context={
                            "id": inc.id,
                            "title": inc.title,
                            "severity": inc.severity,
                            "reporter_id": inc.reporter_id,
                            "assignee_id": inc.assignee_id,
                            "department_id": inc.department_id,
                            "status": "OVERDUE"
                        }
                    )

        db.commit()
    except Exception as e:
        logger.error(f"Error in check_slas_and_automations: {e}")
        db.rollback()
    finally:
        db.close()

@celery.task(name="opsvault.process_scheduled_reports")
def process_scheduled_reports():
    from .database import get_db
    from .models import ReportSchedule, ReportExecution, utcnow
    from .report_service import generate_report_file
    from .email_service import send_email

    db = next(get_db())
    try:
        now = utcnow()
        schedules = db.query(ReportSchedule).filter(ReportSchedule.enabled == True).all()

        for sched in schedules:
            try:
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
                        subject=f"OpsVault Scheduled Report: {sched.name}",
                        body_text=f"Attached is the automated {sched.report_type} report generated on {now.strftime('%Y-%m-%d %H:%M UTC')}.",
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
                    generated_by_id=sched.created_by_id
                )
                db.add(execution)
                sched.last_run_at = now
            except Exception as ex:
                logger.error(f"Failed to execute report schedule {sched.id}: {ex}")
                fail_exec = ReportExecution(
                    schedule_id=sched.id,
                    report_type=sched.report_type,
                    format=sched.format,
                    status="FAILED",
                    error_message=str(ex),
                    generated_by_id=sched.created_by_id
                )
                db.add(fail_exec)

        db.commit()
    except Exception as e:
        logger.error(f"Error in process_scheduled_reports: {e}")
        db.rollback()
    finally:
        db.close()

@celery.task(name="opsvault.check_calendar_reminders")
def check_calendar_reminders():
    from .database import get_db
    from .models import CalendarEvent, Notification, utcnow

    db = next(get_db())
    try:
        now = utcnow()
        # Find events starting within reminder window (0 to 30 mins from now)
        events = db.query(CalendarEvent).filter(
            CalendarEvent.start_time > now,
            CalendarEvent.start_time <= now + timedelta(minutes=30)
        ).all()

        for ev in events:
            # Check if notification already sent
            title = f"Reminder: {ev.title}"
            existing = db.query(Notification).filter_by(
                user_id=ev.user_id,
                title=title
            ).first()
            if not existing:
                db.add(Notification(
                    user_id=ev.user_id,
                    title=title,
                    body=f"Upcoming {ev.event_type.lower()} event scheduled for {ev.start_time.strftime('%H:%M UTC')}. {ev.description or ''}".strip(),
                    type="CALENDAR"
                ))
        db.commit()
    except Exception as e:
        logger.error(f"Error in check_calendar_reminders: {e}")
        db.rollback()
    finally:
        db.close()

