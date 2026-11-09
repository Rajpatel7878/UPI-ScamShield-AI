# Initial Architecture

This document describes the Phase 1 foundation. It intentionally excludes the
AI fraud detection engine, persistence, and authentication, which belong to
later phases.

## Overview

```
┌─────────────────────────┐        HTTP / JSON        ┌──────────────────────────┐
│  React SPA (Vite)       │  axios → VITE_API_BASE_URL│  FastAPI application     │
│  http://localhost:5173  │ ────────────────────────► │  http://localhost:8000   │
│  Tailwind CSS + Router  │ ◄──────────────────────── │  CORS: FRONTEND_URL      │
└─────────────────────────┘                           └──────────────────────────┘
                                                                    │
                                                        ┌───────────┴───────────┐
                                                        │ Not configured yet    │
                                                        │ (SQLAlchemy reserved) │
                                                        └───────────────────────┘
```

The frontend and backend are independently runnable. The browser calls the API
directly using the base URL from `frontend/.env`, and the backend only accepts
browser requests from the origin configured in `backend/.env`
(`FRONTEND_URL`).

## Backend layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Entry point | `app/main.py` | Creates the FastAPI app, registers CORS, error handlers and the API router |
| API | `app/api/` | HTTP routes; `health.py` exposes `GET /` and `GET /health` |
| Schemas | `app/schemas/` | Pydantic request/response models |
| Services | `app/services/` | Reserved for the fraud detection engine (Phase 2+) |
| Models | `app/models/` | Reserved for SQLAlchemy ORM models (Phase 2+) |
| Database | `app/database/` | Reserved for engine/session setup; no connection exists yet |
| Core | `app/core/` | Settings (`config.py`) and centralized exception handlers (`errors.py`) |

Configuration flows from environment variables into a cached `Settings`
instance (`get_settings()`), so no module reads `os.environ` directly and no
secret is hardcoded.

Every error response shares the same shape:

```json
{
  "status": "error",
  "detail": "Not Found",
  "path": "/does-not-exist"
}
```

Validation failures additionally include an `errors` array.

## Frontend layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Entry point | `src/main.jsx` | Mounts React and imports global Tailwind styles |
| Routing | `src/App.jsx` | `BrowserRouter`, layout route, home route, 404 |
| Layout | `src/layouts/` | Header, API status pill, footer, `<Outlet />` |
| Pages | `src/pages/` | `Home` welcome screen and `NotFound` |
| Components | `src/components/` | Reusable UI such as `ApiStatusCard` |
| Services | `src/services/` | `apiClient` (axios instance + error normalization) and endpoint modules |
| Hooks | `src/hooks/` | `useHealthCheck` for API availability |
| Context | `src/context/` | `AppContext` provides app metadata and health state |
| Utils | `src/utils/` | Shared constants |

## Health check semantics

`GET /health` reports `"database": "not_configured"` on purpose. No database
engine is created in Phase 1, so the endpoint must not claim a connection that
does not exist. When persistence is added, the field will be derived from a
real connectivity check.
