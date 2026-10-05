# OpsVault — 10-Minute Pre-Interview Master Cheat Sheet

```
================================================================================
PROJECT: OpsVault (Secure Enterprise Business Operations & Workflow Platform)
================================================================================

[ FRONTEND ]
- Core: React 18, Vite, React Router v6, Lucide React icons.
- Design: Native CSS variables (`styles.css`, `landing.css`), permanent dark landing page.
- UX Features: Universal Command Palette (⌘K), Toast alert system, Shimmer Skeletons, Activity & Comments side drawer, Portal-mounted modals.

[ BACKEND ]
- Core: Python 3.12, FastAPI 0.115, Uvicorn ASGI server.
- Validation: Pydantic v2 schemas (`TaskIn`, `IncidentIn`, `CommentIn`, `SearchResultItem`).
- Security: PyJWT (HS256 tokens), Passlib + Bcrypt password hashing, RBAC dependency guards (`deps.py`).

[ DATABASE & ORM ]
- Engine: PostgreSQL 16 Alpine with Psycopg 3 adapter.
- ORM: SQLAlchemy 2.0 (`models.py`, 17 relational tables).
- Migrations: Alembic (`0001_initial` through `0004_comments_table`).

[ ASYNCHRONOUS PROCESSING ]
- Task Queue: Celery 5.4.
- Message Broker: Redis 7 Alpine.
- Background Tasks: Asynchronous CSV/PDF report generation, periodic SLA breach scans, email delivery.

[ KEY BUSINESS ENGINES ]
1. Automation Engine: Event-driven rule matching (`WHEN <event> IF <condition> THEN <action>`).
2. SLA & Escalation System: Real-time deadline calculation, breach detection, escalation ticket workflows.
3. XP Gamification: Rewards staff with XP points on task completion with level progression.
4. Discussion Feed: Entity comments with author role badges, relative timestamps, and auto-notifications.

[ DOCKER TOPOLOGY ]
- 5 Containers: `frontend` (Nginx:5173), `backend` (FastAPI:8000), `worker` (Celery), `postgres` (Port 5432), `redis` (Port 6379).
- Network: Isolated bridge network with volume persistence (`postgres_data`, `uploads`).

[ KEY TAKEAWAYS TO HIGHLIGHT IN INTERVIEWS ]
- Decoupled synchronous API from heavy async background workers via Celery + Redis.
- Implemented true multi-tier RBAC on both backend API routes and frontend presentation.
- Solved layout distortion in complex modals/drawers using React Portals and CSS variables.
- Maintained production-grade database schema discipline using Alembic version control.
```
