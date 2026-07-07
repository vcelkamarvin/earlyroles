/* HardHat — shared pricing data + renderer
   One-time pricing, no subscription. Good / better / best — middle is the anchor. */
var HH_PRICING = [
  {
    id:'plan48', name:'Rig-Ready Plan', price:'$48', per:'one-time', note:'Your route — do it yourself',
    plan:'plan48', cta:'Get my plan', href:'#', feat:false,
    features:[
      {t:'Your exact ticket & medical roadmap for your region', on:true},
      {t:'Apply to every job + full crewing-agency contacts', on:true},
      {t:'Unlimited saved jobs + job alerts', on:true},
      {t:'Personalized job recommendations', on:true},
      {t:'Pay & rotation explorer', on:true},
      {t:'One payment — keep it for good, no subscription', on:true}
    ]
  },
  {
    id:'pro', name:'Rig-Ready Pro', price:'$120', per:'one-time', note:'Guided — the tools do the work',
    plan:'pro', cta:'Go Pro', href:'#', feat:true,
    features:[
      {t:'Everything in Rig-Ready Plan', on:true},
      {t:'AI offshore CV builder', on:true},
      {t:'Application templates that get replies', on:true},
      {t:'Your week-by-week get-hired plan (region-exact)', on:true},
      {t:'Interview & medical prep guide', on:true},
      {t:'Priority email support', on:true}
    ]
  },
  {
    id:'dfy', name:'Done-For-You', price:'$190', per:'one-time', note:'We do the hard part for you',
    plan:'dfy', cta:'Get Done-For-You', href:'#', feat:false,
    features:[
      {t:'Everything in Rig-Ready Pro', on:true},
      {t:'We write your offshore CV for you', on:true},
      {t:'Hand-picked agency shortlist (your sector + region)', on:true},
      {t:'We get you registered with the right agencies', on:true},
      {t:'1:1 priority “get hired” support', on:true},
      {t:'Your fastest realistic route to signing on', on:true}
    ]
  }
];

function renderPlan(p){
  var lis = p.features.map(function(f){ return '<li'+(f.on?'':' class="off"')+'>'+f.t+'</li>'; }).join('');
  var btn = p.plan
    ? '<button class="btn '+(p.feat?'btn-hi':'btn-ink')+' btn-block" onclick="HH.checkout(\''+p.plan+'\')">'+p.cta+'</button>'
    : '<a class="btn btn-out btn-block" href="'+p.href+'">'+p.cta+'</a>';
  return '<div class="plan'+(p.feat?' feat':'')+' reveal">'+
    (p.feat?'<span class="tag">Most popular</span>':'')+
    '<h3>'+p.name+'</h3>'+
    '<div class="price">'+p.price+'<span>'+p.per+'</span></div>'+
    '<p class="pnote">'+p.note+'</p>'+
    '<ul>'+lis+'</ul>'+
    btn+'</div>';
}
