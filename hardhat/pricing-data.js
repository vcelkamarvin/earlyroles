/* HardHat — shared pricing data + renderer */
var HH_PRICING = [
  {
    id:'pro', name:'HardHat Pro', price:'$48', per:'/month', note:'or $390/yr — save 32%',
    plan:'pro_monthly', cta:'Go Pro', href:'#', feat:true,
    features:[
      {t:'Everything in Deckhand', on:true},
      {t:'Apply to jobs + full agency contacts', on:true},
      {t:'Full ticket & medical roadmap tracker', on:true},
      {t:'Personalized recommendations', on:true},
      {t:'Unlimited saved jobs + job alerts', on:true},
      {t:'AI offshore CV builder', on:true},
      {t:'Application templates that get replies', on:true},
      {t:'Done-for-you CV + agency shortlist', on:false}
    ]
  },
  {
    id:'fasttrack', name:'Fast-Track', price:'$190', per:'one-time', note:'Hired-in-90-days push',
    plan:'fasttrack', cta:'Get Fast-Track', href:'#', feat:false,
    features:[
      {t:'Everything in Pro for 3 months', on:true},
      {t:'Done-for-you offshore CV', on:true},
      {t:'Curated agency shortlist (your sector + region)', on:true},
      {t:'Medical & interview prep guide', on:true},
      {t:'Priority “get hired” support', on:true},
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
