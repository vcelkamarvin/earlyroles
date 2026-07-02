# Auto-Apply — honesty now, real submission later

## Where it stands (shipped)
"Auto-Apply" is **honest** today: on the Auto-Apply plan, the AI *finds, tailors and queues*
each matching application, and the user **sends it with one click** from the dashboard. Nothing
is marked "Applied" until the user actually opens & sends it. Copy across the site, dashboard and
campaign kit reflects "prep & queue, you send" — not "we apply for you".

- Engine: `runAutoApplySweep()` in `app.js` → `Auth.addAutoQueue()` + `Auth.pushAutoLog()` (no
  silent `setApplication('Applied')`).
- Dashboard "Ready to send" queue → *Open & send next* opens the real posting and then marks Applied.

## Phase 2 — real hands-off submission (scoped, not built)
Truly submitting into external ATSes on the user's behalf is a backend + legal effort. Rough scope:

1. **Backend service** (not static): a queue worker that, per queued application, drives the
   employer's ATS. Greenhouse/Ashby/Lever have inconsistent/limited public *apply* APIs, so most
   real submissions need headless browser automation (Playwright) per ATS template.
2. **Credential & data handling**: securely store the user's CV, answers to common ATS questions,
   and per-employer field mappings. Encrypt at rest, EU region, full audit log.
3. **Human-in-the-loop by default**: user approves each draft (or opts into full auto with an
   explicit, revocable consent + daily cap). Never submit without recorded consent.
4. **Legal review**: ToS of each ATS/employer, EU/CH data protection, and truth-in-advertising for
   the "auto-apply" claim before it's marketed as fully hands-off.
5. **Reliability**: per-ATS success tracking, retries, and a "couldn't auto-submit → here's the
   direct link" fallback so a failed automation never silently drops an application.

Recommended: keep the current honest "prep & queue → one-click send" as the default forever, and
offer full auto-submit as an opt-in beta once 1–5 are in place.

## Stripe access enforcement (shipped)
Access (`Auth.plan()`) is granted **only** on `success.html` after `/api/verify-checkout` confirms
payment — selecting a plan just records a *pending* intent (`Auth.setPending`). See `SETUP_KEYS.md`
for the config required to make verification fully strict.
