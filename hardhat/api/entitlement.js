// HardHat — /api/entitlement  (Vercel Serverless Function, CommonJS)
// Server-verified plan lookup: GET /api/entitlement?email=x@y.co
// Reads Supabase `hardhat_subscriptions` (written by /api/stripe-webhook)
// using the service key — the table has NO anon access.
// Returns {configured:false} until SUPABASE_URL + SUPABASE_SERVICE_KEY are set,
// so the client keeps its demo-grade localStorage behavior meanwhile.

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) { res.status(200).json({ configured: false }); return; }

  const email = String((req.query && req.query.email) || '').toLowerCase().trim();
  if (!/.+@.+\..+/.test(email) || email.length > 120) { res.status(200).json({ configured: true, plan: 'free' }); return; }

  try {
    const r = await fetch(url.replace(/\/$/, '') + '/rest/v1/hardhat_subscriptions?select=plan,status&email=eq.' + encodeURIComponent(email) + '&limit=1', {
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
    const rows = await r.json();
    const row = Array.isArray(rows) && rows[0];
    const active = row && row.status === 'active' && row.plan && row.plan !== 'free';
    res.status(200).json({ configured: true, plan: active ? row.plan : 'free' });
  } catch (e) {
    res.status(200).json({ configured: false });
  }
};
