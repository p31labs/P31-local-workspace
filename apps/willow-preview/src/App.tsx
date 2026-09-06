import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import * as Tone from 'tone';

// ══════════════════════════════════════════════════════
// STYLES — WILLOW skin (green accent, mobile-first)
// ══════════════════════════════════════════════════════
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  :root {
    --w-void:   #030608;
    --w-s1:     #070d0a;
    --w-s2:     #0d1812;
    --w-glass:  rgba(7,13,10,0.9);
    --w-border: rgba(52,211,153,0.12);
    --w-accent: #34d399;
    --w-violet: #a78bfa;
    --w-gold:   #fbbf24;
    --w-red:    #fb7185;
    --w-blue:   #60a5fa;
    --w-text:   #f0f2f5;
    --w-muted:  rgba(240,242,245,0.42);
    --w-dim:    rgba(240,242,245,0.18);
    --w-sans:   Inter, system-ui, sans-serif;
    --w-mono:   'JetBrains Mono', monospace;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: var(--w-void); }
  body { font-family: var(--w-sans); color: var(--w-text); overflow: hidden; -webkit-font-smoothing: antialiased; }
  [data-spoons="0"] .ui-chrome { display: none !important; }
  [data-spoons="0"] .motion-el, [data-spoons="1"] .motion-el { animation: none !important; transition: none !important; }
  ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(52,211,153,0.15); border-radius: 2px; }
  textarea, input, select { font-family: inherit; }
  input, textarea { background: rgba(52,211,153,0.04); border: 1px solid rgba(52,211,153,0.15); border-radius: 10px; color: var(--w-text); outline: none; transition: border-color 0.15s; }
  input:focus, textarea:focus { border-color: rgba(52,211,153,0.4); }
  button { cursor: pointer; font-family: var(--w-sans); border: none; background: transparent; }
  @keyframes breatheIn  { 0%{transform:scale(0.75);opacity:0.5;} 40%{transform:scale(1.2);opacity:1;} 70%{transform:scale(1.2);opacity:1;} 100%{transform:scale(0.75);opacity:0.5;} }
  @keyframes float      { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-9px);} }
  @keyframes pulse      { 0%,100%{opacity:0.3;} 50%{opacity:1;} }
  @keyframes ripple     { 0%{transform:scale(0.8);opacity:0.6;} 100%{transform:scale(2.2);opacity:0;} }
  @keyframes fadeUp     { from{opacity:0;transform:translateY(7px);} to{opacity:1;transform:translateY(0);} }
  @keyframes orb-pulse  { 0%,100%{box-shadow:0 0 30px rgba(52,211,153,0.3), 0 0 60px rgba(52,211,153,0.1);} 50%{box-shadow:0 0 50px rgba(52,211,153,0.5), 0 0 100px rgba(52,211,153,0.2);} }
  .breathe-el  { animation: breatheIn 10s ease-in-out infinite; }
  .float-el    { animation: float 4s ease-in-out infinite; }
  .pulse-dot   { animation: pulse 2.2s ease-in-out infinite; }
  .ripple-el   { animation: ripple 2s ease-out infinite; }
  .fade-up     { animation: fadeUp 0.22s ease-out both; }
  .orb-glow    { animation: orb-pulse 3s ease-in-out infinite; }
  .glass { background: var(--w-glass); backdrop-filter: blur(18px) saturate(1.4); border: 1px solid var(--w-border); }
  .surface-card { background: rgba(7,13,10,0.7); border: 1px solid rgba(52,211,153,0.1); border-radius: 14px; padding: 14px; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

// ══════════════════════════════════════════════════════
// CONTEXT & STORE
// ══════════════════════════════════════════════════════
const Ctx = createContext<any>(null);
const useW = () => useContext(Ctx);

const INIT_QUESTS = [
  { id: 1, title: 'Morning Star', desc: 'Log your mood first thing', xp: 15, love: 5, icon: '⭐', done: false },
  { id: 2, title: 'Color Storm', desc: 'Draw something with 3+ colors', xp: 25, love: 10, icon: '🎨', done: false },
  { id: 3, title: 'Beat Builder', desc: 'Make a 4-track loop in Music Maker', xp: 40, love: 15, icon: '🎵', done: false },
  { id: 4, title: 'Breath of Life', desc: 'Complete one breathing cycle in the Portal', xp: 20, love: 8, icon: '🌬️', done: false },
  { id: 5, title: 'Story Time', desc: 'Write 30+ words in your Journal', xp: 30, love: 12, icon: '📖', done: false },
  { id: 6, title: 'Helper Heart', desc: 'Send 3 messages to the Companion', xp: 20, love: 10, icon: '💚', done: false },
];

const SKILLS = [
  { id: 'focus',    label: 'Focus',      emoji: '🎯', level: 2, maxLevel: 10, xpNeeded: 200, color: '#00f0ff' },
  { id: 'create',   label: 'Creativity', emoji: '🎨', level: 3, maxLevel: 10, xpNeeded: 300, color: '#a78bfa' },
  { id: 'music',    label: 'Music',      emoji: '🎵', level: 1, maxLevel: 10, xpNeeded: 100, color: '#fbbf24' },
  { id: 'calm',     label: 'Calm',       emoji: '🌿', level: 4, maxLevel: 10, xpNeeded: 400, color: '#34d399' },
  { id: 'words',    label: 'Words',      emoji: '📝', level: 2, maxLevel: 10, xpNeeded: 200, color: '#fb7185' },
  { id: 'connect',  label: 'Connection', emoji: '💚', level: 1, maxLevel: 10, xpNeeded: 100, color: '#60a5fa' },
];

const MOODS = [
  { id: 'rainbow', emoji: '🌈', label: 'Amazing' },
  { id: 'sunny',   emoji: '☀️', label: 'Good' },
  { id: 'cloudy',  emoji: '⛅', label: 'Okay' },
  { id: 'rainy',   emoji: '🌧️', label: 'Hard' },
  { id: 'stormy',  emoji: '⛈️', label: 'Rough' },
];

const COMPANION_RESPONSES: Record<string, string[]> = {
  happy:    ['That makes me so happy to hear! 🌟', 'You\'re glowing today ✨', 'Amazing — what made it so good?'],
  tired:    ['Rest is important, you know? 💚', 'Even the moon needs to rest sometimes 🌙', 'Maybe the Portal can help — it\'s really calming 🌬️'],
  sad:      ['I\'m right here with you 💚', 'It\'s okay to feel that way. Want to draw it out?', 'You\'re not alone. I remember you last felt this way and you got through it 🌱'],
  angry:    ['That sounds really hard. I hear you 💚', 'Want to tell me more? I\'m listening 👂', 'Sometimes music helps — want to make some noise in the Music Maker? 🥁'],
  default:  ['Tell me more! 💬', 'I\'m listening 💚', 'That\'s really interesting!', 'How does that make you feel?'],
};

function getCompanionResponse(msg: string, mood: string): string {
  const lower = msg.toLowerCase();
  let pool = COMPANION_RESPONSES.default;
  if (lower.includes('happy') || lower.includes('good') || lower.includes('great')) pool = COMPANION_RESPONSES.happy;
  else if (lower.includes('tired') || lower.includes('sleep') || lower.includes('exhausted')) pool = COMPANION_RESPONSES.tired;
  else if (lower.includes('sad') || lower.includes('cry') || lower.includes('miss') || lower.includes('alone')) pool = COMPANION_RESPONSES.sad;
  else if (lower.includes('angry') || lower.includes('mad') || lower.includes('hate') || lower.includes('unfair')) pool = COMPANION_RESPONSES.angry;
  else if (mood === 'rainy' || mood === 'stormy') pool = COMPANION_RESPONSES.sad;
  else if (mood === 'rainbow' || mood === 'sunny') pool = COMPANION_RESPONSES.happy;
  return pool[Math.floor(Math.random() * pool.length)];
}

function WillowProvider({ children }: { children: React.ReactNode }) {
  const [spoons, setSpoonRaw] = useState(4);
  const [screen, setScreen]   = useState('home');
  const [love, setLove]       = useState(327);
  const [xp, setXp]           = useState(1240);
  const [mood, setMood]       = useState('sunny');
  const [quests, setQuests]   = useState(INIT_QUESTS);
  const [messages, setMsgs]   = useState<any[]>([
    { id: 1, from: 'willow', text: 'Hey! I\'m Willow, your companion 🌿 How are you feeling today?', ts: '9:00 AM' },
  ]);
  const [age, setAge]         = useState(10);

  const setSpoons = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(5, v));
    setSpoonRaw(clamped);
    document.documentElement.setAttribute('data-spoons', clamped.toString());
  }, []);

  const earnLove = useCallback((amt: number) => {
    setLove((l: number) => l + amt);
    setXp((x: number) => x + amt * 2);
  }, []);

  const completeQuest = useCallback((id: number) => {
    setQuests((qs: any[]) => qs.map(q => {
      if (q.id !== id || q.done) return q;
      earnLove(q.love);
      setXp((x: number) => x + q.xp);
      return { ...q, done: true };
    }));
  }, [earnLove]);

  const addMessage = useCallback((text: string, from = 'user') => {
    const msg = { id: Date.now(), from, text, ts: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
    setMsgs((ms: any[]) => [...ms, msg]);
    if (from === 'user') {
      earnLove(2);
      setTimeout(() => {
        const reply = getCompanionResponse(text, mood);
        setMsgs((ms: any[]) => [...ms, { id: Date.now() + 1, from: 'willow', text: reply, ts: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]);
      }, 900);
    }
  }, [mood, earnLove]);

  const level = Math.floor(xp / 500) + 1;
  const ctx = { spoons, setSpoons, screen, setScreen, love, xp, level, mood, setMood, quests, completeQuest, messages, addMessage, earnLove, age, setAge };
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

// ══════════════════════════════════════════════════════
// STARFIELD
// ══════════════════════════════════════════════════════
function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { spoons } = useW();
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: 0.5 + Math.random() * 1.3, o: 0.06 + Math.random() * 0.25,
    }));
    let raf: number;
    const draw = () => {
      if (spoons === 0) { ctx.clearRect(0, 0, c.width, c.height); return; }
      ctx.clearRect(0, 0, c.width, c.height);
      const sp = Math.max(0.2, spoons / 5);
      pts.forEach(p => {
        p.x = (p.x + p.vx * sp + c.width) % c.width;
        p.y = (p.y + p.vy * sp + c.height) % c.height;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52,211,153,${p.o * sp})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [spoons]);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

// ══════════════════════════════════════════════════════
// CRISIS OVERLAY
// ══════════════════════════════════════════════════════
function CrisisOverlay() {
  const { spoons, setSpoons } = useW();
  if (spoons > 0) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      <div className="breathe-el" style={{ width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.25), rgba(52,211,153,0.04))', border: '2px solid rgba(52,211,153,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🌿</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--w-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(52,211,153,0.55)', marginBottom: 8 }}>QUIET MODE</div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>Breathe with me 🌬️</div>
        <div style={{ fontFamily: 'var(--w-mono)', fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 8 }}>In 4 · Hold 4 · Out 6</div>
      </div>
      <button data-mcp-tool="setSpoonLevel" data-mcp-type="control" data-mcp-range="0,5" data-mcp-current="3" onClick={() => setSpoons(3)} style={{ padding: '12px 28px', borderRadius: 14, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: 'rgba(52,211,153,0.8)', fontSize: 14, fontWeight: 600 }}>I&#39;m ready to come back 💚</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════
function Header() {
  const { love, xp, level, spoons, setSpoons, mood } = useW();
  const curMood = MOODS.find((m: any) => m.id === mood);
  return (
    <div className="glass ui-chrome" style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderRadius: 0, borderBottom: '1px solid rgba(52,211,153,0.1)', zIndex: 10, position: 'relative', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, #34d399, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🌿</div>
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.04em' }}>P31 <span style={{ color: '#34d399' }}>WILLOW</span></span>
        <span style={{ fontSize: 14 }}>{curMood?.emoji}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--w-mono)', fontSize: 10 }}>
        <span style={{ color: '#fbbf24' }}>❤️ {love}</span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <span style={{ color: '#a78bfa' }}>Lv.{level}</span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <button data-mcp-tool="setSpoonLevel" data-mcp-type="control" data-mcp-range="0,5" data-mcp-current={spoons} onClick={() => setSpoons((spoons + 1) % 6)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, border: `1px solid ${spoons <= 1 ? 'rgba(251,65,117,0.3)' : 'rgba(52,211,153,0.2)'}`, background: 'transparent', color: spoons <= 1 ? '#fb7185' : 'rgba(240,242,245,0.7)', fontSize: 10, fontFamily: 'var(--w-mono)' }}>⚡ {spoons}/5</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// BOTTOM NAV
// ══════════════════════════════════════════════════════
const NAV_ITEMS = [
  { id: 'home', emoji: '🏠', label: 'Home' },
  { id: 'draw', emoji: '🎨', label: 'Create' },
  { id: 'portal', emoji: '🌊', label: 'Portal' },
  { id: 'quests', emoji: '⚔️', label: 'Quests' },
  { id: 'companion', emoji: '💚', label: 'Buddy' },
];

function BottomNav() {
  const { screen, setScreen } = useW();
  return (
    <div className="glass ui-chrome" style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-around', borderTop: '1px solid rgba(52,211,153,0.1)', borderRadius: 0, zIndex: 10, flexShrink: 0 }}>
      {NAV_ITEMS.map(({ id, emoji, label }) => {
        const active = screen === id;
        return (
          <button key={id} data-mcp-tool="navigate" data-mcp-type="action" data-mcp-target={`nav-${id}`} onClick={() => setScreen(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 12px', minWidth: 48, minHeight: 48, borderRadius: 12, background: active ? 'rgba(52,211,153,0.1)' : 'transparent', border: `1px solid ${active ? 'rgba(52,211,153,0.3)' : 'transparent'}`, transition: 'all 0.15s' }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
            <span style={{ fontSize: 10, color: active ? '#34d399' : 'rgba(240,242,245,0.4)', fontWeight: active ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// HOME SCREEN
// ══════════════════════════════════════════════════════
function HomeScreen() {
  const { mood, setMood, love, xp, level, quests, earnLove, setScreen } = useW();
  const todayQuests = quests.filter((q: any) => !q.done).slice(0, 3);
  const xpProgress = xp % 500;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
        <div className="float-el" style={{ position: 'relative' }}>
          <div className="ripple-el" style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '2px solid rgba(52,211,153,0.2)', pointerEvents: 'none' }} />
          <div className="orb-glow" style={{ width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.35), rgba(52,211,153,0.06))', border: '2px solid rgba(52,211,153,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, cursor: 'pointer' }} onClick={() => earnLove(1)}>
            🌿
          </div>
        </div>
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Hey, I&apos;m Willow 🌱</div>
          <div style={{ fontSize: 11, color: 'var(--w-muted)', marginTop: 2 }}>Level {level} · {xp} XP · {love} ❤️ LOVE</div>
        </div>
        <div style={{ width: '100%', maxWidth: 200, marginTop: 8 }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(xpProgress / 500) * 100}%`, background: 'linear-gradient(90deg, #34d399, #a78bfa)', borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: 'var(--w-muted)', textAlign: 'right', marginTop: 3 }}>{xpProgress}/500 to Lv.{level + 1}</div>
        </div>
      </div>
      <div className="surface-card">
        <div style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: 'var(--w-muted)', letterSpacing: '0.14em', marginBottom: 8 }}>HOW ARE YOU FEELING?</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {MOODS.map(m => (
            <button key={m.id} data-mcp-tool="setMood" data-mcp-type="control" data-mcp-current={mood} onClick={() => { setMood(m.id); earnLove(3); }} title={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 10px', borderRadius: 12, border: `1px solid ${mood === m.id ? 'rgba(52,211,153,0.4)' : 'transparent'}`, background: mood === m.id ? 'rgba(52,211,153,0.08)' : 'transparent', transition: 'all 0.15s', minWidth: 44, minHeight: 44 }}>
              <span style={{ fontSize: 20 }}>{m.emoji}</span>
              <span style={{ fontSize: 9, color: mood === m.id ? '#34d399' : 'var(--w-muted)' }}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>
      {todayQuests.length > 0 && (
        <div className="surface-card" style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: 'var(--w-muted)', letterSpacing: '0.14em', marginBottom: 8 }}>TODAY&apos;S QUESTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayQuests.map((q: any) => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.1)' }}>
                <span style={{ fontSize: 20 }}>{q.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{q.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--w-muted)' }}>{q.desc}</div>
                </div>
                <div style={{ fontFamily: 'var(--w-mono)', fontSize: 10, color: '#fbbf24', flexShrink: 0 }}>+{q.love} ❤️</div>
              </div>
            ))}
            <button onClick={() => setScreen('quests')} style={{ fontSize: 11, color: '#34d399', padding: '6px 0' }}>See all quests →</button>
          </div>
        </div>
      )}
      {todayQuests.length === 0 && (
        <div className="surface-card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌟</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#34d399' }}>All quests complete!</div>
          <div style={{ fontSize: 11, color: 'var(--w-muted)', marginTop: 4 }}>Amazing work today. You earned it 💚</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// DRAW SCREEN
// ══════════════════════════════════════════════════════
const COLORS = ['#34d399','#00f0ff','#a78bfa','#fbbf24','#fb7185','#f0f2f5','#f97316','#ec4899','#60a5fa','#84cc16'];

function DrawScreen() {
  const { earnLove } = useW();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{x:number;y:number}|null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const [color, setColor] = useState('#34d399');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush');
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    ctx.fillStyle = '#070d0a'; ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const getPos = (e: any, c: HTMLCanvasElement) => {
    const rect = c.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * (c.width / rect.width), y: (src.clientY - rect.top) * (c.height / rect.height) };
  };

  const startDraw = useCallback((e: any) => {
    e.preventDefault();
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    undoStack.current.push(ctx.getImageData(0, 0, c.width, c.height));
    if (undoStack.current.length > 12) undoStack.current.shift();
    isDrawing.current = true;
    lastPos.current = getPos(e, c);
  }, []);

  const draw = useCallback((e: any) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const pos = getPos(e, c);
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    if (!hasDrawn) { setHasDrawn(true); earnLove(5); }
  }, [color, brushSize, tool, hasDrawn, earnLove]);

  const stopDraw = useCallback(() => { isDrawing.current = false; }, []);
  const undo = () => {
    if (!undoStack.current.length) return;
    const c = canvasRef.current; if (!c) return;
    c.getContext('2d')!.putImageData(undoStack.current.pop()!, 0, 0);
  };
  const clear = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    undoStack.current.push(ctx.getImageData(0, 0, c.width, c.height));
    ctx.fillStyle = '#070d0a'; ctx.fillRect(0, 0, c.width, c.height);
  };
  const saveDrawing = () => {
    const c = canvasRef.current; if (!c) return;
    const a = document.createElement('a');
    a.download = `willow-art-${Date.now()}.png`;
    a.href = c.toDataURL();
    a.click();
    earnLove(10);
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool('brush'); }} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: `2px solid ${color === c && tool === 'brush' ? '#fff' : 'rgba(255,255,255,0.1)'}`, transition: 'border 0.1s', minWidth: 22, minHeight: 22 }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--w-muted)' }}>Size</span>
          <input type="range" min={1} max={24} value={brushSize} onChange={e => setBrushSize(+e.target.value)} style={{ width: 70, accentColor: '#34d399' }} />
          <span style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: 'var(--w-muted)', width: 14 }}>{brushSize}</span>
        </div>
        <button onClick={() => setTool(t => t === 'eraser' ? 'brush' : 'eraser')} style={{ padding: '4px 8px', borderRadius: 7, border: `1px solid ${tool === 'eraser' ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`, background: tool === 'eraser' ? 'rgba(52,211,153,0.1)' : 'transparent', fontSize: 13, color: 'var(--w-text)' }}>⬜</button>
        <button onClick={undo} style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: 'var(--w-muted)' }}>↩</button>
        <button onClick={clear} style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid rgba(251,65,117,0.2)', color: '#fb7185', fontSize: 12 }}>🗑</button>
        <button onClick={saveDrawing} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 11, fontWeight: 600 }}>💾 Save</button>
      </div>
      <div style={{ flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(52,211,153,0.12)', minHeight: 200 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
        {!hasDrawn && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', color: 'rgba(52,211,153,0.3)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎨</div>
              <div style={{ fontSize: 12 }}>Touch here to draw</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MUSIC MAKER
// ══════════════════════════════════════════════════════
const MELODY_NOTES = ['C4','E4','G4','B4','C5','G4','D4','A4'];

function MusicScreen() {
  const { earnLove } = useW();
  const [grid, setGrid] = useState({
    kick:   [1,0,0,0,1,0,0,0],
    snare:  [0,0,1,0,0,0,1,0],
    hihat:  [1,1,1,1,1,1,1,1],
    melody: [1,0,0,0,0,0,1,0],
  });
  const [isPlaying, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);
  const [bpm, setBpm] = useState(120);
  const [hasPlayed, setHasPlayed] = useState(false);
  const synthsRef = useRef<any>(null);
  const seqRef = useRef<any>(null);

  useEffect(() => {
    const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.15 }).toDestination();
    const kick   = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 } }).connect(reverb);
    const snare  = new Tone.MetalSynth({ frequency: 300, envelope: { attack: 0.001, decay: 0.12, release: 0.1 }, harmonicity: 5.1, modulationIndex: 28, resonance: 3500, octaves: 1.2 }).connect(reverb);
    const hihat  = new Tone.MetalSynth({ frequency: 900, envelope: { attack: 0.001, decay: 0.04, release: 0.04 }, harmonicity: 5, modulationIndex: 14, resonance: 7000, octaves: 0.4 }).connect(reverb);
    const melody = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.12, sustain: 0.4, release: 0.4 }, volume: -8 }).connect(reverb);
    synthsRef.current = { kick, snare, hihat, melody };
    return () => { [kick, snare, hihat, melody, reverb].forEach((s: any) => { try { s.dispose(); } catch {} }); };
  }, []);

  const togglePlay = async () => {
    await Tone.start();
    if (isPlaying) {
      Tone.Transport.stop();
      seqRef.current?.dispose(); seqRef.current = null;
      setStep(-1); setPlaying(false); return;
    }
    Tone.Transport.bpm.value = bpm;
    const snapshot = { ...grid };
    seqRef.current = new Tone.Sequence((time: number, s: number) => {
      setStep(s);
      const { kick, snare, hihat, melody } = synthsRef.current;
      if (snapshot.kick[s])   kick.triggerAttackRelease('C1', '8n', time);
      if (snapshot.snare[s])  snare.triggerAttackRelease('8n', time);
      if (snapshot.hihat[s])  hihat.triggerAttackRelease('16n', time);
      if (snapshot.melody[s]) melody.triggerAttackRelease(MELODY_NOTES[s], '8n', time);
    }, [0,1,2,3,4,5,6,7], '8n');
    seqRef.current.start(0);
    Tone.Transport.start();
    setPlaying(true);
    if (!hasPlayed) { setHasPlayed(true); earnLove(8); }
  };

  const toggle = (track: string, i: number) => setGrid(g => ({ ...g, [track]: g[track as keyof typeof g].map((v: number, j: number) => j === i ? (v ? 0 : 1) : v) }));

  const tracks = [
    { id: 'kick',   label: 'Kick 🥁',   color: '#fbbf24' },
    { id: 'snare',  label: 'Snare 🎭',  color: '#fb7185' },
    { id: 'hihat',  label: 'Hi-hat 🎵', color: '#00f0ff' },
    { id: 'melody', label: 'Melody 🎹', color: '#34d399' },
  ];

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button data-mcp-tool="togglePlay" data-mcp-type="control" data-mcp-state={isPlaying ? 'playing' : 'stopped'} onClick={togglePlay} style={{ minWidth: 80, minHeight: 44, padding: '10px 18px', borderRadius: 12, border: `1px solid ${isPlaying ? 'rgba(251,65,117,0.4)' : 'rgba(52,211,153,0.4)'}`, background: isPlaying ? 'rgba(251,65,117,0.1)' : 'rgba(52,211,153,0.1)', color: isPlaying ? '#fb7185' : '#34d399', fontWeight: 700, fontSize: 15 }}>{isPlaying ? '⏹ Stop' : '▶ Play'}</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--w-muted)' }}>BPM</span>
          <input type="range" min={60} max={200} value={bpm} onChange={e => { setBpm(+e.target.value); Tone.Transport.bpm.value = +e.target.value; }} style={{ width: 90, accentColor: '#34d399' }} />
          <span style={{ fontFamily: 'var(--w-mono)', fontSize: 12, color: 'var(--w-text)', minWidth: 28 }}>{bpm}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tracks.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 78, fontSize: 11, color: t.color, fontWeight: 600, flexShrink: 0 }}>{t.label}</div>
            <div style={{ display: 'flex', gap: 5, flex: 1 }}>
              {(grid[t.id as keyof typeof grid] as number[]).map((active, i) => {
                const isCurrent = step === i && isPlaying;
                return (
                  <button key={i} onClick={() => toggle(t.id, i)} style={{ flex: 1, minWidth: 32, height: 38, borderRadius: 8, border: `1px solid ${active ? t.color : 'rgba(255,255,255,0.07)'}`, background: active ? `${t.color}20` : 'rgba(255,255,255,0.02)', transition: 'all 0.06s', boxShadow: isCurrent ? `0 0 14px ${t.color}70` : 'none', transform: isCurrent ? 'scale(1.08)' : 'scale(1)' }} />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginTop: 4 }}>
        {Object.keys(grid).map(t => (
          <button key={t} onClick={() => setGrid(g => ({ ...g, [t]: Array(8).fill(0) }))} style={{ padding: '6px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'var(--w-muted)', fontSize: 10 }}>Clear {t}</button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// PORTAL — Breathing
// ══════════════════════════════════════════════════════
function PortalScreen() {
  const { earnLove } = useW();
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState('in');
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!active) return;
    const PHASES: any[] = [
      { name: 'in',   duration: 4, next: 'hold' },
      { name: 'hold', duration: 4, next: 'out' },
      { name: 'out',  duration: 6, next: 'in' },
    ];
    const current = PHASES.find(p => p.name === phase) || PHASES[0];
    setCount(current.duration);
    const interval = setInterval(() => setCount((c: number) => {
      if (c <= 1) {
        if (phase === 'out') {
          setCycles((n: number) => {
            if (n + 1 >= 3) { earnLove(15); setActive(false); return 0; }
            return n + 1;
          });
        }
        setPhase(current.next);
        return current.duration;
      }
      return c - 1;
    }), 1000);
    return () => clearInterval(interval);
  }, [active, phase, earnLove]);

  const phaseColors: Record<string, string> = { in: '#34d399', hold: '#fbbf24', out: '#60a5fa' };
  const c = phaseColors[phase];
  const phaseLabel: Record<string, string> = { in: 'Breathe in 🌬️', hold: 'Hold 🌿', out: 'Let go 💨' };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 28 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {active && <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', border: `2px solid ${c}30`, animation: 'ripple 2s ease-out infinite', pointerEvents: 'none' }} />}
        <div style={{ width: 140, height: 140, borderRadius: '50%', border: `2px solid ${active ? c : 'rgba(52,211,153,0.25)'}`, background: `radial-gradient(circle, ${active ? c : '#34d399'}18, ${active ? c : '#34d399'}04)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.5s', transform: active && phase === 'in' ? 'scale(1.15)' : active && phase === 'hold' ? 'scale(1.15)' : 'scale(0.85)', boxShadow: active ? `0 0 40px ${c}25` : 'none' }}>
          <span style={{ fontSize: 32 }}>🌿</span>
          <span style={{ fontFamily: 'var(--w-mono)', fontSize: 24, fontWeight: 700, color: active ? c : 'rgba(52,211,153,0.5)', lineHeight: 1, marginTop: 4 }}>{count}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: active ? c : 'rgba(240,242,245,0.5)', transition: 'color 0.4s' }}>{active ? phaseLabel[phase] : 'Ready when you are'}</div>
        {active && <div style={{ fontFamily: 'var(--w-mono)', fontSize: 10, color: 'var(--w-muted)', marginTop: 6 }}>Cycle {cycles + 1} of 3</div>}
        {cycles > 0 && !active && <div style={{ fontSize: 14, color: '#34d399', marginTop: 8 }}>🌟 Breathing complete! +15 ❤️</div>}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button data-mcp-tool="toggleBreathing" data-mcp-type="control" data-mcp-state={active ? 'active' : 'inactive'} onClick={() => { setActive(v => !v); setPhase('in'); setCount(4); setCycles(0); }} style={{ minWidth: 120, minHeight: 48, padding: '12px 24px', borderRadius: 14, border: `1px solid ${active ? 'rgba(251,65,117,0.4)' : 'rgba(52,211,153,0.4)'}`, background: active ? 'rgba(251,65,117,0.1)' : 'rgba(52,211,153,0.1)', color: active ? '#fb7185' : '#34d399', fontWeight: 700, fontSize: 15 }}>{active ? '⏹ Pause' : '▶ Begin'}</button>
      </div>
      <div style={{ fontFamily: 'var(--w-mono)', fontSize: 10, color: 'var(--w-muted)', textAlign: 'center', lineHeight: 1.7 }}>Pattern: 4 in · 4 hold · 6 out<br />Complete 3 cycles to earn +15 ❤️</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// QUESTS + SKILL TREE
// ══════════════════════════════════════════════════════
function QuestsScreen() {
  const { quests, completeQuest, xp } = useW();
  const [tab, setTab] = useState('quests');
  const done = quests.filter((q: any) => q.done).length;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(52,211,153,0.1)' }}>
        {[['quests', '⚔️ Quests'], ['skills', '🌟 Skills']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 14px', border: 'none', borderBottom: `2px solid ${tab === id ? '#34d399' : 'transparent'}`, background: 'transparent', color: tab === id ? '#34d399' : 'rgba(240,242,245,0.4)', fontSize: 12, fontWeight: tab === id ? 600 : 400 }}>{label}</button>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--w-mono)', fontSize: 10, color: 'var(--w-muted)', padding: '10px 0' }}>{done}/{quests.length} done</div>
      </div>
      {tab === 'quests' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quests.map((q: any) => (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${q.done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)'}`, background: q.done ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)', opacity: q.done ? 0.7 : 1 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{q.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, textDecoration: q.done ? 'line-through' : 'none', color: q.done ? 'var(--w-muted)' : 'var(--w-text)' }}>{q.title}</div>
                <div style={{ fontSize: 10, color: 'var(--w-muted)', marginTop: 2 }}>{q.desc}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: '#a78bfa' }}>+{q.xp} XP</span>
                  <span style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: '#fbbf24' }}>+{q.love} ❤️</span>
                </div>
              </div>
              {q.done ? <span style={{ fontSize: 20 }}>✅</span> : <button data-mcp-tool="completeQuest" data-mcp-type="action" data-mcp-target={`quest-${q.id}`} onClick={() => completeQuest(q.id)} style={{ minWidth: 60, minHeight: 36, padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 11, fontWeight: 600 }}>Claim</button>}
            </div>
          ))}
        </div>
      )}
      {tab === 'skills' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SKILLS.map(s => {
            const progress = Math.min(1, xp / (s.xpNeeded * s.level));
            return (
              <div key={s.id} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{s.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--w-mono)', fontSize: 11, color: s.color, fontWeight: 700 }}>Lv.{s.level}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress * 100}%`, background: s.color, borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: 'var(--w-muted)', marginTop: 4 }}>
                  {Math.floor(progress * s.xpNeeded * s.level)} / {s.xpNeeded * s.level} XP to Lv.{s.level + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// COMPANION CHAT
// ══════════════════════════════════════════════════════
function CompanionScreen() {
  const { messages, addMessage, mood, age } = useW();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const send = () => { const text = input.trim(); if (!text) return; addMessage(text, 'user'); setInput(''); };
  const curMood = MOODS.find((m: any) => m.id === mood);

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 18 }}>🌿</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Willow</div>
          <div style={{ fontSize: 10, color: 'var(--w-muted)' }}>Sensing: {curMood?.emoji} {curMood?.label} · {age <= 9 ? 'Child mode 🌱' : 'Youth mode 🌿'}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 2 }}>
        {messages.map((msg: any) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: msg.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: msg.from === 'user' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.from === 'user' ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: msg.from === 'user' ? '#34d399' : 'var(--w-text)' }}>{msg.text}</div>
              <div style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: 'var(--w-muted)', marginTop: 4 }}>{msg.ts}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0 }}>
        {(age <= 9
          ? ["I'm happy 😊", "I'm sad 😢", "I'm tired 😴", "Tell me a joke!"]
          : ["Tell me something cool", "I need to vent", "I'm stressed", "What should I do?"]
        ).map(r => <button key={r} onClick={() => setInput(r)} style={{ padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.05)', color: 'rgba(52,211,153,0.8)', fontSize: 11 }}>{r}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={age <= 9 ? "Type to Willow... 💚" : "What's on your mind? 💚"} rows={2} style={{ flex: 1, padding: '10px 12px', resize: 'none', fontSize: 13, lineHeight: 1.5, borderRadius: 12 }} />
        <button data-mcp-tool="sendMessage" data-mcp-type="action" data-mcp-target="chat-input" onClick={send} disabled={!input.trim()} style={{ minWidth: 48, minHeight: 48, borderRadius: 12, border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: 20, opacity: input.trim() ? 1 : 0.4, transition: 'opacity 0.15s', alignSelf: 'flex-end' }}>💬</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════
function ScreenContent() {
  const { screen } = useW();
  const screens: Record<string, () => JSX.Element> = { home: HomeScreen, draw: DrawScreen, portal: PortalScreen, quests: QuestsScreen, companion: CompanionScreen };
  const Cmp = screens[screen] || HomeScreen;
  return <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', position: 'relative', zIndex: 1 }}><Cmp key={screen} /></div>;
}

export default function WillowApp() {
  return (
    <WillowProvider>
      <style>{STYLES}</style>
      <Starfield />
      <CrisisOverlay />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative', zIndex: 1 }}>
        <Header />
        <ScreenContent />
        <BottomNav />
      </div>
    </WillowProvider>
  );
}
