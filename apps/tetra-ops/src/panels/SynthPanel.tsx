import { useState, useRef } from 'react';
import { useSpoonStore } from '../state/spoonStore';

export function SynthPanel() {
  const spoons = useSpoonStore((s) => s.spoons);
  const [active, setActive] = useState(false);
  const [freq, setFreq] = useState(863);
  const [vol, setVol] = useState(25);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  // Spoon 0/1 = crisis: audio disabled.
  const disabled = spoons <= 1;

  const toggle = () => {
    if (disabled) return;
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (!active) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = (vol / 100) * 0.1;
      // Binaural: second osc panned right at +7 Hz (α offset).
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq + 7;
      const panner = ctx.createStereoPanner();
      panner.pan.value = 0.85;
      osc.connect(gain);
      osc2.connect(panner).connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc2.start();
      nodesRef.current = { osc, gain };
      setActive(true);
    } else {
      nodesRef.current?.osc.stop();
      nodesRef.current = null;
      setActive(false);
    }
  };

  return (
    <div data-mcp-tool="synthPanel" data-mcp-state={active ? 'playing' : 'stopped'} style={{ padding: 'var(--p31-spacing-md)', borderRadius: 'var(--p31-radius-lg)', background: 'rgba(0,240,255,.04)', border: '1px solid rgba(0,240,255,.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--p31-font-mono)', color: 'var(--p31-text-secondary)' }}>863 Hz · +7 Hz α</span>
        <button
          onClick={toggle}
          disabled={disabled}
          aria-label={active ? 'Stop neuro-acoustic synth' : 'Start neuro-acoustic synth'}
          data-mcp-tool="toggleSynth"
          data-mcp-type="action"
          data-mcp-state={active ? 'playing' : 'stopped'}
          className="font-mono"
          style={{ padding: '4px 10px', borderRadius: 7, fontFamily: 'var(--p31-font-mono)', fontSize: 9, cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing: '.06em', background: active ? 'rgba(251,113,133,.12)' : 'rgba(0,240,255,.1)', border: `1px solid ${active ? 'rgba(251,113,133,.3)' : 'rgba(0,240,255,.25)'}`, color: active ? 'var(--p31-accent-red)' : 'var(--p31-accent)', opacity: disabled ? 0.4 : 1 }}
        >
          {active ? '⏹ STOP' : '▶ START'}
        </button>
      </div>
      <div style={{ marginBottom: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--p31-font-mono)', fontSize: 9, color: 'var(--p31-text-secondary)', marginBottom: 3 }}>
          <span>Resonance</span>
          <span style={{ color: 'var(--p31-accent)' }}>{freq} Hz</span>
        </div>
        <input type="range" min={100} max={1500} value={freq} disabled={disabled} onChange={(e) => setFreq(Number(e.target.value))} data-mcp-tool="setFrequency" data-mcp-type="input" data-mcp-range="100,1500" data-mcp-current={String(freq)} style={{ width: '100%', accentColor: 'var(--p31-accent)' }} aria-label="Resonance frequency" />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--p31-font-mono)', fontSize: 9, color: 'var(--p31-text-secondary)', marginBottom: 3 }}>
          <span>Amplitude</span>
          <span style={{ color: 'var(--p31-accent-violet)' }}>{vol}%</span>
        </div>
        <input type="range" min={0} max={100} value={vol} disabled={disabled} onChange={(e) => setVol(Number(e.target.value))} data-mcp-tool="setAmplitude" data-mcp-type="input" data-mcp-range="0,100" data-mcp-current={String(vol)} style={{ width: '100%', accentColor: 'var(--p31-accent-violet)' }} aria-label="Amplitude" />
      </div>
    </div>
  );
}
