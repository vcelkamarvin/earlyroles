// EarlyRoles — /api/checkout  (Vercel Serverless Function, CommonJS)
// Creates a Stripe Checkout Session for a plan. Returns {url} to redirect to.
// Activates when these env vars are set on Vercel:
//   STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL, STRIPE_PRICE_AUTOAPPLY
// Until then it returns {error:"not_configured"} and the site falls back to signup.

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};
  const planRaw = String(body.plan || '').trim();      // canonical label, e.g. "Auto-Apply"
  const plan = planRaw.toLowerCase();

  const key = process.env.STRIPE_SECRET_KEY;
  const prices = {
    'monthly': process.env.STRIPE_PRICE_MONTHLY,
    'annual': process.env.STRIPE_PRICE_ANNUAL,
    'auto-apply': process.env.STRIPE_PRICE_AUTOAPPLY,
    'autoapply': process.env.STRIPE_PRICE_AUTOAPPLY
  };
  const price = prices[plan];
  if (!key || !price) { res.status(200).json({ error: 'not_configured' }); return; }

  const origin = req.headers.origin || ('https://' + (req.headers.host || 'earlyroles.com'));
  const form = new URLSearchParams();
  form.append('mode', 'subscription');
  form.append('line_items[0][price]', price);
  form.append('line_items[0][quantity]', '1');
  form.append('allow_promotion_codes', 'true');
  // Route through success.html so /api/verify-checkout confirms payment before access is granted.
  form.append('success_url', origin + '/success.html?plan=' + encodeURIComponent(planRaw) + '&session={CHECKOUT_SESSION_ID}');
  form.append('cancel_url', origin + '/index.html#pricing');

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
