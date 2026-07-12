#!/usr/bin/env node
/* HardHat — job catalog generator.
 *
 * Generates jobs-data.json: 5,000+ representative roles across all sectors and
 * worldwide hubs, in a compact columnar format expanded client-side (jobs.html).
 * Deterministic (seeded PRNG) so rebuilds don't churn git diffs.
 *
 * Honesty: these are REPRESENTATIVE roles — the kinds of openings the named
 * agencies and operators fill continuously — labeled as such in the job detail
 * and covered by the site-wide disclaimer. For live vacancies, api/jobs.js
 * activates when Adzuna/Careerjet keys are set (see SETUP_KEYS.md).
 *
 * Run:  node build-jobs.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DIR = __dirname;

/* deterministic PRNG */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rnd = mulberry32(42);
const pick = (arr) => arr[Math.floor(rnd()*arr.length)];

/* load PAY/COMPANIES/AGENCIES/TICKETS from app.js (same sandbox as build-seo) */
function loadData(){
  const src = fs.readFileSync(path.join(DIR,'app.js'),'utf8');
  const noop = () => {};
  const el = () => ({ style:{}, dataset:{}, classList:{add:noop,remove:noop,contains:()=>false}, appendChild:noop, setAttribute:noop, addEventListener:noop, innerHTML:'', textContent:'' });
  const sb = { console, URLSearchParams, requestAnimationFrame:noop, setTimeout:noop, clearTimeout:noop, setInterval:noop, clearInterval:noop,
    localStorage:{getItem:()=>null,setItem:noop,removeItem:noop}, location:{pathname:'',search:'',href:''},
    navigator:{clipboard:{writeText:noop}}, fetch:()=>Promise.resolve({json:()=>Promise.resolve({})}),
    document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:el,addEventListener:noop,body:el(),documentElement:el()} };
  sb.window = sb; vm.createContext(sb); vm.runInContext(src, sb, {filename:'app.js'});
  return { PAY:sb.HH_PAY, COMPANIES:sb.HH_COMPANIES, AGENCIES:sb.HH_AGENCIES, SECTORS:sb.HH_SECTORS };
}
const D = loadData();

/* ---- role templates (title, sector, tickets, entry-friendly, seniority span) ---- */
const ROLES = [
  // oil & gas
  {t:'Roustabout',sec:'oil',tks:['bosiet','ogukmed'],noexp:1},
  {t:'Roughneck / Floorhand',sec:'oil',tks:['bosiet','mist'],noexp:1},
  {t:'Derrickhand',sec:'oil',tks:['bosiet','ogukmed','mist'],noexp:0},
  {t:'Motorhand',sec:'oil',tks:['bosiet','mist'],noexp:0},
  {t:'Rig Mechanic',sec:'oil',tks:['bosiet','ogukmed'],noexp:0},
  {t:'Offshore Crane Operator',sec:'oil',tks:['bosiet','ogukmed'],noexp:0},
  {t:'Offshore Scaffolder',sec:'oil',tks:['bosiet','mist'],noexp:1},
  {t:'Production Operator',sec:'oil',tks:['bosiet','ogukmed','mist'],noexp:0},
  {t:'Rig Electrician',sec:'oil',tks:['bosiet','ogukmed'],noexp:0},
  // offshore wind
  {t:'Wind Turbine Technician (GWO)',sec:'wind',tks:['gwobst','huet'],noexp:1},
  {t:'Trainee Wind Turbine Technician',sec:'wind',tks:['gwobst'],noexp:1},
  {t:'Blade Repair Technician',sec:'wind',tks:['gwobst','offmed'],noexp:0},
  {t:'Cable Pull Technician',sec:'wind',tks:['gwobst'],noexp:1},
  {t:'Marine Coordinator (Entry)',sec:'wind',tks:['gwobst','offmed'],noexp:1},
  {t:'O&M Wind Technician',sec:'wind',tks:['gwobst','gwobtt','offmed'],noexp:0},
  // diving / subsea
  {t:'Diver Tender / Trainee',sec:'diving',tks:['dmt','divemed'],noexp:0},
  {t:'Air Diver',sec:'diving',tks:['dmt','divemed'],noexp:0},
  {t:'Saturation Diver',sec:'diving',tks:['dmt','divemed'],noexp:0,top:1},
  {t:'ROV Pilot Technician',sec:'diving',tks:['bosiet'],noexp:0},
  {t:'ROV Trainee',sec:'diving',tks:['bosiet'],noexp:1},
  // marine
  {t:'Deckhand / OS',sec:'marine',tks:['stcw','twicm'],noexp:1},
  {t:'Able Seaman (AB)',sec:'marine',tks:['stcw','mmc','twicm'],noexp:0},
  {t:'Wiper / Engine Rating',sec:'marine',tks:['stcw','marmed'],noexp:1},
  {t:'Steward / Galley Hand',sec:'marine',tks:['stcw','marmed'],noexp:1},
  {t:'Bosun',sec:'marine',tks:['stcw','mmc'],noexp:0},
  {t:'DP Vessel Deck Crew',sec:'marine',tks:['stcw','mmc','twicm'],noexp:0},
  // FIFO mining
  {t:'Haul Truck Operator (FIFO)',sec:'mining',tks:['induction','medm'],noexp:1},
  {t:'Trades Assistant (FIFO)',sec:'mining',tks:['induction','medm'],noexp:1},
  {t:'Process Operator (FIFO)',sec:'mining',tks:['induction','medm'],noexp:1},
  {t:'Drillers Offsider',sec:'mining',tks:['induction','medm'],noexp:1},
  {t:'Mobile Plant Operator',sec:'mining',tks:['induction','medm','hr'],noexp:0},
  {t:'Underground Nipper',sec:'mining',tks:['induction','medm'],noexp:1},
  // welding / fabrication
  {t:'Pipeline Welder (6G)',sec:'weld',tks:['weldcert','osha'],noexp:0,top:1},
  {t:'Structural Welder / Fitter',sec:'weld',tks:['weldcert','osha'],noexp:0},
  {t:'Maintenance Welder (Shutdown)',sec:'weld',tks:['weldcert','osha'],noexp:0},
  {t:'Pipefitter',sec:'weld',tks:['osha'],noexp:0},
  {t:'Rigger / Signalman',sec:'weld',tks:['rigging','osha'],noexp:1},
  {t:'Boilermaker',sec:'weld',tks:['weldcert','osha'],noexp:0},
  // wind turbine tech (onshore)
  {t:'Wind Turbine Technician (Onshore)',sec:'wtt',tks:['gwoheights','wttmed'],noexp:1},
  {t:'Turbine Service Trainee',sec:'wtt',tks:['gwoheights'],noexp:1},
  {t:'High-Voltage Technician (Wind)',sec:'wtt',tks:['gwoheights','elec'],noexp:0},
  {t:'Composite Repair Technician',sec:'wtt',tks:['gwoheights','wttmed'],noexp:0},
  // CDL / driving
  {t:'Hazmat Tanker Driver',sec:'cdl',tks:['cdla','hazmat','dotmed'],noexp:1},
  {t:'Frac Sand Driver (CDL-A)',sec:'cdl',tks:['cdla','dotmed'],noexp:1},
  {t:'Heavy Haul Driver',sec:'cdl',tks:['cdla','dotmed'],noexp:0},
  {t:'Water Truck Driver (Oilfield)',sec:'cdl',tks:['cdla','dotmed'],noexp:1},
  {t:'Fuel Tanker Driver',sec:'cdl',tks:['cdla','hazmat','dotmed'],noexp:0}
];

/* ---- worldwide hubs (name, country code, flag, hub-region id for certs, sectors hiring) ---- */
const CITIES = [
  {n:'Aberdeen, UK',cc:'GB',fl:'🇬🇧',locId:'northsea',secs:['oil','wind','diving','marine','weld']},
  {n:'Great Yarmouth, UK',cc:'GB',fl:'🇬🇧',locId:'northsea',secs:['wind','oil','marine']},
  {n:'Grimsby, UK',cc:'GB',fl:'🇬🇧',locId:'northsea',secs:['wind','wtt']},
  {n:'Stavanger, Norway',cc:'NO',fl:'🇳🇴',locId:'northsea',secs:['oil','diving','weld','marine']},
  {n:'Bergen, Norway',cc:'NO',fl:'🇳🇴',locId:'northsea',secs:['oil','marine','wind']},
  {n:'Esbjerg, Denmark',cc:'DK',fl:'🇩🇰',locId:'northsea',secs:['wind','marine','wtt']},
  {n:'Den Helder, Netherlands',cc:'NL',fl:'🇳🇱',locId:'northsea',secs:['wind','oil','marine']},
  {n:'Rotterdam, Netherlands',cc:'NL',fl:'🇳🇱',locId:'northsea',secs:['weld','marine','cdl']},
  {n:'Houston, TX, US',cc:'US',fl:'🇺🇸',locId:'gom',secs:['oil','weld','cdl','diving']},
  {n:'New Orleans, LA, US',cc:'US',fl:'🇺🇸',locId:'gom',secs:['oil','marine','diving']},
  {n:'Lafayette, LA, US',cc:'US',fl:'🇺🇸',locId:'gom',secs:['oil','diving','marine']},
  {n:'Corpus Christi, TX, US',cc:'US',fl:'🇺🇸',locId:'gom',secs:['oil','weld','cdl','marine']},
  {n:'Midland, TX, US',cc:'US',fl:'🇺🇸',locId:'gom',secs:['oil','cdl','weld']},
  {n:'Williston, ND, US',cc:'US',fl:'🇺🇸',locId:'gom',secs:['oil','cdl','weld']},
  {n:'Dubai, UAE',cc:'AE',fl:'🇦🇪',locId:'me',secs:['oil','weld','diving','marine']},
  {n:'Abu Dhabi, UAE',cc:'AE',fl:'🇦🇪',locId:'me',secs:['oil','weld','marine']},
  {n:'Doha, Qatar',cc:'QA',fl:'🇶🇦',locId:'me',secs:['oil','weld','marine']},
  {n:'Dammam, Saudi Arabia',cc:'SA',fl:'🇸🇦',locId:'me',secs:['oil','weld','cdl']},
  {n:'Lagos, Nigeria',cc:'NG',fl:'🇳🇬',locId:'wafrica',secs:['oil','diving','marine']},
  {n:'Port Harcourt, Nigeria',cc:'NG',fl:'🇳🇬',locId:'wafrica',secs:['oil','weld','marine']},
  {n:'Luanda, Angola',cc:'AO',fl:'🇦🇴',locId:'wafrica',secs:['oil','diving','marine']},
  {n:'Perth, WA, Australia',cc:'AU',fl:'🇦🇺',locId:'ausfifo',secs:['mining','oil','weld','cdl','diving']},
  {n:'Karratha, WA, Australia',cc:'AU',fl:'🇦🇺',locId:'ausfifo',secs:['mining','oil','weld','cdl']},
  {n:'Mackay, QLD, Australia',cc:'AU',fl:'🇦🇺',locId:'ausfifo',secs:['mining','weld','cdl']},
  {n:'Darwin, NT, Australia',cc:'AU',fl:'🇦🇺',locId:'ausfifo',secs:['oil','marine','mining']},
  {n:'Macaé, Brazil',cc:'BR',fl:'🇧🇷',locId:'brazil',secs:['oil','diving','marine','weld']},
  {n:'Rio de Janeiro, Brazil',cc:'BR',fl:'🇧🇷',locId:'brazil',secs:['oil','marine','weld']},
  {n:'Singapore',cc:'SG',fl:'🇸🇬',locId:'seasia',secs:['marine','oil','weld','diving']},
  {n:'Batam, Indonesia',cc:'ID',fl:'🇮🇩',locId:'seasia',secs:['weld','marine','oil']},
  {n:'Kuala Lumpur, Malaysia',cc:'MY',fl:'🇲🇾',locId:'seasia',secs:['oil','marine','diving']},
  {n:'Georgetown, Guyana',cc:'GY',fl:'🇬🇾',locId:'guyana',secs:['oil','marine']},
  {n:'New Bedford, MA, US',cc:'US',fl:'🇺🇸',locId:'useast',secs:['wind','marine','wtt']},
  {n:'Norfolk, VA, US',cc:'US',fl:'🇺🇸',locId:'useast',secs:['wind','marine','weld']},
  {n:'Atlantic City, NJ, US',cc:'US',fl:'🇺🇸',locId:'useast',secs:['wind','wtt']},
  {n:'Baku, Azerbaijan',cc:'AZ',fl:'🇦🇿',locId:'caspian',secs:['oil','weld','marine']},
  {n:'Atyrau, Kazakhstan',cc:'KZ',fl:'🇰🇿',locId:'caspian',secs:['oil','weld','cdl']},
  {n:'Ciudad del Carmen, Mexico',cc:'MX',fl:'🇲🇽',locId:'latam',secs:['oil','marine','diving']},
  {n:'Veracruz, Mexico',cc:'MX',fl:'🇲🇽',locId:'latam',secs:['marine','weld','oil']},
  {n:'Barranquilla, Colombia',cc:'CO',fl:'🇨🇴',locId:'latam',secs:['oil','marine','weld']},
  {n:'Antofagasta, Chile',cc:'CL',fl:'🇨🇱',locId:'latam',secs:['mining','cdl','weld']},
  {n:'Las Palmas, Spain',cc:'ES',fl:'🇪🇸',locId:'iberia',secs:['marine','oil','wind']},
  {n:'Tarragona, Spain',cc:'ES',fl:'🇪🇸',locId:'iberia',secs:['weld','wind','marine']}
];

/* rotation patterns per sector */
const ROTAS = {
  oil:['14/14','2 on / 3 off','28/28','21/21','14/21'],
  wind:['2 on / 2 off','14/14','project','2 on / 3 off'],
  diving:['project','28-day sat','21/21','project rotation'],
  marine:['28/28','28/14','2 on / 2 off','6 wks on / 6 off'],
  mining:['2/1 FIFO','8/6 FIFO','2 on / 1 off','8/6'],
  weld:['project','shutdown','roster','home weekly'],
  wtt:['rota + travel','Mon–Fri + travel','2 on / 2 off'],
  cdl:['weeks out','home weekly','14/7','local shifts']
};
const TYPES = ['Rotational','Contract','Full-time'];

/* companies (operators) + agencies as posting sources */
const AG = D.AGENCIES.filter((a,i,arr)=>arr.findIndex(x=>x.name===a.name)===i);
function domainOf(url){ return (url||'').replace(/^https?:\/\/(www\.)?/,'').replace(/\/.*$/,''); }
const SOURCES = D.COMPANIES.map(c=>({n:c.name,d:c.domain,ag:0}))
  .concat(AG.map(a=>({n:a.name,d:domainOf(a.url),ag:1})));

function payFor(sec, lvl){
  const p = D.PAY[sec]; if(!p) return 80000;
  const lo = parseInt(String(p.entry).replace(/\D/g,''),10)*1000;
  const hi = parseInt(String(p.exp).replace(/\D/g,''),10)*1000;
  const base = lvl ? (hi*0.72 + rnd()*(hi*0.28)) : (lo + rnd()*(hi*0.45 - 0));
  return Math.round(base/1000)*1000;
}

/* ---- generate ---- */
function main(){
  const roleIdxBySec = {};
  ROLES.forEach((r,i)=>{ (roleIdxBySec[r.sec]=roleIdxBySec[r.sec]||[]).push(i); });

  const rows = [];
  const TARGET = 5200;
  // build the full (role, city) pair space first
  const pairs = [];
  CITIES.forEach((c,ci)=>{ c.secs.forEach(sec=>{ (roleIdxBySec[sec]||[]).forEach(ri=>pairs.push([ri,ci])); }); });
  const perPair = Math.ceil(TARGET/pairs.length);

  pairs.forEach(([ri,ci])=>{
    const role = ROLES[ri];
    for(let k=0;k<perPair;k++){
      const lvl = role.noexp ? (rnd()<0.62?0:1) : 1;                 // 0=Entry 1=Experienced
      const typ = Math.floor(rnd()*3);
      const rotas = ROTAS[role.sec]; const roti = Math.floor(rnd()*rotas.length);
      const src = Math.floor(rnd()*SOURCES.length);
      const payn = payFor(role.sec, lvl) + (role.top&&lvl?Math.round(rnd()*45000/1000)*1000:0);
      const pst = 1+Math.floor(rnd()*28);                            // days ago
      rows.push([ri,ci,src,lvl,typ,roti,payn,pst]);
    }
  });

  const out = {
    v:1, generated:'2026-07-06', count:rows.length,
    note:'Representative roles filled continuously by the named agencies/operators. Not live vacancy listings. See site disclaimer.',
    roles:ROLES.map(r=>({t:r.t,sec:r.sec,tks:r.tks,ne:r.noexp?1:0})),
    cities:CITIES.map(c=>({n:c.n,cc:c.cc,fl:c.fl,locId:c.locId})),
    cos:SOURCES,
    rotas:ROTAS,
    rows:rows
  };
  fs.writeFileSync(path.join(DIR,'jobs-data.json'), JSON.stringify(out));
  const kb = Math.round(fs.statSync(path.join(DIR,'jobs-data.json')).size/1024);
  console.log(`jobs-data.json: ${rows.length} jobs, ${out.roles.length} role types, ${CITIES.length} hubs, ${SOURCES.length} sources — ${kb}KB`);
}
main();
