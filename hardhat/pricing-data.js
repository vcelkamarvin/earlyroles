/* HardHat — shared pricing data + renderer
   One-time pricing, no subscription. $120 Rig-Ready Pro is the flagship; the
   entry tier is deliberately thin and the speed lines escalate to pull buyers up.
   value/youpay are illustrative anchors (labelled), speed = realistic time-to-hired. */
var HH_PRICING = [
  {
    id:'basic', name:'Rig-Ready Basics', price:'$32', per:'one-time', note:'The plan — you take it from here',
    plan:'basic', cta:'Get my plan', href:'#', feat:false,
    speed:'Know exactly what to get — today',
    value:'$120', youpay:'$32',
    features:[
      {t:'Your exact ticket & medical roadmap for your region', on:true},
      {t:'Real ticket + medical cost checklist', on:true},
      {t:'Unlimited saved jobs', on:true},
      {t:'Apply through us + full agency contacts', on:false},
      {t:'CV builder, templates & week-by-week plan', on:false}
    ]
  },
  {
    id:'pro', name:'Rig-Ready Pro', price:'$120', per:'one-time', note:'Everything to actually get hired',
    plan:'pro', cta:'Get me a job', href:'#', feat:true,
    speed:'Applying in ~2 weeks · first offers in ~3–6 weeks',
    value:'$700+', youpay:'$120',
    features:[
      {t:'Everything in Basics', on:true},
      {t:'Apply to every job + full crewing-agency contacts', on:true},
      {t:'AI offshore CV builder that recruiters scan', on:true},
      {t:'Application templates that get replies', on:true},
      {t:'Your week-by-week get-hired plan (region-exact)', on:true},
      {t:'Personalized recommendations + job alerts', on:true},
      {t:'Interview & medical prep + priority support', on:true}
    ]
  }
];

function renderPlan(p){
  var lis = p.features.map(function(f){ return '<li'+(f.on?'':' class="off"')+'>'+f.t+'</li>'; }).join('');
  var btn = p.plan
    ? '<button class="btn '+(p.feat?'btn-go':'btn-out')+' btn-block" onclick="HH.checkout(\''+p.plan+'\')">'+p.cta+'</button>'
    : '<a class="btn btn-out btn-block" href="'+p.href+'">'+p.cta+'</a>';
  var speed = p.speed ? '<div class="pspeed'+(p.feat?' hot':'')+'">⚡ '+p.speed+'</div>' : '';
  var value = p.value ? '<p class="pvalue">~'+p.value+' of guidance &amp; tools — <b>you pay '+(p.youpay||p.price)+'</b> <span>illustrative</span></p>' : '';
  // the body (price → features → CTA) is shared; the featured card nests it in a white inner panel
  var body =
    '<div class="price">'+p.price+'<span>'+p.per+'</span></div>'+
    value+
    speed+
    '<ul>'+lis+'</ul>'+
    btn;
  if(p.feat){
    return '<div class="plan feat reveal">'+
      '<div class="plan-head"><div class="ph-top"><h3>'+p.name+'</h3><span class="tag">Most popular</span></div>'+
      '<p class="pnote">'+p.note+'</p></div>'+
      '<div class="plan-inner">'+body+'</div></div>';
  }
  return '<div class="plan reveal">'+
    '<div class="plan-head"><h3>'+p.name+'</h3><p class="pnote">'+p.note+'</p></div>'+
    body+'</div>';
}
