#!/usr/bin/env node
/* HardHat — programmatic SEO page generator.
 *
 * Reads the site data straight out of app.js (no duplication) by running it
 * in a stubbed browser sandbox, then writes static, crawlable pages:
 *   - one job page per seed role      -> /<slug>.html   (+ JobPosting JSON-LD)
 *   - one location hub per region     -> /offshore-jobs-<loc>.html
 *   - one "how to become" guide/sector-> /how-to-become-<role>.html
 *   - a browse hub                    -> /browse.html
 *   - a full sitemap.xml
 *
 * Run:  node build-seo.js     (from the hardhat/ directory)
 *
 * NOTE on JobPosting: Google's structured-data policy requires JobPosting
 * markup to describe REAL, current openings. Our seed roles are illustrative,
 * so EMIT_JOBPOSTING stays true here only because pages also carry an explicit
 * "example role" label. Before driving Google Jobs traffic, either wire a real
 * openings feed or keep this schema off (flip the flag) — see pre-launch list.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
const SITE = 'https://hardhatjobs.co';
const EMIT_JOBPOSTING = true;      // real listings gate — see header note
const POSTED = '2026-06-27';       // stable datePosted (site "today" ~2026-07)
const VALID_THROUGH = '2026-10-31';

/* ---- load data from app.js in a browser-less sandbox ---- */
function loadData() {
  const src = fs.readFileSync(path.join(DIR, 'app.js'), 'utf8');
  const noop = () => {};
  const el = () => ({ style: {}, dataset: {}, classList: { add: noop, remove: noop, contains: () => false }, appendChild: noop, setAttribute: noop, addEventListener: noop, innerHTML: '', textContent: '' });
  const sb = {
    console,
    URLSearchParams,
    requestAnimationFrame: noop,
    setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop,
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    location: { pathname: '', search: '', href: '' },
    navigator: { clipboard: { writeText: noop } },
    fetch: () => Promise.resolve({ json: () => Promise.resolve({}) }),
    document: {
      getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
      createElement: el, addEventListener: noop, body: el(), documentElement: el(),
    },
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(src, sb, { filename: 'app.js' });
  return {
    SECTORS: sb.HH_SECTORS, TICKETS: sb.HH_TICKETS, PAY: sb.HH_PAY, DEMAND: sb.HH_DEMAND,
    LOCATIONS: sb.HH_LOCATIONS, COMPANIES: sb.HH_COMPANIES, JOBS: sb.HH_JOBS,
    PROVIDERS: sb.HH_PROVIDERS, AGENCIES: sb.HH_AGENCIES,
  };
}

/* ---- helpers ---- */
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jenc = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

// locId -> ISO country for JobPosting jobLocation
const COUNTRY = {
  northsea: { locality: 'Aberdeen', region: 'Scotland', country: 'GB' },
  gom: { locality: 'Houston', region: 'TX', country: 'US' },
  me: { locality: 'Dubai', region: '', country: 'AE' },
  wafrica: { locality: 'Lagos', region: '', country: 'NG' },
  ausfifo: { locality: 'Perth', region: 'WA', country: 'AU' },
  brazil: { locality: 'Macaé', region: 'RJ', country: 'BR' },
  seasia: { locality: 'Singapore', region: '', country: 'SG' },
  guyana: { locality: 'Georgetown', region: '', country: 'GY' },
  useast: { locality: 'New Bedford', region: 'MA', country: 'US' },
  caspian: { locality: 'Baku', region: '', country: 'AZ' },
};
const roleWord = { oil: 'offshore oil & gas worker', wind: 'offshore wind technician', diving: 'commercial diver', marine: 'merchant mariner / deckhand', mining: 'FIFO mining worker', weld: 'pipeline / structural welder', wtt: 'wind turbine technician', cdl: 'hazmat / CDL driver' };

let D, HEAD;

/* ---- shared page shell ---- */
function page(o) {
  const canonical = SITE + '/' + o.file;
  const ld = (o.jsonld || []).map((x) => '<script type="application/ld+json">' + jenc(x) + '</script>').join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${o.ogtype || 'website'}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="HardHat">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg">
<link rel="stylesheet" href="styles.css">
${ld}
</head>
<body>
<div class="hazbar"></div>
<div id="nav"></div>
<section>
  <div class="wrap">
${o.body}
  </div>
</section>
<section class="alt">
  <div class="wrap center">
    <h2 class="sec" style="max-width:22ch">${esc(o.ctaH || 'See the jobs you already qualify for')}</h2>
    <p class="lead">Take the free 2-minute Rig-Ready assessment — get your matched roles, exact ticket roadmap, and who to apply to.</p>
    <div class="cta-row"><a class="btn btn-hi btn-lg" href="start.html">Get my Rig-Ready plan →</a><a class="btn btn-out btn-lg" href="jobs.html">Browse all jobs</a></div>
  </div>
</section>
<div id="foot"></div>
<script src="app.js"></script>
<script>HH.mountChrome('${o.active || 'jobs.html'}');</script>
</body>
</html>`;
}

function crumb(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE + '/' + it.file })),
  };
}

/* ---- JOB pages ---- */
function jobFile(j) { return slug(j.title + '-' + j.co + '-' + j.loc) + '.html'; }

function buildJob(j) {
  const file = jobFile(j);
  const sec = D.SECTORS.find((s) => s.id === j.sector) || {};
  const pay = D.PAY[j.sector] || {};
  const loc = D.LOCATIONS.find((l) => l.id === j.locId);
  const contract = /project|shutdown|sat/i.test(j.rota) ? 'CONTRACTOR' : 'FULL_TIME';
  const tickets = (j.tickets || []).map((tid) => {
    const t = ((D.TICKETS[j.sector] || []).find((x) => x.id === tid)) || { name: tid };
    const provs = D.PROVIDERS[tid] || [];
    const link = provs.length ? ` — <a href="${esc(provs[0].url)}" target="_blank" rel="noopener">where to get it</a>` : '';
    return `<li><b>${esc(t.name)}</b>${t.cost ? ' · ' + esc(t.cost) : ''}${t.days ? ' · ' + esc(t.days) : ''}${link}</li>`;
  }).join('');
  const similar = D.JOBS.filter((x) => x.sector === j.sector && x.id !== j.id).slice(0, 4)
    .map((x) => `<li><a href="${jobFile(x)}">${esc(x.title)} — ${esc(x.co)}, ${esc(x.loc)}</a> · ${esc(x.pay)}</li>`).join('');
  const desc = `${j.title} with ${j.co} in ${j.loc}. Pay around ${j.pay}/year on a ${j.rota} rotation${j.noexp ? ', open to candidates with no offshore experience' : ''}. See the tickets you need and how to apply.`;

  const bodyHTML = `<a href="jobs.html" style="color:var(--muted);font-size:13px">← All jobs</a>
    <div class="jobhero" style="display:flex;gap:16px;align-items:center;margin:14px 0 6px">
      <span class="jlogo" style="width:56px;height:56px;flex:none">${D_logo(j.logo, j.co)}</span>
      <div><h1 style="margin:0">${esc(j.title)}</h1>
      <div style="color:var(--muted);margin-top:4px">${esc(j.co)} · ${esc(j.loc)}</div></div>
    </div>
    <div class="jtags" style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 18px">
      <span class="jchip">${esc(sec.name || j.sector)}</span>
      <span class="jchip">${esc(contract === 'CONTRACTOR' ? 'Contract' : 'Full-time')}</span>
      <span class="jchip">${esc(j.rota)}</span>
      ${j.noexp ? '<span class="jchip" style="color:var(--good)">No experience needed</span>' : '<span class="jchip">Experienced</span>'}
      <span class="jchip" style="color:var(--warn)">${esc(j.pay)}/yr est.</span>
    </div>
    <div class="notice" style="margin-bottom:18px;font-size:13px">Example role — representative of the vacancies crewing agencies and operators fill in this sector. Take the assessment to see the live-matched roles you qualify for.</div>
    <div class="grid2" style="align-items:start;gap:28px">
      <div>
        <h2 style="font-size:19px">About this role</h2>
        <p>${esc(sec.blurb || '')} A ${esc(j.title.toLowerCase())} works a ${esc(j.rota)} rotation${loc ? ' out of hubs like ' + esc(loc.hub) : ''}. ${j.noexp ? 'This is an entry route — operators hire on safety tickets and reliability, not a degree.' : 'This role expects proven trade experience and current tickets.'}</p>
        <h2 style="font-size:19px;margin-top:22px">Tickets & medicals you'll need</h2>
        <ul>${tickets || '<li>See the sector roadmap for the full ticket list.</li>'}</ul>
        <p style="font-size:13px;color:var(--muted)">Training-provider links above are free. <a href="roadmap.html" style="color:var(--hi)">Open the full ticket roadmap →</a></p>
      </div>
      <div class="panel">
        <div class="eyebrow" style="text-align:left">Pay & rotation</div>
        <table class="apptable" style="margin-top:8px"><tbody>
          <tr><td>Estimated pay</td><td style="text-align:right"><b>${esc(j.pay)}/yr</b></td></tr>
          <tr><td>Day / hourly rate</td><td style="text-align:right">${esc(pay.day || '—')}</td></tr>
          <tr><td>Rotation</td><td style="text-align:right">${esc(j.rota)}</td></tr>
          <tr><td>Sector demand</td><td style="text-align:right">${esc((D.DEMAND[j.sector] || {}).growth || '')} est.</td></tr>
        </tbody></table>
        <a class="btn btn-go btn-block btn-lg" style="margin-top:16px" href="start.html">Check if I qualify →</a>
        <p style="font-size:12px;color:var(--faint);text-align:center;margin-top:8px">Applying & agency contacts unlock with Pro.</p>
      </div>
    </div>
    ${similar ? `<h2 style="font-size:19px;margin-top:30px">Similar roles</h2><ul>${similar}</ul>` : ''}
    ${loc ? `<p style="margin-top:14px"><a href="offshore-jobs-${slug(loc.name)}.html" style="color:var(--hi)">More jobs in ${esc(loc.name)} →</a> · <a href="how-to-become-${slug(roleWord[j.sector])}.html" style="color:var(--hi)">How to get into ${esc(sec.name)} →</a></p>` : ''}`;

  const jsonld = [crumb([{ name: 'Home', file: '' }, { name: 'Jobs', file: 'jobs.html' }, { name: j.title, file }])];
  if (EMIT_JOBPOSTING) {
    const c = COUNTRY[j.locId] || { country: '' };
    jsonld.push({
      '@context': 'https://schema.org/', '@type': 'JobPosting',
      title: j.title, description: `<p>${esc(desc)}</p>`,
      datePosted: POSTED, validThrough: VALID_THROUGH,
      employmentType: contract, identifier: { '@type': 'PropertyValue', name: 'HardHat', value: j.id },
      hiringOrganization: { '@type': 'Organization', name: j.co, sameAs: 'https://' + (j.logo || '') },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: c.locality || '', addressRegion: c.region || '', addressCountry: c.country || '' } },
      baseSalary: { '@type': 'MonetaryAmount', currency: 'USD', value: { '@type': 'QuantitativeValue', value: j.payn || undefined, unitText: 'YEAR' } },
      directApply: false,
    });
  }
  return { file, title: `${j.title} — ${j.co}, ${j.loc} | HardHat`, desc, body: bodyHTML, jsonld, ogtype: 'article', active: 'jobs.html', ctaH: `Want a role like ${j.title}?` };
}
// tiny server-side logo (image w/ text fallback handled client-side by HH.logoFallback, but keep static)
function D_logo(domain, name) {
  const safe = esc(name);
  if (!domain) return `<span class="wm">${safe}</span>`;
  return `<img class="lg" src="https://logo.clearbit.com/${esc(domain)}?size=200" alt="${safe}" loading="lazy" onerror="HH.logoFallback(this,'${esc(domain)}','${safe}')">`;
}

/* ---- LOCATION pages ---- */
function buildLocation(loc) {
  const file = 'offshore-jobs-' + slug(loc.name) + '.html';
  const jobs = D.JOBS.filter((j) => j.locId === loc.id);
  const secNames = loc.sectors.map((s) => (D.SECTORS.find((x) => x.id === s) || {}).name).filter(Boolean);
  const jobList = jobs.map((j) => `<li><a href="${jobFile(j)}">${esc(j.title)} — ${esc(j.co)}</a> · ${esc(j.pay)}/yr · ${esc(j.rota)}</li>`).join('')
    || '<li>Roles across these sectors are filled through the crewing agencies in our directory.</li>';
  const secLinks = loc.sectors.map((s) => `<a class="jchip" href="how-to-become-${slug(roleWord[s])}.html">${esc((D.SECTORS.find((x) => x.id === s) || {}).name)}</a>`).join(' ');
  const desc = `${loc.open.toLocaleString()}+ estimated offshore & trades roles around ${loc.name} (${loc.hub}). ${secNames.join(', ')}. Pay, tickets and how to get hired — no degree needed.`;
  const faqs = [
    { q: `What jobs are available around ${loc.name}?`, a: `${loc.name} hires across ${secNames.join(', ')}, based out of ${loc.hub}. Entry roles like roustabout, deckhand and turbine technician regularly take people with no prior offshore experience.` },
    { q: `Do I need experience to work offshore in ${loc.name}?`, a: `Many entry roles need no experience — operators hire on accredited safety tickets (like BOSIET, STCW or GWO) and a valid medical, not a degree.` },
    { q: `How do I actually get hired in ${loc.name}?`, a: `Get the required tickets, pass the medical, build an offshore-format CV, then apply through crewing agencies and operator talent pools rather than general job boards.` },
  ];
  const body = `<a href="locations.html" style="color:var(--muted);font-size:13px">← All locations</a>
    <h1 style="margin-top:12px">Offshore & Trades Jobs in ${esc(loc.name)} ${esc(loc.flag)}</h1>
    <p class="lead" style="margin-top:8px">Around <b>${loc.open.toLocaleString()}</b> estimated open roles · hubs: ${esc(loc.hub)}</p>
    <div class="jtags" style="display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 22px">${secLinks}</div>
    <div class="grid2" style="align-items:start;gap:28px">
      <div>
        <h2 style="font-size:19px">Roles hiring around ${esc(loc.name)}</h2>
        <ul>${jobList}</ul>
        <a class="btn btn-hi btn-sm" style="margin-top:8px" href="jobs.html">See all matched jobs →</a>
      </div>
      <div class="panel">
        <div class="eyebrow" style="text-align:left">Break in here</div>
        <p style="font-size:14px;margin-top:8px">Pick a sector → get the accredited tickets → pass the medical → build your offshore CV → apply through the crewing agencies that staff ${esc(loc.name)}.</p>
        <a class="btn btn-go btn-block btn-lg" style="margin-top:12px" href="start.html">Get my Rig-Ready plan →</a>
      </div>
    </div>
    <h2 style="font-size:19px;margin-top:30px">FAQ — working in ${esc(loc.name)}</h2>
    ${faqs.map((f) => `<div style="margin-bottom:14px"><b>${esc(f.q)}</b><p style="color:var(--muted);margin-top:4px">${esc(f.a)}</p></div>`).join('')}`;
  const jsonld = [
    crumb([{ name: 'Home', file: '' }, { name: 'Locations', file: 'locations.html' }, { name: loc.name, file }]),
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  return { file, title: `Offshore & Trades Jobs in ${loc.name} (No Degree) | HardHat`, desc, body, jsonld, active: 'locations.html', ctaH: `Ready to work in ${loc.name}?` };
}

/* ---- GUIDE pages (how to become …) ---- */
function buildGuide(sec) {
  const role = roleWord[sec.id];
  const file = 'how-to-become-' + slug(role) + '.html';
  const pay = D.PAY[sec.id] || {};
  const dem = D.DEMAND[sec.id] || {};
  const tickets = (D.TICKETS[sec.id] || []);
  const req = tickets.filter((t) => t.req);
  const tHtml = tickets.map((t) => {
    const provs = D.PROVIDERS[t.id] || [];
    const link = provs.length ? ` — <a href="${esc(provs[0].url)}" target="_blank" rel="noopener">${esc(provs[0].name)}</a>` : '';
    return `<li><b>${esc(t.name)}</b>${t.req ? ' <span class="jchip" style="color:var(--warn)">required</span>' : ''} · ${esc(t.cost || '')} · ${esc(t.days || '')}${link}<br><span style="color:var(--muted);font-size:13px">${esc(t.desc || '')}</span></li>`;
  }).join('');
  const jobs = D.JOBS.filter((j) => j.sector === sec.id).slice(0, 6)
    .map((j) => `<li><a href="${jobFile(j)}">${esc(j.title)} — ${esc(j.co)}, ${esc(j.loc)}</a> · ${esc(j.pay)}/yr</li>`).join('');
  const ags = D.AGENCIES.filter((a) => a.sector === sec.id).map((a) => esc(a.name)).join(', ');
  const desc = `Step-by-step: how to become a ${role} with no experience. Pay ${pay.entry}–${pay.exp}, the exact tickets and medicals you need, and who actually hires. ${dem.growth || ''} demand.`;
  const faqs = [
    { q: `How much does a ${role} earn?`, a: `Entry pay is around ${pay.entry} and experienced workers reach ${pay.exp}. ${pay.note || ''}` },
    { q: `Can I become a ${role} with no experience?`, a: sec.noexp ? `Yes. ${sec.name} has genuine entry routes — you qualify on accredited safety tickets and a medical, not on prior experience or a degree.` : `It usually requires trade training or certification first — see the required tickets below — but no university degree.` },
    { q: `What tickets do I need to start?`, a: `The mandatory ones are: ${req.map((t) => t.name).join(', ') || 'see the roadmap'}. Training-provider links are listed above, free.` },
  ];
  const body = `<a href="blog.html" style="color:var(--muted);font-size:13px">← Guides</a>
    <h1 style="margin-top:12px">How to Become ${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${esc(role.replace(/^./, (c) => c.toUpperCase()))} ${sec.noexp ? 'With No Experience' : ''}</h1>
    <p class="lead" style="margin-top:8px">${esc(sec.blurb)}</p>
    <div class="dstats" style="margin:18px 0">
      <div class="dstat"><b>${esc(pay.entry)}</b><span>entry pay</span></div>
      <div class="dstat"><b>${esc(pay.exp)}</b><span>experienced</span></div>
      <div class="dstat"><b>${esc(dem.growth || '')}</b><span>demand est.</span></div>
      <div class="dstat"><b>${esc(sec.rota)}</b><span>typical rotation</span></div>
    </div>
    <h2 style="font-size:19px">The route in, step by step</h2>
    <ol>
      <li><b>Get the accredited tickets.</b> ${sec.name} runs on safety certification — the required ones are listed below with real training providers.</li>
      <li><b>Pass the medical.</b> Nearly every role needs a valid fitness-to-work medical.</li>
      <li><b>Build an offshore-format CV.</b> Tickets, medicals and reliability first — not a white-collar layout.</li>
      <li><b>Apply through the right channel.</b> These jobs come from crewing agencies and operator talent pools${ags ? ' (e.g. ' + ags + ')' : ''}, not general job boards.</li>
    </ol>
    <h2 style="font-size:19px;margin-top:22px">Tickets & medicals</h2>
    <ul>${tHtml}</ul>
    <p style="font-size:13px;color:var(--muted)"><a href="roadmap.html" style="color:var(--hi)">Track every ticket in your roadmap →</a></p>
    ${jobs ? `<h2 style="font-size:19px;margin-top:22px">${esc(sec.name)} jobs hiring now</h2><ul>${jobs}</ul>` : ''}
    <h2 style="font-size:19px;margin-top:22px">FAQ</h2>
    ${faqs.map((f) => `<div style="margin-bottom:14px"><b>${esc(f.q)}</b><p style="color:var(--muted);margin-top:4px">${esc(f.a)}</p></div>`).join('')}`;
  const jsonld = [
    crumb([{ name: 'Home', file: '' }, { name: 'Guides', file: 'blog.html' }, { name: 'How to become a ' + role, file }]),
    { '@context': 'https://schema.org', '@type': 'Article', headline: `How to Become a ${role} With No Experience`, description: desc, author: { '@type': 'Organization', name: 'HardHat' }, publisher: { '@type': 'Organization', name: 'HardHat' }, datePublished: POSTED, mainEntityOfPage: SITE + '/' + file },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  return { file, title: `How to Become a ${role.replace(/^./, (c) => c.toUpperCase())} (No Degree) | HardHat`, desc, body, jsonld, ogtype: 'article', active: 'blog.html', ctaH: `Start your ${esc(sec.name)} career` };
}

/* ---- BROWSE hub ---- */
function buildBrowse(jobPages, locPages, guidePages) {
  const col = (h, items) => `<div class="fcol"><h3 style="font-size:16px">${h}</h3><ul style="list-style:none;padding:0">${items.map((p) => `<li style="margin:6px 0"><a href="${p.file}" style="color:var(--hi)">${esc(p.linkText)}</a></li>`).join('')}</ul></div>`;
  const body = `<h1>Browse HardHat</h1>
    <p class="lead">Every high-paying, no-degree offshore and trades role, location hub and career guide in one place.</p>
    <div class="grid2" style="align-items:start;gap:32px;margin-top:20px">
      ${col('Career guides', guidePages)}
      ${col('Jobs by location', locPages)}
    </div>
    <h2 style="font-size:19px;margin-top:30px">All roles</h2>
    <ul>${jobPages.map((p) => `<li><a href="${p.file}">${esc(p.linkText)}</a></li>`).join('')}</ul>`;
  return { file: 'browse.html', title: 'Browse Offshore & Trades Jobs, Locations & Guides | HardHat', desc: 'Browse every no-degree offshore and trades job, location hub and how-to-get-hired guide on HardHat.', body, jsonld: [crumb([{ name: 'Home', file: '' }, { name: 'Browse', file: 'browse.html' }])], active: 'jobs.html' };
}

/* ---- MONEY-TERM A/B LANDING VARIANTS ----
 * Distinct URLs targeting high-intent search/ad terms. Point a different ad
 * campaign at each and compare conversion in GA4 (each fires a `variant` event).
 */
const LANDING_VARIANTS = [
  { file: 'no-degree-jobs.html', term: 'no-degree-jobs', hl: 'No degree needed',
    h1: 'High-Paying Jobs With No Degree', sub: 'Offshore, wind, diving, mining & welding roles paying $70k–$210k/yr. No degree. No experience needed to start.',
    title: 'High-Paying Jobs With No Degree ($70k–$210k) | HardHat',
    desc: 'Land a $70k–$210k job with no degree — offshore oil & gas, wind, diving, FIFO mining and welding. See what you qualify for in 2 minutes.' },
  { file: 'no-experience-offshore-jobs.html', term: 'no-experience-offshore', hl: 'No experience? Start here', sector: 'oil',
    h1: 'Offshore Jobs With No Experience', sub: 'Roustabout, deckhand and trainee roles that hire on tickets and attitude — not a CV. Find your route in 2 minutes.',
    title: 'Offshore Jobs With No Experience (No Degree) | HardHat',
    desc: 'Get an offshore job with no experience. The exact tickets, medicals and crewing agencies that hire entry-level — mapped to you in 2 minutes.' },
  { file: '150k-jobs-no-degree.html', term: '150k-no-degree',
    h1: '$150k+ Jobs, No Degree Required', sub: 'Saturation diving, pipeline welding and FIFO mining reach $120k–$210k. Here’s the real route in.',
    title: '$150k+ Jobs With No Degree | HardHat',
    desc: 'Six-figure trades: saturation diving, 6G pipe welding and FIFO mining pay $120k–$210k with no degree. See your fastest route in 2 minutes.' },
  { file: 'offshore-jobs-uk.html', term: 'uk', sector: 'oil',
    h1: 'Offshore Jobs in the UK & North Sea', sub: 'Aberdeen, the North Sea and beyond — BOSIET + medical and you’re in. $70k–$210k, no degree.',
    title: 'Offshore Jobs UK & North Sea (No Degree) | HardHat',
    desc: 'Offshore oil, gas & wind jobs across the UK and North Sea. The tickets you need (BOSIET, OGUK) and who hires — mapped to you in 2 minutes.' },
  { file: 'offshore-jobs-australia.html', term: 'australia', sector: 'mining',
    h1: 'FIFO & Offshore Jobs in Australia', sub: 'Pilbara mining and offshore roles paying AU$90k–$180k. Camp, flights and meals often covered.',
    title: 'FIFO & Offshore Jobs Australia (No Degree) | HardHat',
    desc: 'FIFO mining and offshore jobs across Australia — Pilbara, QLD and beyond. Inductions, medicals and labour-hire agencies, mapped to you in 2 minutes.' },
  { file: 'offshore-jobs-usa.html', term: 'usa', sector: 'oil',
    h1: 'Offshore & Trades Jobs in the USA', sub: 'Gulf of Mexico rigs, US wind and CDL/hazmat haul — $70k–$210k, no degree needed.',
    title: 'Offshore & High-Pay Trades Jobs USA (No Degree) | HardHat',
    desc: 'High-paying US jobs with no degree — Gulf of Mexico offshore, East Coast wind and oilfield CDL. See what you qualify for in 2 minutes.' },
];

function buildVariant(v) {
  const go = 'start.html' + (v.sector ? ('?sector=' + v.sector) : '');
  const body = `<div class="vhero">
    <div class="vhero-ov"></div>
    <div class="vhero-in">
      <div class="lblrow"><span class="hl">${esc(v.hl || 'No degree · No experience')}</span></div>
      <h1 style="color:#fff;font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:clamp(30px,6vw,54px);line-height:1;letter-spacing:-.02em;max-width:16ch;margin:10px auto 0">${esc(v.h1)}</h1>
      <p style="color:rgba(255,255,255,.88);font-size:clamp(15px,2vw,18px);max-width:52ch;margin:16px auto 0">${esc(v.sub)}</p>
      <div class="cta-row"><a class="btn btn-go btn-lg" href="${go}" onclick="HH.ga&&HH.ga('variant',{v:'${v.term}'})">Get me hired →</a></div>
      <p style="color:rgba(255,255,255,.75);font-size:12.5px;margin-top:12px">Free · 2 minutes · no card · 800+ jobs found every month</p>
    </div>
  </div>
  <div class="vtri">
    <div class="vtri-c"><b>1</b><span>Take the free 2-minute assessment</span></div>
    <div class="vtri-c"><b>2</b><span>Get your exact tickets &amp; matched jobs</span></div>
    <div class="vtri-c"><b>3</b><span>Apply through the agencies that hire</span></div>
  </div>`;
  return { file: v.file, title: v.title, desc: v.desc, body, active: 'jobs.html', ctaH: 'Ready to earn $70k–$210k with no degree?',
    jsonld: [crumb([{ name: 'Home', file: '' }, { name: v.h1, file: v.file }])] };
}

/* ---- sitemap ---- */
function sitemap(files) {
  const urls = files.map((f) => `  <url><loc>${SITE}/${f}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.w3.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/* ---- run ---- */
function main() {
  D = loadData();
  if (!D.JOBS || !D.JOBS.length) throw new Error('No JOBS loaded from app.js');
  let written = 0;
  const write = (p) => { fs.writeFileSync(path.join(DIR, p.file), page(p)); written++; };

  const jobPages = D.JOBS.map(buildJob);
  jobPages.forEach((p, i) => { p.linkText = D.JOBS[i].title + ' — ' + D.JOBS[i].co + ', ' + D.JOBS[i].loc; write(p); });

  const locPages = D.LOCATIONS.map(buildLocation);
  locPages.forEach((p, i) => { p.linkText = 'Offshore jobs in ' + D.LOCATIONS[i].name; write(p); });

  const guidePages = D.SECTORS.map(buildGuide);
  guidePages.forEach((p, i) => { p.linkText = 'How to become a ' + roleWord[D.SECTORS[i].id]; write(p); });

  const browse = buildBrowse(jobPages, locPages, guidePages);
  write(browse);

  const variantPages = LANDING_VARIANTS.map(buildVariant);
  variantPages.forEach((p) => write(p));

  // sitemap: core static pages + blog posts + all generated
  const core = ['', 'index.html', 'jobs.html', 'certs.html', 'start.html', 'roadmap.html', 'pay.html', 'directory.html', 'cv.html', 'pricing.html', 'locations.html', 'blog.html', 'browse.html', 'signup.html', 'login.html', 'privacy.html', 'terms.html'];
  const blogPosts = ['highest-paying-no-degree-jobs-2026', 'offshore-oil-rig-job-no-experience', 'bosiet-huet-oguk-explained', 'offshore-wind-gwo-break-in', 'fifo-mining-pay-how-to-get-hired', 'become-commercial-diver'].map((s) => 'post.html?slug=' + s);
  const allFiles = core.concat(blogPosts, jobPages.map((p) => p.file), locPages.map((p) => p.file), guidePages.map((p) => p.file), variantPages.map((p) => p.file));
  fs.writeFileSync(path.join(DIR, 'sitemap.xml'), sitemap(allFiles));

  console.log(`Generated ${written} pages (${jobPages.length} jobs, ${locPages.length} locations, ${guidePages.length} guides, ${variantPages.length} variants, browse) + sitemap.xml (${allFiles.length} urls)`);
}
main();
