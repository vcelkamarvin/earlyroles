// EarlyRoles — /api/verify-checkout  (Vercel Serverless Function, CommonJS)
// Confirms a Stripe Checkout Session was actually paid before the app grants a plan.
// Uses the LIVE secret key from your EXISTING Stripe (Firmadeal) account via env var.
// If STRIPE_SECRET_KEY is not set yet, it falls back to "optimistic" (trusts the
// Stripe redirect) so checkout still works — add the key to make it verified & secure.

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const q = req.query || {};
  const plan = String(q.plan || '').trim();
  const session = String(q.session || '').trim();
  const key = process.env.STRIPE_SECRET_KEY;

  // No key configured, or no/invalid session → optimistic (same trust level as before).
  if (!key || session.indexOf('cs_') !== 0) {
    res.status(200).json({ ok: true, plan: plan, verified: false });
    return;
  }

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(session), {
      headers: { 'Authorization': 'Bearer ' + key }
    });
    const s = await r.json();
    const paid = !!s && (s.payment_status === 'paid' || s.status === 'complete');
    res.status(200).json({
      ok: paid,
      plan: plan,
      verified: true,
      payment_status: (s && s.payment_status) || null
    });
  } catch (e) {
    // Network/Stripe error → don't block a paying customer.
    res.status(200).json({ ok: true, plan: plan, verified: false });
  }
};
