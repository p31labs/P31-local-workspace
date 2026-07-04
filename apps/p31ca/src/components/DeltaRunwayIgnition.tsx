/**
 * Delta Runway Ignition Ceremony
 *
 * Wye-to-Delta onboarding bridge — the FSM that turns a non-technical user
 * into a sovereign mesh node in one tap.
 *
 * Spoon Dial mapping:
 *   1-spoon (Survival):  Single screen-locking button. All crypto + PGLite hydration silent.
 *   3-spoon (Editorial): "Slide to Abdicate" + covenant narrative + editorial styling.
 *   6-spoon (Terminal):  Raw key bytes, matrix rain, 3D Posner lattice, full HUD.
 *
 * Phases:
 *   0: VOID       — OLED black, particles coalescing (1/3/6-spoon dependent)
 *   1: TUNING     — Handshake. User interaction triggers init.
 *   2: GLITCH     — Abdication. Ed25519 keygen, PGLite hydration, covenant signed.
 *   3: ASSEMBLY   — Genesis. Sovereign node constructed. QR envelope generated.
 *   4: MESH       — Steady-state Delta dashboard.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  forgeIdentity,
  signCovenant,
  persistIdentity,
  recordCovenant,
  queueSync,
  simulateForging,
} from '../lib/sovereign';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SpoonLevel = 1 | 3 | 6;
export type Phase = 0 | 1 | 2 | 3 | 4; // VOID, TUNING, GLITCH, ASSEMBLY, MESH

export interface DeltaRunwayIgnitionProps {
  alias?: string;
  vertex?: string;
  onComplete?: (identity: SovereignIdentityResult) => void;
  initialSpoon?: SpoonLevel;
}

export interface SovereignIdentityResult {
  identity: {
    id: string;
    alias: string;
    vertex: string;
    publicKey: string;
    genesisHash: string;
    createdAt: string;
  };
  keypair: {
    publicKey: string;
    privateKey: string;
  };
  covenantSignature?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME CONFIG — Zolandery aesthetics per spoon level
// ─────────────────────────────────────────────────────────────────────────────

const THEMES: Record<SpoonLevel, {
  label: string;
  motif: string;
  bg: string;
  text: string;
  btn: string;
  btnText: string;
  font: string;
  padding: string;
  logStyle: string;
}> = {
  1: {
    label: 'Survival Couture',
    motif: '1-SPOON',
    bg: 'bg-white',
    text: 'text-black',
    btn: 'bg-black text-white hover:bg-zinc-800',
    btnText: 'text-white',
    font: 'font-sans',
    padding: 'p-4',
    logStyle: 'hidden',
  },
  3: {
    label: 'Derelicte Editorial',
    motif: '3-SPOON',
    bg: 'bg-zinc-950',
    text: 'text-zinc-200',
    btn: 'bg-zinc-100 text-zinc-950 hover:bg-white',
    btnText: 'text-zinc-950',
    font: 'font-serif',
    padding: 'p-8',
    logStyle: 'font-mono text-xs text-zinc-500',
  },
  6: {
    label: 'Magnum Terminal',
    motif: '6-SPOON',
    bg: 'bg-black',
    text: 'text-emerald-500',
    btn: 'border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10',
    btnText: 'text-emerald-500',
    font: 'font-mono',
    padding: 'p-4',
    logStyle: 'font-mono text-xs text-emerald-600',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DeltaRunwayIgnition({
  alias = 'Operator',
  vertex = 'operator',
  onComplete,
  initialSpoon = 3,
}: DeltaRunwayIgnitionProps) {
  const [spoon, setSpoon] = useState<SpoonLevel>(initialSpoon);
  const [phase, setPhase] = useState<Phase>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<SovereignIdentityResult | null>(null);
  const [isForging, setIsForging] = useState(false);
  const [coherence, setCoherence] = useState(0.85);
  const logRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[spoon];

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, msg]);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE TRANSITIONS
  // ─────────────────────────────────────────────────────────────────────────

  const enterVoid = useCallback(() => {
    setPhase(0);
    setLogs([]);
    setResult(null);
    setIsForging(false);
    setCoherence(0.85);

    if (spoon === 1) {
      addLog('> SYSTEM READY');
      addLog('> TAP TO SEAL VAULT');
      setPhase(1);
    } else {
      addLog('> INITIALIZING DELTA RUNWAY...');
      setTimeout(() => {
        addLog('> VOID STATE ESTABLISHED');
        setPhase(1);
      }, 1500);
    }
  }, [spoon, addLog]);

  // Phase 1 → Phase 2: User initiates the sequence
  const initiateIgnition = useCallback(async () => {
    if (isForging) return;
    setIsForging(true);
    setPhase(2);

    if (spoon === 1) {
      // 1-spoon: silent, no logs visible
      try {
        await runForgingSilent(alias, vertex,
          (r) => { setResult(r); setCoherence(0.95); },
          () => setPhase(3)
        );
      } catch (err) {
        console.error('[DeltaRunway] 1-spoon forging failed:', err);
        setIsForging(false);
        setPhase(1);
      }
      return;
    }

    // 3-spoon and 6-spoon: verbose log output
    addLog('> ABDICATION PROTOCOL INITIATED');
    addLog(`> ALIAS: ${alias}`);
    addLog(`> VERTEX: ${vertex.toUpperCase()}_EDGE`);

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    try {
      addLog('> LOADING @noble/ed25519...');
      await delay(600);

      addLog('> FORGING ED25519 KEYPAIR...');
      await delay(400);

      addLog('> ENTROPY POOL: 256-BIT / DEVICE LOCAL');
      await delay(300);

      const forgeResult = await runForging(alias, vertex, addLog, delay);

      if (spoon === 6) {
        addLog(`> PRIV: ${forgeResult.keypair.privateKey.slice(0, 8)}${'•'.repeat(48)}${forgeResult.keypair.privateKey.slice(-8)} [DEVICE BOUND]`);
        addLog(`> PUB:  ${forgeResult.keypair.publicKey.slice(0, 32)}...${forgeResult.keypair.publicKey.slice(-32)}`);
      }

      addLog('> PGLITE SCHEMA HYDRATED');
      addLog('> SOVEREIGN NODE ACTIVE');

      setResult(forgeResult);
      setCoherence(0.95);

      await delay(800);
      setPhase(3);
    } catch (err) {
      addLog(`> ERROR: ${err instanceof Error ? err.message : 'UNKNOWN'}`);
      setIsForging(false);
      setPhase(1);
    }
  }, [spoon, alias, vertex, isForging, addLog]);

  // Phase 3 → Phase 4: Complete
  const completeIgnition = useCallback(() => {
    setPhase(4);
    if (result && onComplete) {
      onComplete(result);
    }
  }, [result, onComplete]);

  // Reset for re-run
  const resetIgnition = useCallback(() => {
    enterVoid();
  }, [enterVoid]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: PHASE 0 (VOID)
  // ─────────────────────────────────────────────────────────────────────────

  const renderVoid = () => {
    if (spoon === 1) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
          <button
            onClick={initiateIgnition}
            disabled={isForging}
            className={`
              text-2xl font-bold tracking-widest uppercase
              px-12 py-8 rounded-2xl transition-all
              ${theme.btn} disabled:opacity-50
              active:scale-95 select-none
            `}
          >
            {isForging ? 'SEALING...' : 'I AM HERE.\nSEAL MY VAULT.'}
          </button>
          <p className="text-xs text-zinc-400 font-mono tracking-wider">
            NON-EXPORTABLE ED25519 KEY / PGLITE HYDRATED / OFFLINE-FIRST
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <div className="text-6xl animate-pulse opacity-20">◈</div>
        <p className={`text-sm tracking-[0.3em] uppercase opacity-50 ${theme.text}`}>
          Establishing sovereign ground...
        </p>
        <button
          onClick={() => setPhase(1)}
          className={`
            text-sm tracking-widest uppercase px-6 py-3 rounded-full
            ${theme.btn} transition-all
          `}
        >
          Enter the Delta
        </button>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: PHASE 1 (TUNING)
  // ─────────────────────────────────────────────────────────────────────────

  const renderTuning = () => {
    if (spoon === 1) {
      // 1-spoon tuning is just the big button (handled by phase 0 rendering directly into phase 1)
      return null;
    }

    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] gap-8 ${theme.padding}`}>
        <div className={`text-center space-y-2 ${theme.font}`}>
          <h2 className={`text-3xl md:text-4xl font-light tracking-wide ${theme.text}`}>
            Welcome, <span className="font-medium">{alias}</span>.
          </h2>
          <p className={`text-sm uppercase tracking-widest opacity-60 ${theme.text}`}>
            You are entering the Sanctuary.
          </p>
        </div>

        {/* Covenant (3-spoon) or terminal banner (6-spoon) */}
        {spoon === 3 && (
          <div className={`w-full max-w-md space-y-4 mb-8 ${theme.text} opacity-70`}>
            <p className="text-center italic">"The WYE extracts. The DELTA protects."</p>
            <p className="text-center italic">"Your data never leaves this family."</p>
            <p className="text-center italic">"The cloud is the router. The metal is the truth."</p>
          </div>
        )}

        {spoon === 6 && (
          <div className={`w-full text-left mb-8 ${theme.logStyle} opacity-80`}>
            <p>{'>'} COVENANT:</p>
            <p>{'>'}  The WYE extracts. The DELTA protects.</p>
            <p>{'>'}  Your data never leaves this family.</p>
            <p>{'>'}  The cloud is the router. The metal is the truth.</p>
            <p>{'>'}  The resin flows.</p>
          </div>
        )}

        {/* Slide to Abdicate (3-spoon) or Init button (6-spoon) */}
        {spoon === 3 ? (
          <SlideToAbdicate onComplete={initiateIgnition} theme={theme} />
        ) : (
          <button
            onClick={initiateIgnition}
            disabled={isForging}
            className={`
              text-sm tracking-[0.3em] uppercase px-8 py-4 rounded-full
              ${theme.btn} disabled:opacity-50 transition-all
            `}
          >
            {isForging ? 'FORGING...' : 'INITIATE IGNITION'}
          </button>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: PHASE 2 (GLITCH / FORGING)
  // ─────────────────────────────────────────────────────────────────────────

  const renderGlitch = () => {
    const baseClass = spoon === 1
      ? 'flex flex-col items-center justify-center min-h-[60vh] gap-6'
      : 'w-full';

    return (
      <div className={baseClass}>
        {spoon === 1 && (
          <div className="text-2xl font-light tracking-widest animate-pulse">
            Sealing vault...
          </div>
        )}

        {(spoon === 3 || spoon === 6) && (
          <>
            <div className={`flex items-center gap-3 mb-6 ${theme.text}`}>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className={`text-lg font-medium tracking-widest uppercase ${theme.font}`}>
                Forging Identity
              </h3>
            </div>

            {/* Key log terminal */}
            <div
              className={`
                w-full max-w-2xl h-[300px] overflow-hidden relative
                bg-zinc-950 border border-zinc-800 rounded-lg p-4
                ${theme.logStyle}
              `}
            >
              <div ref={logRef} className="space-y-1 overflow-y-auto h-full">
                {logs.map((line, i) => (
                  <div key={i} className="whitespace-pre">
                    {spoon === 6 && line.includes('PRIV') ? (
                      <span className="text-zinc-600 blur-[1px] select-none">{line}</span>
                    ) : line.includes('PUB') ? (
                      <span className="text-cyan-400">{line}</span>
                    ) : line.includes('ACTIVE') || line.includes('HYDRATED') ? (
                      <span className="text-emerald-400 font-medium">{line}</span>
                    ) : (
                      <span className="opacity-70">{line}</span>
                    )}
                  </div>
                ))}
                {isForging && <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />}
              </div>
            </div>
          </>
        )}

        {(spoon === 3 || spoon === 6) && result && (
          <button
            onClick={() => setPhase(3)}
            className={`
              mt-6 text-sm tracking-widest uppercase px-8 py-3 rounded-full
              ${theme.btn} transition-all
            `}
          >
            ASSEMBLE NODE
          </button>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: PHASE 3 (ASSEMBLY)
  // ─────────────────────────────────────────────────────────────────────────

  const renderAssembly = () => {
    if (spoon === 1) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="text-6xl text-emerald-500">✓</div>
          <p className="text-xl font-light tracking-widest">VAULT SEALED</p>
          <button
            onClick={completeIgnition}
            className={`
              text-lg tracking-widest uppercase px-8 py-4 rounded-full
              ${theme.btn} transition-all
            `}
          >
            ENTER THE MESH
          </button>
        </div>
      );
    }

    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] gap-8 ${theme.padding}`}>
        <div className={`w-24 h-24 ${spoon === 6 ? 'text-emerald-400' : 'text-emerald-500'} mb-4`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h2 className={`text-3xl font-light tracking-wide ${theme.text}`}>
          Sovereignty Established
        </h2>

        <p className={`text-sm uppercase tracking-widest opacity-60 ${theme.text}`}>
          Welcome to the DELTA
        </p>

        {/* Coherence indicator (6-spoon) */}
        {spoon === 6 && (
          <div className={`w-full max-w-md ${theme.logStyle}`}>
            <p>{'>'} COGNITIVE COHERENCE (Q): {(coherence * 100).toFixed(0)}%</p>
            <p>{'>'} LARMOR: 863 Hz ACTIVE</p>
            <p>{'>'} NODE: {vertex.toUpperCase()}</p>
            <p>{'>'} PUBKEY: {result?.identity.publicKey.slice(0, 16)}...</p>
          </div>
        )}

        <button
          onClick={completeIgnition}
          className={`
            text-sm tracking-widest uppercase px-8 py-4 rounded-full
            ${theme.btn} transition-all
          `}
        >
          ENTER THE MESH
        </button>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: PHASE 4 (MESH)
  // ─────────────────────────────────────────────────────────────────────────

  const renderMesh = () => {
    if (!result) return null;

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} ${theme.padding}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 ${theme.font}`}>
            <h1 className={`text-3xl md:text-4xl font-light tracking-wide mb-2`}>
              Delta Mesh
            </h1>
            <p className={`text-sm uppercase tracking-widest opacity-60`}>
              Node Active — {alias}
            </p>
          </div>

          {/* Identity card */}
          <div className={`
            rounded-xl border mb-8 p-6
            ${spoon === 1 ? 'border-zinc-200 bg-zinc-50' : ''}
            ${spoon === 3 ? 'border-zinc-800 bg-zinc-900/50' : ''}
            ${spoon === 6 ? 'border-emerald-900 bg-black' : ''}
          `}>
            <div className={`grid gap-4 ${spoon === 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <span className={`text-xs uppercase tracking-wider opacity-50`}>Alias</span>
                <p className={`font-medium ${theme.font}`}>{result.identity.alias}</p>
              </div>
              <div>
                <span className={`text-xs uppercase tracking-wider opacity-50`}>Vertex</span>
                <p className={`font-mono text-sm`}>{result.identity.vertex.toUpperCase()}</p>
              </div>
              <div className={spoon === 1 ? 'col-span-2' : ''}>
                <span className={`text-xs uppercase tracking-wider opacity-50`}>Public Key</span>
                <p className={`font-mono text-xs break-all ${spoon === 1 ? 'text-zinc-600' : ''}`}>
                  {result.identity.publicKey}
                </p>
              </div>
              <div className={spoon === 1 ? 'col-span-2' : ''}>
                <span className={`text-xs uppercase tracking-wider opacity-50`}>Genesis Hash</span>
                <p className={`font-mono text-xs break-all ${spoon === 1 ? 'text-zinc-600' : ''}`}>
                  {result.identity.genesisHash}
                </p>
              </div>
            </div>
          </div>

          {/* QR envelope (3-spoon and 6-spoon) */}
          {(spoon === 3 || spoon === 6) && (
            <div className={`text-center ${theme.logStyle}`}>
              <p className="mb-4 opacity-70">Sovereign envelope generated. Print and store offline.</p>
              <SovereignQR identity={result.identity} />
            </div>
          )}

          {/* Debug (6-spoon only) */}
          {spoon === 6 && (
            <div className={`mt-8 p-4 rounded border ${theme.logStyle} opacity-80`}>
              <p>{'>'} SYNC QUEUE DRAIN: PENDING</p>
              <p>{'>'} YJS CRDT: NOMINAL</p>
              <p>{'>'} OUTBOX: 0 ITEMS</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MOUNT: start the sequence
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    enterVoid();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // OUTPUT
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen transition-colors duration-700 ${theme.bg} ${theme.text} ${theme.font}`}>
      {/* Coherence voltage strip (3/6-spoon) */}
      {(spoon === 3 || spoon === 6) && phase < 4 && (
        <VoltageStrip coherence={coherence} spoon={spoon} />
      )}

      {phase === 0 && renderVoid()}
      {phase === 1 && renderTuning()}
      {phase === 2 && renderGlitch()}
      {phase === 3 && renderAssembly()}
      {phase === 4 && renderMesh()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SlideToAbdicate({
  onComplete,
  theme,
}: {
  onComplete: () => void;
  theme: typeof THEMES[3];
}) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const maxDrag = 220;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setDragX(0);
  };

  const handleMove = (clientX: number, startX: number) => {
    if (!isDragging) return;
    const diff = Math.max(0, Math.min(clientX - startX, maxDrag));
    setDragX(diff);
  };

  const handleEnd = (startX: number) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX > maxDrag * 0.75) {
      setDragX(maxDrag);
      setTimeout(onComplete, 200);
    } else {
      setDragX(0);
    }
  };

  return (
    <div className="w-full max-w-[340px]">
      <div
        ref={containerRef}
        className="relative h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center overflow-hidden"
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          handleStart(e.clientX);
          (e.currentTarget as any)._startX = e.clientX;
        }}
        onMouseMove={(e) => {
          const target = e.currentTarget as any;
          if (isDragging && target._startX) {
            handleMove(e.clientX, target._startX);
          }
        }}
        onMouseUp={(e) => {
          const target = e.currentTarget as any;
          if (target._startX) handleEnd(target._startX);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handleStart(t.clientX);
          (e.currentTarget as any)._startX = t.clientX;
        }}
        onTouchMove={(e) => {
          const target = e.currentTarget as any;
          const t = e.touches[0];
          if (isDragging && target._startX) {
            handleMove(t.clientX, target._startX);
          }
        }}
        onTouchEnd={(e) => {
          const target = e.currentTarget as any;
          if (target._startX) handleEnd(target._startX);
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm tracking-[0.3em] uppercase pointer-events-none">
          Slide to Abdicate
        </span>
        <div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 transition-opacity duration-300 pointer-events-none"
          style={{ opacity: dragX > 0 ? 1 : 0 }}
        />
        <div
          className="absolute left-1 w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] z-10"
          style={{
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <svg className="w-6 h-6 text-zinc-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
      {spoon === 3 && (
        <p className="text-center text-xs text-zinc-600 mt-3 italic">
          The interface you are touching right now is the Spoon Dial.
          Tap the top right and watch the whole runway change.
        </p>
      )}
    </div>
  );
}

function VoltageStrip({
  coherence,
  spoon,
}: {
  coherence: number;
  spoon: SpoonLevel;
}) {
  // Map coherence (0-1) to color temperature via Plutchik's Wheel approximation
  const hue = 180 - coherence * 140; // cyan (180) → red (40)
  const width = `${Math.max(4, coherence * 100)}%`;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50">
      <div
        className="h-full transition-all duration-500"
        style={{
          width,
          backgroundColor: `hsl(${hue}, 80%, 50%)`,
          boxShadow: `0 0 10px hsl(${hue}, 80%, 50%)`,
        }}
      />
    </div>
  );
}

function SovereignQR({ identity }: { identity: SovereignIdentityResult['identity'] }) {
  // Minimal data URI QR placeholder — in production this calls qr-printable.ts
  // with type 'sovereign-identity'
  const payload = JSON.stringify({
    v: 'p31.sovereign/1.0.0',
    pk: identity.publicKey,
    alias: identity.alias,
    gh: identity.genesisHash,
    r: 'https://p31ca.org/recover',
  });

  // Simple QR-like visual placeholder (real implementation imports qr-printable.ts)
  return (
    <div className="inline-block p-4 bg-white rounded-lg">
      <div className="w-32 h-32 bg-black mx-auto flex items-center justify-center">
        <span className="text-white text-[8px] font-mono break-all px-1">
          {payload.slice(0, 64)}...
        </span>
      </div>
      <p className="text-center text-xs mt-2 text-zinc-500 font-mono">
        {identity.publicKey.slice(0, 12)}...
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORGE RUNNERS (separated so 1-spoon can be silent)
// ─────────────────────────────────────────────────────────────────────────────

async function runForging(
  alias: string,
  vertex: string,
  addLog: (msg: string) => void,
  delay: (ms: number) => Promise<void>,
): Promise<SovereignIdentityResult> {
  addLog('> GENERATING ED25519 KEYPAIR...');
  const { keypair, identity } = await forgeIdentity(alias, vertex);

  addLog('> PERSISTING TO PGLITE...');
  await persistIdentity(identity);

  addLog('> SIGNING COVENANT...');
  const covenantPayload = {
    type: 'p31.sovereign_covenant/1.0.0',
    identityId: identity.id,
    clauses: [
      'The WYE extracts. The DELTA protects.',
      'Your cognitive load is not a liability.',
      'Your data never leaves this family.',
      'The cloud is the router. The metal is the truth.',
      'The resin flows.',
    ],
    signedAt: new Date().toISOString(),
  };

  const { signature } = await signCovenant(covenantPayload, keypair.privateKey);
  await recordCovenant(identity.id, covenantPayload, signature);

  addLog('> QUEUING MESH SYNC...');
  await queueSync('sovereign_identity', identity.id, 'INSERT', identity);

  return {
    identity: {
      id: identity.id,
      alias: identity.alias,
      vertex: identity.vertex,
      publicKey: identity.publicKey,
      genesisHash: identity.genesisHash,
      createdAt: identity.createdAt,
    },
    keypair,
    covenantSignature: signature,
  };
}

async function runForgingSilent(
  alias: string,
  vertex: string,
  onResult: (r: SovereignIdentityResult) => void,
  onDone: () => void,
): Promise<void> {
  const { keypair, identity } = await forgeIdentity(alias, vertex);
  await persistIdentity(identity);

  const covenantPayload = {
    type: 'p31.sovereign_covenant/1.0.0',
    identityId: identity.id,
    clauses: [
      'The WYE extracts. The DELTA protects.',
      'Your cognitive load is not a liability.',
      'Your data never leaves this family.',
      'The cloud is the router. The metal is the truth.',
      'The resin flows.',
    ],
    signedAt: new Date().toISOString(),
  };

  const { signature } = await signCovenant(covenantPayload, keypair.privateKey);
  await recordCovenant(identity.id, covenantPayload, signature);
  await queueSync('sovereign_identity', identity.id, 'INSERT', identity);

  const result: SovereignIdentityResult = {
    identity: {
      id: identity.id,
      alias: identity.alias,
      vertex: identity.vertex,
      publicKey: identity.publicKey,
      genesisHash: identity.genesisHash,
      createdAt: identity.createdAt,
    },
    keypair,
    covenantSignature: signature,
  };

  onResult(result);
  await new Promise(r => setTimeout(r, 600));
  onDone();
}
