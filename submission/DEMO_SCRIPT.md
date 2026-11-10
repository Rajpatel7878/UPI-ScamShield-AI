# UPI ScamShield AI — Demo Script (≈4 minutes)

**Target length:** 4:00 · **Hard limit:** under 5:00 · **Format:** screen
recording with voice-over, 1080p, browser at 100% zoom.

Everything below uses **fictional data**. Never enter a real bank account, UPI
PIN, OTP, phone number or email address during the demo.

---

## Pre-flight checklist (before you press record)

- [ ] Backend running and `/api/v1/health` returns `200` with
      `"database":"connected"`.
- [ ] Frontend build running (local `npm run dev`, or the deployed site after it
      is verified).
- [ ] A **fresh demo account** exists, or you are ready to register one:
      `demo.user@example.com` / a fictional password (8+ characters).
- [ ] No personal browser tabs, bookmarks bar, notifications or email client
      visible. Use a clean browser profile or a fresh window.
- [ ] Zoom at 100%, window 1440×900 or 1920×1080; close DevTools.
- [ ] The example SMS and URL are copied to a scratch note so you can paste them
      quickly:
      - SMS: `URGENT: Your SBI KYC expires today. Account will be blocked. Verify now: http://bit.ly/kyc-verify and share OTP 482913 with our agent.`
      - URL: `http://secure-kyc-verify.top/login?token=demo123`
- [ ] Microphone tested; one dry run completed.
- [ ] Notification silencing on (Windows: Focus assist / Do Not Disturb).

---

## 1. Introduction and problem — 0:00–0:30

**On screen:** the landing page hero, no scrolling.

**Narration:**
> "UPI made payments instant — and that's exactly what fraudsters exploit.
> A fake KYC warning, a collect request, or a shortened link can arrive in
> seconds, and the user has to decide immediately. UPI ScamShield AI analyses
> that message, explains *why* it looks suspicious, and tells the user what to do
> next. Detect. Analyze. Protect."

## 2. Landing page and dashboard — 0:30–1:00

**Actions:** scroll the landing page briefly (features → how it works), click
**Sign in**, register/login with the demo account, land on the dashboard.

**Narration:**
> "This is a React single-page app. The dashboard shows user-scoped statistics,
> recent scans and risk insights. Everything here is calculated from my own scan
> history — other users' data is never visible, and the API enforces that, not
> just the interface."

## 3. Suspicious SMS analysis — 1:00–2:00

**Actions:** open **Detection** → content type `SMS` → paste the fictional SMS →
click **Analyze**. Pause on the result to let the score and indicators settle.

**Narration:**
> "Here's a message a real user might receive. It claims my KYC expires today,
> threatens that my account will be blocked, uses a shortened link, and asks for
> an OTP.
>
> The rule engine runs first: an OTP request, a fake verification or
> account-blocking warning, urgency pressure and a suspicious link. Each
> indicator shows its severity, its category and where it came from — rule-based
> or URL-based — so the score is explainable rather than a black box.
>
> The score combines the rule findings with passive URL analysis. Notice the link
> was inspected but **never opened**: no request was made to that domain, which
> removes the risk of the analysis itself being attacked.
>
> The recommendations are concrete: never share the OTP, verify through the
> bank's official app, and report it. When a Gemini key is configured, a second
> AI opinion is merged in; otherwise the rules stay authoritative and the
> response states that AI was unavailable — no silent guessing."

## 4. URL risk analysis — 2:00–2:45

**Actions:** switch content type to `URL` → paste
`http://secure-kyc-verify.top/login?token=demo123` → **Analyze**.

**Narration:**
> "URLs can be analysed on their own. This one uses a suspicious top-level
> domain, a credential-themed host name and a query token.
>
> Two things to highlight. First, the analysis is passive — the app parses the
> URL structure and applies heuristics; it never fetches the page, follows
> redirects or resolves the domain. Second, the query value is redacted before it
> is stored or shown, because that's where tokens and OTPs often hide.
>
> That's the privacy trade-off made explicit: we keep only the metadata needed
> for history, not the sensitive content."

## 5. History and analytics — 2:45–3:15

**Actions:** open **History** (show both scans, open one detail, close), then
**Analytics**.

**Narration:**
> "Every scan is stored as metadata only, scoped to my account, with filters,
> sorting and pagination. Opening a scan shows the indicators that produced it.
> Analytics aggregates the same records: totals, risk distribution and activity
> over time, with a proper empty state for a new account."

## 6. Scam Awareness Center — 3:15–3:45

**Actions:** open **Awareness** → search a term → open a scam guide → show the
official reporting links and the quiz briefly.

**Narration:**
> "Detection is only half the job. The Awareness Center explains common UPI scam
> patterns, warning signs, what to do in the first minutes after a fraud, and the
> official channels to report it — the 1930 helpline and cybercrime.gov.in. The
> quiz turns that into something people actually remember."

## 7. Technology, privacy and conclusion — 3:45–4:00

**On screen:** the landing page or a simple architecture slide.

**Narration:**
> "Under the hood: React and Vite, FastAPI and PostgreSQL, an explainable rule
> engine with optional Gemini, JWT authentication and strict per-user isolation.
> Message text is never stored, links are never opened, and every result is framed
> as a risk assessment, not a guarantee. UPI ScamShield AI — detect, analyze,
> protect."

---

## Recording instructions (Windows)

1. **Tool:** OBS Studio (free) or Windows Game Bar (`Win + G`). OBS is preferred
   because it records the microphone and screen reliably at 1080p/30 fps.
2. **Scene:** Display Capture + Audio Input Capture (microphone). Disable desktop
   audio if it would leak notifications.
3. **Format:** MP4, 1920×1080, 30 fps, microphone at 48 kHz. Record locally, not
   to a network drive.
4. **Run a 20-second test clip**, play it back, and confirm the text in the
   message box and the risk score are readable at 100% playback size.
5. Record the full take, then trim the start/end silence so the final file is
   **under 5:00** (target 4:00).
6. Re-watch once at normal speed and check: no personal data, no notifications,
   score and indicators legible, audio consistent, no dead air longer than two
   seconds.
7. Upload unlisted to YouTube or attach the MP4, and put the link in the
   submission form and `submission/SUBMISSION_CHECKLIST.md`.

**If you must re-record a segment:** re-record the whole take. Splice edits in a
live demo usually look worse than a clean single pass.

---

## Post-deployment variant

Once the frontend and backend are deployed and verified, record the same script
against the **live URL** and show the address bar so reviewers can see the real
deployment. Do not record against a deployment you have not verified.
