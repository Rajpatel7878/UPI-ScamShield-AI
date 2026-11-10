# Screenshots and Demo Preparation

Screenshots and video must come from the **working application**, not mock-ups.
No image in this repository is generated or simulated.

---

## 1. Before capturing

- [ ] Backend healthy: `GET /api/v1/health` → `200`, `"database":"connected"`.
- [ ] Frontend running (local, or the verified deployment).
- [ ] A dedicated demo account with fictional data, e.g.
      `demo.user@example.com`.
- [ ] At least two scans already stored (one Critical SMS, one URL) so history
      and analytics are not empty — capture the empty state separately if wanted.
- [ ] Browser: clean profile, bookmarks bar hidden, no extensions visible,
      zoom 100%, DevTools closed, notifications off.
- [ ] Window sizes: **1440 × 900** (desktop) and **390 × 844** (mobile).
- [ ] Save to `docs/screenshots/` with the exact file names below, PNG format.

## 2. Required screenshots

| # | File | View | What must be visible | Notes |
| --- | --- | --- | --- | --- |
| 1 | `01-landing.png` | `/` | Hero, tagline "Detect. Analyze. Protect.", primary CTA, navbar | Top of page, no scroll |
| 2 | `02-dashboard.png` | `/dashboard` | Stats cards, recent scans, risk insight | Signed in |
| 3 | `03-detection.png` | `/detect` | Content-type selector, message input, privacy notice, Analyze button | Empty input state |
| 4 | `04-high-risk-result.png` | `/detect` after analyzing the fictional SMS | Risk score + level, indicator list with severity and source, recommendations | The most important image in the deck |
| 5 | `05-url-result.png` | `/detect` URL mode | URL-specific indicators, redacted query value | Show that the value is `[redacted]` |
| 6 | `06-history.png` | `/history` | Multiple scans, filters, risk badges | Include the scan-detail modal if possible |
| 7 | `07-analytics.png` | `/analytics` | Charts and totals consistent with history | Do not crop the alt-text/legend |
| 8 | `08-awareness.png` | `/awareness` | Scam library or quiz, official reporting links | |
| 9 | `09-mobile.png` | `/dashboard` at 390 × 844 | Mobile header/drawer layout | Use device emulation; include the URL bar if possible |

Optional extras: `10-login.png`, `11-quiz.png`, `12-scan-detail.png`.

## 3. Capture procedure

1. **Desktop (Windows):** `Win + Shift + S` → rectangular snip, or the browser's
   "Capture full size screenshot" from DevTools (close DevTools before the actual
   capture if the layout shifts).
2. **Mobile:** DevTools → device toolbar → iPhone 12 Pro preset (390 × 844) →
   reload → capture.
3. Crop to the browser viewport only — no desktop wallpaper, taskbar, personal
   tabs or OS notifications.
4. Verify each PNG at 100%: text must be legible, no half-loaded content, no
   spinner, no error toast.
5. Fictional data only. Redact any real email address if one slipped in.
6. Add the images to `docs/screenshots/`, then embed them in the README
   (section 9) and the presentation.

## 4. Demo recording checklist

- [ ] Script rehearsed once end-to-end (`submission/DEMO_SCRIPT.md`).
- [ ] Recording tool ready: OBS Studio or Windows Game Bar (`Win + G`).
- [ ] 1920 × 1080, 30 fps, microphone tested with a 20-second clip.
- [ ] Fictional credentials and messages prepared for copy-paste.
- [ ] Focus assist / Do Not Disturb enabled; phone silenced.
- [ ] Full take recorded, start/end silence trimmed, **final length under 5:00**.
- [ ] Playback check: score and indicators readable, audio consistent, no
      personal information, no notifications.
- [ ] Uploaded (unlisted) or attached, link recorded in the submission form and
      in `submission/SUBMISSION_CHECKLIST.md`.

## 5. Screenshot status

| Item | Status |
| --- | --- |
| Checklist prepared | Complete |
| Screenshots captured | **Pending** — requires a browser session against a working instance |
| Screenshots committed | **None yet** (no placeholder images are included) |
| Demo video recorded | **Pending** |
