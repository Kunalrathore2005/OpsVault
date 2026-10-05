# OpsVault — Docker & Infrastructure Architecture

## 1. Container Topology

OpsVault runs on 5 isolated container services connected via a private Docker bridge network.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Docker Network: opsvault_net                    │
│                                                                        │
│  ┌───────────────────────┐             ┌────────────────────────────┐  │
│  │     wa-frontend       │──proxy:80──▶│        wa-backend          │  │
│  │ (Port 5173 -> 80)     │             │     (Port 8000:8000)       │  │
│  │ Nginx + React bundle  │             │ Python 3.12 + FastAPI      │  │
│  └───────────────────────┘             └─────────────┬──────────────┘  │
│                                                      │                 │
│                                 ┌────────────────────┴──────────────┐  │
│                                 │                                   │  │
│                                 ▼                                   ▼  │
│                   ┌───────────────────────────┐       ┌─────────────┴┐ │
│                   │        wa-postgres        │       │   wa-redis   │ │
│                   │ (PostgreSQL 16 Alpine)    │       │   (Redis 7)  │ │
│                   │ Port: 5432 (Internal)     │       │ Port: 6379   │ │
│                   └───────────────────────────┘       └──────┬───────┘ │
│                                 ▲                            │         │
│                                 │                            │         │
│                                 └────────────────────┐       │         │
│                                                      │       ▼         │
│                                        ┌─────────────┴──────────────┐  │
│                                        │          wa-worker         │  │
│                                        │  (Celery 5.4 + Python 3.12)│  │
│                                        │  Background Job Consumer   │  │
│                                        └────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Container Service Reference

| Container | Base Image | Ports | Environment Variables | Volumes Mounted | Health Check |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | `postgres:16-alpine` | `5432` (internal) | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | `postgres_data:/var/lib/postgresql/data` | `pg_isready -U opsvault` |
| **`redis`** | `redis:7-alpine` | `6379` (internal) | None | In-memory | `redis-cli ping` |
| **`backend`** | Custom (`python:3.12-slim`) | `8000:8000` | `DATABASE_URL`, `SECRET_KEY`, `UPLOAD_DIR`, etc. | `uploads:/app/uploads` | `urllib GET /health` |
| **`worker`** | Custom (`python:3.12-slim`) | None | `DATABASE_URL`, `SECRET_KEY` | `uploads:/app/uploads` | Depends on Postgres/Redis |
| **`frontend`** | Custom (`nginx:1.27-alpine`) | `5173:80` | `VITE_DEV_TEST_USERS` (build arg) | None (Nginx static files) | Depends on Backend healthy |

---

## 3. What Happens When You Run `docker compose up --build -d`

1. **Build Phase:**
   - Multi-stage build for frontend compiles React JSX into minified assets in `/usr/share/nginx/html`.
   - Backend image installs Python dependencies from `requirements.txt`.
2. **Database & Cache Startup:**
   - PostgreSQL initializes storage in `postgres_data`.
   - Redis starts and responds `PONG` to health checks.
3. **Migration & Backend Startup:**
   - Backend container waits until PostgreSQL is healthy.
   - Backend entrypoint runs `alembic upgrade head` to apply all database migrations.
   - Backend seeds development accounts if `DEV_SEED_USERS="true"`.
   - Uvicorn starts FastAPI ASGI server on port `8000`.
4. **Worker & Frontend Initialization:**
   - Worker boots Celery listener connected to `redis://redis:6379/0`.
   - Frontend starts Nginx on port `5173` proxying `/api/v1` to `http://backend:8000`.
