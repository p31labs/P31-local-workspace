/**
 * P31 Cloud Hub — full HTML shell + client renderer (all API sections).
 */

export function buildCloudHubHtml(account) {
	const acct = account || '';
	return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>P31 Cloud Hub — Full Fleet</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:ui-sans-serif,system-ui,sans-serif;background:#050508;color:#e2e8f0;padding:12px;padding-bottom:64px}
.topbar{height:4px;background:linear-gradient(90deg,#6366f1,#22d3ee,#a78bfa,#e8636f);position:fixed;top:0;left:0;right:0;z-index:99}
h1{font-size:22px;background:linear-gradient(90deg,#c4b5fd,#22d3ee,#67e8f9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px}
.sub{font-size:11px;color:#64748b;margin-bottom:14px;line-height:1.5}
.card{background:#0c1018;border:1px solid #1e293b;border-radius:12px;padding:14px;margin-bottom:12px}
.card h2{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:10px}
.row{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid #1e293b;font-size:12px;align-items:flex-start}
.row:last-child{border-bottom:none}
.muted{color:#64748b;font-size:11px}
.bad{color:#f87171}.ok{color:#4ade80}
table{width:100%;font-size:11px;border-collapse:collapse}
th{text-align:left;color:#64748b;font-weight:600;padding:6px 4px;border-bottom:1px solid #334155;font-size:10px}
td{padding:7px 4px;border-bottom:1px solid #1e293b;word-break:break-word;vertical-align:top}
a{color:#67e8f9;text-decoration:none}a:hover{text-decoration:underline}
.btn{width:100%;padding:12px;border-radius:10px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px}
.btn:hover{background:#334155}
input{width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#080c12;color:#e2e8f0;font-size:13px;margin-bottom:8px}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;background:#1e293b;color:#94a3b8;margin-left:6px}
.nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.nav a{font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid #334155;color:#a5b4fc}
.toolbar{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.toolbar button{flex:1;min-width:120px;padding:10px;border-radius:8px;border:1px solid #334155;background:transparent;color:#94a3b8;font-size:11px;cursor:pointer}
#msg{font-size:12px;color:#64748b;margin-bottom:8px;min-height:1.2em}
.jumpgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px}
.jumpgrid a{display:block;padding:8px 10px;border-radius:8px;border:1px solid #1e3a4f;background:#0f172a;color:#7dd3fc;font-size:11px;font-weight:600;text-align:center}
.jumpgrid a:hover{background:#172554}
pre{font-size:10px;overflow:auto;max-height:180px;background:#080c12;padding:8px;border-radius:6px;border:1px solid #1e293b;color:#94a3b8}
.zonehead{font-weight:700;color:#a5b4fc;font-size:12px;margin-bottom:6px}
.stats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.stats span{font-size:11px;padding:4px 10px;border-radius:8px;background:#1e293b;color:#cbd5e1}
</style></head><body>
<div class="topbar"></div>
<h1>P31 CLOUD HUB</h1>
<div class="sub">Full account squeeze — Workers (paginated), Pages, KV, R2, D1, Queues, Hyperdrive, Vectorize, DO, dispatch, zones, per-zone routes, Access, tunnels, Turnstile, subdomain. API token never leaves the Worker.</div>
<div class="stats" id="stats"></div>
<div class="nav">
<a href="/">← Command Center</a>
<a href="https://dash.cloudflare.com/${acct || 'account'}" target="_blank" rel="noopener">Cloudflare Home</a>
<a href="https://one.dash.cloudflare.com/" target="_blank" rel="noopener">Zero Trust (One)</a>
</div>
<div id="gate" class="card">
<h2>Operator token</h2>
<p class="muted" style="margin-bottom:8px">Bearer matches <code style="color:#67e8f9">STATUS_TOKEN</code>. Stored in sessionStorage as <code>p31_cloud_hub_tok</code>.</p>
<input type="password" id="tok" placeholder="Paste operator token" autocomplete="off"/>
<button class="btn" id="save">Unlock full hub</button>
</div>
<p id="msg"></p>
<div class="toolbar" id="toolbar" style="display:none">
<button type="button" id="reload">↻ Cached refresh</button>
<button type="button" id="force">↻ Force API (bypass KV)</button>
</div>
<div id="app"></div>
<script>
(function(){
var SK='p31_cloud_hub_tok';
function esc(s){if(s==null||s==='')return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
/** Failed API blocks are omitted — no error copy. */
function skipUnlessOk(block){
  return block&&block.ok;
}
function genericTable(rows, maxRows){
  if(rows==null)return '<p class="muted">Empty</p>';
  if(!Array.isArray(rows))return '<pre>'+esc(JSON.stringify(rows,null,2))+'</pre>';
  if(!rows.length)return '<p class="muted">Empty</p>';
  var lim=rows.slice(0,maxRows||500);
  var keys=Object.keys(lim[0]).filter(function(k){return k!=='permissions'&&k!=='meta';});
  if(!keys.length)return '<pre>'+esc(JSON.stringify(lim[0],null,2))+'</pre>';
  var head='<tr>'+keys.map(function(k){return '<th>'+esc(k)+'</th>';}).join('')+'</tr>';
  var body=lim.map(function(row){
    return '<tr>'+keys.map(function(k){
      var v=row[k];
      if(v!=null&&typeof v==='object')v=JSON.stringify(v);
      return '<td>'+esc(String(v))+'</td>';
    }).join('')+'</tr>';
  }).join('');
  var more=rows.length>lim.length?'<p class="muted" style="margin-top:8px">Showing '+lim.length+' of '+rows.length+'</p>':'';
  return '<table><thead>'+head+'</thead><tbody>'+body+'</tbody></table>'+more;
}
function renderJump(d){
  var order=[
    ['workers','Workers scripts'],
    ['pages','Pages'],
    ['kv','KV'],
    ['r2','R2'],
    ['d1','D1'],
    ['queues','Queues'],
    ['hyperdrive','Hyperdrive'],
    ['vectorize','Vectorize'],
    ['analytics','Analytics'],
    ['access','Access'],
    ['zeroTrust','Zero Trust']
  ];
  var parts=['<div class="card"><h2>Jump links</h2><div class="jumpgrid">'];
  order.forEach(function(O){
    var k=O[0],lab=O[1];
    if(d[k]) parts.push('<a href="'+esc(d[k])+'" target="_blank" rel="noopener">'+esc(lab)+'</a>');
  });
  parts.push('</div></div>');
  return parts.join('');
}
function renderAccount(block){
  if(!block||!block.ok||!block.result)return '';
  var a=block.result;
  return '<div class="card"><h2>Account</h2><div class="row"><span class="muted">Name</span><span>'+esc(a.name)+'</span></div>'
    +(a.type?'<div class="row"><span class="muted">Type</span><span>'+esc(a.type)+'</span></div>':'')
    +'<div class="row"><span class="muted">ID</span><span class="muted">'+esc(a.id)+'</span></div></div>';
}
function sectionBlock(title,block){
  if(!skipUnlessOk(block))return '';
  var res=block&&block.result;
  if(res==null)return '';
  if(!Array.isArray(res))return '<div class="card"><h2>'+esc(title)+'</h2><pre>'+esc(JSON.stringify(res,null,2))+'</pre></div>';
  if(!res.length)return '';
  return '<div class="card"><h2>'+esc(title)+' · '+res.length+'</h2>'+genericTable(res,400)+'</div>';
}
async function load(force){
  var t=sessionStorage.getItem(SK);
  if(!t){document.getElementById('gate').style.display='block';return;}
  document.getElementById('gate').style.display='none';
  document.getElementById('toolbar').style.display='flex';
  document.getElementById('msg').textContent='';
  var url='/api/cf/summary'+(force?'?refresh=1':'');
  var r=await fetch(url,{headers:{'Authorization':'Bearer '+t}});
  var j=await r.json().catch(function(){return{};});
  if(r.status===401){
    sessionStorage.removeItem(SK);
    document.getElementById('gate').style.display='block';
    document.getElementById('toolbar').style.display='none';
    return;
  }
  if(!r.ok){
    document.getElementById('app').innerHTML='';
    document.getElementById('stats').innerHTML='';
    return;
  }
  if(!j.configured){
    document.getElementById('app').innerHTML='';
    document.getElementById('stats').innerHTML='';
    return;
  }
  var meta=j.meta||{};
  document.getElementById('stats').innerHTML='<span>Worker scripts: '+esc(meta.worker_scripts)+'</span><span>Zones: '+esc(meta.zone_count)+'</span><span>Snapshot: '+esc(j.ts)+'</span>';

  var parts=[];
  parts.push(renderJump(j.dash||{}));
  parts.push(renderAccount(j.account));

  if(skipUnlessOk(j.workers)){
    var ws=(j.workers&&j.workers.result)||[];
    if(ws.length){
      var info=j.workers&&j.workers.result_info;
      var tr=ws.map(function(s){
        return '<tr><td><strong>'+esc(s.id)+'</strong></td><td>'+esc(s.modified_on||s.created_on||'—')+'</td><td class="muted">'+(s.usage_model||'')+'</td></tr>';
      }).join('');
      parts.push('<div class="card"><h2>Workers · '+ws.length+' scripts'+(info&&info.pages?' · '+info.pages+' API page(s)':'')+'</h2><table><thead><tr><th>Name</th><th>Modified</th><th>Model</th></tr></thead><tbody>'+tr+'</tbody></table></div>');
    }
  }

  parts.push(sectionBlock('Pages projects',j.pages));
  parts.push(sectionBlock('KV namespaces',j.kv));
  parts.push(sectionBlock('R2 buckets',j.r2));
  parts.push(sectionBlock('D1 databases',j.d1));
  parts.push(sectionBlock('Queues',j.queues));
  parts.push(sectionBlock('Hyperdrive configs',j.hyperdrive));
  parts.push(sectionBlock('Vectorize indexes',j.vectorize));
  parts.push(sectionBlock('Workers dispatch namespaces',j.dispatchNamespaces));
  parts.push(sectionBlock('Durable Object namespaces',j.durableObjects));
  parts.push(sectionBlock('Turnstile widgets',j.turnstile));
  parts.push(sectionBlock('Access applications',j.access));
  parts.push(sectionBlock('Tunnels (cfd_tunnel)',j.tunnels));

  if(skipUnlessOk(j.workersSubdomain)&&j.workersSubdomain.result){
    parts.push('<div class="card"><h2>Workers · workers.dev subdomain</h2><pre>'+esc(JSON.stringify(j.workersSubdomain.result,null,2))+'</pre></div>');
  }

  if(skipUnlessOk(j.zones)){
    var zr=(j.zones&&j.zones.result)||[];
    if(zr.length){
      parts.push('<div class="card"><h2>Zones · '+zr.length+'</h2>'+genericTable(zr.map(function(z){
        return {name:z.name,status:z.status,id:z.id,plan:(z.plan&&z.plan.name)||''};
      }),100)+'</div>');
    }
  }

  if(Array.isArray(j.zoneRoutes)){
    j.zoneRoutes.forEach(function(zr){
      if(!zr.routes||!zr.routes.ok)return;
      var rr=zr.routes.result||[];
      if(!rr.length)return;
      parts.push('<div class="card"><div class="zonehead">Zone routes · '+esc(zr.zone_name)+' <span class="pill">'+esc(zr.zone_status||'')+'</span></div>');
      parts.push('<p class="muted" style="margin-bottom:8px">'+rr.length+' route(s)</p>'+genericTable(rr.map(function(r){
        return {pattern:r.pattern,script:r.script||r.worker_name||'',id:r.id};
      }),200));
      parts.push('</div>');
    });
  }

  parts.push('<p class="muted" style="text-align:center;margin-top:16px;font-size:11px">P31 Cloud Hub · KV cache ~3 min · force refresh bypasses cache</p>');
  document.getElementById('app').innerHTML=parts.join('');
}
document.getElementById('save').onclick=function(){
  var v=document.getElementById('tok').value.trim();
  if(!v)return;
  sessionStorage.setItem(SK,v);
  document.getElementById('tok').value='';
  load(false);
};
document.getElementById('reload').onclick=function(){load(false);};
document.getElementById('force').onclick=function(){load(true);};
if(sessionStorage.getItem(SK)) load(false);
})();
</script>
</body></html>`;
}
