// HardHat — /api/checkout  (Vercel Serverless Function, CommonJS)
// Creates a Stripe Checkout Session for a plan. Returns {url} to redirect to.
// Activates when these env vars are set on Vercel:
//   STRIPE_SECRET_KEY, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL, STRIPE_PRICE_FASTTRACK
// Until then it returns {error:"not_configured"} and the site falls back to signup.

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};
  const plan = String(body.plan || '').toLowerCase();

  const key = process.env.STRIPE_SECRET_KEY;
  const map = {
    'pro_monthly': { price: process.env.STRIPE_PRICE_PRO_MONTHLY, mode: 'subscription' },
    'pro_annual':  { price: process.env.STRIPE_PRICE_PRO_ANNUAL,  mode: 'subscription' },
    'fasttrack':   { price: process.env.STRIPE_PRICE_FASTTRACK,   mode: 'payment' }
  };
  const cfg = map[plan];
  if (!key || !cfg || !cfg.price) { res.status(200).json({ error: 'not_configured' }); return; }

  const origin = req.headers.origin || ('https://' + (req.headers.host || 'hardhatjobs.co'));
  const form = new URLSearchParams();
  form.append('mode', cfg.mode);
  form.append('line_items[0][price]', cfg.price);
  form.append('line_items[0][quantity]', '1');
  form.append('allow_promotion_codes', 'true');
  form.append('success_url', origin + '/success.html?plan=' + encodeURIComponent(plan) + '&session_id={CHECKOUT_SESSION_ID}');
  form.append('cancel_url', origin + '/pricing.html');

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });
    const j = await r.json();
    if (j && j.url) { res.status(200).json({ url: j.url }); return; }
    res.status(200).json({ error: (j && j.error && j.error.message) || 'stripe_error' });
  } catch (e) {
    res.status(200).json({ error: 'stripe_error' });
  }
};
