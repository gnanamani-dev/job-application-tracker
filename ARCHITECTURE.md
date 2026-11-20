# Job Application Tracker — Phase 1 Plan

## Project inspection and tool versions

The project folder initially contained `AGENTS.md` and an empty `PROGRESS.md`; no application code or existing structure was present.

| Tool | Result | Notes |
| --- | --- | --- |
| Node.js | `v24.13.0` | Available on PATH. |
| npm | `11.6.2` | Available via `npm.cmd`; PowerShell's `npm` script shim is blocked by the current execution policy. |
| Python | Not detected | Neither `python` nor the Windows `py` launcher is available on PATH. |
| PostgreSQL client | Not detected | `psql` was not checked during Phase 1, so the server/client version cannot yet be confirmed. |

Before backend setup (Phase 3), install Python and PostgreSQL Server or otherwise make them available, then confirm versions. The project remains planned for the fixed stack in `AGENTS.md`.

## Application architecture

The browser-based React application calls a Django REST API over HTTP. The API validates requests, applies authentication and ownership checks, and reads or writes records in PostgreSQL through Django's ORM and the `psycopg` driver. Django's built-in user model supplies accounts; each job application belongs to exactly one user.

```text
Browser (React + Vite)
  Pages and reusable components
  React Router for navigation / protected pages
  Context + useReducer for shared client state
  Axios API client (access token attached to requests)
           │ JSON over HTTP
           ▼
Django + Django REST Framework
  serializers validate input/output
  views/viewsets implement endpoints
  permissions enforce login and record ownership
  Simple JWT issues and refreshes tokens
           │ Django ORM
           ▼
PostgreSQL
  auth_user ───────< job_applications
```

**Request flow:** a page calls a frontend API function; Axios sends JSON to the matching DRF endpoint; a serializer validates it; the view applies ownership rules and uses the ORM; the API returns JSON; React updates the screen and shared state. This separation keeps display logic, HTTP communication, validation, and data storage understandable and maintainable.

### Django database connection

Configure Django with the PostgreSQL backend and `psycopg`. Read connection settings from environment variables rather than hardcoding credentials. For example, the settings shape will be:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ["POSTGRES_DB"],
        "USER": os.environ["POSTGRES_USER"],
        "PASSWORD": os.environ["POSTGRES_PASSWORD"],
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}
```

Keep real credentials in a local ignored `.env`; list placeholder variable names in `.env.example`.

## PostgreSQL data design

### `auth_user` (Django-managed)

Use Django's built-in user table for registration and login rather than duplicating password/account data in a custom table. Django stores password hashes, not plain-text passwords. The exact built-in table name may vary if the user model is changed later; this plan assumes the default model.

### `job_applications`

| Column | Suggested type | Rules / purpose |
| --- | --- | --- |
| `id` | `BIGINT` | Primary key; Django-generated. |
| `user_id` | `BIGINT` | Required foreign key to `auth_user.id`; every query must be scoped to this owner. |
| `company` | `VARCHAR(150)` | Required; company name. |
| `role` | `VARCHAR(150)` | Required; job title/role. |
| `status` | `VARCHAR(30)` | Required; one of Applied, Interview, Technical Round, Offer, Rejected. |
| `applied_date` | `DATE` | Required; date the user applied. |
| `location` | `VARCHAR(150)` | Required or optional by product decision; record whether remote/on-site if useful. |
| `job_url` | `URL` / `VARCHAR(200)` | Optional link to the posting. |
| `salary` | `DECIMAL(12,2)` | Optional; use a decimal type to avoid currency rounding errors. Define a currency assumption before implementation. |
| `notes` | `TEXT` | Optional user notes. |
| `created_at` | `TIMESTAMPTZ` (Django `DateTimeField`) | Automatically set when created; use timezone-aware timestamps. |
| `updated_at` | `TIMESTAMPTZ` (Django `DateTimeField`) | Automatically changed on update; use timezone-aware timestamps. |

Relationship: one user can have many applications; each application has one owner. Deleting a user should cascade-delete that user's applications. Index `user_id`; consider a composite index on `(user_id, status)` for the user's filtered board/list. PostgreSQL stores Unicode text natively. Enforce valid statuses in backend validation (and optionally a database check using a PostgreSQL check constraint). Do not treat a client-supplied `user_id` as ownership authority: derive the owner from the authenticated request.

## REST API endpoint plan

Base path: `/api/`. JSON request and response bodies. Authentication-required routes use `Authorization: Bearer <access-token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register/` | Create an account; validate required credentials and uniqueness. |
| `POST` | `/api/auth/token/` | Log in and return JWT access and refresh tokens. |
| `POST` | `/api/auth/token/refresh/` | Exchange a valid refresh token for a new access token. |
| `GET` | `/api/auth/me/` | Return the current authenticated user's safe profile data. |
| `GET` | `/api/applications/` | List only the current user's applications; later support search/filter/order and pagination. |
| `POST` | `/api/applications/` | Create an application owned by the current user. |
| `GET` | `/api/applications/{id}/` | Retrieve one of the current user's applications. |
| `PUT` / `PATCH` | `/api/applications/{id}/` | Replace or partially update one of the current user's applications. |
| `DELETE` | `/api/applications/{id}/` | Delete one of the current user's applications. |
| `GET` | `/api/dashboard/summary/` | Return counts for totals and statuses for the current user. |
| `GET` | `/api/analytics/applications/` | Return chart-ready time/status aggregates for the current user. |

The list API should accept query parameters such as `search`, `status`, `location`, and `ordering` once search/filtering is implemented. The dashboard and analytics endpoints can be built in their named phases. Kanban drag-and-drop can use `PATCH /api/applications/{id}/` with a new `status`, avoiding an extra endpoint.

## Recommended folder structures

These are targets, not files created in Phase 1.

### Frontend

```text
frontend/
  src/
    api/                 # Axios instance and endpoint functions
    app/                 # Router and app-level providers
    assets/              # Static images/icons
    components/           # Reusable UI (forms, layout, feedback)
    features/
      auth/               # Login/register UI and auth state helpers
      applications/       # Application list, form, card, board
      dashboard/          # Summary widgets
      analytics/          # Recharts views
    hooks/                # Shared custom hooks
    pages/                # Route-level screens
    context/              # Context + useReducer state
    utils/                # Formatting and small pure helpers
    main.jsx
  index.html
  package.json
  vite.config.js
```

### Backend

```text
backend/
  manage.py
  config/                 # Django settings, root URLs, WSGI/ASGI
  accounts/               # Registration and current-user endpoints
  applications/           # Model, serializer, views, URLs, permissions
  dashboard/              # Summary and analytics endpoints
  requirements.txt
  .env.example
```

Keep secrets and local PostgreSQL credentials in an ignored local `.env`; commit only `.env.example` with placeholder variable names and no secrets. Use `psycopg` as the Django PostgreSQL driver.

## Likely technical challenges

1. **Environment setup:** Python is not currently detected, and PostgreSQL availability has not yet been checked. Confirm both during backend setup and verify `psycopg` can connect.
2. **Credentials and configuration:** configure Django settings through environment variables and keep real secrets out of Git.
3. **Ownership security:** every detail, list, update, delete, count, and chart query must be limited to `request.user`; test attempts to access another user's IDs.
4. **JWT lifecycle:** handle expired access tokens, refresh failures, logout behavior, and safe browser token storage consistently.
5. **Validation consistency:** enforce the same status options and field constraints on both client and server; backend validation is the security boundary.
6. **Date/time and currency:** store applied dates as dates, timestamps consistently, and define how salary currency is represented before implementing salary analytics.
7. **Filtering and performance:** combine a user's ownership scope with search/status filters and pagination; add indexes only for demonstrated query needs.
8. **Kanban updates:** persist status changes, handle failed requests, and avoid the UI showing a move that the server rejected.
9. **Analytics accuracy:** define date ranges and status-count semantics so chart totals match dashboard totals.
10. **Responsive and accessible UI:** forms, navigation, charts, and drag-and-drop interactions need usable keyboard and small-screen behavior.
11. **CORS and deployment:** allow only intended frontend origins in production and configure HTTPS, allowed hosts, static files, database access, and environment secrets.

## Phase 1 completion checklist

- [x] Inspected the project folder and read `AGENTS.md`.
- [x] Checked available runtime/client versions and noted missing tools.
- [x] Planned architecture, tables, endpoints, and target folder structures.
- [x] Identified likely technical challenges.
- [x] Created a 13-phase progress tracker in `PROGRESS.md`.
- [x] No application code written.
