# UPI ScamShield AI — Project Description

**Project name:** UPI ScamShield AI
**Tagline:** Detect. Analyze. Protect.
**Developer:** Raj Patel (individual project)
**Repository:** <https://github.com/Rajpatel7878/UPI-ScamShield-AI>
**Live application:** not deployed yet — no URL is claimed until it is verified.

---

## 1. Problem statement

UPI has made paying someone as easy as scanning a code, and that convenience is
exactly what fraudsters exploit. Common attacks include:

- **OTP and PIN harvesting** — messages posing as bank verification that ask for
  a one-time password or UPI PIN ("share to receive your refund").
- **Fake KYC / account-blocking threats** — "your account will be frozen today"
  with a link to a look-alike bank page.
- **Collect-request abuse** — a payment request that looks like an incoming
  credit but debits the account when approved.
- **Advance-fee and prize scams** — "pay the processing fee to release your
  winnings".
- **Shortened / look-alike links** — `bit.ly`-style redirects and typo-squatted
  domains that lead to credential-harvesting pages.

The victim's decision window is seconds, the warning signs are scattered across
text, urgency and a URL, and most tools give a verdict without explaining it.
There is no simple, private way to ask *why* a payment message looks wrong.

## 2. Proposed solution

UPI ScamShield AI is a web application where a user pastes a suspicious message
or link and receives:

- a **0–100 risk score** and a **risk level** (Low / Medium / High / Critical);
- a **category** (for example Credential Theft, Fake Verification, Payment Fraud);
- an **indicator list** with severity, description and source
  (`rule_based`, `url_based`, `gemini`);
- **practical recommendations** and an explicit safety warning;
- optional **history and analytics** so a signed-in user can review past scans,
  and a **Scam Awareness Center** for prevention.

The analysis is deliberately layered so it stays useful when AI is unavailable:
rules and passive URL inspection always run; Gemini only adds a second opinion.

## 3. Target users

- **Everyday UPI users** who receive unexpected payment or KYC messages.
- **First-time digital payment users and elderly family members** who are
  frequent targets and often unaware of collect-request mechanics.
- **Students and young professionals** who share screenshots of suspicious
  messages in group chats and want a second opinion.
- **Awareness educators and trainers** who need concrete examples, warning signs
  and official reporting links in one place.

The product is educational and advisory: it informs a decision, it does not
block transactions or act as a bank.

## 4. Main features

| Feature | What it does |
| --- | --- |
| Detection workspace | SMS, WhatsApp, payment request, general text and URL input with example messages |
| Explainable rule engine | Weighted rules across 10 fraud categories with severity and description per indicator |
| Passive URL analysis | Parses links for IP hosts, suspicious TLDs, shorteners, deep subdomains, credential user-info, punycode, risky keywords and ports — without opening them |
| Optional Gemini analysis | Strictly validated second opinion, automatically skipped when no key is configured |
| Hybrid scoring | Documented merge of rule, URL and AI signals; rules remain authoritative without AI |
| Accounts | Registration and login with Argon2id hashing and signed JWTs |
| History | Filter, sort, paginate, open scan detail, delete all history; strictly owner-only |
| Dashboard and analytics | User-scoped totals, risk distribution, activity trend, empty states |
| Scam Awareness Center | Scam guides, warning signs, emergency response, official reporting links, FAQ, checklist and a 12-question quiz |
| Privacy controls | Submitted text is never stored; URL query values are redacted |

## 5. Technical implementation

**Frontend** — React 19 single-page application built with Vite 8 and styled
with Tailwind CSS 4. React Router 7 handles public, auth and protected routes;
route-level lazy loading keeps the landing page fast. Axios talks to the API with
a bearer token, normalizes errors and clears the session on `401`.

**Backend** — FastAPI on Python 3.11+ with Pydantic 2 contracts. The API is
versioned under `/api/v1` and split into system, auth, detection/history and
dashboard/analytics routers. Middleware enforces a 1 MB body limit, per-IP rate
limits and security headers; a centralized handler keeps every error shape
consistent and never echoes submitted secrets.

**Detection** — a normalizer (case, Unicode, spacing variants) feeds a weighted
rule set, followed by passive URL parsing and optional Gemini analysis. Scoring
uses the stronger of the rule and URL scores as a base, then applies a documented
60/40 merge only when Gemini returns a schema-valid result.

**Data** — SQLAlchemy 2.1 with SQLite for local development and PostgreSQL
(psycopg 3) in production. Alembic owns the schema; production startup verifies
the migrated schema instead of creating tables. Only analysis metadata is stored:
content type, score, level, category, summary, indicators, recommendations and
timestamps.

**Quality** — 104 backend tests (auth, JWT edge cases, detection, URL engine,
Gemini validation/fallback, history, analytics, isolation, database), a frontend
production build, lint and dependency audits. See
`docs/PHASE_17_QA_REPORT.md` and `docs/FINAL_PROJECT_REPORT.md`.

## 6. Innovation and differentiation

1. **Explanation over verdict.** Every point in the score maps to a named
   indicator with severity, category and source, so the user learns the pattern
   rather than trusting a black box.
2. **AI-optional by design.** Gemini is an enhancement, not a dependency. With no
   key — or during a provider outage — rules and URL analysis still produce a
   complete, explainable result, and the response states honestly that AI was
   unavailable.
3. **Safe URL inspection.** Links are parsed, never opened: no DNS lookups, HTTP
   requests or redirect follows. This removes SSRF and drive-by exposure while
   still surfacing the structural signals that matter in phishing links.
4. **Privacy-first analysis.** The message itself is never stored and URL query
   values are redacted, while still preserving enough metadata for history and
   analytics.
5. **Prevention, not just detection.** The Awareness Center turns each scan into
   education: scam guides, warning signs, emergency steps, official reporting
   links and a quiz.
6. **Production-honest engineering.** Explicit CORS allowlist, fail-fast JWT
   secret validation, migration-verified production startup, structured logs and
   documented limitations instead of inflated claims.

## 7. Security and privacy considerations

- Argon2id password hashing; JWTs verify issuer, audience, expiry, issued-at,
  subject and token type, and accept only the configured HMAC algorithm.
- Production refuses to start without a 32+ character, non-weak JWT secret.
- Rate limits on login, registration, analysis and general API traffic; 1 MB
  body cap; security headers and HSTS in production.
- CORS is an explicit allowlist; wildcards are discarded.
- Every scan query is filtered by `user_id`; another user's scan returns `404`.
- Submitted content is not persisted and not logged; URL query values are
  redacted in responses and stored indicators.
- Gemini keys exist only in backend environment variables and are never sent to
  the browser. When AI is enabled, the submitted text is processed by Google
  under the Gemini API terms — this is disclosed in the UI and README, and
  leaving the key empty keeps all analysis local.
- Limitation: the project has not had a professional penetration test or security
  certification, and heuristic detection is not proof of fraud.

## 8. Limitations

- Heuristic scoring produces false positives and false negatives; a low score is
  not a guarantee of safety.
- URL analysis is passive, so page content, domain age, TLS and redirect chains
  are not inspected.
- JWTs live in `localStorage` with no server-side revocation; logout is
  client-side and tokens expire after 30 minutes by default.
- No CAPTCHA, MFA, email verification, password reset or account deletion.
- Rate limiting is per process, so multi-instance deployments need a shared store.
- No trained machine-learning model or labelled-dataset accuracy claim is made.
- PostgreSQL compatibility is verified at SQL-dialect and driver level; the live
  deployment still needs end-to-end verification on a real database.

No user counts, accuracy figures or evaluation metrics are claimed anywhere in
this package, because none have been measured.
