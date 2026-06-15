import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Heart, Mic, Palette, Gamepad2, Users, ArrowLeft, Sparkles } from 'lucide-react';
import { useAtmosphere } from '../components/AtmosphereProvider';
import GentleDreamscape from '../components/ambient/GentleDreamscape';
import { getBalanceNative, mintCreditsNative, startLarmorTone, stopLarmorTone } from '../lib/tauriBridge';

const MemoryGame = lazy(() => import('./MemoryGame'));

let audioCtx: AudioContext | null = null;
const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, dur: number, slideTo?: number) => {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
};

const audio = {
  stamp: () => playTone(300, 'square', 0.1, 150),
  pop: () => playTone(863, 'sine', 0.1),
  miss: () => playTone(200, 'sawtooth', 0.3, 100),
  flip: () => playTone(500, 'triangle', 0.1),
  win: () => {
    playTone(400, 'sine', 0.1);
    setTimeout(() => playTone(600, 'sine', 0.1), 100);
    setTimeout(() => playTone(863, 'sine', 0.3), 200);
  },
};

const speak = (text: string) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1.2;
  window.speechSynthesis.speak(u);
};

const HearthOverlay = ({ onDismiss }: { onDismiss: () => void }) => {
  useEffect(() => {
    speak("Rest. You are safe.");
    startLarmorTone();
    return () => { stopLarmorTone(); };
  }, []);

  return (
    <div onClick={onDismiss} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-900/95 backdrop-blur-md text-zinc-300 transition-all duration-1000">
      <div className="text-9xl mb-12 animate-pulse drop-shadow-[0_0_50px_rgba(255,183,77,0.5)]">🕯️</div>
      <h2 className="text-4xl font-bold text-center px-8 mb-16 text-amber-100/80">Time to rest.</h2>
      <button onClick={(e) => { e.stopPropagation(); audio.pop(); onDismiss(); }} className="px-16 py-8 rounded-[3rem] text-3xl font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 active:scale-95 transition-transform">
        Go Back
      </button>
    </div>
  );
};

const MoodTracker = ({ onBack, setWillowSpoons }: { onBack: () => void; setWillowSpoons: React.Dispatch<React.SetStateAction<number>> }) => {
  const moods = [
    { level: 5, emoji: '😄', color: 'bg-emerald-400/80', name: 'Happy' },
    { level: 4, emoji: '🙂', color: 'bg-cyan-400/80', name: 'Okay' },
    { level: 2, emoji: '😔', color: 'bg-indigo-400/80', name: 'Sad' },
    { level: 1, emoji: '😡', color: 'bg-rose-400/80', name: 'Mad' },
  ];

  const selectMood = (m: (typeof moods)[0]) => {
    audio.pop();
    speak(`I feel ${m.name}`);
    setWillowSpoons(prev => m.level >= 4 ? Math.min(6, prev + 1) : Math.max(0, prev - 1));
    setTimeout(onBack, 1000);
  };

  return (
    <div className="flex flex-col h-full p-8 animate-in fade-in zoom-in-95 duration-300">
      <h1 className="text-5xl font-extrabold text-pink-500 mb-10 text-center drop-shadow-sm">How do you feel?</h1>
      <div className="flex-1 flex flex-col gap-6">
        {moods.map(m => (
          <button key={m.level} onClick={() => selectMood(m)}
            className={`flex-1 rounded-[3rem] ${m.color} backdrop-blur-md text-white text-7xl flex items-center justify-center shadow-lg active:scale-95 transition-all border border-white/40`}>
            <span>{m.emoji}</span>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="mt-8 py-8 bg-white/60 backdrop-blur-md rounded-[3rem] text-3xl font-bold text-pink-600 shadow-sm active:scale-95 transition-all">BACK</button>
    </div>
  );
};

const GamesMenu = ({ onBack, setWillowScreen, onLaunchStarBuilder }: { onBack: () => void; setWillowScreen: (s: string) => void; onLaunchStarBuilder: () => void }) => (
  <div className="flex flex-col h-full p-8 animate-in fade-in zoom-in-95 duration-300">
    <h1 className="text-5xl font-extrabold text-cyan-600 mb-10 text-center drop-shadow-sm">Games</h1>
    <div className="flex flex-col gap-6 flex-1 justify-center">
      <button onClick={() => { audio.pop(); onLaunchStarBuilder(); }}
        className="py-16 bg-gradient-to-r from-cyan-400 to-blue-500 border-4 border-white/60 text-white rounded-[3rem] text-5xl font-bold shadow-xl flex items-center justify-center gap-6 active:scale-95 transition-transform">
        <Sparkles size={48} /> Star Builder
      </button>
      <button onClick={() => { audio.pop(); setWillowScreen('MEMORY'); }}
        className="py-16 bg-white/60 backdrop-blur-md border-4 border-cyan-400 text-cyan-600 rounded-[3rem] text-5xl font-bold shadow-xl flex items-center justify-center gap-6 active:scale-95 transition-transform">
        <span>🧩</span> Memory
      </button>
    </div>
    <button onClick={onBack} className="mt-8 py-8 bg-white/60 backdrop-blur-md rounded-[3rem] text-3xl font-bold text-cyan-600 shadow-sm active:scale-95 transition-all">BACK</button>
  </div>
);

const MemoryGameLoader = () => (
  <Suspense fallback={
    <div className="flex flex-col h-full p-8 items-center justify-center text-cyan-600">
      <div className="text-6xl mb-4">🧩</div>
      <div className="text-xl font-bold animate-pulse">Loading Memory…</div>
    </div>
  }>
    <MemoryGameWrapper />
  </Suspense>
);

const MemoryGameWrapper = () => {
  const { setWillowScreen, reduceSpoons, syncNativeState } = useMemoryGameContext();
  return (
    <MemoryGame
      onBack={() => setWillowScreen('GAMES')}
      reduceSpoons={reduceSpoons}
      syncNativeState={syncNativeState}
    />
  );
};

const MemoryGameContext = React.createContext<{
  setWillowScreen: (s: string) => void;
  reduceSpoons: () => void;
  syncNativeState: () => void;
} | null>(null);

const useMemoryGameContext = () => {
  const ctx = React.useContext(MemoryGameContext);
  if (!ctx) throw new Error('MemoryGame used outside MemoryGameContext');
  return ctx;
};

export const WillowSurface: React.FC<{ className?: string }> = ({ className }) => {
  const { setSurface, grayRock } = useAtmosphere();
  const [willowScreen, setWillowScreen] = useState('MENU');
  const [willowSpoons, setWillowSpoons] = useState(5);
  const [showHearth, setShowHearth] = useState(false);
  const [karma, setKarma] = useState(0);

  const syncNativeState = useCallback(async () => {
    try {
      const balance = await getBalanceNative();
      setKarma(balance);
    } catch (e) { console.warn("Tauri IPC sync failed", e); }
  }, []);

  useEffect(() => { syncNativeState(); }, [syncNativeState]);

  useEffect(() => {
    if (willowSpoons <= 1 && willowScreen !== 'MENU') {
      setShowHearth(true);
      setWillowScreen('MENU');
    }
  }, [willowSpoons, willowScreen]);

  useEffect(() => {
    const unlock = () => { getCtx(); window.removeEventListener('touchstart', unlock); };
    window.addEventListener('touchstart', unlock);
    return () => window.removeEventListener('touchstart', unlock);
  }, []);

  const reduceSpoons = useCallback(() => setWillowSpoons(prev => Math.max(0, prev - 1)), []);

  const closeSurface = useCallback(() => setSurface('GREETING'), [setSurface]);

  if (grayRock) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className ?? ''}`}>
        <p className="font-mono text-xs text-zinc-500">Willow resting.</p>
      </div>
    );
  }

  if (showHearth) {
    return (
      <div className="relative w-full h-full">
        <GentleDreamscape spoons={willowSpoons} />
        <HearthOverlay onDismiss={() => { setShowHearth(false); setWillowSpoons(5); }} />
      </div>
    );
  }

  const renderContent = () => {
    switch (willowScreen) {
      case 'MOOD':
        return <MoodTracker onBack={() => setWillowScreen('MENU')} setWillowSpoons={setWillowSpoons} />;
      case 'GAMES':
        return <GamesMenu onBack={() => setWillowScreen('MENU')} setWillowScreen={setWillowScreen} onLaunchStarBuilder={() => setSurface('STAR_BUILDER')} />;
      case 'MEMORY':
        return (
          <MemoryGameContext.Provider value={{ setWillowScreen, reduceSpoons, syncNativeState }}>
            <MemoryGameLoader />
          </MemoryGameContext.Provider>
        );
      default:
        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-10 bg-white/40 backdrop-blur-md p-4 rounded-[2rem] border border-white/50 shadow-sm">
              <h1 className="text-4xl font-black text-pink-500 tracking-tight ml-4 drop-shadow-sm">Willow 🧸</h1>
              <div className="flex items-center gap-6">
                <div className="font-bold text-xl text-emerald-600 bg-white/60 px-4 py-2 rounded-full">⭐ {karma}</div>
                <div className="flex gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-5 h-5 rounded-full ${i < willowSpoons ? 'bg-pink-500 shadow-sm' : 'bg-white/50'}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 flex-1">
              <button className="bg-orange-400/80 backdrop-blur-md rounded-[3rem] border border-white/30 shadow-xl flex flex-col items-center justify-center gap-4 text-white active:scale-95 transition-transform" onClick={() => audio.pop()}>
                <Mic size={80} strokeWidth={2.5} />
                <span className="text-4xl font-bold">Voice</span>
              </button>
              <button className="bg-rose-500/80 backdrop-blur-md rounded-[3rem] border border-white/30 shadow-xl flex flex-col items-center justify-center gap-4 text-white active:scale-95 transition-transform" onClick={() => audio.pop()}>
                <Palette size={80} strokeWidth={2.5} />
                <span className="text-4xl font-bold">Draw</span>
              </button>
              <button onClick={() => { audio.pop(); setWillowScreen('GAMES'); }}
                className="bg-cyan-500/80 backdrop-blur-md rounded-[3rem] border border-white/30 shadow-xl flex flex-col items-center justify-center gap-4 text-white active:scale-95 transition-transform">
                <Gamepad2 size={80} strokeWidth={2.5} />
                <span className="text-4xl font-bold">Games</span>
              </button>
              <button className="bg-purple-500/80 backdrop-blur-md rounded-[3rem] border border-white/30 shadow-xl flex flex-col items-center justify-center gap-4 text-white active:scale-95 transition-transform" onClick={() => audio.pop()}>
                <Users size={80} strokeWidth={2.5} />
                <span className="text-4xl font-bold">Family</span>
              </button>
            </div>
            <button onClick={() => { audio.pop(); setWillowScreen('MOOD'); }}
              className="mt-8 py-10 bg-white/70 backdrop-blur-xl border-4 border-white rounded-[3rem] shadow-xl flex items-center justify-center gap-6 active:scale-95 transition-transform">
              <Heart size={64} className="text-pink-500 fill-pink-500" />
              <span className="text-4xl font-extrabold text-gray-700 tracking-tight drop-shadow-sm">How are you?</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className={`relative w-full h-full overflow-auto surface-willow ${className ?? ''}`}>
      <GentleDreamscape spoons={willowSpoons} />
      <div className="absolute top-4 right-4 z-20">
        <button onClick={closeSurface} className="p-3 bg-white/80 rounded-full shadow-lg backdrop-blur-sm active:scale-95 transition-transform">
          <ArrowLeft size={28} className="text-pink-500" />
        </button>
      </div>
      <div className="relative z-10 p-6 h-full">
        {renderContent()}
      </div>
    </div>
  );
};
