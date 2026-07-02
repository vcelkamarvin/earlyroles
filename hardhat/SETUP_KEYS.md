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

| Var | Purpose |
|-----|---------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_PRICE_PRO_MONTHLY` | Price ID for HardHat Pro monthly ($29/mo, recurring) |
| `STRIPE_PRICE_PRO_ANNUAL` | Price ID for HardHat Pro annual ($190/yr, recurring) |
| `STRIPE_PRICE_FASTTRACK` | Price ID for Fast-Track ($149, one-time payment) |

### Quick alternative: Stripe Payment Links
If you don't want serverless checkout, create three Stripe Payment Links and paste them into `app.js` → `CONFIG.PAY` (`pro_monthly`, `pro_annual`, `fasttrack`). The front-end uses those first.

## Analytics (optional)
Set `CONFIG.GA_MEASUREMENT_ID` in `app.js` and add the GA4 gtag snippet to enable event tracking (funnel steps, leads, checkout).

---
**Note:** Plan entitlement is currently stored client-side (`localStorage`), which is demo-grade. For production, verify subscriptions with a Stripe webhook and gate premium features server-side.
