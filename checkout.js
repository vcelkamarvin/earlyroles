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
  const plan = String(body.plan || '').toLowerCase();

  const key = process.env.STRIPE_SECRET_KEY;
  const prices = {
    'monthly': process.env.STRIPE_PRICE_MONTHLY || 'price_1TlYPD0yoeotmkPhMOUhvUKL',
    'annual': process.env.STRIPE_PRICE_ANNUAL || 'price_1TlYPe0yoeotmkPhQkTLjlpg',
    'auto-apply': process.env.STRIPE_PRICE_AUTOAPPLY || 'price_1TlYPh0yoeotmkPhOiDof2UB',
    'autoapply': process.env.STRIPE_PRICE_AUTOAPPLY || 'price_1TlYPh0yoeotmkPhOiDof2UB'
  };
  const price = prices[plan];
  if (!key || !price) { res.status(200).json({ error: 'not_configured' }); return; }

  const origin = req.headers.origin || ('https://' + (req.headers.host || 'earlyroles.com'));
  const form = new URLSearchParams();
  form.append('mode', 'subscription');
  form.append('line_items[0][price]', price);
  form.append('line_items[0][quantity]', '1');
  form.append('allow_promotion_codes', 'true');
  form.append('success_url', origin + '/dashboard.html?checkout=success');
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
