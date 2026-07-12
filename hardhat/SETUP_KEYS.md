# HardHat — Environment Variables

Set these in your Vercel project (Settings → Environment Variables). **None are required for the site to run** — every feature has a graceful fallback — but they enable live AI and real payments.

## AI (offshore CV builder + ticket check)
Provider-agnostic: Claude is preferred, OpenAI is the fallback, and a deterministic template runs if neither is set.

| Var | Purpose |
|-----|---------|
| `ANTHROPIC_API_KEY` | Enables Claude for `/api/cv` and `/api/ticket-check` |
| `CLAUDE_MODEL` | Optional. Defaults to `claude-haiku-4-5-20251001` |
| `OPENAI_API_KEY` | Optional fallback (uses `gpt-4o-mini`) |

## Payments (Stripe)
Until these are set, `/api/checkout` returns `not_configured` and the site routes users to signup instead.

Both plans are **one-time payments** (no subscription). *(The $190 Done-For-You tier is parked for now.)*

| Var | Purpose |
|-----|---------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_PRICE_BASIC` | Price ID for Rig-Ready Basics ($32, one-time) |
| `STRIPE_PRICE_PRO` | Price ID for Rig-Ready Pro ($120, one-time — the flagship) |

### Quick alternative: Stripe Payment Links (fastest — no secret key)
Create two **one-time** Payment Links in the Stripe dashboard ($32, $120) and paste the URLs into `app.js` → `CONFIG.PAY`:
```
PAY: { basic:'https://buy.stripe.com/…', pro:'https://buy.stripe.com/…' }
```
The front-end uses these first, before `/api/checkout`. This makes checkout live immediately without a secret key. (`basic` and `pro` need new $32/$120 links.)

## Google sign-in ("Continue with Google")
The "Continue with Google" buttons currently use a demo (mock) sign-in that creates a local account. To make it a real Google login, set `CONFIG.GOOGLE_CLIENT_ID` in `app.js` to your Google OAuth Web Client ID and add the Google Identity Services flow (the mock `HH.authGoogle` / `googleSignup` handlers are the swap points).

## Analytics (optional)
Set `CONFIG.GA_MEASUREMENT_ID` in `app.js` and add the GA4 gtag snippet to enable event tracking (funnel steps, leads, checkout).

---
**Note:** Plan entitlement is currently stored client-side (`localStorage`), which is demo-grade. For production, verify subscriptions with a Stripe webhook and gate premium features server-side.

## Live job feed (optional — activates /api/jobs)
- `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` — free at developer.adzuna.com
- `CAREERJET_KEY` — free affiliate key at careerjet.com/partners
Until set, the jobs page uses the built-in 5,000+ role catalog (jobs-data.json,
regenerate with `node build-jobs.js`).

## Server-verified Pro entitlement (activates /api/stripe-webhook + /api/entitlement + /api/directory)
Until these are set, entitlement stays demo-grade (localStorage). Once set, the
server is the truth: paid users sync automatically, a self-unlocked "Pro" gets
downgraded on the next page load, and the crewing-agency contacts (`/api/directory`)
are served **only to a verified-paid email** — a console-spoofed `hh_plan` can flip
the UI but never receives the contact list.

Env vars (Vercel → Settings → Environment Variables):
- `STRIPE_SECRET_KEY` — Stripe dashboard → Developers → API keys (sk_live_…)
- `STRIPE_WEBHOOK_SECRET` — created with the webhook endpoint below (whsec_…)
- `SUPABASE_URL` — already used client-side; same value
- `SUPABASE_SERVICE_KEY` — Supabase → Settings → API → service_role (SERVER ONLY — never in client code)

Stripe webhook (dashboard → Developers → Webhooks → Add endpoint):
- URL: `https://<your-domain>/api/stripe-webhook`
- Events: `checkout.session.completed` (the one that matters for one-time plans).
  `customer.subscription.deleted/updated` are still handled but won't fire for
  one-time payments. Note: refunds aren't auto-revoked yet — add a
  `charge.refunded` handler later if you want refunded buyers downgraded.

Supabase table (SQL editor — run once):
```sql
create table if not exists hardhat_subscriptions (
  email text primary key,
  plan text not null default 'free',
  status text not null default 'active',
  stripe_customer text,
  amount int,
  updated_at timestamptz default now()
);
alter table hardhat_subscriptions enable row level security;
-- no anon policies on purpose: only the service key (serverless fns) reads/writes
```

## Job applications table (activates durable apply records)
When a Pro user registers for a job, `HH.saveApplication()` best-effort POSTs a
row to `hardhat_applications` using the same public Supabase key as the leads
table. Until the table exists the apply flow still works locally (dashboard
tracker) — the POST just no-ops. Run once in the Supabase SQL editor:
```sql
create table if not exists hardhat_applications (
  id bigint generated always as identity primary key,
  email text not null,
  name text,
  job_id text,
  title text,
  company text,
  sector text,
  location text,
  agency text,
  plan text default 'free',
  source text,
  created_at timestamptz default now()
);
alter table hardhat_applications enable row level security;
create policy "insert applications" on hardhat_applications
  for insert to anon with check (true);
```
(Mirrors the `hardhat_leads` insert-only anon policy — the client can write a
row but not read others’ applications.)

Flow: Stripe payment → webhook verifies signature → upserts plan by email →
client `HH.syncEntitlement()` (runs on every page load, ~2-min throttle; forced
un-throttled by `HH.verifyPro()`) asks `/api/entitlement?email=` and syncs
`hh_plan` — server wins in both directions. `directory.html` additionally calls
`/api/directory?email=` and only renders real contacts when the server confirms a
paid plan (pro).
Note: the entitlement endpoint answers plan status for any email (no auth) —
acceptable at this stage; add a signed token if that ever matters.
