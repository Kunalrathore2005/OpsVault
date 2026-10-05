# OpsVault — High-Level & Component Architecture

## 1. System Architecture Overview

OpsVault is built using a multi-tier, asynchronous distributed architecture. It strictly separates client presentation, synchronous REST API execution, relational persistence, and asynchronous worker job execution.

```
[ User Browser / Client Device ]
               │
               │ HTTP/REST (Port 5173 / Reverse Proxy)
               ▼
   ┌───────────────────────┐
   │  Nginx Frontend Proxy │
   │  (React 18 SPA Build) │
   └───────────┬───────────┘
               │ /api/v1/* (Reverse Proxy to Port 8000)
               ▼
   ┌─────────────────────────────────────────────────────────┐
   │                  FastAPI Backend Server                 │
   │                                                         │
   │  ┌─────────────────┐   ┌─────────────────────────────┐  │
   │  │  JWT Auth Guard │──▶│   RBAC Dependency Layer     │  │
   │  └─────────────────┘   └──────────────┬──────────────┘  │
   │                                       │                 │
   │                                       ▼                 │
   │  ┌───────────────────────────────────────────────────┐  │
   │  │       Pydantic Schema Validation & Sanitization   │  │
   │  └────────────────────────┬──────────────────────────┘  │
   │                           │                             │
   │                           ▼                             │
   │  ┌───────────────────────────────────────────────────┐  │
   │  │             Business & Service Logic Layer        │  │
   │  │  - Task Workflow Engine    - SLA Summary Engine   │  │
   │  │  - Automation Engine       - XP Gamification      │  │
   │  └────────────┬────────────────────────┬─────────────┘  │
   └───────────────┼────────────────────────┼────────────────┘
                   │                        │
       SQLAlchemy  │                        │ Celery Task Dispatch
       2.0 ORM     │                        │ (Async Job Queue)
                   ▼                        ▼
       ┌──────────────────────┐  ┌──────────────────────┐
       │   PostgreSQL 16 DB   │  │    Redis 7 Broker    │
       │  - Relational Schema │  │  - Celery Message Q  │
       │  - Indexes & FKs     │  └──────────┬───────────┘
       └──────────────────────┘             │
                                            ▼
                                 ┌──────────────────────┐
                                 │ Celery Worker Engine │
                                 │ - Report Generator   │
                                 │ - SLA Escalation Job │
                                 │ - Email Dispatcher   │
                                 └──────────────────────┘
```

---

## 2. Layer-by-Layer Breakdown

### Layer 1: Client Presentation (React SPA + Nginx)
- **What it is:** React 18 Single Page Application served by Nginx 1.27 Alpine.
- **Why it exists:** Provides instant, reactive UI without page refreshes, native-feeling animations, dark/light themes, keyboard shortcuts (`⌘K`, `⌘+Enter`, `ESC`), and modal overlays.
- **What enters:** User mouse, touch, and keyboard interactions; backend JSON payloads.
- **What leaves:** HTTPS/REST requests with `Authorization: Bearer <token>` headers.
- **Key Files:**
  - `frontend/src/App.jsx`: Core routing, Shell layout, Command Palette, Activity Drawer, Toast Container, Modals.
  - `frontend/src/LandingPage/LandingPage.jsx`: Public showcase landing page.
  - `frontend/src/services/apiClient.js`: Fetch wrapper with token injection and error parsing.
  - `frontend/src/services/services.js`: Domain service clients (tasks, incidents, reports, etc.).

### Layer 2: API Gateway & Security Layer (FastAPI)
- **What it is:** High-performance asynchronous REST API powered by Python 3.12 and FastAPI.
- **Why it exists:** Handles CORS headers, terminates API routing, authenticates tokens, enforces Role-Based Access Control, and validates input payloads.
- **What enters:** Incoming HTTP requests (`GET`, `POST`, `PUT`, `DELETE`).
- **What leaves:** Strongly typed JSON responses, file streams (CSV/PDF), or standard HTTP error codes (`401`, `403`, `404`, `422`).
- **Key Files:**
  - `backend/app/main.py`: FastAPI route handlers and application lifecycle events.
  - `backend/app/deps.py`: Dependency injection providers (`current_user`, `roles`, `can_manage_departments`, `can_access_task`).
  - `backend/app/security.py`: JWT token signing, decoding, and password hashing (`passlib`/`bcrypt`).
  - `backend/app/schemas.py`: Pydantic models for incoming and outgoing data contracts.

### Layer 3: Business Logic & In-Engine Automation
- **What it is:** Pure domain business logic and rules processor.
- **Why it exists:** Decouples raw API endpoints from state transition rules, automation trigger matching, and SLA calculations.
- **What enters:** Clean, validated Pydantic data and active database session (`db: Session`).
- **What leaves:** Updated database entities, triggered notification records, and Celery task dispatch commands.
- **Key Files:**
  - `backend/app/services.py`: `transition_task()`, `level_for_xp()`, `get_sla_summary()`.
  - `backend/app/automation_engine.py`: `trigger_automation()` rules parser and action executor.
  - `backend/app/report_service.py`: Business data aggregation and CSV/HTML generation.

### Layer 4: Persistence Layer (SQLAlchemy + PostgreSQL)
- **What it is:** Relational persistence engine utilizing PostgreSQL 16 Alpine and SQLAlchemy 2.0 ORM with Psycopg 3 driver.
- **Why it exists:** Ensures ACID guarantees, relational integrity via Foreign Key constraints, cascading deletes where appropriate, and schema versioning via Alembic migrations.
- **What enters:** ORM entity instances, query criteria, and transaction commits.
- **What leaves:** Persisted database tuples, relationship graphs, and query result sets.
- **Key Files:**
  - `backend/app/database.py`: SQLAlchemy engine, session maker (`get_db()`), and Base declarative model.
  - `backend/app/models.py`: All 17 SQLAlchemy entity models and relationships.
  - `backend/alembic/`: Database migration scripts (`0001` through `0004`).

### Layer 5: Background Processing (Celery Worker + Redis)
- **What it is:** Asynchronous task queue and worker execution pool.
- **Why it exists:** Offloads compute-heavy or I/O-bound tasks (generating reports, sending transactional emails, running periodic SLA checks) away from FastAPI's main request-response thread to prevent latency spikes.
- **What enters:** Serialized task arguments pushed into Redis queue (`celery`).
- **What leaves:** Generated report files in `/app/uploads`, outgoing emails via SMTP/mock, and updated database execution records.
- **Key Files:**
  - `backend/app/celery_app.py`: Celery instance configuration, task definitions (`generate_report_task`, `execute_scheduled_reports_task`, `send_email_task`, `check_sla_breaches_task`).
