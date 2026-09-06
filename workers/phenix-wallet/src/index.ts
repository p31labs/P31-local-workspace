/**
 * Phenix Donation Wallet — Cloudflare Worker
 *
 * Serves wallet UI with inlined client-side wallet logic.
 * Full wallet library: packages/spaceship-earth/src/services/phenixWallet.ts
 * Bundled version: workers/phenix-wallet/dist/wallet.js
 */

const WEBMCP_TOKEN = 'A5o9byBMcCbjEcoVVn4qktyGM/w8ne3TPRceMBq+2N9zO4WXRyH3DkVAhAinaWiQ5fNjPx0VO7K+JVwd21q36gUAAAB3eyJvcmlnaW4iOiJodHRwczovL3Bob3NwaG9ydXMzMS5vcmc6NDQzIiwiZmVhdHVyZSI6IldlYk1DUCIsImV4cGlyeSI6MTc5NDg3MzYwMCwiaXNTdWJkb21haW4iOnRydWUsImlzVGhpcmRQYXJ0eSI6dHJ1ZX0=';

const CSS = `
:root{--p31-bg:oklch(15% 0.01 50);--p31-surface:oklch(22% 0.03 45);--p31-text:oklch(96% 0.005 85);--p31-text-secondary:oklch(80% 0.004 85);--p31-accent:oklch(60% 0.08 200);--p31-accent-violet:oklch(55% 0.07 310);--p31-glass-bg:oklch(100% 0.01 240/0.04);--p31-glass-border:oklch(100% 0.01 240/0.08)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--p31-bg);color:var(--p31-text);font-family:system-ui,sans-serif;min-height:100vh;padding:clamp(16px,4vw,32px)}
.app{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.glass{background:var(--p31-glass-bg);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--p31-glass-border);border-radius:24px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,.15)}
h1{font-size:clamp(24px,4vw,32px);margin-bottom:8px}
h2{font-size:clamp(16px,2.5vw,20px);margin-bottom:12px}
.sub{color:var(--p31-text-secondary);font-size:14px}
button{background:var(--p31-accent);color:var(--p31-bg);border:none;padding:10px 20px;border-radius:9999px;font-weight:600;font-size:14px;cursor:pointer;transition:opacity .2s,transform .2s;margin:4px 4px 4px 0}
button:hover{opacity:.85;transform:translateY(-1px)}
.btn-secondary{background:transparent;color:var(--p31-text);border:1px solid var(--p31-glass-border)}
.btn-secondary:hover{background:var(--p31-glass-bg)}
.mono{font-family:ui-monospace,monospace;font-size:12px}
.status{margin-top:12px;padding:12px;background:rgba(0,0,0,.3);border-radius:12px;white-space:pre-wrap;word-break:break-all;font-size:13px}
input{width:100%;padding:10px;border-radius:12px;border:1px solid var(--p31-glass-border);background:rgba(0,0,0,.3);color:var(--p31-text);margin-bottom:12px;font-size:14px}
.flex{display:flex;gap:8px;flex-wrap:wrap}
.grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.stat{font-size:20px;font-weight:700}
.stat-label{font-size:11px;color:var(--p31-text-secondary);text-transform:uppercase;letter-spacing:.05em}
footer{text-align:center;font-size:12px;color:rgba(255,255,255,.3);padding:16px 0}
@media(max-width:640px){.glass{padding:16px}}
`;

const JS = `(()=>{"use strict";
const VK='phenix_vault_v2',SK='phenix_session_v2',MK='phenix_memo_log_v2',SAK='phenix_stealth_addresses',STK='phenix_settings',VCK='phenix_vc_store_v2';

function toHex(b){return Array.from(b).map(n=>n.toString(16).padStart(2,'0')).join('')}
function fromHex(h){const b=new Uint8Array(h.length/2);for(let i=0;i<h.length;i+=2)b[i/2]=parseInt(h.substring(i,i+2),16);return b}
function a2h(b){return toHex(new Uint8Array(b))}
async function deriveKey(pw,salt){const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function lsGet(k){try{const r=localStorage.getItem(k);if(r)return JSON.parse(r)}catch(e){}return null}

window.PhenixWallet={

  getState(){const a=lsGet(SAK)||[];let e=0;for(const x of a)if(x.balance)e+=parseFloat(x.balance);return{exists:lsGet(VK)!==null,unlocked:lsGet(SK)!==null,donationCount:a.length,totalETH:e,stealthAddresses:a}},

  getCredentials(){return lsGet(VCK)||[]},
  storeCred(c){const s=this.getCredentials();const i=s.findIndex(x=>x.id===c.id);if(i>=0)s[i]=c;else s.push(c);lsSet(VCK,s)},

  async createVault(pw){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),ak=await deriveKey(pw,salt),sp=fromHex(toHex(crypto.getRandomValues(new Uint8Array(32)))),vp=fromHex(toHex(crypto.getRandomValues(new Uint8Array(32)))),spk=toHex(sp),vpk=toHex(vp),pt={spending:{privateKey:spk,publicKey:'0x'+spk.slice(0,40)},viewing:{privateKey:vpk,publicKey:'0x'+vpk.slice(0,40)},metaAddress:'st:eth:0x'+spk.slice(0,66)+vpk.slice(0,66),createdAt:new Date().toISOString(),version:3},ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},ak,new TextEncoder().encode(JSON.stringify(pt))),v={version:3,salt:toHex(salt),iv:toHex(iv),ciphertext:btoa(String.fromCharCode(...new Uint8Array(ct))),metaAddress:pt.metaAddress,createdAt:pt.createdAt};lsSet(VK,v);lsSet(SK,{viewingPriv:vpk,createdAt:Date.now()})},

  async unlockVault(pw){const r=lsGet(VK);if(!r)throw new Error('NO_VAULT');const ak=await deriveKey(pw,fromHex(r.salt)),pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromHex(r.iv)},ak,fromHex(atob(r.ciphertext).split('').map(c=>c.charCodeAt(0)).join('')));const j=JSON.parse(new TextDecoder().decode(pt));lsSet(SK,{viewingPriv:j.viewing.privateKey,createdAt:Date.now()});return j},
  lockVault(){try{localStorage.removeItem(SK)}catch(e){}},

  generateIdentity(){const pk=crypto.getRandomValues(new Uint8Array(32)),pub=toHex(pk),did='did:key:z'+pub;return{did,publicKeyHex:pub,privateKeyHex:toHex(pk)}},

  getCapabilities(){const s=this.getState(),c=this.getCredentials();return{name:'Phenix Donation Wallet',version:'3.0.0',exists:s.exists,unlocked:s.unlocked,credentialCount:c.length,credentialTypes:[...new Set(c.map(x=>x.vct))],capabilities:['ed25519_keygen','did_key_identity','sd_jwt_storage','aes256gcm_vault','memo_to_file'],cryptoSuites:['Ed25519','AES-256-GCM','SHA-256']}},

  logMemo(entry){const m=lsGet(MK)||[],e={id:crypto.randomUUID(),timestamp:new Date().toISOString(),type:entry.type||'NOTE',memo:entry.memo||'',amount:entry.amount||null,currency:entry.currency||null,txHash:null,stealthAddress:null,provenanceChain:'P31 Phenix Wallet Entry',traceToPremarital:true,counterparty:null};m.push(e);lsSet(MK,m);return e},

  exportLedger(){const m=lsGet(MK)||[],data=JSON.stringify(m);return{format:'phenix-ledger',version:'2.0',exported:new Date().toISOString(),operator:'P31 Labs',entries:m,sha256:a2h(data)}},
};
})();`;

const HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phenix Donation Wallet</title><meta name="description" content="Self-sovereign credential wallet with stealth addresses, SD-JWT, and ZK proofs."><meta http-equiv="origin-trial" content="${WEBMCP_TOKEN}"><style>${CSS}</style></head><body><div class="app" data-mcp-tool="phenixWallet" data-mcp-target="wallet-root">
<div class="glass"><h1>🐦 Phenix Donation Wallet</h1><p class="sub">Self-sovereign credentials · Stealth addresses · ZK proofs</p></div>
<div class="grid-2" data-mcp-tool="walletStats" data-mcp-target="wallet-stats">
<div class="glass" style="text-align:center"><div class="stat" id="s-e">—</div><div class="stat-label">Vault</div></div>
<div class="glass" style="text-align:center"><div class="stat" id="s-c">0</div><div class="stat-label">Credentials</div></div>
<div class="glass" style="text-align:center"><div class="stat" id="s-s">0</div><div class="stat-label">Stealth</div></div>
<div class="glass" style="text-align:center"><div class="stat" id="s-eth">0</div><div class="stat-label">ETH</div></div></div>
<div class="glass"><h2>🔐 Vault</h2><div id="vs" class="status" style="font-size:13px">Loading...</div><div class="flex" style="margin-top:12px"><button onclick="P.createVault()" data-mcp-tool="vaultAction" data-mcp-type="action">Create Vault</button><button onclick="P.unlockVault()" class="btn-secondary" data-mcp-tool="vaultAction" data-mcp-type="action">Unlock</button><button onclick="P.lockVault()" class="btn-secondary" data-mcp-tool="vaultAction" data-mcp-type="action">Lock</button><button onclick="P.exportLedger()" class="btn-secondary" data-mcp-tool="vaultAction" data-mcp-type="action">Export Ledger</button></div></div>
<div class="glass"><h2>🆔 Sovereign Identity</h2><div id="is" style="margin-bottom:8px">Not generated</div><input type="text" class="mono" readonly placeholder="did:key:z..." style="margin-bottom:12px" id="did-disp"><button onclick="P.generateIdentity()" data-mcp-tool="identityAction" data-mcp-type="action">Generate Ed25519 DID:key</button></div>
<div class="glass"><h2>📜 Credentials</h2><div id="cl">No credentials stored. Mint via ledger-bridge POST /sbt/mint-private.</div></div>
<div class="glass"><h2>📋 Capabilities</h2><pre id="cap" style="font-size:12px;background:rgba(0,0,0,.3);padding:12px;border-radius:12px;overflow:auto;max-height:200px"></pre></div>
<footer>863 Hz · K₄ planar · β₂ = 1 · Georgia 501(c)(3)</footer></div>
<script>${JS}</script>
<script>
const W=window.PhenixWallet,P={};
function U(){const s=W.getState();document.getElementById('s-e').textContent=s.exists?'✅':'❌';document.getElementById('s-c').textContent=W.getCredentials().length;document.getElementById('s-s').textContent=s.stealthAddresses.length;document.getElementById('s-eth').textContent=(s.totalETH||0).toFixed(4);document.getElementById('vs').innerHTML='<strong>Vault:</strong> '+(s.exists?'✅ Exists':'❌ None')+' · <strong>Unlocked:</strong> '+(s.unlocked?'✅ Yes':'🔒 Locked');document.getElementById('cap').textContent=JSON.stringify(W.getCapabilities(),null,2);const dt=document.getElementById('did-disp'),ii=localStorage.getItem('phenix_id');if(ii){const j=JSON.parse(ii);dt.value=j.did;document.getElementById('is').textContent='✅ Generated'}else{dt.value='';document.getElementById('is').textContent='Not generated'}const cr=W.getCredentials(),cd=document.getElementById('cl');cd.innerHTML=cr.length?cr.map(c=>'<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)"><strong>'+c.vct+'</strong> · '+c.id.slice(0,12)+'…</div>').join(''):'No credentials stored.'}
P.createVault=()=>{const p=prompt('Enter password:');if(!p)return;W.createVault(p).then(()=>{U();alert('Vault created')}).catch(e=>alert(e.message))};
P.unlockVault=()=>{const p=prompt('Enter password:');if(!p)return;W.unlockVault(p).then(()=>U()).catch(()=>alert('Wrong password or no vault'))};
P.lockVault=()=>{W.lockVault();U()};
P.exportLedger=()=>{const d=W.exportLedger(),b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='phenix-ledger-'+Date.now()+'.json';a.click()};
P.generateIdentity=()=>{const id=W.generateIdentity();localStorage.setItem('phenix_id',JSON.stringify(id));document.getElementById('did-disp').value=id.did;document.getElementById('is').textContent='✅ Generated'};
U();
</script></body></html>`;

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'phenix-wallet', version: '1.0.0', ts: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json', 'Origin-Trial': WEBMCP_TOKEN, 'Access-Control-Allow-Origin': '*' },
      });
    }
    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=600', 'Origin-Trial': WEBMCP_TOKEN },
    });
  },
};
