import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Send, Activity, Settings2, ShieldAlert, Cpu, Mic, Waves, Database, Zap } from 'lucide-react';
import { initPhosDatabase, mintCreditsNative, getBalanceNative, startLarmorTone, stopLarmorTone, isLarmorPlaying } from '../lib/tauriBridge';
import { checkForUpdates } from '../lib/updater';
import { ShakeStream } from '../lib/ShakeStream';

const SPOON_LEVELS = {
  0: { name: 'Crisis / GrayRock', color: 'bg-zinc-800', text: 'text-zinc-500', glow: 'shadow-none', speed: 0.005, size: 0.5, uiMode: 'minimal' },
  1: { name: 'Sanctuary', color: 'bg-amber-900/30', text: 'text-amber-500', glow: 'shadow-amber-900/20', speed: 0.01, size: 0.6, uiMode: 'soft' },
  2: { name: 'Sanctuary+', color: 'bg-rose-900/30', text: 'text-rose-400', glow: 'shadow-rose-900/20', speed: 0.015, size: 0.7, uiMode: 'soft' },
  3: { name: 'Bridge', color: 'bg-indigo-900/30', text: 'text-indigo-400', glow: 'shadow-indigo-900/40', speed: 0.02, size: 0.8, uiMode: 'balanced' },
  4: { name: 'Flow', color: 'bg-emerald-900/40', text: 'text-emerald-400', glow: 'shadow-emerald-900/50', speed: 0.04, size: 0.9, uiMode: 'high-contrast' },
  5: { name: 'Quantum / Glow', color: 'bg-emerald-500/20', text: 'text-emerald-300', glow: 'shadow-emerald-500/50', speed: 0.08, size: 1.2, uiMode: 'max' }
};

const INITIAL_MESSAGE = `PHOS_CORE // TAURI BRIDGE INITIALIZED.
Native Rust environment detected.
Hardware acceleration: Bypassed (Software Renderer Active).
Type /help for native execution commands.`;

const BreathingCloud = ({ spoons }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const render = () => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const config = SPOON_LEVELS[spoons];
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (spoons === 0) {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += config.speed;
      const breath = Math.sin(time) * 0.5 + 0.5;
      const baseRadius = (Math.min(width, height) * 0.3) * config.size;
      const currentRadius = baseRadius + (baseRadius * 0.2 * breath);

      let colorRGB = '16, 185, 129';
      if (spoons === 1) colorRGB = '217, 119, 6';
      if (spoons === 2) colorRGB = '225, 29, 72';
      if (spoons === 3) colorRGB = '99, 102, 241';

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, currentRadius * 2);
      gradient.addColorStop(0, `rgba(${colorRGB}, ${0.15 + (breath * 0.1)})`);
      gradient.addColorStop(0.5, `rgba(${colorRGB}, ${0.05 + (breath * 0.05)})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      if (spoons >= 4) {
        const particleCount = spoons === 5 ? 5 : 3;
        for (let i = 0; i < particleCount; i++) {
          const angle = time * (i + 1) * 0.5;
          const px = centerX + Math.cos(angle) * (currentRadius * 0.8);
          const py = centerY + Math.sin(angle) * (currentRadius * 0.8);
          const pGradient = ctx.createRadialGradient(px, py, 0, px, py, currentRadius * 0.5);
          pGradient.addColorStop(0, `rgba(${colorRGB}, 0.2)`);
          pGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = pGradient;
          ctx.beginPath();
          ctx.arc(px, py, currentRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [spoons]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10 bg-[#050505]" style={{ filter: 'blur(40px)' }} />
  );
};

export default function App() {
  const [spoons, setSpoons] = useState(4);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ id: 1, role: 'system', content: INITIAL_MESSAGE, timestamp: new Date().toLocaleTimeString() }]);
  const [nativeAudioPlaying, setNativeAudioPlaying] = useState(false);
  const [karmaBalance, setKarmaBalance] = useState(0);
  const messagesEndRef = useRef(null);

  const config = SPOON_LEVELS[spoons];
  const isMinimal = spoons === 0;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initPhosDatabase();
        const playing = await isLarmorPlaying();
        const balance = await getBalanceNative();
        if (!cancelled) {
          setNativeAudioPlaying(playing);
          setKarmaBalance(balance);
        }
        void checkForUpdates();
      } catch (e) {
        console.warn('Tauri IPC failed. Ensure Rust backend is running.', e);
      }
    })();
    return () => { cancelled = true; stopLarmorTone().catch(() => {}); };
  }, []);

  useEffect(() => {
    if (isMinimal && nativeAudioPlaying) {
      (async () => {
        try {
          await stopLarmorTone();
          setNativeAudioPlaying(false);
        } catch {
          setNativeAudioPlaying(false);
        }
      })();
    }
  }, [isMinimal, nativeAudioPlaying]);

  const addSystemMessage = useCallback((content) => {
    setMessages((prev) => [...prev, { id: Date.now(), role: 'system', content, timestamp: new Date().toLocaleTimeString() }]);
  }, []);

  const toggleNativeAudio = useCallback(async () => {
    try {
      if (nativeAudioPlaying) {
        await stopLarmorTone();
        setNativeAudioPlaying(false);
        addSystemMessage('Native Audio: 863 Hz Larmor resonance HALTED.');
      } else {
        await startLarmorTone();
        setNativeAudioPlaying(true);
        addSystemMessage('Native Audio: 863 Hz Larmor resonance ACTIVE via cpal.');
      }
    } catch (err) {
      addSystemMessage(`IPC Error: Audio pipeline failed. ${err}`);
    }
  }, [nativeAudioPlaying, addSystemMessage]);

  const mintKarma = useCallback(async (amount = 1, reason = 'Terminal Invocation') => {
    try {
      await mintCreditsNative(reason, amount);
      const newBalance = await getBalanceNative();
      setKarmaBalance(newBalance);
      addSystemMessage(`Ledger: Successfully minted ${amount} Karma via SQLite. New balance: ${newBalance}`);
    } catch (err) {
      addSystemMessage(`IPC Error: Database transaction failed. ${err}`);
    }
  }, [addSystemMessage]);

  const streamLLM = useCallback(async (userMsg: string) => {
    const shake = new ShakeStream();
    await shake.streamQuery(
      { prompt: userMsg, model: "qwen2:0.5b", temperature: 0.2 },
      (chunk) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last.role === "assistant") {
            return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
          }
          return [
            ...prev,
            { id: Date.now(), role: "assistant", content: chunk, timestamp: new Date().toLocaleTimeString() },
          ];
        });
      }
    ).catch((err) => {
      addSystemMessage(`LLM Error: ${err instanceof Error ? err.message : String(err)}`);
    });
  }, [addSystemMessage]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || isMinimal) return;

    const cmd = input.trim();
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: cmd, timestamp: new Date().toLocaleTimeString() }]);
    setInput('');

    const lowerCmd = cmd.toLowerCase();
    if (lowerCmd === '/help') {
      addSystemMessage('Available Native Commands:\n/audio - Toggle 863Hz tone\n/mint [amount] - Add Karma to SQLite\n/spoons [0-5] - Adjust cognitive load');
      return;
    }
    if (lowerCmd === '/audio') {
      await toggleNativeAudio();
      return;
    }
    if (lowerCmd.startsWith('/mint')) {
      const parts = lowerCmd.split(' ');
      const amount = parts.length > 1 ? parseInt(parts[1], 10) : 1;
      if (Number.isNaN(amount)) addSystemMessage('Syntax Error: Amount must be an integer.');
      else await mintKarma(amount, 'CLI Manual Injection');
      return;
    }
    if (lowerCmd.startsWith('/spoons')) {
      const parts = lowerCmd.split(' ');
      const value = parseInt(parts[1], 10);
      if (Number.isFinite(value) && value >= 0 && value <= 5) {
        setSpoons(value);
      } else {
        addSystemMessage('Syntax Error: Spoons must be between 0 and 5.');
      }
      return;
    }
    await streamLLM(cmd);
  }, [input, isMinimal, addSystemMessage, toggleNativeAudio, mintKarma, streamLLM]);

  return (
    <div className={`min-h-screen text-gray-200 font-sans selection:bg-emerald-500/30 overflow-hidden relative flex flex-col ${isMinimal ? 'bg-black' : ''}`}>
      <BreathingCloud spoons={spoons} />

      <header className="flex-none w-full px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Terminal size={18} className={config.text} />
          <span className="font-mono text-sm font-bold tracking-[0.2em] uppercase text-gray-300">
            PHOS <span className={config.text}>// Native</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleNativeAudio}
            disabled={isMinimal}
            className={`flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-full border transition-all duration-300 ${nativeAudioPlaying ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}
          >
            <Waves size={14} className={nativeAudioPlaying ? 'animate-pulse' : ''} />
            {nativeAudioPlaying ? '863 Hz ACTIVE' : 'AUDIO OFF'}
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full cursor-pointer" onClick={() => mintKarma(1, 'HUD Tap')}>
            <Database size={14} />
            <span>KARMA: {karmaBalance}</span>
          </div>

          <div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-1.5 border border-white/10 backdrop-blur-md">
            <Activity size={14} className="text-gray-400" />
            <span className="font-mono text-xs text-gray-400 mr-2">SPOONS:</span>
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setSpoons(level)}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300 ${spoons === level ? `${config.color} ${config.text} border border-current shadow-[0_0_10px_currentColor]` : 'text-gray-600 hover:text-gray-400 border border-transparent'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto py-8 px-4 w-full max-w-4xl mx-auto z-10 relative">
        <div className="flex flex-col gap-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.role === 'system' && (
                <div className="flex items-center gap-2 mb-1.5 ml-1">
                  <Cpu size={12} className={config.text} />
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{msg.timestamp}</span>
                </div>
              )}
              <div
                className={`relative max-w-[85%] px-5 py-4 backdrop-blur-md border whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-white/5 border-white/10 rounded-2xl rounded-tr-sm text-gray-100 font-sans'
                    : `bg-black/60 border-white/5 rounded-2xl rounded-tl-sm font-mono text-sm leading-relaxed ${isMinimal ? 'text-gray-500' : 'text-gray-300'}`
                }${msg.role === 'system' && spoons >= 4 ? ' shadow-[0_0_20px_rgba(16,185,129,0.05)] border-emerald-900/30' : ''}`}
              >
                {msg.role === 'system' && !isMinimal && <span className={`inline-block mr-2 select-none ${config.text}`}>{'>'}</span>}
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="flex-none p-6 w-full max-w-4xl mx-auto z-10">
        {isMinimal ? (
          <div className="w-full flex flex-col items-center justify-center p-6 border border-gray-800 rounded-2xl bg-black/50 backdrop-blur-md">
            <ShieldAlert size={24} className="text-gray-600 mb-3" />
            <p className="font-mono text-sm text-gray-500">GRAY_ROCK ACTIVE. IPC BRIDGE SUSPENDED.</p>
            <p className="text-xs text-gray-600 mt-2 font-mono">Execute 4-7-8 breathing protocol.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`relative flex items-center bg-black/60 border border-white/10 rounded-full shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 ${config.glow}`}>
            <div className={`pl-6 pr-3 text-lg font-mono font-bold select-none flex items-center gap-2 ${config.text}`}>
              <Zap size={16} />$
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter intent or /help..."
              className="flex-1 bg-transparent border-none py-5 px-2 text-gray-100 font-sans placeholder:text-gray-600 focus:outline-none focus:ring-0"
              autoComplete="off"
              spellCheck="false"
            />
            <div className="pr-2 flex items-center gap-2">
              <button type="button" className="p-3 text-gray-500 hover:text-gray-300 transition-colors rounded-full hover:bg-white/5">
                <Mic size={20} />
              </button>
              <button
                type="submit"
                disabled={!input.trim()}
                className={`p-3 rounded-full transition-all duration-300 ${input.trim() ? `${config.color} ${config.text} hover:opacity-80` : 'text-gray-700 bg-transparent'}`}
              >
                <Send size={20} className={input.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} />
              </button>
            </div>
          </form>
        )}

        <div className="mt-3 text-center flex items-center justify-center gap-4">
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isMinimal ? 'bg-gray-600' : 'animate-pulse bg-emerald-500'}`}></span>
            State: {config.name}
          </span>
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
            <Settings2 size={10} />
            TAURI BRIDGE: SECURED
          </span>
        </div>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
          `,
        }}
      />
    </div>
  );
}
