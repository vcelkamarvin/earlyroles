/* HardHat — shared client engine (vanilla JS, no build step) */
(function(){
'use strict';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */
var CONFIG = {
  BRAND: 'HardHat',
  GA_MEASUREMENT_ID: '',              // set to enable GA4
  // Stripe Payment Links (optional quick path). Leave '' to use /api/checkout.
  PAY: { pro_monthly:'', pro_annual:'', fasttrack:'' }
};
window.HH_CONFIG = CONFIG;

/* GA4 (only if configured) */
function ga(ev, params){
  try{ if(window.gtag) window.gtag('event', ev, params||{}); }catch(e){}
}
window.hhTrack = ga;

/* ------------------------------------------------------------------ */
/* SECTORS — the 8 verticals                                           */
/* ------------------------------------------------------------------ */
var SECTORS = [
  { id:'oil',    icon:'🛢️', name:'Offshore Oil & Gas', blurb:'Roughneck, roustabout, floorhand, derrickhand on rigs & platforms.', pay:'$60k–$130k', rota:'2 on / 3 off', noexp:true },
  { id:'wind',   icon:'🌬️', name:'Offshore Wind',       blurb:'GWO-certified turbine techs building & maintaining wind farms.',      pay:'$55k–$110k', rota:'2 on / 2 off', noexp:true },
  { id:'diving', icon:'🤿', name:'Commercial Diving',    blurb:'Air & saturation divers, tenders — underwater welding & inspection.', pay:'$50k–$180k', rota:'project',     noexp:false },
  { id:'marine', icon:'⚓', name:'Merchant Marine',      blurb:'Deckhand, OS/AB, wiper — cargo ships, tugs, supply vessels.',        pay:'$45k–$90k',  rota:'28 on / 28 off', noexp:true },
  { id:'mining', icon:'⛏️', name:'FIFO Mining',          blurb:'Fly-in fly-out remote mine operators, trades & haul-truck drivers.', pay:'$70k–$140k', rota:'2 on / 1 off', noexp:true },
  { id:'weld',   icon:'🔥', name:'Pipeline / Welding',   blurb:'Structural & pipeline welders, riggers, fabricators.',               pay:'$55k–$120k', rota:'project',     noexp:false },
  { id:'wtt',    icon:'⚡', name:'Wind Turbine Tech',    blurb:'Onshore turbine service techs — climb, service, fault-find.',        pay:'$50k–$85k',  rota:'rota',       noexp:true },
  { id:'cdl',    icon:'🚛', name:'Hazmat / CDL Haul',    blurb:'Long-haul, tanker & hazmat drivers — oilfield & heavy freight.',     pay:'$60k–$110k', rota:'weeks out',  noexp:true }
];
window.HH_SECTORS = SECTORS;
function sector(id){ for(var i=0;i<SECTORS.length;i++) if(SECTORS[i].id===id) return SECTORS[i]; return null; }

/* ------------------------------------------------------------------ */
/* TICKETS / MEDICALS per sector — the roadmap engine                  */
/* ------------------------------------------------------------------ */
// type: 'cert' | 'medical' | 'doc'  · req: true = mandatory to start
var TICKETS = {
  oil: [
    { id:'bosiet', name:'BOSIET / OPITO', type:'cert', req:true, cost:'$900–$1,400', days:'3 days', desc:'Offshore survival & sea-escape (HUET). Non-negotiable to step on a rig.' },
    { id:'ogukmed', name:'OGUK / OEUK Medical', type:'medical', req:true, cost:'$150–$250', days:'1 day', desc:'Offshore fitness medical, valid 2 years.' },
    { id:'mist', name:'MIST', type:'cert', req:true, cost:'$120–$200', days:'1 day', desc:'Minimum Industry Safety Training induction.' },
    { id:'twic', name:'TWIC card (US)', type:'doc', req:false, cost:'$125', days:'2–4 wks', desc:'Transport Worker ID — needed for US Gulf platforms.' },
    { id:'rigpass', name:'Rig Pass / SafeGulf', type:'cert', req:false, cost:'$50–$150', days:'1 day', desc:'US onshore/offshore safety orientation.' }
  ],
  wind: [
    { id:'gwobst', name:'GWO Basic Safety Training', type:'cert', req:true, cost:'$1,200–$1,800', days:'4–5 days', desc:'Working at heights, first aid, fire, manual handling, sea survival.' },
    { id:'gwobtt', name:'GWO Basic Technical', type:'cert', req:false, cost:'$1,000', days:'3 days', desc:'Mechanical, electrical & hydraulic basics.' },
    { id:'offmed', name:'Offshore Medical (ENG1/OGUK)', type:'medical', req:true, cost:'$150–$250', days:'1 day', desc:'Fitness to work offshore.' },
    { id:'huet', name:'HUET / sea survival', type:'cert', req:true, cost:'$400–$700', days:'1–2 days', desc:'Helicopter underwater escape for offshore transfer.' }
  ],
  diving: [
    { id:'dmt', name:'Commercial Dive School', type:'cert', req:true, cost:'$12k–$30k', days:'3–7 months', desc:'ADCI / HSE / IMCA commercial diver certification.' },
    { id:'divemed', name:'Diver Medical', type:'medical', req:true, cost:'$200–$400', days:'1 day', desc:'Annual commercial diving fitness exam.' },
    { id:'twicd', name:'TWIC card', type:'doc', req:false, cost:'$125', days:'2–4 wks', desc:'Port/terminal access for many dive jobs.' }
  ],
  marine: [
    { id:'stcw', name:'STCW Basic Training', type:'cert', req:true, cost:'$900–$1,500', days:'5 days', desc:'Personal survival, fire, first aid, security — mandatory to work at sea.' },
    { id:'mmc', name:'Merchant Mariner Credential', type:'doc', req:true, cost:'$140+', days:'4–8 wks', desc:'US MMC (or flag-state seaman book) to sign on.' },
    { id:'twicm', name:'TWIC card', type:'doc', req:true, cost:'$125', days:'2–4 wks', desc:'Required to board US vessels/terminals.' },
    { id:'marmed', name:'Merchant Marine Medical', type:'medical', req:true, cost:'$100–$300', days:'1 day', desc:'Fitness & drug screen.' }
  ],
  mining: [
    { id:'induction', name:'Site Safety Induction', type:'cert', req:true, cost:'$100–$300', days:'1–2 days', desc:'Standard 11 / MSHA / site general induction.' },
    { id:'medm', name:'Pre-employment Medical + D&A', type:'medical', req:true, cost:'$150–$350', days:'1 day', desc:'Fitness, drug & alcohol screen.' },
    { id:'wc', name:'Working at Heights + Confined Space', type:'cert', req:false, cost:'$200–$500', days:'1–2 days', desc:'Common tickets for maintenance & processing roles.' },
    { id:'hr', name:'HR / MC licence (if driving)', type:'doc', req:false, cost:'$300–$1,500', days:'weeks', desc:'Heavy-rigid / haul-truck ticket for driving roles.' }
  ],
  weld: [
    { id:'weldcert', name:'Welding Certification (6G/AWS)', type:'cert', req:true, cost:'$500–$3,000', days:'weeks', desc:'6G pipe / AWS D1.1 structural qualification.' },
    { id:'osha', name:'OSHA 10 / 30', type:'cert', req:true, cost:'$60–$200', days:'1–4 days', desc:'Construction safety card.' },
    { id:'twicw', name:'TWIC card', type:'doc', req:false, cost:'$125', days:'2–4 wks', desc:'For refinery/port fabrication work.' },
    { id:'rigging', name:'Rigging / Signal', type:'cert', req:false, cost:'$200–$600', days:'1–3 days', desc:'Boosts pay on structural jobs.' }
  ],
  wtt: [
    { id:'gwoheights', name:'GWO Working at Heights + First Aid', type:'cert', req:true, cost:'$700–$1,200', days:'2–3 days', desc:'Climb & rescue for turbine towers.' },
    { id:'wttmed', name:'Climb Medical', type:'medical', req:true, cost:'$120–$250', days:'1 day', desc:'Fitness to climb & work at height.' },
    { id:'elec', name:'Electrical/Mechanical basics', type:'cert', req:false, cost:'$0–$1,000', days:'varies', desc:'Trade background or GWO BTT helps a lot.' }
  ],
  cdl: [
    { id:'cdla', name:'CDL Class A', type:'doc', req:true, cost:'$3,000–$8,000', days:'3–7 wks', desc:'Commercial licence — many carriers pay for training.' },
    { id:'hazmat', name:'Hazmat + Tanker endorsement', type:'doc', req:true, cost:'$100–$150', days:'2–4 wks', desc:'H & N endorsements for oilfield/chemical hauling.' },
    { id:'twicc', name:'TWIC card', type:'doc', req:false, cost:'$125', days:'2–4 wks', desc:'For port and terminal loads.' },
    { id:'dotmed', name:'DOT Medical Card', type:'medical', req:true, cost:'$80–$150', days:'1 day', desc:'Federal fitness-to-drive exam.' }
  ]
};
window.HH_TICKETS = TICKETS;

/* ------------------------------------------------------------------ */
/* PAY & ROTATION data                                                 */
/* ------------------------------------------------------------------ */
var PAY = {
  oil:   { entry:'$55k', exp:'$130k', day:'$180–$500/day', rota:'2 wk on / 3 wk off', tax:false, note:'Day-rate roles; overtime common offshore.' },
  wind:  { entry:'$50k', exp:'$110k', day:'$220–$420/day', rota:'2 on / 2 off',       tax:false, note:'GWO tickets open EU + US offshore wind.' },
  diving:{ entry:'$45k', exp:'$180k', day:'$300–$1,200/day', rota:'project-based',     tax:false, note:'Saturation diving is the top of the pay scale.' },
  marine:{ entry:'$45k', exp:'$90k',  day:'$150–$350/day',  rota:'28 on / 28 off',    tax:true,  note:'US mariners may qualify for foreign-earned income exclusion.' },
  mining:{ entry:'$70k', exp:'$140k', day:'$250–$550/day',  rota:'2 on / 1 off (FIFO)', tax:false, note:'Camp, flights & meals usually covered.' },
  weld:  { entry:'$50k', exp:'$120k', day:'$25–$60/hr',     rota:'project / shutdown', tax:false, note:'Certified 6G pipe welders earn the most.' },
  wtt:   { entry:'$48k', exp:'$85k',  day:'$25–$45/hr',     rota:'rota + travel',      tax:false, note:'Traveling techs get per-diem on top.' },
  cdl:   { entry:'$60k', exp:'$110k', day:'$0.55–$0.80/mi', rota:'weeks out',          tax:false, note:'Oilfield & hazmat pays a premium over dry van.' }
};
window.HH_PAY = PAY;

/* ------------------------------------------------------------------ */
/* CREWING AGENCIES / OPERATORS directory                              */
/* ------------------------------------------------------------------ */
var AGENCIES = [
  { sector:'oil',    name:'Airswift',           type:'Global energy staffing', region:'Global',   url:'https://www.airswift.com' },
  { sector:'oil',    name:'Orion Group',        type:'Oil & gas recruitment',  region:'UK/Global',url:'https://www.orionjobs.com' },
  { sector:'oil',    name:'NES Fircroft',       type:'Energy manpower',        region:'Global',   url:'https://www.nesfircroft.com' },
  { sector:'wind',   name:'Renewable Energy Group','type':'Offshore wind staffing', region:'EU/US', url:'#' },
  { sector:'wind',   name:'Taylor Hopkinson',   type:'Renewables recruitment', region:'Global',   url:'https://www.taylorhopkinson.com' },
  { sector:'diving', name:'Cal Dive / Subsea 7','type':'Subsea & diving',      region:'Global',   url:'#' },
  { sector:'marine', name:'Crowley Maritime',   type:'US vessel operator',     region:'US',       url:'https://www.crowley.com' },
  { sector:'marine', name:'Maersk Crewing',     type:'Merchant fleet',         region:'Global',   url:'#' },
  { sector:'mining', name:'Hays Mining',        type:'Mining recruitment',     region:'AU/Global',url:'https://www.hays.com' },
  { sector:'mining', name:'WorkPac',            type:'FIFO labour hire',       region:'Australia', url:'https://www.workpac.com' },
  { sector:'weld',   name:'Aerotek',            type:'Skilled trades staffing',region:'US',       url:'https://www.aerotek.com' },
  { sector:'weld',   name:'Tradesmen Int’l', type:'Construction trades',  region:'US',       url:'#' },
  { sector:'wtt',    name:'Airswift Renewables', type:'Wind tech staffing',    region:'Global',   url:'#' },
  { sector:'cdl',    name:'TransForce',         type:'CDL driver staffing',    region:'US',       url:'#' },
  { sector:'cdl',    name:'Schlumberger/SLB Logistics','type':'Oilfield haul', region:'US/Global',url:'#' }
];
window.HH_AGENCIES = AGENCIES;

/* ------------------------------------------------------------------ */
/* SEED JOBS (curated; live fetch can augment)                         */
/* ------------------------------------------------------------------ */
var JOBS = [
  { id:'j1', title:'Roustabout (No Experience)', co:'Gulf Drilling Co', sector:'oil', icon:'🛢️', loc:'Gulf of Mexico', rota:'14/14', pay:'$62,000', payn:62000, noexp:true, tickets:['bosiet','ogukmed'] },
  { id:'j2', title:'Floorhand / Roughneck', co:'North Sea Energy', sector:'oil', icon:'🛢️', loc:'North Sea, UK', rota:'2 on / 3 off', pay:'$78,000', payn:78000, noexp:true, tickets:['bosiet','mist'] },
  { id:'j3', title:'GWO Wind Turbine Technician', co:'Ørsted Contractor', sector:'wind', icon:'🌬️', loc:'East Coast, US', rota:'2 on / 2 off', pay:'$71,000', payn:71000, noexp:true, tickets:['gwobst','huet'] },
  { id:'j4', title:'Trainee Wind Tech', co:'Vestas Service', sector:'wtt', icon:'⚡', loc:'Texas, US', rota:'rota + travel', pay:'$52,000', payn:52000, noexp:true, tickets:['gwoheights'] },
  { id:'j5', title:'Deckhand / OS', co:'Crowley Marine', sector:'marine', icon:'⚓', loc:'US Gulf & Coastwise', rota:'28/28', pay:'$58,000', payn:58000, noexp:true, tickets:['stcw','twicm'] },
  { id:'j6', title:'Diver Tender / Trainee', co:'Subsea Services', sector:'diving', icon:'🤿', loc:'Louisiana, US', rota:'project', pay:'$54,000', payn:54000, noexp:false, tickets:['dmt','divemed'] },
  { id:'j7', title:'FIFO Haul Truck Operator', co:'Pilbara Mining', sector:'mining', icon:'⛏️', loc:'WA, Australia', rota:'2 on / 1 off', pay:'$95,000', payn:95000, noexp:true, tickets:['induction','medm'] },
  { id:'j8', title:'Process Operator (FIFO)', co:'Remote Resources', sector:'mining', icon:'⛏️', loc:'Queensland, AU', rota:'8/6', pay:'$88,000', payn:88000, noexp:true, tickets:['induction','medm'] },
  { id:'j9', title:'Pipeline Welder (6G)', co:'Continental Pipeline', sector:'weld', icon:'🔥', loc:'Permian Basin, US', rota:'project', pay:'$105,000', payn:105000, noexp:false, tickets:['weldcert','osha'] },
  { id:'j10', title:'Structural Welder / Fitter', co:'Fab Yard Industries', sector:'weld', icon:'🔥', loc:'Houston, US', rota:'shutdown', pay:'$72,000', payn:72000, noexp:false, tickets:['weldcert','osha'] },
  { id:'j11', title:'Hazmat Tanker Driver', co:'Oilfield Logistics', sector:'cdl', icon:'🚛', loc:'North Dakota, US', rota:'weeks out', pay:'$84,000', payn:84000, noexp:true, tickets:['cdla','hazmat'] },
  { id:'j12', title:'Saturation Diver', co:'Deepwater Subsea', sector:'diving', icon:'🤿', loc:'West Africa (offshore)', rota:'28-day sat', pay:'$165,000', payn:165000, noexp:false, tickets:['dmt','divemed'] },
  { id:'j13', title:'Roustabout — Platform', co:'Shelf Operators', sector:'oil', icon:'🛢️', loc:'Gulf of Mexico', rota:'7/7', pay:'$66,000', payn:66000, noexp:true, tickets:['bosiet','ogukmed','mist'] },
  { id:'j14', title:'Able Seaman (AB)', co:'Harvey Gulf', sector:'marine', icon:'⚓', loc:'US Gulf', rota:'28/14', pay:'$76,000', payn:76000, noexp:false, tickets:['stcw','mmc','twicm'] },
  { id:'j15', title:'Offshore Wind — Cable Puller', co:'Prysmian Contractor', sector:'wind', icon:'🌬️', loc:'Northeast US', rota:'project', pay:'$68,000', payn:68000, noexp:true, tickets:['gwobst'] },
  { id:'j16', title:'CDL Driver — Frac Sand', co:'Basin Haul', sector:'cdl', icon:'🚛', loc:'Texas, US', rota:'home weekly', pay:'$74,000', payn:74000, noexp:true, tickets:['cdla'] }
];
window.HH_JOBS = JOBS;

/* ------------------------------------------------------------------ */
/* AUTH + STATE (localStorage) — keys prefixed hh_                     */
/* ------------------------------------------------------------------ */
function get(k, d){ try{ var v=localStorage.getItem('hh_'+k); return v?JSON.parse(v):(d===undefined?null:d);}catch(e){return d===undefined?null:d;} }
function set(k, v){ try{ localStorage.setItem('hh_'+k, JSON.stringify(v)); }catch(e){} }
function del(k){ try{ localStorage.removeItem('hh_'+k); }catch(e){} }

var Auth = {
  user: function(){ return get('user'); },
  signedIn: function(){ return !!get('user'); },
  signup: function(name, email){ var u={name:name||'Crew',email:email||'',ts:Date.now()}; set('user',u); ga('sign_up',{}); return u; },
  login: function(email){ var u=get('user')||{name:'Crew'}; u.email=email||u.email; set('user',u); return u; },
  logout: function(){ del('user'); },
  plan: function(){ return get('plan','free'); },
  setPlan: function(p){ set('plan',p); ga('plan_set',{plan:p}); },
  isPaid: function(){ var p=get('plan','free'); return p==='pro'||p==='pro_annual'||p==='fasttrack'; },
  intake: function(){ return get('intake'); },
  setIntake: function(o){ set('intake', o); },
  tickets: function(){ return get('tickets_done', {}); },
  toggleTicket: function(id){ var t=get('tickets_done',{}); t[id]=!t[id]; set('tickets_done',t); return t[id]; },
  saved: function(){ return get('saved', []); },
  toggleSave: function(id){ var s=get('saved',[]); var i=s.indexOf(id); if(i>=0)s.splice(i,1); else s.push(id); set('saved',s); return i<0; },
  apps: function(){ return get('apps', {}); },
  setApp: function(id, stage){ var a=get('apps',{}); a[id]=stage; set('apps',a); }
};
window.HH = { Auth:Auth, sector:sector, get:get, set:set, ga:ga };

/* ------------------------------------------------------------------ */
/* RIG-READY SCORE                                                     */
/* ------------------------------------------------------------------ */
function rigReadyScore(intake){
  if(!intake) return { score:0, gaps:[], blurb:'Take the assessment to get your score.' };
  var s = 20, gaps = [];
  var exp = intake.experience;
  if(exp==='offshore') s+=25; else if(exp==='trade') s+=15; else s+=4;
  var held = intake.tickets || [];
  var need = (TICKETS[intake.sector]||[]).filter(function(t){return t.req;});
  var haveReq = need.filter(function(t){ return held.indexOf(t.id)>=0; });
  s += need.length ? Math.round((haveReq.length/need.length)*32) : 20;
  need.forEach(function(t){ if(held.indexOf(t.id)<0) gaps.push(t); });
  if(intake.medical==='valid') s+=10; else gaps.push({name:'Valid offshore/work medical', type:'medical', req:true});
  if(intake.relocate==='yes') s+=6;
  if(intake.travel==='yes') s+=6;
  if(intake.fit==='yes') s+=5; else gaps.push({name:'Confirm you’re fit for heavy physical work', type:'medical', req:true});
  if(intake.rightwork==='yes') s+=4;
  s = Math.max(8, Math.min(97, s));
  var blurb;
  if(s>=80) blurb='You’re basically rig-ready — clear the last items and start applying now.';
  else if(s>=55) blurb='You’re close. A couple of tickets and you’ll be a strong candidate.';
  else if(s>=35) blurb='Solid starting point. Follow your roadmap to get job-ready in weeks.';
  else blurb='Everyone starts here. Your roadmap below is your exact path in.';
  return { score:s, gaps:gaps, blurb:blurb };
}
window.HH.rigReadyScore = rigReadyScore;

/* ------------------------------------------------------------------ */
/* PAYWALL                                                             */
/* ------------------------------------------------------------------ */
function showPaywall(reason){
  ga('paywall_view',{reason:reason||''});
  var m = document.getElementById('pwModal');
  if(!m){
    m = document.createElement('div'); m.id='pwModal'; m.className='modal';
    m.innerHTML =
      '<div class="mbox">'+
      '<span class="mclose" onclick="HH.closePaywall()">×</span>'+
      '<div class="eyebrow" style="text-align:left">Unlock HardHat Pro</div>'+
      '<h3 class="display" style="font-size:26px;margin:8px 0 6px">Get the full path to a $60k+ job</h3>'+
      '<p style="color:var(--muted);font-size:14.5px">'+(reason||'Unlock your complete ticket roadmap, matched jobs, the crewing-agency directory and the AI offshore CV builder.')+'</p>'+
      '<div class="pw-price" style="margin-top:16px">$29<span style="font-size:15px;color:var(--muted)">/mo</span></div>'+
      '<p style="font-size:13px;color:var(--faint);margin-bottom:16px">or $190/yr · cancel anytime</p>'+
      '<a class="btn btn-hi btn-block btn-lg" href="pricing.html">See plans →</a>'+
      '<button class="btn btn-out btn-block" style="margin-top:10px" onclick="HH.closePaywall()">Not yet</button>'+
      '</div>';
    document.body.appendChild(m);
  }
  m.classList.add('on');
}
window.HH.closePaywall = function(){ var m=document.getElementById('pwModal'); if(m)m.classList.remove('on'); };
window.HH.showPaywall = showPaywall;

/* checkout: prefer Payment Link, else /api/checkout, else signup */
window.HH.checkout = function(plan){
  ga('begin_checkout',{plan:plan});
  var link = CONFIG.PAY[plan];
  if(link){ location.href=link; return; }
  fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:plan})})
    .then(function(r){return r.json();})
    .then(function(j){ if(j&&j.url){ location.href=j.url; } else { location.href='signup.html?plan='+encodeURIComponent(plan); } })
    .catch(function(){ location.href='signup.html?plan='+encodeURIComponent(plan); });
};

/* ------------------------------------------------------------------ */
/* SHARED UI: nav, footer, toast, ticker, reveal                       */
/* ------------------------------------------------------------------ */
function navHTML(active){
  function a(href,label){ return '<a href="'+href+'"'+(active===label?' style="color:var(--hi)"':'')+'>'+label+'</a>'; }
  var right = Auth.signedIn()
    ? '<a class="btn btn-ink btn-sm" href="dashboard.html">Dashboard</a>'
    : '<a class="btn btn-out btn-sm" href="login.html">Log in</a><a class="btn btn-hi btn-sm" href="start.html">Start free</a>';
  return '<nav><div class="wrap nav">'+
    '<a class="brand" href="index.html"><span class="mk">⛏</span>HardHat</a>'+
    '<div class="navlinks">'+a('jobs.html','Jobs')+a('roadmap.html','Roadmap')+a('pay.html','Pay')+a('directory.html','Agencies')+a('pricing.html','Pricing')+'</div>'+
    '<div class="navr">'+right+'</div>'+
    '</div></nav>';
}
function footHTML(){
  return '<footer><div class="wrap foot">'+
    '<div style="max-width:260px"><div class="brand" style="margin-bottom:10px"><span class="mk">⛏</span>HardHat</div>'+
    '<p>The no-degree path to high-paying offshore & trades work. Find the job, get the tickets, get hired.</p></div>'+
    '<div class="fcol"><h5>Explore</h5><a href="jobs.html">Job board</a><a href="roadmap.html">Ticket roadmap</a><a href="pay.html">Pay explorer</a><a href="directory.html">Agencies</a></div>'+
    '<div class="fcol"><h5>Product</h5><a href="start.html">Rig-Ready assessment</a><a href="cv.html">Offshore CV builder</a><a href="pricing.html">Pricing</a><a href="dashboard.html">Dashboard</a></div>'+
    '<div class="fcol"><h5>Company</h5><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="mailto:hello@hardhatjobs.co">Contact</a></div>'+
    '</div><div class="wrap" style="margin-top:28px;font-size:12px;color:var(--faint)">© '+2026+' HardHat. Not affiliated with named operators or agencies — links are informational. Work offshore and in the trades carries real risk; always follow certified safety training.</div></footer>';
}
window.HH.mountChrome = function(active){
  var n=document.getElementById('nav'); if(n) n.innerHTML=navHTML(active);
  var f=document.getElementById('foot'); if(f) f.innerHTML=footHTML();
  initReveal();
};
window.HH.toast = function(msg){
  var t=document.getElementById('hhToast');
  if(!t){ t=document.createElement('div'); t.id='hhToast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('on');
  clearTimeout(t._h); t._h=setTimeout(function(){ t.classList.remove('on'); },2600);
};
function initReveal(){
  var els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ els.forEach(function(e){e.classList.add('in');}); return; }
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }); },{threshold:.12});
  els.forEach(function(e){ io.observe(e); });
}
/* social-proof ticker */
var TICK=['Deckhand hired in Louisiana – $58k','Roughneck got BOSIET-ready in 9 days','FIFO operator signed – $95k, WA','Wind tech landed first offshore rota','Welder passed 6G – $105k pipeline job'];
window.HH.mountTicker=function(){
  var i=0; var el=document.createElement('div'); el.className='ticker';
  el.innerHTML='<span class="dot"></span><span id="tkt"></span>';
  document.body.appendChild(el);
  function cyc(){ document.getElementById('tkt').textContent=TICK[i%TICK.length]; i++; }
  cyc(); setInterval(function(){ el.style.opacity=0; setTimeout(function(){cyc();el.style.opacity=1;},300); },4200);
};

/* fmt helper */
window.HH.fmt = function(n){ return '$'+Number(n).toLocaleString(); };

})();
