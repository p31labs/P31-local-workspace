/**
 * EPCP Dashboard — Vanilla JS implementation (no React, no nested templates)
 * Phase 3: KPI cards, worker list, panic buttons, legal/financial cards
 */
export function buildEpcpDashboardHtml() {
  var html = '<!DOCTYPE html>';
  html += '<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
  html += '<title>G.O.D. / EPCP Command Center</title>';
  html += '<style>';
  html += '*{box-sizing:border-box;margin:0;padding:0}';
  html += 'body{font-family:system-ui,sans-serif;background:#0a0a14;color:#e2e8f0;padding:12px}';
  html += '.header{height:48px;background:linear-gradient(90deg,#6366f1,#22d3ee,#a78bfa,#e8636f);position:fixed;top:0;left:0;right:0;z-index:99}';
  html += '.container{max-width:1200px;margin:0 auto;padding:64px 16px 32px}';
  html += '.card{background:#111827;border:1px solid #1e293b;border-radius:12px;padding:16px;margin-bottom:16px}';
  html += '.card-title{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}';
  html += '.btn{padding:10px 16px;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:13px;font-weight:600;cursor:pointer;margin-right:8px;margin-bottom:8px}';
  html += '.btn:hover{background:#334155}';
  html += '.btn-danger{border-color:#ef4444;color:#ef4444}';
  html += '.btn-danger:hover{background:#ef444420}';
  html += '.btn-success{border-color:#22c55e;color:#22c55e}';
  html += '.status-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:8px}';
  html += '.status-dot.online{background:#22c55e;box-shadow:0 0 8px #22c55e}';
  html += '.status-dot.offline{background:#ef4444;box-shadow:0 0 8px #ef4444}';
  html += '.status-dot.degraded{background:#eab308;box-shadow:0 0 8px #eab308}';
  html += '.worker-row{display:flex;justify-content:space-between;align-items:center;padding:12px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;margin-bottom:8px;cursor:pointer}';
  html += '.worker-row:hover{background:#1e293b}';
  html += '.worker-details{display:none;padding:12px;background:#0a0a14;border:1px solid #1e293b;border-radius:8px;margin-top:8px;font-size:12px}';
  html += '.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:16px}';
  html += '.kpi-card{background:#111827;border:1px solid #1e293b;border-radius:12px;padding:16px}';
  html += '.kpi-value{font-size:24px;font-weight:700;color:#e2e8f0}';
  html += '.kpi-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px}';
  html += '.alert{padding:12px;border-radius:8px;margin-bottom:12px;font-size:13px}';
  html += '.alert-warning{background:#eab30820;border:1px solid #eab308;color:#eab308}';
  html += '.date-row{display:flex;gap:10px;padding:5px 6px;font-size:13px;border-bottom:1px solid #1e293b}';
  html += '.date-row:last-child{border-bottom:none}';
  html += '.dt-date{font-weight:700;min-width:70px;font-size:12px;color:#22d3ee}';
  html += '</style></head><body>';
  html += '<div class="header"></div>';
  html += '<div class="container" id="app"></div>';
  
  html += '<script>';
  html += 'function loadDashboard(){';
  html += '  var app=document.getElementById("app");';
  html += '  app.innerHTML="<div style=\\"color:#64748b\\">Syncing fleet telemetry...</div>";';
  html += '  fetch("/api/whoami").then(function(r){return r.json()}).then(function(whoami){';
  html += '    fetch("/api/status").then(function(r){return r.json()}).then(function(status){';
  html += '      renderDashboard(whoami,status);';
  html += '    }).catch(function(e){app.innerHTML="Error loading status: "+e.message});';
  html += '  }).catch(function(e){app.innerHTML="Error loading user info: "+e.message});';
  html += '}';
  
  html += 'function renderDashboard(whoami,status){';
  html += '  var app=document.getElementById("app");';
  html += '  var out="";';
  html += '  out+="<div style=\\"margin-bottom:24px\\">";';
  html += '  out+="<h1 style=\\"font-size:22px;background:linear-gradient(90deg,#c4b5fd,#22d3ee,#67e8f9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:2px\\">G.O.D. / EPCP</h1>";';
  html += '  out+="<div style=\\"font-size:12px;color:#64748b;margin-bottom:8px\\">Grounded Operator Deck — <span style=\\"color:#94a3b8\\">edge fleet + <strong>local 127.0.0.1:3131</strong> (P31 home) + <a href=\\"https://p31ca.org/ops/\\" target=\\"_blank\\" rel=\\"noopener\\" style=\\"color:#22d3ee\\">p31ca/ops</a> glass</span></div>";';
  html += '  var whoamiText=whoami.authenticated?"Logged in as "+whoami.email+" ("+whoami.role+")":"Not authenticated";';
  html += '  out+="<div style=\\"font-size:11px;color:#64748b;text-transform:uppercase\\">"+whoamiText+"</div>";';
  html += '  out+="</div>";';
  html += '  out+="<div class=\\"card\\" id=\\"god-local-deck\\" style=\\"border-color:#4f46e5;background:linear-gradient(180deg,rgba(79,70,229,0.12),#111827);\\">";';
  html += '  out+="<div class=\\"card-title\\" style=\\"color:#a5b4fc;letter-spacing:0.08em\\">Local machine + agent lattice</div>";';
  html += '  out+="<p style=\\"font-size:13px;color:#94a3b8;line-height:1.6;margin-bottom:10px\\">The <strong style=\\"color:#e2e8f0\\">P31 home</strong> tree runs a whitelisted <strong>localhost</strong> API on <code style=\\"color:#22d3ee\\">127.0.0.1:3131</code> (run <code style=\\"color:#a78bfa\\">npm run command-center</code> there) — one-click <code>git hooks</code>, <code>verify:monetary</code>, <code>pr</code>, Andromeda <code>prepush:check</code>, etc. <strong>Cloud cannot reach 127.0.0.1</strong> — you open that URL on the same box you use for Cursor/terminal.</p>";';
  html += '  out+="<a href=\\"http://127.0.0.1:3131/\\" target=\\"_blank\\" rel=\\"noopener\\" class=\\"btn\\" style=\\"display:inline-block;margin:0 0 10px 0\\">Open local P31 command center</a>";';
  html += '  out+="<div style=\\"font-size:11px;color:#64748b;margin-bottom:14px\\">Nothing loads? <code>cd</code> to the <strong>bonding-soup</strong> (P31 home) repo root, then <code>npm run command-center</code>. Keep that terminal open (Ctrl+C stops the server).</div>";';
  html += '  out+="<div class=\\"card-title\\" style=\\"color:#94a3b8;margin-top:4px\\">Connection lattice (where to act, super-linear)</div>";';
  html += '  out+="<table style=\\"width:100%;font-size:12px;border-collapse:collapse\\"><tbody>";';
  html += '  out+="<tr style=\\"border-bottom:1px solid #1e293b\\"><td style=\\"padding:6px 8px 6px 0;vertical-align:top;color:#64748b;width:28%\\"><strong>Local</strong></td><td style=\\"padding:6px 0;vertical-align:top;color:#cbd5e1\\">This machine: buttons · <a href=\\"http://127.0.0.1:3131/\\" target=\\"_blank\\" rel=\\"noopener\\" style=\\"color:#22d3ee\\">:3131</a> · repo <code>AGENTS.md</code> + <code>P31-ROOT-MAP.md</code></td></tr>";';
  html += '  out+="<tr style=\\"border-bottom:1px solid #1e293b\\"><td style=\\"padding:6px 8px 6px 0;vertical-align:top;color:#64748b\\"><strong>Hub</strong> (read-mostly)</td><td style=\\"padding:6px 0;vertical-align:top\\"><a href=\\"https://p31ca.org/ops/\\" target=\\"_blank\\" rel=\\"noopener\\" style=\\"color:#22d3ee\\">p31ca.org/ops</a> glass · <a href=\\"https://p31ca.org/\\" target=\\"_blank\\" rel=\\"noopener\\" style=\\"color:#22d3ee\\">p31ca.org</a> · <a href=\\"https://p31ca.org/mesh-start.html\\" target=\\"_blank\\" rel=\\"noopener\\" style=\\"color:#22d3ee\\">mesh-start</a></td></tr>";';
  html += '  out+="<tr><td style=\\"padding:6px 8px 6px 0;vertical-align:top;color:#64748b\\"><strong>Edge</strong></td><td style=\\"padding:6px 0;vertical-align:top\\">This Worker (Access + fleet below) + write paths per EPCP</td></tr>";';
  html += '  out+="</tbody></table>";';
  html += '  out+="<div class=\\"card-title\\" style=\\"color:#94a3b8;margin-top:12px\\">Repos</div>";';
  html += '  out+="<div style=\\"font-size:12px;color:#94a3b8;line-height:1.6\\">• <a href=\\"https://github.com/p31labs/andromeda\\" target=\\"_blank\\" rel=\\"noopener\\" style=\\"color:#22d3ee\\">github.com/p31labs/andromeda</a> (monorepo)<br>• P31 <strong>home</strong> (BONDING Soup + <code>npm run command-center</code>) is a sibling / multi-root clone — see CWP and <code>docs/HANDOFF-PROMPT-COMMAND-CENTER.md</code> in the tree</div>";';
  html += '  out+="</div>";';
  
  html += '  var workerCount=status.workers?status.workers.length:0;';
  html += '  var onlineCount=status.workers?status.workers.filter(function(w){return w.status==="online"}).length:0;';
  html += '  var degradedCount=workerCount-onlineCount;';
  
  html += '  out+="<div class=\\"kpi-grid\\">";';
  html += '  out+="<div class=\\"kpi-card\\"><div class=\\"kpi-value\\">"+onlineCount+"</div><div class=\\"kpi-label\\">Online Nodes</div></div>";';
  html += '  out+="<div class=\\"kpi-card\\"><div class=\\"kpi-value\\">"+degradedCount+"</div><div class=\\"kpi-label\\">Offline/Degraded</div></div>";';
  html += '  out+="<div class=\\"kpi-card\\"><div class=\\"kpi-value\\">"+workerCount+"</div><div class=\\"kpi-label\\">Total Fleet</div></div>";';
  html += '  out+="<div class=\\"kpi-card\\"><div class=\\"kpi-value\\" style=\\"color:#22d3ee\\">"+ (status.grants ? status.grants.active : "?") +"</div><div class=\\"kpi-label\\">Active Grants</div></div>";';
  html += '  out+="<div class=\\"kpi-card\\"><div class=\\"kpi-value\\" style=\\"color:#eab308\\">"+ (status.grants ? status.grants.daysToNextDeadline : "?") +"</div><div class=\\"kpi-label\\">Days to Next Deadline</div></div>";';
  html += '  out+="</div>";';
  
  html += '  if(status.legal && status.legal.next_hearing){';
  html += '    out+="<div class=\\"alert alert-warning\\">⚠ NEXT HEARING: "+status.legal.next_hearing+" — "+status.legal.case+"</div>";';
  html += '  }';
  
  html += '  out+="<div class=\\"card\\"><div class=\\"card-title\\">Fleet Matrix</div>";';
  html += '  if(status.workers){';
  html += '    status.workers.forEach(function(w){';
  html += '      var dotClass=w.status==="online"?"online":w.status==="debug"?"degraded":"offline";';
  html += '      out+="<div class=\\"worker-row\\" onclick=\\"toggleDetails(\\""+w.name+"\\")\\">";';
  html += '      out+="<div><span class=\\"status-dot "+dotClass+"\\"></span><span style=\\"font-weight:600\\">"+w.name+"</span></div>";';
  html += '      out+="<span style=\\"font-size:10px;color:#64748b;text-transform:uppercase\\">"+w.status+"</span>";';
  html += '      out+="</div>";';
  html += '      out+="<div class=\\"worker-details\\" id=\\"details-"+w.name+"\\">";';
  html += '      out+="<div>Endpoint: <a href=\\""+w.url+"\\" target=\\"_blank\\" style=\\"color:#22d3ee\\">"+w.url+"</a></div>";';
  html += '      out+="<button class=\\"btn btn-danger\\" onclick=\\"panic(\\""+w.name+"\\")\\">⚠ Quarantine</button>";';
  html += '      out+="<button class=\\"btn btn-success\\" onclick=\\"rollback(\\""+w.name+"\\")\\">↻ Rollback</button>";';
  html += '      out+="</div>";';
  html += '    });';
  html += '  }';
  html += '  out+="</div>";';
  
  html += '  if(status.financial){';
  html += '    out+="<div class=\\"card\\"><div class=\\"card-title\\">Financial Telemetry</div>";';
  html += '    out+="<div style=\\"display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b\\"><span style=\\"color:#64748b\\">Operating Buffer</span><span style=\\"color:#e2e8f0;font-weight:600\\">"+status.financial.operating_buffer+"</span></div>";';
  html += '    out+="<div style=\\"display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b\\"><span style=\\"color:#64748b\\">Active Grants</span><span style=\\"color:#e2e8f0;font-weight:600\\">"+status.financial.grants_active+"</span></div>";';
  html += '    out+="<div style=\\"display:flex;justify-content:space-between;padding:6px 0\\"><span style=\\"color:#64748b\\">Corp Status</span><span style=\\"color:#e2e8f0;font-weight:600\\">"+status.financial.corp_status+"</span></div>";';
  html += '    out+="</div>";';
  html += '  }';
  
  html += '  if(status.dates && status.dates.length){';
  html += '    out+="<div class=\\"card\\"><div class=\\"card-title\\">Strategic Timeline</div>";';
  html += '    var datesToShow=status.dates.slice(0,5);';
  html += '    datesToShow.forEach(function(d){';
  html += '      out+="<div class=\\"date-row\\"><span class=\\"dt-date\\">"+d.date+"</span><span>"+d.event+"</span></div>";';
  html += '    });';
  html += '    out+="</div>";';
  html += '  }';
  
  html += '  out+="<div style=\\"margin-top:24px\\"><button class=\\"btn\\" onclick=\\"loadDashboard()\\">↻ Sync Telemetry</button></div>";';
  html += '  app.innerHTML=out;';
  html += '}';
  
  html += 'function toggleDetails(name){';
  html += '  var el=document.getElementById("details-"+name);';
  html += '  el.style.display = (el.style.display==="block") ? "none" : "block";';
  html += '}';
  html += 'function panic(name){alert("EPCP Policy Enforcement: Quarantining node "+name)}';
  html += 'function rollback(name){alert("EPCP Artifact Swap: Rolling back node "+name)}';
  
  html += 'loadDashboard();';
  html += '</script></body></html>';
  
  return html;
}
