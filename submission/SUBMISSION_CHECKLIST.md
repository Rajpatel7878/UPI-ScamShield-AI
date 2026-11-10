# UPI ScamShield AI — Submission Checklist

Legend: **[x]** done and verified · **[ ]** pending · **[manual]** requires the
project owner's account or a live deployment

Last updated: 10 November 2026 (Phase 18).

---

## 1. Repository

- [ ] **Public GitHub repository** — <https://github.com/Rajpatel7878/UPI-ScamShield-AI>
      ([manual] confirm the repository visibility is Public in GitHub → Settings;
      it cannot be verified from this environment).
- [x] Source code complete and committed on branch `main`.
- [x] `.gitignore` covers `.env`, `*.db`, `node_modules/`, `dist/`, `venv/`,
      `.vercel/`, logs and caches.
- [x] No committed secrets — repository scan for API keys, private keys,
      connection strings and JWTs found none; only `.env.example` templates are
      tracked.
- [x] No stray build artifacts, editor files, `.bak` files or one-off scripts.
- [x] License present (MIT).
- [x] README rewritten as a full project presentation.
- [x] Commit history preserved (no force-push, no history rewrite).

## 2. Application

- [x] Backend starts locally and `/api/v1/health` reports `healthy`/`connected`.
- [x] Registration, login, protected routes and logout work.
- [x] SMS/WhatsApp/payment/general text analysis returns score, level, category,
      indicators and recommendations.
- [x] URL analysis is passive and redacts query values.
- [x] History persists per user; another user's scan returns `404`.
- [x] Dashboard and analytics return user-scoped data with empty states.
- [x] Scam Awareness Center loads guides, search, quiz and official links.
- [x] Responsive layout verified at mobile width in the Phase 17 browser pass.
- [ ] **[manual]** Re-verify the full journey in a browser against the final
      deployment (see section 6).

## 3. Live application

- [ ] **Frontend deployed** to Vercel ([manual]).
- [ ] **Backend deployed** to Render ([manual]).
- [ ] **Managed PostgreSQL provisioned** and migrated ([manual]).
- [ ] `FRONTEND_URL` set to the deployed Vercel origin and backend redeployed
      ([manual]).
- [ ] `VITE_API_BASE_URL` set in Vercel and redeployed ([manual]).
- [ ] Live frontend URL verified: landing page, navigation, auth, detection,
      history, analytics, awareness, mobile layout, no CORS/mixed-content errors
      ([manual]).
- [ ] Live backend URL verified: health, docs (if enabled), register/login,
      analyze, history ([manual]).
- [ ] Only after the above: add the live frontend and API URLs to the README and
      `docs/FINAL_PROJECT_REPORT.md` ([manual]).

> No live URL is claimed anywhere in this package yet. That is deliberate.

## 4. Demo

- [ ] **Demo video** recorded from the working application, **under 5 minutes**
      ([manual]). Script and recording steps: `submission/DEMO_SCRIPT.md`.
- [x] Demo script prepared with timings and fictional test data.
- [x] Recording checklist prepared (clean profile, 1080p, mic test, trim).
- [ ] Video uploaded (unlisted link) or attached to the submission ([manual]).
- [ ] Demo uses only fictional accounts, messages and URLs ([manual] check before
      publishing).

## 5. Presentation and documents

- [x] Project description — `submission/PROJECT_DESCRIPTION.md`.
- [x] Technical architecture — `submission/TECHNICAL_ARCHITECTURE.md`.
- [x] Demo script — `submission/DEMO_SCRIPT.md`.
- [x] Presentation outline (10 slides) — `submission/PRESENTATION_OUTLINE.md`.
- [x] Submission checklist — this file.
- [x] Deployment architecture — `docs/DEPLOYMENT_ARCHITECTURE.md`.
- [x] Final project report — `docs/FINAL_PROJECT_REPORT.md`.
- [x] Testing report — `docs/PHASE_17_QA_REPORT.md` plus the Phase 18 section in
      the final report.
- [x] Screenshots checklist — `docs/SCREENSHOTS_AND_DEMO.md`.
- [ ] **Presentation deck** built from the outline ([manual], design tool).
- [ ] **Screenshots captured** from the working app into `docs/screenshots/`
      ([manual], see the checklist).

## 6. Final submission verification (run after deployment)

Work through this list in order and record the result of each command.

1. `curl -s https://<backend-host>/api/v1/health` → `200`,
   `"database":"connected"`.
2. Open `https://<frontend-host>/` → landing page renders, no console errors.
3. Register a test account with fictional data → dashboard empty state.
4. Log out → `/dashboard` redirects to `/login`; log back in.
5. Analyze a fictional phishing SMS → Critical result with rule + URL indicators.
6. Analyze a fictional URL → passive result, redacted query value.
7. Open History → both scans listed; open detail; confirm no other user's data.
8. Open Analytics → totals match the scans; charts render.
9. Open Awareness → search, guide, quiz, official links.
10. Resize to 390 × 844 → navigation drawer opens and closes.
11. Confirm the browser console has **no CORS or mixed-content errors**.
12. Confirm `/docs` behaves as configured (visible if `ENABLE_DOCS=true`).
13. Test a wrong password → generic error, no account enumeration.
14. Confirm rate limiting still allows normal use (do not hammer the live API).

## 7. Claims discipline

- [x] No fabricated statistics, user counts, accuracy or evaluation results.
- [x] No invented deployment URLs.
- [x] No claim of formal security certification or perfect fraud detection.
- [x] Known limitations documented in the README, QA report and final report.
- [ ] **[manual]** Re-read the final deck and video for accidental overclaiming
      ("guaranteed", "100% accurate", "hack-proof") before submitting.
