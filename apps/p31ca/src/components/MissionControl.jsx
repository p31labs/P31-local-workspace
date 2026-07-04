import { useState, useEffect, useCallback, useRef } from "react";

const T = {
  void: "#0f1115", surface: "#161920", surface2: "#1c2028",
  glass: "rgba(255,255,255,0.06)", cloud: "#e8e6e3", muted: "#6b7280",
  teal: "#5DCAA5", cyan: "#4db8a8", coral: "#cc6247",
  amber: "#cda852", lavender: "#8b7cc9", phosphorus: "#5dca5d",
};

const KEY = "p31_mission_control";
const now = () => new Date().toISOString();
const fmt = (iso) => { try { const d = new Date(iso); return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return "—"; } };
const daysBetween = (a, b) => Math.ceil((new Date(b) - new Date(a)) / 86400000);
const today = () => new Date().toISOString().slice(0, 10);

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || defaultState(); } catch { return defaultState(); }
}
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

function defaultState() {
  return {
    shift: { active: false, start: null, totalToday: 0, history: [] },
    spoons: { total: 5, spent: 0, log: [] },
    calcium: { logs: [], lastLevel: null, lastDate: null, meds: [] },
    deadlines: [
      { id: "fers", label: "FERS Deadline", date: "2026-09-30", color: T.coral },
      { id: "ssdi", label: "SSDI Recon", date: "2026-05-17", color: T.amber },
      { id: "labs", label: "Calcium Labs", date: "2026-05-06", color: T.teal },
    ],
    tasks: [],
    evidence: [],
    standup: { last: null, entries: [] },
    deploy: { lastVerify: null, lastDeploy: null, gatesGreen: 86 },
    notes: "",
  };
}

const TABS = [
  { id: "shift", label: "Shift", icon: "⏱" },
  { id: "spoons", label: "Spoons", icon: "🥄" },
  { id: "calcium", label: "Ca²⁺", icon: "💊" },
  { id: "deadlines", label: "Dates", icon: "📅" },
  { id: "tasks", label: "Tasks", icon: "✅" },
  { id: "evidence", label: "Evidence", icon: "📸" },
  { id: "generate", label: "Generate", icon: "⚡" },
];

function Glass({ children, style, accent }) {
  return (
    <div style={{ background: T.surface2, border: `1px solid ${T.glass}`, borderRadius: 12,
      padding: 16, borderLeft: accent ? `3px solid ${accent}` : undefined, ...style }}>
      {children}
    </div>
  );
}

function Mono({ children, style }) {
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, ...style }}>{children}</span>;
}

function Btn({ children, onClick, color = T.teal, ghost, small, style: sx }) {
  return (
    <button onClick={onClick} style={{ padding: small ? "4px 10px" : "8px 16px", borderRadius: 6,
      background: ghost ? "transparent" : color, color: ghost ? color : "#000",
      border: ghost ? `1px solid ${color}40` : "none", fontWeight: 700,
      fontSize: small ? 11 : 13, cursor: "pointer", minHeight: small ? 32 : 40,
      fontFamily: "'Inter', sans-serif", ...sx }}>
      {children}
    </button>
  );
}

function ShiftPanel({ state, setState }) {
  const { shift } = state;
  const [elapsed, setElapsed] = useState(0);
  const interval = useRef(null);

  useEffect(() => {
    if (shift.active && shift.start) {
      interval.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(shift.start).getTime()) / 1000));
      }, 1000);
    } else { setElapsed(0); }
    return () => clearInterval(interval.current);
  }, [shift.active, shift.start]);

  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const isHyperfocus = elapsed > 2700; // 45 min

  const toggleShift = () => {
    if (shift.active) {
      const duration = Math.floor((Date.now() - new Date(shift.start).getTime()) / 60000);
      setState(s => ({ ...s, shift: { ...s.shift, active: false, start: null,
        totalToday: s.shift.totalToday + duration,
        history: [...s.shift.history, { start: s.shift.start, end: now(), mins: duration }].slice(-50) } }));
    } else {
      setState(s => ({ ...s, shift: { ...s.shift, active: true, start: now() } }));
    }
  };

  return (
    <div>
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 48, fontWeight: 700,
          color: shift.active ? (isHyperfocus ? T.amber : T.teal) : T.muted, letterSpacing: "-0.02em" }}>
          {String(hrs).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
        {isHyperfocus && shift.active && (
          <div style={{ color: T.amber, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
            marginTop: 4, animation: "none" }}>
            ⚠ HYPERFOCUS — 45+ min. Take calcium. Drink water. Stand up.
          </div>
        )}
        <Btn onClick={toggleShift} color={shift.active ? T.coral : T.teal}
          style={{ marginTop: 16, width: 160 }}>
          {shift.active ? "Shift Out" : "Shift In"}
        </Btn>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12 }}>
        <div style={{ textAlign: "center" }}>
          <Mono style={{ color: T.teal, fontSize: 18, fontWeight: 700 }}>{shift.totalToday}</Mono>
          <div style={{ fontSize: 10, color: T.muted }}>min today</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <Mono style={{ color: T.lavender, fontSize: 18, fontWeight: 700 }}>{shift.history.length}</Mono>
          <div style={{ fontSize: 10, color: T.muted }}>shifts logged</div>
        </div>
      </div>
      {shift.history.length > 0 && (
        <div style={{ marginTop: 16, maxHeight: 120, overflowY: "auto" }}>
          {shift.history.slice(-5).reverse().map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0",
              borderBottom: `1px solid ${T.glass}`, fontSize: 11, color: T.muted }}>
              <Mono>{fmt(h.start)}</Mono>
              <Mono style={{ color: T.teal }}>{h.mins} min</Mono>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpoonPanel({ state, setState }) {
  const { spoons } = state;
  const remaining = spoons.total - spoons.spent;
  const pct = Math.max(0, remaining / spoons.total);

  const spend = (n) => {
    setState(s => ({ ...s, spoons: { ...s.spoons, spent: s.spoons.spent + n,
      log: [...s.spoons.log, { amount: n, time: now(), note: "" }].slice(-100) } }));
  };
  const reset = () => setState(s => ({ ...s, spoons: { ...s.spoons, spent: 0, log: [] } }));
  const setTotal = (n) => setState(s => ({ ...s, spoons: { ...s.spoons, total: n } }));

  return (
    <div>
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
          {Array.from({ length: spoons.total }, (_, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: "50%",
              background: i < remaining ? T.amber : T.surface,
              border: `1px solid ${i < remaining ? T.amber : T.glass}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, opacity: i < remaining ? 1 : 0.3 }}>
              🥄
            </div>
          ))}
        </div>
        <Mono style={{ color: pct > 0.3 ? T.teal : pct > 0 ? T.amber : T.coral, fontSize: 20, fontWeight: 700 }}>
          {remaining} / {spoons.total}
        </Mono>
        <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>spoons remaining</div>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
        <Btn onClick={() => spend(1)} small ghost color={T.amber}>-1 🥄</Btn>
        <Btn onClick={() => spend(2)} small ghost color={T.amber}>-2 🥄</Btn>
        <Btn onClick={() => spend(3)} small ghost color={T.coral}>-3 🥄</Btn>
        <Btn onClick={reset} small ghost color={T.muted}>Reset</Btn>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
        <Mono style={{ color: T.muted, fontSize: 10 }}>Daily envelope:</Mono>
        {[3, 5, 7, 10].map(n => (
          <button key={n} onClick={() => setTotal(n)} style={{ width: 24, height: 24, borderRadius: 4,
            background: spoons.total === n ? T.teal : "transparent",
            border: `1px solid ${spoons.total === n ? T.teal : T.glass}`,
            color: spoons.total === n ? "#000" : T.muted, fontSize: 10, cursor: "pointer", fontWeight: 700 }}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function CalciumPanel({ state, setState }) {
  const { calcium } = state;
  const [level, setLevel] = useState("");

  const logMed = () => {
    setState(s => ({ ...s, calcium: { ...s.calcium,
      meds: [...s.calcium.meds, { time: now(), type: "OTC Calcium" }].slice(-200) } }));
  };
  const logLevel = () => {
    if (!level) return;
    const val = parseFloat(level);
    setState(s => ({ ...s, calcium: { ...s.calcium, lastLevel: val, lastDate: now(),
      logs: [...s.calcium.logs, { level: val, time: now() }].slice(-200) } }));
    setLevel("");
  };

  const lastMed = calcium.meds.length > 0 ? calcium.meds[calcium.meds.length - 1] : null;
  const hoursSinceMed = lastMed ? Math.floor((Date.now() - new Date(lastMed.time).getTime()) / 3600000) : null;
  const isOverdue = hoursSinceMed !== null && hoursSinceMed >= 6;

  return (
    <div>
      {isOverdue && (
        <Glass accent={T.coral} style={{ marginBottom: 12, padding: 10 }}>
          <div style={{ color: T.coral, fontSize: 12, fontWeight: 700 }}>
            ⚠ {hoursSinceMed}h since last calcium. Calcitriol half-life is ~6 hours. Take meds.
          </div>
        </Glass>
      )}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Glass style={{ flex: 1, textAlign: "center", padding: 12 }}>
          <Mono style={{ color: calcium.lastLevel ? (calcium.lastLevel < 8.0 ? T.coral : calcium.lastLevel < 8.5 ? T.amber : T.phosphorus) : T.muted,
            fontSize: 28, fontWeight: 700 }}>
            {calcium.lastLevel || "—"}
          </Mono>
          <div style={{ fontSize: 10, color: T.muted }}>mg/dL (last)</div>
          {calcium.lastDate && <Mono style={{ color: T.muted, fontSize: 9 }}>{fmt(calcium.lastDate)}</Mono>}
        </Glass>
        <Glass style={{ flex: 1, textAlign: "center", padding: 12 }}>
          <Mono style={{ color: hoursSinceMed !== null ? (isOverdue ? T.coral : T.teal) : T.muted,
            fontSize: 28, fontWeight: 700 }}>
            {hoursSinceMed !== null ? `${hoursSinceMed}h` : "—"}
          </Mono>
          <div style={{ fontSize: 10, color: T.muted }}>since last dose</div>
          <Mono style={{ color: T.muted, fontSize: 9 }}>{calcium.meds.length} doses logged</Mono>
        </Glass>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <Btn onClick={logMed} color={T.teal} style={{ flex: 1 }}>💊 Log Calcium Dose</Btn>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={level} onChange={e => setLevel(e.target.value)} placeholder="Lab result (mg/dL)"
          style={{ flex: 1, padding: "8px 12px", background: "rgba(0,0,0,0.3)", border: `1px solid ${T.glass}`,
            borderRadius: 6, color: T.cloud, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }} />
        <Btn onClick={logLevel} small color={T.phosphorus}>Log</Btn>
      </div>
      {calcium.logs.length > 0 && (
        <div style={{ marginTop: 12, maxHeight: 80, overflowY: "auto" }}>
          {calcium.logs.slice(-5).reverse().map((l, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0",
              borderBottom: `1px solid ${T.glass}` }}>
              <Mono style={{ color: l.level < 8.0 ? T.coral : l.level < 8.5 ? T.amber : T.phosphorus }}>{l.level} mg/dL</Mono>
              <Mono style={{ color: T.muted }}>{fmt(l.time)}</Mono>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeadlinePanel({ state }) {
  const sorted = [...state.deadlines].sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <div>
      {sorted.map(d => {
        const days = daysBetween(today(), d.date);
        const urgent = days <= 7;
        return (
          <Glass key={d.id} accent={d.color} style={{ marginBottom: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{d.label}</div>
                <Mono style={{ color: T.muted }}>{d.date}</Mono>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700,
                  color: days <= 0 ? T.coral : urgent ? T.amber : T.teal }}>
                  {days <= 0 ? "PAST" : days}
                </div>
                <div style={{ fontSize: 9, color: T.muted }}>days</div>
              </div>
            </div>
          </Glass>
        );
      })}
      <Mono style={{ color: T.muted, fontSize: 10 }}>
        Countdowns update daily. Add custom deadlines in state.deadlines.
      </Mono>
    </div>
  );
}

function TaskPanel({ state, setState }) {
  const [input, setInput] = useState("");
  const add = () => {
    if (!input.trim()) return;
    setState(s => ({ ...s, tasks: [...s.tasks, { id: Date.now(), text: input, done: false, created: now() }] }));
    setInput("");
  };
  const toggle = (id) => {
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  };
  const remove = (id) => {
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Add task..."
          style={{ flex: 1, padding: "8px 12px", background: "rgba(0,0,0,0.3)", border: `1px solid ${T.glass}`,
            borderRadius: 6, color: T.cloud, fontSize: 13 }} />
        <Btn onClick={add} small>Add</Btn>
      </div>
      {state.tasks.length === 0 ? (
        <div style={{ textAlign: "center", color: T.muted, padding: 20, fontSize: 13 }}>No tasks. Add one above.</div>
      ) : (
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {state.tasks.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
              borderBottom: `1px solid ${T.glass}` }}>
              <button onClick={() => toggle(t.id)} style={{ width: 24, height: 24, borderRadius: 4,
                border: `1px solid ${t.done ? T.phosphorus : T.glass}`,
                background: t.done ? `${T.phosphorus}20` : "transparent", cursor: "pointer",
                color: T.phosphorus, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t.done ? "✓" : ""}
              </button>
              <span style={{ flex: 1, fontSize: 13, color: t.done ? T.muted : T.cloud,
                textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
              <button onClick={() => remove(t.id)} style={{ color: T.muted, background: "none", border: "none",
                cursor: "pointer", fontSize: 14, padding: 4 }}>×</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
        <Mono style={{ color: T.muted }}>{state.tasks.filter(t => !t.done).length} remaining</Mono>
        <Mono style={{ color: T.phosphorus }}>{state.tasks.filter(t => t.done).length} done</Mono>
      </div>
    </div>
  );
}

function EvidencePanel({ state, setState }) {
  const [desc, setDesc] = useState("");
  const [exhibit, setExhibit] = useState("D");

  const log = () => {
    if (!desc.trim()) return;
    setState(s => ({ ...s, evidence: [...s.evidence,
      { id: Date.now(), desc, exhibit, time: now(), filed: false }].slice(-200) }));
    setDesc("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <select value={exhibit} onChange={e => setExhibit(e.target.value)}
          style={{ padding: "8px 10px", background: T.surface, border: `1px solid ${T.glass}`,
            borderRadius: 6, color: T.cloud, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          {["A","B","C","D","E","F","G","H","I","J","K","L","M"].map(l => (
            <option key={l} value={l}>Exh {l}</option>
          ))}
        </select>
        <input value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === "Enter" && log()}
          placeholder="Describe evidence..."
          style={{ flex: 1, padding: "8px 12px", background: "rgba(0,0,0,0.3)", border: `1px solid ${T.glass}`,
            borderRadius: 6, color: T.cloud, fontSize: 13 }} />
        <Btn onClick={log} small>Log</Btn>
      </div>
      {state.evidence.length === 0 ? (
        <div style={{ textAlign: "center", color: T.muted, padding: 20, fontSize: 13 }}>No evidence logged yet.</div>
      ) : (
        <div style={{ maxHeight: 250, overflowY: "auto" }}>
          {state.evidence.slice().reverse().map(e => (
            <div key={e.id} style={{ display: "flex", gap: 8, padding: "6px 0",
              borderBottom: `1px solid ${T.glass}`, alignItems: "baseline" }}>
              <Mono style={{ color: T.amber, fontWeight: 700, flexShrink: 0 }}>Exh {e.exhibit}</Mono>
              <span style={{ flex: 1, fontSize: 12, color: T.cloud }}>{e.desc}</span>
              <Mono style={{ color: T.muted, fontSize: 9, flexShrink: 0 }}>{fmt(e.time)}</Mono>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GeneratePanel({ state }) {
  const [output, setOutput] = useState("");
  const [type, setType] = useState("standup");

  const generate = useCallback(() => {
    const d = today();
    const shifts = state.shift.history.filter(h => h.start?.startsWith(d));
    const totalMins = shifts.reduce((s, h) => s + h.mins, 0);
    const tasksCompleted = state.tasks.filter(t => t.done).length;
    const tasksOpen = state.tasks.filter(t => !t.done).length;
    const lastCa = state.calcium.lastLevel;
    const medCount = state.calcium.meds.filter(m => m.time.startsWith(d)).length;
    const evidenceCount = state.evidence.filter(e => e.time.startsWith(d)).length;

    if (type === "standup") {
      setOutput(`## P31 Daily Standup — ${d}

**Shift time:** ${totalMins} minutes across ${shifts.length} shift(s)
**Spoons:** ${state.spoons.spent} spent / ${state.spoons.total} daily envelope (${state.spoons.total - state.spoons.spent} remaining)
**Calcium:** ${lastCa ? `Last known: ${lastCa} mg/dL` : "No labs logged"} | ${medCount} dose(s) today
**Tasks:** ${tasksCompleted} completed, ${tasksOpen} remaining
**Evidence:** ${evidenceCount} item(s) cataloged today

### Completed
${state.tasks.filter(t => t.done).map(t => `- [x] ${t.text}`).join("\n") || "- (none)"}

### Open
${state.tasks.filter(t => !t.done).map(t => `- [ ] ${t.text}`).join("\n") || "- (none)"}

### Notes
${state.notes || "(none)"}

---
*Generated by P31 Mission Control · ${now()}*`);
    } else if (type === "cwp") {
      setOutput(`# CWP-P31-[AREA]-2026-05
# [TITLE]

**Date:** ${d}
**Issued by:** [AGENT]
**Executing agent:** [TARGET]
**Spoon estimate:** [N] 🥄

## Intent
[What this CWP achieves. One paragraph.]

## Scope
**IN SCOPE:**
- [Deliverable 1]

**OUT OF SCOPE (Tag-out):**
- DO NOT [exclusion]

## Acceptance Criteria
- [ ] [Binary pass/fail criterion]
- [ ] npm run verify passes
- [ ] Registered in p31-alignment.json

---
*Status: ☐ Open*`);
    } else if (type === "fers-weekly") {
      const weekShifts = state.shift.history.filter(h => {
        const d = new Date(h.start);
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      });
      const weekMins = weekShifts.reduce((s, h) => s + h.mins, 0);
      const weekMeds = state.calcium.meds.filter(m => {
        const d = new Date(m.time);
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      });

      setOutput(`## FERS Functional Limitation Weekly Log
**Week ending:** ${d}
**Employee:** William R. Johnson (GS-0802-12)
**Conditions:** AuDHD (ICD-10 F84.0, F90.2), Hypoparathyroidism (E20.9)

### Work Activity
- Total productive time: ${weekMins} minutes across ${weekShifts.length} sessions
- Average session: ${weekShifts.length > 0 ? Math.round(weekMins / weekShifts.length) : 0} minutes
- Spoon envelope: ${state.spoons.total}/day (reduced from standard 8)

### Medical Management
- Calcium doses this week: ${weekMeds.length}
- Last known calcium level: ${lastCa ? `${lastCa} mg/dL` : "pending labs"}
- ${lastCa && lastCa < 8.5 ? "⚠ Below normal range (8.5-10.5). Functional limitation active." : "Within monitoring range."}

### Functional Limitations Observed
- Executive dysfunction episodes: [document]
- Hyperfocus episodes (>45 min without break): [document]
- Calcium-related symptoms: [document]

### Accommodations Utilized
- AI-assisted work control documents (cognitive prosthetic)
- Spoon-budgeted task management
- Automated medication reminders
- Safe mode on all digital interfaces

---
*This log supports SF-3112A (Applicant's Statement of Disability)*
*Generated by P31 Mission Control · ${now()}*`);
    } else if (type === "legal-email") {
      setOutput(`Subject: Re: [SUBJECT]

Ms. McGhan,

[Opening: factual correction or position statement.
Reference the specific correspondence being replied to.]

[Body: Cite dates, order paragraphs, evidence you have.
Reference but do NOT attach evidence detail.
Save specifics for court.]

[Requests — numbered:]
1. [Specific request]
2. [Specific request]

[Closing: preference for cooperation. Door-closing if needed.]

Respectfully,
William R. Johnson
(912) 227-4980`);
    }
  }, [state, type]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[
          { id: "standup", label: "Daily Standup" },
          { id: "cwp", label: "New CWP" },
          { id: "fers-weekly", label: "FERS Weekly" },
          { id: "legal-email", label: "Legal Email" },
        ].map(t => (
          <button key={t.id} onClick={() => setType(t.id)}
            style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: type === t.id ? `1px solid ${T.teal}` : `1px solid ${T.glass}`,
              background: type === t.id ? `${T.teal}15` : "transparent",
              color: type === t.id ? T.teal : T.muted, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>
      <Btn onClick={generate} style={{ width: "100%", marginBottom: 12 }}>Generate</Btn>
      {output && (
        <div style={{ position: "relative" }}>
          <pre style={{ background: T.void, border: `1px solid ${T.glass}`, borderRadius: 8,
            padding: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            lineHeight: 1.6, overflowX: "auto", color: T.teal, whiteSpace: "pre-wrap",
            maxHeight: 300, overflowY: "auto" }}>{output}</pre>
          <button onClick={() => { navigator.clipboard.writeText(output); }}
            style={{ position: "absolute", top: 8, right: 8, padding: "4px 8px", borderRadius: 4,
              background: T.surface2, border: `1px solid ${T.glass}`, color: T.muted,
              fontSize: 10, cursor: "pointer" }}>Copy</button>
        </div>
      )}
    </div>
  );
}

export default function MissionControl() {
  const [state, setState] = useState(load);
  const [tab, setTab] = useState("shift");

  useEffect(() => { save(state); }, [state]);

  return (
    <div style={{ background: T.void, color: T.cloud, fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: "100vh", WebkitFontSmoothing: "antialiased" }}>
      <div style={{ borderBottom: `1px solid ${T.glass}`, padding: "10px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: `${T.surface}cc`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg viewBox="0 0 100 100" width={20} height={20} fill="none">
            <path d="M50 10 L90 85 L10 85 Z" stroke={T.teal} strokeWidth="5" strokeLinejoin="round" />
            <path d="M50 10 L50 60 L90 85" stroke={T.coral} strokeWidth="5" strokeLinejoin="round" opacity="0.8" />
            <path d="M50 60 L10 85" stroke={T.amber} strokeWidth="5" strokeLinejoin="round" opacity="0.6" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Mission Control</span>
          <Mono style={{ color: T.muted, fontSize: 9 }}>v1.0.0</Mono>
        </div>
        <Mono style={{ color: T.muted, fontSize: 9 }}>
          {state.spoons.total - state.spoons.spent}🥄 · {state.shift.active ? "ON SHIFT" : "off"}
        </Mono>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "8px 12px", overflowX: "auto",
        borderBottom: `1px solid ${T.glass}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: tab === t.id ? `1px solid ${T.teal}` : `1px solid transparent`,
              background: tab === t.id ? `${T.teal}12` : "transparent",
              color: tab === t.id ? T.teal : T.muted, cursor: "pointer",
              whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "12px 16px 80px" }}>
        {tab === "shift" && <ShiftPanel state={state} setState={setState} />}
        {tab === "spoons" && <SpoonPanel state={state} setState={setState} />}
        {tab === "calcium" && <CalciumPanel state={state} setState={setState} />}
        {tab === "deadlines" && <DeadlinePanel state={state} />}
        {tab === "tasks" && <TaskPanel state={state} setState={setState} />}
        {tab === "evidence" && <EvidencePanel state={state} setState={setState} />}
        {tab === "generate" && <GeneratePanel state={state} />}
      </main>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "6px 16px",
        borderTop: `1px solid ${T.glass}`, background: `${T.surface}ee`,
        display: "flex", justifyContent: "center", gap: 12,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted, zIndex: 40 }}>
        <span>86 gates</span><span style={{ opacity: 0.3 }}>·</span>
        <span>{state.shift.totalToday}m today</span><span style={{ opacity: 0.3 }}>·</span>
        <span>{state.spoons.total - state.spoons.spent}🥄</span><span style={{ opacity: 0.3 }}>·</span>
        <span style={{ color: state.calcium.lastLevel && state.calcium.lastLevel < 8.0 ? T.coral : T.teal }}>
          Ca {state.calcium.lastLevel || "—"}
        </span>
      </div>
    </div>
  );
}
