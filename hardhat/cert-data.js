/* HardHat — Certificate Truth Engine data (source of truth, versioned)
 *
 * Every entry: role × region → mandatory tickets, medical, right-to-work
 * reality, helps/sometimes-required, and OFFICIAL verify links.
 * Framing rule: requirements are "typically required — confirm on the posting."
 * Keep lastVerified fresh; review quarterly; corrections via hello@hardhatjobs.co.
 */
var HH_CERTS = {
  version: '1.0',
  lastVerified: '2026-07-06',
  regions: {
    uk:     { name:'North Sea (UK)', flag:'🇬🇧', locIds:['northsea'] },
    us:     { name:'US Gulf of Mexico', flag:'🇺🇸', locIds:['gom','useast'] },
    au:     { name:'Australia', flag:'🇦🇺', locIds:['ausfifo'] },
    canada: { name:'Canada (oil sands & mining)', flag:'🇨🇦', locIds:[] },
    global: { name:'Global / Middle East / W. Africa', flag:'🌍', locIds:['me','wafrica','brazil','seasia','guyana','caspian'] },
    eu:     { name:'Europe (offshore wind)', flag:'🇪🇺', locIds:['northsea'] }
  },
  links: {
    opito:  { name:'OPITO', url:'https://opito.com' },
    gwo:    { name:'GWO', url:'https://www.globalwindorganisation.org' },
    stcw:   { name:'IMO STCW', url:'https://www.imo.org' },
    oeuk:   { name:'OEUK medical', url:'https://oeuk.org.uk' },
    eng1:   { name:'UK ENG1', url:'https://www.gov.uk/seafarer-medical-certificates' },
    twic:   { name:'TWIC (TSA)', url:'https://www.tsa.gov/twic' },
    rshq:   { name:'QLD RSHQ / Standard 11', url:'https://www.rshq.qld.gov.au' },
    imca:   { name:'IMCA', url:'https://www.imca-int.com' },
    dot:    { name:'DOT medical', url:'https://nationalregistry.fmcsa.dot.gov' },
    cswip:  { name:'CSWIP / TWI', url:'https://www.cswip.com' },
    esc:     { name:'Energy Safety Canada', url:'https://www.energysafetycanada.com' },
    abclass1:{ name:'Alberta Class 1', url:'https://www.alberta.ca/class-1-learning-pathway' },
    dac:     { name:'Pre-access D&A (DriverCheck)', url:'https://www.drivercheck.ca' },
    msha:    { name:'MSHA Part 46/48', url:'https://www.msha.gov/training-education' },
    norcat:  { name:'NORCAT Common Core', url:'https://www.norcat.org' }
  },
  roles: [
    { id:'roustabout', sec:'oil', title:'Roughneck / Roustabout', lvl:'Entry', pay:'$80k–$180k',
      regions:[
        { r:'uk', mandatory:['BOSIET + CA-EBS (OPITO)','MIST (OPITO)'],
          medical:'OEUK offshore medical + Chester Step fitness; shoulder measurement for EBS',
          rtw:'Right to work UK. Sponsorship rare for entry roles.',
          helps:['FOET (refresher after 4 yrs)'], verify:['opito','oeuk'] },
        { r:'us', mandatory:['SafeGulf / SafeLandUSA orientation','HUET / water survival','TWIC card'],
          medical:'Pre-employment physical + drug & alcohol screen',
          rtw:'US work authorization required. No sponsorship for entry.',
          helps:['RigPass','API RP T-1 (some operators)'], verify:['twic'] },
        { r:'global', mandatory:['T-BOSIET (Tropical, OPITO)'],
          medical:'Employer / OGUK-equivalent medical',
          rtw:'Visa & sponsorship handled by the contractor; hard for first-timers.',
          helps:['H2S Awareness','Banksman / slinger (some)'], verify:['opito'] }
      ]},
    { id:'windtech', sec:'wind', title:'Wind Turbine Technician (trainee)', lvl:'Entry', pay:'$65k–$140k',
      regions:[
        { r:'eu', mandatory:['GWO Basic Safety Training (BST)'],
          medical:'Offshore/wind medical; some employers require ENG1',
          rtw:'Right to work in the country of the wind farm.',
          helps:['GWO Basic Technical Training (BTT)','Sea Survival module (offshore wind)'], verify:['gwo'] },
        { r:'us', mandatory:['GWO Basic Safety Training (BST)','TWIC (vessel access)'],
          medical:'Physical + drug screen; USCG rules for crew transfer vessels',
          rtw:'US work authorization required.',
          helps:['CTV / offshore transfer briefings'], verify:['gwo','twic'] }
      ]},
    { id:'haultruck', sec:'mining', title:'Haul Truck Operator (FIFO)', lvl:'Entry', pay:'$70k–$180k',
      regions:[
        { r:'canada', mandatory:['H2S Alive (Energy Safety Canada)','CSO (Common Safety Orientation) or CSTS','Class 1 or Class 3 licence (on-road haul)'],
          medical:'Pre-access drug & alcohol test + site fit-for-duty',
          rtw:'Citizen or PR in practice; LMIA needed for foreign workers and hard for entry roles.',
          helps:['Standard First Aid & CPR-C','Fatigue management','Ground Disturbance (some sites)'], verify:['esc','abclass1','dac'] },
        { r:'us', mandatory:['MSHA Part 46 (surface) new-miner training','Site-specific orientation','CDL-A for on-road haul'],
          medical:'Pre-employment physical + drug screen',
          rtw:'US work authorization required. No sponsorship for entry.',
          helps:['MSHA Part 48 (underground)','Haul-truck simulator / site training'], verify:['msha','dot'] },
        { r:'au', mandatory:['Standard 11 (QLD coal) or state induction','Construction White Card','RIIMPO321 Haul truck (or site training)'],
          medical:'Coal Board medical (QLD) or pre-employment medical + D&A',
          rtw:'Right to work in Australia (PR, 482, or working-holiday). This is the main gate for foreigners.',
          helps:['HR / HC heavy vehicle licence','Fatigue management','4WD / Working at heights (some sites)'], verify:['rshq'] }
      ]},
    { id:'minelabourer', sec:'mining', title:'Mine / Oil-Sands Labourer & Safety Watch', lvl:'Entry', pay:'$60k–$130k',
      regions:[
        { r:'canada', mandatory:['H2S Alive','CSO (Common Safety Orientation) or CSTS','Standard First Aid & CPR-C'],
          medical:'Pre-access drug & alcohol test + fit-for-duty',
          rtw:'Citizen or PR in practice; LMIA needed for foreign workers and hard for entry roles.',
          helps:['Ground Disturbance','Confined Space / Fall Protection (some sites)','Class 5 licence + reliable transport'], verify:['esc','dac'] },
        { r:'us', mandatory:['MSHA Part 46 new-miner training (surface)','Site-specific orientation'],
          medical:'Pre-employment physical + drug screen',
          rtw:'US work authorization required.',
          helps:['OSHA 10','First Aid / CPR','Driver’s licence + own transport'], verify:['msha'] },
        { r:'au', mandatory:['Standard 11 / site induction','Construction White Card'],
          medical:'Pre-employment medical + D&A',
          rtw:'Right to work in Australia (PR, 482, or working-holiday).',
          helps:['Working at Heights / Confined Space','First Aid'], verify:['rshq'] }
      ]},
    { id:'deckhand', sec:'marine', title:'Deckhand / Able Seafarer', lvl:'Entry', pay:'$55k–$130k',
      regions:[
        { r:'global', mandatory:['STCW Basic Safety Training (PST, FF, EFA, PSSR)'],
          medical:'Seafarer medical (ENG1 in UK, or flag-state equivalent)',
          rtw:'Seaman’s book / discharge book; flag-state and visa rules apply.',
          helps:['Proficiency in Security Awareness','Proficiency in Survival Craft (PSCRB) for higher roles'], verify:['stcw','eng1'] }
      ]},
    { id:'welder6g', sec:'weld', title:'6G Pipe Welder', lvl:'Skilled', pay:'$70k–$180k',
      regions:[
        { r:'global', mandatory:['Welder coding test (ASME IX / AWS D1.1 / ISO 9606)','6G all-position pipe test'],
          medical:'Site medical if offshore; eyesight test',
          rtw:'Depends on placement country.',
          helps:['BOSIET + OEUK medical if offshore','CSWIP (inspection-adjacent roles)'], verify:['cswip'] }
      ]},
    { id:'diver', sec:'diving', title:'Commercial Diver', lvl:'Skilled', pay:'$90k–$250k',
      regions:[
        { r:'global', mandatory:['IMCA / ADCI-recognized commercial diver qualification','Surface-supplied / SCUBA cert per scope'],
          medical:'Approved diving medical (HSE / AS-NZS 2299 / national equivalent)',
          rtw:'Depends on placement; strong safety record required.',
          helps:['Offshore survival (BOSIET/FOET)','Rigging / NDT add-ons'], verify:['imca'] }
      ]},
    { id:'driver', sec:'cdl', title:'Oilfield / Mine Haulage Driver', lvl:'Entry', pay:'$70k–$140k',
      regions:[
        { r:'us', mandatory:['CDL Class A','HAZMAT (H) + Tanker (N) endorsements','TWIC (energy/port sites)'],
          medical:'DOT medical certificate',
          rtw:'US work authorization required.',
          helps:['SafeLandUSA orientation'], verify:['twic','dot'] },
        { r:'au', mandatory:['HR / HC / MC heavy vehicle licence','Standard 11 / site induction'],
          medical:'Pre-employment medical + D&A; fatigue management',
          rtw:'Right to work in Australia.',
          helps:['Dangerous goods licence (some loads)'], verify:['rshq'] }
      ]}
  ]
};
if (typeof window !== 'undefined') window.HH_CERTS = HH_CERTS;
