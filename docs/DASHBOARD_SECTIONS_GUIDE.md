# OpsVault — Complete Dashboard & UI Sections Guide

This guide provides a comprehensive breakdown of every screen, section, card, and interactive module in OpsVault. For each section, it outlines:
1. **Use / Purpose:** What business problem does it solve?
2. **Who Performs It / Target Role:** Which roles (`ADMIN`, `MANAGER`, `EMPLOYEE`) have access?
3. **How It Works:** Step-by-step technical mechanics, data sources, frontend triggers, API calls, and backend effects.

---

## 1. Executive Operations Dashboard (`/` for Admin & Manager)

### A. Live Telemetry Header & Sync
- **Use / Purpose:** Provides immediate situational awareness with date display, role badge, and on-demand synchronization of operations data.
- **Who Performs It:** `ADMIN`, `MANAGER`.
- **How It Works:**
  - On page load, `useOperationsData()` dispatches parallel `Promise.allSettled` requests fetching tasks, approvals, departments, users, incidents, assets, documents, and SLA summaries.
  - Clicking the **Sync** button triggers a state revision increment (`setRevision(v => v + 1)`), spinning the icon and fetching fresh data from FastAPI in the background.

---

### B. KPI Metrics Strip (4 High-Level Stat Cards)
- **Use / Purpose:** Delivers instant high-level counts of organizational assets and operational workload.
- **Who Performs It:** `ADMIN`, `MANAGER` (Read-only interactive cards).
- **Cards Included:**
  1. **Employees:** Total staff count (clicking navigates to `/employees`).
  2. **Departments:** Total business units (clicking navigates to `/departments`).
  3. **Active Tasks:** Sum of `PENDING` + `IN_PROGRESS` tasks across the company/department (clicking navigates to `/tasks`).
  4. **Pending Requests:** Count of employee approval queries awaiting review; highlights in amber if $> 0$ (clicking navigates to `/approvals`).
- **How It Works:**
  - Evaluated dynamically in memory from the cached `useOperationsData` payload.
  - Each card is an accessible focusable button (`tabIndex={0}`) with hover animations and click router navigation.

---

### C. Operations Overview (60/40 Grid)

#### 1. Task Operations Donut Chart (Left 60%)
- **Use / Purpose:** Visualizes the breakdown of all tasks by current workflow status (`PENDING`, `IN_PROGRESS`, `COMPLETED`).
- **Who Performs It:** `ADMIN`, `MANAGER`.
- **How It Works:**
  - Rendered via a native SVG Donut component (`DonutChart.jsx`) calculating arc circumferences (`2 * Math.PI * radius`) and stroke dash offsets.
  - Hovering over any slice or legend row dynamically enlarges the SVG ring and displays the exact count and percentage in the center circle.

#### 2. Attention Required Action Center (Right 40%)
- **Use / Purpose:** Automatically surfaces critical operational bottlenecks requiring immediate management intervention.
- **Who Performs It:** `ADMIN`, `MANAGER`.
- **How It Works:**
  - Evaluates 4 urgency thresholds:
    - **Active Escalations:** Active SLA breach tickets.
    - **Pending Requests:** Queries waiting for manager decision.
    - **Overdue Tasks:** Tasks whose `due_date` has passed without completion.
    - **Open Incidents:** Active system outages or bugs.
  - If all counts are zero, displays a green *"All systems up to date"* checkmark card. If items exist, clicking any alert row navigates directly to that module with filtered urgency.

---

### D. Workload & Organization (50/50 Grid)

#### 1. Employee Workload Distribution (Left 50%)
- **Use / Purpose:** Prevents team burnout by exposing staff task saturation.
- **Who Performs It:** `ADMIN`, `MANAGER`.
- **How It Works:**
  - Iterates through active employees and computes stacked percentage bars for each member:
    - Green segment = Completed tasks.
    - Blue segment = In-Progress tasks.
    - Amber segment = Pending tasks.
  - Helps managers see at a glance who is free to take new assignments and who is overloaded.

#### 2. Department Overview (Right 50%)
- **Use / Purpose:** Displays team capacity and active engagement per organizational department.
- **Who Performs It:** `ADMIN`, `MANAGER`.
- **How It Works:**
  - Maps `departments` joined with member counts and active task tallies.
  - Displays relative workload capacity bars calculated against the highest active department score.

---

### E. Operations Status (50/50 Grid)

#### 1. Requests & Approvals Donut (Left 50%)
- **Use / Purpose:** Displays submission velocity vs. resolution rate (`PENDING` vs. `APPROVED` vs. `REJECTED`).
- **Who Performs It:** `ADMIN`, `MANAGER`.
- **How It Works:**
  - Color-coded SVG donut chart mapping amber (`PENDING`), emerald (`APPROVED`), and red (`REJECTED`).

#### 2. Incident Overview Donut (Right 50%)
- **Use / Purpose:** Tracks system health and outage resolution status (`INVESTIGATING`, `MITIGATED`, `RESOLVED`).
- **Who Performs It:** `ADMIN`, `MANAGER`.
- **How It Works:**
  - Visualizes active vs. resolved incidents with direct links to the Incident management console.

---

## 2. Employee Personal Dashboard (`/` for Employee)

### A. Gamification XP & Level Banner
- **Use / Purpose:** Motivates staff by gamifying daily duty completion with XP points, level progression, and motivational greeting.
- **Who Performs It:** `EMPLOYEE`.
- **How It Works:**
  - Displays user name, role badge, and current Level (e.g. `Level 3 Operator`).
  - Progress bar shows current XP vs. the next 500 XP level threshold.
  - Completing tasks automatically increments XP (+50 XP for Easy, +100 XP for Medium, +200 XP for Hard) via backend `XPTransaction` records.

### B. Daily Action Center & Status Updater
- **Use / Purpose:** Provides a focused workspace where employees can view today's tasks, start work (`IN_PROGRESS`), mark items done (`COMPLETED`), or discuss blockers in the activity drawer.
- **Who Performs It:** `EMPLOYEE`.
- **How It Works:**
  - Direct inline dropdowns let employees change their task status instantly, triggering `PUT /api/v1/tasks/{id}` and awarding XP upon completion.

---

## 3. Tasks Management Section (`/tasks`)

- **Use / Purpose:** Centralized task assignment, lifecycle management, priority setting, and SLA tracking.
- **Who Performs It:**
  - `ADMIN`: Full access to create, assign, delete, and modify all organization tasks.
  - `MANAGER`: Full access to create and assign tasks within their department.
  - `EMPLOYEE`: Can create personal tasks and update status on assigned tasks.
- **How It Works:**
  1. **Viewing Tasks:** Employees see two separated cards: *Assigned Tasks* (delegated by management) and *Personal Tasks*. Admins and Managers see a comprehensive multi-column matrix.
  2. **Creating a Task:** Clicking `+ Create Task` opens the responsive task modal. Managers specify Title, Description, Assignee, Priority (`LOW`, `MEDIUM`, `HIGH`), Difficulty (`EASY`, `MEDIUM`, `HARD`), and Due Date.
  3. **Backend Flow:** `POST /api/v1/tasks` validates payload &rarr; inserts record &rarr; triggers `TASK_CREATED` automation &rarr; generates in-app notification for the assignee.
  4. **Activity Drawer:** Clicking `💬 Activity` opens the slide-over drawer displaying conversation history, status overview, and a comment box (`⌘+Enter` shortcut).

---

## 4. Requests & Approvals Section (`/approvals`)

- **Use / Purpose:** Replaces unstructured email/chat budget, software, resource, and leave requests with an auditable approval workflow.
- **Who Performs It:**
  - `EMPLOYEE`: Submits new requests with title, details, and optional expense amount.
  - `MANAGER` & `ADMIN`: Reviews pending requests and renders an `APPROVED` or `REJECTED` decision with review notes.
- **How It Works:**
  1. **Submission:** Employee submits modal form &rarr; `POST /api/v1/approvals` creates a `PENDING` approval record.
  2. **Review:** Manager opens the card &rarr; clicks `Approve` or `Reject` &rarr; enters decision notes &rarr; `PUT /api/v1/approvals/{id}/decision` updates status and sends a notification to the employee.

---

## 5. Incidents & Outages Section (`/incidents`)

- **Use / Purpose:** Rapid reporting, triage, and root-cause resolution for system outages, hardware failures, or software defects.
- **Who Performs It:**
  - `EMPLOYEE`: Can report incidents immediately when issues arise.
  - `MANAGER` & `ADMIN`: Triages severity, assigns incident commanders, and transitions lifecycle states.
- **How It Works:**
  1. **Reporting:** User clicks `+ Report Incident` &rarr; fills in Title, Description, and Severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  2. **Automation Hook:** If severity is `CRITICAL`, the backend `trigger_automation('INCIDENT_REPORTED')` automatically spawns an urgent `Escalation` ticket and notifies management.
  3. **Resolution:** Management updates status from `INVESTIGATING` &rarr; `MITIGATED` &rarr; `RESOLVED`.

---

## 6. Staff & Employees Directory (`/employees`)

- **Use / Purpose:** Centralized staff roster, role assignment, and department governance.
- **Who Performs It:** `ADMIN` (Full Management), `MANAGER` (Department Directory View), `EMPLOYEE` (Restricted).
- **How It Works:**
  1. **Creating Employee:** Admin clicks `+ Add Employee` &rarr; enters Name, Email, Password, Role (`ADMIN`, `MANAGER`, `EMPLOYEE`), and Department.
  2. **Backend Execution:** `POST /api/v1/users` hashes the password with `bcrypt` &rarr; assigns department &rarr; persists user.
  3. **Workload Telemetry:** Table displays each employee's current active task count and XP level badge.

---

## 7. Departments Section (`/departments`)

- **Use / Purpose:** Organizational unit structuring, budgeting scope, and department lead alignment.
- **Who Performs It:** `ADMIN` (Full Management), `MANAGER` (View Only).
- **How It Works:**
  - Displays visual cards for each team (e.g., Operations, IT Support, Engineering) showing member counts and active workload.
  - Admin can add or edit department names and descriptions via `POST /api/v1/departments`.

---

## 8. Automation Engine Section (`/automations`)

- **Use / Purpose:** Configures event-driven business rules without writing code, automating notifications, escalations, and status changes.
- **Who Performs It:** `ADMIN`, `MANAGER`.
- **How It Works:**
  1. **Creating a Rule:** Click `+ Create Automation Rule`.
  2. **Setting Trigger (`WHEN`):** Select event (e.g., `TASK_CREATED`, `INCIDENT_REPORTED`, `SLA_BREACHED`).
  3. **Setting Conditions (`IF`):** Add dynamic field filters (e.g., `priority == HIGH` or `severity == CRITICAL`).
  4. **Setting Actions (`THEN`):** Specify outcomes (e.g., `NOTIFY_MANAGER`, `CREATE_ESCALATION`, `AUTO_ASSIGN`).
  5. **Execution History:** The executions tab displays real-time execution logs with timestamps, matching criteria, status (`SUCCESS` / `FAILED`), and audit payloads.

---

## 9. Escalations & SLA Governance Section (`/escalations`)

- **Use / Purpose:** Monitors operational health, identifies SLA breaches before they impact customers, and tracks formal escalation resolutions.
- **Who Performs It:** `ADMIN`, `MANAGER`.
- **How It Works:**
  1. **SLA Health Header:** Displays On-Track %, Due Soon count ($< 2\text{ hrs}$ to deadline), and Breached count ($> \text{deadline}$).
  2. **Escalation Queue:** Lists active tickets spawned manually or automatically by the SLA monitor.
  3. **Resolution:** Manager clicks `Resolve`, types root cause / corrective action notes, and commits the resolution.

---

## 10. Business Reports Section (`/reports`)

- **Use / Purpose:** Generates business intelligence summaries and schedules recurring automated compliance exports.
- **Who Performs It:** `ADMIN`, `MANAGER`.
- **How It Works:**
  1. **On-Demand Generation:** Select report type (`OPERATIONS_SUMMARY`, `TASKS_AUDIT`, `INCIDENTS_LOG`, `STAFF_PERFORMANCE`) and format (`CSV`, `PDF / HTML`, `JSON`) &rarr; click `Generate`.
  2. **Celery Async Pipeline:** FastAPI calls `generate_report_task.delay()` &rarr; Redis queues task &rarr; Celery worker compiles data &rarr; saves file to `/app/uploads/` &rarr; provides instant download link.
  3. **Recurring Schedules:** Configure Cron expressions (e.g. daily at 9:00 AM) and recipient email lists for automated recurring delivery.

---

## 11. Documents & Assets Sections (`/documents`, `/assets`)

### Documents Repository (`/documents`)
- **Use / Purpose:** Secure enterprise file storage with role-based sharing and metadata tracking.
- **Who Performs It:** All roles (Admins/Managers manage organization files; Employees manage personal and shared files).
- **How It Works:** Multipart file upload streams file to secure disk storage and registers metadata in PostgreSQL.

### Hardware & Equipment Registry (`/assets`)
- **Use / Purpose:** Tracks corporate physical assets (laptops, monitors, servers) with unique asset tags and staff assignments.
- **Who Performs It:** `ADMIN`, `MANAGER` (Full CRUD), `EMPLOYEE` (View assigned equipment).

---

## 12. Profile, Interactive Calendar & Security (`/profile`)

- **Use / Purpose:** User self-service center for identity details, password updates, and interactive monthly scheduling.
- **Who Performs It:** All authenticated users.
- **Tabs Included:**
  1. **Identity & Security:** View role, department, change display name, or update account password with current-hash verification.
  2. **Interactive Calendar:**
     - Full monthly calendar grid showing Task Deadlines (Blue), Incidents (Red), and Personal Notes (Green).
     - Category filter dropdown (`ALL`, `PERSONAL`, `DEADLINE`, `INCIDENT`).
     - Quick Event Modal to schedule reminders and maintenance windows.

---

## 13. Global Power-User UX Features

### A. Universal Command Palette (`⌘K` / `Ctrl+K`)
- **Use / Purpose:** Keyboard-first spotlight navigation and multi-table search.
- **Who Performs It:** All authenticated users.
- **How It Works:** Pressing <kbd>Ctrl+K</kbd> (or <kbd>Cmd+K</kbd>) opens a modal search bar with debounced (180ms) multi-table search across tasks, incidents, users, assets, and documents, instant page jumps, and quick action shortcuts. Pressing <kbd>ESC</kbd> instantly dismisses the palette.

### B. Floating Toast Notification System
- **Use / Purpose:** Non-disruptive, auto-dismissing operational feedback replacing native browser alerts.
- **How It Works:** React Context (`ToastProvider`) renders stacked toasts via `createPortal` in the bottom-right corner for Success, Error, Warning, and Info states.

### C. Shimmer Skeleton Loaders
- **Use / Purpose:** Eliminates layout shifts and makes data loading feel fast and responsive.
- **How It Works:** Animated gray shimmer wireframes render during data fetching across tables and KPI cards.
