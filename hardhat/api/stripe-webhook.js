// HardHat — /api/stripe-webhook  (Vercel Serverless Function, CommonJS)
// Server-verified entitlement: Stripe -> Supabase `hardhat_subscriptions`.
// Activates when env vars are set (until then returns not_configured):
//   STRIPE_WEBHOOK_SECRET   (Stripe dashboard -> Developers -> Webhooks)
//   STRIPE_SECRET_KEY       (used to resolve customer email on cancellations)
//   SUPABASE_URL + SUPABASE_SERVICE_KEY  (service role — server-side only!)
//
// Configure in Stripe: add endpoint https://<your-domain>/api/stripe-webhook
// with events: checkout.session.completed, customer.subscription.deleted,
// customer.subscription.updated. Table SQL lives in SETUP_KEYS.md.

const crypto = require('crypto');

module.exports.config = { api: { bodyParser: false } };

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySig(raw, header, secret) {
  // Stripe-Signature: t=<ts>,v1=<hmac>[,v1=...]
  const parts = {};
  String(header || '').split(',').forEach((kv) => {
    const i = kv.indexOf('='); if (i > 0) {
      const k = kv.slice(0, i).trim(), v = kv.slice(i + 1).trim();
      (parts[k] = parts[k] || []).push(v);
    }
  });
  const t = (parts.t || [])[0]; const sigs = parts.v1 || [];
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;  // 5 min tolerance
  const expect = crypto.createHmac('sha256', secret).update(t + '.' + raw.toString('utf8')).digest('hex');
  return sigs.some((s) => {
    try { return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expect)); } catch (e) { return false; }
  });
}

function planFromAmount(amountTotal) {
  // one-time tiers, in cents: $32 / $120
  if (amountTotal >= 7000)  return 'pro';    // $120
  return 'basic';                            // $32
}

async function upsert(row) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  const r = await fetch(url.replace(/\/$/, '') + '/rest/v1/hardhat_subscriptions?on_conflict=email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 'apikey': key, 'Authorization': 'Bearer ' + key,
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(row)
  });
  if (!r.ok) throw new Error('supabase ' + r.status);
}

async function emailForCustomer(customerId) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !customerId) return null;
  const r = await fetch('https://api.stripe.com/v1/customers/' + encodeURIComponent(customerId), {
    headers: { 'Authorization': 'Bearer ' + key }
  });
  const j = await r.json();
  return (j && j.email) || null;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const configured = secret && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY;
  if (!configured) { res.status(200).json({ error: 'not_configured' }); return; }

  let raw;
  try { raw = await readRaw(req); } catch (e) { res.status(400).json({ error: 'read_failed' }); return; }
  if (!verifySig(raw, req.headers['stripe-signature'], secret)) {
    res.status(400).json({ error: 'bad_signature' }); return;
  }

  let ev; try { ev = JSON.parse(raw.toString('utf8')); } catch (e) { res.status(400).json({ error: 'bad_json' }); return; }

  try {
    if (ev.type === 'checkout.session.completed') {
      const s = ev.data.object || {};
      const email = (s.customer_details && s.customer_details.email) || s.customer_email;
      if (email) {
        await upsert({
          email: String(email).toLowerCase(), plan: planFromAmount(s.amount_total || 0, s.mode),
          status: 'active', stripe_customer: s.customer || null,
          amount: s.amount_total || 0, updated_at: new Date().toISOString()
        });
      }
    } else if (ev.type === 'customer.subscription.deleted' || (ev.type === 'customer.subscription.updated' && ev.data.object && ev.data.object.status === 'canceled')) {
      const sub = ev.data.object || {};
      const email = await emailForCustomer(sub.customer);
      if (email) {
        await upsert({ email: String(email).toLowerCase(), plan: 'free', status: 'canceled', stripe_customer: sub.customer, updated_at: new Date().toISOString() });
      }
    }
    res.status(200).json({ received: true });
  } catch (e) {
    // 500 so Stripe retries
    res.status(500).json({ error: 'processing_failed' });
  }
};
