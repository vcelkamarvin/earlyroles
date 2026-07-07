// HardHat — /api/directory  (Vercel Serverless Function, CommonJS)
// Server-verified crewing-agency contacts: GET /api/directory?email=x@y.co&sector=oil
// Verifies the caller's plan against Supabase `hardhat_subscriptions` (same source
// of truth as /api/entitlement) and returns the contact list ONLY for a verified
// PAID email (tier >= Pro). A spoofed localStorage plan can flip the UI but never
// receives contacts from here.
//
// Returns {configured:false} until SUPABASE_URL + SUPABASE_SERVICE_KEY are set,
// so directory.html falls back to its client-side list (demo-grade) meanwhile.

// Server-held contact list (the gated asset). Names/types may be shown as a free
// preview client-side; the reveal decision here is server-verified.
const AGENCIES = [
  { sector:'oil',    name:'Airswift',           type:'Global energy staffing',    region:'Global',    url:'https://www.airswift.com' },
  { sector:'oil',    name:'Orion Group',        type:'Oil & gas recruitment',     region:'UK/Global', url:'https://www.orionjobs.com' },
  { sector:'oil',    name:'NES Fircroft',       type:'Energy manpower',           region:'Global',    url:'https://www.nesfircroft.com' },
  { sector:'wind',   name:'Taylor Hopkinson',   type:'Renewables recruitment',    region:'Global',    url:'https://www.taylorhopkinson.com' },
  { sector:'wind',   name:'Airswift Renewables', type:'Offshore wind staffing',   region:'EU/US',     url:'https://www.airswift.com' },
  { sector:'diving', name:'Faststream',         type:'Maritime & subsea',         region:'Global',    url:'https://www.faststream.com' },
  { sector:'diving', name:'Subsea 7 careers',   type:'Subsea & diving operator',  region:'Global',    url:'https://www.subsea7.com/en/careers.html' },
  { sector:'marine', name:'Crowley Maritime',   type:'US vessel operator',        region:'US',        url:'https://www.crowley.com/careers' },
  { sector:'marine', name:'Faststream Marine',  type:'Merchant fleet crewing',    region:'Global',    url:'https://www.faststream.com' },
  { sector:'mining', name:'Hays Mining',        type:'Mining recruitment',        region:'AU/Global', url:'https://www.hays.com.au' },
  { sector:'mining', name:'WorkPac',            type:'FIFO labour hire',          region:'Australia', url:'https://www.workpac.com' },
  { sector:'mining', name:'Airswift (Canada)',  type:'No-experience FIFO stream', region:'Canada',    url:'https://www.airswift.com' },
  { sector:'mining', name:'The Bouchier Group', type:'Oil-sands camp & labour',   region:'Canada',    url:'https://www.bouchier.ca' },
  { sector:'mining', name:'PTW Energy Services', type:'Trades & apprentice crews', region:'Canada',   url:'https://www.ptwenergy.com' },
  { sector:'weld',   name:'Aerotek',            type:'Skilled trades staffing',   region:'US',        url:'https://www.aerotek.com' },
  { sector:'weld',   name:'Airswift',           type:'Fabrication & construction', region:'Global',   url:'https://www.airswift.com' },
  { sector:'wtt',    name:'Taylor Hopkinson',   type:'Wind tech staffing',        region:'Global',    url:'https://www.taylorhopkinson.com' },
  { sector:'cdl',    name:'Aerotek / Actalent', type:'Driver & oilfield staffing', region:'US',       url:'https://www.aerotek.com' },
  { sector:'cdl',    name:'Roehl Transport',    type:'CDL carrier (paid training)', region:'US',      url:'https://www.roehl.jobs' }
];

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) { res.status(200).json({ configured: false }); return; }   // not wired — client falls back

  const email = String((req.query && req.query.email) || '').toLowerCase().trim();
  const sector = String((req.query && req.query.sector) || '').toLowerCase().slice(0, 12);
  if (!/.+@.+\..+/.test(email) || email.length > 120) { res.status(200).json({ configured: true, paid: false, agencies: [] }); return; }

  try {
    const r = await fetch(url.replace(/\/$/, '') + '/rest/v1/hardhat_subscriptions?select=plan,status&email=eq.' + encodeURIComponent(email) + '&limit=1', {
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
    const rows = await r.json();
    const row = Array.isArray(rows) && rows[0];
    // Pro ($120) or Done-For-You ($190) unlock the contacts; Basics ($32) does not.
    const paid = row && row.status === 'active' && (row.plan === 'pro' || row.plan === 'dfy');
    if (!paid) { res.status(200).json({ configured: true, paid: false, agencies: [] }); return; }
    const list = sector ? AGENCIES.filter(a => a.sector === sector) : AGENCIES;
    res.status(200).json({ configured: true, paid: true, plan: row.plan, agencies: list });
  } catch (e) {
    res.status(200).json({ configured: false });
  }
};
