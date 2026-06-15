import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Terminal, Activity, Database, ShieldAlert, Cpu, Network, AudioWaveform, Hexagon, Orbit, Command } from 'lucide-react';

let audioCtx: AudioContext | null = null;
const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, dur: number, slideTo?: number) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
};

const sysAudio = {
  boot: () => playTone(200, 'square', 0.1, 800),
  keystroke: () => playTone(1200, 'sine', 0.02),
  error: () => playTone(150, 'sawtooth', 0.3),
  snap: () => playTone(863, 'triangle', 0.1),
  larmorSweep: () => playTone(863, 'sine', 1.0, 432),
};

const VerletEngine = ({ spoons }: { spoons: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let aId: number;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const nodes: Array<{ x: number; y: number; ox: number; oy: number; pinned: boolean }> = [];
    const beams: Array<{ a: number; b: number; len: number }> = [];

    for (let i = 0; i < 15; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        ox: Math.random() * width,
        oy: Math.random() * height,
        pinned: i === 0 || i === 14,
      });
    }
    for (let i = 0; i < nodes.length - 1; i++) {
      beams.push({ a: i, b: i + 1, len: 60 });
      if (i < nodes.length - 3) beams.push({ a: i, b: i + 3, len: 100 });
    }

    const tick = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      const speed = spoons === 5 ? 1.0 : spoons / 5;

      nodes.forEach((n) => {
        if (!n.pinned) {
          const vx = (n.x - n.ox) * 0.99;
          const vy = (n.y - n.oy) * 0.99;
          n.ox = n.x;
          n.oy = n.y;
          n.x += vx * speed;
          n.y += (vy + 0.1) * speed;
        }
        if (n.y > height - 10) { n.y = height - 10; n.oy = n.y + (n.y - n.oy) * 0.5; }
        if (n.x < 10) { n.x = 10; n.ox = n.x + (n.x - n.ox) * 0.5; }
        if (n.x > width - 10) { n.x = width - 10; n.ox = n.x + (n.x - n.ox) * 0.5; }
      });

      for (let i = 0; i < 5; i++) {
        beams.forEach((b) => {
          const n1 = nodes[b.a], n2 = nodes[b.b];
          const dx = n2.x - n1.x, dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const diff = (dist - b.len) / dist;
          const ox = dx * 0.5 * diff, oy = dy * 0.5 * diff;
          if (!n1.pinned) { n1.x += ox; n1.y += oy; }
          if (!n2.pinned) { n2.x -= ox; n2.y -= oy; }
        });
      }

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      beams.forEach((b) => {
        ctx.beginPath();
        ctx.moveTo(nodes[b.a].x, nodes[b.a].y);
        ctx.lineTo(nodes[b.b].x, nodes[b.b].y);
        ctx.stroke();
      });

      ctx.fillStyle = '#a7f3d0';
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.fillRect(n.x - 3, n.y - 3, 6, 6);
      });

      ctx.fillStyle = '#10b981';
      ctx.font = '10px monospace';
      ctx.fillText(`NODES: ${nodes.length} | BEAMS: ${beams.length} | SOLVER: VERLET_2D`, 10, 20);

      aId = requestAnimationFrame(tick);
    };
    tick();

    return () => cancelAnimationFrame(aId);
  }, [spoons]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

const OrbitalEngine = ({ spoons }: { spoons: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let aId: number;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const cx = width / 2;
    const cy = height / 2;
    const bodies = Array.from({ length: 150 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 200;
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: -Math.sin(angle) * (200 / radius),
        vy: Math.cos(angle) * (200 / radius),
        mass: Math.random() * 2 + 0.5,
      };
    });

    const tick = () => {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const G = 150 * (spoons / 5);

      bodies.forEach((b) => {
        const dx = cx - b.x;
        const dy = cy - b.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        const f = G / (distSq + 100);

        b.vx += (dx / dist) * f;
        b.vy += (dy / dist) * f;
        b.x += b.vx;
        b.y += b.vy;

        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(b.x, b.y, b.mass, b.mass);
      });

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#06b6d4';
      ctx.font = '10px monospace';
      ctx.fillText(`BODIES: ${bodies.length} | G_CONST: ${G.toFixed(1)} | SOLVER: N_BODY`, 10, 20);

      aId = requestAnimationFrame(tick);
    };
    tick();

    return () => cancelAnimationFrame(aId);
  }, [spoons]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

const ResonanceEngine = ({ spoons }: { spoons: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let aId: number;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    let time = 0;

    const tick = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      time += 0.05 * (spoons / 5);

      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      const complexity = spoons + 1;

      for (let x = 0; x < width; x++) {
        let y = height / 2;
        for (let i = 1; i <= complexity; i++) {
          y += Math.sin(x * 0.01 * i + time * i) * (20 / i);
        }
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
      for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

      ctx.fillStyle = '#8b5cf6';
      ctx.font = '10px monospace';
      ctx.fillText(`HARMONICS: ${complexity} | FREQ: ${863}Hz | SOLVER: FFT_SIM`, 10, 20);

      aId = requestAnimationFrame(tick);
    };
    tick();

    return () => cancelAnimationFrame(aId);
  }, [spoons]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

const GuardianPhase = ({ onRecover }: { onRecover: () => void }) => {
  useEffect(() => {
    invoke('start_863hz').catch(() => {});
    sysAudio.larmorSweep();
    return () => { invoke('stop_863hz').catch(() => {}); };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center font-mono text-zinc-600 p-8 text-center select-none">
      <ShieldAlert size={48} className="mb-8 opacity-20" />
      <h1 className="text-2xl tracking-[0.5em] mb-4 text-zinc-500">GUARDIAN PHASE ACTIVE</h1>
      <p className="text-sm tracking-widest opacity-50 mb-2">AUTONOMIC OVERRIDE INITIATED.</p>
      <p className="text-sm tracking-widest opacity-50 mb-8">863 HZ LARMOR RESONANCE ENGAGED.</p>
      <button
        onClick={onRecover}
        className="mt-8 px-8 py-3 border border-zinc-700 rounded text-zinc-500 text-xs tracking-[0.3em] uppercase hover:border-zinc-600 hover:text-zinc-400 transition-all"
      >
        Recover & Resume
      </button>
      <p className="mt-4 text-xs opacity-30">EXECUTE 4-7-8 BREATHING PROTOCOL. AWAITING SPOON RECOVERY.</p>
    </div>
  );
};

export function ArcadeMasterRuntime({ onClose }: { onClose?: () => void }) {
  const [spoons, setSpoons] = useState(4);
  const [karma, setKarma] = useState(0);
  const [activeEngine, setActiveEngine] = useState<'VERLET' | 'ORBITAL' | 'RESONANCE'>('VERLET');
  const [cliInput, setCliInput] = useState('');
  const [logs, setLogs] = useState<Array<{ id: number; type: string; text: string }>>([
    { id: 1, type: 'sys', text: 'INIT P31 ANDROMEDA CORE... [ OK ]' },
    { id: 2, type: 'sys', text: 'MOUNTING TAURI IPC BRIDGE... [ OK ]' },
    { id: 3, type: 'sys', text: 'PHASE 6 GC COMPLIANCE... ENFORCED' },
    { id: 4, type: 'info', text: 'Type /help for command index.' },
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const syncState = useCallback(async () => {
    try {
      await invoke('init_db');
      const bal = await invoke<number>('get_balance');
      setKarma(bal ?? 0);
    } catch (e) {}
  }, []);

  useEffect(() => {
    syncState();
    sysAudio.boot();
    const unlock = () => { getCtx(); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, [syncState]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type: string, text: string) => {
    setLogs((prev) => [...prev, { id: Date.now(), type, text }]);
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim() || spoons === 0) return;

    sysAudio.keystroke();
    const cmd = cliInput.trim();
    addLog('user', `root@p31-ark:~# ${cmd}`);
    setCliInput('');

    const args = cmd.toLowerCase().split(' ');

    switch (args[0]) {
      case '/help':
        addLog('info', 'CMDS: /mint [amt], /spoons [0-5], /engine [verlet|orbital|resonance], /clear');
        break;
      case '/mint':
        const amt = parseInt(args[1]) || 1;
        try {
          await invoke('mint_karma', { kind: 'CLI_INJECT', delta: amt });
          sysAudio.snap();
          const bal = await invoke<number>('get_balance');
          setKarma(bal ?? 0);
          addLog('success', `MINTED +${amt} KARMA TO SQLITE LEDGER.`);
        } catch (e) {
          addLog('error', 'MINT FAILED — IPC ERROR');
        }
        break;
      case '/spoons':
        const sp = parseInt(args[1]);
        if (sp >= 0 && sp <= 5) {
          setSpoons(sp);
          addLog('warn', `SPOON BUDGET OVERRIDE: ${sp}/5`);
        } else {
          addLog('error', 'INVALID BUDGET. RANGE: 0-5');
        }
        break;
      case '/engine':
        const eng = args[1]?.toUpperCase();
        if (['VERLET', 'ORBITAL', 'RESONANCE'].includes(eng)) {
          setActiveEngine(eng as typeof activeEngine);
          addLog('sys', `SWITCHING RENDER PIPELINE -> ${eng}`);
        } else {
          addLog('error', 'UNKNOWN ENGINE.');
        }
        break;
      case '/clear':
        setLogs([]);
        break;
      default:
        addLog('error', `bash: ${args[0]}: command not found`);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-emerald-400 font-mono text-sm overflow-hidden selection:bg-emerald-900 selection:text-emerald-100 flex flex-col z-50">

      {spoons === 0 && <GuardianPhase onRecover={() => setSpoons(4)} />}

      <header className="flex-none flex items-center justify-between p-2 border-b border-emerald-900 bg-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-4">
          <Terminal size={16} className="text-emerald-500" />
          <span className="font-bold tracking-widest uppercase">PHOS_OS // v2.0.1</span>
          <span className="text-xs text-zinc-500 hidden sm:inline">Debian 13 (trixie) | 1.5GiB RAM | Delta Mesh Active</span>
          {onClose && (
            <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-xs ml-4 px-2 py-1 border border-zinc-800 rounded">
              ← EXIT
            </button>
          )}
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2 text-cyan-400">
            <Database size={14} />
            <span>LEDGER: {karma}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className={spoons <= 2 ? 'text-rose-500' : 'text-emerald-500'} />
            <span className="text-zinc-400">SPOONS:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-4 ${s <= spoons ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-zinc-800'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        <aside className="w-full md:w-64 flex-none border-b md:border-b-0 md:border-r border-emerald-900 flex flex-col bg-zinc-900/50">
          <div className="p-3 border-b border-emerald-900 text-xs font-bold tracking-widest text-zinc-500">
            SIMULATION_TARGETS
          </div>
          <div className="flex-1 flex md:flex-col gap-2 p-2 overflow-x-auto md:overflow-y-auto">

            <button
              onClick={() => setActiveEngine('VERLET')}
              className={`flex items-center gap-3 p-3 text-left border transition-all ${
                activeEngine === 'VERLET' ? 'border-emerald-500 bg-emerald-900/20 text-emerald-300' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <Hexagon size={18} />
              <div>
                <div className="font-bold">VERLET_PHYS</div>
                <div className="text-[10px] opacity-70">Soft-body Topology</div>
              </div>
            </button>

            <button
              onClick={() => setActiveEngine('ORBITAL')}
              className={`flex items-center gap-3 p-3 text-left border transition-all ${
                activeEngine === 'ORBITAL' ? 'border-cyan-500 bg-cyan-900/20 text-cyan-300' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <Orbit size={18} />
              <div>
                <div className="font-bold">N_BODY_ORBIT</div>
                <div className="text-[10px] opacity-70">Gravitational Math</div>
              </div>
            </button>

            <button
              onClick={() => setActiveEngine('RESONANCE')}
              className={`flex items-center gap-3 p-3 text-left border transition-all ${
                activeEngine === 'RESONANCE' ? 'border-violet-500 bg-violet-900/20 text-violet-300' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <AudioWaveform size={18} />
              <div>
                <div className="font-bold">RESONANCE_FFT</div>
                <div className="text-[10px] opacity-70">Larmor Waveforms</div>
              </div>
            </button>

          </div>

          <div className="p-4 border-t border-emerald-900 text-[10px] text-zinc-600 space-y-1">
            <div className="flex justify-between"><span>WEBGL_MEM:</span> <span className="text-emerald-500">FLUSHED</span></div>
            <div className="flex justify-between"><span>IPC_BRIDGE:</span> <span className="text-emerald-500">CONNECTED</span></div>
            <div className="flex justify-between"><span>POST_QUANTUM:</span> <span className="text-emerald-500">FIPS 204</span></div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">

          <div className="flex-1 relative bg-black border-b border-emerald-900">
            {activeEngine === 'VERLET' && <VerletEngine spoons={spoons} />}
            {activeEngine === 'ORBITAL' && <OrbitalEngine spoons={spoons} />}
            {activeEngine === 'RESONANCE' && <ResonanceEngine spoons={spoons} />}
          </div>

          <div className="h-48 flex-none flex flex-col bg-zinc-950/80">
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex gap-2 ${
                    log.type === 'error' ? 'text-rose-500'
                    : log.type === 'warn' ? 'text-amber-500'
                    : log.type === 'user' ? 'text-cyan-400'
                    : log.type === 'info' ? 'text-zinc-400'
                    : 'text-emerald-500'
                  }`}
                >
                  <span className="opacity-50 shrink-0">[{new Date(log.id).toISOString().split('T')[1].slice(0, 8)}]</span>
                  <span className="whitespace-pre-wrap break-all">{log.text}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            <form onSubmit={handleCommand} className="flex-none flex items-center p-2 border-t border-emerald-900 bg-zinc-900 text-sm">
              <Command size={14} className="text-emerald-600 mr-2 shrink-0" />
              <span className="text-emerald-600 mr-2 shrink-0">root@p31-ark:~#</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-emerald-100 placeholder:text-zinc-700"
                placeholder="Execute command..."
                autoComplete="off"
                spellCheck="false"
              />
            </form>
          </div>

        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #09090b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #064e3b; border-radius: 0px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #047857; }
      `}</style>
    </div>
  );
}
