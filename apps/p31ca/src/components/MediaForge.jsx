import { useState, useCallback, useRef, useEffect } from "react";

const T = {
  void: "#0f1115", surface: "#161920", surface2: "#1c2028",
  glass: "rgba(255,255,255,0.06)", cloud: "#e8e6e3", muted: "#6b7280",
  teal: "#5DCAA5", cyan: "#4db8a8", coral: "#cc6247",
  amber: "#cda852", lavender: "#8b7cc9", phosphorus: "#5dca5d",
};

const ACCENTS = [T.teal, T.cyan, T.coral, T.amber, T.lavender, T.phosphorus];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));

const QUOTES = [
  { text: "Phosphorus burns alone. Inside the calcium cage, it powers life.", attr: "The Phosphorus Thesis" },
  { text: "The machine adapts to the human. Not the other way around.", attr: "The Manifesto" },
  { text: "Web 2.0 is a hostile architecture.", attr: "PHOS-for-US" },
  { text: "Context is the cryptographic key.", attr: "Cognitive Passport v4.1" },
  { text: "Two perfect surfaces beat five good ones.", attr: "Operating Rule #4" },
  { text: "If the verify chain doesn't pass, it doesn't ship.", attr: "Operating Rule #2" },
  { text: "Technology that measures its own cognitive toll on the human using it.", attr: "The Mission" },
  { text: "Every atom placed is a timestamped parental engagement log.", attr: "BONDING" },
  { text: "The interface should mathematically degrade itself to protect the operator.", attr: "L7 Telemetry" },
  { text: "We build tools for people whose brains work differently.", attr: "P31 Labs" },
  { text: "Don't ask what to do. Tell me what tool to pick up.", attr: "Operating Rule #11" },
  { text: "The name means something.", attr: "§V, The God File" },
  { text: "Spoons are spent. L.O.V.E. is earned.", attr: "Dual Currency Model" },
  { text: "The cage holds. The mesh routes. The children have a father.", attr: "Session Close" },
  { text: "863 Hz. The heartbeat of phosphorus in Earth's magnetic field.", attr: "Larmor Canonical" },
  { text: "K₄ is planar. β₂ = 1.", attr: "Paper XII" },
];

const STATS = [
  { value: "86", label: "verify gates", color: T.phosphorus },
  { value: "280", label: "alignment sources", color: T.teal },
  { value: "69", label: "psych E2E tests", color: T.lavender },
  { value: "424", label: "BONDING tests", color: T.amber },
  { value: "22", label: "Zenodo publications", color: T.cyan },
  { value: "1,847", label: "Genesis Block records", color: T.coral },
  { value: "863", label: "Hz Larmor frequency", color: T.teal },
  { value: "4", label: "vertices. 6 edges. K₄.", color: T.phosphorus },
  { value: "9", label: "calcium nodes orbit the core", color: T.amber },
  { value: "59", label: "lines of safe mode", color: T.coral },
  { value: "0", label: "tracking scripts", color: T.phosphorus },
  { value: "∞", label: "spoons wished for", color: T.lavender },
];

const PRODUCTS = [
  { name: "BONDING", status: "Shipped", desc: "Chemistry game. Father builds molecules with his children. Every atom is a court-admissible engagement log.", emoji: "⚗️" },
  { name: "Buffer", status: "85%", desc: "Communication processing. Detects when you're people-pleasing in a text and flags it before you hit send.", emoji: "🛡️" },
  { name: "PHOS Router", status: "Shipped", desc: "Deterministic navigation. 18 intents. Zero LLM. Zero network calls. Fully offline.", emoji: "🔮" },
  { name: "Spaceship Earth", status: "Building", desc: "3D cognitive dashboard. See your own executive function rendered as a geodesic dome.", emoji: "🚀" },
  { name: "Node One", status: "Prototype", desc: "Palm-sized haptic device. Vibrates when calcium drops. The warning between stability and a seizure.", emoji: "📡" },
  { name: "Cognitive Passport", status: "Shipped", desc: "Your identity context card. Information density dial. The system adapts to your setting.", emoji: "🧬" },
  { name: "Genesis Block", status: "Live", desc: "Append-only SHA-256 audit trail. 1,847 records. Forensic metadata. Court-ready.", emoji: "⛓️" },
  { name: "Glass Box", status: "Live", desc: "Transparency dashboard. See exactly what the system measures. No hidden metrics. Build in the light.", emoji: "📊" },
];

const MISSIONS = [
  "Open-source assistive technology for neurodivergent individuals.",
  "40 million Americans are neurodivergent. Their tools should be too.",
  "We don't ship apps. We ship surfaces — functional environments the operator inhabits.",
  "The Posner molecule protects phosphorus at all angles. P31 Labs protects the operator.",
  "Every unnecessary choice is a spoon spent. We eliminate the unnecessary choices.",
  "Decision fatigue is not a metaphor. It is a measurable physiological state.",
  "The verify chain is the only truth. 86 gates. Green or no-go.",
  "Built from a VW Golf and a phone. Cinco de Mayo 2026.",
];

function K4Generative({ w, h, accent }) {
  const pts = [];
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) * 0.32;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2 + rand(-0.3, 0.3);
    pts.push({ x: cx + Math.cos(a) * r + rand(-10, 10), y: cy + Math.sin(a) * r + rand(-10, 10) });
  }
  const edges = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) edges.push([pts[i], pts[j]]);
  const accent2 = pick(ACCENTS.filter(c => c !== accent));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {[...Array(randInt(3, 7))].map((_, i) => (
        <circle key={`bg${i}`} cx={rand(0, w)} cy={rand(0, h)} r={rand(20, 80)}
          fill={accent} opacity={rand(0.02, 0.06)} />
      ))}
      {edges.map((e, i) => (
        <line key={i} x1={e[0].x} y1={e[0].y} x2={e[1].x} y2={e[1].y}
          stroke={i < 3 ? accent : accent2} strokeWidth={rand(1, 2.5)} opacity={rand(0.3, 0.7)}
          strokeLinecap="round" />
      ))}
      {pts.map((p, i) => (
        <g key={`n${i}`}>
          <circle cx={p.x} cy={p.y} r={rand(4, 8)} fill={i === 0 ? accent : accent2} opacity={0.8} />
          <circle cx={p.x} cy={p.y} r={rand(12, 20)} fill="none" stroke={accent} strokeWidth={0.5} opacity={0.3} />
        </g>
      ))}
      {[...Array(randInt(8, 20))].map((_, i) => (
        <circle key={`sp${i}`} cx={rand(0, w)} cy={rand(0, h)} r={rand(0.5, 1.5)}
          fill={T.cloud} opacity={rand(0.1, 0.4)} />
      ))}
    </svg>
  );
}

function QuoteCard({ q, accent }) {
  return (
    <div style={{ background: T.void, borderRadius: 16, overflow: "hidden", position: "relative", width: 540, height: 340 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.06 }}>
        <K4Generative w={540} h={340} accent={accent} />
      </div>
      <div style={{ position: "relative", padding: "48px 40px 32px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
        <div>
          <div style={{ width: 40, height: 3, background: accent, borderRadius: 2, marginBottom: 24 }} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: q.text.length > 80 ? 18 : 22, fontWeight: 500, color: T.cloud, lineHeight: 1.5, letterSpacing: "-0.01em" }}>
            "{q.text}"
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            — {q.attr}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: accent, opacity: 0.6 }}>P31 LABS</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ s }) {
  return (
    <div style={{ background: T.void, borderRadius: 16, overflow: "hidden", position: "relative", width: 540, height: 340 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
        <K4Generative w={540} h={340} accent={s.color} />
      </div>
      <div style={{ position: "relative", padding: 40, display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 80, fontWeight: 700, color: s.color, lineHeight: 1, letterSpacing: "-0.04em" }}>
          {s.value}
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: T.cloud, marginTop: 12, opacity: 0.85 }}>
          {s.label}
        </div>
        <div style={{ width: 60, height: 2, background: s.color, opacity: 0.4, margin: "20px auto 0", borderRadius: 1 }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, marginTop: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          P31 LABS · PHOS-FOR-US
        </span>
      </div>
    </div>
  );
}

function ProductCard({ p, accent }) {
  return (
    <div style={{ background: T.void, borderRadius: 16, overflow: "hidden", position: "relative", width: 540, height: 340 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
        <K4Generative w={540} h={340} accent={accent} />
      </div>
      <div style={{ position: "relative", padding: "36px 40px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 32 }}>{p.emoji}</span>
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 700, color: T.cloud }}>{p.name}</div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.status}</span>
            </div>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: T.muted, lineHeight: 1.6, maxWidth: 440 }}>{p.desc}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ width: 32, height: 2, background: accent, borderRadius: 1 }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, textTransform: "uppercase" }}>P31 LABS</span>
        </div>
      </div>
    </div>
  );
}

function MissionCard({ text, accent }) {
  return (
    <div style={{ background: T.void, borderRadius: 16, overflow: "hidden", position: "relative", width: 540, height: 340 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 4, height: "100%", background: accent }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
        <K4Generative w={540} h={340} accent={accent} />
      </div>
      <div style={{ position: "relative", padding: "48px 44px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: accent, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>
            THE MISSION
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: text.length > 90 ? 17 : 21, fontWeight: 600, color: T.cloud, lineHeight: 1.5 }}>{text}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg viewBox="0 0 100 100" width="18" height="18" fill="none">
            <path d="M50 10 L90 85 L10 85 Z" stroke={accent} strokeWidth="6" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted }}>phosphorus31.org</span>
        </div>
      </div>
    </div>
  );
}

function ArtCard({ accent }) {
  return (
    <div style={{ background: T.void, borderRadius: 16, overflow: "hidden", width: 540, height: 340 }}>
      <K4Generative w={540} h={340} accent={accent} />
    </div>
  );
}

function BrandCard({ accent }) {
  const accent2 = pick(ACCENTS.filter(c => c !== accent));
  return (
    <div style={{ background: T.void, borderRadius: 16, overflow: "hidden", position: "relative", width: 540, height: 340, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.07 }}>
        <K4Generative w={540} h={340} accent={accent} />
      </div>
      <div style={{ position: "relative", textAlign: "center" }}>
        <svg viewBox="0 0 100 100" width="64" height="64" fill="none" style={{ marginBottom: 16 }}>
          <path d="M50 10 L90 85 L10 85 Z" stroke={accent} strokeWidth="4" strokeLinejoin="round" />
          <path d="M50 10 L50 60 L90 85" stroke={accent2} strokeWidth="4" strokeLinejoin="round" opacity="0.7" />
          <path d="M50 60 L10 85" stroke={T.amber} strokeWidth="4" strokeLinejoin="round" opacity="0.5" />
        </svg>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 28, fontWeight: 700, color: T.cloud, letterSpacing: "-0.02em" }}>P31 Labs</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted, marginTop: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Open-source assistive technology
        </div>
        <div style={{ width: 40, height: 2, background: accent, margin: "16px auto 0", borderRadius: 1 }} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted, marginTop: 10 }}>
          phosphorus31.org · p31ca.org · github.com/p31labs
        </div>
      </div>
    </div>
  );
}

const GENERATORS = [
  { id: "quote", label: "Quote", gen: () => ({ type: "quote", data: pick(QUOTES), accent: pick(ACCENTS) }) },
  { id: "stat", label: "Stat", gen: () => ({ type: "stat", data: pick(STATS) }) },
  { id: "product", label: "Product", gen: () => ({ type: "product", data: pick(PRODUCTS), accent: pick(ACCENTS) }) },
  { id: "mission", label: "Mission", gen: () => ({ type: "mission", data: pick(MISSIONS), accent: pick(ACCENTS) }) },
  { id: "art", label: "K₄ Art", gen: () => ({ type: "art", accent: pick(ACCENTS) }) },
  { id: "brand", label: "Brand", gen: () => ({ type: "brand", accent: pick(ACCENTS) }) },
  { id: "random", label: "Random", gen: () => pick(GENERATORS.filter(g => g.id !== "random")).gen() },
];

function renderCard(card) {
  switch (card.type) {
    case "quote": return <QuoteCard q={card.data} accent={card.accent} />;
    case "stat": return <StatCard s={card.data} />;
    case "product": return <ProductCard p={card.data} accent={card.accent} />;
    case "mission": return <MissionCard text={card.data} accent={card.accent} />;
    case "art": return <ArtCard accent={card.accent} />;
    case "brand": return <BrandCard accent={card.accent} />;
    default: return null;
  }
}

export default function MediaForge() {
  const [card, setCard] = useState(null);
  const [mode, setMode] = useState("random");
  const [history, setHistory] = useState([]);
  const cardRef = useRef(null);

  const generate = useCallback((m) => {
    const gen = GENERATORS.find(g => g.id === m) || GENERATORS[6];
    const c = gen.gen();
    setCard(c);
    setHistory(h => [c, ...h].slice(0, 20));
  }, []);

  useEffect(() => { generate("random"); }, []);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: T.cloud, minHeight: "100vh" }}>
      <div style={{ borderBottom: `1px solid ${T.glass}`, padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <svg viewBox="0 0 100 100" width="26" height="26" fill="none">
            <path d="M50 10 L90 85 L10 85 Z" stroke={T.teal} strokeWidth="5" strokeLinejoin="round" />
            <path d="M50 10 L50 60 L90 85" stroke={T.coral} strokeWidth="5" strokeLinejoin="round" opacity="0.8" />
            <path d="M50 60 L10 85" stroke={T.amber} strokeWidth="5" strokeLinejoin="round" opacity="0.6" />
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>P31 Media Forge</div>
            <div style={{ fontSize: "0.7rem", color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>branded media generator</div>
          </div>
        </div>
        <div style={{ fontSize: "0.7rem", color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>
          {history.length} generated
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "1rem 1.5rem", flexWrap: "wrap" }}>
        {GENERATORS.map(g => (
          <button key={g.id} onClick={() => { setMode(g.id); generate(g.id); }}
            style={{ padding: "8px 14px", border: mode === g.id ? `1px solid ${T.teal}` : `1px solid ${T.glass}`, borderRadius: 8, background: mode === g.id ? `${T.teal}15` : "transparent", color: mode === g.id ? T.teal : T.muted, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            {g.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem 1.5rem 2rem", gap: "1.5rem" }}>
        <div ref={cardRef} style={{ borderRadius: 16, overflow: "hidden", boxShadow: `0 0 40px ${T.void}, 0 0 80px rgba(93,202,165,0.05)` }}>
          {card && renderCard(card)}
        </div>

        <button onClick={() => generate(mode)}
          style={{ padding: "12px 32px", background: T.teal, color: "#000", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "'Inter', sans-serif", minHeight: 44, display: "flex", alignItems: "center", gap: 8 }}>
          Generate another
        </button>

        {history.length > 1 && (
          <div style={{ width: "100%", maxWidth: 560 }}>
            <div style={{ fontSize: "0.75rem", color: T.muted, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Recent ({history.length})
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
              {history.slice(1, 8).map((h, i) => (
                <button key={i} onClick={() => setCard(h)}
                  style={{ flexShrink: 0, width: 80, height: 50, borderRadius: 6, border: `1px solid ${T.glass}`, background: T.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden" }}>
                  {h.type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
