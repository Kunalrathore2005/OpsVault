# OpsVault — Relational Database Architecture

OpsVault uses PostgreSQL 16 managed via SQLAlchemy 2.0 ORM with schema migrations tracked in Alembic.

---

## 1. Database Entity Relationship Diagram (ERD)

```
        ┌─────────────────────────┐
        │       departments       │
        └────────────┬────────────┘
                     │ 1
                     │ has many
                     │ N
        ┌────────────▼────────────┐
        │          users          │◀───────────────────────────┐
        └────────────┬────────────┘                            │
                     │                                         │
        ┌────────────┼──────────────────────────┐              │
        │ 1          │ 1                        │ 1            │
        │ N          │ N                        │ N            │
┌───────▼──────┐ ┌───▼───────────┐ ┌────────────▼──────────┐ ┌─┴─────────────┐
│    tasks     │ │   approvals   │ │       incidents       │ │  comments     │
└───────┬──────┘ └───────────────┘ └───────────────────────┘ └───────────────┘
        │
        ├──────────────────────────┐
        │ 1                        │ 1
        │ N                        │ N
┌───────▼─────────────┐    ┌───────▼─────────────┐
│    escalations      │    │    notifications    │
└─────────────────────┘    └─────────────────────┘
```

---

## 2. All 17 Database Models & Specifications

| Model Class | SQL Table Name | Primary Key | Key Foreign Keys | Purpose & Fields |
| :--- | :--- | :--- | :--- | :--- |
| `Department` | `departments` | `id` (Integer) | None | Organizational business unit (`name`, `description`, `created_at`). |
| `User` | `users` | `id` (Integer) | `department_id` → `departments.id` | Staff account (`email`, `full_name`, `password_hash`, `role`, `department_id`, `created_at`). |
| `Task` | `tasks` | `id` (Integer) | `creator_id` → `users.id`<br>`assignee_id` → `users.id` | Operational tasks with workflow state (`title`, `description`, `status`, `priority`, `difficulty`, `due_date`, `created_at`). |
| `Approval` | `approvals` | `id` (Integer) | `requester_id` → `users.id`<br>`reviewer_id` → `users.id` | Operational approval requests (`title`, `details`, `amount`, `status`, `review_notes`, `created_at`). |
| `Incident` | `incidents` | `id` (Integer) | `reporter_id` → `users.id`<br>`assignee_id` → `users.id` | Critical outages / issues (`title`, `description`, `severity`, `status`, `created_at`). |
| `Asset` | `assets` | `id` (Integer) | `assigned_user_id` → `users.id`<br>`department_id` → `departments.id` | Hardware/equipment registry (`name`, `asset_tag`, `status`, `assigned_user_id`, `department_id`, `created_at`). |
| `Document` | `documents` | `id` (Integer) | `owner_id` → `users.id` | Enterprise file repository (`filename`, `stored_filename`, `content_type`, `file_size`, `owner_id`, `created_at`). |
| `Collaboration` | `collaborations` | `id` (Integer) | `document_id` → `documents.id`<br>`user_id` → `users.id` | Document sharing permissions (`document_id`, `user_id`, `permission`). |
| `Comment` | `comments` | `id` (Integer) | `author_id` → `users.id` | Real-time discussions on entities (`target_type`, `target_id`, `author_id`, `content`, `created_at`). |
| `AutomationRule` | `automation_rules` | `id` (Integer) | `created_by` → `users.id` | Event triggers & IF/THEN rules (`name`, `trigger_event`, `conditions`, `actions`, `is_active`, `created_at`). |
| `AutomationExecution` | `automation_executions` | `id` (Integer) | `rule_id` → `automation_rules.id` | Audit trace for rule executions (`rule_id`, `trigger_event`, `context_data`, `status`, `error_message`, `executed_at`). |
| `Escalation` | `escalations` | `id` (Integer) | `task_id` → `tasks.id`<br>`assigned_to_id` → `users.id` | SLA breach escalation tickets (`task_id`, `reason`, `severity`, `status`, `resolution_notes`, `created_at`). |
| `ReportSchedule` | `report_schedules` | `id` (Integer) | `created_by` → `users.id` | Automated reporting cadence (`name`, `report_type`, `format`, `cron_expression`, `recipients`, `is_active`, `created_at`). |
| `ReportExecution` | `report_executions` | `id` (Integer) | `schedule_id` → `report_schedules.id` | Audit log of generated reports (`schedule_id`, `report_type`, `format`, `status`, `file_path`, `executed_at`). |
| `CalendarEvent` | `calendar_events` | `id` (Integer) | `user_id` → `users.id` | User & team calendar items (`title`, `description`, `start_time`, `end_time`, `event_type`, `user_id`, `created_at`). |
| `Notification` | `notifications` | `id` (Integer) | `user_id` → `users.id` | In-app alerts (`user_id`, `title`, `message`, `is_read`, `created_at`). |
| `XPTransaction` | `xp_transactions` | `id` (Integer) | `user_id` → `users.id`<br>`task_id` → `tasks.id` | Gamification rewards log (`user_id`, `task_id`, `amount`, `reason`, `created_at`). |

---

## 3. Why Foreign Keys and Cascading Constraints Are Used
- **Relational Integrity:** Foreign keys guarantee that records (such as tasks or notifications) cannot point to non-existent user IDs.
- **Data Consistency:** Prevents orphan records. When a department is loaded, SQLAlchemy can join users and their active workloads in a single optimized query.
- **Index Optimization:** Primary keys (`id`) and indexed unique fields (`users.email`, `assets.asset_tag`) provide $O(1)$ constant-time lookup.
