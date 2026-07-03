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
  PAY: { pro_monthly:'', pro_annual:'', fasttrack:'' }
};
window.HH_CONFIG = CONFIG;

/* GA4 (only if configured) */
function ga(ev, params){
  try{ if(window.gtag) window.gtag('event', ev, params||{}); }catch(e){}
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
        plan: get('plan','free'), source: (typeof location!=='undefined' ? location.pathname : ''),
        payload: ik
      })
    }).catch(function(){});
  }catch(e){}
}
window.HH_saveLead = saveLead;

/* ------------------------------------------------------------------ */
/* SECTORS — the 8 verticals                                           */
/* ------------------------------------------------------------------ */
var SECTORS = [
  { id:'oil',    icon:'🛢️', name:'Offshore Oil & Gas', blurb:'Roughneck, roustabout, floorhand, derrickhand on rigs & platforms.', pay:'$70k–$165k', rota:'2 on / 3 off', noexp:true },
  { id:'wind',   icon:'🌬️', name:'Offshore Wind',       blurb:'GWO-certified turbine techs building & maintaining wind farms.',      pay:'$65k–$140k', rota:'2 on / 2 off', noexp:true },
  { id:'diving', icon:'🤿', name:'Commercial Diving',    blurb:'Air & saturation divers, tenders — underwater welding & inspection.', pay:'$65k–$250k', rota:'project',     noexp:false },
  { id:'marine', icon:'⚓', name:'Merchant Marine',      blurb:'Deckhand, OS/AB, wiper — cargo ships, tugs, supply vessels.',        pay:'$58k–$130k', rota:'28 on / 28 off', noexp:true },
  { id:'mining', icon:'⛏️', name:'FIFO Mining',          blurb:'Fly-in fly-out remote mine operators, trades & haul-truck drivers.', pay:'$88k–$180k', rota:'2 on / 1 off', noexp:true },
  { id:'weld',   icon:'🔥', name:'Pipeline / Welding',   blurb:'Structural & pipeline welders, riggers, fabricators.',               pay:'$68k–$160k', rota:'project',     noexp:false },
  { id:'wtt',    icon:'⚡', name:'Wind Turbine Tech',    blurb:'Onshore turbine service techs — climb, service, fault-find.',        pay:'$58k–$105k',  rota:'rota',       noexp:true },
  { id:'cdl',    icon:'🚛', name:'Hazmat / CDL Haul',    blurb:'Long-haul, tanker & hazmat drivers — oilfield & heavy freight.',     pay:'$72k–$135k', rota:'weeks out',  noexp:true }
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
  oil:   { entry:'$70k', exp:'$165k', day:'$250–$650/day', rota:'2 wk on / 3 wk off', tax:false, note:'Day-rate roles; overtime common offshore.' },
  wind:  { entry:'$65k', exp:'$140k', day:'$300–$550/day', rota:'2 on / 2 off',       tax:false, note:'GWO tickets open EU + US offshore wind.' },
  diving:{ entry:'$65k', exp:'$250k', day:'$450–$1,600/day', rota:'project-based',    tax:false, note:'Saturation diving is the top of the pay scale.' },
  marine:{ entry:'$58k', exp:'$130k', day:'$220–$480/day',  rota:'28 on / 28 off',   tax:true,  note:'US mariners may qualify for foreign-earned income exclusion.' },
  mining:{ entry:'$88k', exp:'$180k', day:'$320–$700/day',  rota:'2 on / 1 off (FIFO)', tax:false, note:'Camp, flights & meals usually covered on top.' },
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
  { id:'caspian',  name:'Caspian', flag:'🇰🇿🇦🇿', hub:'Baku · Atyrau', sectors:['oil','weld'], open:1100 }
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
/* AUTH GATE — register (Continue with Google) + paywall               */
/* Everything requires an account. Google is offered after the paywall.*/
/* ------------------------------------------------------------------ */
var GOOG_SVG = '<svg viewBox="0 0 48 48" width="18" height="18" style="flex:none"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.9z"/><path fill="#FBBC05" d="M10.5 28.3c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.1 0 19.9 0 23.7s.9 7.6 2.6 10.8l7.9-6.2z"/><path fill="#34A853" d="M24 47.4c6.3 0 11.7-2.1 15.6-5.7l-7.1-5.5c-2 1.3-4.5 2.1-8.5 2.1-6.3 0-11.7-3.7-13.5-9.1l-7.9 6.1C6.5 42.6 14.6 47.4 24 47.4z"/></svg>';
var _gate = { next:null, mode:'register', plan:'pro_monthly' };
function authGate(opts){
  opts = opts || {};
  _gate.next = opts.next || null;
  _gate.mode = opts.mode || 'register';
  _gate.plan = opts.plan || 'pro_monthly';
  ga('auth_gate_view', { mode:_gate.mode });
  var pro = _gate.mode === 'pro';
  var m = document.getElementById('gateModal');
  if(!m){ m = document.createElement('div'); m.id='gateModal'; m.className='modal'; document.body.appendChild(m); }
  m.innerHTML =
    '<div class="mbox" style="max-width:430px">'+
      '<span class="mclose" onclick="HH.closeGate()">×</span>'+
      '<div class="popbadge">'+(pro ? 'HardHat Pro · $48/mo' : 'Free account')+'</div>'+
      '<h3 class="display" style="font-size:24px;margin:10px 0 6px">'+(opts.title || (pro ? 'Unlock this with HardHat Pro' : 'Create your free account'))+'</h3>'+
      '<p style="color:var(--muted);font-size:14.5px;margin-bottom:18px">'+(opts.reason || 'Register to continue — it takes 10 seconds and saves your progress.')+'</p>'+
      (pro ? '<ul class="gatelist"><li>Apply to jobs + real agency contacts</li><li>Full ticket roadmap & AI offshore CV</li><li>Unlimited saved jobs & alerts</li></ul><p class="guarantee" style="text-align:left;margin:0 0 14px">🔒 Secure checkout · Cancel anytime · <span class="hi">1,240 hired this month</span></p>' : '')+
      '<button class="gbtn" onclick="HH.authGoogle()">'+GOOG_SVG+' Continue with Google</button>'+
      '<div class="ordiv"><span>or</span></div>'+
      '<input class="inp" id="gateEmail" type="email" placeholder="you@email.com" style="margin-bottom:10px" onkeydown="if(event.key===\'Enter\')HH.authEmail()">'+
      '<button class="btn btn-hi btn-block btn-lg" onclick="HH.authEmail()">Continue with email →</button>'+
      '<p style="text-align:center;margin-top:12px;font-size:12px;color:var(--faint)">Free to join.'+(pro ? ' Choose a plan after you sign in.' : ' No spam, unsubscribe anytime.')+'</p>'+
    '</div>';
  m.classList.add('on');
}
function finishGate(){
  HH.closeGate();
  var next = _gate.next, mode = _gate.mode, plan = _gate.plan;
  _gate.next = null;
  if(typeof next === 'function'){ try{ next(); }catch(e){} }
  else if(mode === 'pro'){ HH.checkout(plan); }
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
function showPaywall(reason){ authGate({ mode:'pro', reason:reason, plan:'pro_monthly' }); }
window.HH.closePaywall = window.HH.closeGate;
window.HH.showPaywall = showPaywall;

/* checkout: prefer Payment Link, else /api/checkout, else signup */
window.HH.checkout = function(plan){
  ga('begin_checkout',{plan:plan});
  var link = CONFIG.PAY[plan];
  if(link){ location.href=link; return; }
  function fallback(){ location.href = Auth.signedIn() ? 'dashboard.html' : ('signup.html?plan='+encodeURIComponent(plan)); }
  fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:plan})})
    .then(function(r){return r.json();})
    .then(function(j){ if(j&&j.url){ location.href=j.url; } else { fallback(); } })
    .catch(fallback);
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
    '<div class="navlinks">'+a('jobs.html','Jobs')+a('locations.html','Locations')+a('roadmap.html','Roadmap')+a('pay.html','Pay')+a('directory.html','Agencies')+a('blog.html','Blog')+a('pricing.html','Pricing')+'</div>'+
    '<div class="navr">'+right+'</div>'+
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
    '<div class="fcol"><h5>Explore</h5><a href="jobs.html">Job board</a><a href="locations.html">Locations</a><a href="roadmap.html">Ticket roadmap</a><a href="pay.html">Pay explorer</a><a href="directory.html">Agencies</a></div>'+
    '<div class="fcol"><h5>Product</h5><a href="start.html">Rig-Ready assessment</a><a href="cv.html">Offshore CV builder</a><a href="blog.html">Blog</a><a href="pricing.html">Pricing</a><a href="dashboard.html">Dashboard</a></div>'+
    '<div class="fcol"><h5>Company</h5><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="mailto:hello@hardhatjobs.co">Contact</a></div>'+
    '</div><div class="wrap" style="margin-top:28px;font-size:12px;color:var(--faint);line-height:1.7">© 2026 HardHat. <b style="color:var(--muted)">Independent platform — not affiliated with, endorsed by, or partnered with any company named on this site.</b> Company names and logos are the trademarks of their respective owners, shown only to indicate sectors and employers that hire for these roles. Job listings, pay ranges and demand figures are illustrative industry estimates, not live vacancies or guarantees. Work offshore and in the trades carries real physical risk; always complete accredited safety training. Photos: Wikimedia Commons &amp; Unsplash.</div></footer>';
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
        '<h3 class="display" style="font-size:24px;margin:10px 0 8px">Not sure where to start?</h3>'+
        '<p style="color:var(--muted);font-size:14.5px;margin-bottom:16px">Answer 6 quick questions and get a personalised plan: the jobs you qualify for, the tickets to get, and who to apply to.</p>'+
        '<input class="inp" id="popEmail" type="email" placeholder="you@email.com" style="margin-bottom:10px">'+
        '<button class="btn btn-hi btn-block btn-lg" onclick="HH.popupGo()">Build my free plan →</button>'+
        '<p style="text-align:center;margin-top:10px;font-size:12px;color:var(--faint)">No spam. Unsubscribe anytime.</p>'+
      '</div>';
    document.body.appendChild(m);
    requestAnimationFrame(function(){ m.classList.add('on'); });
    ga('popup_view',{});
  }
  // trigger: exit-intent OR after 18s
  document.addEventListener('mouseout', function(e){ if(e.clientY<=0) build(); });
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
