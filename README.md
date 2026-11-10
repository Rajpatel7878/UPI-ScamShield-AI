# UPI ScamShield AI

**Detect. Analyze. Protect.**

AI-powered fraud detection and digital payment security.

> **Project status: Phase 2 — Design system.** Phases 1 and 2 are complete: the
> working full-stack foundation plus a reusable, token-driven frontend design
> system. The AI fraud detection engine is **not implemented yet** and is
> planned for a later phase.

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

Phase 1 objectives (delivered):

- Establish a clean React + Vite frontend with routing, styling, and a service layer.
- Establish a modular FastAPI backend with configuration and error handling.
- Provide health-check endpoints for monitoring and integration testing.
- Wire frontend → backend communication through environment variables and CORS.
- Document setup, architecture, and the roadmap.

Phase 2 objectives (delivered):

- Define a token-driven visual identity (surfaces, brand, semantic colors, type scale, motion).
- Ship a reusable component library with accessible, documented states.
- Keep the component catalogue verifiable on an internal `/design-system` route.

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

### Frontend design system

- Tokens live in `frontend/src/styles/design-tokens.css` and are consumed as
  Tailwind utilities such as `bg-navy-800`, `text-brand-300`, `rounded-card`
  and `shadow-card`.
- Primitives are in `src/components/ui`, layout pieces in
  `src/components/common`, and navigation elements in `src/components/navigation`.
- The internal showcase at <http://localhost:5173/design-system> documents the
  brand, typography, palette, buttons, cards, badges, form controls, loading
  states, feedback, navigation and responsive layouts. It is linked from the
  footer only, never the primary navigation.

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
│   │   │   ├── ui/            # buttons, cards, badges, forms, feedback
│   │   │   ├── common/        # container, headers, brand logo, grid
│   │   │   ├── navigation/    # nav link, avatar, dropdown
│   │   │   └── ApiStatusCard.jsx
│   │   ├── pages/
│   │   │   ├── DesignSystem.jsx
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
│   │   ├── styles/
│   │   │   └── design-tokens.css
│   │   ├── utils/
│   │   │   ├── cn.js
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
| 2 | Frontend design system: tokens, component library, `/design-system` showcase | **Implemented** |
| 3 | Database layer (SQLAlchemy engine, models, migrations), persisted scan records | *Planned — not implemented* |
| 4 | Fraud detection engine (rules + ML risk scoring, explainable output) | *Planned — not implemented* |
| 5 | Scan APIs: submit a UPI request/message, receive risk verdict with reasons | *Planned — not implemented* |
| 6 | User accounts and authentication (JWT), scan history | *Planned — not implemented* |
| 7 | Analytics dashboard, reporting, admin views | *Planned — not implemented* |
| 8 | Deployment, monitoring, rate limiting, hardening | *Planned — not implemented* |

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

## Phase 15 — Detection History and Security Analytics

### Detection history architecture
- Scan results are persisted in the existing `scans` table (SQLAlchemy `Scan` model) and associated with the authenticated user (`user_id`).
- Raw submitted message content is not stored; history and analytics operate on saved metadata and analysis outputs (risk score/level, category, summary, indicators, recommendations, timestamps).
- All history and analytics endpoints require authentication and return data scoped to the current user only.

### History API endpoints
Base prefix: `/api/v1`

#### `GET /detect/history`
Returns paginated scan history for the authenticated user.

**Query parameters**
- `page` (int, default 1)
- `limit` (int, default 10, max 100)
- `risk_level` (`Low|Medium|High|Critical`)
- `content_type` (`sms|whatsapp|payment_request|url|general`)
- `category` (string)
- `start_date`, `end_date` (ISO-8601 date/datetime)
- `search` (safe metadata search: content type, risk level, category, summary)
- `sort_by` (`created_at` or `risk_score`)
- `sort_order` (`asc` or `desc`)

**Example response**
```json
{
  "success": true,
  "items": [
    {
      "id": 12,
      "content_type": "sms",
      "risk_score": 86,
      "risk_level": "Critical",
      "category": "Credential Theft",
      "summary": "Detected 3 indicator(s) associated with potential fraud patterns.",
      "created_at": "2026-11-10T12:34:56+00:00"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 25, "total_pages": 3 },
  "overview": {
    "total_scans": 25,
    "suspicious_scans": 9,
    "critical_scans": 2,
    "most_recent_scan_date": "2026-11-10T12:34:56+00:00"
  }
}
```

#### `GET /detect/history/{scan_id}`
Returns saved scan details for the authenticated owner only. Nonexistent or unauthorized records return `404` to avoid leaking record existence.

**Example response**
```json
{
  "success": true,
  "scan": {
    "id": 12,
    "content_type": "sms",
    "risk_score": 86,
    "risk_level": "Critical",
    "category": "Credential Theft",
    "summary": "Detected 3 indicator(s) associated with potential fraud patterns.",
    "indicators": [
      { "name": "OTP request", "severity": "high", "description": "Message asks for OTP", "source": "rule_based" }
    ],
    "recommendations": ["Do not share OTP or UPI PIN"],
    "analysis_type": "rule_based_only",
    "rule_based_status": "completed",
    "gemini_status": "unavailable",
    "url_status": "not_applicable",
    "created_at": "2026-11-10T12:34:56+00:00"
  }
}
```

#### `DELETE /detect/history`
Deletes all scan history for the authenticated user only (requires explicit confirmation in frontend). Returns number of deleted records.

```json
{ "success": true, "deleted": 25 }
```

### Analytics API
#### `GET /dashboard/stats`
Returns real, user-scoped dashboard statistics (supports optional `days` query parameter).

Includes: `total_scans`, `suspicious_scans`, `critical_alerts`, `average_risk_score`, `risk_distribution`, `content_type_distribution`, `detection_category_distribution`, `daily_scan_activity`, `recent_scans`, `risk_insights`, `most_recent_scan_date`.

#### `GET /analytics/overview`
Returns extended analytics for the `/analytics` page (supports optional `days` query parameter for 7/30/90-day periods; omit for all time).

Includes dashboard fields plus: `period_days`, `weekly_trends`, `monthly_trends`, `most_frequent_indicators`, `security_insights`.

**Example response (truncated)**
```json
{
  "success": true,
  "total_scans": 25,
  "suspicious_scans": 9,
  "critical_alerts": 2,
  "average_risk_score": 47.2,
  "risk_distribution": { "Low": 10, "Medium": 6, "High": 7, "Critical": 2 },
  "content_type_distribution": { "sms": 14, "whatsapp": 7, "url": 4 },
  "detection_category_distribution": { "Credential Theft": 8, "Payment Fraud": 5 },
  "daily_scan_activity": [{ "date": "2026-11-09", "count": 3 }],
  "weekly_trends": [{ "period": "2026-W46", "count": 25 }],
  "monthly_trends": [{ "period": "2026-11", "count": 25 }],
  "most_frequent_indicators": [{ "name": "OTP request", "count": 6 }],
  "security_insights": ["Most of your scans involved sms content."]
}
```

### Frontend history and analytics features
- **History page (`/history`)**: overview cards (total/suspicious/critical/most recent), filterable/sortable/paginated table (risk level, content type, category, date range, safe metadata search), loading/empty/no-results/error states, scan detail modal (risk/category/summary/indicators with source/severity/explanation, recommendations, analysis/source statuses, timestamp), and clear-history action with explicit confirmation.
- **Analytics page (`/analytics`)**: summary cards, risk distribution pie chart, daily activity line chart, content-type bar chart, top detection categories, deterministic security insights, and time-range filters (7/30/90/all) fetched from backend.
- **Dashboard**: real backend stats, consistent totals/risk definitions, recent scans and insights from `/dashboard/stats`, empty states for new accounts, and refresh action.

### Privacy and security safeguards
- Authentication required on all history/analytics endpoints; strict user-level data isolation.
- Scan detail returns 404 for unauthorized/nonexistent IDs; bulk delete scoped to current user only.
- Raw submitted message content is never stored, searched, or returned.
- Input validation and pagination limits (max page size 100); safe error responses without internal prompts/keys/stack traces.
- Frontend requires explicit confirmation before clearing history.

### Testing instructions
Backend:
```bash
cd backend
pytest -q
```

Frontend build:
```bash
cd frontend
npm run build
```

Phase 15 backend tests: `backend/tests/test_phase15_history_analytics.py` (history auth/isolation/pagination/filters/sort/search/detail/delete and dashboard/analytics stats using temporary SQLite databases and fictional records).

## Phase 16 — UPI Scam Awareness and Education Center

The public `/awareness` route is a self-contained education center. All content is
definitional and read-only in the frontend (`frontend/src/data/awareness/`), so the
page requires no backend calls and no authentication.

### Awareness Center features
- **Awareness dashboard**: counts of guides/rules/quiz questions, section shortcuts,
  and a curated daily safety tip with previous/next navigation.
- **Common UPI scams library**: 15 educational guides with search and category filters.
- **Scam detail view**: overview, how the scam works, psychological manipulation
  techniques, warning signs, a clearly labelled fictional example, avoidance guidance,
  actions if targeted, and related scam links. Includes a back action to the library.
- **How to identify suspicious messages**: 11 red flags plus a verification reminder.
- **UPI safety rules**: 12 interactive checklist items with local-only progress.
- **Emergency response**: nine numbered steps, a prominent 1930 call link, and a
  recovery-scam warning.
- **FAQ**: 10 common questions in an accessible accordion.
- **Knowledge quiz**: 12 multiple-choice questions with immediate feedback,
  explanations, a final score, correct-answer review, and restart.
- **Official resources**: clearly labelled external links to the National Cyber Crime
  Reporting Portal, the 1930 helpline, NPCI, and the RBI.

### Scam categories
| Category | Guides |
| --- | --- |
| Payment fraud | UPI PIN collection, fake payment screenshot, collect request, QR-code payment, investment and trading |
| Phishing | Phishing website and malicious URL |
| Identity theft | OTP theft |
| Social engineering | Fake customer care, screen-sharing/remote access, job and work-from-home, government impersonation |
| Banking fraud | Fake KYC verification, fake bank account-blocking message |
| Online shopping and rewards | Fake cashback and reward, lottery and prize |

All 15 guides include a fictional example message explicitly marked as an
educational example. No real victim information is used, and no message is presented
as a real communication.

### UPI safety checklist
Never share your UPI PIN · Never share OTPs or banking passwords · Enter your PIN only
inside your trusted payment app when intentionally authorizing a transaction ·
Receiving money never requires a PIN · Verify the recipient before sending · Do not
approve unknown collect requests · Avoid suspicious SMS/WhatsApp links · Never install
remote-access apps for an unknown caller · Do not trust payment screenshots without
checking your account history · Verify customer-care numbers through official sources ·
Be suspicious of unexpected rewards and urgent requests · Keep payment apps and devices
updated.

Checked items are kept in component state for the session only; nothing is stored or
transmitted.

### Emergency response and official resources
If money is lost, the page advises: stop further payments, contact the bank through
official channels, call **1930** as soon as possible, file a complaint at
[cybercrime.gov.in](https://cybercrime.gov.in/), preserve transaction IDs and evidence,
secure affected services and passwords, and beware of recovery scams. The content
states explicitly that recovery is not guaranteed and that reporting does not
automatically reverse a transaction.

Official resources shown: National Cyber Crime Reporting Portal
(https://cybercrime.gov.in/), Indian Cybercrime Helpline **1930**, NPCI
(https://www.npci.org.in/), and the Reserve Bank of India (https://www.rbi.org.in/).
External links open in a new tab with `rel="noopener noreferrer"`.

### Quiz and search behaviour
- Search matches scam names, descriptions, categories, warning signs, and how-it-works
  steps, and updates as the user types.
- Category filters cover the six categories above; a reset action clears both search
  and filters, and an explicit no-results state is shown when nothing matches.
- The quiz evaluates each answer immediately, requires an answer before continuing,
  explains every correct answer, and reviews all responses with the final score.
  It collects no personal information and is not a certification.

### Testing instructions
```bash
cd frontend
npm run build

cd ../backend
pytest -q
```

The Awareness Center is static frontend content, so there is no new backend test
surface for Phase 16. Manual checks: open `/awareness` with the app running, confirm all
seven sections render, open and close several scam guides, search for `OTP` and `KYC`,
filter each category, trigger the no-results state and reset it, complete the quiz and
restart it, check the checklist progress, and confirm the four official links and the
1930 number.

Phase 16 adds no database models, AI providers, payment processing, forums, or
user-generated content.
