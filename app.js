/* Unlisted — shared data, mock auth, helpers (client-side demo) */

/* ===================================================================
   CONFIG — paste your real keys here to go live.
   1) Google Sign-In: create an OAuth Client ID at
      https://console.cloud.google.com/apis/credentials  (type: Web app),
      add your site URL to "Authorized JavaScript origins"
      (e.g. https://unlisted.vercel.app), then paste the ID below.
   2) Google Analytics: create a GA4 property at
      https://analytics.google.com , copy the Measurement ID (G-XXXXXXXXXX).
   Until these are filled in, Google Sign-In runs a clickable DEMO and
   Analytics stays off.
=================================================================== */
const CONFIG = {
  GOOGLE_CLIENT_ID: "137415610392-istrpgfj4i13ma8cn7rhv14ttjo651cc.apps.googleusercontent.com",  // real Google sign-in
  GA_MEASUREMENT_ID: "G-Z9362HN73S",     // GA4 — EarlyRoles Web stream
  SUPABASE_URL: "https://ossyctgqycfkcdcncpgg.supabase.co",   // real login (Supabase)
  SUPABASE_ANON_KEY: "sb_publishable_GQGwqejtKqPBwUXOQe0E0w_d4iHupij"   // public key — safe in client
};

/* ---------- Google Analytics (GA4) loader ---------- */
(function initGA(){
  const id = CONFIG.GA_MEASUREMENT_ID; if(!id) return;
  const s = document.createElement('script'); s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments); };
  gtag('js', new Date()); gtag('config', id);
})();

/* ---------- Job data (illustrative samples) ----------
   Every sample role is fully US-remote and carries a real apply URL that
   points at the company's own careers / hiring page, so "Apply" takes the
   user to a genuine application rather than a dead end. */
const JOBS = [
  {id:1, title:"Senior Staff Data Scientist — Consumer Relevance", co:"Reddit", domain:"reddit.com", loc:"Remote — US", lvl:"Lead · 10+ yrs", dept:"Data & AI", tags:["Data & AI","For makers"], sal:"$233k–$326k", ago:"2h ago", url:"https://boards.greenhouse.io/reddit"},
  {id:2, title:"Staff Site Reliability Engineer", co:"Kong", domain:"konghq.com", loc:"Remote (United States)", lvl:"Lead · 10+ yrs", dept:"Engineering", tags:["Startup energy","For makers"], sal:"$150k–$210k", ago:"2h ago", url:"https://konghq.com/careers"},
  {id:3, title:"Senior Account Executive", co:"TELUS Digital", domain:"telusdigital.com", loc:"Remote (United States)", lvl:"Senior · 6–10 yrs", dept:"Sales", tags:["Startup energy","Introvert-friendly"], sal:"$165k–$210k", ago:"1h ago", url:"https://www.telusdigital.com/about/careers"},
  {id:4, title:"Regional Sales Manager — Enterprise", co:"Elliptic", domain:"elliptic.co", loc:"Remote — US", lvl:"Mid · 3–5 yrs", dept:"Sales", tags:["Sales","Built for leaders"], sal:"$130k–$250k", ago:"3h ago", url:"https://www.elliptic.co/careers"},
  {id:5, title:"Director, Revenue Accounting", co:"Kaseya", domain:"kaseya.com", loc:"United States — Remote", lvl:"Lead · 10+ yrs", dept:"Finance", tags:["Operations","Built for leaders"], sal:"$165k–$180k", ago:"2h ago", url:"https://www.kaseya.com/careers/"},
  {id:6, title:"Account Manager (Southwest Region)", co:"BridgeBio Pharma", domain:"bridgebio.com", loc:"Remote — USA", lvl:"Lead · 10+ yrs", dept:"Sales", tags:["Sales","Built for leaders"], sal:"$155k–$210k", ago:"1h ago", url:"https://bridgebio.com/careers/"},
  {id:7, title:"Senior Architect — Enterprise Solutions", co:"3Cloud", domain:"3cloudsolutions.com", loc:"Remote — US", lvl:"Senior · 6–10 yrs", dept:"Engineering", tags:["Startup energy","Introvert-friendly"], sal:"$145k–$205k", ago:"2h ago", url:"https://www.3cloudsolutions.com/careers/"},
  {id:8, title:"Senior Practice Director, Mainframe AMS", co:"Ensono", domain:"ensono.com", loc:"Remote — United States", lvl:"Lead · 10+ yrs", dept:"Engineering", tags:["Built for leaders"], sal:"$200k–$250k", ago:"2h ago", url:"https://www.ensono.com/company/careers/"},
  {id:9, title:"Lifecycle Marketing Manager", co:"Notion", domain:"notion.so", loc:"Remote — US", lvl:"Mid · 3–5 yrs", dept:"Marketing", tags:["Startup energy","For makers"], sal:"$140k–$175k", ago:"4h ago", url:"https://www.notion.so/careers"},
  {id:10, title:"Product Designer, Growth", co:"Figma", domain:"figma.com", loc:"Remote (United States)", lvl:"Senior · 6–10 yrs", dept:"Design", tags:["For makers"], sal:"$160k–$215k", ago:"4h ago", url:"https://www.figma.com/careers/"},
  {id:11, title:"Backend Engineer, Payments", co:"Stripe", domain:"stripe.com", loc:"Remote — US", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["For makers","Startup energy"], sal:"$185k–$240k", ago:"5h ago", url:"https://stripe.com/jobs/search"},
  {id:12, title:"Customer Success Lead", co:"Coinbase", domain:"coinbase.com", loc:"United States — Remote", lvl:"Senior · 6–10 yrs", dept:"Operations", tags:["Built for leaders"], sal:"$120k–$165k", ago:"5h ago", url:"https://www.coinbase.com/careers/positions"},
  {id:13, title:"Senior Full-Stack Engineer", co:"GitLab", domain:"gitlab.com", loc:"Remote — US", lvl:"Senior · 6–10 yrs", dept:"Engineering", tags:["Remote-first","For makers"], sal:"$150k–$205k", ago:"1h ago", url:"https://about.gitlab.com/jobs/"},
  {id:14, title:"Product Manager, Platform", co:"Vercel", domain:"vercel.com", loc:"Remote (United States)", lvl:"Senior · 6–10 yrs", dept:"Product", tags:["Startup energy","Remote-first"], sal:"$170k–$225k", ago:"3h ago", url:"https://vercel.com/careers"},
  {id:15, title:"Machine Learning Engineer", co:"Anthropic", domain:"anthropic.com", loc:"Remote — US", lvl:"Senior · 6–10 yrs", dept:"Data & AI", tags:["Data & AI","For makers"], sal:"$255k–$405k", ago:"2h ago", url:"https://www.anthropic.com/careers"},
  {id:16, title:"Frontend Engineer, Design Systems", co:"Linear", domain:"linear.app", loc:"Remote — Americas", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["Startup energy","For makers"], sal:"$150k–$200k", ago:"6h ago", url:"https://linear.app/careers"},
  {id:17, title:"Growth Marketing Lead", co:"Ramp", domain:"ramp.com", loc:"Remote — US", lvl:"Lead · 10+ yrs", dept:"Marketing", tags:["Startup energy","Built for leaders"], sal:"$160k–$210k", ago:"4h ago", url:"https://ramp.com/careers"},
  {id:18, title:"Data Analyst, Revenue", co:"Notion", domain:"notion.so", loc:"United States — Remote", lvl:"Mid · 3–5 yrs", dept:"Data & AI", tags:["Data & AI"], sal:"$110k–$150k", ago:"7h ago", url:"https://www.notion.so/careers"},
  {id:19, title:"Staff Product Designer", co:"Dropbox", domain:"dropbox.com", loc:"Remote — US", lvl:"Lead · 10+ yrs", dept:"Design", tags:["Remote-first","Built for leaders"], sal:"$180k–$240k", ago:"3h ago", url:"https://jobs.dropbox.com/all-jobs"},
  {id:20, title:"Customer Success Manager", co:"Vanta", domain:"vanta.com", loc:"Remote (United States)", lvl:"Mid · 3–5 yrs", dept:"Customer Support", tags:["Startup energy","Introvert-friendly"], sal:"$95k–$135k", ago:"5h ago", url:"https://www.vanta.com/company/careers"},
  {id:21, title:"Enterprise Account Executive", co:"Datadog", domain:"datadoghq.com", loc:"Remote — US", lvl:"Senior · 6–10 yrs", dept:"Sales", tags:["Sales","Built for leaders"], sal:"$140k–$280k OTE", ago:"2h ago", url:"https://careers.datadoghq.com/"},
  {id:22, title:"Senior Backend Engineer, Infrastructure", co:"Cloudflare", domain:"cloudflare.com", loc:"United States — Remote", lvl:"Senior · 6–10 yrs", dept:"Engineering", tags:["For makers","Remote-first"], sal:"$165k–$225k", ago:"8h ago", url:"https://www.cloudflare.com/careers/jobs/"},
  {id:23, title:"Content Marketing Manager", co:"PostHog", domain:"posthog.com", loc:"Remote — Worldwide", lvl:"Mid · 3–5 yrs", dept:"Marketing", tags:["Startup energy","Remote-first"], sal:"$120k–$160k", ago:"1h ago", url:"https://posthog.com/careers"},
  {id:24, title:"Product Manager, Payments", co:"Mercury", domain:"mercury.com", loc:"Remote — US", lvl:"Senior · 6–10 yrs", dept:"Product", tags:["Startup energy","Built for leaders"], sal:"$175k–$230k", ago:"6h ago", url:"https://mercury.com/jobs"},
  {id:25, title:"Senior UX Researcher", co:"Figma", domain:"figma.com", loc:"Remote (United States)", lvl:"Senior · 6–10 yrs", dept:"Design", tags:["For makers"], sal:"$155k–$205k", ago:"9h ago", url:"https://www.figma.com/careers/"},
  {id:26, title:"DevOps Engineer, Platform", co:"Replit", domain:"replit.com", loc:"Remote — US", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["Startup energy","Remote-first"], sal:"$150k–$200k", ago:"3h ago", url:"https://replit.com/careers"},
  {id:27, title:"Head of People Operations", co:"Brex", domain:"brex.com", loc:"Remote — US", lvl:"Lead · 10+ yrs", dept:"Operations", tags:["Built for leaders"], sal:"$185k–$240k", ago:"5h ago", url:"https://www.brex.com/careers"},
  {id:28, title:"Sales Development Representative", co:"Twilio", domain:"twilio.com", loc:"United States — Remote", lvl:"Mid · 3–5 yrs", dept:"Sales", tags:["Sales","Introvert-friendly"], sal:"$65k–$95k OTE", ago:"2h ago", url:"https://www.twilio.com/en-us/company/jobs"},
  {id:29, title:"Financial Analyst, FP&A", co:"Affirm", domain:"affirm.com", loc:"Remote — US", lvl:"Mid · 3–5 yrs", dept:"Finance", tags:["Remote-first"], sal:"$105k–$140k", ago:"7h ago", url:"https://www.affirm.com/careers"},
  {id:30, title:"Senior Data Scientist, Fraud", co:"Robinhood", domain:"robinhood.com", loc:"Remote (United States)", lvl:"Senior · 6–10 yrs", dept:"Data & AI", tags:["Data & AI","For makers"], sal:"$180k–$250k", ago:"4h ago", url:"https://careers.robinhood.com/"},
  {id:31, title:"Technical Writer, Developer Docs", co:"MongoDB", domain:"mongodb.com", loc:"Remote — US", lvl:"Mid · 3–5 yrs", dept:"Marketing", tags:["Remote-first","Introvert-friendly"], sal:"$110k–$150k", ago:"6h ago", url:"https://www.mongodb.com/company/careers"},
  {id:32, title:"Engineering Manager, Frontend", co:"Gusto", domain:"gusto.com", loc:"United States — Remote", lvl:"Lead · 10+ yrs", dept:"Engineering", tags:["Built for leaders"], sal:"$200k–$260k", ago:"3h ago", url:"https://gusto.com/about/careers"},
  {id:33, title:"Customer Support Specialist", co:"Discord", domain:"discord.com", loc:"Remote — US", lvl:"Mid · 3–5 yrs", dept:"Customer Support", tags:["Introvert-friendly","Remote-first"], sal:"$70k–$95k", ago:"8h ago", url:"https://discord.com/careers"},
  {id:34, title:"Senior Product Manager, AI", co:"Scale AI", domain:"scale.com", loc:"Remote (United States)", lvl:"Senior · 6–10 yrs", dept:"Product", tags:["Data & AI","Startup energy"], sal:"$190k–$250k", ago:"1h ago", url:"https://scale.com/careers"},
  {id:35, title:"Brand Designer", co:"Vercel", domain:"vercel.com", loc:"Remote — US", lvl:"Mid · 3–5 yrs", dept:"Design", tags:["For makers","Remote-first"], sal:"$130k–$175k", ago:"5h ago", url:"https://vercel.com/careers"},
  /* Switzerland — normal (on-site) + remote, relocation/visa-friendly employers */
  {id:36, title:"Senior Software Engineer", co:"On", domain:"on-running.com", loc:"Zürich, Switzerland", lvl:"Senior · 6–10 yrs", dept:"Engineering", tags:["Visa-friendly","Relocation"], sal:"CHF 120k–150k", ago:"2h ago", url:"https://jobs.lever.co/on", visa:true},
  {id:37, title:"Product Manager", co:"Scandit", domain:"scandit.com", loc:"Zürich, Switzerland", lvl:"Senior · 6–10 yrs", dept:"Product", tags:["Visa-friendly","English-speaking"], sal:"CHF 130k–160k", ago:"3h ago", url:"https://www.scandit.com/careers/", visa:true},
  {id:38, title:"Backend Engineer (Remote CH)", co:"Beekeeper", domain:"beekeeper.io", loc:"Remote — Switzerland", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["Remote-first","Visa-friendly"], sal:"CHF 110k–140k", ago:"4h ago", url:"https://www.beekeeper.io/careers/", visa:true},
  {id:39, title:"Data Scientist", co:"SOPHiA GENETICS", domain:"sophiagenetics.com", loc:"Lausanne, Switzerland", lvl:"Mid · 3–5 yrs", dept:"Data & AI", tags:["Visa-friendly","Relocation"], sal:"CHF 110k–135k", ago:"6h ago", url:"https://www.sophiagenetics.com/careers/", visa:true},
  {id:40, title:"Frontend Engineer", co:"Frontify", domain:"frontify.com", loc:"St. Gallen, Switzerland", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["Visa-friendly","English-speaking"], sal:"CHF 105k–130k", ago:"7h ago", url:"https://www.frontify.com/en/careers/", visa:true},
  {id:41, title:"Enterprise Account Executive (DACH)", co:"Nexthink", domain:"nexthink.com", loc:"Zürich, Switzerland", lvl:"Senior · 6–10 yrs", dept:"Sales", tags:["Visa-friendly"], sal:"CHF 140k–200k OTE", ago:"5h ago", url:"https://www.nexthink.com/careers", visa:true},
  /* Iceland — foreigner-friendly (English-speaking, relocation, visa sponsorship) */
  {id:42, title:"Software Engineer — EVE Online", co:"CCP Games", domain:"ccpgames.com", loc:"Reykjavík, Iceland", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["Visa-friendly","Relocation","English-speaking"], sal:"ISK 1.1M–1.5M/mo", ago:"3h ago", url:"https://www.ccpgames.com/careers", visa:true},
  {id:43, title:"IoT Platform Engineer", co:"Controlant", domain:"controlant.com", loc:"Reykjavík, Iceland", lvl:"Senior · 6–10 yrs", dept:"Engineering", tags:["Visa-friendly","Relocation"], sal:"ISK 1.0M–1.4M/mo", ago:"5h ago", url:"https://www.controlant.com/careers/", visa:true},
  {id:44, title:"Product Designer", co:"Sidekick Health", domain:"sidekickhealth.com", loc:"Reykjavík, Iceland", lvl:"Mid · 3–5 yrs", dept:"Design", tags:["Visa-friendly","English-speaking"], sal:"ISK 900k–1.2M/mo", ago:"6h ago", url:"https://www.sidekickhealth.com/careers/", visa:true},
  {id:45, title:"Machine Learning Engineer", co:"Lucinity", domain:"lucinity.com", loc:"Reykjavík, Iceland", lvl:"Senior · 6–10 yrs", dept:"Data & AI", tags:["Visa-friendly","Relocation","English-speaking"], sal:"ISK 1.1M–1.5M/mo", ago:"2h ago", url:"https://www.lucinity.com/careers", visa:true},
  {id:46, title:"Biotech Process Engineer", co:"Alvotech", domain:"alvotech.com", loc:"Reykjavík, Iceland", lvl:"Mid · 3–5 yrs", dept:"Operations", tags:["Visa-friendly","Relocation"], sal:"ISK 950k–1.3M/mo", ago:"8h ago", url:"https://www.alvotech.com/careers", visa:true},
  {id:47, title:"Full-Stack Engineer (Remote EU)", co:"Meniga", domain:"meniga.com", loc:"Remote — Iceland / Europe", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["Remote-first","Visa-friendly","English-speaking"], sal:"€65k–€90k", ago:"4h ago", url:"https://www.meniga.com/careers", visa:true},
  /* More Switzerland roles */
  {id:48, title:"Senior DevOps Engineer", co:"Sensirion", domain:"sensirion.com", loc:"Zürich, Switzerland", lvl:"Senior · 6–10 yrs", dept:"Engineering", tags:["Visa-friendly","Relocation"], sal:"CHF 115k–145k", ago:"3h ago", url:"https://www.sensirion.com/careers", visa:true},
  {id:49, title:"Machine Learning Engineer", co:"Unique", domain:"unique.ch", loc:"Zürich, Switzerland", lvl:"Senior · 6–10 yrs", dept:"Data & AI", tags:["Visa-friendly","English-speaking"], sal:"CHF 125k–160k", ago:"1h ago", url:"https://www.unique.ch/careers", visa:true},
  {id:50, title:"Product Marketing Manager", co:"Yokoy", domain:"yokoy.io", loc:"Zürich, Switzerland", lvl:"Mid · 3–5 yrs", dept:"Marketing", tags:["Visa-friendly","English-speaking"], sal:"CHF 100k–130k", ago:"5h ago", url:"https://www.yokoy.io/careers/", visa:true},
  {id:51, title:"Senior Backend Engineer", co:"Sonar", domain:"sonarsource.com", loc:"Geneva, Switzerland", lvl:"Senior · 6–10 yrs", dept:"Engineering", tags:["Visa-friendly","Relocation"], sal:"CHF 120k–155k", ago:"6h ago", url:"https://www.sonarsource.com/company/careers/", visa:true},
  {id:52, title:"Data Engineer", co:"Teralytics", domain:"teralytics.net", loc:"Zürich, Switzerland", lvl:"Mid · 3–5 yrs", dept:"Data & AI", tags:["Visa-friendly","English-speaking"], sal:"CHF 110k–140k", ago:"8h ago", url:"https://www.teralytics.net/careers", visa:true},
  {id:53, title:"Customer Success Manager (DACH)", co:"Sherpany", domain:"sherpany.com", loc:"Remote — Switzerland", lvl:"Mid · 3–5 yrs", dept:"Customer Support", tags:["Remote-first","Visa-friendly"], sal:"CHF 90k–120k", ago:"7h ago", url:"https://www.sherpany.com/en/careers/", visa:true},
  {id:54, title:"Security Engineer", co:"Proton", domain:"proton.me", loc:"Geneva, Switzerland", lvl:"Senior · 6–10 yrs", dept:"Engineering", tags:["Visa-friendly","Relocation","English-speaking"], sal:"CHF 130k–165k", ago:"2h ago", url:"https://proton.me/careers", visa:true},
  /* More Iceland roles */
  {id:55, title:"Senior Backend Engineer", co:"Tempo", domain:"tempo.io", loc:"Reykjavík, Iceland", lvl:"Senior · 6–10 yrs", dept:"Engineering", tags:["Visa-friendly","Relocation","English-speaking"], sal:"ISK 1.2M–1.6M/mo", ago:"3h ago", url:"https://www.tempo.io/careers", visa:true},
  {id:56, title:"Frontend Engineer", co:"Dohop", domain:"dohop.com", loc:"Reykjavík, Iceland", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["Visa-friendly","English-speaking"], sal:"ISK 950k–1.3M/mo", ago:"5h ago", url:"https://www.dohop.com/careers/", visa:true},
  {id:57, title:"Data Scientist — Climate", co:"Carbfix", domain:"carbfix.com", loc:"Reykjavík, Iceland", lvl:"Mid · 3–5 yrs", dept:"Data & AI", tags:["Visa-friendly","Relocation"], sal:"ISK 1.0M–1.4M/mo", ago:"9h ago", url:"https://www.carbfix.com/careers", visa:true},
  {id:58, title:"Game Server Engineer", co:"Solid Clouds", domain:"solidclouds.com", loc:"Reykjavík, Iceland", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["Visa-friendly","English-speaking"], sal:"ISK 950k–1.3M/mo", ago:"6h ago", url:"https://solidclouds.com/careers/", visa:true},
  {id:59, title:"Product Manager", co:"Indó", domain:"indo.is", loc:"Reykjavík, Iceland", lvl:"Senior · 6–10 yrs", dept:"Product", tags:["Visa-friendly","English-speaking"], sal:"ISK 1.1M–1.5M/mo", ago:"4h ago", url:"https://indo.is/", visa:true},
  {id:60, title:"DevOps Engineer (Remote Nordics)", co:"Avia", domain:"avia.is", loc:"Remote — Iceland / Nordics", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["Remote-first","Visa-friendly","English-speaking"], sal:"€60k–€85k", ago:"7h ago", url:"https://avia.is/", visa:true}
];

/* Logo URL via Clearbit; falls back to initials on error */
function logoURL(domain){ return "https://icons.duckduckgo.com/ip3/" + domain + ".ico"; }
function logoImg(co, domain){
  const initials = co.replace(/[^A-Za-z0-9 ]/g,'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return `<span class="jlogo" data-i="${initials}"><img src="${logoURL(domain)}" alt="${co}" loading="lazy" onerror="this.parentNode.textContent=this.parentNode.dataset.i"></span>`;
}

/* ---------- Mock auth (localStorage) ---------- */
const Auth = {
  key:"unlisted_user",
  savedKey:"unlisted_saved",
  autoKey:"unlisted_autoapply",
  get(){ try{return JSON.parse(localStorage.getItem(this.key))}catch(e){return null} },
  signup(name,email){ const u={name:name||email.split('@')[0],email,since:Date.now()}; localStorage.setItem(this.key,JSON.stringify(u)); return u; },
  login(email){ let u=this.get(); if(!u||u.email!==email){u={name:email.split('@')[0],email,since:Date.now()};} localStorage.setItem(this.key,JSON.stringify(u)); return u; },
  logout(){ localStorage.removeItem(this.key); },
  saved(){ try{return JSON.parse(localStorage.getItem(this.savedKey))||[]}catch(e){return []} },
  toggleSave(id){ let s=this.saved(); id=Number(id); s=s.includes(id)?s.filter(x=>x!==id):[...s,id]; localStorage.setItem(this.savedKey,JSON.stringify(s)); return s; },
  autoApply(){ return localStorage.getItem(this.autoKey)==="1"; },
  setAutoApply(v){ localStorage.setItem(this.autoKey, v?"1":"0"); }
};

/* Render nav auth state — call with element ids container '.navr' */
function renderNav(){
  /* one consistent menu on every page (left links never change) */
  const links = document.querySelector('.navlinks');
  if(links){
    const here = (location.pathname.split('/').pop()||'index.html');
    const items = [
      ['jobs.html','Browse jobs'],
      ['index.html#auto','Auto-Apply'],
      ['index.html#pricing','Pricing']
    ];
    links.innerHTML = items.map(([href,label])=>{
      const active = href.split('#')[0]===here ? ' class="active"' : '';
      return `<a href="${href}"${active}>${label}</a>`;
    }).join('');
  }
  const navr = document.querySelector('.navr'); if(!navr) return;
  const u = Auth.get();
  if(u){
    navr.innerHTML = `<a href="dashboard.html" class="btn btn-out btn-sm">Dashboard</a>
      <a href="#" id="logoutBtn" class="btn btn-ink btn-sm">Log out</a>`;
    const lb=document.getElementById('logoutBtn');
    if(lb) lb.addEventListener('click',e=>{e.preventDefault();Auth.logout();location.href='index.html';});
  } else {
    navr.innerHTML = `<a href="login.html" class="btn btn-out btn-sm">Sign in</a>
      <a href="signup.html" class="btn btn-accent btn-sm">Get started</a>`;
  }
}
document.addEventListener('DOMContentLoaded', renderNav);

/* ---------- Google Sign-In ---------- */
function googleSvg(){
  return '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style="flex:0 0 18px">'
    +'<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>'
    +'<path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>'
    +'<path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.2 34.7 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/>'
    +'<path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C41.2 36.8 43.5 31 43.5 24c0-1.2-.1-2.4-.4-3.5z"/></svg>';
}
function decodeJwt(t){
  try{ return JSON.parse(decodeURIComponent(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''))); }
  catch(e){ return null; }
}
window.handleGoogleCredential = function(resp){
  const p = decodeJwt(resp && resp.credential) || {};
  Auth.signup(p.name || 'Google User', p.email || 'user@gmail.com');
  if(window.gtag) gtag('event','login',{method:'Google'});
  location.href = 'dashboard.html';
};
/* Render the Google button into #gbtn — real if a Client ID is set, otherwise a demo button */
function renderGoogleButton(containerId){
  const el = document.getElementById(containerId || 'gbtn'); if(!el) return;
  if(CONFIG.GOOGLE_CLIENT_ID && window.google && window.google.accounts && google.accounts.id){
    google.accounts.id.initialize({ client_id: CONFIG.GOOGLE_CLIENT_ID, callback: window.handleGoogleCredential });
    google.accounts.id.renderButton(el, { theme:'outline', size:'large', width:360, text:'continue_with', shape:'pill' });
    return;
  }
  el.innerHTML = '<button type="button" class="btn btn-out btn-block gbtn-fallback">'+googleSvg()+' Continue with Google</button>';
  el.querySelector('button').addEventListener('click', async function(){
    const sb = await getSupabase();
    if(sb){
      const { error } = await sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: location.origin + '/dashboard.html' } });
      if(error) showToast('Google sign-in needs enabling in Supabase first');
      return;
    }
    Auth.signup('Alex Morgan','alex.morgan@gmail.com');
    if(window.gtag) gtag('event','login',{method:'Google (demo)'});
    location.href = 'dashboard.html';
  });
}

/* ---------- Extended store: applications, alerts, profile, plan ---------- */
Object.assign(Auth, {
  appsKey:"unlisted_apps", alertsKey:"unlisted_alerts", profileKey:"unlisted_profile", planKey:"unlisted_plan",
  applications(){ try{return JSON.parse(localStorage.getItem(this.appsKey))||{}}catch(e){return {}} },
  setApplication(id,status){ const a=this.applications(); a[Number(id)]=status; localStorage.setItem(this.appsKey,JSON.stringify(a)); return a; },
  removeApplication(id){ const a=this.applications(); delete a[Number(id)]; localStorage.setItem(this.appsKey,JSON.stringify(a)); return a; },
  alerts(){ try{return JSON.parse(localStorage.getItem(this.alertsKey))||[]}catch(e){return []} },
  addAlert(a){ const l=this.alerts(); l.push(a); localStorage.setItem(this.alertsKey,JSON.stringify(l)); return l; },
  removeAlert(i){ const l=this.alerts(); l.splice(i,1); localStorage.setItem(this.alertsKey,JSON.stringify(l)); return l; },
  profile(){ try{return JSON.parse(localStorage.getItem(this.profileKey))||{}}catch(e){return {}} },
  setProfile(p){ localStorage.setItem(this.profileKey,JSON.stringify(p)); return p; },
  plan(){ return localStorage.getItem(this.planKey)||""; },
  setPlan(p){ localStorage.setItem(this.planKey,p||""); },
  /* persist a snapshot of any job the user saves/applies to, so the CRM can show it */
  jobsKey:"unlisted_jobsdata",
  jobData(){ try{return JSON.parse(localStorage.getItem(this.jobsKey))||{}}catch(e){return {}} },
  rememberJob(j){ if(!j||j.id==null) return; const m=this.jobData(); m[Number(j.id)]={id:Number(j.id),title:j.title,co:j.co,loc:j.loc||'',sal:j.sal||'',salEst:!!j.salEst,url:j.url||'',logo:j.logo||'',initials:j.initials||((j.co||'?').replace(/[^A-Za-z0-9 ]/g,'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()),dept:j.dept||'',type:j.type||'',ago:j.ago||''}; localStorage.setItem(this.jobsKey,JSON.stringify(m)); },
  getJob(id){ const m=this.jobData(); return m[Number(id)] || (typeof JOBS!=='undefined' ? JOBS.find(x=>x.id===Number(id)) : null) || null; },
  /* ----- Auto-Apply engine stores ----- */
  fwdKey:"unlisted_forwarded", autoQKey:"unlisted_autoqueue", autoLogKey:"unlisted_autolog",
  forwarded(){ try{return JSON.parse(localStorage.getItem(this.fwdKey))||[]}catch(e){return []} },
  addForwarded(j){ if(!j||j.id==null) return; const l=this.forwarded(); if(l.some(x=>String(x.id)===String(j.id))) return; l.unshift({id:Number(j.id),title:j.title,co:j.co,url:j.url||'',loc:j.loc||'',sal:j.sal||'',when:Date.now()}); localStorage.setItem(this.fwdKey,JSON.stringify(l.slice(0,100))); },
  removeForwarded(id){ const l=this.forwarded().filter(x=>String(x.id)!==String(id)); localStorage.setItem(this.fwdKey,JSON.stringify(l)); return l; },
  autoQueue(){ try{return JSON.parse(localStorage.getItem(this.autoQKey))||[]}catch(e){return []} },
  addAutoQueue(j){ if(!j||j.id==null) return; const l=this.autoQueue(); if(l.some(x=>String(x.id)===String(j.id))) return; l.unshift({id:Number(j.id),title:j.title,co:j.co,url:j.url||''}); localStorage.setItem(this.autoQKey,JSON.stringify(l.slice(0,100))); },
  removeAutoQueue(id){ const l=this.autoQueue().filter(x=>String(x.id)!==String(id)); localStorage.setItem(this.autoQKey,JSON.stringify(l)); return l; },
  autoLog(){ try{return JSON.parse(localStorage.getItem(this.autoLogKey))||[]}catch(e){return []} },
  pushAutoLog(e){ const l=this.autoLog(); l.unshift(Object.assign({when:Date.now()},e)); localStorage.setItem(this.autoLogKey,JSON.stringify(l.slice(0,60))); },
  autoSeenKey:"unlisted_autoseen",
  autoSeen(){ try{return JSON.parse(localStorage.getItem(this.autoSeenKey))||[]}catch(e){return []} },
  markAutoSeen(ids){ const s=new Set(this.autoSeen()); ids.forEach(i=>s.add(Number(i))); localStorage.setItem(this.autoSeenKey,JSON.stringify([...s].slice(-500))); }
});
/* expose Auth on window so the `window.Auth && …` guards (isPaid, isAutoApply, paywall) actually resolve */
window.Auth = Auth;

const APP_STATUSES = ["Saved","Applied","Responded","Interviewing","Offer","Rejected"];

/* ---------- Salary: show a real figure, or a sensible US-remote estimate ---------- */
function estSalary(o){
  if(o && o.sal && String(o.sal).trim()) return {text:String(o.sal).trim(), est:false};
  const t=((o&&o.title)||'').toLowerCase();
  const cat=(((o&&o.dept)||'')+' '+((o&&(o.tags||[]).join(' '))||'')+' '+t).toLowerCase();
  let lvl=1;
  if(/intern|internship/.test(t)) lvl=0.5;
  else if(/(junior|jr\b|entry|associate|assistant)/.test(t)) lvl=0.72;
  else if(/(principal|staff|lead|head of|director|vp|vice president|chief|architect)/.test(t)) lvl=1.55;
  else if(/(senior|sr\b|manager)/.test(t)) lvl=1.25;
  let base=92;
  if(/engineer|developer|software|devops|sre|backend|frontend|full.?stack|programmer|data scien|machine learning|\bml\b|\bai\b/.test(cat)) base=145;
  else if(/data|analyst|analytics/.test(cat)) base=118;
  else if(/design|ux|ui/.test(cat)) base=120;
  else if(/product manager|product owner|\bproduct\b/.test(cat)) base=138;
  else if(/sales|account exec|business develop|revenue/.test(cat)) base=112;
  else if(/marketing|growth|seo|content|social/.test(cat)) base=96;
  else if(/finance|account|controller|fp&a|payroll/.test(cat)) base=110;
  else if(/customer|support|success/.test(cat)) base=72;
  else if(/operations|\bops\b|project manager|program manager|logistics/.test(cat)) base=105;
  else if(/writer|writing|editor|copy/.test(cat)) base=72;
  else if(/recruit|\bhr\b|people|talent/.test(cat)) base=92;
  const mid=Math.round(base*lvl);
  const lo=Math.round(mid*0.85/5)*5, hi=Math.round(mid*1.2/5)*5;
  return {text:'~$'+lo+'k–$'+hi+'k', est:true};
}
window.estSalary = estSalary;

/* ---------- Job detail content ---------- */
function jobDescription(j){
  return {
    summary:`${j.co} is hiring a ${j.title}. This ${j.lvl} role sits on the ${j.dept} team and is fully remote (${j.loc}). It was surfaced straight from ${j.co}'s hiring system — often before it reaches LinkedIn or Indeed.`,
    resp:["Own key initiatives end to end and ship measurable outcomes","Partner cross-functionally with product, design and leadership","Turn ambiguous problems into clear, prioritized plans","Raise the bar on quality and mentor those around you"],
    req:[`${j.lvl} of relevant experience`,"Strong written and verbal communication","A track record of high-impact, shipped work","Comfort in a fast-moving, remote-first US team"]
  };
}

/* ---------- Job detail modal (works on any page) ---------- */
function openJobModal(id){
  const j = JOBS.find(x=>x.id===Number(id)); if(!j) return;
  const d = jobDescription(j);
  let ov = document.getElementById('jobModal');
  if(!ov){ ov=document.createElement('div'); ov.id='jobModal'; ov.className='modal'; document.body.appendChild(ov); }
  const apps = Auth.applications(); const applied = apps[j.id]; const saved = Auth.saved().includes(j.id);
  ov.innerHTML = `<div class="modal-card">
    <button class="modal-x" aria-label="Close">×</button>
    <div class="modal-head">${logoImg(j.co,j.domain)}<div><div class="modal-title">${j.title}</div><div class="modal-meta">${j.co} · ${j.loc} · ${j.lvl} · ${j.dept}</div></div></div>
    <div class="modal-sal">${j.sal} <span class="jago">· ${j.ago}</span></div>
    <div class="jtags" style="margin:12px 0">${j.tags.map(t=>`<span class="jchip">${t}</span>`).join('')}</div>
    <p class="modal-p">${d.summary}</p>
    <h4 class="modal-h">What you'll do</h4><ul class="modal-ul">${d.resp.map(r=>`<li>${r}</li>`).join('')}</ul>
    <h4 class="modal-h">What we're looking for</h4><ul class="modal-ul">${d.req.map(r=>`<li>${r}</li>`).join('')}</ul>
    <div class="modal-actions">
      <button class="btn btn-out" id="m-save">${saved?'✓ Saved':'Save role'}</button>
      <button class="btn btn-ink" id="m-cover">Generate cover letter</button>
      <button class="btn btn-accent" id="m-apply">${applied?('✓ '+applied):'Apply now'}</button>
    </div>
    <p class="modal-note" id="m-note">${applied?('Status: '+applied+' — manage it in your dashboard tracker.'):'Applying records this role in your dashboard tracker.'}</p>
  </div>`;
  ov.style.display='flex';
  const close=()=>{ ov.style.display='none'; };
  ov.querySelector('.modal-x').onclick=close;
  ov.onclick=e=>{ if(e.target===ov) close(); };
  ov.querySelector('#m-save').onclick=function(){ const s=Auth.toggleSave(j.id); this.textContent=s.includes(j.id)?'✓ Saved':'Save role'; };
  ov.querySelector('#m-cover').onclick=function(){ location.href='dashboard.html#cover'; };
  ov.querySelector('#m-apply').onclick=function(){
    if(Auth.rememberJob) Auth.rememberJob(j);
    if(!isPaid()){ close(); showPaywall(j.title); return; }
    Auth.setApplication(j.id,'Applied'); if(!Auth.saved().includes(j.id)) Auth.toggleSave(j.id);
    if(window.gtag) gtag('event','apply',{job:j.title});
    /* Real apply: open the company's own application page in a new tab. */
    if(j.url && j.url!=='signup.html' && j.url!=='jobs.html'){ window.open(j.url,'_blank','noopener'); }
    this.textContent='✓ Applied';
    document.getElementById('m-note').textContent='Status: Applied — we opened '+j.co+"'s application page in a new tab. Track it in your dashboard.";
  };
}
window.openJobModal = openJobModal;

/* Wire any .joblist so clicking a row (not its buttons) opens the modal */
function wireJobRows(listEl){
  if(!listEl) return;
  listEl.addEventListener('click', function(e){
    if(e.target.closest('.jsave')) return;     // save handled separately
    const apply = e.target.closest('.japply');
    const row = e.target.closest('.jrow'); if(!row) return;
    const id = row.dataset.id; if(!id) return;
    e.preventDefault();
    openJobModal(id);
  });
}
window.wireJobRows = wireJobRows;

/* ---------- Apply paywall (pricing popup on apply, like the best in class) ---------- */
function isPaid(){ const p = (window.Auth && Auth.plan) ? Auth.plan() : ''; return p==='Monthly'||p==='Annual'||p==='Auto-Apply'; }
window.isPaid = isPaid;
/* Only the Auto-Apply tier gets hands-off applying. Other paid tiers filter+forward matches. */
function isAutoApply(){ return ((window.Auth && Auth.plan) ? Auth.plan() : '')==='Auto-Apply'; }
window.isAutoApply = isAutoApply;

/* Build the user's target string from prefs + profile + saved searches. */
function autoApplyTarget(){
  const parts=[];
  try{ const p=JSON.parse(localStorage.getItem('unlisted_prefs')||'{}'); if(p.role)parts.push(p.role); if(p.dept)parts.push(p.dept); if(p.lvl)parts.push(p.lvl); }catch(e){}
  const prof=(window.Auth&&Auth.profile)?Auth.profile():{}; if(prof.headline)parts.push(prof.headline); if(prof.skills)parts.push(prof.skills);
  ((window.Auth&&Auth.alerts)?Auth.alerts():[]).forEach(a=>{ if(a.q)parts.push(a.q); if(a.dept)parts.push(a.dept); });
  return parts.join(' ').trim();
}
window.autoApplyTarget = autoApplyTarget;

/* The engine. Auto-Apply tier (toggle on) → auto-track + queue the real posting.
   Monthly/Annual → filter matches and forward them to the dashboard inbox.
   `list` is an optional live board list; otherwise we match against the sample feed. */
function runAutoApplySweep(list, opts){
  opts=opts||{};
  if(!(window.Auth&&Auth.get&&Auth.get()) || !isPaid()) return {applied:0,forwarded:0};
  const target=autoApplyTarget();
  if(!target || typeof matchTokens!=='function') return {applied:0,forwarded:0,reason:'no-target'};
  const auto = isAutoApply() && Auth.autoApply();
  const toks=new Set(matchTokens(target));
  const pool=(Array.isArray(list)&&list.length) ? list.slice() : (typeof matchJobs==='function' ? matchJobs(target,14).map(m=>m.job) : []);
  const scored=pool.map(j=>{ const hay=matchTokens((j.title||'')+' '+(j.dept||'')+' '+((j.tags||[]).join(' '))); const hits=hay.filter(w=>toks.has(w)).length; return {j,hits}; })
    .filter(x=>x.hits>0).sort((a,b)=>b.hits-a.hits);
  const seen=new Set(Auth.autoSeen()); const done=Auth.applications();
  const fresh=scored.map(x=>x.j).filter(j=>j&&j.id!=null && !seen.has(Number(j.id)) && !done[Number(j.id)]);
  const take=fresh.slice(0, opts.max||8);
  if(!take.length) return {applied:0,forwarded:0};
  let applied=0, forwarded=0;
  take.forEach(j=>{ Auth.rememberJob(j);
    if(auto){ Auth.setApplication(j.id,'Applied'); if(!Auth.saved().includes(Number(j.id))) Auth.toggleSave(j.id); if(j.url&&j.url!=='signup.html'&&j.url!=='jobs.html') Auth.addAutoQueue(j); Auth.pushAutoLog({id:j.id,title:j.title,co:j.co}); applied++; }
    else { Auth.addForwarded(j); forwarded++; }
  });
  Auth.markAutoSeen(take.map(j=>j.id));
  if(applied&&window.gtag) gtag('event','auto_apply_run',{count:applied});
  if(forwarded&&window.gtag) gtag('event','matches_forwarded',{count:forwarded});
  return {applied,forwarded};
}
window.runAutoApplySweep = runAutoApplySweep;
const PAYWALL_PAY = {
  'Monthly':'https://buy.stripe.com/5kQ7sD3ZR5PP99b5Ua63K03',
  'Annual':'https://buy.stripe.com/fZu7sDfIzba9adfeqG63K04',
  'Auto-Apply':'https://buy.stripe.com/5kQ9AL8g7ced713beu63K05'
};
function injectPaywallCSS(){
  if(document.getElementById('pw-style')) return;
  const s=document.createElement('style'); s.id='pw-style';
  s.textContent=`
  .pw-card{max-width:900px;width:calc(100% - 32px);text-align:center;padding:30px 28px 22px}
  .pw-h{font-family:'Instrument Serif',Georgia,serif;font-size:clamp(26px,3.4vw,38px);line-height:1.05;margin:0 0 8px;color:var(--ink)}
  .pw-h em{font-style:italic;color:var(--accent)}
  .pw-sub{color:var(--muted);max-width:54ch;margin:0 auto 22px;font-size:15px}
  .pw-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;text-align:left}
  .pw-plan{border:1px solid #e6e8ec;border-radius:16px;padding:18px 16px;display:flex;flex-direction:column;gap:6px;position:relative;background:#fff}
  .pw-plan.pop{border-color:var(--ink);box-shadow:0 12px 34px rgba(15,17,21,.12)}
  .pw-tag{position:absolute;top:-11px;left:16px;background:var(--ink);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;letter-spacing:.02em}
  .pw-tag.alt{background:#fff;color:var(--ink);border:1px solid #e6e8ec}
  .pw-name{font-weight:800;font-size:16px;color:var(--ink)}
  .pw-desc{color:var(--muted);font-size:13px;min-height:34px}
  .pw-amt{font-family:'Instrument Serif',Georgia,serif;font-size:30px;color:var(--ink);margin:2px 0 10px}
  .pw-amt span{font-family:'Inter Tight',Inter,sans-serif;font-size:13px;color:var(--faint);font-weight:600}
  .pw-plan .btn{margin-top:auto}
  .pw-foot{color:var(--faint);font-size:13px;margin:18px 0 0}
  @media(max-width:680px){.pw-plans{grid-template-columns:1fr}.pw-plan.pop{order:-1}}
  `;
  document.head.appendChild(s);
}
function showPaywall(jobTitle){
  injectPaywallCSS();
  if(window.gtag) gtag('event','paywall_view',{job:jobTitle||''});
  let ov=document.getElementById('paywall');
  if(!ov){ ov=document.createElement('div'); ov.id='paywall'; ov.className='modal'; document.body.appendChild(ov); }
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const sub = jobTitle ? `Apply for <b>${esc(jobTitle)}</b> and thousands of other live US roles — before they hit the public boards.` : 'Apply to live US roles before they hit the public boards.';
  ov.innerHTML = `<div class="modal-card pw-card">
    <button class="modal-x" aria-label="Close">×</button>
    <h3 class="pw-h">Jobs you won't find on <em>LinkedIn or Indeed.</em></h3>
    <p class="pw-sub">${sub}</p>
    <div class="pw-plans">
      <div class="pw-plan">
        <div class="pw-name">Monthly</div>
        <div class="pw-desc">Full US job feed, alerts, tracker &amp; AI tools.</div>
        <div class="pw-amt">$24.99<span> /mo</span></div>
        <button class="btn btn-out btn-block" data-pw="Monthly">Continue — $24.99/mo</button>
      </div>
      <div class="pw-plan pop">
        <span class="pw-tag">Most popular</span>
        <div class="pw-name">Auto-Apply with AI</div>
        <div class="pw-desc">The AI matches, tailors and applies for you.</div>
        <div class="pw-amt">$62<span> /mo</span></div>
        <button class="btn btn-accent btn-block" data-pw="Auto-Apply">Let AI apply — $62/mo</button>
      </div>
      <div class="pw-plan">
        <span class="pw-tag alt">Best value</span>
        <div class="pw-name">Annual</div>
        <div class="pw-desc">Everything in Monthly, one yearly charge.</div>
        <div class="pw-amt">$109<span> /yr</span></div>
        <button class="btn btn-out btn-block" data-pw="Annual">Go annual — $109/yr</button>
      </div>
    </div>
    <p class="pw-foot">Cancel anytime · No hidden fees · Secured by Stripe</p>
  </div>`;
  ov.style.display='flex';
  const close=()=>{ ov.style.display='none'; };
  ov.querySelector('.modal-x').onclick=close;
  ov.onclick=e=>{ if(e.target===ov) close(); };
  ov.querySelectorAll('[data-pw]').forEach(b=>b.addEventListener('click',function(){
    const plan=this.getAttribute('data-pw'); if(window.Auth&&Auth.setPlan) Auth.setPlan(plan);
    if(window.gtag) gtag('event','begin_checkout',{plan, from:'paywall'});
    location.href = PAYWALL_PAY[plan] || 'signup.html';
  }));
}
window.showPaywall = showPaywall;
/* gate an apply click: paid users go to the real posting, everyone else sees the paywall */
function tryApply(job){
  if(isPaid()){ if(job && job.url && job.url!=='signup.html'){ window.open(job.url,'_blank','noopener'); } return true; }
  showPaywall(job && job.title); return false;
}
window.tryApply = tryApply;

/* ---------- Toast ---------- */
function showToast(msg){
  let t=document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  clearTimeout(window.__toastT); window.__toastT=setTimeout(()=>t.classList.remove('show'),2600);
}
window.showToast = showToast;

/* ---------- LinkedIn / profile → role matching ---------- */
const MATCH_STOP = new Set("a an the and or of to in for with on at as is are be we our you your i my me role roles job jobs work working experience year years yr yrs senior lead mid staff principal remote united states us usa full time fulltime team teams company".split(' '));
function matchTokens(s){ return ((s||'').toLowerCase().match(/[a-z0-9+#.]+/g)||[]).filter(w=>w.length>2 && !MATCH_STOP.has(w)); }
function jobKeywords(j){ return [...new Set([...matchTokens(j.title), ...matchTokens(j.dept), ...j.tags.flatMap(matchTokens)])]; }
function matchJobs(text, limit){
  limit = limit || 6;
  const userSet = new Set(matchTokens(text));
  const scored = JOBS.map(j=>{
    const kws = jobKeywords(j);
    const hits = kws.filter(k=>userSet.has(k));
    const ratio = kws.length ? hits.length/kws.length : 0;
    const pct = Math.min(98, Math.round(46 + ratio*46 + hits.length*4));
    return { job:j, score:hits.length, pct, reasons:hits.slice(0,4) };
  }).filter(x=>x.score>0).sort((a,b)=> b.pct-a.pct || b.score-a.score);
  if(!scored.length){ return JOBS.slice(0,limit).map(j=>({job:j,score:0,pct:64,reasons:[]})); }
  return scored.slice(0,limit);
}
window.matchJobs = matchJobs;
/* matchJobs / matchTokens / jobKeywords are kept — the Auto-Apply engine (runAutoApplySweep)
   relies on them to rank fresh roles against the user's profile. The standalone "Match me"
   page + its initMatcher/renderMatches UI were removed in favor of the converting signup flow. */

/* ---------- Realistic cover letter ---------- */
function buildCoverLetter(o){
  o=o||{};
  const name=(o.name||'').trim()||'Your Name';
  const role=(o.role||'').trim()||'the role';
  const company=(o.company||'').trim()||'your company';
  const hl=(o.highlight||o.skills||'').trim();
  const hook = hl
    ? `${hl.charAt(0).toUpperCase()+hl.slice(1)} — and that's exactly the kind of impact I want to bring to ${company}.`
    : `I do my best work turning ambiguous problems into shipped, measurable results — and that's exactly what I want to bring to ${company}.`;
  return [
    `Dear ${company} Hiring Team,`,
    ``,
    hook,
    ``,
    `I'm applying for the ${role} role because it's a rare match for how I actually work: close to the customer, biased toward action, and judged by outcomes rather than activity. The problems your team is taking on are the kind I'd be genuinely excited to wake up to.`,
    ``,
    `Here's what you can count on from me. I move fast without dropping quality. I communicate clearly, so nobody is left guessing. And I take ownership end to end — from the messy first draft to the shipped result and the number it moved. I'd hold that same standard at ${company} from day one.`,
    ``,
    `I'd love to show you what that looks like in practice. My resume is attached, and I'm happy to walk through specifics whenever suits you.`,
    ``,
    `Thank you for your time and consideration,`,
    name
  ].join("\n");
}
window.buildCoverLetter = buildCoverLetter;

/* ---------- CV / resume upload → text (for the matcher) ---------- */
function loadScriptOnce(src){ return new Promise((res,rej)=>{ if([...document.scripts].some(s=>s.src===src)) return res(); const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
async function extractFileText(file){
  const n=(file.name||'').toLowerCase();
  if(n.endsWith('.txt')) return await file.text();
  if(n.endsWith('.pdf')){
    await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
    let t=''; for(let i=1;i<=pdf.numPages;i++){ const c=await (await pdf.getPage(i)).getTextContent(); t+=c.items.map(x=>x.str).join(' ')+'\n'; }
    return t;
  }
  if(n.endsWith('.docx')){
    await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
    return (await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;
  }
  return await file.text();
}
function initCvUpload(fileId, textareaId, runBtnId){
  const f=document.getElementById(fileId), ta=document.getElementById(textareaId), btn=document.getElementById(runBtnId);
  if(!f||!ta) return;
  f.addEventListener('change', async ()=>{
    const file=f.files&&f.files[0]; if(!file) return;
    showToast('Reading '+file.name+'…');
    try{ const txt=await extractFileText(file); ta.value=(txt||'').replace(/\s+/g,' ').trim().slice(0,4000); if(window.gtag) gtag('event','cv_upload'); showToast('CV loaded — finding your matches'); if(btn) btn.click(); }
    catch(e){ showToast('Could not read that file — paste the text instead'); }
  });
}
window.initCvUpload = initCvUpload;

/* ---------- Real job search (live US remote roles via Remotive API) ---------- */
async function fetchRealJobs(query, onProgress, maxCompanies){
  /* Pull live roles straight from company hiring systems (Greenhouse + Ashby) → DIRECT apply links, no aggregator middle-man.
     onProgress(partialList) fires as each company resolves, so the board fills in progressively instead of waiting for all of them. */
  const initials=co=>(co||'?').replace(/[^A-Za-z0-9 ]/g,'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const tsOf=d=>{ if(!d) return 0; if(typeof d==='number') return d>1e12?d:d*1000; const t=Date.parse(d); return isNaN(t)?0:t; };
  const ago=d=>{ const t=tsOf(d); if(!t) return 'recently'; const days=Math.floor((Date.now()-t)/86400000); return days<=0?'today':days===1?'1d ago':days<30?days+'d ago':Math.floor(days/30)+'mo ago'; };
  const clean=h=>String(h||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
  const hashId=s=>{ let h=0; s=String(s||''); for(let i=0;i<s.length;i++){ h=(h*31 + s.charCodeAt(i))|0; } return Math.abs(h)||1; };
  const catOf=t=>{ t=(t||'').toLowerCase(); if(/engineer|developer|software|devops|\bsre\b|backend|frontend|full.?stack|data scien|machine learning|security/.test(t))return'Engineering'; if(/data|analyst|analytics/.test(t))return'Data & AI'; if(/design|\bux\b|\bui\b/.test(t))return'Design'; if(/product manager|product owner|\bproduct\b/.test(t))return'Product'; if(/sales|account exec|business develop|revenue/.test(t))return'Sales'; if(/marketing|growth|seo|content|brand/.test(t))return'Marketing'; if(/finance|account|controller|fp&a/.test(t))return'Finance'; if(/support|success|customer/.test(t))return'Customer Support'; if(/recruit|\bpeople\b|\bhr\b|talent/.test(t))return'People'; if(/operations|\bops\b|program manager|project manager/.test(t))return'Operations'; return''; };
  const mk=o=>{ const s=estSalary({sal:o.sal,title:o.title,dept:o.dept,tags:o.tags});
    const loc=o.loc||'Remote'; const isRemote=!!o.remote||remoteRx.test(loc);
    const regions=regionsOf(loc,isRemote);
    const visa = VISARX.test((o.title||'')+' '+(o.html||'')+' '+loc) || regions.includes('is');
    const tags=(o.tags||[]).filter(Boolean);
    if(visa && !tags.includes('Visa-friendly')) tags.unshift('Visa-friendly');
    return { id:hashId(o.url||((o.title||'')+(o.co||''))), title:o.title, co:o.co, logo:o.logo||'', initials:initials(o.co),
    loc:loc, dept:o.dept||'', type:o.type||'', tags:tags.slice(0,4),
    regions:regions, remote:isRemote, visa:visa,
    sal:s.text, salEst:s.est, url:o.url, ago:ago(o.date), _ts:tsOf(o.date),
    src:o.src||'', token:o.token||'', gid:o.gid||'',
    desc:clean(o.html).slice(0,300), descHtml:String(o.html||'').slice(0,6000) }; };
  const safe=p=>p.then(x=>x).catch(()=>[]);
  /* Region model — US (remote), Switzerland (on-site + remote), Iceland (foreigner-friendly). */
  const remoteRx=/remote|anywhere|distributed|hybrid|work from home|\bwfh\b/i;
  const RGX={
    us:/united states|u\.s\.a|u\.s\b|\busa\b|americas|north america|remote[ ,-]*us/i,
    ch:/switzerland|schweiz|suisse|svizzera|z[üu]rich|geneva|gen[eè]ve|basel|bern|lausanne|\bzug\b|lugano|winterthur/i,
    is:/iceland|[íi]sland|reykjav[ií]k|k[óo]pavogur|akureyri|hafnarfj/i
  };
  function regionsOf(loc,isRemote){ loc=loc||''; const r=[]; if(RGX.us.test(loc))r.push('us'); if(RGX.ch.test(loc))r.push('ch'); if(RGX.is.test(loc))r.push('is'); if(isRemote||remoteRx.test(loc))r.push('remote'); return r; }
  const VISARX=/visa sponsor|sponsorship|relocation|relocate|work permit|english[- ]speaking|international candidate|willing to sponsor|work visa/i;

  const NAMES={stripe:'Stripe',coinbase:'Coinbase',brex:'Brex',gitlab:'GitLab',dropbox:'Dropbox',robinhood:'Robinhood',databricks:'Databricks',cloudflare:'Cloudflare',discord:'Discord',figma:'Figma',gusto:'Gusto',instacart:'Instacart',airbnb:'Airbnb',twitch:'Twitch',affirm:'Affirm',samsara:'Samsara',mongodb:'MongoDB',datadog:'Datadog',twilio:'Twilio',asana:'Asana',anthropic:'Anthropic',scaleai:'Scale AI',flexport:'Flexport',lyft:'Lyft',pinterest:'Pinterest',sofi:'SoFi',elastic:'Elastic',okta:'Okta',vercel:'Vercel',newrelic:'New Relic',faire:'Faire',ramp:'Ramp',vanta:'Vanta',replit:'Replit',linear:'Linear',posthog:'PostHog',sumologic:'Sumo Logic',cockroachlabs:'Cockroach Labs',sofi:'SoFi',
    on:'On',scandit:'Scandit',beekeeper:'Beekeeper',frontify:'Frontify',ledgy:'Ledgy',climeworks:'Climeworks',nexthink:'Nexthink',sophiagenetics:'SOPHiA GENETICS',wefox:'wefox',sonarsource:'Sonar',planted:'Planted',yokoy:'Yokoy',proton:'Proton',
    ccpgames:'CCP Games',controlant:'Controlant',sidekickhealth:'Sidekick Health',kerecis:'Kerecis',meniga:'Meniga',noxmedical:'Nox Medical',lucinity:'Lucinity',alvotech:'Alvotech',taktikal:'Taktikal'};
  const nm=t=>NAMES[t]||(t.charAt(0).toUpperCase()+t.slice(1));
  const DOMAINS={stripe:'stripe.com',coinbase:'coinbase.com',brex:'brex.com',gitlab:'gitlab.com',dropbox:'dropbox.com',robinhood:'robinhood.com',databricks:'databricks.com',cloudflare:'cloudflare.com',discord:'discord.com',figma:'figma.com',gusto:'gusto.com',instacart:'instacart.com',airbnb:'airbnb.com',twitch:'twitch.tv',affirm:'affirm.com',samsara:'samsara.com',mongodb:'mongodb.com',datadog:'datadoghq.com',twilio:'twilio.com',asana:'asana.com',anthropic:'anthropic.com',scaleai:'scale.com',flexport:'flexport.com',lyft:'lyft.com',pinterest:'pinterest.com',sofi:'sofi.com',elastic:'elastic.co',okta:'okta.com',vercel:'vercel.com',newrelic:'newrelic.com',faire:'faire.com',ramp:'ramp.com',vanta:'vanta.com',replit:'replit.com',linear:'linear.app',posthog:'posthog.com',reddit:'reddit.com',fivetran:'fivetran.com',mercury:'mercury.com',chime:'chime.com',marqeta:'marqeta.com',roblox:'roblox.com',sumologic:'sumologic.com',postman:'postman.com',block:'block.xyz',toast:'toasttab.com',monzo:'monzo.com',carta:'carta.com',cockroachlabs:'cockroachlabs.com',cohere:'cohere.com',watershed:'watershed.com',sardine:'sardine.ai',persona:'withpersona.com',astronomer:'astronomer.io',sierra:'sierra.ai',
    on:'on-running.com',scandit:'scandit.com',beekeeper:'beekeeper.io',frontify:'frontify.com',ledgy:'ledgy.com',climeworks:'climeworks.com',nexthink:'nexthink.com',sophiagenetics:'sophiagenetics.com',wefox:'wefox.com',sonarsource:'sonarsource.com',planted:'eatplanted.com',yokoy:'yokoy.io',proton:'proton.me',
    ccpgames:'ccpgames.com',controlant:'controlant.com',sidekickhealth:'sidekickhealth.com',kerecis:'kerecis.com',meniga:'meniga.com',noxmedical:'noxmedical.com',lucinity:'lucinity.com',alvotech:'alvotech.com',taktikal:'taktikal.is',
    sensirion:'sensirion.com',avaloq:'avaloq.com',sherpany:'sherpany.com',squirro:'squirro.com',bexio:'bexio.com',teralytics:'teralytics.net',unique:'unique.ch',flatfox:'flatfox.ch',
    tempo:'tempo.io',dohop:'dohop.com',carbfix:'carbfix.com',solidclouds:'solidclouds.com',indo:'indo.is',avia:'avia.is',dohop:'dohop.com'};
  const ATSHOST=/greenhouse\.io|ashbyhq\.com|lever\.co|myworkday|smartrecruiters|recruitee|workable|icims|jobvite|bamboohr|paylocity|ripplingats/i;
  const logoUrl=(t,u)=>{ let d=DOMAINS[t]; if(!d){ try{ const h=new URL(u).hostname.replace(/^www\./,''); if(h && !ATSHOST.test(h)) d=h; }catch(e){} } if(!d) d=t.replace(/[^a-z0-9]/g,'')+'.com'; return 'https://icons.duckduckgo.com/ip3/'+d+'.ico'; };

  const GH=['stripe','databricks','mongodb','datadog','okta','samsara','airbnb','anthropic','elastic','pinterest','robinhood','cloudflare','brex','gitlab','coinbase','figma','instacart','twilio','affirm','scaleai','lyft','asana','sofi','gusto','discord','vercel','newrelic','flexport','faire','dropbox','reddit','fivetran','mercury','chime','marqeta','roblox','sumologic','postman','block','toast','monzo','carta','cockroachlabs','benchling','airtable','webflow','grammarly','hashicorp','confluent','squarespace','doordash','wealthsimple','gemini','plaid','notion','airbyte','retool','clickup','remote','deel','angellist','wistia','digitalocean','betterup'];
  const ASHBY=['ramp','vanta','replit','linear','posthog','cohere','watershed','sardine','persona','astronomer','sierra','clay','mintlify','baseten','hex','census','warp','browserbase','decagon','openstore','runway','tome'];
  /* Switzerland + Iceland employers (Greenhouse / Ashby / Lever). Invalid tokens are dropped safely. */
  const GH_CH=['scandit','frontify','nexthink','sophiagenetics','wefox','teralytics','sensirion','avaloq','sherpany','squirro','bexio','gatemgo','flatfox','ava','mindmaze','oncologie'];
  const ASHBY_CH=['ledgy','yokoy','planted','unique','deepjudge','nomoko','parloa','tally','laserhub'];
  const LEVER_CH=['on','beekeeper','climeworks','sonarsource','proton','yapeal','relike','nezasa','advertima'];
  const GH_IS=['ccpgames','controlant','alvotech','kerecis','solidclouds','carbfix'];
  const ASHBY_IS=['lucinity','sidekickhealth','taktikal','avia','indo'];
  const LEVER_IS=['meniga','noxmedical','tempo','dohop','oz'];

  /* keep a posting if it belongs to any target region (US/CH/IS) or is remote */
  const keep=(loc,isRemote)=>regionsOf(loc,isRemote).length>0;
  const ghOne=t=>safe((async()=>{ const j=await (await fetch('https://boards-api.greenhouse.io/v1/boards/'+t+'/jobs')).json();
    return (j.jobs||[]).filter(x=>keep((x.location&&x.location.name)||'')).map(x=>mk({title:x.title,co:nm(t),logo:logoUrl(t,x.absolute_url),loc:(x.location&&x.location.name)||'Remote',dept:catOf(x.title),tags:[catOf(x.title)],url:x.absolute_url,date:x.updated_at,src:'gh',token:t,gid:x.id})); })());
  const ashOne=o=>safe((async()=>{ const j=await (await fetch('https://api.ashbyhq.com/posting-api/job-board/'+o+'?includeCompensation=true')).json();
    return (j.jobs||[]).filter(x=>keep(x.location||'',x.isRemote)).map(x=>mk({title:x.title,co:nm(o),logo:logoUrl(o,x.jobUrl||x.applyUrl),loc:x.location||'Remote',type:x.employmentType||'',remote:x.isRemote,dept:catOf(x.title),tags:[catOf(x.title)],url:x.jobUrl||x.applyUrl,date:x.publishedAt||x.updatedAt,html:x.descriptionHtml||'',src:'ashby'})); })());
  const leverOne=t=>safe((async()=>{ const j=await (await fetch('https://api.lever.co/v0/postings/'+t+'?mode=json')).json();
    return (Array.isArray(j)?j:[]).filter(x=>{ const loc=(x.categories&&x.categories.location)||''; const wt=(x.workplaceType||''); return keep(loc, /remote/i.test(wt)); }).map(x=>{ const loc=(x.categories&&x.categories.location)||'Remote'; return mk({title:x.text,co:nm(t),logo:logoUrl(t,x.hostedUrl||x.applyUrl),loc:loc,type:(x.categories&&x.categories.commitment)||'',remote:/remote/i.test(x.workplaceType||''),dept:catOf(x.text)||((x.categories&&x.categories.team)||''),tags:[catOf(x.text)],url:x.hostedUrl||x.applyUrl,date:x.createdAt,html:(x.descriptionPlain||x.description||''),src:'lever'}); }); })());

  let tasks=[
    ...GH.map(ghOne), ...ASHBY.map(ashOne),
    ...GH_CH.map(ghOne), ...ASHBY_CH.map(ashOne), ...LEVER_CH.map(leverOne),
    ...GH_IS.map(ghOne), ...ASHBY_IS.map(ashOne), ...LEVER_IS.map(leverOne)
  ];
  /* Optional broader coverage (Adzuna CH + Arbeitnow EU/visa) via the serverless proxy.
     Returns [] when unconfigured / offline, so the ATS path always works. */
  const apiJobs=safe((async()=>{ const r=await fetch('/api/jobs'+(query?('?q='+encodeURIComponent(query)):'')); if(!r||!r.ok) return []; const j=await r.json();
    return (j.jobs||[]).filter(x=>x&&x.title&&x.url).map(x=>mk({title:x.title,co:x.co||'',logo:x.logo||'',loc:x.loc||'Remote',type:x.type||'',remote:!!x.remote,dept:x.dept||catOf(x.title),tags:(x.tags||[catOf(x.title)]),url:x.url,date:x.date,html:x.desc||'',src:x.src||'api'})); })());
  tasks.push(apiJobs);
  if(maxCompanies) tasks=tasks.slice(0,maxCompanies);
  let all=[]; const seen=new Set();
  function add(list){ for(let i=0;i<(list||[]).length;i++){ const j=list[i]; if(!j||!j.title||!j.url) continue; const k=((j.title||'')+'|'+(j.co||'')).toLowerCase().replace(/\s+/g,' ').trim(); if(seen.has(k)) continue; seen.add(k); all.push(j); } if(onProgress){ all.sort((a,b)=>(b._ts||0)-(a._ts||0)); try{ onProgress(all.slice(0,3000)); }catch(e){} } }
  await Promise.all(tasks.map(t=>t.then(add)));
  all.sort((a,b)=>(b._ts||0)-(a._ts||0));
  return all.slice(0,3000);
}
window.fetchRealJobs = fetchRealJobs;

/* Escape + sanitize a job description's HTML to a safe, structured subset */
function escapeHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
window.escapeHtml = escapeHtml;
function sanitizeJobHtml(html){
  const allowed={P:1,BR:1,UL:1,OL:1,LI:1,STRONG:1,B:1,EM:1,I:1,H2:1,H3:1,H4:1,H5:1,DIV:1,SPAN:1};
  const tmp=document.createElement('div'); tmp.innerHTML=String(html||'');
  (function walk(node){
    [...node.childNodes].forEach(c=>{
      if(c.nodeType===1){
        const tag=c.tagName;
        [...c.attributes].forEach(a=>c.removeAttribute(a.name));
        if(tag==='SCRIPT'||tag==='STYLE'){ c.remove(); return; }
        if(!allowed[tag]){ walk(c); while(c.firstChild) c.parentNode.insertBefore(c.firstChild,c); c.remove(); return; }
        walk(c);
      } else if(c.nodeType===8){ c.remove(); }
    });
  })(tmp);
  // drop empty blocks
  tmp.querySelectorAll('p,div,li,span').forEach(el=>{ if(!el.textContent.trim() && !el.querySelector('ul,ol,br')) el.remove(); });
  return tmp.innerHTML.trim();
}
window.sanitizeJobHtml = sanitizeJobHtml;

/* ---------- Stripe checkout (real when STRIPE_* env vars are set on the server) ---------- */
async function startCheckout(plan){
  try{
    const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan})});
    const j=await r.json();
    if(j && j.url){ location.href=j.url; return true; }   // real Stripe Checkout
  }catch(e){}
  return false;   // not configured yet → caller falls back to signup
}
window.startCheckout = startCheckout;

/* ---------- Real auth (Supabase) — used when SUPABASE_URL + key are set, else demo ---------- */
let _sb=null;
async function getSupabase(){
  if(!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return null;
  if(_sb) return _sb;
  await loadScriptOnce('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
  _sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  return _sb;
}
window.getSupabase = getSupabase;

/* ---------- Scroll reveal animations ---------- */
(function revealInit(){
  if(!('IntersectionObserver' in window)) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const run=()=>{
    const els=[...document.querySelectorAll('h2.sec,.eyebrow,.step,.plan,.feat,.feature,.matchcard,.vscol,.dstat,.dcard,.lead')];
    els.forEach((e,i)=>{ e.classList.add('reveal'); e.style.transitionDelay=(Math.min((i%6)*60,360))+'ms'; });
    const io=new IntersectionObserver(ents=>{ents.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });},{threshold:0.12});
    els.forEach(e=>io.observe(e));
  };
  if(document.readyState!=='loading') run(); else document.addEventListener('DOMContentLoaded', run);
})();

/* ---------- Conversion: counters, newsletter, sticky CTA, activity ticker ---------- */
function isMarketingPage(){ return !/login|signup|dashboard|profile/.test(location.pathname); }

function countUpStats(){
  const els=[...document.querySelectorAll('.strip b')].filter(b=>/\d/.test(b.textContent));
  els.forEach(b=>{
    const m=b.textContent.match(/([\d,]+)(.*)$/); if(!m) return;
    const target=parseInt(m[1].replace(/,/g,''),10); const suffix=m[2]||''; if(!target) return;
    const io=new IntersectionObserver(ents=>{ents.forEach(en=>{ if(!en.isIntersecting) return; io.disconnect();
      let i=0; const steps=42; const t=setInterval(()=>{ i++; const v=Math.round(target*(i/steps)); b.textContent=v.toLocaleString()+suffix; if(i>=steps){ b.textContent=target.toLocaleString()+suffix; clearInterval(t); } },20);
    });},{threshold:.4});
    io.observe(b);
  });
}

function newsletterPopup(){
  if(!isMarketingPage()) return;
  if(localStorage.getItem('unlisted_nl') || sessionStorage.getItem('unlisted_nl_seen')) return;
  let shown=false;
  function show(){
    if(shown) return; shown=true; sessionStorage.setItem('unlisted_nl_seen','1');
    const ov=document.createElement('div'); ov.className='nlmodal';
    ov.innerHTML=`<div class="nlcard">
      <button class="nlx" aria-label="Close">×</button>
      <h3>Get the hidden roles first. 📬</h3>
      <p>Join the weekly drop — fresh US remote roles before they hit the big boards, plus one free LinkedIn fix each week.</p>
      <form id="nlform"><input id="nlemail" type="email" placeholder="you@email.com" required><button class="btn btn-accent" type="submit">Get it free</button></form>
      <p class="fine">No spam. Unsubscribe anytime.</p>
    </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(()=>ov.classList.add('show'));
    const close=()=>{ ov.classList.remove('show'); setTimeout(()=>ov.remove(),260); };
    ov.querySelector('.nlx').onclick=close;
    ov.addEventListener('click',e=>{ if(e.target===ov) close(); });
    ov.querySelector('#nlform').addEventListener('submit',e=>{ e.preventDefault();
      const em=(ov.querySelector('#nlemail').value||'').trim();
      if(!/^\S+@\S+\.\S+$/.test(em)) return;
      localStorage.setItem('unlisted_nl', em);
      if(window.gtag) gtag('event','newsletter_signup');
      close(); showToast('🎉 You\'re in — check your inbox');
    });
  }
  setTimeout(show, 22000);
  document.addEventListener('mouseout', e=>{ if(e.clientY<=0 && !e.relatedTarget) show(); });
}

function stickyCTA(){
  if(!document.getElementById('match')) return; // homepage only
  const bar=document.createElement('div'); bar.className='stickycta';
  bar.innerHTML=`<span>See the US roles that actually fit you —</span><a href="#match" class="btn btn-accent btn-sm">✨ Paste your LinkedIn</a><button class="scx" aria-label="Dismiss">×</button>`;
  document.body.appendChild(bar);
  let dismissed=false;
  bar.querySelector('.scx').onclick=()=>{ dismissed=true; bar.classList.remove('show'); };
  bar.querySelector('a').onclick=()=>bar.classList.remove('show');
  window.addEventListener('scroll',()=>{ if(dismissed) return; bar.classList.toggle('show', window.scrollY>760); },{passive:true});
}

function activityTicker(){
  const host=document.getElementById('ticker'); if(!host) return;
  const items=[
    ['matched to a','Senior PM','role at Reddit'],
    ['applied via','Auto-Apply','to Stripe'],
    ['— new role added','2 min ago','at Kong (Remote US)'],
    ['tailored a CV for a','Backend Engineer','role at Stripe'],
    ['matched to a','Data Scientist','role at Figma'],
    ['— new role added','just now','at Coinbase (Remote US)'],
    ['got a reply in','2 days','via EarlyRoles'],
    ['matched to an','SRE','role at Notion']
  ];
  const one=items.map(i=>`<span class="ti"><span class="dotg"></span> Someone ${i[0]} <b>${i[1]}</b> ${i[2]}</span>`).join('');
  host.innerHTML=`<div class="ticker">${one}${one}</div>`;
}

document.addEventListener('DOMContentLoaded',()=>{ countUpStats(); newsletterPopup(); stickyCTA(); activityTicker(); });
