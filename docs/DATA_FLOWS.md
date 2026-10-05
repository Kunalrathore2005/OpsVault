# OpsVault — End-to-End Data Flows & Walkthroughs

Below are 10 complete step-by-step lifecycles showing how data moves from user interaction to database persistence, background processing, and UI updates.

---

### Flow 1: User Login
`User enters credentials` ➔ `React calls authService.login()` ➔ `FastAPI verifies bcrypt password hash` ➔ `Generates JWT token with 7-day expiration` ➔ `React stores token in localStorage` ➔ `profileService.get() loads user state` ➔ `React mounts Shell dashboard`.

### Flow 2: Employee Creates a Personal Task
`Employee opens Task Modal` ➔ `Enters title & description` ➔ `FastAPI validates TaskIn schema` ➔ `SQLAlchemy inserts Task with creator_id = user.id, assignee_id = user.id` ➔ `trigger_automation() runs` ➔ `FastAPI returns 200 OK` ➔ `React displays Success Toast & appends task to Personal Tasks table`.

### Flow 3: Manager Assigns a High-Priority Task
`Manager assigns task to Employee` ➔ `FastAPI validates user role >= MANAGER` ➔ `SQLAlchemy creates Task record` ➔ `Notification created for Employee` ➔ `trigger_automation('TASK_CREATED', task) evaluates IF priority == HIGH THEN NOTIFY_MANAGER` ➔ `FastAPI commits transaction` ➔ `Employee receives notification bell badge`.

### Flow 4: Task Status Update & XP Gamification
`Employee clicks "Mark In Progress" or "Complete"` ➔ `PUT /api/v1/tasks/{id} sends status update` ➔ `transition_task() updates TaskStatus` ➔ `If COMPLETED: creates XPTransaction (+50/100/200 XP based on difficulty)` ➔ `Checks level threshold` ➔ `FastAPI returns updated task & XP summary` ➔ `React displays "+100 XP Earned!" celebration toast`.

### Flow 5: Operational Approval Request Submission & Review
`Employee submits $500 equipment request` ➔ `POST /api/v1/approvals saves Approval record (PENDING)` ➔ `Manager receives notification` ➔ `Manager reviews & clicks "Approve"` ➔ `PUT /approvals/{id}/decision sets status = APPROVED with review notes` ➔ `Requester notified`.

### Flow 6: Incident Outage Logging & Escalation
`Staff reports critical database outage` ➔ `POST /api/v1/incidents creates Incident (severity = CRITICAL)` ➔ `trigger_automation() detects CRITICAL severity` ➔ `Creates urgent Escalation ticket` ➔ `Notifies all Admin & Manager users` ➔ `Attention Required badge updates in real time`.

### Flow 7: Generating a Business Report via Celery
`Admin clicks "Generate PDF Operations Report"` ➔ `POST /api/v1/reports/generate receives request` ➔ `FastAPI calls generate_report_task.delay()` ➔ `FastAPI returns 202 Accepted` ➔ `Redis enqueues job` ➔ `Celery worker queries PostgreSQL, renders HTML/PDF artifact to /app/uploads/` ➔ `Worker creates ReportExecution record`.

### Flow 8: Real-Time Discussion Comments (`⌘+Enter`)
`User opens Activity Drawer on a Task` ➔ `Types note and presses ⌘+Enter` ➔ `POST /api/v1/comments/TASK/{id} saves Comment` ➔ `Backend identifies task assignee & creator and creates Notification records` ➔ `Comment appended immediately to drawer feed with author badge`.

### Flow 9: Universal Command Palette Search (`⌘K`)
`User presses ⌘K and types "server"` ➔ `React debounces input (180ms)` ➔ `Calls GET /api/v1/search?q=server` ➔ `FastAPI executes parallel ilike queries across tasks, incidents, assets, documents` ➔ `Role visibility filtered` ➔ `Command Palette renders grouped results` ➔ `User hits Enter to jump directly to item`.

### Flow 10: Admin Creates a New Staff Account
`Admin opens Employee Management` ➔ `Submits email, name, role, department` ➔ `FastAPI checks roles(Role.ADMIN)` ➔ `Hashes default password with bcrypt` ➔ `Inserts User into database` ➔ `Returns UserOut schema (excluding password hash)` ➔ `React adds employee to active team directory`.
