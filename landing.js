/* EarlyRoles — shared programmatic landing-page engine.
   Each landing page sets window.LANDING = {type:'company', token:'stripe', name:'Stripe'}
   or {type:'role', q:'engineer|developer|software', name:'Software Engineer', loc:'usa'}.
   It pulls the LIVE board, filters to this page, renders the list, and injects
   schema.org/JobPosting for the roles so the page is eligible for Google Jobs. */
(function(){
  var L = window.LANDING || {};
  var board = document.getElementById('board');
  var countEl = document.getElementById('lcount');
  if(!board || !window.fetchRealJobs){ if(board) board.innerHTML='<div class="empty"><a href="jobs.html" style="color:var(--accent);font-weight:600">Browse the full board →</a></div>'; return; }

  var LOC_RX = { usa:/usa|united states|u\.s|u\.s\.a/i, americas:/americas|north america|usa|united states|canada/i, worldwide:/worldwide|anywhere|global/i,
    switzerland:/switzerland|schweiz|suisse|svizzera|z[üu]rich|geneva|gen[eè]ve|basel|bern|lausanne|zug|lugano/i,
    iceland:/iceland|[íi]sland|reykjav[ií]k|k[óo]pavogur|akureyri/i };
  var REGION_KEY={ switzerland:'ch', iceland:'is', usa:'us' };
  function inRegion(j, key){ var rk=REGION_KEY[key]; if(rk && Array.isArray(j.regions)&&j.regions.length) return j.regions.indexOf(rk)>=0; return (LOC_RX[key]||/.*/).test(j.loc||''); }
  function roleRx(){ try{ return L.q ? new RegExp(L.q, 'i') : null; }catch(e){ return null; } }
  function matches(j){
    if(L.type==='company') return String(j.token||'').toLowerCase()===String(L.token||'').toLowerCase() || (j.co||'').toLowerCase()===String(L.name||'').toLowerCase();
    var hay=((j.title||'')+' '+(j.dept||'')+' '+(j.co||'')+' '+(j.tags||[]).join(' ')).toLowerCase();
    var rx=roleRx();
    var ok = rx ? rx.test(hay) : true;
    if(L.region) ok = ok && inRegion(j, L.region);
    else if(L.loc && LOC_RX[L.loc]) ok = ok && LOC_RX[L.loc].test(j.loc||'');
    if(L.visa) ok = ok && (j.visa || (j.tags||[]).indexOf('Visa-friendly')>=0);
    if(L.remoteOnly) ok = ok && (j.remote || /remote/i.test(j.loc||''));
    return ok;
  }
  function rowHTML(j){
    var sv = Auth.saved().includes(j.id);
    var logo = j.logo ? '<span class="jlogo" data-i="'+(j.initials||'')+'"><img src="'+j.logo+'" alt="'+j.co+'" loading="lazy" onerror="this.parentNode.textContent=this.parentNode.dataset.i"></span>' : '<span class="jlogo">'+(j.initials||'•')+'</span>';
    return '<div class="jrow" data-id="'+j.id+'" style="cursor:pointer">'+logo+
      '<div class="jmain"><div class="jtitle">'+j.title+' <span class="new">New</span></div>'+
      '<div class="jmeta"><span>'+j.co+'</span><span>·</span><span>'+j.loc+'</span>'+(j.dept?'<span>·</span><span>'+j.dept+'</span>':'')+'</div>'+
      '<div class="jtags">'+(j.tags||[]).map(function(t){return '<span class="jchip">'+t+'</span>';}).join('')+'</div></div>'+
      '<div class="jside"><div class="jsal">'+(j.sal||'')+(j.salEst?' <span style="font-size:10px;color:var(--faint);font-weight:600">est</span>':'')+'</div><div class="jago">'+(j.ago||'')+'</div>'+
      '<div class="jbtns"><button class="jsave '+(sv?'saved':'')+'" data-id="'+j.id+'">'+(sv?'✓ Saved':'Save')+'</button><button class="japply" type="button" data-url="'+(j.url||'')+'" data-title="'+(j.title||'').replace(/"/g,'&quot;')+'">Apply →</button></div></div></div>';
  }
  var current = [];
  function render(rows){
    current = rows;
    if(countEl) countEl.textContent = rows.length + ' live role' + (rows.length===1?'':'s');
    board.innerHTML = rows.length ? rows.slice(0,80).map(rowHTML).join('') :
      '<div class="empty">No live roles match right now — <a href="jobs.html" style="color:var(--accent);font-weight:600">browse the full board →</a></div>';
  }
  function injectLD(rows){
    var iso = function(t){ try{ return new Date(t||Date.now()).toISOString().slice(0,10); }catch(e){ return new Date().toISOString().slice(0,10); } };
    rows.slice(0,15).forEach(function(j){
      try{
        var s=document.createElement('script'); s.type='application/ld+json';
        s.textContent = JSON.stringify({
          "@context":"https://schema.org/","@type":"JobPosting",
          "title": j.title,
          "description": (j.desc && j.desc.length>40 ? j.desc : (j.title + ' — live US remote role at ' + j.co + '. Apply directly on the company’s careers page via EarlyRoles.')),
          "datePosted": iso(j._ts),
          "validThrough": iso((j._ts||Date.now()) + 45*86400000),
          "employmentType": (/part/i.test(j.type||'') ? 'PART_TIME' : (/contract/i.test(j.type||'') ? 'CONTRACTOR' : 'FULL_TIME')),
          "hiringOrganization": { "@type":"Organization", "name": j.co },
          "jobLocationType": "TELECOMMUTE",
          "applicantLocationRequirements": { "@type":"Country", "name":"USA" },
          "url": j.url
        });
        document.body.appendChild(s);
      }catch(e){}
    });
  }
  board.innerHTML = '<div class="empty">Loading live roles…</div>';
  board.addEventListener('click', function(e){
    var ap = e.target.closest('.japply');
    if(ap){ e.preventDefault(); var r=ap.closest('.jrow'); var job=(r&&current.find(function(x){return String(x.id)===String(r.dataset.id);}))||{title:ap.dataset.title,url:ap.dataset.url}; if(Auth.rememberJob) Auth.rememberJob(job); if(window.isPaid&&isPaid()&&job.url){ window.open(job.url,'_blank','noopener'); } else if(window.showPaywall){ showPaywall(job.title); } return; }
    var b = e.target.closest('.jsave');
    if(b){ var job=current.find(function(x){return String(x.id)===String(b.dataset.id);}); if(job&&Auth.rememberJob) Auth.rememberJob(job); var s=Auth.toggleSave(b.dataset.id); var on=s.includes(Number(b.dataset.id)); b.classList.toggle('saved',on); b.textContent=on?'✓ Saved':'Save'; return; }
    var rw = e.target.closest('.jrow'); if(rw && !e.target.closest('button')) location.href='jobs.html';
  });
  /* sample fallback so region/company pages are never empty if the live feed is slow/quiet */
  function sampleRows(){ if(typeof JOBS==='undefined') return []; return JOBS.map(function(j){ return {id:j.id,title:j.title,co:j.co,logo:j.domain?logoURL(j.domain):'',initials:(j.co||'').slice(0,2).toUpperCase(),loc:j.loc,dept:j.dept,type:j.lvl,tags:j.tags,sal:j.sal,ago:j.ago,url:j.url||'signup.html',visa:!!j.visa,remote:/remote/i.test(j.loc||'')}; }); }
  var SAMPLE=sampleRows(), LIVE=[];
  function source(){ return LIVE.length?LIVE:SAMPLE; }
  /* let host pages re-apply filters (search / visa / remote toggles) live */
  window.__landingRefilter=function(){ render(source().filter(matches)); };
  render(SAMPLE.filter(matches));
  var rt = 0;
  fetchRealJobs('', function(partial){ if(partial&&partial.length){ LIVE=partial; var now=Date.now(); if(now-rt>300){ rt=now; window.__landingRefilter(); } } })
    .then(function(list){ if(list&&list.length) LIVE=list; var rows=source().filter(matches); render(rows); injectLD(rows); })
    .catch(function(){ var rows=source().filter(matches); if(rows.length){ render(rows); } else { board.innerHTML='<div class="empty"><a href="jobs.html" style="color:var(--accent);font-weight:600">Browse the full board →</a></div>'; } });
})();
