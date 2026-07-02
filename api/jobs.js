// EarlyRoles — /api/jobs  (Vercel Serverless Function, CommonJS)
// Optional broader job coverage for Switzerland + foreigner-friendly EU roles,
// used to supplement the client-side Greenhouse/Ashby/Lever engine (which is CORS-
// friendly but company-by-company). This proxy bypasses CORS and normalizes results.
//
// Sources:
//   - Arbeitnow (free, no key): EU jobs incl. remote + a visa_sponsorship flag.
//   - Adzuna (optional): set ADZUNA_APP_ID + ADZUNA_APP_KEY to add Switzerland ("ch").
// Returns { jobs: [...] } normalized to the shape app.js expects, or { jobs: [] }
// when nothing is configured/reachable — so the static ATS path always works.

const HITS = {};
function limited(ip) {
  const now = Date.now();
  const w = HITS[ip] || (HITS[ip] = []);
  while (w.length && now - w[0] > 60000) w.shift();
  if (w.length >= 30) return true;        // 30 / minute / IP
  w.push(now);
  return false;
}

const clean = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const VISARX = /visa sponsor|sponsorship|relocation|relocate|work permit|english[- ]speaking|international candidate|willing to sponsor|work visa/i;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  if (limited(ip)) { res.status(200).json({ jobs: [] }); return; }

  const q = String((req.query && req.query.q) || '').slice(0, 80).trim();
  const out = [];

  // 1) Arbeitnow — free, EU incl. remote + visa sponsorship flag
  try {
    const r = await fetch('https://www.arbeitnow.com/api/job-board-api');
    if (r.ok) {
      const j = await r.json();
      (j.data || []).slice(0, 120).forEach(x => {
        const loc = x.location || (x.remote ? 'Remote' : '');
        const tags = Array.isArray(x.tags) ? x.tags.slice(0, 3) : [];
        const visa = !!x.visa_sponsorship || VISARX.test((x.title || '') + ' ' + (x.description || ''));
        if (visa) tags.unshift('Visa-friendly');
        out.push({
          title: x.title, co: x.company_name || '', loc: loc || 'Remote',
          remote: !!x.remote, type: (x.job_types && x.job_types[0]) || '',
          tags: tags, url: x.url, date: x.created_at ? x.created_at * 1000 : Date.now(),
          desc: clean(x.description).slice(0, 300), src: 'arbeitnow', visa: visa
        });
      });
    }
  } catch (e) { /* ignore */ }

  // 2) Adzuna Switzerland — optional (needs keys)
  const aid = process.env.ADZUNA_APP_ID, akey = process.env.ADZUNA_APP_KEY;
  if (aid && akey) {
    try {
      const url = 'https://api.adzuna.com/v1/api/jobs/ch/search/1?app_id=' + encodeURIComponent(aid) +
        '&app_key=' + encodeURIComponent(akey) + '&results_per_page=50&content-type=application/json' +
        (q ? ('&what=' + encodeURIComponent(q)) : '');
      const r = await fetch(url);
      if (r.ok) {
        const j = await r.json();
        (j.results || []).forEach(x => {
          const loc = (x.location && x.location.display_name) || 'Switzerland';
          const desc = clean(x.description);
          const visa = VISARX.test((x.title || '') + ' ' + desc);
          out.push({
            title: x.title, co: (x.company && x.company.display_name) || '', loc: loc,
            remote: /remote/i.test(loc + ' ' + (x.title || '')), type: x.contract_time || '',
            tags: visa ? ['Visa-friendly'] : [], url: x.redirect_url,
            date: x.created ? Date.parse(x.created) : Date.now(),
            desc: desc.slice(0, 300), src: 'adzuna', visa: visa
          });
        });
      }
    } catch (e) { /* ignore */ }
  }

  // de-dupe by title|company
  const seen = new Set();
  const jobs = out.filter(j => {
    if (!j.title || !j.url) return false;
    const k = (j.title + '|' + j.co).toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(k)) return false; seen.add(k); return true;
  }).slice(0, 200);

  res.status(200).json({ jobs });
};
