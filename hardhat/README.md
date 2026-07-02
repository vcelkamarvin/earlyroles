# HardHat 🦺

**The no-degree path to high-paying offshore & trades work.** Find the job, get the tickets, get hired.

HardHat helps people break into high-paying jobs that don't require a degree — offshore oil & gas, offshore wind, commercial diving, merchant marine, FIFO mining, pipeline/structural welding, wind-turbine tech, and hazmat/CDL hauling. The core insight: the barrier isn't a résumé, it's knowing **which safety tickets and medicals you need, who actually hires (crewing agencies, not LinkedIn), and how to apply.**

This is a standalone sibling to EarlyRoles — it reuses the same lightweight engineering pattern (static site + Vercel serverless + provider-agnostic AI) but is a **completely distinct product** with its own brand, pages, funnel and features.

## What it does

| Page | Purpose |
|------|---------|
| `index.html` | Landing — 8 sectors, pay proof, how-it-works, pricing |
| `start.html` | **Signature 6-step Rig-Ready funnel** — captures the worker's full profile, returns a Rig-Ready Score + personalized 3-step plan |
| `roadmap.html` | **Ticket & Medical Roadmap tracker** — the exact certs/medicals per sector with costs, timeframes, progress saved locally |
| `pay.html` | **Pay & Rotation explorer** — entry vs experienced pay, day rates, rotations, tax notes |
| `jobs.html` | Job board — curated seed roles, match scoring, save/apply, detail modal |
| `directory.html` | **Crewing-agency & operator directory** (gated preview → Pro) |
| `cv.html` | AI **offshore CV builder** (Pro) |
| `dashboard.html` | Rig-Ready Score, ticket progress, saved jobs, application pipeline |
| `pricing.html` | Free / Pro ($29mo · $190yr) / Fast-Track ($149 one-time) |

## Tech

- **No build step.** Static HTML/CSS/JS. `app.js` is the shared engine (data models, localStorage `Auth`, Rig-Ready scoring, paywall, growth UI). `pricing-data.js` is the shared pricing module.
- **Design system** in `styles.css` — industrial dark steel + hi-vis hazard yellow, driven entirely by `:root` CSS custom properties (retheme in one place).
- **Serverless functions** in `api/` (Vercel Node, CommonJS): `cv.js`, `ticket-check.js`, `checkout.js`, `verify-checkout.js`. All AI endpoints degrade gracefully: **Claude → OpenAI → deterministic template**, so the site works with zero keys.
- **State** lives in `localStorage` (keys prefixed `hh_`). This is demo-grade: entitlement/auth are client-side and spoofable. For production, move plan gating and lead capture to a real backend (Supabase tables + server-verified Stripe webhooks).

## Run locally

```bash
cd hardhat
python3 -m http.server 8080   # then open http://localhost:8080
```
The `api/*` functions only run under `vercel dev` or a real Vercel deploy — the front-end falls back gracefully when they're absent.

## Deploy (as its own project)

This folder is self-contained and designed to be **extracted into its own GitHub repo / Vercel project**:

1. Copy the `hardhat/` folder into a new repo (or set Vercel **Root Directory = `hardhat`**).
2. Add the environment variables in `SETUP_KEYS.md`.
3. Point your domain (e.g. `hardhatjobs.co`) at the Vercel project.

Nothing in here imports from or writes to the EarlyRoles files.

## Monetization

Worker-pays subscription. Free tier drives traffic and captures leads via the funnel; Pro unlocks the full roadmap, agency directory, unlimited saves and the CV builder; Fast-Track is a one-time "hired in 90 days" push. See `pricing-data.js`.

> ⚠️ Offshore, maritime, diving, mining and trades work carries real physical risk. HardHat is an information/tooling service, not an employer or training provider. Always complete accredited safety training.
