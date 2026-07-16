/**
 * EPCP Dashboard — P31 Design System Edition
 * Phase 3: KPI cards, worker list, panic buttons, legal/financial cards
 * Updated: P31 tokens, glassmorphism, starfield, spoon controls, footer
 */
export function buildEpcpDashboardHtml() {
  var html = '<!DOCTYPE html>';
  html += '<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
  html += '<title>G.O.D. / EPCP Command Center</title>';
  html += '<link rel="preconnect" href="https://fonts.googleapis.com" />';
  html += '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />';
  html += '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />';
  html += '<style>';
  html += ':root{--void:#0A0A0F;--surface:#12121A;--surface2:#1C1C2A;--text-primary:#F5F5F7;--text-secondary:rgba(245,245,247,0.6);--text-tertiary:rgba(245,245,247,0.3);--quantum-cyan:#00F0FF;--quantum-violet:#A78BFA;--quantum-gold:#FBBF24;--quantum-green:#34D399;--quantum-red:#FB7185;--glass-surface:rgba(255,255,255,0.04);--glass-border:rgba(255,255,255,0.08);--glass-blur:12px;--glass-radius:24px;--font-sans:"Inter",system-ui,sans-serif;--font-mono:"JetBrains Mono",monospace}';
  html += '*{box-sizing:border-box;margin:0;padding:0}';
  html += 'body{font-family:var(--font-sans);background:var(--void);color:var(--text-primary);min-height:100vh;display:flex;flex-direction:column;align-items:center}';
  html += '.container{max-width:1200px;width:100%;padding:24px;position:relative;z-index:1}';
  html += '.glass-panel{background:var(--glass-surface);backdrop-filter:blur(var(--glass-blur));-webkit-backdrop-filter:blur(var(--glass-blur));border:1px solid var(--glass-border);border-radius:var(--glass-radius);padding:24px;transition:all .3s cubic-bezier(.4,0,.2,1)}';
  html += '.glass-panel:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.15)}';
  html += '.header{display:flex;align-items:center;gap:24px;margin-bottom:32px;flex-wrap:wrap}';
  html += '.header h1{font-size:28px;font-weight:800;letter-spacing:-.02em}';
  html += '.header .accent{color:var(--quantum-cyan)}';
  html += '.header .sub{color:var(--text-secondary);font-size:14px;margin-top:4px}';
  html += '.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}';
  html += '.kpi-card{text-align:center}';
  html += '.kpi-value{font-size:28px;font-weight:800;line-height:1.2}';
  html += '.kpi-label{font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin-top:4px}';
  html += '.card-title{font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;font-weight:600}';
  html += '.btn{padding:10px 16px;border-radius:12px;border:1px solid var(--glass-border);background:var(--glass-surface);color:var(--text-primary);font-size:13px;font-weight:600;cursor:pointer;margin-right:8px;margin-bottom:8px;font-family:var(--font-sans);transition:all .2s}';
  html += '.btn:hover{background:rgba(255,255,255,0.08)}';
  html += '.btn-danger{border-color:var(--quantum-red);color:var(--quantum-red)}';
  html += '.btn-danger:hover{background:rgba(251,113,133,0.1)}';
  html += '.btn-success{border-color:var(--quantum-green);color:var(--quantum-green)}';
  html += '.btn-success:hover{background:rgba(52,211,153,0.1)}';
  html += '.status-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:8px}';
  html += '.status-dot.online{background:var(--quantum-green);box-shadow:0 0 8px var(--quantum-green)}';
  html += '.status-dot.offline{background:var(--quantum-red);box-shadow:0 0 8px var(--quantum-red)}';
  html += '.status-dot.degraded{background:var(--quantum-gold);box-shadow:0 0 8px var(--quantum-gold)}';
  html += '.worker-row{display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--glass-border);border-radius:12px;margin-bottom:8px;cursor:pointer;transition:all .2s}';
  html += '.worker-row:hover{background:rgba(255,255,255,0.05)}';
  html += '.worker-details{display:none;padding:12px;background:var(--void);border:1px solid var(--glass-border);border-radius:12px;margin-top:8px;font-size:12px}';
  html += '.alert{padding:12px;border-radius:12px;margin-bottom:12px;font-size:13px}';
  html += '.alert-warning{background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);color:var(--quantum-gold)}';
  html += '.date-row{display:flex;gap:10px;padding:5px 6px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04)}';
  html += '.date-row:last-child{border-bottom:none}';
  html += '.dt-date{font-weight:700;min-width:70px;font-size:12px;color:var(--quantum-cyan);font-family:var(--font-mono)}';
  html += '.spoon-controls{display:flex;gap:8px;align-items:center;padding:8px 16px;background:var(--glass-surface);backdrop-filter:blur(var(--glass-blur));border:1px solid var(--glass-border);border-radius:100px;width:fit-content}';
  html += '.spoon-controls label{font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin-right:4px}';
  html += '.spoon-btn{width:32px;height:32px;border-radius:50%;border:1px solid var(--glass-border);background:transparent;color:var(--text-secondary);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;font-family:var(--font-mono)}';
  html += '.spoon-btn:hover{background:rgba(255,255,255,0.05)}';
  html += '.spoon-btn.active{background:rgba(0,240,255,0.2);border-color:var(--quantum-cyan);color:var(--quantum-cyan);box-shadow:0 0 20px rgba(0,240,255,0.15)}';
  html += 'footer{margin-top:auto;padding:20px 0;border-top:1px solid var(--glass-border);text-align:center;font-size:12px;color:var(--text-tertiary);width:100%}';
  html += '@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}';
  html += '@media(max-width:600px){body{padding:16px}.header h1{font-size:20px}.kpi-value{font-size:22px}}';
  html += '</style></head><body data-spoons="3">';

  // Starfield canvas
  html += '<canvas id="p31-starfield" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0"></canvas>';
  html += '<script>';
  html += '(function(){var c=document.getElementById("p31-starfield"),x=c.getContext("2d"),W,H,p=[],N=50,S=0.08,CR=60,BA=0.18,HA=0.035,TG=0.016,CR2=0.3,BR=0.00075,DM=0.7;var TEAL=[77,184,168],CORAL=[204,98,71];function resize(){var r=c.getBoundingClientRect();var d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0)}function seed(){p=[];for(var i=0;i<N;i++){var ic=Math.random()<CR2;p.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+.35,vx:(Math.random()-.5)*S*2,vy:(Math.random()-.5)*S*2,a:Math.random()*BA+.05,c:ic?[...CORAL]:[...TEAL]})}}function draw(t){var br=Math.sin(t*BR)*.5+.5;var g=x.createRadialGradient(W/2,H*.92,0,W/2,H*.92,H*.75);g.addColorStop(0,"rgba(204,98,71,"+HA*(.8+br*.4)*DM+")");g.addColorStop(.5,"rgba(204,98,71,"+HA*(.8+br*.4)*DM*.35+")");g.addColorStop(1,"rgba(5,8,12,0)");x.fillStyle=g;x.fillRect(0,0,W,H);var g2=x.createRadialGradient(W*.42,H*.22,0,W*.42,H*.22,H*.48);g2.addColorStop(0,"rgba(37,137,125,"+TG*DM+")");g2.addColorStop(1,"rgba(5,8,12,0)");x.fillStyle=g2;x.fillRect(0,0,W,H);for(var i=0;i<p.length;i++){for(var j=i+1;j<p.length;j++){var a=p[i],b=p[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;if(d2>CR*CR)continue;var d=Math.sqrt(d2),la=.042*(1-d/CR)*DM;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.strokeStyle="rgba("+a.c[0]+","+a.c[1]+","+a.c[2]+","+Math.min(la,.14)+")";x.lineWidth=.5;x.stroke()}}for(var i=0;i<p.length;i++){var q=p[i];q.x+=q.vx;q.y+=q.vy;if(q.x<-10)q.x=W+10;if(q.x>W+10)q.x=-10;if(q.y<-10)q.y=H+10;if(q.y>H+10)q.y=-10;var pa=q.a*DM*(.72+br*.28);x.beginPath();x.arc(q.x,q.y,q.r,0,Math.PI*2);x.fillStyle="rgba("+q.c[0]+","+q.c[1]+","+q.c[2]+","+pa+")";x.fill()}}function loop(now){draw(now);requestAnimationFrame(loop)}window.matchMedia("(prefers-reduced-motion: reduce)").matches?(resize(),seed(),draw(0)):(resize(),seed(),requestAnimationFrame(loop));window.addEventListener("resize",function(){resize();seed()})})();';
  html += '</script>';

  html += '<div class="container" id="app"></div>';

  html += '<script>';
  html += 'function loadDashboard(){';
  html += '  var app=document.getElementById("app");';
  html += '  app.innerHTML="<div style=\\"color:var(--text-secondary)\\">Syncing fleet telemetry...</div>";';
  html += '  fetch("/api/whoami").then(function(r){return r.json()}).then(function(whoami){';
  html += '    fetch("/api/status").then(function(r){return r.json()}).then(function(status){';
  html += '      renderDashboard(whoami,status);';
  html += '    }).catch(function(e){app.innerHTML="Error loading status: "+e.message});';
  html += '  }).catch(function(e){app.innerHTML="Error loading user info: "+e.message});';
  html += '}';

  html += 'function renderDashboard(whoami,status){';
  html += '  var app=document.getElementById("app");';
  html += '  var out="";';

  // Header with spoon controls
  html += '  out+="<header class=\\"header\\">";';
  html += '  out+="<div style=\\"width:80px;height:80px;background:radial-gradient(circle,rgba(0,240,255,0.2) 0%,transparent 70%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px\\">⚡</div>";';
  html += '  out+="<div><h1>G.O.D. / <span class=\\"accent\\">EPCP</span></h1><div class=\\"sub\\">Grounded Operator Deck — Command Center</div></div>";';
  html += '  out+="<div class=\\"spoon-controls\\"><label>Spoons</label>";';
  html += '  for(var s=0;s<=5;s++){out+="<button class=\\"spoon-btn\\" data-spoon=\\""+s+"\\" onclick=\\"document.body.dataset.spoons="+s+";document.querySelectorAll(\\'.spoon-btn\\').forEach(function(b){b.classList.remove(\\'active\\')});this.classList.add(\\'active\\')\\">"+s+"</button>"}';
  html += '  out+="</div></header>";';

  // Auth info
  html += '  var whoamiText=whoami.authenticated?"Logged in as "+whoami.email+" ("+whoami.role+")":"Not authenticated";';
  html += '  out+="<div style=\\"font-size:11px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:24px\\">"+whoamiText+"</div>";';

  // Local deck card
  html += '  out+="<div class=\\"glass-panel\\" style=\\"margin-bottom:24px\\">";';
  html += '  out+="<div class=\\"card-title\\" style=\\"color:var(--quantum-violet)\\">Local machine + agent lattice</div>";';
  html += '  out+="<p style=\\"font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:10px\\">The <strong style=\\"color:var(--text-primary)\\">P31 home</strong> tree runs a whitelisted <strong>localhost</strong> API on <code style=\\"color:var(--quantum-cyan)\\">127.0.0.1:3131</code> (run <code style=\\"color:var(--quantum-violet)\\">npm run command-center</code> there).</p>";';
  html += '  out+="<a href=\\"http://127.0.0.1:3131/\\" target=\\"_blank\\" rel=\\"noopener\\" class=\\"btn\\" style=\\"display:inline-block;margin:0 0 10px 0\\">Open local P31 command center</a>";';
  html += '  out+="<div style=\\"font-size:11px;color:var(--text-tertiary);margin-bottom:14px\\">Nothing loads? <code>cd</code> to the <strong>bonding-soup</strong> repo root, then <code>npm run command-center</code>.</div>";';

  // Connection lattice
  html += '  out+="<div class=\\"card-title\\" style=\\"color:var(--text-secondary);margin-top:4px\\">Connection lattice</div>";';
  html += '  out+="<table style=\\"width:100%;font-size:12px;border-collapse:collapse\\"><tbody>";';
  html += '  out+="<tr style=\\"border-bottom:1px solid rgba(255,255,255,0.04)\\"><td style=\\"padding:6px 8px 6px 0;vertical-align:top;color:var(--text-secondary);width:28%\\"><strong>Local</strong></td><td style=\\"padding:6px 0;vertical-align:top;color:var(--text-primary)\\">This machine: buttons · <a href=\\"http://127.0.0.1:3131/\\" target=\\"_blank\\" rel=\\"noopener\\" style=\\"color:var(--quantum-cyan)\\">:3131</a></td></tr>";';
  html += '  out+="<tr style=\\"border-bottom:1px solid rgba(255,255,255,0.04)\\"><td style=\\"padding:6px 8px 6px 0;vertical-align:top;color:var(--text-secondary)\\"><strong>Hub</strong></td><td style=\\"padding:6px 0;vertical-align:top\\"><a href=\\"https://p31ca.org/ops/\\" target=\\"_blank\\" rel=\\"noopener\\" style=\\"color:var(--quantum-cyan)\\">p31ca.org/ops</a> · <a href=\\"https://p31ca.org/\\" target=\\"_blank\\" rel=\\"noopener\\" style=\\"color:var(--quantum-cyan)\\">p31ca.org</a></td></tr>";';
  html += '  out+="<tr><td style=\\"padding:6px 8px 6px 0;vertical-align:top;color:var(--text-secondary)\\"><strong>Edge</strong></td><td style=\\"padding:6px 0;vertical-align:top\\">This Worker (Access + fleet below)</td></tr>";';
  html += '  out+="</tbody></table>";';
  html += '  out+="</div>";';

  // KPI grid
  html += '  var workerCount=status.workers?status.workers.length:0;';
  html += '  var onlineCount=status.workers?status.workers.filter(function(w){return w.status==="online"}).length:0;';
  html += '  var degradedCount=workerCount-onlineCount;';

  html += '  out+="<div class=\\"kpi-grid\\">";';
  html += '  out+="<div class=\\"glass-panel kpi-card\\"><div class=\\"kpi-value\\" style=\\"color:var(--quantum-green)\\">"+onlineCount+"</div><div class=\\"kpi-label\\">Online Nodes</div></div>";';
  html += '  out+="<div class=\\"glass-panel kpi-card\\"><div class=\\"kpi-value\\" style=\\"color:var(--quantum-red)\\">"+degradedCount+"</div><div class=\\"kpi-label\\">Offline/Degraded</div></div>";';
  html += '  out+="<div class=\\"glass-panel kpi-card\\"><div class=\\"kpi-value\\" style=\\"color:var(--quantum-cyan)\\">"+workerCount+"</div><div class=\\"kpi-label\\">Total Fleet</div></div>";';
  html += '  out+="<div class=\\"glass-panel kpi-card\\"><div class=\\"kpi-value\\" style=\\"color:var(--quantum-violet)\\">"+ (status.grants ? status.grants.active : "?") +"</div><div class=\\"kpi-label\\">Active Grants</div></div>";';
  html += '  out+="<div class=\\"glass-panel kpi-card\\"><div class=\\"kpi-value\\" style=\\"color:var(--quantum-gold)\\">"+ (status.grants ? status.grants.daysToNextDeadline : "?") +"</div><div class=\\"kpi-label\\">Days to Deadline</div></div>";';
  html += '  out+="</div>";';

  // Legal alert
  html += '  if(status.legal && status.legal.next_hearing){';
  html += '    out+="<div class=\\"alert alert-warning\\">⚠ NEXT HEARING: "+status.legal.next_hearing+" — "+status.legal.case+"</div>";';
  html += '  }';

  // Fleet matrix
  html += '  out+="<div class=\\"glass-panel\\" style=\\"margin-bottom:24px\\"><div class=\\"card-title\\">Fleet Matrix</div>";';
  html += '  if(status.workers){';
  html += '    status.workers.forEach(function(w){';
  html += '      var dotClass=w.status==="online"?"online":w.status==="debug"?"degraded":"offline";';
  html += '      out+="<div class=\\"worker-row\\" onclick=\\"toggleDetails(\\''"+w.name+"\\')\\">";';
  html += '      out+="<div><span class=\\"status-dot "+dotClass+"\\"></span><span style=\\"font-weight:600\\">"+w.name+"</span></div>";';
  html += '      out+="<span style=\\"font-size:10px;color:var(--text-tertiary);text-transform:uppercase\\">"+w.status+"</span>";';
  html += '      out+="</div>";';
  html += '      out+="<div class=\\"worker-details\\" id=\\"details-"+w.name+"\\">";';
  html += '      out+="<div>Endpoint: <a href=\\""+w.url+"\\" target=\\"_blank\\" style=\\"color:var(--quantum-cyan)\\">"+w.url+"</a></div>";';
  html += '      out+="<button class=\\"btn btn-danger\\" onclick=\\"panic(\\''"+w.name+"\\')\\">⚠ Quarantine</button>";';
  html += '      out+="<button class=\\"btn btn-success\\" onclick=\\"rollback(\\''"+w.name+"\\')\\">↻ Rollback</button>";';
  html += '      out+="</div>";';
  html += '    });';
  html += '  }';
  html += '  out+="</div>";';

  // Financial telemetry
  html += '  if(status.financial){';
  html += '    out+="<div class=\\"glass-panel\\" style=\\"margin-bottom:24px\\"><div class=\\"card-title\\">Financial Telemetry</div>";';
  html += '    out+="<div style=\\"display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)\\"><span style=\\"color:var(--text-secondary)\\">Operating Buffer</span><span style=\\"color:var(--text-primary);font-weight:600\\">"+status.financial.operating_buffer+"</span></div>";';
  html += '    out+="<div style=\\"display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)\\"><span style=\\"color:var(--text-secondary)\\">Active Grants</span><span style=\\"color:var(--text-primary);font-weight:600\\">"+status.financial.grants_active+"</span></div>";';
  html += '    out+="<div style=\\"display:flex;justify-content:space-between;padding:6px 0\\"><span style=\\"color:var(--text-secondary)\\">Corp Status</span><span style=\\"color:var(--text-primary);font-weight:600\\">"+status.financial.corp_status+"</span></div>";';
  html += '    out+="</div>";';
  html += '  }';

  // Strategic timeline
  html += '  if(status.dates && status.dates.length){';
  html += '    out+="<div class=\\"glass-panel\\" style=\\"margin-bottom:24px\\"><div class=\\"card-title\\">Strategic Timeline</div>";';
  html += '    var datesToShow=status.dates.slice(0,5);';
  html += '    datesToShow.forEach(function(d){';
  html += '      out+="<div class=\\"date-row\\"><span class=\\"dt-date\\">"+d.date+"</span><span>"+d.event+"</span></div>";';
  html += '    });';
  html += '    out+="</div>";';
  html += '  }';

  // Sync button
  html += '  out+="<div style=\\"margin-top:24px\\"><button class=\\"btn\\" onclick=\\"loadDashboard()\\">↻ Sync Telemetry</button></div>";';
  html += '  app.innerHTML=out;';

  // Activate default spoon button
  html += '  var activeSpoon=document.querySelector(".spoon-btn[data-spoon=\\""+(document.body.dataset.spoons||3)+"\\"]");';
  html += '  if(activeSpoon)activeSpoon.classList.add("active");';
  html += '}';

  html += 'function toggleDetails(name){';
  html += '  var el=document.getElementById("details-"+name);';
  html += '  el.style.display = (el.style.display==="block") ? "none" : "block";';
  html += '}';
  html += 'function panic(name){alert("EPCP Policy Enforcement: Quarantining node "+name)}';
  html += 'function rollback(name){alert("EPCP Artifact Swap: Rolling back node "+name)}';

  html += 'loadDashboard();';
  html += '</script>';

  // Footer
  html += '<footer>Command Center · P31 Labs · EIN 42-1888158</footer>';

  html += '</body></html>';

  return html;
}
