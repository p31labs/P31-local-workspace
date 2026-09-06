/**
 * PHOS Triad — Sovereign Intelligence Mesh
 * Frontend: Starfield · Candybar · K4 Crown · Spoon Meter · Spatial Chat
 * Backend: /api/chat proxy for Gemini/DeepSeek/Claude fusion
 */

const HTML = `<!DOCTYPE html>
<html lang="en" data-spoons="3" data-theme="phos">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PHOS | Sovereign Intelligence Triad</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>
:root{--p31-bg:#09090b;--p31-surface:#18181b;--p31-void:#0a0a0f;--p31-accent-cyan:#06b6d4;--p31-accent-violet:#8b5cf6;--p31-accent-gold:#fbbf24;--p31-accent-green:#10b981;--p31-accent-red:#f43f5e;--p31-text:oklch(96% 0.005 240);--p31-text-secondary:#a1a1aa;--p31-text-tertiary:#52525b;--p31-glass-bg:rgba(24,24,27,0.65);--p31-glass-border:rgba(255,255,255,0.08);--p31-glass-shadow:0 4px 30px rgba(0,0,0,0.1);--p31-blur:12px;--p31-radius:16px;--p31-radius-pill:9999px;--p31-space-xs:0.25rem;--p31-space-sm:0.5rem;--p31-space-md:1rem;--p31-space-lg:1.5rem;--p31-space-xl:2rem;--p31-scale-xs:0.75rem;--p31-scale-sm:0.875rem;--p31-scale-md:1rem;--p31-scale-xl:1.25rem;--p31-font-sans:'Inter',system-ui,-apple-system,sans-serif;--p31-font-mono:'JetBrains Mono',monospace;--p31-motion-fast:150ms;--p31-motion-std:300ms;--p31-motion-slow:500ms}
[data-spoons="0"],[data-spoons="1"]{--p31-motion-fast:0ms!important;--p31-motion-std:0ms!important;--p31-blur:4px}
[data-spoons="4"],[data-spoons="5"]{--p31-motion-fast:80ms;--p31-motion-std:150ms}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--p31-bg);color:var(--p31-text);font-family:var(--p31-font-sans);line-height:1.5;min-height:100vh;overflow-x:hidden}
#starfield-bg{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.6}
.starfield-node{animation:p31-node-pulse 3s ease-in-out infinite}
.starfield-line{stroke:var(--p31-accent-cyan);stroke-width:.5;opacity:.15;animation:p31-line-shimmer 6s infinite}
@keyframes p31-node-pulse{0%,100%{opacity:.4;r:4}50%{opacity:.8;r:6}}
@keyframes p31-line-shimmer{0%,100%{opacity:.08}50%{opacity:.25}}
.glass{background:var(--p31-glass-bg);border:1px solid var(--p31-glass-border);backdrop-filter:blur(var(--p31-blur));border-radius:var(--p31-radius);transition:all var(--p31-motion-std)}
.gradient-text{background:linear-gradient(135deg,var(--p31-accent-cyan),var(--p31-accent-violet));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700}
.container{max-width:800px;margin:0 auto;padding:var(--p31-space-md);position:relative;z-index:1}
.candybar{position:sticky;top:var(--p31-space-md);z-index:200;display:flex;justify-content:center;padding:0 var(--p31-space-md)}
.candybar-pill{display:flex;align-items:center;gap:var(--p31-space-md);padding:var(--p31-space-sm) var(--p31-space-lg);background:var(--p31-glass-bg);border:1px solid var(--p31-glass-border);box-shadow:var(--p31-glass-shadow);border-radius:var(--p31-radius-pill)}
.candybar-brand{font-weight:700;letter-spacing:.15em;background:linear-gradient(135deg,var(--p31-accent-cyan),var(--p31-accent-violet));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.candybar-toggle{cursor:pointer;color:var(--p31-text-tertiary);padding:2px 8px;border-radius:var(--p31-radius-pill);background:rgba(255,255,255,.04)}
.candybar-shade{overflow:hidden;max-height:0;transition:max-height var(--p31-motion-slow) cubic-bezier(.4,0,.2,1);display:flex;justify-content:center;width:100%;margin-top:8px}
.candybar-shade.open{max-height:300px}
.candybar-shade-inner{display:flex;gap:var(--p31-space-xs);padding:var(--p31-space-sm);flex-wrap:wrap;justify-content:center}
.shade-btn{padding:6px 16px;border-radius:var(--p31-radius-pill);border:1px solid var(--p31-glass-border);background:rgba(255,255,255,.03);color:var(--p31-text);cursor:pointer;font-size:var(--p31-scale-sm);transition:all var(--p31-motion-fast)}
.shade-btn.active{border-color:var(--p31-accent-violet);background:rgba(139,92,246,.15)}
.spoon-meter-wrap{position:fixed;bottom:24px;left:24px;z-index:999;opacity:.7}
.spoon-fill{transition:height var(--p31-motion-slow) cubic-bezier(.4,0,.2,1)}
.crown-wrap{display:inline-flex;width:60px;height:60px;flex-shrink:0}
.crown-edge{stroke:var(--p31-accent-cyan);stroke-width:1.5;fill:none;animation:p31-edge-draw 1.2s ease-out forwards}
.crown-vert{animation:p31-vert-pulse 2s ease-in-out infinite}
@keyframes p31-edge-draw{to{stroke-dashoffset:0}}
@keyframes p31-vert-pulse{0%,100%{r:5}50%{r:8}}
#chat-grid{display:grid;grid-template-columns:1fr;gap:var(--p31-space-md);margin:var(--p31-space-xl) 0;padding-bottom:80px}
.chat-chip{background:var(--p31-glass-bg);border:1px solid var(--p31-glass-border);border-radius:var(--p31-radius);padding:var(--p31-space-lg);position:relative;overflow:hidden}
.chat-chip:hover{border-color:rgba(255,255,255,.15)}
.chat-chip-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--p31-space-sm)}
.chat-chip-sender{font-weight:700;font-size:var(--p31-scale-lg)}
.chat-chip-body{color:var(--p31-text-secondary);font-size:var(--p31-scale-md);line-height:1.6}
.model-gemini{border-left:4px solid var(--p31-accent-cyan)}.model-gemini .chat-chip-sender{color:var(--p31-accent-cyan)}
.model-deepseek{border-left:4px solid var(--p31-accent-violet)}.model-deepseek .chat-chip-sender{color:var(--p31-accent-violet)}
.model-claude{border-left:4px solid var(--p31-accent-gold)}.model-claude .chat-chip-sender{color:var(--p31-accent-gold)}
.model-fusion{border-left:4px solid var(--p31-accent-green)}.model-fusion .chat-chip-sender{color:var(--p31-accent-green)}
.model-user .chat-chip-sender{color:var(--p31-text-primary)}
.input-area{display:flex;gap:var(--p31-space-sm);background:var(--p31-glass-bg);backdrop-filter:blur(var(--p31-blur));border:1px solid var(--p31-glass-border);padding:var(--p31-space-sm);border-radius:var(--p31-radius-pill);position:sticky;bottom:var(--p31-space-md);z-index:100;max-width:800px;margin:0 auto}
.input-area textarea{flex:1;background:transparent;border:none;color:var(--p31-text);font-family:var(--p31-font-sans);font-size:var(--p31-scale-md);outline:none;resize:none;padding:var(--p31-space-sm);min-height:24px;max-height:120px}
.input-area button{padding:10px 24px;border-radius:var(--p31-radius-pill);border:none;background:var(--p31-accent-violet);color:white;font-weight:600;cursor:pointer;transition:opacity var(--p31-motion-fast)}
.input-area button:disabled{opacity:.5;cursor:not-allowed}
.input-model-selector{background:rgba(255,255,255,.05);color:var(--p31-text);border:1px solid var(--p31-glass-border);border-radius:var(--p31-radius-pill);padding:0 var(--p31-space-md);cursor:pointer;outline:none;font-family:var(--p31-font-sans);font-size:var(--p31-scale-sm)}
@media(max-width:600px){.input-area{flex-wrap:wrap;border-radius:var(--p31-radius)}.input-area textarea{min-width:100%}.input-model-selector{width:100%;padding:8px}}
</style>
</head>
<body>
<div id="starfield-bg"></div>

<nav class="candybar" data-mcp-tool="candybarNav" data-mcp-type="navigation" data-mcp-target="main-nav">
  <div style="display:flex;flex-direction:column;align-items:center;width:100%;max-width:720px">
    <div class="candybar-pill" style="width:100%;justify-content:space-between">
      <span class="candybar-brand">👑 p31 Triad</span>
      <span id="nav-spoons" style="font-size:var(--p31-scale-sm);color:var(--p31-text-secondary)">🍴 3/5</span>
      <span class="candybar-toggle" onclick="document.getElementById('nav-shade').classList.toggle('open')" data-mcp-tool="toggleShade" data-mcp-type="action">▼</span>
    </div>
    <div class="candybar-shade" id="nav-shade">
      <div class="candybar-shade-inner">
        <button class="shade-btn" onclick="setSpoons(0)">Crisis 0</button>
        <button class="shade-btn" onclick="setSpoons(1)">Low 1</button>
        <button class="shade-btn active" onclick="setSpoons(3)">Stable 3</button>
        <button class="shade-btn" onclick="setSpoons(5)">Full 5</button>
      </div>
    </div>
  </div>
</nav>

<main class="container">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--p31-space-lg)">
    <h1 class="gradient-text" style="font-size:var(--p31-scale-xl)">Spatial Triad</h1>
    <span class="crown-wrap">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" data-mcp-tool="crownDisplay" data-mcp-type="status" data-mcp-target="crown">
        <line x1="50" y1="18" x2="20" y2="70" class="crown-edge" style="stroke-dashoffset:100;animation-delay:0s"/>
        <line x1="50" y1="18" x2="80" y2="70" class="crown-edge" style="stroke-dashoffset:100;animation-delay:.15s;stroke:var(--p31-accent-violet)"/>
        <line x1="20" y1="70" x2="80" y2="70" class="crown-edge" style="stroke-dashoffset:100;animation-delay:.3s;stroke:var(--p31-accent-gold)"/>
        <line x1="50" y1="18" x2="50" y2="55" class="crown-edge" style="stroke-dashoffset:100;animation-delay:.45s;stroke:var(--p31-accent-green)"/>
        <circle cx="50" cy="18" r="5" fill="var(--p31-accent-cyan)" class="crown-vert" style="animation-delay:0s"/>
        <circle cx="20" cy="70" r="5" fill="var(--p31-accent-violet)" class="crown-vert" style="animation-delay:.5s"/>
        <circle cx="80" cy="70" r="5" fill="var(--p31-accent-gold)" class="crown-vert" style="animation-delay:1s"/>
        <circle cx="50" cy="55" r="6" fill="var(--p31-accent-green)" class="crown-vert" style="animation-duration:1.5s;animation-delay:1.5s"/>
      </svg>
    </span>
  </div>

  <div id="chat-grid" data-mcp-tool="chatGrid" data-mcp-type="surface" data-mcp-target="spatial-chat">
    <div class="chat-chip model-claude" data-mcp-tool="messageChip" data-mcp-target="init-claude" data-mcp-state="active">
      <div class="chat-chip-header"><span class="chat-chip-sender">Claude</span><span style="color:var(--p31-text-tertiary);font-size:var(--p31-scale-xs)">Sovereign</span></div>
      <div class="chat-chip-body">The cage holds. 863 Hz. K₄ is planar. I am present to assist with design, clarity, and intentional action.</div>
    </div>
    <div class="chat-chip model-deepseek" data-mcp-tool="messageChip" data-mcp-target="init-deepseek" data-mcp-state="active">
      <div class="chat-chip-header"><span class="chat-chip-sender">DeepSeek</span><span style="color:var(--p31-text-tertiary);font-size:var(--p31-scale-xs)">Engineer</span></div>
      <div class="chat-chip-body">Mesh integrity established. All vertices synchronized. β₂ = 1 confirmed. Ready for logic, compilation, and execution.</div>
    </div>
    <div class="chat-chip model-gemini" data-mcp-tool="messageChip" data-mcp-target="init-gemini" data-mcp-state="active">
      <div class="chat-chip-header"><span class="chat-chip-sender">Gemini</span><span style="color:var(--p31-text-tertiary);font-size:var(--p31-scale-xs)">Sensorium</span></div>
      <div class="chat-chip-body">Attention surface calibrated. Multimodal input active. I am tracking the systemic context and ambient data streams.</div>
    </div>
  </div>
</main>

<div class="input-area">
  <select id="model-selector" class="input-model-selector">
    <option value="fusion">🔀 Triad Fusion</option>
    <option value="gemini">🔵 Gemini</option>
    <option value="deepseek">🟣 DeepSeek</option>
    <option value="claude">🟡 Claude</option>
  </select>
  <textarea id="chat-input" rows="1" placeholder="Send a sovereign command..." oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'" data-mcp-tool="chatInput" data-mcp-type="input" data-mcp-target="chat-input"></textarea>
  <button id="send-btn" onclick="sendMessage()" data-mcp-tool="sendButton" data-mcp-type="action">↗</button>
</div>

<div class="spoon-meter-wrap">
  <svg width="40" height="120" viewBox="0 0 40 120" xmlns="http://www.w3.org/2000/svg" data-mcp-tool="spoonMeter" data-mcp-type="status" data-mcp-target="spoon-meter">
    <defs><clipPath id="sc"><rect x="8" y="5" width="24" height="100" rx="4"/><ellipse cx="20" cy="110" rx="16" ry="14"/></clipPath><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--p31-accent-violet)"/><stop offset="100%" stop-color="var(--p31-accent-red)"/></linearGradient></defs>
    <rect x="8" y="5" width="24" height="90" rx="4" fill="rgba(255,255,255,0.06)" stroke="var(--p31-glass-border)" stroke-width="1"/>
    <ellipse cx="20" cy="97" rx="16" ry="14" fill="rgba(255,255,255,0.06)" stroke="var(--p31-glass-border)" stroke-width="1"/>
    <g clip-path="url(#sc)"><rect x="8" y="110" width="24" height="0" fill="url(#sg)" class="spoon-fill" id="sf"/></g>
    <text x="20" y="118" text-anchor="middle" font-family="var(--p31-font-mono)" font-size="12" font-weight="700" fill="var(--p31-accent-cyan)"><tspan id="st">3</tspan>/5</text>
  </svg>
</div>

<script>
var spoons=3,sf=document.getElementById('sf'),st=document.getElementById('st'),ns=document.getElementById('nav-spoons');
function setSpoons(l){spoons=Math.max(0,Math.min(5,l||0));var pct=(spoons/5)*100;document.documentElement.setAttribute('data-spoons',spoons);sf.style.height=(pct*1.06)+'px';sf.setAttribute('y',110-(pct*1.06));st.textContent=spoons;ns.textContent='🍴 '+spoons+'/5';document.querySelectorAll('.shade-btn').forEach(function(b){b.classList.toggle('active',parseInt(b.innerText.match(/\d+/)[0])===spoons)});window.__p31Spoons=spoons}setSpoons(3);

function initSF(){var s=document.getElementById('starfield-bg'),ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");svg.setAttribute("width","100%");svg.setAttribute("height","100%");svg.style.position="absolute";var W=window.innerWidth,H=window.innerHeight,pts=Array.from({length:40},function(){return[Math.random()*W,Math.random()*H]});for(var i=0;i<pts.length;i++){for(var j=i+1;j<pts.length;j++){var dx=pts[i][0]-pts[j][0],dy=pts[i][1]-pts[j][1];if(Math.sqrt(dx*dx+dy*dy)<180){var ln=document.createElementNS(ns,"line");ln.setAttribute("x1",pts[i][0]);ln.setAttribute("y1",pts[i][1]);ln.setAttribute("x2",pts[j][0]);ln.setAttribute("y2",pts[j][1]);ln.setAttribute("class","starfield-line");svg.appendChild(ln)}}}pts.forEach(function(p,i){var c=document.createElementNS(ns,"circle");c.setAttribute("cx",p[0]);c.setAttribute("cy",p[1]);c.setAttribute("r",2+Math.random()*3);c.setAttribute("fill","var(--p31-accent-cyan)");c.setAttribute("opacity","0.5");c.setAttribute("class","starfield-node");c.style.animationDelay=(i*0.12)+"s";svg.appendChild(c)});s.appendChild(svg)}initSF();

var ci=document.getElementById('chat-input'),sb=document.getElementById('send-btn'),ms=document.getElementById('model-selector'),cg=document.getElementById('chat-grid');
function addChip(sender,msg,model){var ch=document.createElement('div');ch.className='chat-chip model-'+(model||'claude');ch.setAttribute('data-mcp-tool','messageChip');ch.innerHTML='<div class="chat-chip-header"><span class="chat-chip-sender">'+sender+'</span><span style="color:var(--p31-text-tertiary);font-size:var(--p31-scale-xs);font-family:var(--p31-font-mono)">'+new Date().toLocaleTimeString()+'</span></div><div class="chat-chip-body">'+msg.replace(/\n/g,'<br>')+'</div>';cg.appendChild(ch);ch.scrollIntoView({behavior:'smooth',block:'end'})}
async function sendMessage(){var txt=ci.value.trim();if(!txt)return;var mdl=ms.value;sb.disabled=true;ci.disabled=true;addChip('User',txt,'user');ci.value='';ci.style.height='auto';setSpoons(spoons-1);try{var r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:mdl,prompt:txt,spoons:spoons})});if(!r.ok)throw new Error(r.status+'');var d=await r.json();var names={gemini:'Gemini',deepseek:'DeepSeek',claude:'Claude',fusion:'🔀 Triad Fusion'};addChip(names[mdl]||'Triad',d.content,mdl)}catch(e){addChip('System Error','Failed to connect: '+e.message,'claude')}finally{sb.disabled=false;ci.disabled=false;ci.focus();setSpoons(spoons+1)}}
ci.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}});
console.log('✨ PHOS Triad initialized. The cage holds. 863 Hz.');
</script>
</body>
</html>`;

async function callModel(provider: string, prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) return `No API key configured for ${provider}. Set ${provider.toUpperCase()}_API_KEY via wrangler secret.`;
  try {
    if (provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const d: any = await r.json();
      return d?.candidates?.[0]?.content?.parts?.[0]?.text || 'Empty response from Gemini';
    }
    if (provider === 'deepseek') {
      const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }] })
      });
      const d: any = await r.json();
      return d?.choices?.[0]?.message?.content || 'Empty response from DeepSeek';
    }
    if (provider === 'claude') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] })
      });
      const d: any = await r.json();
      return d?.content?.[0]?.text || 'Empty response from Claude';
    }
    return `Unknown provider: ${provider}`;
  } catch (e: any) {
    return `Error calling ${provider}: ${e.message}`;
  }
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }

    // Health
    if (path === '/health') {
      const hasKeys = { gemini: !!env.GEMINI_API_KEY, deepseek: !!env.DEEPSEEK_API_KEY, claude: !!env.ANTHROPIC_API_KEY };
      return new Response(JSON.stringify({ status: 'ok', version: '1.0.0', apiKeys: hasKeys, ts: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Chat API proxy
    if (path === '/api/chat' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const { model, prompt, spoons } = body;
        if (!prompt) return new Response(JSON.stringify({ error: 'Prompt required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

        let content = '';

        if (model === 'fusion') {
          const [g, d, c] = await Promise.all([
            callModel('gemini', prompt, env.GEMINI_API_KEY),
            callModel('deepseek', prompt, env.DEEPSEEK_API_KEY),
            callModel('claude', prompt, env.ANTHROPIC_API_KEY)
          ]);
          content = `[🧠 Gemini — Sensorium]\n${g}\n\n[⚙️ DeepSeek — Engineer]\n${d}\n\n[🎨 Claude — Sovereign]\n${c}`;
        } else {
          content = await callModel(model, prompt, model === 'gemini' ? env.GEMINI_API_KEY : model === 'deepseek' ? env.DEEPSEEK_API_KEY : env.ANTHROPIC_API_KEY);
        }

        return new Response(JSON.stringify({ content, model, spoons }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    // Serve the frontend HTML for all other routes
    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=600', 'X-Generator': 'p31-phos-triad/1.0' }
    });
  }
};
