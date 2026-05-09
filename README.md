<div align="center">

<img src="https://img.shields.io/badge/TaskFlow-Full--Stack-6366f1?style=for-the-badge&logo=checkmarx&logoColor=white" alt="TaskFlow" />

# TaskFlow — Full-Stack Task Management Platform

**Backend Internship Assignment · Full-Stack Application**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

*A production-grade task management platform built with async FastAPI, React 18, and MongoDB — featuring JWT authentication, role-based access control, real-time analytics, and a fully responsive UI.*

[Features](#-features) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Setup](#-local-development-setup) · [Deployment](#-deployment)

</div>

---

## Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture](#-architecture)
5. [Authentication Flow](#-authentication-flow)
6. [Role-Based Access Control](#-role-based-access-control)
7. [API Reference](#-api-reference)
8. [Screenshots](#-screenshots)
9. [Security](#-security)
10. [Scalability](#-scalability)
11. [Folder Structure](#-folder-structure)
12. [Local Development Setup](#-local-development-setup)
13. [Deployment](#-deployment)
14. [Example API Responses](#-example-api-responses)
15. [Future Improvements](#-future-improvements)

---

## 📌 Project Overview

TaskFlow is a **production-ready, full-stack task management web application** built as a backend internship assignment. It demonstrates real-world engineering practices including:

- **Async Python backend** (FastAPI + Motor + MongoDB) with structured logging, centralized error handling, and tiered rate limiting
- **React 18 frontend** with animated UI, drag-and-drop status updates, real-time analytics charts, and full mobile responsiveness
- **JWT-based stateless authentication** with role-based access control — two roles (Admin, Member) with entirely separate capabilities
- **Admin control panel** — user management (promote, demote, delete), platform-wide task visibility with ownership tracking, and an email allowlist for controlled registration
- **Gmail-only registration** — only pre-approved `@gmail.com` addresses may create accounts
- **Docker Compose** for one-command local orchestration of the API + MongoDB

The application is designed to be evaluated on **code quality, system design, security, and completeness** rather than surface-level functionality alone.

---

## ✨ Features

### User Features

| Feature | Details |
|---|---|
| **Secure Authentication** | Register / login with JWT Bearer tokens; remember-me with localStorage vs. sessionStorage |
| **Task CRUD** | Create, read, update, delete tasks with title, description, priority, status, and due date |
| **Smart Filtering** | Filter by status (Todo / In Progress / Done) and priority (Low / Medium / High) |
| **Full-text Search** | Debounced search input (300 ms delay) to minimise unnecessary API calls |
| **Multi-column Sorting** | Sort by creation date, due date, last updated, or title — ascending or descending |
| **Pagination** | Configurable page sizes (10 / 20 / 50); server-side with total count returned |
| **Drag & Drop** | Drag task cards between Todo / In Progress / Done drop zones with optimistic UI updates |
| **Analytics Dashboard** | Live Recharts visualisations: status distribution, priority breakdown, 7-day activity, 8-week trend |
| **Task History** | Dedicated history tab — all completed tasks sorted by completion date with "X days ago" labels |
| **Password Reset** | Token-based forgot/reset password flow with 15-minute expiry |
| **Responsive UI** | Mobile, tablet, and desktop layouts — hamburger menu, stacked grids, scrollable tables |

### Admin Features

| Feature | Details |
|---|---|
| **User Management** | View all users, promote to admin, demote to member, permanently delete accounts |
| **Task Ownership View** | See every task platform-wide with the owner's username and role badge |
| **Platform Analytics** | Aggregate counts: total users, admins, total tasks, completed, in-progress, todo |
| **Email Allowlist** | Add / remove Gmail addresses approved for registration; see which emails already have accounts |
| **Self-Protection** | Admins cannot promote, demote, or delete their own account |

### Engineering Features

- **Rate limiting** — 5/min on register, 10/min on login, 5/min on password reset (via slowapi)
- **Request correlation IDs** — every response carries an 8-character hex ID for log tracing
- **Structured JSON logging** — access logs with method, path, status code, duration, and request ID
- **`X-Process-Time` header** — every response exposes server processing time in milliseconds
- **Compound MongoDB indexes** — 7 task indexes scoped to `owner_id` for sub-millisecond queries at scale
- **Multi-stage Docker build** — non-root user, minimal runtime image, separated build/runtime layers
- **Health check endpoints** — liveness (`/`) and readiness (`/health`, DB-verified) probes

---

## 🛠 Tech Stack

### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | **FastAPI** | 0.136 | Async REST API with automatic OpenAPI docs |
| Runtime | **Uvicorn** | 0.35 | ASGI server |
| Database | **MongoDB** | 7.0 | Document store |
| DB Driver | **Motor** | 3.7 | Async MongoDB client |
| Auth | **python-jose** | — | JWT creation and verification |
| Hashing | **passlib + bcrypt** | — | Password hashing with auto cost management |
| Validation | **Pydantic v2** | — | Request/response schemas and field validators |
| Config | **pydantic-settings** | — | Typed environment variable management |
| Rate Limiting | **slowapi** | — | Per-route request throttling by client IP |
| Containerisation | **Docker** | — | Multi-stage production image |

### Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | **React** | 18.3 | Component-based UI |
| Routing | **React Router** | v6 | Client-side navigation and protected routes |
| HTTP Client | **Axios** | 1.7 | API calls with automatic JWT header injection |
| Animations | **Framer Motion** | 12.38 | Page transitions and scroll-reveal effects |
| Charts | **Recharts** | 3.8 | Analytics visualisations |
| Styling | **Tailwind CSS** | 3.4 | Utility-first responsive design |
| Build Tool | **Vite** | 5.3 | Fast HMR dev server and production bundler |
| State | **React Context API** | — | Auth state management (no external store needed) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                React 18 SPA (Vite)                      │   │
│  │                                                         │   │
│  │  AuthContext ──► ProtectedRoute ──► Dashboard / Admin   │   │
│  │       │                                    │            │   │
│  │  localStorage /                     Axios Instance      │   │
│  │  sessionStorage                   (JWT interceptor)     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │ HTTP + JWT Bearer                │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                   ┌───────────▼────────────┐
                   │   Vite Dev Proxy        │
                   │   /api → :8000          │  (development only)
                   └───────────┬────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    FastAPI Application                           │
│                                                                 │
│  MIDDLEWARE STACK (applied in order)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CORS ──► LoggingMiddleware ──► TimingMiddleware         │  │
│  │  slowapi RateLimiter (enforced per-route)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ROUTERS                                                        │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  /auth          │  │  /tasks      │  │  /admin         │   │
│  │  register       │  │  CRUD        │  │  users          │   │
│  │  login          │  │  analytics   │  │  stats          │   │
│  │  me             │  │  pagination  │  │  allowlist      │   │
│  │  forgot-pw      │  │  search      │  │  promote/demote │   │
│  │  reset-pw       │  │  sort/filter │  │  delete         │   │
│  └────────┬────────┘  └──────┬───────┘  └────────┬────────┘   │
│           │                  │                    │            │
│  ┌────────▼──────────────────▼────────────────────▼────────┐  │
│  │              Security Dependencies (FastAPI DI)           │  │
│  │  get_current_user ──► get_current_admin_user             │  │
│  │  (JWT decode → DB lookup → role check)                   │  │
│  └──────────────────────────────┬───────────────────────────┘  │
│                                 │                               │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ Motor async driver
┌─────────────────────────────────▼───────────────────────────────┐
│                        MongoDB 7.0                              │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐    │
│  │    users      │  │    tasks      │  │ allowed_emails  │    │
│  │               │  │               │  │                 │    │
│  │  email (UQ)   │  │  owner_id     │  │  email (UQ)     │    │
│  │  username     │  │  + status     │  │  added_by       │    │
│  │  hashed_pw    │  │  + priority   │  │  added_at       │    │
│  │  role         │  │  + due_date   │  │                 │    │
│  │               │  │  + updated_at │  │                 │    │
│  └───────────────┘  └───────────────┘  └─────────────────┘    │
│                                                                 │
│  9 total indexes: 1 users · 1 allowed_emails · 7 task compound  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Async-first backend** — Every I/O operation uses `async/await` via Motor. FastAPI runs on Uvicorn (ASGI), enabling high concurrency without thread-per-request overhead. A single process serves thousands of concurrent connections.

**Stateless JWT authentication** — Tokens carry `sub` (email), `role`, and `exp`. Any API instance can validate any token independently — no shared session store required for horizontal scaling.

**Compound MongoDB indexes** — All task queries are scoped to `owner_id`. Seven compound indexes cover every combination of filter and sort the API exposes, eliminating full-collection scans even at millions of documents.

**Middleware stack ordering** — CORS sits outermost so preflight requests exit immediately. Logging middleware wraps everything, capturing every request and response. Rate limiting rejects abusive requests before any business logic runs.

**Optimistic UI updates** — Drag-and-drop status changes update the local React state immediately, fire the API call in the background, and revert only on failure. Users experience zero perceptible latency for common interactions.

**Dependency injection for auth** — FastAPI's DI system means route handlers declare what they need (`current_user`, `current_admin`) and the framework guarantees it is resolved before the handler runs. There is no way to accidentally skip auth on a protected route.

---

## 🔐 Authentication Flow

```
  REGISTRATION                               LOGIN
  ────────────                               ─────
  POST /auth/register                        POST /auth/login
       │                                          │
       ▼                                          ▼
  1. Validate @gmail.com only            1. Find user by email
       │                                 2. bcrypt.verify(pw, hash)
       ▼                                 3. Sign JWT:
  2. Check allowed_emails                   { sub: email,
     (pre-approved allowlist)                 role: "user"|"admin",
       │                                       exp: now + 60min }
       ▼                                          │
  3. Ensure email is unique                       ▼
       │                                 Return { access_token,
       ▼                                          token_type }
  4. bcrypt.hash(password)
  5. Insert user document
  6. Return UserResponse


  AUTHENTICATED REQUEST
  ─────────────────────
  Authorization: Bearer <JWT>
       │
       ▼
  get_current_user dependency:
  ├── jwt.decode(token, SECRET, algorithms=["HS256"])
  ├── Extract email from payload["sub"]
  ├── users_collection.find_one({"email": email})
  └── Return user document
       │
       ├─ Admin route → get_current_admin_user
       │                └─ role != "admin" → HTTP 403
       │
       └─ Task route → owner filter injected into DB query
                        Admins: unfiltered (see all tasks)
                        Users:  {"owner_id": str(user["_id"])}


  PASSWORD RESET FLOW
  ───────────────────
  POST /auth/forgot-password  ──► Short-lived JWT (type="password_reset", 15-min expiry)
                                   Returned in response body (dev) / sent via email (prod)
       │
       ▼
  POST /auth/reset-password   ──► Validate token type + expiry + subject
                                   bcrypt.hash(new_password) → DB update
```

---

## 👥 Role-Based Access Control

TaskFlow implements two roles: **Admin** and **User (Member)**.

```
┌──────────────────────────────┬────────┬───────┐
│ Capability                   │  User  │ Admin │
├──────────────────────────────┼────────┼───────┤
│ Register / Login             │   ✓    │   ✓   │
│ View own profile (/auth/me)  │   ✓    │   ✓   │
│ Create tasks                 │   ✓    │   ✓   │
│ View own tasks               │   ✓    │   ✓   │
│ Update / delete own tasks    │   ✓    │   ✓   │
│ View task analytics          │   ✓    │   ✓   │
│ View ALL users' tasks        │   ✗    │   ✓   │
│ List all users               │   ✗    │   ✓   │
│ Promote user → admin         │   ✗    │   ✓   │
│ Demote admin → user          │   ✗    │   ✓   │
│ Delete user accounts         │   ✗    │   ✓   │
│ View platform-wide stats     │   ✗    │   ✓   │
│ Manage registration allowlist│   ✗    │   ✓   │
└──────────────────────────────┴────────┴───────┘
```

**Implementation** — Role is embedded in the JWT at login time. The backend uses two FastAPI dependency functions:

- `get_current_user(token)` — validates the JWT, fetches the user from DB, and returns the document. Used by all authenticated routes.
- `get_current_admin_user(current_user)` — calls `get_current_user`, then raises HTTP 403 if `role != "admin"`. Used exclusively by admin routes.

Task ownership is enforced at the **query level**, not after data is fetched. Regular users' DB queries always include `{"owner_id": str(user["_id"])}`. Admins receive an unfiltered cursor.

---

## 📡 API Reference

**Base URL (local):** `http://localhost:8000/api/v1`  
**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)  
**ReDoc:** `http://localhost:8000/redoc`

All protected endpoints require: `Authorization: Bearer <token>`

### Authentication

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|-----------|-------------|
| `POST` | `/auth/register` | None | 5 / min | Register a new Gmail account |
| `POST` | `/auth/login` | None | 10 / min | Login and receive JWT |
| `GET` | `/auth/me` | User | — | Get the authenticated user's profile |
| `POST` | `/auth/forgot-password` | None | 5 / min | Request a password-reset token |
| `POST` | `/auth/reset-password` | None | — | Reset password using the reset token |

### Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/tasks` | User | List tasks with filters, sort, and pagination |
| `POST` | `/tasks` | User | Create a new task |
| `GET` | `/tasks/analytics` | User | Fetch dashboard analytics data |
| `GET` | `/tasks/{task_id}` | User | Retrieve a single task |
| `PUT` | `/tasks/{task_id}` | User | Partially update a task (unset fields ignored) |
| `DELETE` | `/tasks/{task_id}` | User | Delete a task |

**`GET /tasks` — Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | `todo \| in_progress \| done` | — | Filter by task status |
| `priority` | `low \| medium \| high` | — | Filter by task priority |
| `search` | `string` | — | Search in title and description |
| `sort_by` | `created_at \| updated_at \| due_date \| title` | `created_at` | Field to sort by |
| `sort_order` | `asc \| desc` | `desc` | Sort direction |
| `skip` | `int ≥ 0` | `0` | Number of records to skip (pagination offset) |
| `limit` | `int 1–100` | `20` | Number of records to return |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/users` | Admin | List all registered users |
| `GET` | `/admin/stats` | Admin | Platform-wide aggregate statistics |
| `POST` | `/admin/promote/{user_id}` | Admin | Promote a user to admin role |
| `POST` | `/admin/demote/{user_id}` | Admin | Demote an admin back to user role |
| `DELETE` | `/admin/user/{user_id}` | Admin | Permanently delete a user and all their tasks |
| `GET` | `/admin/allowed-emails` | Admin | List all emails on the registration allowlist |
| `POST` | `/admin/allowed-emails` | Admin | Add a Gmail address to the allowlist |
| `DELETE` | `/admin/allowed-emails?email=` | Admin | Remove an email from the allowlist |

### System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | None | Liveness probe — confirms process is alive |
| `GET` | `/health` | None | Readiness probe — confirms process and DB connectivity |

---

## 📸 Screenshots

> Add screenshots by placing images in `docs/screenshots/` and uncommenting the `img` tags below.

### Landing Page
The public-facing marketing page explains TaskFlow before asking users to sign up. Sections: Hero → What is TaskFlow → How it Works → Features → Dashboard Preview → Ready to Try. Responsive navbar with hamburger menu on mobile.

<!-- ![Landing Page](docs/screenshots/landing.png) -->

### User Dashboard
Greeting hero card with live completion progress bar. Four stat cards (Total / Todo / In Progress / Done). Task grid with colour-coded priority cards, drag-and-drop status zones, and a filter/search/sort bar.

<!-- ![Dashboard](docs/screenshots/dashboard.png) -->

### Analytics View
Four Recharts visualisations: status distribution bar, priority breakdown, 7-day activity chart, and 8-week productivity trend. Toggled from the dashboard header.

<!-- ![Analytics](docs/screenshots/analytics.png) -->

### Task History Tab
Linear list of completed tasks with priority dot, task title, priority badge, Done badge, completion date, and "X days ago" label. Accessed via the My Tasks / History tab strip.

<!-- ![Task History](docs/screenshots/history.png) -->

### Admin Panel
Platform statistics (4 primary + 3 secondary stat cards), task completion progress bar, Task Overview table (Task / Owner / Priority / Status / Created), User Management table (promote / demote / delete), and Allowed Registrations section with Gmail allowlist management.

<!-- ![Admin Panel](docs/screenshots/admin.png) -->

---

## 🔒 Security

### Authentication & Passwords
- **Passwords** are hashed with `bcrypt` via passlib. Plaintext passwords are never stored, logged, or returned in any response.
- **JWT tokens** are signed with `HS256` using a secret key read from environment variables at startup. Tokens carry an `exp` claim (default 60 minutes) and are validated on every protected request.
- **DB re-fetch on auth** — the user document is re-fetched from MongoDB on every request, ensuring deleted or modified accounts cannot use old tokens.

### Input Validation
- **Pydantic v2** validates all incoming request bodies — field types, string lengths, email format, enum membership.
- **Username regex** — `^[a-zA-Z0-9_.−]+$`, 3–50 characters, enforced at the schema layer.
- **Gmail-only** — registration and allowlist endpoints reject non-`@gmail.com` addresses at both the backend (HTTP 400) and frontend (client-side pre-validation).
- **ObjectId validation** — `{id}` path parameters are validated with `ObjectId.is_valid()` before any DB call; malformed IDs return 400, not 500.

### Rate Limiting

| Endpoint | Limit | Rationale |
|----------|-------|-----------|
| `POST /auth/login` | 10 / min | Slow credential-stuffing attacks |
| `POST /auth/register` | 5 / min | Prevent automated account creation |
| `POST /auth/forgot-password` | 5 / min | Prevent email enumeration at scale |
| All other routes | 60 / min | General DoS protection |

### Other Protections
- **User enumeration prevention** — login returns the same error message whether the email exists or not (`"Invalid email or password"`). Forgot-password always returns HTTP 200.
- **Self-protection guards** — admins cannot demote or delete their own account. Enforced server-side by comparing `current_admin["_id"]` to the target `user_id`.
- **Ownership isolation at query level** — users can only read or modify their own tasks. The `owner_id` filter is injected into every DB query, not checked after the fact.
- **Non-root Docker user** — the production image runs as `appuser` (UID 1001), not root. The filesystem is read-only except for the app directory.
- **CORS allowlist** — `CORS_ORIGINS` is configured via environment variables. The default restricts to `http://localhost:5173` in development.
- **Secrets in environment** — `JWT_SECRET_KEY` and `MONGO_URI` are always read from `.env`. The `.env` file is gitignored and never committed.

---

## 📈 Scalability

### What scales today (no changes required)

**Stateless API** — JWT tokens contain all necessary auth state. Multiple FastAPI instances can run behind a load balancer (NGINX, AWS ALB, Cloudflare) without any shared session storage.

**Async I/O** — Uvicorn + Motor means a single process handles thousands of concurrent requests. I/O waits (DB reads/writes) release the event loop to serve other requests — no threads blocked waiting on the database.

**Compound MongoDB indexes** — Seven indexes on the tasks collection cover every query the API exposes. Query plans never require collection scans, keeping response times in single-digit milliseconds regardless of dataset size.

**Docker image** — Multi-stage build produces a portable, minimal runtime image. Any container orchestrator (Kubernetes, ECS, Fly.io, Railway) can scale replicas horizontally behind a load balancer with zero code changes.

**Analytics via `asyncio.gather`** — The analytics endpoint fires all four DB aggregation queries concurrently, not sequentially. Total latency equals the slowest query, not the sum.

### What to add at production scale

| Concern | Current | Production Approach |
|---------|---------|-------------------|
| Database HA | Single node | MongoDB Atlas (managed replica set, auto-failover) |
| Caching | None | Redis: cache analytics responses (30-second TTL) |
| Token revocation | No revocation | JWT denylist in Redis on logout / account deletion |
| Email delivery | Token in response body | SMTP via SendGrid / SES in production mode |
| Observability | Structured logs to stdout | Ship to Datadog / Grafana Loki; metrics to Prometheus |
| Full-text search | MongoDB regex | MongoDB Atlas Search or Elasticsearch |
| Background jobs | None | Celery + Redis for email delivery, scheduled tasks |
| File attachments | Not implemented | S3 / R2 for task file uploads |

---

## 📁 Folder Structure

```
backend-intern-assignment/
│
├── README.md
│
├── backend/
│   ├── .env.example                # Environment variable template
│   ├── requirements.txt            # Python dependencies (pinned versions)
│   ├── Dockerfile                  # Multi-stage production build
│   ├── docker-compose.yml          # Local dev: API + MongoDB services
│   │
│   └── app/
│       ├── main.py                 # FastAPI app factory, middleware, lifespan
│       ├── config.py               # Pydantic Settings — typed env config
│       ├── database.py             # Motor client, collection refs, index creation
│       ├── exceptions.py           # Centralised exception handlers (422, 429, 500…)
│       │
│       ├── middleware/
│       │   └── logging.py          # LoggingMiddleware + TimingMiddleware
│       │
│       ├── models/
│       │   ├── user_model.py       # user_helper: MongoDB doc → response dict
│       │   └── task_model.py       # task_helper: MongoDB doc → response dict
│       │
│       ├── schemas/
│       │   ├── user_schema.py      # UserRegister, UserLogin, UserResponse, AdminStats…
│       │   └── task_schema.py      # TaskCreate, TaskUpdate, TaskResponse, TaskAnalytics…
│       │
│       ├── routes/
│       │   ├── auth.py             # /auth — register, login, me, forgot/reset password
│       │   ├── tasks.py            # /tasks — CRUD, analytics, pagination, search
│       │   └── admin.py            # /admin — user management, stats, allowlist
│       │
│       └── utils/
│           ├── security.py         # JWT, bcrypt, get_current_user dependency
│           └── rate_limit.py       # slowapi Limiter instance
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js              # Vite config + /api proxy for local dev
    ├── .env.example
    │
    └── src/
        ├── main.jsx                # React root with BrowserRouter
        ├── App.jsx                 # Route definitions and ProtectedRoute wrapper
        ├── index.css               # Global styles, Tailwind directives, custom animations
        │
        ├── api/
        │   └── axiosInstance.js    # Axios with JWT interceptor + 401 auto-logout
        │
        ├── context/
        │   └── AuthContext.jsx     # Auth state: user, login(), logout(), isAdmin
        │
        ├── services/
        │   ├── authService.js      # loginUser, registerUser, getMe, forgotPassword…
        │   ├── taskService.js      # getTasks, createTask, updateTask, deleteTask, analytics
        │   └── adminService.js     # getUsers, getStats, promoteUser, getAllTasks, allowlist…
        │
        ├── components/
        │   ├── Sidebar.jsx         # Collapsible sidebar with mobile overlay
        │   ├── TaskCard.jsx        # Kanban card — drag source, priority colour-coding
        │   ├── TaskModal.jsx       # Create / edit task modal with form validation
        │   ├── AnalyticsSection.jsx# Recharts: status, priority, weekly activity, trend
        │   ├── ProtectedRoute.jsx  # Route guard — redirects to /login if unauthenticated
        │   ├── ConfirmModal.jsx    # Reusable confirmation dialog
        │   └── Toast.jsx           # Animated toast notifications (success / error)
        │
        └── pages/
            ├── LandingPage.jsx     # Public marketing page with animated scroll sections
            ├── Login.jsx           # Login form with animated card UI
            ├── Register.jsx        # Registration form with password strength meter
            ├── Dashboard.jsx       # User dashboard: tasks, analytics, history tab
            └── AdminDashboard.jsx  # Admin panel: users, task overview, stats, allowlist
```

---

## 🚀 Local Development Setup

### Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Python | 3.11 | [python.org](https://python.org) |
| Node.js | 18 | [nodejs.org](https://nodejs.org) |
| MongoDB | 7.0 | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Docker *(optional)* | 24 | [docker.com](https://docker.com) |

---

### Option A — Docker Compose *(Recommended)*

Runs the API and MongoDB together with a single command. Requires Docker Desktop.

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd backend-intern-assignment

# 2. Create the backend environment file
cp backend/.env.example backend/.env
# Open backend/.env and set JWT_SECRET_KEY to any random string

# 3. Start API + MongoDB (with hot reload)
cd backend
docker compose up --build
```

The API is now available at `http://localhost:8000`.  
Interactive API docs: `http://localhost:8000/docs`

Start the frontend in a separate terminal:

```bash
cd frontend
cp .env.example .env   # defaults work with the Docker API
npm install
npm run dev
```

Frontend: `http://localhost:5173`

---

### Option B — Manual Setup

**Backend:**

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt

cp .env.example .env
```

Edit `backend/.env`:

```env
# ── Required ──────────────────────────────────────────
MONGO_URI=mongodb://localhost:27017
JWT_SECRET_KEY=change-this-to-a-random-secret

# ── Optional (defaults shown) ─────────────────────────
MONGO_DB_NAME=taskflow
APP_ENV=development
DEBUG=true
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
RATE_LIMIT_DEFAULT=60/minute
RATE_LIMIT_AUTH=10/minute
```

```bash
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

### First-Time Setup: Creating the First Admin

Registration requires an allowlist entry. Seed the first record directly in MongoDB:

```js
// In the MongoDB shell or MongoDB Compass
use taskflow

// Step 1 — Add your Gmail to the allowlist
db.allowed_emails.insertOne({
  email: "you@gmail.com",
  added_by: "seed",
  added_at: new Date()
})

// Step 2 — Register via the UI at http://localhost:5173/register

// Step 3 — Promote your new account to admin
db.users.updateOne(
  { email: "you@gmail.com" },
  { $set: { role: "admin" } }
)
```

Once you have one admin account, all subsequent user and allowlist management can be done through the Admin Panel in the UI — no more shell access needed.

---

## 🐳 Deployment

### Backend — Docker on Any VPS

```bash
# Build the production image
docker build -t taskflow-api ./backend

# Run with production environment variables
docker run -d \
  --name taskflow-api \
  -p 8000:8000 \
  -e MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/taskflow" \
  -e JWT_SECRET_KEY="$(openssl rand -hex 32)" \
  -e APP_ENV="production" \
  -e CORS_ORIGINS="https://your-frontend-domain.com" \
  taskflow-api
```

### Backend — Render.com

1. Connect your GitHub repository in the Render dashboard
2. **Build Command:** `pip install -r requirements.txt`
3. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables via the Render dashboard (never commit `.env`)

### Backend — Railway

Create `backend/railway.toml`:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
```

### Frontend — Vercel *(Recommended)*

```bash
npm i -g vercel
cd frontend
vercel --prod
```

Set in Vercel dashboard:
```
VITE_API_BASE_URL = https://your-api-domain.com/api/v1
```

Create `frontend/vercel.json` for client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Frontend — Netlify

Dashboard settings:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Environment:** `VITE_API_BASE_URL=https://your-api.com/api/v1`

Create `frontend/public/_redirects`:

```
/*  /index.html  200
```

### MongoDB — Atlas *(Production)*

1. Create a free M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Whitelist your server's IP address
3. Create a database user with `readWrite` access to the `taskflow` database
4. Copy the connection string → set it as `MONGO_URI`

The application's lifespan handler calls `create_indexes()` on every startup, ensuring all 9 indexes are present before the first request is served.

---

## 📋 Example API Responses

### `POST /api/v1/auth/login` — Success

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiZXhwIjoxNzE3MDAwMDAwfQ.abc123",
  "token_type": "bearer"
}
```

### `POST /api/v1/auth/login` — Invalid Credentials

```json
{
  "detail": "Invalid email or password.",
  "request_id": "a3f2c1d8"
}
```

### `POST /api/v1/auth/register` — Gmail Validation Error

```json
{
  "detail": "Only Gmail addresses (@gmail.com) are allowed to register.",
  "request_id": "d4e1f2a9"
}
```

### `GET /api/v1/tasks?status=in_progress&sort_by=due_date&limit=2`

```json
{
  "tasks": [
    {
      "id": "6657c2a1b3e4f00012ab3456",
      "title": "Design system audit",
      "description": "Review all components for consistency",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2026-05-15T00:00:00",
      "owner_id": "6657b1a0b3e4f00012ab1234",
      "created_at": "2026-05-01T10:30:00",
      "updated_at": "2026-05-09T08:00:00"
    },
    {
      "id": "6657c3b2c4f50013bc4567",
      "title": "API integration tests",
      "description": null,
      "status": "in_progress",
      "priority": "medium",
      "due_date": "2026-05-20T00:00:00",
      "owner_id": "6657b1a0b3e4f00012ab1234",
      "created_at": "2026-05-03T14:00:00",
      "updated_at": "2026-05-09T09:15:00"
    }
  ],
  "total": 3,
  "page": 1,
  "pages": 2,
  "limit": 2
}
```

### `GET /api/v1/tasks/analytics`

```json
{
  "status_distribution": [
    { "status": "todo",        "count": 5  },
    { "status": "in_progress", "count": 3  },
    { "status": "done",        "count": 12 }
  ],
  "priority_distribution": [
    { "priority": "low",    "count": 4 },
    { "priority": "medium", "count": 8 },
    { "priority": "high",   "count": 8 }
  ],
  "weekly_activity": [
    { "day": "Mon", "date": "2026-05-04", "created": 2, "completed": 1 },
    { "day": "Tue", "date": "2026-05-05", "created": 1, "completed": 3 },
    { "day": "Wed", "date": "2026-05-06", "created": 4, "completed": 2 },
    { "day": "Thu", "date": "2026-05-07", "created": 0, "completed": 1 },
    { "day": "Fri", "date": "2026-05-08", "created": 3, "completed": 4 },
    { "day": "Sat", "date": "2026-05-09", "created": 1, "completed": 0 },
    { "day": "Sun", "date": "2026-05-10", "created": 0, "completed": 0 }
  ],
  "weekly_trend": [
    { "week": "Mar W3", "total": 6,  "done": 3, "rate": 50.0 },
    { "week": "Mar W4", "total": 9,  "done": 5, "rate": 55.6 },
    { "week": "Apr W1", "total": 8,  "done": 5, "rate": 62.5 },
    { "week": "Apr W2", "total": 11, "done": 7, "rate": 63.6 }
  ]
}
```

### `GET /api/v1/admin/stats`

```json
{
  "total_users": 14,
  "admin_users": 2,
  "regular_users": 12,
  "total_tasks": 87,
  "completed_tasks": 43,
  "active_tasks": 19,
  "todo_tasks": 25
}
```

### `GET /api/v1/auth/me`

```json
{
  "id": "6657b1a0b3e4f00012ab1234",
  "username": "johndoe",
  "email": "johndoe@gmail.com",
  "role": "user"
}
```

### `GET /api/v1/health`

```json
{
  "status": "ok",
  "database": "connected",
  "version": "1.0.0",
  "environment": "development"
}
```

### `POST /api/v1/tasks` — Validation Error (Pydantic)

```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "String should have at least 1 character",
      "type": "string_too_short"
    }
  ],
  "request_id": "f1a2b3c4"
}
```

### `GET /api/v1/admin/users` — Forbidden (non-admin)

```json
{
  "detail": "Admin access required.",
  "request_id": "e9d8c7b6"
}
```

---

## 🔮 Future Improvements

### Product Features
- **Task attachments** — file uploads (images, PDFs) stored in S3/R2, linked to individual tasks
- **Comments and activity log** — per-task discussion thread with a full audit trail of status changes
- **Team workspaces** — group tasks under shared projects with member invite management
- **Due-date reminders** — scheduled email notifications 24 hours before a task's due date (Celery + SES)
- **Recurring tasks** — automatic task cloning on a daily/weekly/monthly schedule
- **Task labels / tags** — free-form tagging with multi-select filtering
- **Subtasks** — nested checklist items within a task, each with individual completion state
- **Dark mode** — CSS variable-driven theme toggle, persisted to localStorage

### Engineering
- **TypeScript migration** — full frontend codebase typed with strict mode enabled
- **Test suite** — pytest for backend (unit + integration tests against a test database), Vitest + React Testing Library for frontend component tests
- **CI/CD pipeline** — GitHub Actions: lint → type-check → test → Docker build → deploy on every merge to main
- **OpenTelemetry** — distributed tracing with spans wrapping every DB call and external HTTP request
- **Redis caching** — cache analytics responses with a 30-second TTL to remove load from expensive `$group` aggregations
- **WebSockets** — push real-time task updates to all connected clients without polling
- **Token refresh** — short-lived access tokens (15 min) + long-lived refresh tokens (7 days) with silent background renewal
- **Kubernetes manifests** — Helm chart with Horizontal Pod Autoscaler, liveness/readiness probes, and resource limits

---

## 📄 License

This project was submitted as part of a backend internship assignment.

---

<div align="center">

**Built with FastAPI · React 18 · MongoDB · Docker**

*Designed and developed as a backend internship assignment demonstrating*  
*production-grade API design, async Python, and modern React development.*

</div>
