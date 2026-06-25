# EarlyRoles — adding your API keys (5 minutes)

Keys are **secrets** and must **never** go into GitHub (the repo is public). They go into
**Vercel Environment Variables**, where they're encrypted and only your serverless
functions can read them. `.env.example` in the repo just documents *which* keys exist.

## Where to add them

1. Go to **vercel.com** → project **`earlyroles-iyps`** → **Settings** → **Environment Variables**.
2. Add each key below. Set **Environment** to **Production** (and Preview if you like).
3. Click **Save**, then **Redeploy** the latest deployment (Deployments → ⋯ → Redeploy)
   so the functions pick up the new values.

## The two keys

### 1. `OPENAI_API_KEY` — turns on the real AI
- Get it at **platform.openai.com/api-keys** (create a new secret key, starts with `sk-...`).
- Powers the **LinkedIn review / roast** and **match** tools (model: gpt-4o-mini, very cheap).
- Without it, the site uses a built-in heuristic — so nothing breaks, it just isn't "real AI".
- Tip: set a small monthly usage cap in your OpenAI billing settings.

### 2. `STRIPE_SECRET_KEY` — verifies real payments
- From your **existing Firmadeal Stripe account** → **Developers → API keys** → **Secret key** (`sk_live_...`).
- **Do not create a new Stripe account.** This is the same account the Payment Links already use.
- It lets `/api/verify-checkout` confirm a checkout was actually paid before activating a plan.
- Until you add it, checkout still works (the app trusts the post-payment redirect); adding the
  key upgrades it to *verified & secure*.

## After adding the keys
- **AI:** open `/roast.html` or `/match.html`, paste a profile — the result footer will say
  "Reviewed by AI" instead of "Instant review".
- **Stripe:** do one real low-value test purchase → you should land on `/success.html` with the
  plan activated; refund yourself from the Stripe Dashboard afterwards.

## Reminder
Never paste these values into chat, into the GitHub repo, or into any file other than the
Vercel Environment Variables screen.
