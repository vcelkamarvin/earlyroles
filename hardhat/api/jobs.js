// HardHat — /api/jobs  (Vercel Serverless Function, CommonJS)
// Live job feed via aggregator APIs. Activates when env vars are set on Vercel:
//   ADZUNA_APP_ID + ADZUNA_APP_KEY   (adzuna.com/api — free dev tier)
//   CAREERJET_KEY                    (careerjet.com/partners — free)
// Until then it returns {error:"not_configured"} and jobs.html silently uses
// the built-in catalog (jobs-data.json). Same graceful pattern as /api/checkout.
//
// Query: /api/jobs?q=offshore+wind+technician&where=Aberdeen&country=gb
// Response: { jobs:[{title,co,loc,pay,payn,url,posted,src}], src:'adzuna+careerjet' }

const CACHE = {};                 // in-memory per-lambda cache
const TTL = 1000 * 60 * 30;       // 30 min

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'HardHatJobs/1.0' } });
  if (!r.ok) throw new Error('upstream ' + r.status);
  return r.json();
}

async function adzuna(q, where, country) {
  const id = process.env.ADZUNA_APP_ID, key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) return [];
  const cc = (country || 'gb').toLowerCase();
  const u = 'https://api.adzuna.com/v1/api/jobs/' + cc + '/search/1?app_id=' + id + '&app_key=' + key +
    '&results_per_page=25&what=' + encodeURIComponent(q) + (where ? '&where=' + encodeURIComponent(where) : '');
  const j = await fetchJSON(u);
  return (j.results || []).map(r => ({
    title: r.title, co: (r.company && r.company.display_name) || '',
    loc: (r.location && r.location.display_name) || '',
    payn: Math.round(((r.salary_min || 0) + (r.salary_max || 0)) / 2) || null,
    url: r.redirect_url, posted: r.created, src: 'adzuna'
  }));
}

async function careerjet(q, where, country) {
  const key = process.env.CAREERJET_KEY;
  if (!key) return [];
  const locale = { us: 'en_US', gb: 'en_GB', au: 'en_AU', es: 'es_ES', mx: 'es_MX' }[(country || 'gb').toLowerCase()] || 'en_GB';
  const u = 'https://public.api.careerjet.net/search?affid=' + key + '&locale_code=' + locale +
    '&keywords=' + encodeURIComponent(q) + (where ? '&location=' + encodeURIComponent(where) : '') + '&pagesize=25&user_ip=1.1.1.1&user_agent=hardhat';
  const j = await fetchJSON(u);
  return (j.jobs || []).map(r => ({
    title: r.title, co: r.company || '', loc: r.locations || '',
    payn: null, url: r.url, posted: r.date, src: 'careerjet'
  }));
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const configured = (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) || process.env.CAREERJET_KEY;
  if (!configured) { res.status(200).json({ error: 'not_configured' }); return; }

  const q = String(req.query.q || 'offshore').slice(0, 80);
  const where = String(req.query.where || '').slice(0, 60);
  const country = String(req.query.country || 'gb').slice(0, 2);

  const ck = q + '|' + where + '|' + country;
  const hit = CACHE[ck];
  if (hit && Date.now() - hit.t < TTL) { res.status(200).json(hit.v); return; }

  try {
    const [a, c] = await Promise.all([
      adzuna(q, where, country).catch(() => []),
      careerjet(q, where, country).catch(() => [])
    ]);
    const jobs = a.concat(c).slice(0, 40);
    const v = { jobs, src: 'adzuna+careerjet', count: jobs.length };
    CACHE[ck] = { t: Date.now(), v };
    res.status(200).json(v);
  } catch (e) {
    res.status(200).json({ error: 'upstream_failed' });
  }
};
