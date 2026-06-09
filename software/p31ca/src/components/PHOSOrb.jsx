import { useState, useEffect, useRef, useCallback } from "react";

const T = {
  void: "#0f1115", surface: "#161920", surface2: "#1c2028",
  glass: "rgba(255,255,255,0.06)", cloud: "#e8e6e3", muted: "#6b7280",
  teal: "#5DCAA5", cyan: "#4db8a8", coral: "#cc6247",
  amber: "#cda852", lavender: "#8b7cc9", phosphorus: "#5dca5d",
};
const ACCENTS = [T.teal, T.cyan, T.coral, T.amber, T.lavender, T.phosphorus];
const pick = a => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));

const NODES = [
  { id: "passport", label: "Passport", icon: "🧬", hex: T.teal, ring: 1, angle: 0, href: "/passport" },
  { id: "garden", label: "Garden", icon: "👶", hex: T.amber, ring: 1, angle: 2.094, href: "/garden" },
  { id: "ping", label: "Ping", icon: "💚", hex: T.phosphorus, ring: 1, angle: 4.189, href: "/ops#ping" },
  { id: "ops", label: "Ops", icon: "🌐", hex: T.teal, ring: 2, angle: 0.524, href: "/ops" },
  { id: "buffer", label: "Buffer", icon: "🛡️", hex: T.coral, ring: 2, angle: 2.618, href: "/ops#buffer" },
  { id: "glass", label: "Glass Box", icon: "📊", hex: T.cyan, ring: 2, angle: 4.712, href: "/glass-box" },
  { id: "geodesic", label: "Geodesic", icon: "⚒️", hex: T.lavender, ring: 2, angle: 1.571, href: "/geodesic.html" },
  { id: "library", label: "Library", icon: "📚", hex: T.lavender, ring: 3, angle: 1.047, href: "/doc-library/" },
  { id: "vibe", label: "Vibe", icon: "🔮", hex: T.phosphorus, ring: 3, angle: 3.665, href: "/atmosphere" },
];
const RING_R = { 1: 90, 2: 155, 3: 210 };
const RING_SPEED = { 1: 0.0003, 2: -0.00018, 3: 0.00012 };

const SIMS = [
  { persona: "W-CRISIS", desc: "Calcium 7.5 mg/dL. ER admission.", tags: ["AuDHD", "E20.9 Flare"], wm: 3, frust: 0.75,
    surface: "/dome#geodesic", cli: 4.2, shannon: 0.65, fitts: 1450, hick: 220,
    logs: [
      { t: "info", m: "L2: Physiological state — Ca: 7.5 mg/dL (critical low)" },
      { t: "info", m: "L4: Interface measurement pass on /dome#geodesic" },
      { t: "pass", m: "Shannon normalization: H/log\u2082(uniqueCount) = 0.65 \u2713" },
      { t: "p1", m: "SEV-1: CLI (4.2) > WM capacity (3.0) \u2014 overload" },
      { t: "p0", m: "SEV-0: WebGL context NOT destroyed in safe mode" },
      { t: "info", m: "Action: cancelAnimationFrame + renderer.forceContextLoss()" },
    ]},
  { persona: "S.J.", desc: "Age 10. BONDING player. Builds molecules.", tags: ["Child", "10yo"], wm: 5, frust: 0.20,
    surface: "/garden/", cli: 1.8, shannon: 0.32, fitts: 580, hick: 150,
    logs: [
      { t: "info", m: "L3: Cognitive state \u2014 high energy, moderate focus" },
      { t: "pass", m: "Touch target: chip min-height 60px \u2713" },
      { t: "pass", m: "Fitts category: Comfortable (580ms) \u2713" },
      { t: "pass", m: "Zero text input required for core actions \u2713" },
      { t: "pass", m: "BONDING molecule builder \u2014 100% accommodated" },
    ]},
  { persona: "W.J.", desc: "Age 6. Pre-reader. Needs big visual feedback.", tags: ["Child", "6yo", "Pre-reader"], wm: 3, frust: 0.40,
    surface: "/garden/", cli: 1.2, shannon: 0.18, fitts: 420, hick: 80,
    logs: [
      { t: "info", m: "L3: Pre-reader \u2014 text minimized, icons maximized" },
      { t: "pass", m: "Touch target: 60px minimum enforced \u2713" },
      { t: "pass", m: "Hick RT: 80ms (only 2 choices visible) \u2713" },
      { t: "pass", m: "Safe mode auto-engaged (persona.safeByDefault) \u2713" },
      { t: "pass", m: "SESSION PASSED \u2014 100% accommodated" },
    ]},
  { persona: "W-HYPERFOCUS", desc: "AuDHD deep state. Bodily signals bypassed.", tags: ["AuDHD", "Hyperfocus"], wm: 10, frust: 0.05,
    surface: "/god", cli: 7.5, shannon: 0.95, fitts: 120, hick: 600,
    logs: [
      { t: "info", m: "L2: Spoon envelope suspended (hyperfocus active)" },
      { t: "info", m: "Simulating 45-min uninterrupted session\u2026" },
      { t: "pass", m: "CLI (7.5) held by expanded WM (10.0) \u2713" },
      { t: "p1", m: "SEV-1: Session >45 min \u2014 no break prompt surfaced" },
      { t: "info", m: "Action: Surface Ping widget with calcium reminder" },
    ]},
];

const QUOTES = [
  { text: "Phosphorus burns alone. Inside the calcium cage, it powers life.", attr: "The Phosphorus Thesis" },
  { text: "The machine adapts to the human. Not the other way around.", attr: "The Manifesto" },
  { text: "Web 2.0 is a hostile architecture.", attr: "PHOS-for-US" },
  { text: "Context is the cryptographic key.", attr: "Cognitive Passport v4.1" },
  { text: "Two perfect surfaces beat five good ones.", attr: "Operating Rule #4" },
  { text: "Technology that measures its own cognitive toll on the human using it.", attr: "The Mission" },
  { text: "Every atom placed is a timestamped parental engagement log.", attr: "BONDING" },
  { text: "The interface should mathematically degrade itself to protect the operator.", attr: "L7 Telemetry" },
  { text: "Don't ask what to do. Tell me what tool to pick up.", attr: "Operating Rule #11" },
  { text: "863 Hz. The heartbeat of phosphorus in Earth's magnetic field.", attr: "Larmor Canonical" },
  { text: "K\u2084 is planar. \u03B2\u2082 = 1.", attr: "Paper XII" },
  { text: "The cage holds. The mesh routes. The children have a father.", attr: "Session Close" },
  { text: "Spoons are spent. L.O.V.E. is earned.", attr: "Dual Currency" },
  { text: "The name means something.", attr: "\u00A7V, The God File" },
  { text: "We build tools for people whose brains work differently.", attr: "P31 Labs" },
  { text: "Built from a VW Golf and a phone.", attr: "Cinco de Mayo 2026" },
];
const STATS = [
  { v: "86", l: "verify gates", c: T.phosphorus },
  { v: "280", l: "alignment sources", c: T.teal },
  { v: "69", l: "psych E2E tests", c: T.lavender },
  { v: "424", l: "BONDING tests", c: T.amber },
  { v: "22", l: "Zenodo publications", c: T.cyan },
  { v: "1,847", l: "Genesis Block records", c: T.coral },
  { v: "863", l: "Hz Larmor frequency", c: T.teal },
  { v: "0", l: "tracking scripts", c: T.phosphorus },
  { v: "4", l: "vertices. 6 edges. K\u2084.", c: T.amber },
  { v: "\u221E", l: "spoons wished for", c: T.lavender },
];
const PRODUCTS = [
  { n: "BONDING", s: "Shipped", d: "Chemistry game. Father builds molecules with his children. Every atom is a court-admissible engagement log.", e: "\u2697\uFE0F" },
  { n: "PHOS Router", s: "Shipped", d: "Deterministic navigation. 18 intents. Zero LLM. Zero network calls. Fully offline.", e: "\uD83D\uDD2E" },
  { n: "Buffer", s: "85%", d: "Detects when you\u2019re people-pleasing in a text and flags it before you hit send.", e: "\uD83D\uDEE1\uFE0F" },
  { n: "Node One", s: "Prototype", d: "Palm-sized haptic device. Vibrates when calcium drops. The warning between stability and a seizure.", e: "\uD83D\uDCE1" },
  { n: "Spaceship Earth", s: "Building", d: "See your own executive function rendered as a geodesic dome in real time.", e: "\uD83D\uDE80" },
  { n: "Genesis Block", s: "Live", d: "Append-only SHA-256 audit trail. 1,847 records. Court-ready forensic metadata.", e: "\u26D3\uFE0F" },
];

function K4Art({ w, h, accent }) {
  const pts = [];
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.3;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2 + rand(-0.4, 0.4);
    pts.push({ x: cx + Math.cos(a) * r + rand(-15, 15), y: cy + Math.sin(a) * r + rand(-15, 15) });
  }
  const edges = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) edges.push([pts[i], pts[j]]);
  const a2 = pick(ACCENTS.filter(c => c !== accent));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: randInt(4, 8) }, (_, i) => (
        <circle key={`b${i}`} cx={rand(0, w)} cy={rand(0, h)} r={rand(30, 100)} fill={accent} opacity={rand(0.015, 0.05)} />
      ))}
      {edges.map((e, i) => (
        <line key={i} x1={e[0].x} y1={e[0].y} x2={e[1].x} y2={e[1].y}
          stroke={i < 3 ? accent : a2} strokeWidth={rand(0.8, 2.5)} opacity={rand(0.25, 0.65)} strokeLinecap="round" />
      ))}
      {pts.map((p, i) => (
        <g key={`n${i}`}>
          <circle cx={p.x} cy={p.y} r={rand(3, 7)} fill={i === 0 ? accent : a2} opacity={0.75} />
          <circle cx={p.x} cy={p.y} r={rand(14, 22)} fill="none" stroke={accent} strokeWidth={0.4} opacity={0.25} />
        </g>
      ))}
      {Array.from({ length: randInt(10, 25) }, (_, i) => (
        <circle key={`s${i}`} cx={rand(0, w)} cy={rand(0, h)} r={rand(0.4, 1.2)} fill={T.cloud} opacity={rand(0.08, 0.35)} />
      ))}
    </svg>
  );
}

function OrbitalHub({ onSelect, safe }) {
  const [t, setT] = useState(0);
  const raf = useRef(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (safe) return;
    let running = true;
    const loop = () => { if (!running) return; setT(Date.now()); raf.current = requestAnimationFrame(loop); };
    loop();
    return () => { running = false; if (raf.current) cancelAnimationFrame(raf.current); };
  }, [safe]);

  const cx = 240, cy = 220;
  return (
    <div style={{ position: "relative", width: 480, height: 440 }}>
      <svg width={480} height={440} viewBox="0 0 480 440" style={{ position: "absolute", inset: 0 }}>
        {[1, 2, 3].map(r => (
          <circle key={r} cx={cx} cy={cy} r={RING_R[r]} fill="none" stroke={T.glass} strokeWidth={0.5} strokeDasharray="4 6" />
        ))}
      </svg>
      {!safe && NODES.map(n => {
        const a = n.angle + t * RING_SPEED[n.ring];
        const x = cx + Math.cos(a) * RING_R[n.ring];
        const y = cy + Math.sin(a) * RING_R[n.ring] * 0.65;
        const isHover = hover === n.id;
        return (
          <a key={n.id} href={n.href}
            onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
            style={{ position: "absolute", left: x - 28, top: y - 28, width: 56, height: 56,
              borderRadius: "50%", border: `1px solid ${isHover ? n.hex : T.glass}`,
              background: isHover ? `${n.hex}18` : `${T.surface}cc`,
              backdropFilter: "blur(8px)", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              transition: "border-color 150ms, background 150ms", zIndex: 10,
              boxShadow: isHover ? `0 0 20px ${n.hex}30` : "none",
              textDecoration: "none" }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{n.icon}</span>
            <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: T.muted, marginTop: 2 }}>{n.label}</span>
          </a>
        );
      })}
      <a href="/" style={{ position: "absolute", left: cx - 24, top: cy - 24, width: 48, height: 48,
        borderRadius: "50%", background: `radial-gradient(circle, ${T.teal}40 0%, ${T.void} 70%)`,
        border: `2px solid ${T.teal}60`, display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 20, cursor: "pointer", boxShadow: `0 0 30px ${T.teal}20`, textDecoration: "none" }}>
        <svg viewBox="0 0 100 100" width={22} height={22} fill="none">
          <path d="M50 10 L90 85 L10 85 Z" stroke={T.teal} strokeWidth="5" strokeLinejoin="round" />
          <path d="M50 10 L50 60 L90 85" stroke={T.coral} strokeWidth="5" strokeLinejoin="round" opacity="0.7" />
          <path d="M50 60 L10 85" stroke={T.amber} strokeWidth="5" strokeLinejoin="round" opacity="0.5" />
        </svg>
      </a>
      {hover && (
        <div style={{ position: "absolute", left: cx - 100, top: cy + 40, width: 200, textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted, zIndex: 5 }}>
          {NODES.find(n => n.id === hover)?.label}
        </div>
      )}
    </div>
  );
}

function TelemetryView() {
  const [idx, setIdx] = useState(0);
  const sim = SIMS[idx];
  const logColors = { info: T.muted, pass: T.phosphorus, p0: T.coral, p1: T.amber };
  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {SIMS.map((s, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: idx === i ? `1px solid ${T.teal}` : `1px solid ${T.glass}`,
              background: idx === i ? `${T.teal}18` : "transparent",
              color: idx === i ? T.teal : T.muted, cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace" }}>
            {s.persona}
          </button>
        ))}
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.glass}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{sim.persona}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted }}>{sim.surface}</span>
        </div>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>{sim.desc}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {sim.tags.map((t, i) => (
            <span key={i} style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${T.glass}`,
              background: `${T.surface2}`, color: T.muted }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { l: "CLI", v: sim.cli, max: 10, c: sim.cli > sim.wm ? T.coral : T.teal },
            { l: "Shannon", v: sim.shannon, max: 1, c: T.lavender },
            { l: "Fitts (ms)", v: sim.fitts, max: 2000, c: sim.fitts > 1000 ? T.amber : T.teal },
            { l: "Hick (ms)", v: sim.hick, max: 800, c: T.cyan },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.l}</div>
              <div style={{ height: 3, borderRadius: 2, background: T.surface2, marginTop: 6, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (m.v / m.max) * 100)}%`, height: "100%", background: m.c, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>
          WM capacity: {sim.wm} | P(frustration): {sim.frust}
        </div>
      </div>
      <div style={{ background: T.void, border: `1px solid ${T.glass}`, borderRadius: 8, padding: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.8 }}>
        {sim.logs.map((l, i) => (
          <div key={i} style={{ color: logColors[l.t] || T.muted }}>
            <span style={{ opacity: 0.4, marginRight: 8 }}>{String(i + 1).padStart(2, "0")}</span>
            {l.t === "p0" && <span style={{ color: T.coral, fontWeight: 700 }}>[SEV-0] </span>}
            {l.t === "p1" && <span style={{ color: T.amber, fontWeight: 700 }}>[SEV-1] </span>}
            {l.t === "pass" && <span style={{ color: T.phosphorus }}>[PASS] </span>}
            {l.m}
          </div>
        ))}
      </div>
    </div>
  );
}

function ForgeView() {
  const [card, setCard] = useState(null);
  const gen = useCallback(() => {
    const type = pick(["quote", "stat", "product", "brand", "mission", "art"]);
    const accent = pick(ACCENTS);
    setCard({ type, accent, data: type === "quote" ? pick(QUOTES) : type === "stat" ? pick(STATS) : type === "product" ? pick(PRODUCTS) : pick(QUOTES), uid: Math.random() });
  }, []);
  useEffect(() => { gen(); }, []);

  if (!card) return null;
  const { type: ct, accent: ca, data: cd } = card;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "20px 0" }}>
      <div style={{ width: 480, height: 300, borderRadius: 16, overflow: "hidden", position: "relative",
        background: T.void, border: `1px solid ${T.glass}`, boxShadow: `0 0 40px ${T.void}` }}>
        <K4Art w={480} h={300} accent={ca} />
        <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
          {ct === "quote" && (
            <div style={{ padding: "36px 32px 24px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <div>
                <div style={{ width: 36, height: 3, background: ca, borderRadius: 2, marginBottom: 20 }} />
                <p style={{ fontSize: cd.text.length > 70 ? 16 : 19, fontWeight: 500, color: T.cloud, lineHeight: 1.5 }}>"{cd.text}"</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted }}>— {cd.attr}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: ca, opacity: 0.5 }}>P31 LABS</span>
              </div>
            </div>
          )}
          {ct === "stat" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 64, fontWeight: 700, color: cd.c, lineHeight: 1 }}>{cd.v}</div>
              <div style={{ fontSize: 14, color: T.cloud, marginTop: 10 }}>{cd.l}</div>
              <div style={{ width: 40, height: 2, background: cd.c, opacity: 0.4, marginTop: 16, borderRadius: 1 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted, marginTop: 10 }}>P31 LABS \u00B7 PHOS-FOR-US</span>
            </div>
          )}
          {ct === "product" && (
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 26 }}>{cd.e}</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.cloud }}>{cd.n}</div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: ca, textTransform: "uppercase" }}>{cd.s}</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, maxWidth: 400 }}>{cd.d}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: 28, height: 2, background: ca, borderRadius: 1 }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted }}>P31 LABS</span>
              </div>
            </div>
          )}
          {ct === "brand" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
              <svg viewBox="0 0 100 100" width={52} height={52} fill="none" style={{ marginBottom: 12 }}>
                <path d="M50 10 L90 85 L10 85 Z" stroke={ca} strokeWidth="4" strokeLinejoin="round" />
                <path d="M50 10 L50 60 L90 85" stroke={T.coral} strokeWidth="4" strokeLinejoin="round" opacity="0.7" />
                <path d="M50 60 L10 85" stroke={T.amber} strokeWidth="4" strokeLinejoin="round" opacity="0.5" />
              </svg>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.cloud }}>P31 Labs</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>Open-source assistive technology</div>
              <div style={{ width: 36, height: 2, background: ca, margin: "14px auto 0", borderRadius: 1 }} />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.muted, marginTop: 8 }}>phosphorus31.org \u00B7 p31ca.org \u00B7 github.com/p31labs</div>
            </div>
          )}
          {ct === "mission" && (
            <div style={{ padding: "36px 36px 28px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: ca, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>THE MISSION</div>
                <p style={{ fontSize: cd.text.length > 80 ? 15 : 18, fontWeight: 600, color: T.cloud, lineHeight: 1.5 }}>{cd.text}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg viewBox="0 0 100 100" width={14} height={14} fill="none">
                  <path d="M50 10 L90 85 L10 85 Z" stroke={ca} strokeWidth="6" strokeLinejoin="round" />
                </svg>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted }}>phosphorus31.org</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {["quote", "stat", "product", "brand", "mission", "art"].map(t => (
          <button key={t} onClick={() => { setCard({ type: t, accent: pick(ACCENTS), data: t === "quote" || t === "mission" ? pick(QUOTES) : t === "stat" ? pick(STATS) : t === "product" ? pick(PRODUCTS) : pick(QUOTES), uid: Math.random() }); }}
            style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: `1px solid ${T.glass}`, background: "transparent", color: T.muted, cursor: "pointer" }}>
            {t}
          </button>
        ))}
      </div>
      <button onClick={gen}
        style={{ padding: "10px 28px", background: T.teal, color: "#000", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Random
      </button>
    </div>
  );
}

const VIEWS = [
  { id: "hub", label: "Hub", icon: "\u26A1" },
  { id: "telemetry", label: "L7 Telemetry", icon: "\uD83E\uDDE0" },
  { id: "forge", label: "Media Forge", icon: "\uD83D\uDD25" },
];

export default function PHOSForUS() {
  const [view, setView] = useState("hub");
  const [safe, setSafe] = useState(false);

  return (
    <div style={{ background: safe ? "#000" : T.void, color: T.cloud, fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: "100vh", WebkitFontSmoothing: "antialiased" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px",
        borderBottom: `1px solid ${T.glass}`, background: safe ? "#0a0a0a" : `${T.surface}cc`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg viewBox="0 0 100 100" width={22} height={22} fill="none">
            <path d="M50 10 L90 85 L10 85 Z" stroke={T.teal} strokeWidth="5" strokeLinejoin="round" />
            <path d="M50 10 L50 60 L90 85" stroke={T.coral} strokeWidth="5" strokeLinejoin="round" opacity="0.8" />
            <path d="M50 60 L10 85" stroke={T.amber} strokeWidth="5" strokeLinejoin="round" opacity="0.6" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 14 }}>PHOS-for-US</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted, marginLeft: 4 }}>v2.0.0</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: view === v.id ? `1px solid ${T.teal}` : `1px solid transparent`,
                background: view === v.id ? `${T.teal}15` : "transparent",
                color: view === v.id ? T.teal : T.muted, cursor: "pointer" }}>
              {v.icon} {v.label}
            </button>
          ))}
          <button onClick={() => setSafe(!safe)}
            style={{ marginLeft: 8, padding: "5px 10px", borderRadius: 6, fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase",
              border: `1px solid ${safe ? T.phosphorus : T.coral}40`,
              background: safe ? `${T.phosphorus}15` : `${T.coral}08`,
              color: safe ? T.phosphorus : T.coral, cursor: "pointer", letterSpacing: "0.05em" }}>
            {safe ? "\u2713 Safe" : "Safe"}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "12px 20px" }}>
        {safe ? (
          <div style={{ padding: "24px 0" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Ca\u2089(PO\u2084)\u2086 Calcium Cage</h1>
            <p style={{ fontSize: 12, color: T.muted, fontFamily: "'JetBrains Mono', monospace", marginBottom: 24 }}>
              Spatial dynamics suspended. Executive function preserved.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {NODES.map(n => (
                <a key={n.id} href={n.href}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: 10,
                    border: `1px solid ${T.glass}`, background: `${T.surface}80`, cursor: "pointer",
                    textAlign: "left", color: T.cloud, textDecoration: "none" }}>
                  <span style={{ fontSize: 20, width: 36, height: 36, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", border: `1px solid ${n.hex}40`,
                    background: `${n.hex}10`, flexShrink: 0 }}>{n.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{n.label}</div>
                    <div style={{ fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>{n.href}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <>
            {view === "hub" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0" }}>
                <OrbitalHub onSelect={id => {}} safe={safe} />
                <div style={{ textAlign: "center", marginTop: 4, maxWidth: 360 }}>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                    9 calcium nodes orbit the phosphorus core. Three rings: family, ops, creation.
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted }}>
                    <span><span style={{ color: T.amber }}>\u25CF</span> Inner</span>
                    <span><span style={{ color: T.teal }}>\u25CF</span> Middle</span>
                    <span><span style={{ color: T.lavender }}>\u25CF</span> Outer</span>
                  </div>
                </div>
              </div>
            )}
            {view === "telemetry" && <TelemetryView />}
            {view === "forge" && <ForgeView />}
          </>
        )}
      </main>

      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 20px",
        borderTop: `1px solid ${T.glass}`, background: safe ? "#0a0a0a" : `${T.surface}ee`,
        display: "flex", justifyContent: "center", gap: 16, fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", zIndex: 40 }}>
        <span>86 gates</span>
        <span style={{ opacity: 0.3 }}>\u00B7</span>
        <span>280 sources</span>
        <span style={{ opacity: 0.3 }}>\u00B7</span>
        <span>69 E2E</span>
        <span style={{ opacity: 0.3 }}>\u00B7</span>
        <span style={{ color: T.teal }}>cage holds</span>
      </footer>
    </div>
  );
}
