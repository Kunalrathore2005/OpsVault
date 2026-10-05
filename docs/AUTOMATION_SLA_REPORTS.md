# OpsVault — Automation Engine, SLA Governance & Business Reports

## 1. The Automation Engine

### Structure of an Automation Rule
An automation rule is a declarative event listener structured as:
`WHEN <Trigger Event> IF <Conditions> THEN <Actions>`

1. **Trigger Events:** `TASK_CREATED`, `TASK_COMPLETED`, `INCIDENT_REPORTED`, `APPROVAL_REQUESTED`, `SLA_BREACHED`.
2. **Conditions:** Evaluated dynamically against entity attributes:
   ```json
   [
     { "field": "priority", "operator": "equals", "value": "HIGH" },
     { "field": "severity", "operator": "equals", "value": "CRITICAL" }
   ]
   ```
3. **Actions:** Executed sequentially on match:
   ```json
   [
     { "action_type": "NOTIFY_MANAGER", "value": "Critical task requires immediate oversight" },
     { "action_type": "CREATE_ESCALATION", "value": "CRITICAL" }
   ]
   ```

### Execution Flow:
- When an entity is saved, `trigger_automation(db, event_type, entity)` is invoked synchronously inside the database transaction.
- Matching active rules are evaluated. If all conditions pass, actions execute (creating notifications, escalations, or updating statuses), and an audit record is created in `automation_executions`.

---

## 2. SLA & Escalation Governance

### How SLAs Are Computed
- Every task can have a `due_date`.
- `get_sla_summary(db)` calculates:
  - **On Track:** Current time $< \text{due\_date} - 2\text{ hours}$.
  - **Due Soon:** $\text{due\_date} - 2\text{ hours} \le \text{Current time} \le \text{due\_date}$.
  - **Breached / Overdue:** $\text{Current time} > \text{due\_date}$ and status is not `COMPLETED`.

### Escalations:
- When a task breaches its SLA, an `Escalation` record is created linking to the task.
- Managers and Admins view all active escalations on the Escalation Command Board.
- Resolving an escalation updates status to `RESOLVED` with required resolution audit notes.

---

## 3. Business Reports Engine & Celery Integration

### Report Types & Formats
- **Report Types:** `OPERATIONS_SUMMARY`, `TASKS_AUDIT`, `INCIDENTS_LOG`, `STAFF_PERFORMANCE`.
- **Export Formats:** `CSV`, `PDF / HTML`, `JSON`.

### Lifecycle of a Report Request:
```
User clicks "Generate Report"
               │
               ▼
   FastAPI receives POST /reports/generate
               │
               ▼
   Dispatches async Celery task:
   generate_report_task.delay(schedule_id, report_type, format)
               │
               ▼
   FastAPI immediately responds 202 Accepted ("Job enqueued")
               │
               ▼
   Redis Queue holds message
               │
               ▼
   Celery Worker picks up task:
   1. Aggregates data from PostgreSQL
   2. Formats CSV or HTML report
   3. Saves artifact to /app/uploads/
   4. Sends email if recipients specified
   5. Logs completion in report_executions table
```
