# UPI ScamShield AI

**Detect. Analyze. Protect.**

AI-powered fraud detection and digital payment security.

> **Project status: Phase 1 — Foundation.** This repository currently contains
> the working full-stack skeleton: React frontend, FastAPI backend, environment
> configuration, and connectivity between them. The AI fraud detection engine
> is **not implemented yet** and is planned for a later phase.

---

## 1. Introduction

UPI ScamShield AI is a cybersecurity platform concept for the Unified Payments
Interface (UPI) ecosystem in India. The end goal is a system that analyzes
payment requests, messages, and transaction context to flag likely fraud before
money leaves a user's account — and explains *why* a request looks suspicious.

This phase establishes a professional, maintainable development foundation so
later phases can focus purely on the detection intelligence.

## 2. Problem Statement

UPI fraud is fast, social, and hard to reverse. Attackers impersonate buyers,
sellers, bank officials, or delivery agents; they send collect requests that
debit the victim; they share fake payment screenshots; and they pressure users
into approving transactions within seconds. Most users have no tooling that
inspects a request and says, in plain language, "this looks like a scam."

ScamShield AI aims to close that gap with an accessible, explainable risk
assessment layer.

## 3. Objectives

Phase 1 objectives (all delivered):

- Establish a clean React + Vite frontend with routing, styling, and a service layer.
- Establish a modular FastAPI backend with configuration and error handling.
- Provide health-check endpoints for monitoring and integration testing.
- Wire frontend → backend communication through environment variables and CORS.
- Document setup, architecture, and the roadmap.

Later-phase objectives are listed in the [roadmap](#12-development-roadmap) and
are explicitly marked as not implemented.

## 4. Technology Stack

| Area | Technology | Version |
| --- | --- | --- |
| Frontend | React | 19 |
| Frontend build tool | Vite | 8 |
| Language | JavaScript (ES modules) | — |
| Styling | Tailwind CSS (via `@tailwindcss/vite`) | 4 |
| Routing | React Router DOM | 7 |
| Icons | Lucide React | 1 |
| HTTP client | Axios | 1 |
| Backend | Python | 3.14 |
| API framework | FastAPI | 0.162 |
| ASGI server | Uvicorn | 0.54 |
| Validation | Pydantic / pydantic-settings | 2 |
| ORM (prepared, unused) | SQLAlchemy | 2.1 |
| Testing | pytest + httpx | — |

## 5. Initial Architecture

```
┌─────────────────────────┐        HTTP / JSON        ┌──────────────────────────┐
│  React SPA (Vite)       │  axios → VITE_API_BASE_URL│  FastAPI application     │
│  http://localhost:5173  │ ────────────────────────► │  http://localhost:8000   │
│  Tailwind CSS + Router  │ ◄──────────────────────── │  CORS: FRONTEND_URL      │
└─────────────────────────┘                           └──────────────────────────┘
```

- The frontend is a single-page app. `src/services/apiClient.js` creates the
  single axios instance used by all API modules.
- The backend exposes its routes through one aggregated router
  (`app/api/__init__.py`), keeping `app/main.py` small.
- Cross-origin requests are allowed only from `FRONTEND_URL`.
- No database connection exists yet; `GET /health` therefore reports
  `"database": "not_configured"`.

Detailed layer-by-layer notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 6. Project Folder Structure

```
UPI-ScamShield-AI/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo.svg
│   │   ├── components/
│   │   │   └── ApiStatusCard.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── NotFound.jsx
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx
│   │   ├── services/
│   │   │   ├── apiClient.js
│   │   │   └── healthService.js
│   │   ├── hooks/
│   │   │   └── useHealthCheck.js
│   │   ├── context/
│   │   │   ├── AppContext.js
│   │   │   └── AppProvider.jsx
│   │   ├── utils/
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── errors.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── health.py
│   │   ├── models/
│   │   │   └── __init__.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── health.py
│   │   ├── services/
│   │   │   └── __init__.py
│   │   └── database/
│   │       └── __init__.py
│   ├── tests/
│   │   └── test_health.py
│   ├── .env.example
│   ├── requirements.txt
│   └── requirements-dev.txt
├── docs/
│   └── ARCHITECTURE.md
├── .gitignore
├── LICENSE
└── README.md
```

## 7. Installation

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+ (developed on 3.14)
- Git

### Clone and install

```bash
git clone <your-repository-url> UPI-ScamShield-AI
cd UPI-ScamShield-AI
```

Backend:

```bash
cd backend
python -m venv .venv
# Windows (Git Bash)
source .venv/Scripts/activate
# macOS / Linux
# source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
```

## 8. Frontend Startup

```bash
cd frontend
npm run dev
```

Open <http://localhost:5173>. The dev server is pinned to port 5173
(`strictPort: true`) because the backend allow-lists that exact origin.

Other frontend scripts:

```bash
npm run build     # production build → frontend/dist
npm run preview   # serve the production build on port 5173
npm run lint      # oxlint
```

## 9. Backend Startup

```bash
cd backend
source .venv/Scripts/activate        # Windows (Git Bash)
# source .venv/bin/activate          # macOS / Linux
uvicorn app.main:app --reload --port 8000
```

- API root: <http://localhost:8000>
- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- OpenAPI schema: <http://localhost:8000/openapi.json>

Run the backend tests:

```bash
pip install -r requirements-dev.txt
pytest -v
```

## 10. Environment Configuration

No secrets are committed. Only `.env.example` files are tracked; the real
`.env` files are gitignored.

### `frontend/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL used by the axios client |

Vite only exposes variables prefixed with `VITE_`. Restart the dev server after
changing them.

### `backend/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `UPI ScamShield AI` | Service name in responses and docs |
| `APP_VERSION` | `0.1.0` | Reported API version |
| `ENVIRONMENT` | `development` | Deployment context |
| `FRONTEND_URL` | `http://localhost:5173` | The only origin allowed by CORS |

## 11. API Health Check

### `GET /`

```json
{
  "status": "ok",
  "service": "UPI ScamShield AI API",
  "version": "0.1.0"
}
```

### `GET /health`

```json
{
  "status": "healthy",
  "database": "not_configured",
  "service": "UPI ScamShield AI"
}
```

`database` is `not_configured` by design: persistence is not wired up in this
phase.

Errors share one shape, e.g. for an unknown route:

```json
{
  "status": "error",
  "detail": "Not Found",
  "path": "/does-not-exist"
}
```

The welcome screen calls `GET /health` on load and shows the live connection
state in the header and in the status card.

## 12. Development Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Project foundation, routing, Tailwind, health API, CORS, env config, docs | **Implemented** |
| 2 | Database layer (SQLAlchemy engine, models, migrations), persisted scan records | *Planned — not implemented* |
| 3 | Fraud detection engine (rules + ML risk scoring, explainable output) | *Planned — not implemented* |
| 4 | Scan APIs: submit a UPI request/message, receive risk verdict with reasons | *Planned — not implemented* |
| 5 | User accounts and authentication (JWT), scan history | *Planned — not implemented* |
| 6 | Analytics dashboard, reporting, admin views | *Planned — not implemented* |
| 7 | Deployment, monitoring, rate limiting, hardening | *Planned — not implemented* |

No AI or fraud-scoring functionality exists in the current codebase; nothing in
the UI claims otherwise.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| "Backend unreachable" on the welcome screen | Start Uvicorn on port 8000, or fix `VITE_API_BASE_URL` in `frontend/.env` and restart Vite |
| Browser CORS error | `FRONTEND_URL` in `backend/.env` must match the browser origin exactly (`http://localhost:5173`); restart Uvicorn after changing it |
| `Port 5173 is already in use` | Stop the process using port 5173 — the frontend uses `strictPort` so CORS stays predictable |
| `ModuleNotFoundError: No module named 'app'` | Run `uvicorn` and `pytest` from the `backend/` directory |

## License

Released under the [MIT License](LICENSE).
