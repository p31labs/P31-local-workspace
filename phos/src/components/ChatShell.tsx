import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Terminal, Send, Cpu, ShieldAlert, Menu, Mic, X } from 'lucide-react';
import { useAtmosphere } from './AtmosphereProvider';
import { getBiologicalTheme } from '../lib/themeEngine';
import { routeIntent, parseRagQuery } from '../lib/IntentEngine';
import { getChaosVault, ingestToChaosVault } from '../lib/ChaosVault';
import { addLog } from '../lib/EventLogger';
import { EscapeHatch } from './EscapeHatch';
import { SurfaceContent } from './SurfaceContent';
import { SurfaceErrorBoundary } from './SurfaceErrorBoundary';
import TheGuardian from './TheGuardian';

// ── Types ──

interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
  timestamp: number;
  surface?: string;
}

// ── BreathingCloud Canvas ──

const CLOUD_COLORS: Record<number, string> = {
  0: '0, 0, 0',
  1: '254, 202, 87',
  2: '218, 112, 214',
  3: '0, 245, 255',
  4: '57, 255, 20',
  5: '57, 255, 20',
};

function BreathingCloud({ spoons }: { spoons: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let hidden = false;

    const onVisibility = () => {
      hidden = document.hidden;
      if (hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        rafRef.current = requestAnimationFrame(render);
      }
    };

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    onResize();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    const speed = [0, 0.005, 0.01, 0.02, 0.04, 0.06][spoons] || 0.005;
    const sizeMul = [0, 0.5, 0.6, 0.8, 1.0, 1.2][spoons] || 0.8;
    const rgb = CLOUD_COLORS[spoons] || '57, 255, 20';
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.3 * sizeMul;

    function render() {
      if (hidden) return;

      timeRef.current += speed;
      const breath = Math.sin(timeRef.current) * 0.5 + 0.5;
      const r = baseRadius + baseRadius * 0.2 * breath;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (spoons === 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const g = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, r * 2.5);
      const alpha = 0.08 + breath * 0.06;
      g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
      g.addColorStop(0.4, `rgba(${rgb}, ${alpha * 0.4})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (spoons >= 4) {
        const count = spoons === 5 ? 6 : 3;
        for (let i = 0; i < count; i++) {
          const angle = timeRef.current * (i + 1) * 0.4;
          const px = centerX + Math.cos(angle) * r * 0.7;
          const py = centerY + Math.sin(angle) * r * 0.7;
          const pg = ctx.createRadialGradient(px, py, 0, px, py, r * 0.4);
          pg.addColorStop(0, `rgba(${rgb}, 0.12)`);
          pg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(px, py, r * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [spoons]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ── ChatMessage Bubble ──

function MessageBubble({ msg, theme }: { msg: ChatMessage; theme: Record<string, string> }) {
  const isUser = msg.role === 'user';
  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`relative max-w-[88%] sm:max-w-[75%] px-4 py-3 border backdrop-blur-sm
        ${isUser
          ? 'bg-white/[0.06] border-white/[0.08] rounded-2xl rounded-tr-sm'
          : 'bg-black/50 border-white/[0.04] rounded-2xl rounded-tl-sm font-mono text-sm leading-relaxed'}
      `}>
        {!isUser && (
          <span className="inline-block mr-1.5 select-none text-emerald-500/70">{'>'}</span>
        )}
        {msg.content}
      </div>
      <span className="text-[10px] font-mono text-gray-600 mt-1 px-1">{timeStr}</span>
    </div>
  );
}

// ── Status Indicator ──

function StatusDot({ spoons }: { spoons: number }) {
  const colors = ['bg-gray-700', 'bg-amber-500', 'bg-orchid', 'bg-cyan', 'bg-phos-accent', 'bg-phos-accent'];
  const pulse = spoons > 0 ? 'animate-pulse' : '';
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[spoons] || 'bg-gray-600'} ${pulse}`} />;
}

// ── ChatShell ──

export default function ChatShell() {
  const { spoons, setSpoons, grayRock, currentSurface, setSurface } = useAtmosphere();
  const theme = getBiologicalTheme(spoons, grayRock);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [showSurface, setShowSurface] = useState(false);
  const [vaultReady, setVaultReady] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const surfaceNames: Record<string, string> = useMemo(() => ({
    GREETING: 'Greeting', IGNITION: 'Ignition', BONDING: 'Bonding', THE_BUFFER: 'Buffer',
    VAULT: 'Vault', GRID: 'Grid', NODE_ZERO: 'Node Zero', LEDGER: 'Ledger', LOVE: 'Love',
    HEARTH: 'Hearth', ARCADE: 'Arcade', ARCHIVE: 'Archive', COMPASS: 'Compass', SETTINGS: 'Settings',
  }), []);

  // Init vault
  useEffect(() => {
    getChaosVault().then((db) => {
      setVaultReady(!!db);
      addLog('ChatShell:vault', { ready: !!db });
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'h' || e.key === 'H') {
      if (!e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setHudOpen(prev => !prev);
      }
    }
    if (e.key === '0' && !(e.target instanceof HTMLInputElement)) {
      e.preventDefault();
      setSpoons(0);
    }
    if (e.key === 'Escape') {
      setHudOpen(false);
    }
  }, [setSpoons]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Surface navigation from outside
  useEffect(() => {
    if (currentSurface !== 'GREETING') {
      setShowSurface(true);
    }
  }, [currentSurface]);

  // Persist messages to vault
  const persistMessages = useCallback(async (msgs: ChatMessage[]) => {
    if (!vaultReady) return;
    try {
      const db = await getChaosVault();
      if (!db) return;
      const serialized = JSON.stringify(msgs.slice(-50));
      await db.query(
        `INSERT INTO unified_knowledge_graph (source_door, raw_text, embedding_json)
         VALUES ($1, $2, $3)`,
        ['CHAT', serialized, '[]'],
      );
    } catch {
      addLog('ChatShell:persist', { error: 'persist failed' });
    }
  }, [vaultReady]);

  const addMessage = useCallback((role: 'user' | 'system', content: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10),
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => {
      const next = [...prev, msg];
      persistMessages(next);
      return next;
    });
    return msg;
  }, [persistMessages]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || processing || spoons === 0) return;

    setInput('');
    addMessage('user', text);
    setProcessing(true);

    // Check for RAG query
    const ragQuery = parseRagQuery(text);
    if (ragQuery) {
      addMessage('system', 'Querying vault...');
      try {
        const db = await getChaosVault();
        if (db) {
          const res = await db.query(
            'SELECT source_door, raw_text, created_at FROM unified_knowledge_graph WHERE raw_text ILIKE $1 ORDER BY created_at DESC LIMIT 3',
            [`%${ragQuery}%`],
          );
          const rows = res.rows as Array<{ source_door: string; raw_text: string; created_at: string }>;
          if (rows.length > 0) {
            const result = rows.map(r => `[${r.source_door}] ${r.raw_text.substring(0, 200)}`).join('\n\n');
            addMessage('system', `Vault results:\n\n${result}`);
          } else {
            addMessage('system', 'No results found in local vault.');
          }
        } else {
          addMessage('system', 'Vault unavailable.');
        }
      } catch {
        addMessage('system', 'Vault query failed.');
      }
      setProcessing(false);
      return;
    }

    // Intent routing
    const intent = routeIntent(text, spoons);
    if (intent !== currentSurface) {
      setSurface(intent);
      setShowSurface(true);
      addMessage('system', `Routed to ${surfaceNames[intent] || intent} surface.`);
    } else {
      addMessage('system', `Already on ${surfaceNames[intent] || intent}. How can I help?`);
    }

    setProcessing(false);
  }, [input, processing, spoons, currentSurface, setSurface, surfaceNames, addMessage]);

  // Handle surface navigation from HUD
  const handleSetSurface = useCallback((surf: string) => {
    setSurface(surf);
    setShowSurface(true);
    setHudOpen(false);
    if (surf !== 'GREETING') {
      addMessage('system', `Navigated to ${surfaceNames[surf] || surf} surface.`);
    }
  }, [setSurface, surfaceNames, addMessage]);

  const handleSetSpoons = useCallback((s: number) => {
    setSpoons(s);
    setHudOpen(false);
  }, [setSpoons]);

  const grayRockActive = spoons === 0 || grayRock;

  if (grayRockActive) {
    return (
      <>
        <BreathingCloud spoons={0} />
        <TheGuardian />
      </>
    );
  }

  return (
    <div className={`h-dvh w-screen overflow-hidden flex flex-col bg-black select-none ${theme.wrapper}`}>
      <style>{`
        @keyframes biomimetic-breath {
          0%, 100% { transform: scale(0.96); opacity: 0.8; box-shadow: 0 0 35px rgba(251,146,60,0.15); }
          50% { transform: scale(1.04); opacity: 1; box-shadow: 0 0 70px rgba(251,146,60,0.5); }
        }
        *:focus-visible { outline: 2px solid rgba(57, 255, 20, 0.5); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <BreathingCloud spoons={spoons} />

      {/* Top bar */}
      <header className="flex-none flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/[0.04] bg-black/40 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setHudOpen(prev => !prev)}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-white/5"
            aria-label="Toggle menu"
          >
            <Menu size={16} />
          </button>
          <Terminal size={14} className="text-phos-accent/70" />
          <span className="font-mono text-xs sm:text-sm tracking-widest text-gray-300 hidden sm:inline">
            PHOS <span className="text-phos-accent/70">// CHAT</span>
          </span>
          <span className="font-mono text-[10px] text-gray-600 hidden sm:inline">{'<'}{theme.name}{'>'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-gray-600 flex items-center gap-1.5">
            <StatusDot spoons={spoons} />
            {spoons}/5
          </span>
          <span className="font-mono text-[10px] text-gray-600 hidden sm:inline">
            {vaultReady ? 'VAULT:SYNCED' : 'VAULT:OFFLINE'}
          </span>
        </div>
      </header>

      {/* Escape Hatch */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-30">
        <div className={`transition-all duration-300 ease-in-out ${hudOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <EscapeHatch
            theme={theme}
            hudOpen={hudOpen}
            currentSurface={currentSurface}
            spoons={spoons}
            surfaceNames={surfaceNames}
            onToggleHud={() => setHudOpen(!hudOpen)}
            onSetSpoons={handleSetSpoons}
            onSetSurface={handleSetSurface}
          />
        </div>
      </div>

      {/* Main area: surface content or chat messages */}
      <main className="flex-1 overflow-hidden flex flex-col z-10 relative">
        {showSurface && currentSurface !== 'GREETING' ? (
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">
                {surfaceNames[currentSurface] || currentSurface}
              </span>
              <button
                onClick={() => { setShowSurface(false); setSurface('GREETING'); }}
                className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded hover:bg-white/5"
                aria-label="Close surface view"
              >
                <X size={14} />
              </button>
            </div>
            <SurfaceErrorBoundary surfaceName={currentSurface}>
              <SurfaceContent currentSurface={currentSurface} setSurface={handleSetSurface} spoons={spoons} theme={theme} />
            </SurfaceErrorBoundary>
          </div>
        ) : (
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3 scroll-smooth">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 font-mono">
                <Cpu size={32} className="mb-4 text-phos-accent/20" />
                <p className="text-sm text-phos-accent/30 mb-1">PHOS_CORE // BRIDGE INITIALIZED</p>
                <p className="text-[11px]">State your intent.</p>
                <p className="text-[10px] mt-6 opacity-40">Try: &quot;hello&quot; &quot;/ask ...&quot; or open the menu ({'H'})</p>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} theme={theme} />
              ))
            )}
            {processing && (
              <div className="flex items-start">
                <div className="bg-black/50 border border-white/[0.04] rounded-2xl rounded-tl-sm px-4 py-3 font-mono text-sm">
                  <span className="inline-block mr-1.5 text-emerald-500/70">{'>'}</span>
                  <span className="inline-block w-2 h-4 bg-phos-accent/60 animate-pulse align-middle ml-0.5" />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Input dock */}
      <footer className="flex-none px-3 sm:px-6 py-3 sm:py-4 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          className="flex items-center bg-black/70 border border-white/[0.08] rounded-xl sm:rounded-full shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 focus-within:border-phos-accent/30"
        >
          <span className="hidden sm:block pl-5 pr-2 font-mono text-sm text-phos-accent/60 select-none">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="State your intent..."
            className="flex-1 bg-transparent border-none py-3 sm:py-4 px-3 sm:px-2 text-sm text-gray-100 placeholder:text-gray-700 focus:outline-none focus:ring-0 font-mono"
            autoComplete="off"
            spellCheck="false"
            aria-label="Chat input"
          />
          <div className="flex items-center pr-1 sm:pr-2 gap-0.5">
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-300 transition-colors rounded-full hover:bg-white/5"
              aria-label="Voice input"
              tabIndex={-1}
            >
              <Mic size={16} />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || processing}
              className="p-2 text-gray-600 hover:text-phos-accent/80 transition-colors rounded-full hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
        <div className="mt-2 text-center flex items-center justify-center gap-4">
          <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
            <StatusDot spoons={spoons} />
            {theme.name}
          </span>
          <span className="text-[9px] font-mono text-gray-700 uppercase hidden sm:flex items-center gap-1.5">
            H: menu · 0: crisis
          </span>
        </div>
      </footer>
    </div>
  );
}
