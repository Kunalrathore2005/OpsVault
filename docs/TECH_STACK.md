# OpsVault — Actual Technology Stack

Every technology listed below has been verified directly from `backend/requirements.txt`, `frontend/package.json`, `docker-compose.yml`, and the project source tree.

---

## Complete Technology Matrix

| Technology | Layer / Where Used | Why It Was Chosen | What It Does In OpsVault |
| :--- | :--- | :--- | :--- |
| **React 18** | Frontend (`frontend/src/`) | Component-driven architecture with fast virtual DOM reconciliation. | Renders interactive single-page application UI, manages local state, and coordinates component lifecycles. |
| **Vite** | Frontend Build Tool | Near-instant HMR (Hot Module Replacement) and optimized Rollup production bundling. | Compiles JSX, bundles CSS, and serves development server with sub-second reload times. |
| **Lucide React** | Frontend UI Icons | Clean, consistent, tree-shakeable SVG icon collection. | Provides unified icons across navigation, status badges, actions, and KPI charts. |
| **React Router v6** | Frontend Client Routing | Declarative, client-side routing with browser history support. | Manages route transitions (`/`, `/tasks`, `/approvals`, `/incidents`, `/profile`, `/login`) without full page refreshes. |
| **Native CSS & Custom Variables** | Styling (`styles.css`, `landing.css`) | Zero runtime overhead, full theme flexibility with CSS custom properties (`--bg`, `--text`, `--primary`). | Powers dark/light themes, animations, shimmer skeletons, modals, drawers, and responsive grid layouts. |
| **Python 3.12** | Backend Runtime | Modern language features (pattern matching, performance improvements, strong typing). | Executes the backend server, background tasks, and business engine. |
| **FastAPI (v0.115.6)** | Backend Web Framework | High throughput, native async support, automatic OpenAPI/Swagger docs generation, standard dependency injection. | Serves all REST API endpoints under `/api/v1/*`, manages request-response cycles, and handles dependency injection. |
| **Uvicorn (v0.32.1)** | ASGI Web Server | Lightning-fast asynchronous server implementation for Python. | Runs the FastAPI ASGI application on port `8000`. |
| **Pydantic & Pydantic-Settings (v2.6.1)** | Data Validation & Settings | Strict type validation, automatic JSON serialization/deserialization, and environment variable parsing. | Validates all incoming API payloads (`TaskIn`, `CommentIn`, `ApprovalIn`) and provides strong type safety. |
| **SQLAlchemy (v2.0.36)** | ORM / Persistence | Industry-standard Python ORM with modern 2.0 query syntax, unit-of-work transactions, and relationship mapping. | Maps Python classes to PostgreSQL relational tables, handles joins, lazy/eager loading, and transactions. |
| **Psycopg 3 (v3.2.3)** | PostgreSQL Database Driver | Modern, highly optimized PostgreSQL adapter for Python. | Connects SQLAlchemy to the PostgreSQL database socket/TCP port. |
| **PostgreSQL 16 Alpine** | Relational Database | Battle-tested ACID compliance, strong relational integrity, robust indexing, and JSON column support. | Stores all persistent system records (Users, Tasks, Incidents, Automations, Comments, etc.). |
| **Alembic (v1.14.0)** | Database Migrations | Programmatic schema version control and migration tracking for SQLAlchemy models. | Applies database schema updates (`alembic upgrade head`) across database versions `0001` through `0004`. |
| **PyJWT (v2.10.1)** | Authentication / Tokens | Secure, standards-compliant JSON Web Token encoding and decoding. | Generates signed authentication tokens on login containing `user_id`, `role`, and expiration timestamp. |
| **Passlib + Bcrypt (v1.7.4)** | Password Hashing | Secure one-way salt-hashed password storage. | Hashes user passwords on registration/seed and verifies hashes on login. |
| **Celery (v5.4.0)** | Asynchronous Task Queue | Distributed job processing system. | Executes heavy background tasks (PDF/CSV report generation, automated SLA breach checks, email dispatches). |
| **Redis 7 Alpine** | In-Memory Message Broker | Ultra-low-latency in-memory data store. | Acts as the Celery message broker and transport queue for background jobs. |
| **Docker & Docker Compose** | Infrastructure & Orchestration | Environment parity, isolated container runtimes, single-command bootstrapping. | Builds, networks, and runs the 5 containers (`frontend`, `backend`, `worker`, `postgres`, `redis`) with persistent volumes and health checks. |
| **Pytest (in `requirements-dev.txt`)** | Backend Test Suite | Simple, expressive Python testing framework. | Runs automated unit and integration tests against API endpoints (`test_api.py`, `test_enterprise.py`). |
