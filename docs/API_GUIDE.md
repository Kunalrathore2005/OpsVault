# OpsVault — API Architecture & Endpoint Reference

All endpoints are served under `/api/v1` and require an `Authorization: Bearer <token>` header unless explicitly marked public.

---

## Important Endpoints Grouped by Domain

### 1. Authentication & Profile
- `POST /api/v1/auth/login` (Public)
  - **Purpose:** Authenticates user credentials and returns a signed JWT access token.
  - **Body:** `{ "email": "admin@opsvault.local", "password": "..." }`
  - **Response:** `{ "access_token": "eyJ...", "token_type": "bearer" }`
- `GET /api/v1/profile`
  - **Purpose:** Returns profile metadata, role, department, current XP level, and assigned task count.
- `PUT /api/v1/profile`
  - **Purpose:** Updates user profile information (e.g. `full_name`).
- `POST /api/v1/profile/change-password`
  - **Purpose:** Verifies current password hash and updates to new password hash.

### 2. Tasks & Workflow Engine
- `GET /api/v1/tasks?status=...&priority=...`
  - **Purpose:** Retrieves paginated tasks filtered by status/priority. Employees only receive assigned + personal tasks; Admins/Managers receive organization/department tasks.
- `POST /api/v1/tasks`
  - **Purpose:** Creates a new task, triggers `TASK_CREATED` automation rules, and notifies the assignee.
- `PUT /api/v1/tasks/{id}`
  - **Purpose:** Updates task status (`PENDING` → `IN_PROGRESS` → `COMPLETED`). Awards XP on completion and checks for `TASK_COMPLETED` automations.

### 3. Requests & Approvals
- `GET /api/v1/approvals`
  - **Purpose:** Lists requests. Employees view their own submissions; Managers/Admins view team requests.
- `POST /api/v1/approvals`
  - **Purpose:** Creates a new approval request (`title`, `details`, `amount`).
- `PUT /api/v1/approvals/{id}/decision` (Role: `ADMIN`, `MANAGER`)
  - **Purpose:** Approves or rejects a request with review notes, notifying the requester.

### 4. Incidents & Outages
- `GET /api/v1/incidents`
  - **Purpose:** Lists operational incidents.
- `POST /api/v1/incidents`
  - **Purpose:** Logs an outage/issue (`title`, `description`, `severity`), triggering `INCIDENT_REPORTED` automations.
- `PUT /api/v1/incidents/{id}`
  - **Purpose:** Updates incident status (`INVESTIGATING`, `MITIGATED`, `RESOLVED`).

### 5. Automation Engine
- `GET /api/v1/automations` (Role: `ADMIN`, `MANAGER`)
  - **Purpose:** Lists configured event-driven automation rules.
- `POST /api/v1/automations` (Role: `ADMIN`, `MANAGER`)
  - **Purpose:** Creates an automation rule with trigger conditions and actions.
- `GET /api/v1/automations/executions` (Role: `ADMIN`, `MANAGER`)
  - **Purpose:** Returns execution audit history and logs.

### 6. SLA & Escalations
- `GET /api/v1/sla/summary` (Role: `ADMIN`, `MANAGER`)
  - **Purpose:** Computes real-time SLA metrics: total tasks, on-track %, due soon, breached count.
- `GET /api/v1/escalations` (Role: `ADMIN`, `MANAGER`)
  - **Purpose:** Lists all active and resolved escalation tickets.
- `PUT /api/v1/escalations/{id}` (Role: `ADMIN`, `MANAGER`)
  - **Purpose:** Resolves an escalation with resolution notes.

### 7. Business Reports
- `POST /api/v1/reports/generate` (Role: `ADMIN`, `MANAGER`)
  - **Purpose:** Dispatches async Celery task to aggregate data and generate CSV/PDF.
- `GET /api/v1/reports/schedules` (Role: `ADMIN`, `MANAGER`)
  - **Purpose:** Lists recurring automated report schedules.
- `POST /api/v1/reports/schedules` (Role: `ADMIN`, `MANAGER`)
  - **Purpose:** Creates a new recurring cron schedule.

### 8. Comments & Global Search
- `GET /api/v1/comments/{target_type}/{target_id}`
  - **Purpose:** Returns real-time discussion thread for an entity (`TASK`, `INCIDENT`, `APPROVAL`).
- `POST /api/v1/comments/{target_type}/{target_id}`
  - **Purpose:** Posts a comment and automatically generates notifications for assigned stakeholders.
- `GET /api/v1/search?q={query}`
  - **Purpose:** Performs multi-table case-insensitive `ilike` search across tasks, incidents, users, assets, and documents.
