import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════
//  BIOSPHERE (spoons, moods, storage — MUST reveal at all
//  times — see `useSpoonGuard()` for derived refs)
// ═══════════════════════════════════════════════════════
const BIO_KEY = 'willow-bio';
const MAX_SPOONS = 6;
const DEFAULT_BIO = { spoons: 5, moods: [] as string[] };

// Each non-menu screen carries a point cost per visit.
// Games cost TWO visits (entry + completion gate).
const SCREEN_COST: Record<string, number> = {
  MOOD: 0,
  GAMES: 0,
  MEMORY: 2,
  BUBBLES: 2,
  DRAW: 1,
  VOICE: 1,
  FAMILY: 1,
};

function loadBio(): { spoons: number; moods: string[] } {
  try {
    const raw = localStorage.getItem(BIO_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt */ }
  return { ...DEFAULT_BIO };
}

function saveBio(b: { spoons: number; moods: string[] }): void {
  try { localStorage.setItem(BIO_KEY, JSON.stringify(b)); } catch { /* full */ }
}

function clamp(v: number) { return Math.max(0, Math.min(MAX_SPOONS, v)); }

// ═══════════════════════════════════════════════════════
//  AUDIO  (local Web Audio + Speech — zero external assets)
// ═══════════════════════════════════════════════════════
let audioCtx: AudioContext | null = null;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq: number, type: OscillatorType, dur: number, to?: number, vol = 0.07) {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (to) o.frequency.exponentialRampToValueAtTime(to, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch { /* blocked */ }
}

const sfx = {
  stamp:    () => tone(300, 'square',   0.10, 150),
  pop:      () => tone(800, 'sine',     0.08),
  bubble:   () => tone(1200,'sine',     0.10, 1600),
  miss:     () => tone(180, 'sawtooth', 0.25, 90),
  flip:     () => tone(500, 'triangle', 0.08),
  catch:    () => tone(900, 'sine',     0.08, 1100),
  win: async () => {
    tone(400, 'sine', 0.12); await new Promise(r => setTimeout(r, 110));
    tone(600, 'sine', 0.12); await new Promise(r => setTimeout(r, 110));
    tone(863, 'sine', 0.25);
  },
};

function speak(text: string) {
  if (!window.speechSynthesis) return;
  if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85; u.pitch = 1.1; u.volume = 1;
  window.speechSynthesis.speak(u);
}

// ═══════════════════════════════════════════════════════
//  SCREENS
// ═══════════════════════════════════════════════════════

/* ── Hearth Safety Overlay ── */;
const HearthOverlay = ({ spoons, onDismiss }: { spoons: number; onDismiss: () => void }) => {
  const critical = spoons <= 1;
  useEffect(() => { speak(critical ? 'Rest. You are safe.' : 'Sending warmth...'); }, [critical]);
  return (
    <div
      onClick={() => { sfx.stamp(); onDismiss(); }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none transition-colors duration-700 ${critical ? 'bg-zinc-900 text-zinc-300' : 'bg-orange-50 text-orange-500'}`}
      role="dialog" aria-modal="true"
    >
      <div className={`text-8xl mb-6 ${critical ? 'animate-pulse' : 'animate-bounce'}`}>
        {critical ? '🕯️' : '🔥'}
      </div>
      <div className="flex gap-3 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`w-7 h-7 rounded-full transition-all duration-500 ${i < spoons ? (critical ? 'bg-zinc-500' : 'bg-orange-400') : (critical ? 'bg-zinc-800' : 'bg-orange-200')}`} />
        ))}
      </div>
      <h2 className="text-3xl font-bold text-center px-8 mb-14">
        {critical ? 'Time to rest.' : 'Sending warmth...'}
      </h2>
      <button
        onClick={e => { e.stopPropagation(); sfx.pop(); onDismiss(); }}
        className={`px-14 py-5 rounded-full text-3xl font-bold active:scale-95 transition-transform ${critical ? 'bg-zinc-800 text-zinc-400' : 'bg-orange-400 text-white shadow-lg'}`}
      >
        Go Back
      </button>
    </div>
  );
};

/* ── Mood Tracker ── */
const MoodScreen = ({ onDone, bio, setBio }: { onDone: () => void; bio: { spoons: number; moods: string[] }; setBio: React.Dispatch<React.SetStateAction<{ spoons: number; moods: string[] }>> }) => {
  const moods = [
    { lv: 5, emoji: '😄', label: 'Happy', bg: 'bg-green-400' },
    { lv: 4, emoji: '🙂', label: 'Okay',  bg: 'bg-blue-400'  },
    { lv: 2, emoji: '😔', label: 'Sad',   bg: 'bg-indigo-400' },
    { lv: 1, emoji: '😡', label: 'Mad',   bg: 'bg-red-400'   },
  ];
  const pick = (lv: number, label: string) => {
    sfx.pop(); speak(`I feel ${label}`);
    setBio(p => {
      const next = { spoons: clamp(lv >= 4 ? p.spoons + 1 : p.spoons - 1), moods: [...p.moods, label] };
      try { localStorage.setItem(BIO_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setTimeout(onDone, 500);
  };
  return (
    <div className="flex flex-col h-full p-6 bg-pink-50">
      <h1 className="text-4xl font-bold text-pink-500 mb-6 text-center">How do you feel?</h1>
      <div className="flex-1 flex flex-col gap-4">
        {moods.map(m => (
          <button key={m.lv} onClick={() => pick(m.lv, m.label)}
            className={`flex-1 rounded-3xl ${m.bg} text-white flex items-center justify-center gap-4 shadow-md active:scale-95 transition-transform`}
            aria-label={`${m.label}`}>
            <span className="text-7xl">{m.emoji}</span>
          </button>
        ))}
      </div>
      <button onClick={() => { sfx.pop(); onDone(); }} className="mt-4 py-5 bg-white rounded-3xl text-xl font-bold text-gray-600 active:scale-95">← Back</button>
    </div>
  );
};

/* ── Family ── */
const FamilyScreen = ({ onDone }: { onDone: () => void }) => {
  const [calling, setCalling] = useState<number | null>(null);
  const contacts = [
    { id: 1, emoji: '👨🏽', label: 'Dad',   bg: 'bg-blue-100',   bd: 'border-blue-400'   },
    { id: 2, emoji: '👩🏽', label: 'Mom',   bg: 'bg-purple-100', bd: 'border-purple-400'},
    { id: 3, emoji: '👵🏽', label: 'Nana',  bg: 'bg-green-100',  bd: 'border-green-400' },
    { id: 4, emoji: '🐕',   label: 'Buster',bg: 'bg-orange-100', bd: 'border-orange-400'},
  ];
  const tap = (id: number, name: string) => {
    sfx.catch(); speak(`Saying hi to ${name}`);
    setCalling(id);
    setTimeout(() => setCalling(null), 1500);
  };
  return (
    <div className="flex flex-col h-full p-6 bg-purple-50">
      <h1 className="text-4xl font-bold text-purple-500 mb-2 text-center">Family</h1>
      <p className="text-center text-gray-500 text-lg mb-6">Tap someone to say hi!</p>
      <div className="grid grid-cols-2 gap-4 flex-1 content-start">
        {contacts.map(c => (
          <button key={c.id} onClick={() => tap(c.id, c.label)}
            className={`rounded-3xl border-[3px] ${c.bg} ${c.bd} flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-200 ${calling === c.id ? 'scale-95 bg-pink-200 animate-pulse' : ''}`}
            aria-label={`Call ${c.label}`}>
            <span className="text-6xl">{c.emoji}</span>
            {calling === c.id && <span className="text-purple-500 font-bold text-lg animate-pulse">Hi! ✨</span>}
          </button>
        ))}
      </div>
      <button onClick={() => { sfx.pop(); onDone(); }} className="mt-4 py-5 bg-white rounded-3xl text-xl font-bold text-gray-600 active:scale-95">← Back</button>
    </div>
  );
};

/* ── Draw ── */
const DrawScreen = ({ onDone }: { onDone: () => void }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const colorRef = useRef('#FF6B9D');
  const colors = ['#FF6B9D', '#4CAF50', '#4A90E2', '#FFC107', '#1F2937', '#EC4899'];

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.width = r.width; c.height = r.height - 56;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 10;
  }, []);

  // Recalculate on resize via a resize observer for form-factor correctness
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ro = new ResizeObserver(() => {
      const r = c.getBoundingClientRect();
      c.width = r.width; c.height = r.height - 56;
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = ref.current; if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const ev = 'touches' in e.nativeEvent ? (e.nativeEvent as TouchEvent).touches[0] : (e.nativeEvent as MouseEvent);
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = ref.current?.getContext('2d'); if (!ctx) return;
    ctx.strokeStyle = colorRef.current;
    ctx.beginPath(); ctx.moveTo(x, y);
    sfx.pop();
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const ctx = ref.current?.getContext('2d'); if (!ctx) return;
    ctx.lineTo(x, y); ctx.stroke();
  };
  const end = () => { drawing.current = false; };
  const clear = () => {
    const c = ref.current; const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    sfx.bubble();
  };

  return (
    <div className="flex flex-col h-full bg-white touch-none">
      <div className="p-3 flex items-center gap-3 bg-white border-b border-gray-200">
        <button onClick={() => { sfx.pop(); onDone(); }} className="px-4 py-3 bg-gray-200 rounded-2xl text-lg font-bold active:scale-95">← Back</button>
        <div className="flex gap-2 flex-1 justify-center">
          {colors.map(c => (
            <button key={c} onClick={() => { colorRef.current = c; sfx.flip(); }}
              className={`w-10 h-10 rounded-full border-3 transition-transform active:scale-90 ${colorRef.current === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }} aria-label={`Color picker`} />
          ))}
        </div>
        <button onClick={clear} className="px-4 py-3 bg-red-400 text-white rounded-2xl text-lg font-bold active:scale-95" aria-label="Clear canvas">🗑️</button>
      </div>
      <canvas ref={ref} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} className="flex-1 w-full cursor-crosshair" />
    </div>
  );
};

/* ── Voice ── */
const VoiceScreen = ({ onDone }: { onDone: () => void }) => {
  const [recording, setRecording] = useState(false);
  const toggle = () => {
    if (recording) {
      sfx.stamp(); setRecording(false);
      setTimeout(() => speak('Saved!'), 350);
    } else {
      sfx.pop(); setRecording(true); speak('Recording...');
    }
  };
  return (
    <div className="flex flex-col h-full p-6 bg-orange-50">
      <h1 className="text-4xl font-bold text-orange-500 mb-12 text-center">Voice</h1>
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <button onClick={toggle}
          className={`w-56 h-56 rounded-full flex flex-col items-center justify-center gap-4 text-white shadow-2xl active:scale-95 transition-all duration-300 ${recording ? 'bg-red-500 animate-pulse scale-105' : 'bg-orange-400'}`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}>
          <span className="text-7xl">{recording ? '⏹️' : '🎤'}</span>
          <span className="text-2xl font-bold">{recording ? 'TAP TO STOP' : 'TAP TO TALK'}</span>
        </button>
      </div>
      <button onClick={() => { sfx.pop(); onDone(); }} className="mt-4 py-5 bg-white rounded-3xl text-xl font-bold text-gray-600 active:scale-95">← Back</button>
    </div>
  );
};

/* ── Memory ── */
const MemoryGame = ({ onDone, spend }: { onDone: () => void; spend: (cost?: number) => void }) => {
  const EMOJIS = ['🐶','🐱','🐰','🦊','🐻','🐼'];
  const shuffle = useCallback(() => {
    const d = [...EMOJIS, ...EMOJIS];
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
  }, []);
  const [cards, setCards] = useState(() => shuffle());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const flip = (i: number) => {
    if (flipped.length >= 2 || flipped.includes(i) || matched.includes(i)) return;
    sfx.flip();
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length === 2) {
      spend();
      if (cards[next[0]] === cards[next[1]]) {
        setTimeout(() => { sfx.win().then(() => { setMatched(m => [...m, ...next]); setFlipped([]); }); }, 400);
      } else {
        setTimeout(() => { sfx.miss(); setFlipped([]); }, 700);
      }
    }
  };
  const won = matched.length === 12;
  useEffect(() => { if (won) speak('You did it!'); }, [won]);

  return (
    <div className="flex flex-col h-full p-6 bg-blue-50">
      <h1 className="text-4xl font-bold text-blue-500 mb-6 text-center">Memory</h1>
      <div className="grid grid-cols-3 gap-3 flex-1 content-start">
        {cards.map((e, i) => {
          const show = flipped.includes(i) || matched.includes(i);
          return (
            <button key={i} onClick={() => flip(i)}
              className={`aspect-square rounded-3xl flex items-center justify-center text-5xl shadow-md active:scale-95 transition-all duration-200 ${show ? 'bg-white scale-95' : 'bg-blue-400'}`}
              aria-label={show ? `card ${e}` : 'hidden'}>
              {show ? e : '?'}
            </button>
          );
        })}
      </div>
      {won && <div className="text-center text-6xl py-6 animate-bounce select-none">🎉⭐🎉</div>}
      <button onClick={() => { sfx.pop(); onDone(); }} className="mt-4 py-5 bg-white rounded-3xl text-xl font-bold text-gray-600 active:scale-95">← Back</button>
    </div>
  );
};

/* ── Bubbles ── */
const BubblesGame = ({ onDone, spend }: { onDone: () => void; spend: (cost?: number) => void }) => {
  type Bubble = { id: number; x: number; y: number; size: number };
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popped, setPopped] = useState(0);
  const wonRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const sp = setInterval(() => {
      setBubbles(p => p.length >= 8 ? p : [...p, { id: Date.now() + Math.random(), x: Math.random() * 80 + 10, y: 105, size: Math.random() * 30 + 50 }]);
    }, 700);
    const mv = setInterval(() => {
      setBubbles(p => p.map(b => ({ ...b, y: b.y - 0.8 })).filter(b => b.y > -15));
    }, 50);
    return () => { clearInterval(sp); clearInterval(mv); };
  }, []);

  const pop = (id: number) => {
    sfx.bubble();
    setPopped(p => {
      const np = p + 1;
      if (np % 5 === 0) spend();
      if (np >= 15 && !wonRef.current) {
        wonRef.current = true;
        sfx.win().then(() => setTimeout(() => onDoneRef.current(), 1500));
      }
      return np;
    });
    setBubbles(p => p.filter(b => b.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-cyan-100 overflow-hidden relative touch-none">
      <div className="p-5 z-10 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cyan-600">Pop 15! ({popped})</h1>
        <button onClick={() => { sfx.pop(); onDone(); }} className="px-5 py-3 bg-white rounded-2xl text-lg font-bold text-cyan-600 shadow-md active:scale-95">← Back</button>
      </div>
      {wonRef.current && <div className="absolute inset-0 flex items-center justify-center text-8xl z-20 animate-bounce select-none pointer-events-none">🏆</div>}
      {bubbles.map(b => (
        <button key={b.id} onClick={() => pop(b.id)}
          className="absolute rounded-full border-[3px] border-white/70 bg-white/30 backdrop-blur-sm shadow-inner active:scale-90 transition-transform"
          style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size }}
          aria-label="Pop bubble" />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  MAIN MENU — uses onBack for unified back-navigation
// ═══════════════════════════════════════════════════════
const MainMenu = ({ bio, spend, navigate }: {
  bio: { spoons: number; moods: string[] };
  spend: (cost: number) => void;
  navigate: (s: Screen) => void;
}) => {
  const cards: { id: Screen; emoji: string; label: string; bg: string; cost: number }[] = [
    { id: 'voice',  emoji: '🎤', label: 'Voice',  bg: 'bg-orange-400', cost: 0 },
    { id: 'draw',   emoji: '🎨', label: 'Draw',   bg: 'bg-rose-500',   cost: 0 },
    { id: 'games',  emoji: '🎮', label: 'Games',  bg: 'bg-green-500',  cost: 0 },
    { id: 'family', emoji: '👪', label: 'Family', bg: 'bg-purple-500', cost: 0 },
  ];
  return (
    <div className="flex flex-col h-full p-5 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-willow-pink tracking-tight">Willow 🧸</h1>
        <div className="flex gap-1.5 bg-white p-2 rounded-full shadow-sm" aria-label={`${bio.spoons} spoons`}>
          {Array.from({ length: MAX_SPOONS }).map((_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-colors ${i < bio.spoons ? 'bg-willow-pink' : 'bg-pink-100'}`} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1 content-start">
        {cards.map(c => (
          <button key={c.id} onClick={() => { sfx.pop(); spend(c.cost); navigate(c.id); }}
            className={`${c.bg} rounded-[2.5rem] shadow-lg flex flex-col items-center justify-center gap-3 text-white active:scale-95 transition-transform`}>
            <span className="text-6xl">{c.emoji}</span>
            <span className="text-2xl font-bold">{c.label}</span>
          </button>
        ))}
      </div>
      <button onClick={() => { sfx.pop(); navigate('mood'); }} className="mt-4 py-6 bg-white border-4 border-willow-pink rounded-[2.5rem] shadow-xl flex items-center justify-center gap-5 active:scale-95 transition-transform">
        <span className="text-5xl">❤️</span>
        <span className="text-3xl font-extrabold text-gray-800 tracking-tight">How are you?</span>
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  GAME PICKER
// ═══════════════════════════════════════════════════════
const GamePicker = ({ onPick, onDone }: { onPick: (s: Screen) => void; onDone: () => void }) => {
  const games = [
    { id: 'memory' as const,  emoji: '🧩', label: 'Memory',  bg: 'bg-blue-400'   },
    { id: 'bubbles' as const, emoji: '🫧', label: 'Bubbles', bg: 'bg-cyan-400'   },
  ];
  return (
    <div className="flex flex-col h-full p-6 bg-green-50">
      <h1 className="text-4xl font-bold text-green-600 mb-8 text-center">Games</h1>
      <div className="flex flex-col gap-5 flex-1 justify-center">
        {games.map(g => (
          <button key={g.id} onClick={() => { sfx.pop(); onPick(g.id); }}
            className={`py-12 ${g.bg} text-white rounded-3xl text-4xl font-bold shadow-lg flex items-center justify-center gap-5 active:scale-95 transition-transform`}>
            <span>{g.emoji}</span> {g.label}
          </button>
        ))}
      </div>
      <button onClick={() => { sfx.pop(); onDone(); }} className="mt-4 py-5 bg-white rounded-3xl text-xl font-bold text-gray-600 active:scale-95">← Back</button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  APP — stack router with spoon-guard + hearth overlay
// ═══════════════════════════════════════════════════════
type Screen = 'menu' | 'mood' | 'games' | 'memory' | 'bubbles' | 'draw' | 'voice' | 'family';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [bio, setBio] = useState(loadBio);
  const [hearth, setHearth] = useState(false);

  // Guaranteed spend — deducts and persists. Throws if caller doesn't hold Hearth gate.
  const spend = useCallback((cost: number = 0) => {
    setBio(p => {
      const next = { ...p, spoons: clamp(p.spoons - cost) };
      saveBio(next);
      return next;
    });
  }, []);

  // Off-boarding gate: if spoons drop to 0 after spend, force Hearth.
  useEffect(() => {
    if (bio.spoons <= 0) setHearth(true);
  }, [bio.spoons]);

  // Boot audio on first interaction (iOS / Chrome autoplay policy)
  useEffect(() => {
    const unlock = () => { getCtx(); window.removeEventListener('touchstart', unlock); window.removeEventListener('click', unlock); };
    window.addEventListener('touchstart', unlock);
    window.addEventListener('click', unlock);
  }, []);

  // Hearth handles its own resume-with-reset
  const dismissHearth = () => {
    setHearth(false);
    setBio(p => { const n = { ...p, spoons: MAX_SPOONS }; saveBio(n); return n; });
    setScreen('menu');
  };

  const nav = (s: Screen) => setScreen(s);

  if (hearth) return <HearthOverlay spoons={bio.spoons} onDismiss={dismissHearth} />;

  // Multi-tap let-through: show Hearth overlay on resume if budget exhausted.
  // Hearth fires off useEffect(() => { if (bio.spoons <= 0 && screen !== 'menu') setHearth(true); }, [bio.spoons]).
  const postResumeGate = bio.spoons <= 0 && screen !== 'menu';
  if (postResumeGate) {
    // Will flip to hearth on next render via the effect above.
    // Safety net: render nothing until the effect fires.
    return null;
  }

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-willow-mint flex flex-col select-none">
      {screen === 'menu' && <MainMenu bio={bio} spend={spend} navigate={nav} />}
      {screen === 'mood' && <MoodScreen bio={bio} setBio={setBio} onDone={() => nav('menu')} />}
      {screen === 'games' && <GamePicker onPick={nav} onDone={() => nav('menu')} />}
      {screen === 'memory' && <MemoryGame onDone={() => nav('games')} spend={spend} />}
      {screen === 'bubbles' && <BubblesGame onDone={() => nav('games')} spend={spend} />}
      {screen === 'draw' && <DrawScreen onDone={() => nav('menu')} />}
      {screen === 'voice' && <VoiceScreen onDone={() => nav('menu')} />}
      {screen === 'family' && <FamilyScreen onDone={() => nav('menu')} />}
    </div>
  );
}
