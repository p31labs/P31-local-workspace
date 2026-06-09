import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   P31 ELECTRIC PLANT CONTROL PANEL (EPCP)
   The operator's single pane of glass. Every track. Every deadline. Every gauge.
   Built on 16 years of staring at real EPCPs at TRIREFFAC Kings Bay.
   ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "p31-epcp-state";

// ── Canonical P31 Tokens ─────────────────────────────────────────────────────
const T = {
  void: "#0f1115", surface: "#161920", surface2: "#1c2028",
  teal: "#4db8a8", coral: "#cc6247", amber: "#cda852",
  lavender: "#8b7cc9", phosphorus: "var(--p31-phosphorus)", cyan: "#5DCAA5",
  cloud: "var(--p31-cloud)", muted: "#6b7280", glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.08)",
};

// ── Data ─────────────────────────────────────────────────────────────────────
const DEADLINES = [
  { id: "hearing", label: "May 14 Hearing", date: "2026-05-14T09:30:00", color: T.coral, icon: "⚖️" },
  { id: "ssdi", label: "SSDI Recon", date: "2026-05-17T23:59:00", color: T.amber, icon: "📋" },
  { id: "fers", label: "FERS Filing", date: "2026-09-30T23:59:00", color: T.teal, icon: "🏛️" },
];

const TASKS = {
  "may4": {
    label: "Today — May 4", color: T.coral, items: [
      { id: "calcium", text: "Take calcium", icon: "💊" },
      { id: "fers-email", text: "Send FERS email to Eric Violette", icon: "📧" },
      { id: "omnibus", text: "File Omnibus + Notice on PeachCourt", icon: "⚖️" },
      { id: "glsp", text: "Call GLSP (904-206-5175)", icon: "📞" },
      { id: "evett", text: "Send Evett escalation email", icon: "📧" },
      { id: "er-records", text: "Request ER records (MRN 40236686)", icon: "🏥" },
      { id: "water", text: "Drink water", icon: "💧" },
    ]
  },
  "may5-6": {
    label: "Tue–Wed", color: T.amber, items: [
      { id: "labs", text: "Repeat calcium labs", icon: "🧪" },
      { id: "calcitriol", text: "Bridge Calcitriol prescription", icon: "💊" },
      { id: "brenda-call", text: "Brenda calls Christyn re: Saturday", icon: "📞" },
      { id: "brenda-decl", text: "Brenda signs availability declaration", icon: "✍️" },
      { id: "cashapp", text: "Cash App history export", icon: "💳" },
      { id: "pharmacy", text: "Pharmacy printed report", icon: "🏪" },
    ]
  },
  "may7-13": {
    label: "By May 13", color: T.teal, items: [
      { id: "exhibits", text: "Compile exhibit package A–M", icon: "📁" },
      { id: "discovery", text: "File discovery response", icon: "📄" },
      { id: "timeline", text: "Medication denial timeline (Exhibit L)", icon: "📝" },
      { id: "ssdi-read", text: "Read SSDI denial notice", icon: "📋" },
      { id: "mcghan-reply", text: "Reply to McGhan FINAL NOTICE", icon: "📧" },
      { id: "recorder", text: "Audio recorder charged + tested", icon: "🎤" },
    ]
  },
};

const EXHIBITS = [
  { id: "A", label: "Brenda availability declaration" },
  { id: "B", label: "Cash App receipt ($290)" },
  { id: "C", label: "ER records (Ca 7.5)" },
  { id: "D", label: "Medication denial texts" },
  { id: "E", label: "Property retrieval texts" },
  { id: "F", label: "Garage videos" },
  { id: "G", label: "Inventory (retrieved vs missing)" },
  { id: "H", label: "McGhan FINAL NOTICE (spam headers)" },
  { id: "I", label: "Maughon letter (on docket)" },
  { id: "J", label: "NFCU statements (WRJ-001–008)" },
  { id: "K", label: "Psychiatrist written report" },
  { id: "L", label: "48hr medication denial timeline" },
  { id: "M", label: "Discovery cover sheet" },
];

const CONTACTS = [
  { name: "GLSP Legal Aid", phone: "904-206-5175", role: "Free legal services intake" },
  { name: "Eric Violette", phone: "OCHR Norfolk", role: "FERS application" },
  { name: "UF Health Jax Records", phone: "904-244-4466", role: "ER chart (MRN 40236686)" },
  { name: "Navy Benefits Center", phone: "1-888-320-2917", role: "FERS questions" },
  { name: "Brenda O'Dell", phone: "brendaodell54@gmail.com", role: "ADA support / ¶6 supervisor" },
  { name: "Matthew Evett", phone: "Court reporter", role: "2 transcripts ($75.80 paid 3/19)" },
  { name: "Dr. Badre (Endo)", phone: "912-466-5601", role: "SGHS Brunswick — if Ca < 8.0" },
  { name: "Ascendis (Yorvipath)", phone: "1-844-442-7236", role: "Calcitriol alternative" },
];

const TECH_STATUS = {
  verifyGates: { value: 84, label: "Verify Gates", max: 84 },
  bondingTests: { value: 424, label: "BONDING Tests", max: 424 },
  psychTests: { value: 69, label: "Psych E2E Tests", max: 69 },
  alignSources: { value: 277, label: "Alignment Sources", max: 277 },
  workers: { value: 14, label: "CF Workers", max: 18 },
  publications: { value: 22, label: "Zenodo Papers", max: 22 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function hoursUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target - now;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
}

function loadState() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveState(state) {
  try { window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

// ── Components ───────────────────────────────────────────────────────────────

function StatusLight({ color, pulse, size = 10, label }) {
  return (
    <span title={label} style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      backgroundColor: color, boxShadow: `0 0 ${size}px ${color}60`,
      animation: pulse ? "pulse 2s ease-in-out infinite" : "none",
    }} />
  );
}

function Gauge({ value, max, label, color, unit = "" }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.muted, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: T.cloud, fontFamily: "'JetBrains Mono', monospace" }}>{value}{unit}/{max}{unit}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: T.surface2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function CountdownCard({ deadline }) {
  const days = daysUntil(deadline.date);
  const hours = hoursUntil(deadline.date);
  const urgent = days <= 3;
  return (
    <div style={{
      background: T.surface, border: `1px solid ${urgent ? deadline.color : T.glassBorder}`,
      borderRadius: 12, padding: "14px 16px", minWidth: 140, flex: "1 1 140px",
      boxShadow: urgent ? `0 0 20px ${deadline.color}20` : "none",
    }}>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>{deadline.icon} {deadline.label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: urgent ? deadline.color : T.cloud, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
        {days}
      </div>
      <div style={{ fontSize: 11, color: T.muted }}>{days === 1 ? "day" : "days"} ({hours}h)</div>
    </div>
  );
}

function Panel({ title, color, children, icon }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.glassBorder}`, borderRadius: 12,
      padding: 0, overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 16px", borderBottom: `1px solid ${T.glassBorder}`,
        display: "flex", alignItems: "center", gap: 8,
        background: `linear-gradient(135deg, ${color}08, transparent)`,
      }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <span style={{ fontSize: 13, fontWeight: 600, color, letterSpacing: "0.04em", textTransform: "uppercase" }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function TaskGroup({ group, checked, onToggle }) {
  const completed = group.items.filter(i => checked[i.id]).length;
  const total = group.items.length;
  const allDone = completed === total;
  return (
    <Panel title={`${group.label} — ${completed}/${total}`} color={allDone ? T.phosphorus : group.color} icon={allDone ? "✅" : "📋"}>
      {group.items.map(item => (
        <label key={item.id} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "6px 0",
          cursor: "pointer", fontSize: 14, color: checked[item.id] ? T.muted : T.cloud,
          textDecoration: checked[item.id] ? "line-through" : "none",
          transition: "color 0.2s",
        }}>
          <input type="checkbox" checked={!!checked[item.id]}
            onChange={() => onToggle(item.id)}
            style={{ accentColor: T.teal, width: 16, height: 16, cursor: "pointer" }} />
          <span>{item.icon}</span>
          <span>{item.text}</span>
        </label>
      ))}
    </Panel>
  );
}

function ExhibitChecklist({ checked, onToggle }) {
  const collected = EXHIBITS.filter(e => checked[`ex-${e.id}`]).length;
  return (
    <Panel title={`Exhibits — ${collected}/${EXHIBITS.length}`} color={collected === EXHIBITS.length ? T.phosphorus : T.amber} icon="📂">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
        {EXHIBITS.map(ex => (
          <label key={ex.id} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "3px 0",
            cursor: "pointer", fontSize: 12, color: checked[`ex-${ex.id}`] ? T.muted : T.cloud,
          }}>
            <input type="checkbox" checked={!!checked[`ex-${ex.id}`]}
              onChange={() => onToggle(`ex-${ex.id}`)}
              style={{ accentColor: T.amber, width: 14, height: 14, cursor: "pointer" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: T.amber, fontWeight: 600, width: 16 }}>{ex.id}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.label}</span>
          </label>
        ))}
      </div>
    </Panel>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function EPCP() {
  const [state, setState] = useState(loadState);
  const [time, setTime] = useState(new Date());
  const [safeMode, setSafeMode] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { saveState(state); }, [state]);

  const toggle = useCallback((id) => {
    setState(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const resetAll = () => {
    if (confirm("Reset all checkboxes? This cannot be undone.")) {
      setState({});
    }
  };

  const todayComplete = TASKS.may4.items.filter(i => state[i.id]).length;
  const todayTotal = TASKS.may4.items.length;

  return (
    <div style={{
      minHeight: "100vh", background: T.void, color: T.cloud,
      fontFamily: "'Inter', 'Atkinson Hyperlegible', system-ui, sans-serif",
      padding: "16px 16px 80px", maxWidth: 1200, margin: "0 auto",
      filter: safeMode ? "grayscale(1)" : "none",
      transition: "filter 0.3s ease",
    }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        * { box-sizing: border-box; }
        input[type="checkbox"] { flex-shrink: 0; }
        a { color: ${T.teal}; text-decoration: none; }
        a:hover { text-decoration: underline; }
        @media (max-width: 640px) {
          .epcp-grid-2 { grid-template-columns: 1fr !important; }
          .epcp-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: T.teal }}>⬡</span> P31 EPCP
            <span style={{ fontSize: 12, color: T.muted, fontWeight: 400 }}>Electric Plant Control Panel</span>
          </h1>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            {" · "}
            {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            {" · "}
            <span style={{ color: todayComplete === todayTotal ? T.phosphorus : T.amber }}>
              TODAY: {todayComplete}/{todayTotal}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setSafeMode(!safeMode)} style={{
            background: safeMode ? T.muted : T.surface2, color: T.cloud,
            border: `1px solid ${T.glassBorder}`, borderRadius: 8, padding: "6px 12px",
            cursor: "pointer", fontSize: 12,
          }}>
            {safeMode ? "☀️ Normal" : "🌑 Safe Mode"}
          </button>
          <button onClick={resetAll} style={{
            background: T.surface2, color: T.muted,
            border: `1px solid ${T.glassBorder}`, borderRadius: 8, padding: "6px 12px",
            cursor: "pointer", fontSize: 12,
          }}>↺ Reset</button>
        </div>
      </div>

      {/* ── Annunciator: Countdown Strip ────────────────────────────── */}
      <div className="epcp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {DEADLINES.map(d => <CountdownCard key={d.id} deadline={d} />)}
      </div>

      {/* ── Medical Alert Bar ──────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${T.coral}15, ${T.surface})`,
        border: `1px solid ${T.coral}40`, borderRadius: 12, padding: "12px 16px",
        marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <StatusLight color={T.coral} pulse size={12} label="Medical alert" />
        <div style={{ fontSize: 13, flex: 1, minWidth: 200 }}>
          <span style={{ fontWeight: 600, color: T.coral }}>MEDICAL STATUS</span>
          <span style={{ color: T.muted }}> · </span>
          <span>Last Ca: <strong style={{ color: T.coral, fontFamily: "'JetBrains Mono', monospace" }}>7.5 mg/dL</strong> (Apr 18 ER)</span>
          <span style={{ color: T.muted }}> · </span>
          <span>Calcitriol: <strong style={{ color: T.amber }}>OTC substitute</strong></span>
          <span style={{ color: T.muted }}> · </span>
          <span>Next labs: <strong>Tuesday</strong></span>
        </div>
        <div style={{ fontSize: 11, color: T.muted, background: T.surface2, padding: "4px 10px", borderRadius: 6 }}>
          If Ca crashes → everything stops except labs + meds
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────── */}
      <div className="epcp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Left Column: Tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TaskGroup group={TASKS.may4} checked={state} onToggle={toggle} />
          <TaskGroup group={TASKS["may5-6"]} checked={state} onToggle={toggle} />
          <TaskGroup group={TASKS["may7-13"]} checked={state} onToggle={toggle} />
        </div>

        {/* Right Column: Status Panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Family Panel */}
          <Panel title="Family — ¶6 Compliance" color={T.coral} icon="👨‍👧‍👦">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted }}>Days since last contact</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.coral, fontFamily: "'JetBrains Mono', monospace" }}>
                  {daysUntil("2026-04-04") > 0 ? Math.floor((new Date() - new Date("2026-04-04")) / 86400000) : 30}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted }}>Visits facilitated by Christyn</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.coral, fontFamily: "'JetBrains Mono', monospace" }}>0</div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "8px 12px", background: T.surface2, borderRadius: 8, fontSize: 12 }}>
              <div style={{ color: T.muted, marginBottom: 4 }}>¶6 Status</div>
              <div>Brenda designated supervisor. Christyn has unilaterally excluded her. No court order supports this.</div>
            </div>
            <div style={{ marginTop: 8, padding: "8px 12px", background: T.surface2, borderRadius: 8, fontSize: 12 }}>
              <div style={{ color: T.muted, marginBottom: 4 }}>Next Scheduled</div>
              <div>Saturday May 10 — if Brenda's Tuesday call produces confirmed exchange</div>
            </div>
          </Panel>

          {/* Exhibits */}
          <ExhibitChecklist checked={state} onToggle={toggle} />

          {/* P31 Ecosystem */}
          <Panel title="P31 Ecosystem" color={T.teal} icon="🔺">
            {Object.values(TECH_STATUS).map(g => (
              <Gauge key={g.label} value={g.value} max={g.max} label={g.label} color={g.value === g.max ? T.phosphorus : T.amber} />
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {[
                { label: "Launch", color: T.phosphorus },
                { label: "Convergence", color: T.phosphorus },
                { label: "Psych E2E", color: T.phosphorus },
              ].map(b => (
                <span key={b.label} style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 4,
                  background: `${b.color}15`, color: b.color, border: `1px solid ${b.color}30`,
                }}>
                  <StatusLight color={b.color} size={6} /> {b.label} ✓
                </span>
              ))}
            </div>
          </Panel>

          {/* Financial */}
          <Panel title="Financial" color={T.amber} icon="💰">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
              {[
                { label: "Liquid", value: "~$5", color: T.coral },
                { label: "Income", value: "$0/mo", color: T.coral },
                { label: "Support Paid", value: "$290", color: T.phosphorus },
              ].map(item => (
                <div key={item.label} style={{ padding: "8px 0" }}>
                  <div style={{ fontSize: 11, color: T.muted }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {["SNAP ✓", "Medicaid ✓", "Mercury ✓"].map(b => (
                <span key={b} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: `${T.phosphorus}15`, color: T.phosphorus }}>
                  {b}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Contacts Strip ────────────────────────────────────────── */}
      <Panel title="Quick Contacts" color={T.lavender} icon="📇">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 8 }}>
          {CONTACTS.map(c => (
            <div key={c.name} style={{
              padding: "8px 12px", background: T.surface2, borderRadius: 8,
              display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13,
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{c.role}</div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.teal, textAlign: "right" }}>
                {c.phone}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Operating Rules Footer ────────────────────────────────── */}
      <div style={{
        marginTop: 20, padding: "12px 16px", background: T.surface,
        border: `1px solid ${T.glassBorder}`, borderRadius: 12, fontSize: 12, color: T.muted,
      }}>
        <span style={{ color: T.teal, fontWeight: 600 }}>OPERATING RULES:</span>{" "}
        Don't trust output inside a calcium flare · The verify chain is the only truth · Lead with the constraint · Two perfect surfaces beat five good ones · No end user ever hits an almost-done product · Bonding-soup wins every conflict · S.J. and W.J. on all documents · Never naval/military metaphors
      </div>

      {/* ── Signature ──────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: T.muted }}>
        P31 Labs, Inc. · EIN 42-1888158 · phosphorus31.org · "The cage holds while the operator rests."
        <div style={{ marginTop: 4 }}>💜🔺💜</div>
      </div>
    </div>
  );
}
