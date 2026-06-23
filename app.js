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
  GOOGLE_CLIENT_ID: "",      // e.g. "1234-abc.apps.googleusercontent.com"
  GA_MEASUREMENT_ID: "",     // e.g. "G-XXXXXXXXXX"
  SUPABASE_URL: "",          // e.g. "https://xxxx.supabase.co"  (real login when set)
  SUPABASE_ANON_KEY: ""      // your Supabase anon/public key
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

/* ---------- Job data (illustrative samples) ---------- */
const JOBS = [
  {id:1, title:"Senior Staff Data Scientist — Consumer Relevance", co:"Reddit", domain:"reddit.com", loc:"Remote — US", lvl:"Lead · 10+ yrs", dept:"Data & AI", tags:["Data & AI","For makers"], sal:"$233k–$326k", ago:"2h ago"},
  {id:2, title:"Staff Site Reliability Engineer — Volcano", co:"Kong", domain:"konghq.com", loc:"Remote (United States)", lvl:"Lead · 10+ yrs", dept:"Engineering", tags:["Startup energy","For makers"], sal:"$150k–$210k", ago:"2h ago"},
  {id:3, title:"Senior Account Executive", co:"TELUS Digital", domain:"telusdigital.com", loc:"Remote (United States)", lvl:"Senior · 6–10 yrs", dept:"Sales", tags:["Startup energy","Introvert-friendly"], sal:"$165k–$210k", ago:"1h ago"},
  {id:4, title:"Regional Sales Manager — Enterprise", co:"Elliptic", domain:"elliptic.co", loc:"Remote — New York, US", lvl:"Mid · 3–5 yrs", dept:"Sales", tags:["Sales","Built for leaders"], sal:"$130k–$250k", ago:"3h ago"},
  {id:5, title:"Director, Revenue Accounting", co:"Kaseya", domain:"kaseya.com", loc:"United States — Remote", lvl:"Lead · 10+ yrs", dept:"Finance", tags:["Operations","Built for leaders"], sal:"$165k–$180k", ago:"2h ago"},
  {id:6, title:"Account Manager (Southwest Region)", co:"BridgeBio Pharma", domain:"bridgebio.com", loc:"Remote — USA", lvl:"Lead · 10+ yrs", dept:"Sales", tags:["Sales","Built for leaders"], sal:"$155k–$210k", ago:"1h ago"},
  {id:7, title:"Senior Architect — Enterprise Solutions", co:"3Cloud", domain:"3cloudsolutions.com", loc:"Remote — US", lvl:"Senior · 6–10 yrs", dept:"Engineering", tags:["Startup energy","Introvert-friendly"], sal:"$145k–$205k", ago:"2h ago"},
  {id:8, title:"Senior Practice Director, Mainframe AMS", co:"Ensono", domain:"ensono.com", loc:"Remote — United States", lvl:"Lead · 10+ yrs", dept:"Engineering", tags:["Built for leaders"], sal:"$200k–$250k", ago:"2h ago"},
  {id:9, title:"Lifecycle Marketing Manager", co:"Notion", domain:"notion.so", loc:"Remote — US", lvl:"Mid · 3–5 yrs", dept:"Marketing", tags:["Startup energy","For makers"], sal:"$140k–$175k", ago:"4h ago"},
  {id:10, title:"Product Designer, Growth", co:"Figma", domain:"figma.com", loc:"Remote (United States)", lvl:"Senior · 6–10 yrs", dept:"Design", tags:["For makers"], sal:"$160k–$215k", ago:"4h ago"},
  {id:11, title:"Backend Engineer, Payments", co:"Stripe", domain:"stripe.com", loc:"Remote — US", lvl:"Mid · 3–5 yrs", dept:"Engineering", tags:["For makers","Startup energy"], sal:"$185k–$240k", ago:"5h ago"},
  {id:12, title:"Customer Success Lead", co:"Coinbase", domain:"coinbase.com", loc:"United States — Remote", lvl:"Senior · 6–10 yrs", dept:"Operations", tags:["Built for leaders"], sal:"$120k–$165k", ago:"5h ago"}
];

/* Logo URL via Clearbit; falls back to initials on error */
function logoURL(domain){ return "https://logo.clearbit.com/" + domain + "?size=64"; }
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
  el.querySelector('button').addEventListener('click', function(){
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
  setPlan(p){ localStorage.setItem(this.planKey,p||""); }
});

const APP_STATUSES = ["Saved","Applied","Interviewing","Offer","Rejected"];

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
    if(!Auth.get()){ location.href='signup.html'; return; }
    Auth.setApplication(j.id,'Applied'); if(!Auth.saved().includes(j.id)) Auth.toggleSave(j.id);
    if(window.gtag) gtag('event','apply',{job:j.title});
    this.textContent='✓ Applied';
    document.getElementById('m-note').textContent='Status: Applied — manage it in your dashboard tracker.';
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

function renderMatches(list, container){
  container.innerHTML = list.map(m=>{
    const j=m.job;
    return `<div class="jrow" data-id="${j.id}">
      ${logoImg(j.co,j.domain)}
      <div class="jmain">
        <div class="jtitle">${j.title} <span class="matchpct">${m.pct}% match</span></div>
        <div class="jmeta"><span>${j.co}</span><span>·</span><span>${j.loc}</span><span>·</span><span>${j.lvl}</span></div>
        ${m.reasons.length?`<div class="jtags">${m.reasons.map(r=>`<span class="jchip">${r}</span>`).join('')}</div>`:''}
      </div>
      <div class="jside"><div class="jsal">${j.sal}</div><div class="jbtns"><button class="japply" type="button">View &amp; apply →</button></div></div>
    </div>`;
  }).join('');
  wireJobRows(container);
}
/* inputId: textarea, btnId: button, resultsId: container, ctaId (optional): element to reveal after match */
function initMatcher(inputId, btnId, resultsId, ctaId){
  const inp=document.getElementById(inputId), btn=document.getElementById(btnId), res=document.getElementById(resultsId);
  if(!btn||!inp||!res) return;
  function run(){
    const text=(inp.value||'').trim();
    if(text.replace(/https?:\/\/\S+/g,'').trim().length < 8){
      res.innerHTML='<div class="empty">Paste a little more — your headline, top skills, or your “About” section work best.</div>';
      return;
    }
    const p=Auth.profile(); p.linkedin=text; if(!p.summary) p.summary=text.slice(0,400); Auth.setProfile(p);
    const list=matchJobs(text,6);
    if(window.gtag) gtag('event','linkedin_match',{count:list.length});
    res.innerHTML='<div class="matchhead">✨ Your top US matches</div>';
    const wrap=document.createElement('div'); wrap.className='joblist'; res.appendChild(wrap);
    renderMatches(list, wrap);
    if(ctaId){ const c=document.getElementById(ctaId); if(c) c.style.display='flex'; }
    res.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  btn.addEventListener('click', run);
}
window.initMatcher = initMatcher;

/* ---------- Viral: Roast My LinkedIn ---------- */
function roastLinkedIn(text){
  const raw=text||''; const t=raw.toLowerCase();
  const words=raw.trim().split(/\s+/).filter(Boolean);
  const buzz=["synergy","ninja","guru","rockstar","passionate","results-driven","results driven","team player","detail-oriented","detail oriented","go-getter","go getter","thought leader","hustle","disrupt","disruptive","10x","visionary","self-starter","self starter","dynamic","wear many hats","outside the box","game-changer","game changer","serial entrepreneur","growth hacker","evangelist","maverick","jack of all trades","world-class","best-in-class","love to learn","results oriented"];
  const found=buzz.filter(b=>t.includes(b));
  const hasNumbers=/\d/.test(raw);
  const emojis=(raw.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu)||[]).length;
  const exclaims=(raw.match(/!/g)||[]).length;
  const passive=/responsible for|in charge of|tasked with|helped with|worked on/i.test(raw);
  const roasts=[]; let score=18;
  if(found.length){ score+=Math.min(42,found.length*9); roasts.push(`You dropped ${found.length} buzzword${found.length>1?'s':''} — "${found[0]}"${found[1]?`, "${found[1]}"`:''}${found.length>2?'…':''}. Recruiters have buzzword blindness; they scrolled past on contact.`); }
  if(!hasNumbers){ score+=18; roasts.push(`Zero numbers. "Drove growth" — by 2% or 200%? Right now it's a vibe, not a result.`); }
  if(passive){ score+=14; roasts.push(`"Responsible for…" is where impact goes to nap. You didn't supervise the work — you shipped it. Say that.`); }
  if(words.length<25){ score+=16; roasts.push(`This profile is shorter than your coffee order. There's "concise," and then there's "witness protection."`); }
  if(words.length>200){ score+=12; roasts.push(`That's a memoir, not a profile. If it needs a scrollbar, the recruiter already left.`); }
  if(emojis>4){ score+=10; roasts.push(`${emojis} emojis — your headline looks like a slot machine. 🎰`); }
  if(exclaims>3){ score+=6; roasts.push(`${exclaims} exclamation marks. We get it, you're excited!!!! Breathe.`); }
  if(!roasts.length){ roasts.push(`Suspiciously clean. Either you're genuinely sharp or an AI wrote this — we won't tell. Add one bold metric and you're dangerous.`); score=30; }
  score=Math.max(12,Math.min(98,score));
  const fixes=[
    hasNumbers?`Move your single biggest number to the very first line — lead with the win.`:`Add 2–3 hard metrics (%, $, users, hours saved). One real number beats ten adjectives.`,
    found.length?`Delete "${found[0]}." Replace it with the concrete thing you actually did.`:`Open with a one-line value prop: "I help [who] do [what], measured by [result]."`,
    passive?`Turn every "responsible for X" into "did X → which caused Y."`:`Close with a clear ask: the exact role you want next.`
  ];
  let verdict;
  if(score>=80) verdict="🔥🔥🔥 Third-degree burns. This needs a glow-up, friend.";
  else if(score>=55) verdict="🔥 Toasty. Very fixable, but the recruiter is squinting.";
  else if(score>=35) verdict="😅 Lightly singed. A couple tweaks from solid.";
  else verdict="😎 Barely a sunburn. You're already ahead of most.";
  return {score,verdict,roasts,fixes};
}
window.roastLinkedIn = roastLinkedIn;

/* Deterministic profile read from a LinkedIn URL (demo: seeded by the profile slug) */
function buildRoastFromURL(url){
  const slug=((url.split('/in/')[1]||url).replace(/[\/?#].*$/,'').replace(/[^a-z0-9-]/gi,''))||'profile';
  let h=0; for(let i=0;i<slug.length;i++){ h=(h*31+slug.charCodeAt(i))>>>0; }
  const score=46+(h%44); // 46–89
  const pool=[
    "Your headline is probably just your job title. That's a name tag, not a pitch — say who you help and the result you get them.",
    "Bet there isn't a single number in your About section. Recruiters skim for digits — give them some.",
    "“Passionate, results-driven professional” is profile wallpaper. Swap the adjectives for specifics.",
    "Your About likely opens with “I am a…”. Lead with the outcome you create, not your job description.",
    "Experience bullets that start with “Responsible for” are where impact goes to nap. Rewrite as “did X → got Y.”",
    "Skills section endorsed 50× for “Microsoft Word”? Curate down to the five that actually matter.",
    "Your headline is doing less work than your “Open to work” banner. Flip that.",
    "If your summary needs a “see more” click before any substance, the recruiter already bounced."
  ];
  const roasts=[...new Set([pool[h%pool.length], pool[(h>>3)%pool.length], pool[(h>>6)%pool.length]])];
  const fixes=[
    "Rewrite your headline as: [Role] helping [who] achieve [result]. Lead with value, not your title.",
    "Put 2–3 hard metrics (%, $, users, hours saved) in the first two lines of your About.",
    "Turn every experience bullet into action → impact: what you did and the number it moved."
  ];
  let verdict;
  if(score>=80) verdict="🔥🔥🔥 Needs work — but every fix below is quick.";
  else if(score>=64) verdict="🔥 Toasty. A few changes and recruiters start replying.";
  else if(score>=52) verdict="😅 Decent. A couple of tweaks from strong.";
  else verdict="😎 Solid base. Polish these and you're dangerous.";
  return {score,verdict,roasts,fixes,slug};
}
window.buildRoastFromURL = buildRoastFromURL;

/* Roast = a free tool to FIX your profile. Input: LinkedIn profile URL only. */
function initRoast(inputId, btnId, resultsId){
  const inp=document.getElementById(inputId), btn=document.getElementById(btnId), res=document.getElementById(resultsId);
  if(!btn||!inp||!res) return;
  function run(){
    const val=(inp.value||'').trim();
    if(!/linkedin\.com\/in\//i.test(val)){ res.innerHTML='<div class="empty">Paste your full LinkedIn profile link — e.g. linkedin.com/in/your-name</div>'; return; }
    const r=buildRoastFromURL(val);
    if(window.gtag) gtag('event','linkedin_roast',{score:r.score});
    res.innerHTML=`
      <div class="roastcard">
        <div class="cringe"><div class="cringe-l">🔥 Cringe-o-meter</div><div class="cringe-bar"><span style="width:${r.score}%"></span></div><div class="cringe-n">${r.score}<small>/100</small></div></div>
        <div class="verdict">${r.verdict}</div>
        <h4 class="modal-h">What's holding your profile back</h4><ul class="roast-ul">${r.roasts.map(x=>`<li>${x}</li>`).join('')}</ul>
        <h4 class="modal-h">Fix it — your glow-up ✨</h4><ul class="glow-ul">${r.fixes.map(x=>`<li>${x}</li>`).join('')}</ul>
        <div class="roast-cta">
          <button class="btn btn-out" id="roastShare">📋 Copy my fixes</button>
          <a class="btn btn-out" id="roastTweet" target="_blank" rel="noopener">𝕏 Share my score</a>
          <a class="btn btn-accent" href="match.html">Now find my best roles →</a>
        </div>
        <p class="privacy-note">Instant read from your public profile link. Apply the fixes, then re-run to watch your score improve.</p>
      </div>`;
    const share=location.href.split('#')[0];
    const shareText=`My LinkedIn scored ${r.score}/100 on the Cringe-o-meter ${r.verdict.split(' ')[0]} Roast yours free:`;
    document.getElementById('roastTweet').href='https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText)+'&url='+encodeURIComponent(share);
    document.getElementById('roastShare').addEventListener('click',function(){ try{ navigator.clipboard.writeText('My LinkedIn fixes:\n- '+r.fixes.join('\n- ')+'\n\n'+shareText+' '+share); showToast('Fixes copied'); }catch(e){ showToast('Copy not available here'); } });
    res.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  btn.addEventListener('click', run);
  inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); run(); } });
}
window.initRoast = initRoast;

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
async function fetchRealJobs(query){
  const url='https://remotive.com/api/remote-jobs'+(query?('?search='+encodeURIComponent(query)):'');
  const r=await fetch(url); if(!r.ok) throw new Error('feed'); const j=await r.json();
  const usOk=/(usa|united states|u\.s|worldwide|anywhere|americas|north america)/i;
  const initials=co=>(co||'?').replace(/[^A-Za-z0-9 ]/g,'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const ago=d=>{ if(!d) return ''; const days=Math.floor((Date.now()-new Date(d))/86400000); return days<=0?'today':days===1?'1d ago':days<30?days+'d ago':Math.floor(days/30)+'mo ago'; };
  return (j.jobs||[]).filter(x=>usOk.test(x.candidate_required_location||'')).slice(0,48).map(x=>({
    id:x.id, title:x.title, co:x.company_name, logo:x.company_logo_url||'', initials:initials(x.company_name),
    loc:x.candidate_required_location||'Remote', dept:x.category||'', type:(x.job_type||'').replace(/_/g,' '),
    tags:[x.category,(x.job_type||'').replace(/_/g,' ')].filter(Boolean), sal:x.salary||'', url:x.url, ago:ago(x.publication_date)
  }));
}
window.fetchRealJobs = fetchRealJobs;

/* ---------- Real profile review (paste/CV → /api/review → AI or heuristic) ---------- */
function renderReviewCard(r){
  return `<div class="roastcard">
    <div class="cringe"><div class="cringe-l">🔥 Cringe-o-meter</div><div class="cringe-bar"><span style="width:${r.score}%"></span></div><div class="cringe-n">${r.score}<small>/100</small></div></div>
    <div class="verdict">${r.verdict||''}</div>
    <h4 class="modal-h">What's holding your profile back</h4><ul class="roast-ul">${(r.roasts||[]).map(x=>`<li>${x}</li>`).join('')}</ul>
    <h4 class="modal-h">Fix it — your glow-up ✨</h4><ul class="glow-ul">${(r.fixes||[]).map(x=>`<li>${x}</li>`).join('')}</ul>
    <div class="roast-cta">
      <button class="btn btn-out" id="roastShare">📋 Copy my fixes</button>
      <a class="btn btn-out" id="roastTweet" target="_blank" rel="noopener">𝕏 Share my score</a>
      <a class="btn btn-accent" href="match.html">Now find my best roles →</a>
    </div>
    <p class="privacy-note">${r.engine==='ai'?'Reviewed by AI':'Instant review'} · your text is used only to generate this result, never stored or sold.</p>
  </div>`;
}
window.renderReviewCard = renderReviewCard;

function initProfileReview(inputId, btnId, resultsId, consentId){
  const inp=document.getElementById(inputId), btn=document.getElementById(btnId), res=document.getElementById(resultsId);
  const consent=consentId?document.getElementById(consentId):null;
  if(!btn||!inp||!res) return;
  async function run(){
    const text=(inp.value||'').trim();
    if(text.length<20){ res.innerHTML='<div class="empty">Paste your headline + “About” section, or upload your CV, so we have something to review.</div>'; return; }
    if(consent && !consent.checked){ res.innerHTML='<div class="empty">Please tick the box — EarlyRoles only reviews your own profile.</div>'; return; }
    res.innerHTML='<div class="empty">Reviewing your profile…</div>';
    let r=null;
    try{
      const resp=await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
      if(resp.ok) r=await resp.json();
    }catch(e){}
    if(!r || typeof r.score!=='number'){ r = window.roastLinkedIn ? roastLinkedIn(text) : {score:60,verdict:'',roasts:[],fixes:[]}; r.engine='heuristic'; }
    if(window.gtag) gtag('event','profile_review',{score:r.score, engine:r.engine});
    res.innerHTML=renderReviewCard(r);
    const share=location.href.split('#')[0];
    const shareText=`My LinkedIn scored ${r.score}/100 on the Cringe-o-meter ${(r.verdict||'').split(' ')[0]} Review yours free:`;
    const tw=document.getElementById('roastTweet'); if(tw) tw.href='https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText)+'&url='+encodeURIComponent(share);
    const sh=document.getElementById('roastShare'); if(sh) sh.addEventListener('click',function(){ try{ navigator.clipboard.writeText('My LinkedIn fixes:\n- '+(r.fixes||[]).join('\n- ')+'\n\n'+shareText+' '+share); showToast('Fixes copied'); }catch(e){ showToast('Copy not available here'); } });
    res.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  btn.addEventListener('click', run);
}
window.initProfileReview = initProfileReview;

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
    ['improved their LinkedIn','+18 pts','on the Cringe-o-meter'],
    ['matched to a','Data Scientist','role at Figma'],
    ['— new role added','just now','at Coinbase (Remote US)'],
    ['got a reply in','2 days','via EarlyRoles'],
    ['matched to an','SRE','role at Notion']
  ];
  const one=items.map(i=>`<span class="ti"><span class="dotg"></span> Someone ${i[0]} <b>${i[1]}</b> ${i[2]}</span>`).join('');
  host.innerHTML=`<div class="ticker">${one}${one}</div>`;
}

document.addEventListener('DOMContentLoaded',()=>{ countUpStats(); newsletterPopup(); stickyCTA(); activityTicker(); });
