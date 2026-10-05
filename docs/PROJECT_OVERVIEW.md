# OpsVault — Project Overview & Core Fundamentals

## 1. What is OpsVault?
**OpsVault** is an enterprise-grade, internal business operations and workflow orchestration platform. It is designed to unify task execution, approval request workflows, organizational directory governance, incident management, asset tracking, automated business rule triggers, SLA deadline enforcement, and recurring report deliveries into a single real-time application.

---

## 2. Beginner-Friendly Explanation
Imagine a company where:
- Tasks get lost in Slack messages or emails.
- Employees wait days for manager purchase/leave approvals.
- When an IT server fails, nobody knows who is actively handling the outage.
- SLA deadlines pass without alerts, leading to delayed deliveries.

**OpsVault acts as the central digital headquarters (Command Center)** for the entire organization:
- **Employees** see their assigned daily duties, log requests, submit incidents, participate in task discussions, and track their earned Gamification XP.
- **Managers** oversee department staff workloads, review and resolve operational approval requests, assign high-priority tasks, and monitor SLA health.
- **Admins** maintain full governance over organizational departments, configure event-driven Automation Rules, manage enterprise asset inventories, and schedule automated CSV/PDF business intelligence reports.

---

## 3. The 3 Explanations (From Pitch to Architecture)

### A. The 30-Second Elevator Pitch
> *"OpsVault is a full-stack, containerized operations orchestration platform built with React, FastAPI, PostgreSQL, Celery, and Redis. It unifies daily workplace task management, approval lifecycles, and outage tracking with an event-driven automation engine and background SLA enforcement system, replacing disconnected spreadsheets and chat threads with an auditable operations command center."*

### B. The 1-Minute Interview Pitch
> *"I built OpsVault to solve operational fragmentation in medium-to-large business teams. It features a React 18 single-page application with a dark-themed operations dashboard, keyboard-first Command Palette (`⌘K`), and real-time activity drawers. The backend is powered by FastAPI and SQLAlchemy 2.0 with PostgreSQL 16. What sets OpsVault apart from basic CRUD apps is its event-driven Automation Engine and asynchronous Celery/Redis architecture: when tasks or incidents are created, configurable IF/THEN rules trigger notifications or status changes automatically, while Celery workers handle heavy report generation and background SLA breach escalations without blocking user web requests."*

### C. The 2-Minute Deep Technical Explanation
> *"OpsVault is architected as a distributed, multi-tier asynchronous platform. The frontend is built on React 18 and Vite, using a responsive layout with CSS variables, custom SVG data visualizations, React Context for alerts, and Portal-mounted modals that eliminate layout distortion. The frontend communicates with a FastAPI REST API via an authenticated JWT bearer client with Axios-like error normalization.
>
> On the backend, FastAPI utilizes Python 3.12, Pydantic v2 schemas for request validation, and SQLAlchemy 2.0 ORM backed by PostgreSQL 16 with Alembic database schema migrations. A multi-tier RBAC security system guards all routes across Admin, Manager, and Employee roles.
>
> For background tasks, OpsVault decouples web request cycles from compute-intensive operations using Celery 5.4 backed by Redis 7. When an administrator schedules an automated operations summary or generates a PDF/CSV export, the FastAPI handler dispatches a Celery task to the Redis message broker. Independent Celery worker containers process the dataset, generate the document into shared storage volumes, and trigger transactional emails and system notifications.
>
> Additionally, OpsVault features an in-engine Automation Engine that inspects database transitions synchronously on entity save, matching trigger events (e.g., `TASK_CREATED`, `INCIDENT_REPORTED`) against customizable field conditions and executing actions like automated role reassignment, manager alerts, and SLA breach escalations."*

---

## 4. Key Modules & Operational Depth

| Module | Purpose | Role Visibility | Key Features |
| :--- | :--- | :--- | :--- |
| **Operations Dashboard** | Real-time high-level telemetry | Admin, Manager, Employee | Donut status charts, KPI metric strip, attention required alerts, employee workload distribution. |
| **Task Management** | Daily duty tracking & SLAs | All Roles | Status workflow (`PENDING` → `IN_PROGRESS` → `COMPLETED`), SLA countdown, priority levels, task discussion feed. |
| **Requests & Approvals** | Operational queries & requests | All Roles | Employee budget/leave/resource submissions, Manager approval/rejection with review notes. |
| **Incidents & Outages** | Downtime & critical tracking | All Roles | Severity classification (`LOW` to `CRITICAL`), real-time status updates, root cause logging. |
| **Automation Engine** | Event-driven workflow rules | Admin, Manager | Trigger conditions (`WHEN Event IF Condition THEN Action`), execution history audit logs. |
| **SLA & Escalations** | Breach detection & response | Admin, Manager | Overdue task tracking, automatic escalation tickets, target resolution times. |
| **Business Reports** | Data intelligence & exports | Admin, Manager | On-demand and recurring schedules, CSV/PDF generation, delivery email distributions. |
| **People & Departments** | Staff & team governance | Admin, Manager | Multi-department structuring, employee assignment, workload monitoring. |
| **Assets & Documents** | Physical & digital inventories | All Roles | Hardware inventory tagging, secure document uploads with metadata storage. |
| **Command Palette (`⌘K`)** | Power-user spotlight search | All Roles | Global multi-table search, instant page jump navigation, quick action triggers. |
