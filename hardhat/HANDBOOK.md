# HardHat — Project Handbook

**Live site:** https://hardhat-blue.vercel.app · **Repo:** `vcelkamarvin/earlyroles`, branch `claude/offshore-jobs-platform-e7hyz5`, directory `hardhat/` · **Vercel project:** `hardhat` (team `laurinalbert-6874s-projects`)

The worker-subscription platform for high-paying, no-degree offshore & trades jobs: find the job → get qualified → get hired. Self-contained (zero coupling to EarlyRoles), extractable to its own repo by pointing a Vercel project at `hardhat/` as root.

---

## 1 · WHAT'S WORKING RIGHT NOW (all verified live)

### Money — two one-time plans (no subscription)
- **Pricing:** **Rig-Ready Basics $32** (region roadmap + cost checklist + unlimited saved jobs — no applying) · **Rig-Ready Pro $120** (the flagship — apply to jobs, full agency contacts, CV builder, week-by-week plan, prep, support). Pro is badged "Most popular"; cards show a speed-to-hired pill + illustrative value anchor. *(The $190 Done-For-You tier is parked for now — removed from the UI and checkout; the `dfy` id lingers only as a harmless tier-map entry.)*
- **Checkout:** `CONFIG.PAY` uses Stripe Payment Links. **Both `basic` ($32) and `pro` ($120) links still need creating** (see §4) — until then those buttons gracefully fall back to signup. (The `window.location` shadow bug that once no-op'd checkout is fixed.)
- **Entitlement is server-verifiable:** Stripe webhook → Supabase `hardhat_subscriptions` → `/api/entitlement` + `/api/directory`; `HH.syncEntitlement()`/`verifyPro()` make the server authoritative and the agency contacts are served only to a verified-paid email. Dormant-safe until keys are set (§4).
- Post-payment: `success.html` verifies (or gracefully falls back), unlocks the plan, routes into Pro setup.

### Conversion funnel
- **Landing** (`index.html`): form-first hero over a rig photo (sector + email → funnel), green-highlighter sections, alternating dark/photo cards, trust band (4.8-rating card + accredited-training logos), operator logo wall, demand bars, locations, feature mockups, pricing, FAQ, blog teaser.
- **6-step assessment** (`start.html`): always-visible income motivator that updates live per sector ($70k–$210k), progress bar, Google/email register step.
- **Ecommerce offer before the plan reveal**: "on your own vs with HardHat" time comparison, Today → ~2 weeks → ~6 weeks timeline, sector-dynamic pay stat, value stack anchored vs $48, reviews, skip-to-limited-plan link.
- **Popups**: exit-intent + 18s timer + scroll-depth email capture (once per visitor). Sticky mobile CTA.
- **A/B landing variants** (6): `/no-degree-jobs`, `/no-experience-offshore-jobs`, `/150k-jobs-no-degree`, `/offshore-jobs-uk|-australia|-usa` — point different ad campaigns at each, compare in analytics via the `variant` event.

### Product (the value people pay for)
- **5,226-job catalog** (`jobs-data.json`, 140KB): 47 role types × 42 hubs worldwide incl. LATAM/Spain. Search, sector/country/pay filters, newest sort, load-more. **Job detail is register-gated** (blurred teaser → free account) and composes: About the role · Rotation & lifestyle (cycle explained) · The money (pay, day rates, ceiling) · What you need (tickets + costs) · How hiring works (agency-routed). Honestly labeled representative roles. Regenerate anytime: `node build-jobs.js`.
- **Certificate Truth Engine** (`certs.html`, "Tickets" in nav): role × region matrix — mandatory tickets, medicals, right-to-work reality, official verify links (OPITO, GWO, IMO STCW, OEUK, TWIC, QLD RSHQ, IMCA, DOT). Versioned in `cert-data.js` with lastVerified date.
- **Post-payment Pro onboarding** (`setup.html`): where you live + passport, target region (with **live honest right-to-work check** + feasible alternatives), English level, ticket confirm → `hh_pro_profile`.
- **Region-exact recommendation engine** (`HH.proPlan`): the same oil worker gets "Book BOSIET + CA-EBS" for a UK target and "Book SafeGulf/SafeLandUSA" for a US target — with region medical, estimated ticket outlay, named agencies, and a **week-by-week "how we get you hired" plan** (Wk1 ticket+medical → Wk2 CV+agency registrations → Wk3–4 apply+follow-ups → Wk5–6 interviews/first offer).
- **Dashboard** (order-tracker, distinct free vs client views): greeting + goal + progress bar → connected 5-step plan (only the current step expands) → sample matched roles with fit %. **Free users** see locked teaser rows + the honest Pro unlock ("No job or salary is guaranteed") + sticky mobile CTA. **Paying clients** get a different layout centred on *apply → track → agencies*: their applications tracker and an agency-shortlist card are pulled to the top, and each matched role has an inline **Apply →** that records the application; no upsell.
- **Applying actually records**: a Pro user's apply (from the job modal or the dashboard fit rows) sets the local tracker AND best-effort POSTs to Supabase `hardhat_applications`, then shows a confirmation modal with the next move (get on the agency's books). Dormant-safe — no table set = local-only, no error. Table SQL in `SETUP_KEYS.md`.
- **Roadmap** (`roadmap.html`): per-sector ticket tracker with free accredited-provider links + Pro "Requirements for {region}" panel. **Pay explorer**, **agency directory** (Pro-gated contacts), **AI CV builder** (Claude→OpenAI→template fallback), blog (6 posts).

### Reach
- **SEO**: 51 generated pages (24 job pages with JobPosting JSON-LD, 12 location hubs with FAQ schema, 8 "how to become" guides with Article+FAQ schema, browse hub, 6 ad variants) + 81-URL sitemap + canonical/OG tags everywhere. Regenerate: `node build-seo.js`.
- **Bilingual EN/ES** on the conversion path (nav toggle, auto-detects Spanish browsers, persists).
- **Lead capture**: every signup/popup/funnel email → Supabase `hardhat_leads` (verified working).
- Mobile-verified at 390px throughout (no horizontal scroll, no console errors).

---

## 2 · HOW THE APP WORKS

**Stack:** static HTML/CSS/JS, no build step + Vercel serverless functions (CommonJS) + localStorage state + Supabase for durable leads. Deploy = upload the folder.

```
User flow:
index.html (hero form) ──► start.html (6-step assessment)
        ▼                          ▼ finish → signup + lead→Supabase
   popups/variants          OFFER screen (paywall before plan)
                              │ pay → Stripe Payment Link → success.html
                              │ skip → limited plan (score + step 1)
                              ▼
                    setup.html (Pro onboarding: passport/region/English)
                              ▼
                    dashboard.html ◄── HH.proPlan(intake, profile)
                    region-exact next step · blockers · hiring plan
                              │
              jobs.html (5,226 catalog, gated detail) · roadmap · certs · directory · cv
```

**Key files**
| File | Role |
|---|---|
| `app.js` | The engine: CONFIG (Stripe links, Supabase, GA/Google slots), Auth + all localStorage state (`hh_*` keys), i18n EN/ES, nav/footer, scoring (`rigReadyScore`), `recommendations()`, **`proPlan()`** region-exact engine, `HH_REGIONS`, checkout, popups, logos w/ fallback |
| `cert-data.js` | Certificate Truth Engine source of truth (versioned, verify links) |
| `jobs-data.json` | 5,226-role catalog (compact columnar; expanded client-side in jobs.html) |
| `build-jobs.js` / `build-seo.js` | Generators (deterministic) — rerun after editing data in app.js |
| `pricing-data.js` | Plans + renderer (Basics $32, Pro $120 flagship — one-time) |
| `api/` | `checkout.js` + `verify-checkout.js` (Stripe session alt-path), `cv.js` + `ticket-check.js` (AI w/ heuristic fallback), **`jobs.js`** (Adzuna+Careerjet live feed — dormant until keys) |
| `SETUP_KEYS.md` | Every env var and where to get it |

**State (localStorage):** `hh_user`, `hh_plan` (entitlement — client-side, see §4), `hh_intake`, `hh_pro_profile`, `hh_tickets_done`, `hh_saved`, `hh_apps`, `hh_lang`, `hh_popup_seen`, `hh_cv_built`.

**Deploy:** `npx vercel deploy hardhat --prod` (token) — or connect Git in Vercel (Settings → Git, Root Directory `hardhat`) for auto-deploys.

---

## 3 · ALREADY DONE (build history, condensed)

v1 full platform scaffold → v2 global SaaS upgrade (real companies/logos, locations, demand, blog, recommendations) → v3 premium re-skin + real providers/agencies → white theme, popup, human-copy pass, real photos → v8 form-first hero + WizardZ styling + **Stripe wired + payment bug fixed** + funnel income motivator → v9 time-saved offer + $210k + mobile fixes → v10 truthful urgency ("800+ jobs found every month"), A/B landings, trust band, scroll popup, EN/ES → v11 **5,226-job catalog + gated details + Certificate Truth Engine + dashboard redesign** → v12 **Pro onboarding + region-exact plans + week-by-week hiring plan**. Everything committed, pushed, live.

---

## 4 · BEFORE LAUNCH

### Already done in code (shipped)
- ✅ Two one-time plans ($32 / $120) with $120 as the flagship; value + speed-to-hired framing. **$190 Done-For-You removed** from pricing, offer down-sell, checkout, webhook, directory gate and docs (parked for later).
- ✅ **Applying actually works & records**: a Pro apply (job modal or dashboard fit row) marks the tracker, best-effort writes a row to Supabase `hardhat_applications`, and shows a confirmation modal with the next move. Free/Basics correctly hit the Pro paywall. The label/gate mismatch is fixed.
- ✅ **Better client dashboard**: paying clients get an apply → track → agencies layout (apps tracker + agency shortlist pulled up, inline Apply on matched rows); free view unchanged.
- ✅ **Info-accuracy audit**: fixed hubs that claimed the wrong country's rules — Mexico/Colombia/Chile now map to a **Latin America** region and Spain to **Iberia & Canary Islands**, both resolving to *global/international* requirements instead of false US-Gulf (TWIC/SafeGulf), Australian (Standard 11) or North-Sea rules. The job detail now asserts a region's exact tickets **only when a verified variant exists for that role+region**, else links to the role's typical requirements + a "pay & tickets vary by country — illustrative" line. Cert ticket *content* spot-checked correct.
- ✅ **Live-jobs tab** on the board (Representative | ⚡ Live openings) — reuses `/api/jobs` (Adzuna+Careerjet); register-gated; honest fallback notice when the aggregator keys aren't set.
- ✅ **Server-verified, anti-spoof entitlement**: `syncEntitlement`/`verifyPro` make the server authoritative; `/api/directory` serves the crewing-agency contacts only to a verified-paid email. Dormant-safe until keys are added.

### You must do before charging money / running ads (☐ = your dashboards)
1. ☐ **Create the two one-time Stripe Payment Links** — $32 Basics + $120 Pro — and paste into `CONFIG.PAY` (`basic`, `pro`). Run a real **test purchase + refund** on each. *Without this, nobody can pay → applying stays locked.*
2. ☐ **Activate entitlement + application records** — add `STRIPE_SECRET_KEY`, the Stripe **webhook secret** (endpoint → `/api/stripe-webhook`, event `checkout.session.completed`), and `SUPABASE_SERVICE_KEY` to Vercel env; create the `hardhat_subscriptions` **and** `hardhat_applications` tables (SQL in `SETUP_KEYS.md`). *THE anti-spoof blocker + durable apply records — do before ads.*
3. ☐ **Rotate the Vercel token** (it appeared in chat) — Vercel → Settings → Tokens. *2 min.*
4. ☐ **Custom domain** hardhatjobs.co + `hello@` email + update Stripe success/cancel origins. *15 min.*
5. ☐ **Google OAuth Client ID** → `CONFIG.GOOGLE_CLIENT_ID` (login is demo-mode until then).
6. ☐ **Analytics + pixels**: `GA_MEASUREMENT_ID` + Meta/TikTok pixels (events already fire); submit `sitemap.xml` to Search Console.
7. ☐ **Live jobs (optional)**: `ADZUNA_APP_ID/KEY` + `CAREERJET_KEY` in Vercel env → flips the ⚡ Live openings tab on.
8. ◐ **Legal/ops**: cookie-consent banner (EU leads), refund policy, new-lead email notification, Sentry/uptime, hero-photo compression (WebP), real-device QA.

**Minimum to take money safely = items 1 + 2.** Everything else is graceful-degradation and can follow launch.

---

## 5 · WHAT TO ADD OR REDO NEXT (impact order)

**Quick wins (days)**
- **Email nurture drip** (5–7 emails, free→Pro) from the Supabase leads — historically beats any redesign for a $48 decision.
- **Annual plan** ($290/yr) toggle — needs one more Stripe link; anchors the monthly price.
- **Job alerts email** ("3 new roles you qualify for" weekly) — retention engine; you already collect phone/email + sector + region.
- **Shareable Rig-Ready score** ("I'm 72/100 — check yours") — the built-in viral loop.
- **Per-page OG images** for link shares; PWA manifest for home-screen installs.

**Bigger bets (weeks)**
- **Full Spanish site** (`/es` SEO tree + localized LATAM pricing ~$15–25/mo with OXXO/Mercado Pago/PIX) — the ES toggle covers the funnel today, not the SEO pages.
- **Training-provider affiliate links** — BOSIET/GWO courses cost $900–$1,400; referral fees can rival subscription revenue and you already send people there.
- **Two-sided revenue**: charge crewing agencies for access to the vetted candidate pool (highest revenue/customer in the model).
- **Application tracker v2** + follow-up reminders; honest "prep and queue" apply-assist (the EarlyRoles pattern).
- **Real testimonials** from the first cohort to replace the illustrative ones — biggest trust upgrade available.

**Worth redoing eventually**
- Auth is localStorage mock → real accounts (Supabase Auth) once webhook entitlement lands.
- Certificate matrix quarterly review loop + user corrections (the "last verified" date is the trust asset).
- The 24 static SEO job pages could be regenerated from the 5K catalog for hundreds more long-tail pages — after the real feed is on, so schema stays honest.
