/**
 * @file CompanionPanel — Tabbed slide-over: Companion + Settings.
 *
 * Slide-over panel (leaves context visible). Bottom tabs for thumb reach.
 * Companion tab: breathing pacer, brown-noise soundscape, Star Buddy chat, care partner.
 * Settings tab: spoon stepper, dyslexia toggle, accent color picker, name customization.
 * Quiet Companion button in the tab bar hides the chat/soundscape (compassion-only mode).
 *
 * Sovereign, local-first. Reads the canonical `data-spoons` on <html>.
 */

import { useEffect, useRef, useState } from 'react';
import { usePassport, FACE_PALETTE } from '../passport';

export interface CompanionPanelProps {
  open: boolean;
  onClose: () => void;
  carePartner?: { label: string; action: () => void };
}

const STAR_REPLIES = [
  'I\'m right here. You don\'t have to do anything except breathe.',
  'You\'re not alone in this. The mesh holds you.',
  'That sounds really hard. I\'m glad you tapped in.',
  'Let\'s just sit with the breath for a minute. No pressure.',
  'You\'re doing enough by being here. That counts.',
];

function getStoredSpoons(): number {
  try { return parseInt(localStorage.getItem('p31:spoons') || document.documentElement.dataset.spoons || '3', 10); } catch { return 3; }
}

function brownNoise(ctx: AudioContext): AudioBufferSourceNode {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const out = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    out[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

export function CompanionPanel({ open, onClose, carePartner }: CompanionPanelProps) {
  const { passport } = usePassport();
  const name = passport?.identity?.displayName || 'friend';
  const [tab, setTab] = useState<'companion' | 'settings'>('companion');
  const [soundOn, setSoundOn] = useState(false);
  const [chat, setChat] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [quiet, setQuiet] = useState(false);
  const audioRef = useRef<{ ctx: AudioContext; src: AudioBufferSourceNode } | null>(null);

  // Settings state
  const [spoons, setSpoons] = useState(getStoredSpoons());
  const [nameOverride, setNameOverride] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('p31:companion-name') || '' : ''));
  const [colorOverride, setColorOverride] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('p31:companion-color') || '' : ''));
  const [dyslexiaOn, setDyslexiaOn] = useState(() => (typeof window !== 'undefined' ? document.documentElement.getAttribute('data-dyslexia') === 'true' : false));

  // Inject breathing keyframe once (safe — guarded by effect + id check)
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById('p31-breathe-keyframe')) return;
    const s = document.createElement('style');
    s.id = 'p31-breathe-keyframe';
    s.textContent = `@keyframes p31-breathe{0%,100%{transform:scale(0.78);opacity:0.55}40%{transform:scale(1);opacity:1}60%{transform:scale(1);opacity:1}}[data-spoons="0"] [style*="p31-breathe"],[data-spoons="1"] [style*="p31-breathe"]{animation:none!important}@media(prefers-reduced-motion:reduce){[style*="p31-breathe"]{animation:none!important}}`;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    setSpoons(getStoredSpoons());
    if (!open) stopSound();
    if (open) setTab('companion');
    return () => stopSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function stopSound() {
    if (audioRef.current) {
      try { audioRef.current.src.stop(); audioRef.current.ctx.close(); } catch {}
      audioRef.current = null;
    }
    setSoundOn(false);
  }

  function toggleSound() {
    if (soundOn) { stopSound(); return; }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const src = brownNoise(ctx);
    src.connect(ctx.destination);
    src.start();
    audioRef.current = { ctx, src };
    setSoundOn(true);
  }

  function sendChat() {
    const text = draft.trim();
    if (!text) return;
    const reply = STAR_REPLIES[Math.floor(Math.random() * STAR_REPLIES.length)];
    setChat((c) => [...c, `you: ${text}`, `star: ${reply}`]);
    setDraft('');
  }

  function applySpoons(val: number) {
    localStorage.setItem('p31:spoons', String(val));
    document.documentElement.setAttribute('data-spoons', String(val));
    const themeMap: Record<number, string> = { 0: 'crisis', 1: 'sanctuary', 2: 'sanctuary', 3: 'bridge', 4: 'quantum', 5: 'quantum' };
    document.documentElement.setAttribute('data-theme', themeMap[val] || 'quantum');
    if ((window as any).applySpoons) (window as any).applySpoons(val);
    setSpoons(val);
  }

  function saveName(n: string) { setNameOverride(n); localStorage.setItem('p31:companion-name', n); }
  function saveColor(c: string) { setColorOverride(c); localStorage.setItem('p31:companion-color', c); }

  if (!open) return null;

  return (
    <div
      className="ui-chrome fixed bottom-4 right-4 z-[56] w-[360px] max-w-[94vw] max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-void/95 backdrop-blur-xl font-body flex flex-col"
      role="dialog"
      aria-label="Companion"
      data-mcp-tool="companionPanel"
      data-mcp-state={open ? 'open' : 'closed'}
      data-mcp-target="companion-panel"
      style={{ boxShadow: '0 0 40px rgba(0,255,255,0.15)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <h2 className="text-sm font-bold text-quantum-cyan font-mono-tech">
          {tab === 'companion' ? 'Companion' : 'Settings'}
        </h2>
        <div className="flex items-center gap-2">
          {tab === 'companion' && (
            <button
              onClick={() => setQuiet((q) => !q)}
              aria-pressed={quiet}
              aria-label={quiet ? 'Enable full companion' : 'Quiet companion mode'}
              data-mcp-tool="toggleQuietMode"
              data-mcp-type="control"
              data-mcp-state={quiet ? 'quiet' : 'full'}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                quiet ? 'border-quantum-violet/40 bg-quantum-violet/10 text-quantum-violet' : 'border-white/10 text-cloud/60 hover:text-ink'
              }`}
            >
              {quiet ? 'Quiet' : 'R'}
            </button>
          )}
          <button onClick={onClose} aria-label="Close companion" data-mcp-tool="closeCompanion" data-mcp-target="companion-panel" className="text-mist hover:text-ink text-xs px-2">✕</button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 text-ink text-sm">
        {tab === 'companion' && (
          <>
            <p className="text-cloud/80 mb-4">Hey {nameOverride || name}. I'm here. Take what helps, leave the rest.</p>

            {/* Breathing pacer */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <div
                className="w-20 h-20 rounded-full border border-quantum-cyan/40"
                style={{ animation: 'p31-breathe 8s ease-in-out infinite', boxShadow: '0 0 20px rgba(0,255,255,0.3)' }}
                aria-hidden="true"
              />
              <span className="text-[10px] text-mist font-mono-tech">breathe in · hold · out</span>
            </div>

            {!quiet && (
              <>
                {/* Soundscape */}
                <button
                  onClick={toggleSound}
                  aria-pressed={soundOn}
                  data-mcp-tool="toggleSoundscape"
                  data-mcp-type="control"
                  data-mcp-state={soundOn ? 'on' : 'off'}
                  className="w-full mb-3 px-3 h-10 rounded-lg border border-white/10 text-sm hover:border-quantum-cyan/40 transition-colors"
                >
                  {soundOn ? 'St↩ Stop soundscape' : '▶ Brown-noise soundscape'}
                </button>

                {/* Star Buddy chat */}
                <div className="mb-2 text-xs text-mist font-mono-tech">Star Buddy</div>
                <div className="flex flex-col gap-1 mb-2 max-h-[140px] overflow-auto text-sm">
                  {chat.map((line, i) => (
                    <p key={i} className={line.startsWith('you:') ? 'text-cloud/90' : 'text-quantum-cyan'}>{line}</p>
                  ))}
                </div>
                 <div className="flex gap-2 mb-3">
                   <input
                     value={draft}
                     onChange={(e) => setDraft(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                     aria-label="Message Star Buddy"
                     data-mcp-tool="starBuddyChat"
                     data-mcp-target="star-buddy-input"
                     placeholder="say anything..."
                     className="flex-1 px-3 h-9 rounded-lg bg-white/5 border border-white/10 text-sm text-ink outline-none focus:border-quantum-cyan/40"
                   />
                   <button onClick={sendChat} aria-label="Send" data-mcp-tool="starBuddySend" data-mcp-target="star-buddy-input" className="px-3 h-9 rounded-lg bg-quantum-cyan/20 border border-quantum-cyan/40 text-sm">→</button>
                 </div>
              </>
            )}

            {/* Care partner */}
            {carePartner && (
              <button
                onClick={carePartner.action}
                className="w-full mt-2 px-3 h-10 rounded-lg border border-quantum-gold/40 text-sm text-quantum-gold hover:bg-quantum-gold/10 transition-colors"
              >
                {carePartner.label}
              </button>
            )}
          </>
        )}

        {tab === 'settings' && (
          <>
            {/* Spoon stepper */}
            <label className="block text-xs text-cloud/60 mb-2">Spoon level</label>
            <div className="flex items-center gap-2 mb-4">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => applySpoons(n)}
                  aria-pressed={spoons === n}
                  aria-label={`Set spoons to ${n}`}
                  data-mcp-tool="setSpoonLevel"
                  data-mcp-type="control"
                  data-mcp-range="0,5"
                  data-mcp-current={spoons}
                  className={`w-8 h-8 rounded-lg text-xs font-mono-tech transition-all ${
                    spoons === n
                      ? 'bg-quantum-cyan/20 border border-quantum-cyan/40 text-quantum-cyan'
                      : 'bg-white/5 border border-white/10 text-cloud/60 hover:text-ink'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => applySpoons(spoons === 0 ? 3 : 0)}
                className={`ml-2 px-2 h-8 rounded-lg text-[10px] font-mono-tech transition-all ${
                  spoons === 0 ? 'border border-quantum-red/40 bg-quantum-red/10 text-quantum-red' : 'border border-white/10 text-cloud/60 hover:text-ink'
                }`}
              >
                {spoons === 0 ? 'CRISIS' : 'Safe'}
              </button>
            </div>

            {/* Dyslexia toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-cloud/60">Dyslexia accommodations</span>
              <button
                onClick={() => {
                  const next = !dyslexiaOn;
                  document.documentElement.setAttribute('data-dyslexia', String(next));
                  localStorage.setItem('p31:dyslexia', String(next));
                  setDyslexiaOn(next);
                }}
                aria-pressed={dyslexiaOn}
                className={`px-3 h-8 rounded-lg text-[10px] font-mono-tech border transition-all ${
                  dyslexiaOn ? 'border-quantum-violet/40 bg-quantum-violet/10 text-quantum-violet' : 'border-white/10 text-cloud/60 hover:text-ink'
                }`}
              >
                {dyslexiaOn ? 'Aa (Enhanced)' : 'Aa (Standard)'}
              </button>
            </div>

            {/* Accent color */}
            <label className="block text-xs text-cloud/60 mb-1">Color</label>
            <div className="flex gap-2 flex-wrap mb-4">
              {FACE_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => saveColor(c === colorOverride ? '' : c)}
                  aria-label={`Set color ${c}`}
                  aria-pressed={colorOverride === c}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    background: c,
                    borderColor: colorOverride === c ? '#fff' : 'transparent',
                    boxShadow: colorOverride === c ? `0 0 8px ${c}` : 'none',
                  }}
                />
              ))}
            </div>

            {/* Name */}
            <label className="block text-xs text-cloud/60 mb-1">Name</label>
            <input
              value={nameOverride}
              onChange={(e) => saveName(e.target.value)}
              placeholder={name || 'K4'}
              aria-label="Companion name"
              className="w-full px-3 h-9 rounded-lg bg-white/5 border border-white/10 text-sm text-ink outline-none focus:border-quantum-cyan/40 mb-3"
            />

            <p className="text-xs text-cloud/50 mt-4">Your passport and companion stay on this device. No account, no server.</p>
          </>
        )}
      </div>

      {/* Bottom tabs */}
      <div className="shrink-0 border-t border-white/[0.06] flex">
        <button
          onClick={() => setTab('companion')}
          aria-pressed={tab === 'companion'}
          className={`flex-1 py-3 text-xs font-mono-tech transition-colors ${
            tab === 'companion' ? 'text-quantum-cyan border-t-2 border-quantum-cyan -mt-[1px]' : 'text-cloud/50 hover:text-cloud'
          }`}
        >
          Companion
        </button>
        <button
          onClick={() => setTab('settings')}
          aria-pressed={tab === 'settings'}
          className={`flex-1 py-3 text-xs font-mono-tech transition-colors ${
            tab === 'settings' ? 'text-quantum-cyan border-t-2 border-quantum-cyan -mt-[1px]' : 'text-cloud/50 hover:text-cloud'
          }`}
        >
          Settings
        </button>
      </div>
    </div>
  );
}
