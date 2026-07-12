/* HardHat — shared client engine (vanilla JS, no build step) */
(function(){
'use strict';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */
var CONFIG = {
  BRAND: 'HardHat',
  GA_MEASUREMENT_ID: '',              // set to enable GA4
  GOOGLE_CLIENT_ID: '',               // set to enable real "Continue with Google"
  SUPABASE_URL: 'https://ossyctgqycfkcdcncpgg.supabase.co',   // durable lead capture (Supabase REST)
  SUPABASE_KEY: 'sb_publishable_GQGwqejtKqPBwUXOQe0E0w_d4iHupij', // publishable key (safe in client)
  // Stripe Payment Links (fastest path). Leave '' to use /api/checkout.
  // One-time plans (no subscription). Add a Stripe Payment Link per tier; '' = graceful signup fallback.
  PAY: { basic:'', pro:'' }
};
window.HH_CONFIG = CONFIG;

/* GA4 (only if configured AND the visitor accepted analytics cookies) */
function ga(ev, params){
  try{
    if(get('consent') !== 'all') return;     // GDPR: no analytics before opt-in
    if(window.gtag) window.gtag('event', ev, params||{});
  }catch(e){}
}
window.hhTrack = ga;

/* Durable lead capture -> Supabase (best-effort, never blocks the UI) */
function saveLead(){
  try{
    var url = CONFIG.SUPABASE_URL, key = CONFIG.SUPABASE_KEY;
    if(!url || !key) return;
    var u = get('user') || {}, ik = get('intake') || {};
    if(!u.email) return;
    fetch(url.replace(/\/$/,'') + '/rest/v1/hardhat_leads', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'apikey':key, 'Authorization':'Bearer '+key, 'Prefer':'return=minimal' },
      body: JSON.stringify({
        email: u.email, name: u.name || '',
        sector: ik.sector || null, experience: ik.experience || null,
        plan: get('plan','free'), source: (typeof window!=='undefined' && window.location ? window.location.pathname : ''),
        payload: ik
      })
    }).catch(function(){});
  }catch(e){}
}
window.HH_saveLead = saveLead;

/* Durable application capture -> Supabase (best-effort, never blocks the UI).
   Fired when a Pro user registers for a job so there is a real record to follow up. */
function saveApplication(job){
  try{
    var url = CONFIG.SUPABASE_URL, key = CONFIG.SUPABASE_KEY;
    if(!url || !key || !job) return;
    var u = get('user') || {};
    if(!u.email) return;
    fetch(url.replace(/\/$/,'') + '/rest/v1/hardhat_applications', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'apikey':key, 'Authorization':'Bearer '+key, 'Prefer':'return=minimal' },
      body: JSON.stringify({
        email: u.email, name: u.name || '',
        job_id: job.id || null, title: job.t || job.title || '', company: job.co || job.company || '',
        sector: job.sec || null, location: job.loc || job.location || '',
        agency: job.ag || null, plan: get('plan','free'),
        source: (typeof window!=='undefined' && window.location ? window.location.pathname : '')
      })
    }).catch(function(){});
  }catch(e){}
}
window.HH_saveApplication = saveApplication;

/* ------------------------------------------------------------------ */
/* SECTORS — the 8 verticals                                           */
/* ------------------------------------------------------------------ */
var SECTORS = [
  { id:'oil',    icon:'🛢️', name:'Offshore Oil & Gas', blurb:'Roughneck, roustabout, floorhand, derrickhand on rigs & platforms.', pay:'$70k–$165k', rota:'2 on / 3 off', noexp:true },
  { id:'wind',   icon:'🌬️', name:'Offshore Wind',       blurb:'GWO-certified turbine techs building & maintaining wind farms.',      pay:'$65k–$140k', rota:'2 on / 2 off', noexp:true },
  { id:'diving', icon:'🤿', name:'Commercial Diving',    blurb:'Air & saturation divers, tenders — underwater welding & inspection.', pay:'$65k–$250k', rota:'project',     noexp:false },
  { id:'marine', icon:'⚓', name:'Merchant Marine',      blurb:'Deckhand, OS/AB, wiper — cargo ships, tugs, supply vessels.',        pay:'$58k–$130k', rota:'28 on / 28 off', noexp:true },
  { id:'mining', icon:'⛏️', name:'FIFO Mining (Canada, US & AU)', blurb:'Fly-in fly-out to Canadian oil-sands camps, US mines or Australian sites — flights, meals and camp usually covered. Operators, labourers & haul-truck drivers.', pay:'$70k–$180k', rota:'14/7 · 6/6 · 2/1 (camp/FIFO)', noexp:true },
  { id:'weld',   icon:'🔥', name:'Pipeline / Welding',   blurb:'Structural & pipeline welders, riggers, fabricators.',               pay:'$68k–$160k', rota:'project',     noexp:false },
  { id:'wtt',    icon:'⚡', name:'Wind Turbine Tech',    blurb:'Onshore turbine service techs — climb, service, fault-find.',        pay:'$58k–$105k',  rota:'rota',       noexp:true },
  { id:'cdl',    icon:'🚛', name:'Hazmat / CDL Haul',    blurb:'Long-haul, tanker & hazmat drivers — oilfield & heavy freight.',     pay:'$72k–$135k', rota:'weeks out',  noexp:true }
];
window.HH_SECTORS = SECTORS;
function sector(id){ for(var i=0;i<SECTORS.length;i++) if(SECTORS[i].id===id) return SECTORS[i]; return null; }
/* sector → representative photo (reused across the site for photo tiles/bands) */
window.HH_SECTOR_IMG = {
  oil:'img/rig.jpg', wind:'img/wind.jpg', diving:'img/diving.jpg', marine:'img/rig-sea.jpg',
  mining:'img/mining.jpg', weld:'img/welder.jpg', wtt:'img/wind.jpg', cdl:'img/rig.jpg'
};

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
  oil:   { entry:'$70k', exp:'$165k', day:'$250–$650/day', rota:'2 wk on / 3 wk off', tax:false, note:'Day-rate roles; overtime common offshore.' },
  wind:  { entry:'$65k', exp:'$140k', day:'$300–$550/day', rota:'2 on / 2 off',       tax:false, note:'GWO tickets open EU + US offshore wind.' },
  diving:{ entry:'$65k', exp:'$250k', day:'$450–$1,600/day', rota:'project-based',    tax:false, note:'Saturation diving is the top of the pay scale.' },
  marine:{ entry:'$58k', exp:'$130k', day:'$220–$480/day',  rota:'28 on / 28 off',   tax:true,  note:'US mariners may qualify for foreign-earned income exclusion.' },
  mining:{ entry:'$70k', exp:'$180k', day:'$28–$58/hr',  rota:'14/7 · 6/6 · 2/1 (camp/FIFO)', tax:false, note:'Canada (oil sands), US & Australia. Camp, flights & meals usually covered on top.' },
  weld:  { entry:'$68k', exp:'$160k', day:'$32–$78/hr',     rota:'project / shutdown', tax:false, note:'Certified 6G pipe welders earn the most.' },
  wtt:   { entry:'$58k', exp:'$105k', day:'$30–$55/hr',     rota:'rota + travel',      tax:false, note:'Traveling techs get per-diem on top.' },
  cdl:   { entry:'$72k', exp:'$135k', day:'$0.65–$0.95/mi', rota:'weeks out',          tax:false, note:'Oilfield & hazmat pays a premium over dry van.' }
};
window.HH_PAY = PAY;

/* ------------------------------------------------------------------ */
/* DEMAND — illustrative industry estimates (labeled "est." in UI)     */
/* ------------------------------------------------------------------ */
var DEMAND = {
  oil:    { open:4200, growth:'+12%' },
  wind:   { open:3800, growth:'+31%' },
  diving: { open:900,  growth:'+9%'  },
  marine: { open:5100, growth:'+7%'  },
  mining: { open:6400, growth:'+15%' },
  weld:   { open:7300, growth:'+11%' },
  wtt:    { open:2600, growth:'+28%' },
  cdl:    { open:9100, growth:'+6%'  }
};
window.HH_DEMAND = DEMAND;
window.HH_DEMAND_TOTAL = 39400; // est. open roles across sectors

/* ------------------------------------------------------------------ */
/* LOCATIONS — worldwide hubs (est. open roles)                        */
/* ------------------------------------------------------------------ */
var LOCATIONS = [
  { id:'northsea', name:'North Sea', flag:'🇬🇧🇳🇴', hub:'Aberdeen · Stavanger', sectors:['oil','wind','diving'], open:5200 },
  { id:'gom',      name:'Gulf of Mexico', flag:'🇺🇸', hub:'Houston · New Orleans', sectors:['oil','diving','marine'], open:6100 },
  { id:'me',       name:'Middle East', flag:'🇦🇪🇶🇦', hub:'Dubai · Doha · Dammam', sectors:['oil','weld','diving'], open:4800 },
  { id:'wafrica',  name:'West Africa', flag:'🇳🇬🇦🇴', hub:'Lagos · Luanda', sectors:['oil','diving','marine'], open:2400 },
  { id:'ausfifo',  name:'Australia (FIFO)', flag:'🇦🇺', hub:'Perth · Pilbara · QLD', sectors:['mining','weld','cdl'], open:7200 },
  { id:'brazil',   name:'Brazil — Santos Basin', flag:'🇧🇷', hub:'Rio · Macaé', sectors:['oil','diving'], open:1900 },
  { id:'seasia',   name:'Southeast Asia', flag:'🇸🇬🇲🇾', hub:'Singapore · Batam', sectors:['marine','oil','weld'], open:3300 },
  { id:'guyana',   name:'Guyana', flag:'🇬🇾', hub:'Georgetown', sectors:['oil','marine'], open:1200 },
  { id:'useast',   name:'US East Coast Wind', flag:'🇺🇸', hub:'NJ · MA · VA', sectors:['wind','wtt','marine'], open:2800 },
  { id:'caspian',  name:'Caspian', flag:'🇰🇿🇦🇿', hub:'Baku · Atyrau', sectors:['oil','weld'], open:1100 },
  { id:'latam',    name:'Latin America', flag:'🇲🇽🇨🇴🇨🇱', hub:'Ciudad del Carmen · Antofagasta', sectors:['oil','marine','mining','weld'], open:1600 },
  { id:'iberia',   name:'Iberia & Canary Islands', flag:'🇪🇸', hub:'Las Palmas · Tarragona', sectors:['marine','oil','wind','weld'], open:900 }
];
window.HH_LOCATIONS = LOCATIONS;
function location(id){ for(var i=0;i<LOCATIONS.length;i++) if(LOCATIONS[i].id===id) return LOCATIONS[i]; return null; }

/* ------------------------------------------------------------------ */
/* COMPANIES — real operators/employers (logos via CDN + text fallback)*/
/* Independent platform — NOT affiliated; logos are their trademarks.  */
/* ------------------------------------------------------------------ */
var COMPANIES = [
  { name:'Shell', domain:'shell.com' }, { name:'BP', domain:'bp.com' },
  { name:'Equinor', domain:'equinor.com' }, { name:'TotalEnergies', domain:'totalenergies.com' },
  { name:'Chevron', domain:'chevron.com' }, { name:'ExxonMobil', domain:'exxonmobil.com' },
  { name:'Ørsted', domain:'orsted.com' }, { name:'Vestas', domain:'vestas.com' },
  { name:'Siemens Gamesa', domain:'siemensgamesa.com' }, { name:'Maersk', domain:'maersk.com' },
  { name:'Halliburton', domain:'halliburton.com' }, { name:'SLB', domain:'slb.com' },
  { name:'Baker Hughes', domain:'bakerhughes.com' }, { name:'Transocean', domain:'deepwater.com' },
  { name:'Saipem', domain:'saipem.com' }, { name:'Subsea7', domain:'subsea7.com' },
  { name:'TechnipFMC', domain:'technipfmc.com' }, { name:'Aker Solutions', domain:'akersolutions.com' },
  { name:'Fugro', domain:'fugro.com' }, { name:'Petrofac', domain:'petrofac.com' },
  { name:'BHP', domain:'bhp.com' }, { name:'Rio Tinto', domain:'riotinto.com' },
  { name:'Fortescue', domain:'fortescue.com' }, { name:'Wood', domain:'woodplc.com' }
];
window.HH_COMPANIES = COMPANIES;

/* ------------------------------------------------------------------ */
/* CREWING AGENCIES / OPERATORS directory                              */
/* ------------------------------------------------------------------ */
var AGENCIES = [
  { sector:'oil',    name:'Airswift',          type:'Global energy staffing',   region:'Global',    url:'https://www.airswift.com' },
  { sector:'oil',    name:'Orion Group',       type:'Oil & gas recruitment',    region:'UK/Global', url:'https://www.orionjobs.com' },
  { sector:'oil',    name:'NES Fircroft',      type:'Energy manpower',          region:'Global',    url:'https://www.nesfircroft.com' },
  { sector:'wind',   name:'Taylor Hopkinson',  type:'Renewables recruitment',   region:'Global',    url:'https://www.taylorhopkinson.com' },
  { sector:'wind',   name:'Airswift Renewables',type:'Offshore wind staffing',  region:'EU/US',     url:'https://www.airswift.com' },
  { sector:'diving', name:'Faststream',        type:'Maritime & subsea',        region:'Global',    url:'https://www.faststream.com' },
  { sector:'diving', name:'Subsea 7 careers',  type:'Subsea & diving operator', region:'Global',    url:'https://www.subsea7.com/en/careers.html' },
  { sector:'marine', name:'Crowley Maritime',  type:'US vessel operator',       region:'US',        url:'https://www.crowley.com/careers' },
  { sector:'marine', name:'Faststream Marine', type:'Merchant fleet crewing',   region:'Global',    url:'https://www.faststream.com' },
  { sector:'mining', name:'Hays Mining',       type:'Mining recruitment',       region:'AU/Global', url:'https://www.hays.com.au' },
  { sector:'mining', name:'WorkPac',           type:'FIFO labour hire',         region:'Australia', url:'https://www.workpac.com' },
  { sector:'mining', name:'Airswift (Canada)', type:'No-experience FIFO stream', region:'Canada',   url:'https://www.airswift.com' },
  { sector:'mining', name:'The Bouchier Group',type:'Oil-sands camp & labour',  region:'Canada',    url:'https://www.bouchier.ca' },
  { sector:'mining', name:'PTW Energy Services',type:'Trades & apprentice crews',region:'Canada',   url:'https://www.ptwenergy.com' },
  { sector:'weld',   name:'Aerotek',           type:'Skilled trades staffing',  region:'US',        url:'https://www.aerotek.com' },
  { sector:'weld',   name:'Airswift',          type:'Fabrication & construction',region:'Global',   url:'https://www.airswift.com' },
  { sector:'wtt',    name:'Taylor Hopkinson',  type:'Wind tech staffing',       region:'Global',    url:'https://www.taylorhopkinson.com' },
  { sector:'cdl',    name:'Aerotek / Actalent',type:'Driver & oilfield staffing',region:'US',       url:'https://www.aerotek.com' },
  { sector:'cdl',    name:'Roehl Transport',   type:'CDL carrier (paid training)',region:'US',      url:'https://www.roehl.jobs' }
];
window.HH_AGENCIES = AGENCIES;

/* ------------------------------------------------------------------ */
/* SEED JOBS (curated; live fetch can augment)                         */
/* ------------------------------------------------------------------ */
var JOBS = [
  { id:'j1', title:'Roustabout (No Experience)', co:'Shell', logo:'shell.com', sector:'oil', icon:'🛢️', loc:'Gulf of Mexico', locId:'gom', rota:'14/14', pay:'$74,000', payn:74000, noexp:true, tickets:['bosiet','ogukmed'] },
  { id:'j2', title:'Floorhand / Roughneck', co:'BP', logo:'bp.com', sector:'oil', icon:'🛢️', loc:'North Sea, UK', locId:'northsea', rota:'2 on / 3 off', pay:'$92,000', payn:92000, noexp:true, tickets:['bosiet','mist'] },
  { id:'j3', title:'GWO Wind Turbine Technician', co:'Ørsted', logo:'orsted.com', sector:'wind', icon:'🌬️', loc:'East Coast, US', locId:'useast', rota:'2 on / 2 off', pay:'$86,000', payn:86000, noexp:true, tickets:['gwobst','huet'] },
  { id:'j4', title:'Trainee Wind Tech', co:'Vestas', logo:'vestas.com', sector:'wtt', icon:'⚡', loc:'Texas, US', locId:'gom', rota:'rota + travel', pay:'$61,000', payn:61000, noexp:true, tickets:['gwoheights'] },
  { id:'j5', title:'Deckhand / OS', co:'Maersk', logo:'maersk.com', sector:'marine', icon:'⚓', loc:'US Gulf & Coastwise', locId:'gom', rota:'28/28', pay:'$68,000', payn:68000, noexp:true, tickets:['stcw','twicm'] },
  { id:'j6', title:'Diver Tender / Trainee', co:'Subsea7', logo:'subsea7.com', sector:'diving', icon:'🤿', loc:'Louisiana, US', locId:'gom', rota:'project', pay:'$66,000', payn:66000, noexp:false, tickets:['dmt','divemed'] },
  { id:'j7', title:'FIFO Haul Truck Operator', co:'BHP', logo:'bhp.com', sector:'mining', icon:'⛏️', loc:'Pilbara, WA, Australia', locId:'ausfifo', rota:'2 on / 1 off', pay:'$118,000', payn:118000, noexp:true, tickets:['induction','medm'] },
  { id:'j8', title:'Process Operator (FIFO)', co:'Rio Tinto', logo:'riotinto.com', sector:'mining', icon:'⛏️', loc:'Queensland, AU', locId:'ausfifo', rota:'8/6', pay:'$104,000', payn:104000, noexp:true, tickets:['induction','medm'] },
  { id:'j9', title:'Pipeline Welder (6G)', co:'Saipem', logo:'saipem.com', sector:'weld', icon:'🔥', loc:'Permian Basin, US', locId:'gom', rota:'project', pay:'$128,000', payn:128000, noexp:false, tickets:['weldcert','osha'] },
  { id:'j10', title:'Structural Welder / Fitter', co:'TechnipFMC', logo:'technipfmc.com', sector:'weld', icon:'🔥', loc:'Houston, US', locId:'gom', rota:'shutdown', pay:'$84,000', payn:84000, noexp:false, tickets:['weldcert','osha'] },
  { id:'j11', title:'Hazmat Tanker Driver', co:'Halliburton', logo:'halliburton.com', sector:'cdl', icon:'🚛', loc:'North Dakota, US', locId:'gom', rota:'weeks out', pay:'$96,000', payn:96000, noexp:true, tickets:['cdla','hazmat'] },
  { id:'j12', title:'Saturation Diver', co:'Subsea7', logo:'subsea7.com', sector:'diving', icon:'🤿', loc:'West Africa (offshore)', locId:'wafrica', rota:'28-day sat', pay:'$210,000', payn:210000, noexp:false, tickets:['dmt','divemed'] },
  { id:'j13', title:'Roustabout — Platform', co:'Equinor', logo:'equinor.com', sector:'oil', icon:'🛢️', loc:'Norwegian Cont. Shelf', locId:'northsea', rota:'2 on / 4 off', pay:'$98,000', payn:98000, noexp:true, tickets:['bosiet','ogukmed','mist'] },
  { id:'j14', title:'Able Seaman (AB)', co:'Maersk', logo:'maersk.com', sector:'marine', icon:'⚓', loc:'Singapore', locId:'seasia', rota:'28/14', pay:'$88,000', payn:88000, noexp:false, tickets:['stcw','mmc','twicm'] },
  { id:'j15', title:'Offshore Wind — Cable Puller', co:'Siemens Gamesa', logo:'siemensgamesa.com', sector:'wind', icon:'🌬️', loc:'Northeast US', locId:'useast', rota:'project', pay:'$79,000', payn:79000, noexp:true, tickets:['gwobst'] },
  { id:'j16', title:'CDL Driver — Frac Sand', co:'SLB', logo:'slb.com', sector:'cdl', icon:'🚛', loc:'Texas, US', locId:'gom', rota:'home weekly', pay:'$82,000', payn:82000, noexp:true, tickets:['cdla'] },
  { id:'j17', title:'Roustabout — Jack-up Rig', co:'Transocean', logo:'deepwater.com', sector:'oil', icon:'🛢️', loc:'Dubai, UAE', locId:'me', rota:'28/28', pay:'$105,000', payn:105000, noexp:true, tickets:['bosiet','mist'] },
  { id:'j18', title:'Welder — Offshore Fabrication', co:'Petrofac', logo:'petrofac.com', sector:'weld', icon:'🔥', loc:'Doha, Qatar', locId:'me', rota:'roster', pay:'$112,000', payn:112000, noexp:false, tickets:['weldcert','osha'] },
  { id:'j19', title:'ROV Trainee / Pilot Tech', co:'Fugro', logo:'fugro.com', sector:'diving', icon:'🤿', loc:'Aberdeen, UK', locId:'northsea', rota:'project', pay:'$72,000', payn:72000, noexp:true, tickets:['bosiet'] },
  { id:'j20', title:'Deck Crew — FPSO', co:'SBM / Guyana', logo:'exxonmobil.com', sector:'marine', icon:'⚓', loc:'Guyana (offshore)', locId:'guyana', rota:'28/28', pay:'$94,000', payn:94000, noexp:true, tickets:['stcw'] },
  { id:'j21', title:'FIFO Trades Assistant', co:'Fortescue', logo:'fortescue.com', sector:'mining', icon:'⛏️', loc:'Pilbara, AU', locId:'ausfifo', rota:'2/1', pay:'$99,000', payn:99000, noexp:true, tickets:['induction','medm'] },
  { id:'j22', title:'Offshore Wind Technician', co:'Ørsted', logo:'orsted.com', sector:'wind', icon:'🌬️', loc:'North Sea, DE/UK', locId:'northsea', rota:'2 on / 2 off', pay:'$102,000', payn:102000, noexp:false, tickets:['gwobst','huet','offmed'] },
  { id:'j23', title:'Drilling Roughneck', co:'Chevron', logo:'chevron.com', sector:'oil', icon:'🛢️', loc:'Santos Basin, Brazil', locId:'brazil', rota:'14/21', pay:'$96,000', payn:96000, noexp:true, tickets:['bosiet','ogukmed'] },
  { id:'j24', title:'Maintenance Welder — Shutdown', co:'Wood', logo:'woodplc.com', sector:'weld', icon:'🔥', loc:'Rotterdam, NL', locId:'northsea', rota:'shutdown', pay:'$90,000', payn:90000, noexp:false, tickets:['weldcert','osha'] }
];
// short job descriptions (shown on the listing + modal)
var JOBDESC = {
  j1:'Deck crew on a drilling rig: cleaning, moving equipment and helping the crew. No experience needed, full training on the job.',
  j2:'Work the drill floor handling pipe and machinery on a North Sea platform. Physical, well-paid, 2 weeks on / 3 off.',
  j3:'Service and repair offshore wind turbines. GWO-certified techs climb, inspect and fix. Trades background helps, not required.',
  j4:'Entry-level onshore wind tech. Learn to service turbines with paid training and travel across sites.',
  j5:'Deckhand on supply and support vessels: mooring, cargo and deck maintenance. STCW ticket gets you started.',
  j6:'Support commercial divers from the surface as a tender, the first step toward becoming a diver yourself.',
  j7:'Drive haul trucks moving ore on a remote FIFO mine site. Camp, flights and meals covered. No experience needed.',
  j8:'Run processing plant equipment on a FIFO roster. Steady shifts, strong pay, full site training provided.',
  j9:'Certified 6G pipe welder for high-pressure pipeline work. Top-tier pay for qualified hands.',
  j10:'Structural welding and fitting in a fabrication yard. Steady project work with overtime.',
  j11:'Haul hazmat and frac fluids for oilfield operators. CDL-A plus hazmat endorsement required.',
  j12:'Saturation diving on deepwater projects: the top of the pay scale for experienced commercial divers.',
  j13:'Roustabout on a fixed platform: general labour, maintenance and deck work on a 2-on / 4-off rota.',
  j14:'Able Seaman on ocean-going vessels handling watch, cargo and deck duties. Credential and sea time required.',
  j15:'Pull and terminate subsea cables on offshore wind installs. GWO basic safety gets you on the boat.',
  j16:'Haul frac sand to well sites, home most weekends. CDL-A required, oilfield pays a premium.',
  j17:'Roustabout on a jack-up rig in the Gulf. Entry-level deck work with international rotation.',
  j18:'Offshore fabrication welder on major energy projects in Qatar. Certified welders on strong rosters.',
  j19:'Trainee ROV pilot tech: launch, pilot and maintain remote subsea vehicles. Fast-growing, well-paid path.',
  j20:'Deck crew on an FPSO producing offshore Guyana, one of the fastest-growing oil regions in the world.',
  j21:'Trades assistant supporting maintenance crews on a Pilbara mine. Entry-level with a clear path up.',
  j22:'Experienced offshore wind technician on North Sea farms. GWO + medical required, excellent day rates.',
  j23:'Drilling roughneck in Brazil’s Santos Basin. Physical rig work with international rotation.',
  j24:'Maintenance welder on refinery and plant shutdowns. Short, intense, high-paying project work.'
};
// enrich jobs with Woo-style display fields (type / level / posted / desc)
JOBS.forEach(function(j,i){
  j.type = /shutdown|project/i.test(j.rota) ? 'Contract' : (/\/|on |roster|rota/i.test(j.rota) ? 'Rotational' : 'Full-time');
  j.level = j.noexp ? 'Entry level' : 'Experienced';
  j.posted = ['2h','5h','9h','14h','1d','1d','2d','3d','4d','5d','6d','1w'][i % 12];
  j.desc = JOBDESC[j.id] || '';
});
window.HH_JOBS = JOBS;

/* ------------------------------------------------------------------ */
/* PROVIDERS — accredited training providers per ticket (REAL links)   */
/* Shown free on the roadmap ("Where to get it →").                    */
/* ------------------------------------------------------------------ */
var PROVIDERS = {
  bosiet:   [{name:'OPITO', url:'https://opito.com'},{name:'RelyOn Nutec', url:'https://www.relyonnutec.com'},{name:'Survivex', url:'https://www.survivex.com'}],
  ogukmed:  [{name:'OEUK / OGUK medical providers', url:'https://oeuk.org.uk'}],
  mist:     [{name:'OPITO (MIST)', url:'https://opito.com'}],
  rigpass:  [{name:'SafeGulf / SafeLandUSA', url:'https://www.safelandusa.org'}],
  twic:     [{name:'TSA Universal Enrollment', url:'https://universalenroll.dhs.gov'}],
  gwobst:   [{name:'Global Wind Organisation', url:'https://www.globalwindorg.org'},{name:'Maersk Training', url:'https://www.maersktraining.com'},{name:'RelyOn Nutec', url:'https://www.relyonnutec.com'}],
  gwobtt:   [{name:'Global Wind Organisation', url:'https://www.globalwindorg.org'}],
  huet:     [{name:'RelyOn Nutec', url:'https://www.relyonnutec.com'},{name:'Survivex', url:'https://www.survivex.com'}],
  offmed:   [{name:'OEUK / ENG1 providers', url:'https://oeuk.org.uk'}],
  gwoheights:[{name:'Global Wind Organisation', url:'https://www.globalwindorg.org'}],
  wttmed:   [{name:'Occupational health / climb medical', url:'https://oeuk.org.uk'}],
  stcw:     [{name:'MITAGS', url:'https://www.mitags.org'},{name:'MPT Maritime', url:'https://www.mptusa.com'}],
  mmc:      [{name:'USCG National Maritime Center', url:'https://www.dco.uscg.mil/nmc'}],
  twicm:    [{name:'TSA Universal Enrollment', url:'https://universalenroll.dhs.gov'}],
  marmed:   [{name:'USCG-approved medical examiners', url:'https://www.dco.uscg.mil/nmc'}],
  dmt:      [{name:'CDA Technical Institute', url:'https://www.commercialdivingacademy.com'},{name:'The Underwater Centre', url:'https://www.theunderwatercentre.com'}],
  divemed:  [{name:'ADCI dive-medical directory', url:'https://www.adc-int.org'}],
  weldcert: [{name:'American Welding Society (AWS)', url:'https://www.aws.org'}],
  osha:     [{name:'OSHA Outreach training', url:'https://www.osha.gov/training'}],
  rigging:  [{name:'NCCCO rigger certification', url:'https://www.nccco.org'}],
  cdla:     [{name:'FMCSA Training Provider Registry', url:'https://tpr.fmcsa.dot.gov'}],
  hazmat:   [{name:'FMCSA hazmat endorsement', url:'https://www.fmcsa.dot.gov'}],
  dotmed:   [{name:'FMCSA National Registry', url:'https://nationalregistry.fmcsa.dot.gov'}],
  induction:[{name:'RIIWHS / Standard 11 providers', url:'https://training.gov.au'}],
  medm:     [{name:'Pre-employment medical clinics', url:'https://training.gov.au'}],
  wc:       [{name:'Working at heights / confined space RTOs', url:'https://training.gov.au'}]
};
window.HH_PROVIDERS = PROVIDERS;

/* ------------------------------------------------------------------ */
/* BLOG — SEO / guidance articles                                      */
/* ------------------------------------------------------------------ */
var BLOG = [
  { slug:'highest-paying-no-degree-jobs-2026', tag:'Guide', date:'2026-06-28', read:'7 min',
    title:'The 8 Highest-Paying Jobs You Can Get With No Degree in 2026',
    excerpt:'Offshore rigs, wind, diving and FIFO mining routinely pay $80k–$200k+ with zero degree required. Here’s the honest breakdown of pay, tickets and how to get in.',
    body:['Forget the myth that big money needs a four-year degree. Across offshore energy, maritime and heavy industry, employers hire on <b>safety tickets, medicals and attitude</b> — not diplomas.',
      'Here’s what the eight no-degree sectors pay and what it takes to start:',
      'LIST:Offshore Oil &amp; Gas — $70k–$165k. Ticket: BOSIET + offshore medical.|Commercial Diving — $65k–$250k. Ticket: commercial dive school + diver medical.|FIFO Mining — $88k–$180k. Ticket: site induction + pre-employment medical.|Pipeline / Structural Welding — $68k–$160k. Ticket: 6G/AWS weld cert + OSHA.|Offshore Wind — $65k–$140k. Ticket: GWO Basic Safety Training.|Merchant Marine — $58k–$130k. Ticket: STCW + credential.|Hazmat / CDL Haul — $72k–$135k. Ticket: CDL-A + hazmat/tanker.|Wind Turbine Tech — $58k–$105k. Ticket: GWO working-at-heights.',
      'The barrier isn’t talent — it’s knowing the exact ticket for the path you want, and who actually hires. That’s the entire reason we built HardHat’s Rig-Ready assessment and roadmap tracker.',
      'CTA'] },
  { slug:'offshore-oil-rig-job-no-experience', tag:'How-to', date:'2026-06-20', read:'8 min',
    title:'How to Get an Offshore Oil Rig Job With No Experience',
    excerpt:'A step-by-step route to a roustabout or roughneck role — the tickets, the medical, and how to actually reach the hiring crewing agencies.',
    body:['Entry-level offshore roles — roustabout and floorhand — are designed for people with no oil-and-gas background. What they require is proof you can be trusted on a dangerous worksite.',
      'The path in four steps:',
      'LIST:Get your BOSIET (offshore survival + helicopter escape) — 3 days.|Pass an offshore medical (OGUK/OEUK or equivalent).|Build an offshore-format CV: tickets, medicals and reliability first.|Apply through crewing agencies and operators — not general job boards.',
      'Most people fail at step 4: they apply on LinkedIn and hear nothing, because these jobs are filled by specialist crewing agencies. Our directory lists exactly who to contact per region.',
      'CTA'] },
  { slug:'bosiet-huet-oguk-explained', tag:'Tickets', date:'2026-06-12', read:'6 min',
    title:'BOSIET, HUET & OGUK Medical: The Offshore Tickets Explained',
    excerpt:'What each offshore ticket actually is, what it costs, how long it takes, and which one you need first.',
    body:['Offshore certifications sound like alphabet soup. Here’s what actually matters before your first rig job.',
      'LIST:BOSIET — Basic Offshore Safety Induction &amp; Emergency Training. Includes HUET (helicopter underwater escape). ~$900–$1,400, 3 days. Mandatory.|OGUK/OEUK Medical — offshore fitness exam, valid 2 years. ~$150–$250.|MIST — Minimum Industry Safety Training induction. ~$120–$200.|TWIC — US transport worker ID for Gulf platforms. ~$125.',
      'Get BOSIET and your medical first — they’re what recruiters filter on. The HardHat roadmap tracks every ticket per sector with live costs.',
      'CTA'] },
  { slug:'offshore-wind-gwo-break-in', tag:'Guide', date:'2026-06-05', read:'7 min',
    title:'Offshore Wind Is Booming: How to Break In With GWO',
    excerpt:'Offshore wind is the fastest-growing no-degree sector (+31% demand). Here’s how GWO tickets get you a turbine job.',
    body:['Offshore wind is scaling fast across the North Sea, US East Coast and Asia — and it’s hungry for technicians.',
      'The entry ticket is <b>GWO Basic Safety Training</b>: working at heights, first aid, fire awareness, manual handling and sea survival. Add an offshore medical and you’re eligible for trainee turbine roles.',
      'LIST:GWO Basic Safety Training — ~$1,200–$1,800, 4–5 days.|Offshore/climb medical.|Optional GWO Basic Technical to stand out.',
      'Trade or military background helps but isn’t required. Take the assessment to see wind roles you already qualify for.',
      'CTA'] },
  { slug:'fifo-mining-pay-how-to-get-hired', tag:'How-to', date:'2026-05-27', read:'6 min',
    title:'FIFO Mining Jobs: What They Pay and How to Get Hired',
    excerpt:'Fly-in fly-out mining in Australia pays $88k–$180k with camp, flights and meals covered. Here’s the entry route.',
    body:['FIFO (fly-in fly-out) mining is one of the highest-paying no-degree paths on earth — and camp, flights and meals are usually covered on top of pay.',
      'LIST:Get a site safety induction (Standard 11 / general induction).|Pass a pre-employment medical + drug &amp; alcohol screen.|Apply through labour-hire agencies (WorkPac, Hays and similar).',
      'Haul-truck operator, process operator and trades-assistant roles regularly take people with zero mining experience. The key is the medical and a clean D&amp;A test.',
      'CTA'] },
  { slug:'become-commercial-diver', tag:'Career', date:'2026-05-18', read:'9 min',
    title:'How to Become a Commercial Diver (and Earn $180k+)',
    excerpt:'Commercial and saturation diving sit at the very top of the no-degree pay scale. Here’s the real path and the costs.',
    body:['Commercial diving — underwater welding, inspection and saturation work — can pay $180k–$250k+ at the top end. It’s also the most demanding entry on this list.',
      'LIST:Attend an accredited commercial dive school (ADCI/HSE/IMCA) — $12k–$30k, 3–7 months.|Pass a commercial diving medical (annual).|Start as a tender, progress to air diver, then saturation.',
      'It’s a real investment of time and money, but few no-degree careers pay like saturation diving. Track the exact path in your HardHat roadmap.',
      'CTA'] },
  { slug:'h2s-alive-explained', tag:'Tickets', date:'2026-07-02', read:'5 min',
    title:'H2S Alive: The Ticket You Need Before Any Oil-Sands Job',
    excerpt:'What H2S Alive is, why every Canadian oil-sands and gas site demands it, what it costs and how long it lasts. The first ticket to book.',
    body:['If you want a camp job in the Alberta oil sands, this is the ticket recruiters filter on first. H2S Alive is a one-day course from <b>Energy Safety Canada</b> that teaches you to work safely around hydrogen sulphide — the invisible, deadly gas found on oil-and-gas sites.',
      'Here’s what actually matters:',
      'LIST:One day of training, valid for <b>3 years</b>.|Costs roughly <b>CAD 175–250</b> — you pay for it, not the employer.|Recognised across Alberta, BC, Saskatchewan and most Canadian energy sites.|You cannot set foot on most oil-sands sites without it.',
      'It replaced nothing — it has always been the baseline. Pair it with a CSO (site access orientation) and Standard First Aid and you have the core stack for an entry oil-sands role. Book H2S Alive first: it’s the one that unlocks the rest.',
      'CTA'] },
  { slug:'cso-vs-csts-oil-sands-site-access', tag:'Tickets', date:'2026-06-30', read:'5 min',
    title:'CSO vs CSTS: Which Oil-Sands Site-Access Ticket Do You Need?',
    excerpt:'Common Safety Orientation or CSTS? The two site-access tickets for Canadian oil-sands work, what changed, and which one to book.',
    body:['New to oil-sands work, you’ll hit two acronyms fast: <b>CSO</b> and <b>CSTS</b>. Both are online site-access safety orientations — get one wrong and you can waste money on a ticket a site won’t accept.',
      'LIST:<b>CSO (Common Safety Orientation)</b> — the newer standard for oil-sands site access. Online, ~CAD 90, does not expire. It replaced the old <b>OSSA BSO</b>.|<b>CSTS (Construction Safety Training System)</b> — a broader construction orientation still used on many projects.|Some contractors ask for one, some the other — a few want both.',
      'The safe move: book <b>CSO</b> first (it’s what most oil-sands producers now expect), then add CSTS if a specific contractor or agency asks for it. Always confirm with the crewing agency putting you forward before you pay — requirements shift by site.',
      'CTA'] },
  { slug:'oil-sands-rotations-explained', tag:'Guide', date:'2026-06-26', read:'6 min',
    title:'14/7, 6/6 and Camp Life: Oil-Sands Rotations Explained',
    excerpt:'What FIFO rotations actually mean day to day — 14/7 vs 6/6, camp accommodation, 12-hour shifts, and what your off-swing really looks like.',
    body:['FIFO (fly-in fly-out) pay looks huge until you understand the trade: you’re away from home in a work camp for the on-swing. Knowing the rotation patterns before you apply saves a nasty surprise.',
      'The common patterns:',
      'LIST:<b>14/7</b> — 14 days on site, 7 days home. The classic oil-sands rotation.|<b>6/6</b> — six on, six off; you swap the moment your relief lands.|<b>2/1</b> — two weeks on, one off — more common on remote mining sites.',
      'On the on-swing you live in camp: your own room, meals in the mess, gym and wifi usually included — flights to and from site typically covered on top of pay. Shifts are <b>12 hours</b>, day or night. The off-swing is fully yours: no email, no on-call. It’s real money for real time away, and it isn’t for everyone — but for the right person it beats a five-day commute.',
      'CTA'] },
  { slug:'newfoundland-offshore-jobs', tag:'How-to', date:'2026-06-22', read:'6 min',
    title:'Newfoundland Offshore Oil Jobs: The East-Coast Route In',
    excerpt:'Canada’s offshore isn’t just Alberta. Off Newfoundland, platforms like Hibernia and Hebron hire for offshore roles — here’s the ticket stack and how to get on.',
    body:['When Canadians think oil, they think Alberta oil sands — but the country also runs <b>offshore platforms off Newfoundland</b>: Hibernia, Terra Nova, White Rose and Hebron in the Jeanne d’Arc Basin. It’s true offshore work, with true offshore tickets.',
      'The stack looks more like the North Sea than the oil sands:',
      'LIST:<b>BST / offshore survival</b> (including helicopter underwater escape) to fly to a platform.|An <b>offshore medical</b> — fitness to work at sea.|<b>H2S Alive</b> and site-specific orientations.|Right to work in Canada — these roles go to citizens and PRs in practice.',
      'Hiring runs through the operators and their crewing contractors out of St. John’s, not general job boards. Get your survival ticket and medical sorted, build a Canadian-format offshore CV, and get on the contractors’ books. It’s a smaller market than Alberta — but the pay is strong and the competition thinner if you’re ready.',
      'CTA'] }
];
window.HH_BLOG = BLOG;
function blogPost(slug){ for(var i=0;i<BLOG.length;i++) if(BLOG[i].slug===slug) return BLOG[i]; return null; }

/* ------------------------------------------------------------------ */
/* AUTH + STATE (localStorage) — keys prefixed hh_                     */
/* ------------------------------------------------------------------ */
function get(k, d){ try{ var v=localStorage.getItem('hh_'+k); return v?JSON.parse(v):(d===undefined?null:d);}catch(e){return d===undefined?null:d;} }
function set(k, v){ try{ localStorage.setItem('hh_'+k, JSON.stringify(v)); }catch(e){} }
function del(k){ try{ localStorage.removeItem('hh_'+k); }catch(e){} }

var Auth = {
  user: function(){ return get('user'); },
  signedIn: function(){ return !!get('user'); },
  signup: function(name, email){ var u={name:name||'Crew',email:email||'',ts:Date.now()}; set('user',u); ga('sign_up',{}); saveLead(); return u; },
  login: function(email){ var u=get('user')||{name:'Crew'}; u.email=email||u.email; set('user',u); return u; },
  logout: function(){ del('user'); },
  setPhone: function(phone){ var u=get('user')||{name:'Crew',email:'',ts:Date.now()}; u.phone=phone||''; set('user',u); return u; },
  plan: function(){ return get('plan','free'); },
  setPlan: function(p){ set('plan',p); ga('plan_set',{plan:p}); },
  // one-time tier ladder: 0 free · 1 Basics ($32) · 2 Rig-Ready Pro ($120, flagship) · 3 Done-For-You ($190)
  tier: function(){ var m={basic:1,pro:2,dfy:3}; return m[get('plan','free')] || 0; },
  isPaid: function(){ return this.tier() >= 1; },   // roadmap, cost checklist, unlimited saved jobs
  isPro: function(){ return this.tier() >= 2; },    // apply, agency contacts, CV builder, week-by-week plan, prep
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
/* MULTI-CURRENCY — localizes the number-driven pay surfaces           */
/* Static FX vs USD (illustrative, like the pay figures themselves).   */
/* ------------------------------------------------------------------ */
var FX  = { USD:1, CAD:1.36, AUD:1.52, GBP:0.79, EUR:0.92 };
var SYM = { USD:'$', CAD:'C$', AUD:'A$', GBP:'£', EUR:'€' };
function currency(){
  var c = get('cur');
  if(c && FX[c]) return c;
  try{
    var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone||'');
    if(/Edmonton|Toronto|Winnipeg|Vancouver|Regina|Halifax|St_Johns|Moncton/.test(tz)) return 'CAD';
    if(/^Australia\//.test(tz)) return 'AUD';
    if(tz==='Europe/London') return 'GBP';
    if(/^Europe\//.test(tz)) return 'EUR';
  }catch(e){}
  return 'USD';
}
function setCurrency(c){ if(!FX[c]) c='USD'; set('cur', c); ga('currency_set',{cur:c}); if(window.HH.onCurrency) try{window.HH.onCurrency(c);}catch(e){} }
/* HH.money(70000,{k:true}) -> "C$95k" in the active currency */
function money(usd, o){
  o = o || {};
  var c = o.cur || currency();
  var v = Math.round((Number(usd)||0) * (FX[c]||1));
  var sym = SYM[c]||'$';
  if(o.k){
    var k = v/1000;
    var s = (k>=100 || k===Math.round(k)) ? String(Math.round(k)) : (Math.round(k*10)/10).toString();
    return sym + s + 'k';
  }
  return sym + v.toLocaleString('en-US');
}
/* parse the string pay figures ('$70k','$28–$58/hr','$0.65/mi') -> first USD number */
function usdNum(str){
  if(str==null) return 0;
  if(typeof str==='number') return str;
  var m = String(str).replace(/,/g,'').match(/(\d+(?:\.\d+)?)\s*([kK])?/);
  if(!m) return 0;
  var n = parseFloat(m[1]); if(m[2]) n*=1000;
  return n;
}
/* re-render a '$Nk' string pay figure into the active currency, preserving suffix like '/hr' or '/day' */
function payLoc(str, o){
  if(str==null) return '';
  var s = String(str);
  var c = (o&&o.cur) || currency();
  if(c==='USD') return s;                    // leave native strings untouched for USD
  // ranges like "$28–$58/hr" or "$250–$650/day" or "$70k"
  var suffix = (s.match(/\/(hr|day|mi|wk|week)/i)||[''])[0];
  var nums = s.match(/\$?\d[\d,\.]*\s*[kK]?/g);
  if(!nums) return s;
  var out = nums.map(function(p){
    var hasK = /[kK]/.test(p);
    return money(usdNum(p), {cur:c, k:hasK});
  });
  return out.join('–') + suffix;
}
window.HH.currency = currency;
window.HH.setCurrency = setCurrency;
window.HH.money = money;
window.HH.saveApplication = saveApplication;
window.HH.usdNum = usdNum;
window.HH.payLoc = payLoc;
window.HH.FX = FX; window.HH.SYM = SYM;

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
window.HH.location = location;
window.HH.blogPost = blogPost;

/* ------------------------------------------------------------------ */
/* RECOMMENDATIONS — personalized next steps                           */
/* ------------------------------------------------------------------ */
function recommendations(intake){
  if(!intake) return null;
  var sec = sector(intake.sector) || SECTORS[0];
  var held = intake.tickets || [];
  // next tickets = required, not yet held
  var nextTickets = (TICKETS[intake.sector]||[]).filter(function(t){ return t.req && held.indexOf(t.id)<0; }).slice(0,2);
  // top jobs = same sector, ranked by ticket overlap then pay
  var jobs = JOBS.filter(function(j){ return j.sector===intake.sector; }).map(function(j){
    var need=j.tickets||[]; var have=need.filter(function(t){return held.indexOf(t)>=0;}).length;
    j._score = (need.length?have/need.length:0.5)*100 + (j.noexp&&intake.experience==='none'?10:0);
    return j;
  }).sort(function(a,b){ return (b._score-a._score)||(b.payn-a.payn); }).slice(0,3);
  // best locations for this sector
  var locs = LOCATIONS.filter(function(l){ return l.sectors.indexOf(intake.sector)>=0; }).sort(function(a,b){return b.open-a.open;}).slice(0,3);
  return { sector:sec, nextTickets:nextTickets, jobs:jobs, locations:locs };
}
window.HH.recommendations = recommendations;
window.HH.providers = function(id){ return PROVIDERS[id] || []; };

/* ------------------------------------------------------------------ */
/* PRO PLAN — region-exact recommendation engine                       */
/* Joins intake + pro profile + Certificate Truth Engine (cert-data.js)*/
/* + job data into: exact ticket/medical gaps for the TARGET region,   */
/* an honest right-to-work check, matched jobs, and a hiring plan.     */
/* ------------------------------------------------------------------ */
var EU_CCS=['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','NO','IS','CH'];
var REGIONS = [
  { id:'uk',     name:'North Sea (UK & Norway)',   flag:'🇬🇧', cert:'uk',     locIds:['northsea'], cty:'UK',        pass:['GB','NO'] },
  { id:'eu',     name:'Europe (offshore wind)',    flag:'🇪🇺', cert:'eu',     locIds:['northsea'], cty:'Denmark',   pass:EU_CCS },
  { id:'us',     name:'US Gulf of Mexico',         flag:'🇺🇸', cert:'us',     locIds:['gom'],      cty:'US',        pass:['US'] },
  { id:'useast', name:'US East Coast (wind)',      flag:'🇺🇸', cert:'us',     locIds:['useast'],   cty:'US',        pass:['US'] },
  { id:'au',     name:'Australia (FIFO & offshore)',flag:'🇦🇺', cert:'au',    locIds:['ausfifo'],  cty:'Australia', pass:['AU','NZ'] },
  { id:'canada', name:'Canada (oil sands & FIFO)',  flag:'🇨🇦', cert:'canada', locIds:[],          cty:'Canada',    pass:['CA'] },
  { id:'me',     name:'Middle East',               flag:'🇦🇪', cert:'global', locIds:['me'],       cty:'UAE',       pass:'sponsor' },
  { id:'wafrica',name:'West Africa',               flag:'🌍', cert:'global', locIds:['wafrica'],  cty:'Nigeria',   pass:'sponsor' },
  { id:'brazil', name:'Brazil (Santos Basin)',     flag:'🇧🇷', cert:'global', locIds:['brazil'],   cty:'Brazil',    pass:['BR'] },
  { id:'seasia', name:'Southeast Asia',            flag:'🇸🇬', cert:'global', locIds:['seasia'],   cty:'Singapore', pass:'sponsor' },
  { id:'home',   name:'My own country / nearest hub',flag:'📍', cert:'global', locIds:[],          cty:'',          pass:'home' }
];
window.HH_REGIONS = REGIONS;
function regionById(id){ for(var i=0;i<REGIONS.length;i++) if(REGIONS[i].id===id) return REGIONS[i]; return null; }
window.HH.region = regionById;

/* sector -> Certificate Truth Engine role id */
var CERT_ROLE = { oil:'roustabout', wind:'windtech', wtt:'windtech', mining:'haultruck', marine:'deckhand', weld:'welder6g', diving:'diver', cdl:'driver' };
/* held ticket id -> keyword in matrix requirement strings */
var TK_KEYWORDS = { bosiet:/bosiet/i, ogukmed:/oeuk|oguk/i, mist:/mist/i, gwobst:/gwo basic safety|bst/i, gwobtt:/basic technical|btt/i,
  huet:/huet|water survival/i, offmed:/eng1|offshore.*medical|wind medical/i, stcw:/stcw/i, mmc:/mariner credential|seaman/i,
  twic:/twic/i, twicm:/twic/i, twicd:/twic/i, twicw:/twic/i, twicc:/twic/i, marmed:/seafarer medical/i,
  induction:/standard 11|induction|white card/i, medm:/coal board|pre-employment medical/i, hr:/heavy vehicle|hr \/ hc/i,
  weldcert:/coding test|6g|asme|aws d1/i, osha:/osha/i, rigging:/rigg/i, dmt:/diver qualification|dive school|imca|adci/i,
  divemed:/diving medical/i, gwoheights:/heights|gwo/i, wttmed:/climb medical/i, elec:/high.?voltage|electrical/i,
  cdla:/cdl class a|cdl/i, hazmat:/hazmat/i, dotmed:/dot medical/i, rigpass:/rigpass|safegulf|safeland/i,
  h2salive:/h2s alive/i, cso:/common safety orientation|cso|csts/i, class1:/class 1|class 3/i, sfa:/standard first aid/i, msha:/msha|part 46|part 48/i };

function rtwCheck(regionChoice, passportCc, sectorRtwText){
  var lvl, msg;
  if(regionChoice.pass==='home'){ lvl='ok'; msg='Working in your own country — right to work is not a barrier.'; }
  else if(regionChoice.pass==='sponsor'){ lvl='sponsor'; msg='Roles here are typically contractor-sponsored: possible, but hard for first-timers without experience.'; }
  else if((regionChoice.pass||[]).indexOf(passportCc)>=0){ lvl='ok'; msg='Your passport gives you right to work here — the hardest gate is already cleared.'; }
  else { lvl='warn'; msg='Your passport does not give automatic right to work here, and sponsorship is rare for entry roles.'; }
  // feasible alternatives for a warn
  var alts=[];
  if(lvl==='warn'){
    for(var i=0;i<REGIONS.length;i++){ var r=REGIONS[i];
      if(r.id===regionChoice.id) continue;
      if(r.pass==='home' || r.pass==='sponsor' || (r.pass||[]).indexOf(passportCc)>=0) alts.push(r);
      if(alts.length>=3) break;
    }
  }
  return { level:lvl, msg:msg, matrix:sectorRtwText||'', alts:alts };
}

function proPlan(intake, profile){
  if(!intake || !profile || !profile.region) return null;
  var region = regionById(profile.region); if(!region) return null;
  var C = (typeof window!=='undefined' && window.HH_CERTS) ? window.HH_CERTS : null;
  var held = {}; var doneMap = get('tickets_done',{});
  (intake.tickets||[]).forEach(function(t){ held[t]=1; });
  Object.keys(doneMap).forEach(function(t){ if(doneMap[t]) held[t]=1; });
  var heldIds = Object.keys(held);

  /* region-variant requirements from the matrix (fallback: generic sector list) */
  var roleEntry=null, variant=null;
  if(C){
    var rid=CERT_ROLE[intake.sector];
    for(var i=0;i<C.roles.length;i++) if(C.roles[i].id===rid){ roleEntry=C.roles[i]; break; }
    if(roleEntry){
      for(var j=0;j<roleEntry.regions.length;j++) if(roleEntry.regions[j].r===region.cert){ variant=roleEntry.regions[j]; break; }
      if(!variant) for(var j2=0;j2<roleEntry.regions.length;j2++) if(roleEntry.regions[j2].r==='global'){ variant=roleEntry.regions[j2]; break; }
      if(!variant) variant=roleEntry.regions[0];
    }
  }
  function matched(reqStr){
    for(var k=0;k<heldIds.length;k++){ var re=TK_KEYWORDS[heldIds[k]]; if(re && re.test(reqStr)) return true; }
    return false;
  }
  var reqs=[], medOk = intake.medical==='valid';
  var genericList = TICKETS[intake.sector]||[];
  function costHint(reqStr){
    for(var g=0; g<genericList.length; g++){ var re2=TK_KEYWORDS[genericList[g].id];
      if(re2 && re2.test(reqStr)) return { cost:genericList[g].cost, days:genericList[g].days, provs:PROVIDERS[genericList[g].id]||[] }; }
    return { cost:'', days:'', provs:[] };
  }
  if(variant){
    variant.mandatory.forEach(function(m){ var h=costHint(m); reqs.push({ name:m, done:matched(m), cost:h.cost, days:h.days, provider:h.provs[0]||null }); });
  } else {
    genericList.filter(function(t){return t.req;}).forEach(function(t){
      reqs.push({ name:t.name, done:!!held[t.id], cost:t.cost, days:t.days, provider:(PROVIDERS[t.id]||[])[0]||null });
    });
  }
  var gaps=reqs.filter(function(r){return !r.done;});
  var medical = variant ? variant.medical : 'Work/offshore medical + drug & alcohol screen';
  var rtw = rtwCheck(region, (profile.passport&&profile.passport.cc)||'', variant?variant.rtw:'');

  /* matched jobs in the target region (seed set; catalog on jobs.html) */
  var jobs = JOBS.filter(function(jb){ return jb.sector===intake.sector && (region.locIds.length===0 || region.locIds.indexOf(jb.locId)>=0); }).slice(0,3);
  if(!jobs.length) jobs = JOBS.filter(function(jb){ return jb.sector===intake.sector; }).slice(0,3);

  /* week-by-week hiring plan */
  var ags = AGENCIES.filter(function(a){ return a.sector===intake.sector; });
  var wk=[]; var t0=gaps[0];
  wk.push({ w:'Week 1', h:(t0?('Book '+t0.name):'Book your medical check')+(medOk?'':' + your '+(variant?'region medical':'medical')),
    p:(t0?((t0.days?t0.days+' · ':'')+(t0.cost?t0.cost+' · ':'')+(t0.provider?('via '+t0.provider.name):'accredited providers linked in your roadmap')):('Medical: '+medical)) });
  if(gaps.length>1) wk.push({ w:'Week 1–2', h:'Line up '+gaps.slice(1).map(function(g){return g.name.split('(')[0].trim();}).join(' + '),
    p:'Book these while you wait — most run weekly and can be stacked back-to-back.' });
  wk.push({ w:'Week 2', h:'Offshore CV + register with '+(ags.length||'the right')+' agencies',
    p:'We format your CV the way recruiters scan, then you get on the books of '+(ags.map(function(a){return a.name;}).slice(0,3).join(', ')||'your sector agencies')+'.' });
  wk.push({ w:'Week 3–4', h:'Apply to your matched roles', p:'Apply to every fit in '+region.name+' with our templates; follow up on day 3 — that call is where most first jobs come from.' });
  wk.push({ w:'Week 5–6', h:'Interviews & document checks', p:'Short competency chats + ticket verification. We prep you on exactly what they ask. First-offer window for most entry roles.' });

  var estCost=0; gaps.forEach(function(g){ var m=(g.cost||'').match(/\$([\d,]+)/); if(m) estCost+=parseInt(m[1].replace(/,/g,''),10); });
  return { region:region, variant:variant, role:roleEntry, reqs:reqs, gaps:gaps, medical:medical, medOk:medOk,
    rtw:rtw, jobs:jobs, agencies:ags, weeks:wk, estCost:estCost, verify:(variant&&variant.verify)||[] };
}
window.HH.proPlan = proPlan;
window.HH.proProfile = function(){ return get('pro_profile'); };
window.HH.setProProfile = function(p){ set('pro_profile', p); ga('pro_profile_saved',{region:p&&p.region}); };

/* ------------------------------------------------------------------ */
/* JOB CATALOG — expand compact jobs-data.json rows into job objects   */
/* Shared by jobs.html (full board) and index.html (hiring-now strip). */
/* ------------------------------------------------------------------ */
function countryOf(cityName){ var p=String(cityName||'').split(','); return p[p.length-1].trim(); }
window.HH.countryOf = countryOf;
window.HH.expandCatalog = function(d){
  var icons={}; SECTORS.forEach(function(s){icons[s.id]=s.icon;});
  var out=[];
  for(var i=0;i<d.rows.length;i++){
    var r=d.rows[i], role=d.roles[r[0]], city=d.cities[r[1]], src=d.cos[r[2]];
    var lvl=r[3], typ=r[4], rota=(d.rotas[role.sec]||['rotation'])[r[5]], payn=r[6], pst=r[7];
    out.push({
      id:'c'+i, title:role.t, co:src.n, logo:src.d, viaAgency:!!src.ag,
      sector:role.sec, icon:icons[role.sec]||'🛠', loc:city.n, locId:city.locId,
      cty:countryOf(city.n), fl:city.fl,
      rota:rota, payn:payn, pay:money(payn),
      noexp:!!(role.ne&&lvl===0), level:lvl?'Experienced':'Entry',
      type:['Rotational','Contract','Full-time'][typ]||'Full-time',
      posted:pst+'d', tickets:role.tks
    });
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* AUTH GATE — register (Continue with Google) + paywall               */
/* Everything requires an account. Google is offered after the paywall.*/
/* ------------------------------------------------------------------ */
var GOOG_SVG = '<svg viewBox="0 0 48 48" width="18" height="18" style="flex:none"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.9z"/><path fill="#FBBC05" d="M10.5 28.3c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.1 0 19.9 0 23.7s.9 7.6 2.6 10.8l7.9-6.2z"/><path fill="#34A853" d="M24 47.4c6.3 0 11.7-2.1 15.6-5.7l-7.1-5.5c-2 1.3-4.5 2.1-8.5 2.1-6.3 0-11.7-3.7-13.5-9.1l-7.9 6.1C6.5 42.6 14.6 47.4 24 47.4z"/></svg>';
var _gate = { next:null, mode:'register', plan:'pro' };
function authGate(opts){
  opts = opts || {};
  _gate.next = opts.next || null;
  _gate.mode = opts.mode || 'register';
  _gate.plan = opts.plan || 'pro';
  ga('auth_gate_view', { mode:_gate.mode });
  var pro = _gate.mode === 'pro';
  var m = document.getElementById('gateModal');
  if(!m){ m = document.createElement('div'); m.id='gateModal'; m.className='modal'; document.body.appendChild(m); }
  m.innerHTML =
    '<div class="mbox" style="max-width:430px">'+
      '<span class="mclose" onclick="HH.closeGate()">×</span>'+
      '<div class="popbadge">'+(pro ? 'Unlock · from $32 one-time' : 'Free account')+'</div>'+
      '<h3 class="display" style="font-size:24px;margin:10px 0 6px">'+(opts.title || (pro ? 'Unlock your get-hired plan' : 'Create your free account'))+'</h3>'+
      '<p style="color:var(--muted);font-size:14.5px;margin-bottom:18px">'+(opts.reason || 'Register to continue — it takes 10 seconds and saves your progress.')+'</p>'+
      (pro ? '<ul class="gatelist"><li>Apply to jobs + real agency contacts</li><li>Full ticket roadmap for your region</li><li>Unlimited saved jobs & alerts</li></ul><p class="guarantee" style="text-align:left;margin:0 0 14px">🔒 One-time payment, keep it for good · <span class="hi">800+ jobs found every month</span></p>' : '')+
      '<button class="gbtn" onclick="HH.authGoogle()">'+GOOG_SVG+' Continue with Google</button>'+
      '<div class="ordiv"><span>or</span></div>'+
      '<input class="inp" id="gateEmail" type="email" placeholder="you@email.com" style="margin-bottom:10px" onkeydown="if(event.key===\'Enter\')HH.authEmail()">'+
      '<button class="btn btn-hi btn-block btn-lg" onclick="HH.authEmail()">Continue with email →</button>'+
      '<p style="text-align:center;margin-top:12px;font-size:12px;color:var(--faint)">Free to join.'+(pro ? ' Pick your plan after you sign in.' : ' No spam, unsubscribe anytime.')+'</p>'+
    '</div>';
  m.classList.add('on');
}
function finishGate(){
  HH.closeGate();
  var next = _gate.next, mode = _gate.mode, plan = _gate.plan;
  _gate.next = null;
  if(typeof next === 'function'){ try{ next(); }catch(e){} }
  else if(mode === 'pro'){ window.location.href = 'pricing.html'; }   // let them pick a tier
}
window.HH.closeGate = function(){ var m=document.getElementById('gateModal'); if(m) m.classList.remove('on'); };
function loadGSI(cb){
  if(window.google && window.google.accounts){ cb(); return; }
  var s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true; s.defer=true;
  s.onload=cb; s.onerror=function(){ cb(); }; document.head.appendChild(s);
}
function googleReal(cid){
  loadGSI(function(){
    if(!(window.google && google.accounts && google.accounts.id)){ googleMock(); return; }
    google.accounts.id.initialize({
      client_id: cid,
      callback: function(resp){
        var name='', email='';
        try{ var p=JSON.parse(atob(resp.credential.split('.')[1])); name=p.name||''; email=p.email||''; }catch(e){}
        Auth.signup(name, email); ga('sign_up',{method:'google'}); finishGate();
      }
    });
    google.accounts.id.prompt(function(n){
      if(n.isNotDisplayed && n.isNotDisplayed() || n.isSkippedMoment && n.isSkippedMoment()){ /* user closed one-tap */ }
    });
  });
}
function googleMock(){ Auth.signup('Crew','you@gmail.com'); ga('sign_up',{method:'google'}); HH.toast('Signed in with Google (demo)'); finishGate(); }
window.HH.authGoogle = function(){
  var cid = CONFIG.GOOGLE_CLIENT_ID;
  if(cid){ googleReal(cid); } else { googleMock(); }   // real GSI when a Client ID is configured, else demo account
};
window.HH.authEmail = function(){
  var e = (document.getElementById('gateEmail')||{}).value || '';
  if(!/.+@.+\..+/.test(e)){ HH.toast('Enter a valid email'); return; }
  Auth.signup('', e); ga('sign_up', { method:'email' }); finishGate();
};
window.HH.authGate = authGate;
/* require a signed-in account before running an action */
window.HH.requireAuth = function(next, reason, title){
  if(Auth.signedIn()){ return next(); }
  authGate({ mode:'register', reason:reason, title:title, next:next });
};
/* paywall = pro-mode auth gate (Continue with Google shown here, after the paywall) */
function showPaywall(reason){ authGate({ mode:'pro', reason:reason, plan:'pro' }); }
window.HH.closePaywall = window.HH.closeGate;
window.HH.showPaywall = showPaywall;

/* checkout: prefer Payment Link, else /api/checkout, else signup */
window.HH.checkout = function(plan){
  ga('begin_checkout',{plan:plan});
  var link = CONFIG.PAY[plan];
  if(link){ window.location.href=link; return; }
  function fallback(){ window.location.href = Auth.signedIn() ? 'dashboard.html' : ('signup.html?plan='+encodeURIComponent(plan)); }
  fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:plan})})
    .then(function(r){return r.json();})
    .then(function(j){ if(j&&j.url){ window.location.href=j.url; } else { fallback(); } })
    .catch(fallback);
};

/* ------------------------------------------------------------------ */
/* SHARED UI: nav, footer, toast, ticker, reveal                       */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* i18n — EN / ES for the conversion path (static marketing copy)      */
/* ------------------------------------------------------------------ */
var I18N = {
  en: {
    nav_jobs:'Jobs', nav_tickets:'Tickets', nav_agencies:'Agencies', nav_blog:'Blog', nav_pricing:'Pricing',
    nav_login:'Log in', nav_start:'Start free', nav_dash:'Dashboard',
    hero_h1:'Find the job. Get qualified. <em>Get hired.</em>',
    hero_sub:'$60k–$210k offshore, mining & trades jobs across the US, Canada & Australia. No degree. No experience needed to start.',
    hero_cta:'Find my job →', hero_ph:'Your email', hero_sector:'What work interests you?',
    t_free:'Free to join', t_roles:'roles', t_urgency:'800+ jobs found every month',
    wedge_world:'One platform for the whole world — the US, Canada, Australia, the North Sea, the Gulf and beyond.',
    wedge_h:'No one can sell you a job. We sell the exact route.',
    wedge_p:'Real ticket costs. The pre-access drug test nobody mentions. The plain truth on right-to-work — in every country we cover. That’s the difference between a plan and a fantasy.',
    lbl_how:'How HardHat works', h_how:'Three steps to a six-figure trade',
    s1_h:'Find the job', s1_p:'Take the 2-minute assessment. We match you to real roles you qualify for across 8 sectors and 10+ global hubs.',
    s2_h:'Get qualified', s2_p:'Your own ticket and medical roadmap (BOSIET, GWO, STCW, CDL) with costs, timeframes and progress you can track.',
    s3_h:'Get hired', s3_p:'Build an offshore CV, then apply through the crewing agencies and operators that hire.',
    lbl_pricing:'Pricing', h_pricing:'Simple one-time pricing. No subscription.',
    rev_rated:'Rated 4.8 / 5', accred_cap:'Accredited training we guide you to',
    pop_h:'Your first offshore job in ~3–6 weeks?', pop_p:'Get the free 3-week plan: the exact tickets, the agencies that hire, and the route for your region.', pop_cta:'Get my free 3-week plan →',
    f_cont:'Continue →', f_back:'← Back', f_getplan:'Get my plan →'
  },
  es: {
    nav_jobs:'Empleos', nav_tickets:'Certificados', nav_agencies:'Agencias', nav_blog:'Blog', nav_pricing:'Precios',
    nav_login:'Entrar', nav_start:'Empieza gratis', nav_dash:'Panel',
    hero_h1:'Encuentra el trabajo. Califícate. <em>Consíguelo.</em>',
    hero_sub:'Empleos offshore, de minería y de oficios de $60k–$210k en EE. UU., Canadá y Australia. Sin título. Sin experiencia para empezar.',
    hero_cta:'Encontrar mi trabajo →', hero_ph:'Tu correo', hero_sector:'¿Qué trabajo te interesa?',
    t_free:'Gratis unirse', t_roles:'vacantes', t_urgency:'800+ empleos encontrados cada mes',
    wedge_world:'Una plataforma para todo el mundo — EE. UU., Canadá, Australia, el Mar del Norte, el Golfo y más.',
    wedge_h:'Nadie puede venderte un empleo. Nosotros vendemos la ruta exacta.',
    wedge_p:'Costos reales de certificados. La prueba antidrogas previa que nadie menciona. La verdad clara sobre el derecho a trabajar — en cada país que cubrimos. Esa es la diferencia entre un plan y una fantasía.',
    lbl_how:'Cómo funciona HardHat', h_how:'Tres pasos hacia un oficio de seis cifras',
    s1_h:'Encuentra el trabajo', s1_p:'Haz la evaluación de 2 minutos. Te conectamos con vacantes reales para las que calificas en 8 sectores y más de 10 centros globales.',
    s2_h:'Califícate', s2_p:'Tu propia ruta de certificados y exámenes médicos (BOSIET, GWO, STCW, CDL) con costos, plazos y progreso que puedes seguir.',
    s3_h:'Consigue el empleo', s3_p:'Crea un CV offshore y postúlate a través de las agencias de tripulación y operadores que contratan.',
    lbl_pricing:'Precios', h_pricing:'Precio único y simple. Sin suscripción.',
    rev_rated:'Calificado 4.8 / 5', accred_cap:'Formación acreditada a la que te guiamos',
    pop_h:'¿Tu primer empleo offshore en ~3–6 semanas?', pop_p:'Recibe el plan gratuito de 3 semanas: los certificados exactos, las agencias que contratan y la ruta para tu región.', pop_cta:'Quiero mi plan de 3 semanas →',
    f_cont:'Continuar →', f_back:'← Atrás', f_getplan:'Ver mi plan →'
  }
};
window.HH_I18N = I18N;
function currentLang(){
  var l = get('lang');
  if(l==='en'||l==='es') return l;
  var n = (typeof navigator!=='undefined' && (navigator.language||'en')).toLowerCase();
  return n.indexOf('es')===0 ? 'es' : 'en';
}
function applyLang(lang){
  lang = (lang==='es') ? 'es' : 'en';
  set('lang', lang);
  var dict = I18N[lang] || I18N.en;
  try{ if(document.documentElement) document.documentElement.lang = lang; }catch(e){}
  var els = document.querySelectorAll('[data-i18n]');
  for(var i=0;i<els.length;i++){ var k=els[i].getAttribute('data-i18n'); if(dict[k]!=null) els[i].textContent=dict[k]; }
  var elh = document.querySelectorAll('[data-i18n-html]');
  for(var j=0;j<elh.length;j++){ var kh=elh[j].getAttribute('data-i18n-html'); if(dict[kh]!=null) elh[j].innerHTML=dict[kh]; }
  var elp = document.querySelectorAll('[data-i18n-ph]');
  for(var p=0;p<elp.length;p++){ var kp=elp[p].getAttribute('data-i18n-ph'); if(dict[kp]!=null) elp[p].setAttribute('placeholder',dict[kp]); }
  var tg = document.querySelectorAll('[data-lang]');
  for(var t=0;t<tg.length;t++){ tg[t].classList.toggle('on', tg[t].getAttribute('data-lang')===lang); }
}
window.HH.applyLang = applyLang;
window.HH.setLang = function(l){ applyLang(l); ga('lang_set',{lang:l}); };
window.HH.lang = currentLang;
/* currency picker in the nav — sets, then reloads so every pay surface re-renders */
window.HH.pickCurrency = function(sel){
  var c = sel && sel.value ? sel.value : sel;
  setCurrency(c);
  try{ window.location.reload(); }catch(e){}
};

function navHTML(active){
  function a(href,label,key){ return '<a href="'+href+'"'+(active===label?' style="color:var(--hi)"':'')+' data-i18n="'+key+'">'+label+'</a>'; }
  var right = Auth.signedIn()
    ? '<a class="btn btn-ink btn-sm" href="dashboard.html" data-i18n="nav_dash">Dashboard</a>'
    : '<a class="btn btn-out btn-sm" href="login.html" data-i18n="nav_login">Log in</a><a class="btn btn-hi btn-sm" href="start.html" data-i18n="nav_start">Start free</a>';
  var langtog = '<span class="langtog"><button data-lang="en" onclick="HH.setLang(\'en\')">EN</button><button data-lang="es" onclick="HH.setLang(\'es\')">ES</button></span>';
  var cur = currency();
  var curtog = '<select class="curtog" onchange="HH.pickCurrency(this)" aria-label="Currency">'+
    ['USD','CAD','AUD','GBP','EUR'].map(function(k){ return '<option value="'+k+'"'+(k===cur?' selected':'')+'>'+SYM[k]+' '+k+'</option>'; }).join('')+
    '</select>';
  return '<nav><div class="wrap nav">'+
    '<a class="brand" href="index.html"><span class="mk">⛏</span>HardHat</a>'+
    '<div class="navlinks">'+a('jobs.html','Jobs','nav_jobs')+a('certs.html','Tickets','nav_tickets')+a('directory.html','Agencies','nav_agencies')+a('blog.html','Blog','nav_blog')+a('pricing.html','Pricing','nav_pricing')+'</div>'+
    '<div class="navr">'+curtog+langtog+right+'</div>'+
    '</div></nav>';
}
/* company logo: real logo -> favicon -> text wordmark (always renders something) */
function logo(domain, name, cls){
  var safe = (name||'').replace(/"/g,'').replace(/'/g,'');
  if(!domain) return '<span class="wm">'+safe+'</span>';
  return '<img class="'+(cls||'lg')+'" src="https://logo.clearbit.com/'+domain+'?size=200" alt="'+safe+'" loading="lazy" '+
         'onerror="HH.logoFallback(this,\''+domain+'\',\''+safe+'\')">';
}
window.HH.logo = logo;
window.HH.logoFallback = function(img, domain, name){
  if(!img.dataset.stage){ img.dataset.stage='1'; img.src='https://www.google.com/s2/favicons?domain='+domain+'&sz=128'; }
  else { var s=document.createElement('span'); s.className='wm'; s.textContent=name; if(img.parentNode) img.parentNode.replaceChild(s,img); }
};
function footHTML(){
  return '<footer><div class="wrap foot">'+
    '<div style="max-width:280px"><div class="brand" style="margin-bottom:10px"><span class="mk">⛏</span>HardHat</div>'+
    '<p>Find the job, get qualified, and get hired. The no-degree route into high-paying offshore and trades work, worldwide.</p></div>'+
    '<div class="fcol"><h5>Explore</h5><a href="jobs.html">Job board</a><a href="fifo-mining-jobs.html">FIFO mining jobs</a><a href="browse.html">Browse all</a><a href="locations.html">Locations</a><a href="certs.html">Ticket requirements</a><a href="pay.html">Pay explorer</a><a href="directory.html">Agencies</a></div>'+
    '<div class="fcol"><h5>Product</h5><a href="start.html">Rig-Ready assessment</a><a href="cv.html">Offshore CV builder</a><a href="blog.html">Blog</a><a href="pricing.html">Pricing</a><a href="dashboard.html">Dashboard</a></div>'+
    '<div class="fcol"><h5>Company</h5><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="mailto:hello@hardhatjobs.co">Contact</a></div>'+
    '</div><div class="wrap" style="margin-top:28px;font-size:12px;color:var(--faint);line-height:1.7">© 2026 HardHat. <b style="color:var(--muted)">Independent platform — not affiliated with, endorsed by, or partnered with any company named on this site.</b> Company names and logos are the trademarks of their respective owners, shown only to indicate sectors and employers that hire for these roles. Job listings, pay ranges and demand figures are illustrative industry estimates, not live vacancies or guarantees. Work offshore and in the trades carries real physical risk; always complete accredited safety training. Photos: Wikimedia Commons &amp; Unsplash.</div></footer>';
}
/* Server-verified entitlement sync (activates once /api/entitlement is
 * configured with the Supabase service key — until then it's a silent
 * no-op and the demo-grade localStorage plan stays authoritative). */
/* Server-verified entitlement. When /api/entitlement is configured (Supabase
 * service key set), the SERVER is authoritative: it upgrades a real paid plan
 * and downgrades a spoofed localStorage plan back to free. Returns a promise so
 * callers can force a fresh check before granting a premium action. */
function syncEntitlement(force){
  return new Promise(function(resolve){
    try{
      var u = get('user'); if(!u || !u.email){ resolve(get('plan','free')); return; }
      var last = get('ent_ts', 0);
      if(!force && Date.now() - last < 2*60*1000){ resolve(get('plan','free')); return; }   // 2 min passive throttle
      set('ent_ts', Date.now());
      fetch('/api/entitlement?email='+encodeURIComponent(u.email))
        .then(function(r){ return r.json(); })
        .then(function(j){
          if(j && j.configured){
            var local = get('plan','free');
            if(j.plan && j.plan !== 'free' && j.plan !== local){ set('plan', j.plan); }
            else if(j.plan === 'free' && local !== 'free'){ set('plan','free'); }   // server is the truth
          }
          resolve(get('plan','free'));
        }).catch(function(){ resolve(get('plan','free')); });
    }catch(e){ resolve(get('plan','free')); }
  });
}
window.HH.syncEntitlement = syncEntitlement;
/* Force a fresh server check, then run cb with the authoritative isPro boolean.
 * Falls back to the current local value when entitlement isn't wired yet. */
window.HH.verifyPro = function(cb){
  syncEntitlement(true).then(function(){ try{ cb(Auth.isPro()); }catch(e){} });
};

window.HH.mountChrome = function(active){
  var n=document.getElementById('nav'); if(n) n.innerHTML=navHTML(active);
  var f=document.getElementById('foot'); if(f) f.innerHTML=footHTML();
  applyLang(currentLang());
  syncEntitlement();
  initReveal();
  mountConsent();
};
/* GDPR cookie-consent banner — analytics/marketing cookies fire only after
 * "Accept" (see the guard in ga()). Essential first-party storage (your saved
 * plan, intake, applications) always works. Bilingual EN/ES; shown once. */
function consent(){ return get('consent'); }
window.HH.consent = consent;
function mountConsent(){
  if(get('consent')) return;                         // already chose
  if(document.getElementById('hhConsent')) return;   // already mounted this load
  var es = currentLang()==='es';
  var t = es
    ? { msg:'Usamos cookies esenciales para que el sitio funcione y, con tu permiso, cookies de análisis para mejorarlo.', acc:'Aceptar', rej:'Solo esenciales', more:'Privacidad' }
    : { msg:'We use essential cookies to run the site and, with your consent, analytics cookies to improve it.', acc:'Accept', rej:'Essential only', more:'Privacy' };
  var bar=document.createElement('div'); bar.className='consentbar'; bar.id='hhConsent';
  bar.innerHTML='<p>'+t.msg+' <a href="privacy.html">'+t.more+' →</a></p>'+
    '<div class="cbtns"><button class="btn btn-out btn-sm" id="cRej">'+t.rej+'</button>'+
    '<button class="btn btn-go btn-sm" id="cAcc">'+t.acc+'</button></div>';
  document.body.appendChild(bar);
  function done(v){ set('consent',v); bar.classList.remove('on'); setTimeout(function(){ if(bar.parentNode) bar.parentNode.removeChild(bar); },300); }
  document.getElementById('cAcc').onclick=function(){ done('all'); ga('consent_accept',{}); };
  document.getElementById('cRej').onclick=function(){ done('essential'); };
  requestAnimationFrame(function(){ bar.classList.add('on'); });
}
window.HH.mountConsent = mountConsent;
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
var TICK=['Deckhand hired in Singapore – $68k','Roughneck got BOSIET-ready in 9 days','FIFO operator signed – $118k, Pilbara','Wind tech landed North Sea rota – $102k','Welder passed 6G – $128k pipeline job','Sat diver signed West Africa – $210k'];
window.HH.mountTicker=function(){
  var i=0; var el=document.createElement('div'); el.className='ticker';
  el.innerHTML='<span class="dot"></span><span id="tkt"></span>';
  document.body.appendChild(el);
  function cyc(){ document.getElementById('tkt').textContent=TICK[i%TICK.length]; i++; }
  cyc(); setInterval(function(){ el.style.opacity=0; setTimeout(function(){cyc();el.style.opacity=1;},300); },4200);
};

/* fmt helper */
window.HH.fmt = function(n){ return '$'+Number(n).toLocaleString(); };

/* ------------------------------------------------------------------ */
/* CONVERSION POP-UP — email capture, once per browser                 */
/* ------------------------------------------------------------------ */
window.HH.mountPopup = function(opts){
  opts = opts || {};
  if(get('popup_seen')) return;            // already shown once
  if(Auth.intake()) return;                // already a lead
  var shown = false;
  function build(){
    if(shown) return; shown = true; set('popup_seen', 1);
    var m = document.createElement('div'); m.className = 'modal popup'; m.id = 'hhPopup';
    m.innerHTML =
      '<div class="mbox pop">'+
        '<span class="mclose" onclick="HH.closePopup()">×</span>'+
        '<div class="popbadge">Free · 2 minutes</div>'+
        '<h3 class="display" style="font-size:24px;margin:10px 0 8px" data-i18n="pop_h">Your first offshore job in ~3–6 weeks?</h3>'+
        '<p style="color:var(--muted);font-size:14.5px;margin-bottom:16px" data-i18n="pop_p">Get the free 3-week plan: the exact tickets, the agencies that hire, and the route for your region.</p>'+
        '<input class="inp" id="popEmail" type="email" placeholder="you@email.com" style="margin-bottom:10px">'+
        '<button class="btn btn-hi btn-block btn-lg" onclick="HH.popupGo()" data-i18n="pop_cta">Get my free 3-week plan →</button>'+
        '<p style="text-align:center;margin-top:10px;font-size:12px;color:var(--faint)">No spam. Unsubscribe anytime.</p>'+
      '</div>';
    document.body.appendChild(m);
    applyLang(currentLang());
    requestAnimationFrame(function(){ m.classList.add('on'); });
    ga('popup_view',{});
  }
  // trigger: exit-intent OR scroll-depth OR after 18s
  document.addEventListener('mouseout', function(e){ if(e.clientY<=0) build(); });
  function onScroll(){
    var y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    // fire once the reader is engaged: past ~1.5 screens OR ~40% down the page
    var h = document.documentElement;
    var frac = (y + window.innerHeight) / (h.scrollHeight || 1);
    if(y >= (opts.scrollPx || window.innerHeight * 1.2) || frac >= (opts.scrollDepth || 0.4)){
      build(); window.removeEventListener('scroll', onScroll);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  var t = setTimeout(build, opts.delay || 18000);
  window.HH._popupTimer = t;
};
window.HH.closePopup = function(){ var m=document.getElementById('hhPopup'); if(m){ m.classList.remove('on'); setTimeout(function(){ m.remove(); },200); } };
window.HH.popupGo = function(){
  try{
    var el = document.getElementById('popEmail');
    var e = el ? el.value : '';
    if(e && /.+@.+\..+/.test(e)){ set('nl', e); Auth.signup('', e); }
    ga('popup_submit',{});
  }catch(_){}
  window.location.href = 'start.html';
};

})();
