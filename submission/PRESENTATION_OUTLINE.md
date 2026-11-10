# UPI ScamShield AI — Presentation Outline (10 slides)

**Deck length:** 10 slides · **Speaking time:** 4–5 minutes
**Rule:** no invented statistics, user counts, accuracy numbers or evaluation
results. Where evidence is not measured, the slide says so.

---

## Slide 1 — Title

**On slide**
- UPI ScamShield AI
- **Detect. Analyze. Protect.**
- Individual project — Raj Patel
- Repository: github.com/Rajpatel7878/UPI-ScamShield-AI

**Speaker notes**
> "I built UPI ScamShield AI: a web app that analyses a suspicious UPI message or
> link, explains what looks wrong, and tells the user what to do next."

## Slide 2 — The problem

**On slide**
- Fake KYC / account-blocking messages
- OTP and UPI PIN harvesting
- Collect-request abuse and advance-fee scams
- Shortened and look-alike links
- Decision window: seconds; explanation: usually none

**Speaker notes**
> "The attacks are cheap and they arrive where people already are — SMS,
> WhatsApp, payment requests. The victim has seconds to decide, and existing
> tools give a verdict without a reason."

## Slide 3 — Why UPI scam protection matters

**On slide**
- UPI is the default payment rail for everyday users
- First-time and elderly users are frequent targets
- Damage is immediate and hard to reverse
- Awareness is the cheapest defence; explanation is how awareness sticks

**Speaker notes**
> "Once a UPI payment is authorised, recovery is difficult. Prevention beats
> after-the-fact reporting, and prevention only works if people understand the
> pattern. That's why explanation is the core of this project."
> *(Do not quote fraud-loss figures unless you cite a source on the slide.)*

## Slide 4 — Our solution

**On slide**
- Paste a message or link
- Score 0–100 + risk level (Low / Medium / High / Critical)
- Named indicators with severity and source
- Practical recommendations
- History, analytics and an Awareness Center

**Speaker notes**
> "One input, one explainable result: score, level, the indicators behind it,
> and what to do. Signing in adds history and analytics; the Awareness Center
> turns each scan into prevention."

## Slide 5 — Features

**On slide**
- Explainable rule engine (10 fraud categories)
- Passive URL analysis — links are never opened
- Optional Gemini analysis with strict validation
- Hybrid scoring with clean fallback
- JWT auth + Argon2, owner-only history
- Awareness Center, quiz, official reporting links

**Speaker notes**
> "Two design choices matter most: the analysis always works without AI, and the
> URL engine never touches the link — it inspects structure only, so the tool
> can't be turned against the user."

## Slide 6 — System architecture

**On slide**
```text
Browser → Vercel (React SPA) → HTTPS → Render (FastAPI) → PostgreSQL
                                            └→ Google Gemini API (optional)
```

**Speaker notes**
> "React 19 with Vite on the front, FastAPI with Pydantic on the back, SQLAlchemy
> with PostgreSQL in production and Alembic migrations, and Gemini as an optional
> backend-only enhancement."

## Slide 7 — AI and hybrid detection workflow

**On slide**
```text
Normalize → Rules → Passive URL → (Gemini, optional) → Hybrid score → Explain
```
- Base score = max(rule, URL)
- AI merged only when the response passes strict validation
- No key / timeout / bad output → rules stay authoritative
- Untrusted input is JSON-delimited; output is schema-validated

**Speaker notes**
> "The AI is a second opinion, not a dependency. If it fails, the request still
> returns a complete explainable result — and says so, instead of pretending AI
> ran."

## Slide 8 — Demo and results

**On slide**
- Screen recording: suspicious SMS → Critical result → URL analysis → history →
  analytics → awareness
- What was verified: 104 backend tests, production build, dependency audits, a
  migration-verified production-mode rehearsal
- Honest status: application verified locally; deployment prepared

**Speaker notes**
> "The demo shows the full journey with fictional data. On verification: 104
> backend tests pass, the frontend build and lint pass, npm audit reports zero
> vulnerabilities, and the production configuration was rehearsed locally. I am
> not claiming accuracy metrics — none have been measured against a labelled
> dataset."

## Slide 9 — Security and privacy

**On slide**
- Argon2id passwords; JWT with full claim validation
- Rate limits, 1 MB body cap, security headers, explicit CORS
- Every scan query scoped to the authenticated user
- Message text never stored; URL query values redacted
- Links never fetched; Gemini key backend-only

**Speaker notes**
> "Privacy was a design constraint, not an afterthought: the message itself is
> never persisted, and links are never opened. Known gaps — no CSP, no server-side
> token revocation, no MFA — are documented rather than hidden."

## Slide 10 — Future scope and conclusion

**On slide**
- HttpOnly cookie sessions + refresh rotation, CSP
- Shared rate-limit store; SQL-side analytics aggregation
- Sandboxed URL reputation checks, regional languages, QR/OCR input
- Committed Playwright regression suite
- **Detect. Analyze. Protect.**

**Speaker notes**
> "Next steps are about hardening and reach. The core is built, tested and
> explainable, and the roadmap is written down with the limitations. Thank you."

---

## Visual guidance

- Dark theme matching the product (`#0B1220`-style navy, teal accent).
- One idea per slide; maximum six bullets; no walls of text.
- Diagram on slides 6 and 7 only — keep the other slides typographic.
- Add real screenshots from `docs/screenshots/` once captured; never mock up a UI
  or a metric.
