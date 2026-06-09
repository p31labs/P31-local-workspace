import { useState, useEffect, useCallback, useRef } from "react";

const T = {
  void: "#0f1115", surface: "#161920", surface2: "#1c2028",
  glass: "rgba(255,255,255,0.06)", cloud: "#e8e6e3", muted: "#6b7280",
  teal: "#5DCAA5", cyan: "#4db8a8", coral: "#cc6247",
  amber: "#cda852", lavender: "#8b7cc9", phosphorus: "#5dca5d",
};

const KEY = "p31_mesh_state";
const now = () => new Date().toISOString();
const fmt = (iso) => { try { return new Date(iso).toLocaleString("en-US", { month:"short",day:"numeric",hour:"numeric",minute:"2-digit" }); } catch { return "—"; } };
const pick = a => a[Math.floor(Math.random()*a.length)];
const rand = (a,b) => Math.random()*(b-a)+a;

function load() { try { return JSON.parse(localStorage.getItem(KEY)) || def(); } catch { return def(); } }
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

function def() {
  return { lastPing: now(), events: [], simDown: [] };
}

const DEVICES = [
  { id:"ha-pi", name:"Home Assistant Pi", type:"hub", ip:"192.168.1.100", status:"online",
    services:["MQTT","Automations","CF Tunnel","BLE Gateway"], color:T.teal,
    specs:"Raspberry Pi 4/5 · 15+ automations · Zigbee/BLE", icon:"🏠" },
  { id:"desktop", name:"AMD Desktop", type:"compute", ip:"192.168.1.50", status:"online",
    services:["Ollama Fleet","ROCm","Dev Server","Cursor"], color:T.lavender,
    specs:"i3-12100 · RX 6600 XT · 10 Ollama personas · Qwen3 8B", icon:"🖥️" },
  { id:"node-zero", name:"Node Zero", type:"device", ip:"—", status:"firmware",
    services:["LVGL Display","WiFi","BLE","MQTT"], color:T.amber,
    specs:"Waveshare ESP32-S3-Touch-LCD-3.5B · AXS15231B QSPI · ESP-IDF 5.5.3", icon:"📡" },
  { id:"iphone", name:"iPhone 11", type:"mobile", ip:"WiFi only", status:"online",
    services:["WebAuthn","iMessage","Signal","FaceTime"], color:T.cyan,
    specs:"No cell service · WiFi only · FIDO2 passkeys", icon:"📱" },
  { id:"tablet-sj", name:"S.J. Tablet", type:"mobile", ip:"WiFi", status:"online",
    services:["BONDING","Android Chrome"], color:T.amber,
    specs:"Android · BONDING at bonding.p31ca.org · Touch input", icon:"🎮" },
  { id:"tablet-wj", name:"W.J. Tablet", type:"mobile", ip:"WiFi", status:"online",
    services:["BONDING","Android Chrome"], color:T.amber,
    specs:"Android · BONDING at bonding.p31ca.org · 60px targets", icon:"🎮" },
  { id:"bangle", name:"Bangle.js 2", type:"wearable", ip:"BLE", status:"online",
    services:["HRV","Sleep","Activity","GadgetBridge"], color:T.phosphorus,
    specs:"BLE → GadgetBridge → HA Pi · Biometric telemetry", icon:"⌚" },
  { id:"chromebook", name:"Chromebook", type:"compute", ip:"WiFi", status:"online",
    services:["Dev Environment","SSH","GitHub"], color:T.muted,
    specs:"Development workstation · Claude Code", icon:"💻" },
];

const WORKERS = [
  { id:"cmd-center", name:"command-center", endpoint:"api.p31ca.org/cmd", status:"verified", purpose:"Shift API + operator status" },
  { id:"shift-api", name:"shift-api", endpoint:"api.p31ca.org/shift", status:"verified", purpose:"Shift in/out/status" },
  { id:"bonding-relay", name:"bonding-relay", endpoint:"api.p31ca.org/relay", status:"verified", purpose:"BONDING KV multiplayer relay" },
  { id:"stripe-checkout", name:"stripe-checkout", endpoint:"api.phosphorus31.org/checkout", status:"verified", purpose:"Stripe payment" },
  { id:"stripe-webhook", name:"stripe-webhook", endpoint:"api.phosphorus31.org/webhook", status:"verified", purpose:"Stripe event handler" },
  { id:"cogpass-bridge", name:"cogpass-bridge", endpoint:"api.p31ca.org/cogpass", status:"verified", purpose:"CogPass schema endpoint" },
  { id:"genesis-block", name:"genesis-block", endpoint:"api.p31ca.org/genesis", status:"verified", purpose:"Append-only audit trail" },
  { id:"social-engine", name:"social-engine", endpoint:"api.p31ca.org/social", status:"verified", purpose:"Social broadcast" },
  { id:"discord-bot", name:"discord-bot", endpoint:"—", status:"verified", purpose:"Discord integration" },
  { id:"status-dash", name:"status-dashboard", endpoint:"api.p31ca.org/status", status:"verified", purpose:"KV-backed fleet status" },
  { id:"sync-planned", name:"sync (planned)", endpoint:"api.p31ca.org/sync", status:"planned", purpose:"PGLite device sync" },
  { id:"fhir-planned", name:"fhir (planned)", endpoint:"api.p31ca.org/fhir", status:"planned", purpose:"FHIR calcium monitoring" },
  { id:"email-routing", name:"email-routing", endpoint:"p31ca.org MX", status:"verified", purpose:"CF Email Routing → Gmail" },
  { id:"pages-p31ca", name:"pages-p31ca", endpoint:"p31ca.org", status:"verified", purpose:"CF Pages (PWA)" },
  { id:"pages-ph31", name:"pages-phosphorus31", endpoint:"phosphorus31.org", status:"verified", purpose:"CF Pages (SSG)" },
  { id:"pages-bonding", name:"pages-bonding", endpoint:"bonding.p31ca.org", status:"verified", purpose:"CF Pages (BONDING)" },
];

const DATA_TIERS = [
  { id:"idb", name:"IndexedDB", tier:1, label:"Device Local", capacity:"~50 MB/origin", status:"live",
    desc:"idb-keyval + navigator.storage.persist(). CogPass, preferences, offline cache.", color:T.teal },
  { id:"kv", name:"Cloudflare KV", tier:2, label:"Edge Relay", capacity:"25 MB values", status:"live",
    desc:"BONDING multiplayer relay. 3-10s polling. Room-based keys. 1hr TTL.", color:T.cyan },
  { id:"d1", name:"Cloudflare D1", tier:3, label:"Structured", capacity:"1 GB SQLite", status:"live",
    desc:"Structured queries, reports, aggregation. Genesis Block audit trail.", color:T.lavender },
  { id:"r2", name:"Cloudflare R2", tier:4, label:"Object Store", capacity:"10 GB free", status:"live",
    desc:"S3-compatible. Zero egress. Evidence vault (planned AES-256-GCM encryption).", color:T.amber },
  { id:"genesis", name:"Genesis Block", tier:3, label:"Audit Trail", capacity:"1,847 records", status:"live",
    desc:"Append-only SHA-256 chain. Forensic metadata: cf-ray, TLS, UA, hashed IP.", color:T.coral },
  { id:"pglite", name:"PGLite", tier:1, label:"Local SQL", capacity:"—", status:"designed",
    desc:"Cross-device SQLite with CRDT sync. Yjs vs Automerge pending (CWP-SOV-01).", color:T.muted },
];

const COMMS = [
  { id:"imessage", name:"iMessage", status:"live", via:"WiFi (Apple ID)", bridge:false, color:T.teal },
  { id:"facetime", name:"FaceTime", status:"live", via:"WiFi (Apple ID)", bridge:false, color:T.teal },
  { id:"signal", name:"Signal", status:"live", via:"WiFi (pre-registered)", bridge:false, color:T.phosphorus },
  { id:"msgr-kids", name:"Messenger Kids", status:"live", via:"WiFi (read-only)", bridge:false, color:T.amber },
  { id:"gmail", name:"Gmail Forwarding", status:"live", via:"will@p31ca.org → Gmail", bridge:false, color:T.cyan },
  { id:"matrix", name:"Matrix Homeserver", status:"blocked", via:"Budget (~€30/mo)", bridge:true, color:T.muted },
  { id:"br-sms", name:"mautrix-gmessages", status:"designed", via:"SMS bridge → Matrix", bridge:true, color:T.muted },
  { id:"br-whatsapp", name:"mautrix-whatsapp", status:"designed", via:"WhatsApp → Matrix", bridge:true, color:T.muted },
  { id:"br-signal", name:"mautrix-signal", status:"designed", via:"Signal → Matrix", bridge:true, color:T.muted },
  { id:"br-meta", name:"mautrix-meta", status:"designed", via:"Messenger → Matrix", bridge:true, color:T.muted },
  { id:"br-email", name:"Postmoogle", status:"designed", via:"Email → Matrix", bridge:true, color:T.muted },
];

const K4_MEMBERS = [
  { id:"will", name:"Will", role:"Operator", icon:"🔬", color:T.teal },
  { id:"sj", name:"S.J.", role:"Age 10", icon:"🧪", color:T.amber },
  { id:"wj", name:"W.J.", role:"Age 6", icon:"🌸", color:T.amber },
  { id:"brenda", name:"Brenda", role:"ADA Support", icon:"🛡️", color:T.lavender },
];

const TABS = [
  { id:"fleet", label:"Device Fleet", icon:"📡" },
  { id:"workers", label:"Workers", icon:"⚡" },
  { id:"data", label:"Data Tiers", icon:"💾" },
  { id:"comms", label:"Comms", icon:"📨" },
  { id:"k4", label:"K₄ Mesh", icon:"🔺" },
  { id:"resilience", label:"Resilience", icon:"🛡️" },
];

function Mono({children,style:s}) { return <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,...s}}>{children}</span>; }
function StatusDot({status}) {
  const c = {online:T.phosphorus,live:T.phosphorus,verified:T.teal,firmware:T.amber,planned:T.muted,designed:T.muted,blocked:T.coral,down:T.coral}[status]||T.muted;
  return <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block",flexShrink:0}} />;
}
function Glass({children,style:s,accent}) {
  return <div style={{background:T.surface2,border:`1px solid ${T.glass}`,borderRadius:10,padding:12,
    borderLeft:accent?`3px solid ${accent}`:undefined,...s}}>{children}</div>;
}

function FleetPanel({simDown}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {DEVICES.map(d => {
        const isDown = simDown.includes(d.id);
        return (
          <Glass key={d.id} accent={isDown?T.coral:d.color} style={{opacity:isDown?0.5:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{d.icon}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13}}>{d.name}</div>
                  <Mono style={{color:T.muted,fontSize:9}}>{d.ip}</Mono>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <StatusDot status={isDown?"down":d.status} />
                <Mono style={{color:isDown?T.coral:T.muted,fontSize:10,textTransform:"uppercase"}}>{isDown?"DOWN":d.status}</Mono>
              </div>
            </div>
            <div style={{fontSize:11,color:T.muted,marginBottom:6}}>{d.specs}</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {d.services.map((s,i) => (
                <span key={i} style={{padding:"1px 6px",borderRadius:4,fontSize:9,
                  fontFamily:"'JetBrains Mono',monospace",background:`${d.color}12`,
                  border:`1px solid ${d.color}30`,color:isDown?T.muted:d.color}}>{s}</span>
              ))}
            </div>
          </Glass>
        );
      })}
    </div>
  );
}

function WorkerPanel() {
  const verified = WORKERS.filter(w=>w.status==="verified").length;
  return (
    <div>
      <div style={{display:"flex",gap:16,marginBottom:12,justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <Mono style={{color:T.teal,fontSize:24,fontWeight:700}}>{verified}</Mono>
          <div style={{fontSize:10,color:T.muted}}>verified</div>
        </div>
        <div style={{textAlign:"center"}}>
          <Mono style={{color:T.muted,fontSize:24,fontWeight:700}}>{WORKERS.length}</Mono>
          <div style={{fontSize:10,color:T.muted}}>total</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {WORKERS.map(w => (
          <div key={w.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",
            borderBottom:`1px solid ${T.glass}`}}>
            <StatusDot status={w.status} />
            <div style={{flex:1,minWidth:0}}>
              <Mono style={{color:T.cloud,fontSize:11,fontWeight:600}}>{w.name}</Mono>
              <div style={{fontSize:10,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.purpose}</div>
            </div>
            <Mono style={{color:T.muted,fontSize:9,flexShrink:0}}>{w.endpoint}</Mono>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataPanel() {
  return (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",gap:4,marginBottom:8}}>
          {[1,2,3,4].map(t => (
            <div key={t} style={{flex:1,textAlign:"center",padding:"6px 4px",borderRadius:6,
              background:`${T.surface}`,border:`1px solid ${T.glass}`}}>
              <Mono style={{color:T.teal,fontSize:14,fontWeight:700}}>T{t}</Mono>
              <div style={{fontSize:8,color:T.muted}}>{["Device","Edge","Structured","Object"][t-1]}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,color:T.muted,textAlign:"center",fontFamily:"'JetBrains Mono',monospace"}}>
          T1 (local) → T2 (relay) → T3 (structured) → T4 (archive)
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {DATA_TIERS.map(d => (
          <Glass key={d.id} accent={d.color}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <Mono style={{color:d.color,fontWeight:700,fontSize:10}}>T{d.tier}</Mono>
                <span style={{fontWeight:700,fontSize:13}}>{d.name}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <StatusDot status={d.status} />
                <Mono style={{color:T.muted,fontSize:9}}>{d.capacity}</Mono>
              </div>
            </div>
            <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{d.desc}</div>
          </Glass>
        ))}
      </div>
      <Glass style={{marginTop:12,textAlign:"center"}} accent={T.coral}>
        <Mono style={{color:T.coral,fontWeight:700}}>Genesis Block</Mono>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:28,fontWeight:700,color:T.coral,margin:"4px 0"}}>1,847</div>
        <div style={{fontSize:10,color:T.muted}}>append-only SHA-256 hashed records with forensic metadata</div>
        <div style={{fontSize:9,color:T.muted,marginTop:4}}>cf-ray · TLS version · User-Agent · hashed IP</div>
      </Glass>
    </div>
  );
}

function CommsPanel() {
  const live = COMMS.filter(c=>c.status==="live").length;
  const bridges = COMMS.filter(c=>c.bridge);
  return (
    <div>
      <div style={{display:"flex",gap:16,marginBottom:12,justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <Mono style={{color:T.phosphorus,fontSize:24,fontWeight:700}}>{live}</Mono>
          <div style={{fontSize:10,color:T.muted}}>live channels</div>
        </div>
        <div style={{textAlign:"center"}}>
          <Mono style={{color:T.muted,fontSize:24,fontWeight:700}}>{bridges.length}</Mono>
          <div style={{fontSize:10,color:T.muted}}>bridges (pending)</div>
        </div>
      </div>
      <div style={{marginBottom:8}}>
        <Mono style={{color:T.teal,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Live Channels</Mono>
      </div>
      {COMMS.filter(c=>c.status==="live").map(c => (
        <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",
          borderBottom:`1px solid ${T.glass}`}}>
          <StatusDot status="live" />
          <span style={{fontWeight:600,fontSize:12,flex:1}}>{c.name}</span>
          <Mono style={{color:T.muted,fontSize:9}}>{c.via}</Mono>
        </div>
      ))}
      <div style={{marginTop:16,marginBottom:8}}>
        <Mono style={{color:T.amber,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Matrix Bridge Stack (Designed)</Mono>
      </div>
      <Glass accent={T.muted} style={{padding:10}}>
        <div style={{fontSize:11,color:T.muted,marginBottom:8}}>
          Blocked on budget (~€30/mo). Researching: Conduit on HA Pi, Oracle Cloud free tier, CF Workers relay.
        </div>
        {bridges.map(c => (
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",fontSize:11}}>
            <StatusDot status="designed" />
            <Mono style={{color:T.muted}}>{c.name}</Mono>
            <span style={{color:T.muted,fontSize:10,marginLeft:"auto"}}>{c.via}</span>
          </div>
        ))}
      </Glass>
    </div>
  );
}

function K4Panel() {
  const cx=180, cy=140, r=90;
  const positions = K4_MEMBERS.map((m,i) => {
    const a = (i/4)*Math.PI*2 - Math.PI/2;
    return { ...m, x: cx+Math.cos(a)*r, y: cy+Math.sin(a)*r };
  });
  const edges = [];
  for(let i=0;i<4;i++) for(let j=i+1;j<4;j++) edges.push([positions[i],positions[j]]);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
        <svg width={360} height={280} viewBox="0 0 360 280">
          {edges.map((e,i) => (
            <line key={i} x1={e[0].x} y1={e[0].y} x2={e[1].x} y2={e[1].y}
              stroke={T.teal} strokeWidth={1.5} opacity={0.3} strokeLinecap="round" />
          ))}
          {positions.map(p => (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r={28} fill={T.surface2} stroke={p.color} strokeWidth={1.5} />
              <text x={p.x} y={p.y-4} textAnchor="middle" fill="white" fontSize={16}>{p.icon}</text>
              <text x={p.x} y={p.y+14} textAnchor="middle" fill={T.cloud} fontSize={10} fontWeight={700}
                fontFamily="'Inter',sans-serif">{p.name}</text>
            </g>
          ))}
          <text x={cx} y={cy} textAnchor="middle" fill={T.teal} fontSize={10}
            fontFamily="'JetBrains Mono',monospace" opacity={0.5}>K₄</text>
        </svg>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {K4_MEMBERS.map(m => (
          <Glass key={m.id} accent={m.color} style={{padding:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20}}>{m.icon}</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>{m.name}</div>
                <Mono style={{color:T.muted,fontSize:9}}>{m.role}</Mono>
              </div>
            </div>
          </Glass>
        ))}
      </div>
      <Glass style={{marginTop:12,textAlign:"center"}} accent={T.teal}>
        <Mono style={{color:T.teal,fontSize:10}}>4 vertices · 6 edges · every node connected to every other</Mono>
        <div style={{fontSize:11,color:T.muted,marginTop:4}}>No center. No hierarchy. Maximum fault tolerance.</div>
        <div style={{fontSize:10,color:T.muted,marginTop:4}}>If any single edge fails, every node is still reachable via the remaining 5.</div>
      </Glass>
    </div>
  );
}

function ResiliencePanel({simDown,setSimDown}) {
  const toggleDown = (id) => {
    setSimDown(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
  };

  const affected = [];
  if(simDown.includes("ha-pi")) affected.push("Automations offline","BLE gateway down","MQTT stopped","Bangle.js data stops flowing","Calcium alerts disabled");
  if(simDown.includes("desktop")) affected.push("Ollama fleet offline","Local LLM unavailable","Dev server down");
  if(simDown.includes("iphone")) affected.push("WebAuthn passkeys unavailable","iMessage/FaceTime offline","Signal offline");
  if(simDown.includes("node-zero")) affected.push("Haptic alerts disabled","Display unavailable");
  if(simDown.includes("tablet-sj")||simDown.includes("tablet-wj")) affected.push("BONDING unavailable for child");
  if(simDown.includes("bangle")) affected.push("Biometric telemetry stops","HRV/sleep data gap");
  if(simDown.includes("chromebook")) affected.push("Dev environment unavailable");

  const survivesAll = [
    "Cloudflare Workers (14 verified) — edge-deployed, no local dependency",
    "p31ca.org / phosphorus31.org — CF Pages, globally distributed",
    "BONDING relay (KV) — serverless, survives any local outage",
    "Genesis Block (D1) — cloud-native, append-only",
    "Email routing — CF MX, no local dependency",
    "Zenodo publications — immutable DOIs, hosted by CERN",
  ];

  return (
    <div>
      <div style={{marginBottom:12}}>
        <Mono style={{color:T.coral,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,display:"block"}}>
          Resilience Simulator — Tap devices to simulate failure
        </Mono>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {DEVICES.map(d => (
            <button key={d.id} onClick={()=>toggleDown(d.id)}
              style={{padding:"6px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",
                display:"flex",alignItems:"center",gap:4,
                border:simDown.includes(d.id)?`1px solid ${T.coral}`:`1px solid ${T.glass}`,
                background:simDown.includes(d.id)?`${T.coral}18`:"transparent",
                color:simDown.includes(d.id)?T.coral:T.muted}}>
              <span style={{fontSize:14}}>{d.icon}</span> {d.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {simDown.length > 0 && (
        <Glass accent={T.coral} style={{marginBottom:12}}>
          <Mono style={{color:T.coral,fontWeight:700,fontSize:11,marginBottom:6,display:"block"}}>
            {simDown.length} device(s) down — cascade effects:
          </Mono>
          {affected.map((a,i) => (
            <div key={i} style={{fontSize:11,color:T.muted,padding:"2px 0",display:"flex",alignItems:"center",gap:6}}>
              <span style={{color:T.coral}}>✕</span> {a}
            </div>
          ))}
        </Glass>
      )}

      <Glass accent={T.phosphorus}>
        <Mono style={{color:T.phosphorus,fontWeight:700,fontSize:11,marginBottom:6,display:"block"}}>
          Survives ANY local failure:
        </Mono>
        {survivesAll.map((s,i) => (
          <div key={i} style={{fontSize:11,color:T.muted,padding:"2px 0",display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:T.phosphorus}}>✓</span> {s}
          </div>
        ))}
      </Glass>

      <Glass style={{marginTop:12,textAlign:"center"}}>
        <Mono style={{color:T.teal,fontSize:10}}>The mesh degrades gracefully. Nothing is a single point of failure.</Mono>
        <div style={{fontSize:11,color:T.muted,marginTop:4}}>
          The worst case (all local devices down) still leaves: both websites live, all Workers responding,
          BONDING relay active, Genesis Block auditing, email routing, and 22 publications on immutable DOIs.
        </div>
        <div style={{fontSize:10,color:T.muted,marginTop:8,fontStyle:"italic"}}>
          "The cage holds because no single calcium atom IS the cage."
        </div>
      </Glass>
    </div>
  );
}

export default function SovereignMesh() {
  const [state, setState] = useState(load);
  const [tab, setTab] = useState("fleet");
  const [simDown, setSimDown] = useState([]);

  useEffect(() => { save(state); }, [state]);

  const counts = {
    devices: DEVICES.filter(d=>d.status==="online").length,
    workers: WORKERS.filter(w=>w.status==="verified").length,
    tiers: DATA_TIERS.filter(d=>d.status==="live").length,
    comms: COMMS.filter(c=>c.status==="live").length,
  };

  return (
    <div style={{background:T.void,color:T.cloud,fontFamily:"'Inter',-apple-system,sans-serif",
      minHeight:"100vh",WebkitFontSmoothing:"antialiased"}}>
      <div style={{borderBottom:`1px solid ${T.glass}`,padding:"10px 16px",
        display:"flex",justifyContent:"space-between",alignItems:"center",
        background:`${T.surface}cc`,position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <svg viewBox="0 0 100 100" width={20} height={20} fill="none">
            <path d="M50 10 L90 85 L10 85 Z" stroke={T.teal} strokeWidth="5" strokeLinejoin="round"/>
            <path d="M50 10 L50 60 L90 85" stroke={T.coral} strokeWidth="5" strokeLinejoin="round" opacity="0.8"/>
            <path d="M50 60 L10 85" stroke={T.amber} strokeWidth="5" strokeLinejoin="round" opacity="0.6"/>
          </svg>
          <span style={{fontWeight:700,fontSize:13}}>Sovereign Mesh</span>
          <Mono style={{color:T.muted,fontSize:9}}>NOC v1.0.0</Mono>
        </div>
        {simDown.length > 0 && (
          <Mono style={{color:T.coral,fontSize:10}}>{simDown.length} simulated down</Mono>
        )}
      </div>

      <div style={{display:"flex",gap:8,padding:"6px 12px",overflowX:"auto",
        borderBottom:`1px solid ${T.glass}`,background:T.surface}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"5px 8px",borderRadius:6,fontSize:10,fontWeight:600,
              border:tab===t.id?`1px solid ${T.teal}`:`1px solid transparent`,
              background:tab===t.id?`${T.teal}12`:"transparent",
              color:tab===t.id?T.teal:T.muted,cursor:"pointer",
              whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:3}}>
            <span style={{fontSize:12}}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,padding:"8px 12px",
        background:T.surface,borderBottom:`1px solid ${T.glass}`}}>
        {[
          {l:"Devices",v:counts.devices,t:DEVICES.length,c:T.teal},
          {l:"Workers",v:counts.workers,t:WORKERS.length,c:T.lavender},
          {l:"Data Tiers",v:counts.tiers,t:DATA_TIERS.length,c:T.amber},
          {l:"Comms",v:counts.comms,t:COMMS.length,c:T.cyan},
        ].map(m => (
          <div key={m.l} style={{textAlign:"center",padding:"4px 0"}}>
            <Mono style={{color:m.c,fontSize:16,fontWeight:700}}>{m.v}/{m.t}</Mono>
            <div style={{fontSize:8,color:T.muted}}>{m.l}</div>
          </div>
        ))}
      </div>

      <main style={{maxWidth:520,margin:"0 auto",padding:"12px 16px 80px"}}>
        {tab==="fleet" && <FleetPanel simDown={simDown} />}
        {tab==="workers" && <WorkerPanel />}
        {tab==="data" && <DataPanel />}
        {tab==="comms" && <CommsPanel />}
        {tab==="k4" && <K4Panel />}
        {tab==="resilience" && <ResiliencePanel simDown={simDown} setSimDown={setSimDown} />}
      </main>

      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"6px 16px",
        borderTop:`1px solid ${T.glass}`,background:`${T.surface}ee`,
        display:"flex",justifyContent:"center",gap:12,
        fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.muted,zIndex:40}}>
        <span>{counts.devices} devices</span><span style={{opacity:0.3}}>·</span>
        <span>{counts.workers} workers</span><span style={{opacity:0.3}}>·</span>
        <span>1,847 genesis</span><span style={{opacity:0.3}}>·</span>
        <span style={{color:simDown.length>0?T.coral:T.teal}}>{simDown.length>0?`${simDown.length} down`:"mesh stable"}</span>
      </div>
    </div>
  );
}
