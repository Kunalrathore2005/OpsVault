# OpsVault — Technical Interview Master Guide

## 1. Top 15 Project-Specific Interview Questions & Answers

### Q1: What is OpsVault and why did you build it?
- **Simple:** OpsVault is an internal operations hub for companies to manage tasks, employee requests, system outages, and automated business workflows in one place.
- **Technical:** It's an enterprise operations orchestration platform combining a React SPA frontend, a FastAPI REST backend, PostgreSQL relational database, and an asynchronous Celery + Redis background processing engine.
- **OpsVault Specific:** I built it to solve operational fragmentation where teams lose visibility across chat apps and spreadsheets. It features an event-driven automation engine and background SLA enforcement.

### Q2: Why did you choose FastAPI over Flask or Django?
- **Answer:** FastAPI offers native asynchronous (`async`/`await`) request handling, automatic schema validation via Pydantic, high throughput matching NodeJS/Go benchmarks, and out-of-the-box OpenAPI Swagger documentation without third-party plugins.

### Q3: How does authentication and RBAC work?
- **Answer:** We use stateless JWT authentication. When a user logs in, their password is verified using `bcrypt`. A signed JWT is returned containing user ID and role. Protected endpoints use FastAPI dependency injection (`Depends(roles(Role.ADMIN, Role.MANAGER))`) to verify token signature and enforce role permissions at the API layer before executing database logic.

### Q4: Why did you use Celery and Redis?
- **Answer:** In web applications, operations like generating PDF/CSV reports, compiling cross-department summaries, or sending emails can take several seconds. Running these inside a synchronous web request blocks the thread and degrades user experience. Celery allows FastAPI to offload these heavy tasks to an independent worker pool via a Redis message broker, responding to the client in milliseconds with a `202 Accepted` status.

### Q5: How does the Automation Engine work?
- **Answer:** The automation engine is an in-engine event processor. It listens for lifecycle events (`TASK_CREATED`, `INCIDENT_REPORTED`, etc.). When an event occurs, it evaluates configurable JSON conditions (e.g., `priority == HIGH`) against entity properties and executes corresponding actions (e.g., `NOTIFY_MANAGER`, `CREATE_ESCALATION`) inside the database transaction, logging an audit trail in `automation_executions`.

---

## 2. Realistic "Tell Me About Your Project" Script (Natural & Human)

> *"For my project, I built OpsVault — a secure business operations management and workflow orchestration platform.
>
> The problem I wanted to solve was operational bottlenecks in growing organizations where tasks, approvals, and outages get scattered across different communication channels.
>
> On the frontend, I used React 18 with Vite. I implemented a responsive dark-themed dashboard, a keyboard-first Command Palette (`⌘K`), real-time activity and discussion drawers, and custom SVG donut charts for visual workload distribution.
>
> On the backend, I used Python with FastAPI and SQLAlchemy 2.0 connected to a PostgreSQL database, managing schema migrations with Alembic. I implemented a strict multi-tier Role-Based Access Control system for Admins, Managers, and Employees with JWT token security.
>
> One of the most interesting engineering challenges was building the background processing pipeline and the Automation Engine. To keep the REST API fast and responsive, I integrated Celery with Redis to process report generation and SLA breach checks asynchronously in background workers. I also built an event-driven automation engine that allows managers to define IF/THEN rules — like automatically escalating critical incidents or notifying department heads when high-priority tasks are created.
>
> The entire stack is fully containerized using Docker and Docker Compose with dedicated health checks and isolated networking."*
