import io
import csv
import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from .models import (
    User, Role, Department, Task, TaskStatus, Approval, ApprovalStatus,
    Incident, Asset, Document, utcnow
)

def generate_report_data(
    db: Session,
    report_type: str,
    department_id: int | None = None,
    period: str = "ALL"
) -> dict:
    now = utcnow()
    cutoff = None
    if period == "TODAY":
        cutoff = now - timedelta(days=1)
    elif period == "THIS_WEEK":
        cutoff = now - timedelta(days=7)
    elif period == "THIS_MONTH":
        cutoff = now - timedelta(days=30)

    # Scoped queries
    task_q = db.query(Task)
    appr_q = db.query(Approval)
    inc_q = db.query(Incident)
    asset_q = db.query(Asset)
    doc_q = db.query(Document)
    user_q = db.query(User)
    dept_q = db.query(Department)

    if department_id:
        task_q = task_q.filter(Task.department_id == department_id)
        asset_q = asset_q.filter(Asset.department_id == department_id)
        doc_q = doc_q.filter(Document.department_id == department_id)
        inc_q = inc_q.filter(Incident.department_id == department_id)
        dept_q = dept_q.filter(Department.id == department_id)
        user_q = user_q.filter(User.department_id == department_id)

    if cutoff:
        task_q = task_q.filter(Task.created_at >= cutoff)
        appr_q = appr_q.filter(Approval.created_at >= cutoff)
        inc_q = inc_q.filter(Incident.created_at >= cutoff)
        doc_q = doc_q.filter(Document.created_at >= cutoff)

    tasks = task_q.all()
    approvals = appr_q.all()
    incidents = inc_q.all()
    assets = asset_q.all()
    documents = doc_q.all()
    users = user_q.all()
    departments = dept_q.all()

    user_map = {u.id: u.full_name for u in db.query(User).all()}
    dept_map = {d.id: d.name for d in db.query(Department).all()}

    title = report_type.replace("_", " ").title()
    headers = []
    rows = []

    if report_type == "DAILY_OPS":
        title = "Daily Operations Summary Report"
        headers = ["Category", "Metric", "Count / Value", "Status Context"]
        rows = [
            ["Tasks", "Total Tasks", str(len(tasks)), f"{len([t for t in tasks if t.status in (TaskStatus.PENDING, TaskStatus.IN_PROGRESS)])} Active"],
            ["Tasks", "Completed Tasks", str(len([t for t in tasks if t.status == TaskStatus.COMPLETED])), "Delivered"],
            ["Approvals", "Pending Requests", str(len([a for a in approvals if a.status == ApprovalStatus.PENDING])), "Action Required"],
            ["Incidents", "Open Incidents", str(len([i for i in incidents if i.status in ('OPEN', 'IN_PROGRESS')])), "Active Outages"],
            ["Incidents", "Critical Severity", str(len([i for i in incidents if i.severity == 'CRITICAL'])), "Immediate Priority"],
            ["Assets", "Active Hardware", str(len(assets)), f"{len([a for a in assets if a.status == 'AVAILABLE'])} Available"],
            ["Documents", "Managed Files", str(len(documents)), f"{round(sum(d.size_bytes for d in documents) / (1024*1024), 2)} MB Storage"],
            ["Staff", "Active Employees", str(len([u for u in users if u.is_active])), f"{len(departments)} Departments"]
        ]

    elif report_type == "WEEKLY_TASKS":
        title = "Weekly Task Operations Report"
        headers = ["Task ID", "Title", "Assignee", "Department", "Status", "Priority", "Difficulty", "Due Date", "Created At"]
        for t in tasks:
            rows.append([
                str(t.id),
                t.title,
                user_map.get(t.assignee_id, "Unassigned"),
                dept_map.get(t.department_id, "Operations"),
                t.status.value if hasattr(t.status, "value") else str(t.status),
                t.priority,
                t.difficulty.value if hasattr(t.difficulty, "value") else str(t.difficulty),
                t.due_date.strftime("%Y-%m-%d %H:%M") if t.due_date else "No Deadline",
                t.created_at.strftime("%Y-%m-%d %H:%M")
            ])

    elif report_type == "EMPLOYEE_WORKLOAD":
        title = "Employee Workload & Capacity Report"
        headers = ["Employee ID", "Full Name", "Email", "Department", "Role", "Active Tasks", "Completed Tasks", "Total Tasks", "XP Score"]
        for u in users:
            user_tasks = [t for t in tasks if t.assignee_id == u.id]
            active_cnt = len([t for t in user_tasks if t.status in (TaskStatus.PENDING, TaskStatus.IN_PROGRESS)])
            comp_cnt = len([t for t in user_tasks if t.status == TaskStatus.COMPLETED])
            rows.append([
                str(u.id),
                u.full_name,
                u.email,
                dept_map.get(u.department_id, "Unassigned"),
                u.role.value if hasattr(u.role, "value") else str(u.role),
                str(active_cnt),
                str(comp_cnt),
                str(len(user_tasks)),
                str(u.xp)
            ])

    elif report_type == "INCIDENT_SUMMARY":
        title = "Operational Incident Report"
        headers = ["Incident ID", "Title", "Severity", "Status", "Reporter", "Assignee", "Department", "Reported At", "Resolution Summary"]
        for inc in incidents:
            rows.append([
                str(inc.id),
                inc.title,
                inc.severity,
                inc.status,
                user_map.get(inc.reporter_id, f"User #{inc.reporter_id}"),
                user_map.get(inc.assignee_id, "Unassigned"),
                dept_map.get(inc.department_id, "General"),
                inc.created_at.strftime("%Y-%m-%d %H:%M"),
                inc.resolution or "In progress"
            ])

    elif report_type == "ASSET_INVENTORY":
        title = "Asset & Equipment Inventory Report"
        headers = ["Asset ID", "Asset Tag", "Name", "Status", "Assigned To", "Department", "Registered At"]
        for ast in assets:
            rows.append([
                str(ast.id),
                ast.asset_tag,
                ast.name,
                ast.status,
                user_map.get(ast.assigned_to_id, "Available / In Storage"),
                dept_map.get(ast.department_id, "Unassigned"),
                ast.created_at.strftime("%Y-%m-%d %H:%M")
            ])

    elif report_type == "DEPT_PERFORMANCE":
        title = "Department Performance Report"
        headers = ["Department ID", "Department Name", "Staff Count", "Active Tasks", "Completed Tasks", "Total Tasks", "Open Incidents"]
        for d in departments:
            d_users = [u for u in users if u.department_id == d.id]
            d_tasks = [t for t in tasks if t.department_id == d.id]
            d_incs = [i for i in incidents if i.department_id == d.id and i.status in ('OPEN', 'IN_PROGRESS')]
            rows.append([
                str(d.id),
                d.name,
                str(len(d_users)),
                str(len([t for t in d_tasks if t.status in (TaskStatus.PENDING, TaskStatus.IN_PROGRESS)])),
                str(len([t for t in d_tasks if t.status == TaskStatus.COMPLETED])),
                str(len(d_tasks)),
                str(len(d_incs))
            ])

    elif report_type == "REQUEST_SLA":
        title = "Request Approvals & SLA Report"
        headers = ["Request ID", "Subject", "Requester", "Status", "Reviewer", "Submitted At", "Decision Notes"]
        for a in approvals:
            rows.append([
                str(a.id),
                a.subject,
                user_map.get(a.requester_id, f"User #{a.requester_id}"),
                a.status.value if hasattr(a.status, "value") else str(a.status),
                user_map.get(a.reviewer_id, "Pending Review"),
                a.created_at.strftime("%Y-%m-%d %H:%M"),
                a.comment or "—"
            ])
    else:
        headers = ["Item", "Details"]
        rows = [["Report", report_type], ["Generated", now.isoformat()]]

    return {
        "title": title,
        "report_type": report_type,
        "generated_at": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "period": period,
        "headers": headers,
        "rows": rows
    }

def format_csv(data: dict) -> bytes:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([f"# OpsVault — {data['title']}"])
    writer.writerow([f"# Generated At: {data['generated_at']}"])
    writer.writerow([])
    writer.writerow(data["headers"])
    for row in data["rows"]:
        writer.writerow(row)
    return output.getvalue().encode("utf-8")

def format_html(data: dict) -> bytes:
    rows_html = "".join(
        "<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>"
        for row in data["rows"]
    )
    headers_html = "".join(f"<th>{h}</th>" for h in data["headers"])

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{data['title']}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; background: #fff; }}
    .header {{ border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }}
    h1 {{ font-size: 24px; margin: 0 0 6px; color: #1e293b; }}
    .meta {{ font-size: 13px; color: #64748b; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }}
    th, td {{ padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }}
    th {{ background: #f8fafc; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px; }}
    tr:nth-child(even) {{ background: #f8fafc; }}
    .footer {{ margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: right; }}
  </style>
</head>
<body>
  <div class="header">
    <h1>◈ OpsVault — {data['title']}</h1>
    <div class="meta">Generated: {data['generated_at']} · Period: {data['period']}</div>
  </div>
  <table>
    <thead><tr>{headers_html}</tr></thead>
    <tbody>{rows_html}</tbody>
  </table>
  <div class="footer">Confidential OpsVault Business Telemetry · Automated Reporting Engine</div>
</body>
</html>"""
    return html.encode("utf-8")

def generate_report_file(
    db: Session,
    report_type: str,
    format_type: str = "CSV",
    department_id: int | None = None,
    period: str = "ALL"
) -> tuple[str, str, bytes]:
    data = generate_report_data(db, report_type, department_id, period)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    sanitized_type = report_type.lower()

    if format_type.upper() == "JSON":
        filename = f"opsvault_{sanitized_type}_{timestamp}.json"
        content_type = "application/json"
        content = json.dumps(data, indent=2).encode("utf-8")
    elif format_type.upper() == "PDF":
        # Formatted HTML report with PDF download header
        filename = f"opsvault_{sanitized_type}_{timestamp}.html"
        content_type = "text/html"
        content = format_html(data)
    else:  # Default CSV
        filename = f"opsvault_{sanitized_type}_{timestamp}.csv"
        content_type = "text/csv"
        content = format_csv(data)

    return filename, content_type, content
