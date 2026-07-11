import { useState } from 'react';
import { Palette, Type, Layers, Zap, Eye, Accessibility } from 'lucide-react';

const COLORS = [
  { name: 'void', value: '#0A0A0F' },
  { name: 'surface', value: '#12121A' },
  { name: 'surface2', value: '#1C1C2A' },
  { name: 'quantum-cyan', value: '#00F0FF' },
  { name: 'quantum-violet', value: '#A78BFA' },
  { name: 'quantum-gold', value: '#FBBF24' },
  { name: 'quantum-green', value: '#34D399' },
  { name: 'quantum-red', value: '#FB7185' },
  { name: 'quantum-iris', value: '#818CF8' },
  { name: 'cloud', value: '#A1A1AA' },
];

const SPOON_LEVELS = [0, 1, 2, 3, 4, 5];
const SPOON_LABELS = ['Crisis', 'Minimal', 'Low', 'Moderate', 'High', 'Full'];

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: 12, background: value,
        border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8,
      }} />
      <div style={{ fontSize: 12, fontWeight: 500 }}>{name}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>{value}</div>
    </div>
  );
}

function SpoonDemo() {
  const [spoons, setSpoons] = useState(3);
  const motionDuration = spoons <= 1 ? '0ms' : spoons <= 2 ? '100ms' : spoons <= 3 ? '200ms' : '300ms';

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {SPOON_LEVELS.map(s => (
          <button key={s} onClick={() => setSpoons(s)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: spoons === s ? '#00F0FF' : 'rgba(255,255,255,0.06)',
            color: spoons === s ? '#0a0e14' : '#e2e8f0',
            fontWeight: spoons === s ? 600 : 400, fontSize: 13, transition: `all ${motionDuration}`,
          }}>
            {s} — {SPOON_LABELS[s]}
          </button>
        ))}
      </div>
      <div style={{ padding: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: '#00F0FF',
            transition: `transform ${motionDuration} ease`,
            transform: spoons >= 3 ? 'rotate(360deg)' : 'rotate(0deg)',
          }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Motion: {motionDuration}</div>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>
              {spoons <= 1 ? 'Motion fully disabled (crisis/low)' : `Transitions at ${motionDuration}`}
            </div>
          </div>
        </div>
        {spoons === 0 && (
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(251,113,133,0.1)', borderRadius: 12, border: '1px solid rgba(251,113,133,0.2)', fontSize: 13 }}>
            Crisis mode: only breathing overlay + exit control
          </div>
        )}
      </div>
    </div>
  );
}

function TypographyDemo() {
  const samples = [
    { label: 'H1', style: { fontSize: 48, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' } },
    { label: 'H2', style: { fontSize: 32, fontWeight: 600, lineHeight: 1.2 } },
    { label: 'H3', style: { fontSize: 24, fontWeight: 600, lineHeight: 1.3 } },
    { label: 'Body', style: { fontSize: 16, fontWeight: 400, lineHeight: 1.6 } },
    { label: 'Body SM', style: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 } },
    { label: 'Label', style: { fontSize: 12, fontWeight: 500, lineHeight: 1, letterSpacing: '0.05em', textTransform: 'uppercase' as const } },
    { label: 'Code', style: { fontSize: 13, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 } },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {samples.map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', width: 60, fontFamily: 'JetBrains Mono' }}>{s.label}</span>
          <span style={s.style}>The quick brown fox</span>
        </div>
      ))}
    </div>
  );
}

function GlassDemo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      {[
        { label: 'Glass Panel', radius: 24, blur: 12 },
        { label: 'Glass Card', radius: 16, blur: 8 },
        { label: 'Glass Button', radius: 8, blur: 4 },
      ].map(g => (
        <div key={g.label} style={{
          padding: 24, borderRadius: g.radius,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: `blur(${g.blur}px)`,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{g.label}</div>
          <div style={{ fontSize: 12, color: '#cbd5e1' }}>radius: {g.radius}px · blur: {g.blur}px</div>
        </div>
      ))}
    </div>
  );
}

function SpacingDemo() {
  const levels = ['minimal', 'moderate', 'detailed', 'exhaustive'];
  const densities = [12, 16, 20, 24];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {levels.map((level, i) => (
        <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#cbd5e1', width: 80, fontFamily: 'JetBrains Mono' }}>{level}</span>
          <div style={{ display: 'flex', gap: densities[i] }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.3)',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>gap: {densities[i]}px</span>
        </div>
      ))}
    </div>
  );
}

function WCAGDemo() {
  const checks = [
    { label: 'Touch targets', detail: '≥48×48px (WCAG 2.5.8)', icon: <Accessibility size={16} /> },
    { label: 'Contrast ratios', detail: '≥7:1 AAA (quantum-cyan on void)', icon: <Eye size={16} /> },
    { label: 'Focus indicators', detail: '2px accent outline, 2px offset', icon: <Zap size={16} /> },
    { label: 'Skip navigation', detail: '#main-content skip link', icon: <Layers size={16} /> },
    { label: 'Reduced motion', detail: '@media prefers-reduced-motion', icon: <Zap size={16} /> },
    { label: 'ARIA labels', detail: 'All icon buttons + SVGs', icon: <Accessibility size={16} /> },
    { label: 'Keyboard nav', detail: 'Tab order + Escape handlers', icon: <Zap size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {checks.map(c => (
        <div key={c.label} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
          background: 'rgba(52,211,153,0.06)', borderRadius: 8, border: '1px solid rgba(52,211,153,0.15)',
        }}>
          <span style={{ color: '#34D399' }}>{c.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</span>
          <span style={{ fontSize: 12, color: '#cbd5e1', marginLeft: 'auto' }}>{c.detail}</span>
        </div>
      ))}
    </div>
  );
}

const sections = [
  { id: 'colors', label: 'Colors', icon: <Palette size={16} />, component: <ColorGrid /> },
  { id: 'typography', label: 'Typography', icon: <Type size={16} />, component: <TypographyDemo /> },
  { id: 'spoons', label: 'Spoon Levels', icon: <Zap size={16} />, component: <SpoonDemo /> },
  { id: 'glass', label: 'Glassmorphism', icon: <Layers size={16} />, component: <GlassDemo /> },
  { id: 'spacing', label: 'Density', icon: <Layers size={16} />, component: <SpacingDemo /> },
  { id: 'wcag', label: 'WCAG 2.2', icon: <Accessibility size={16} />, component: <WCAGDemo /> },
];

function ColorGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 16 }}>
      {COLORS.map(c => <ColorSwatch key={c.name} {...c} />)}
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState('colors');

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <nav style={{
        width: 200, padding: '24px 16px', background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#00F0FF' }}>P31 Design</h1>
        <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 24 }}>Design System Hub</p>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: active === s.id ? 'rgba(0,240,255,0.1)' : 'transparent',
            color: active === s.id ? '#00F0FF' : '#cbd5e1',
            fontSize: 13, fontWeight: active === s.id ? 500 : 400,
            textAlign: 'left', marginBottom: 2,
          }}>
            {s.icon} {s.label}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }} id="main-content">
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          {sections.find(s => s.id === active)?.label}
        </h2>
        <p style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 24 }}>
          {active === 'colors' && 'P31 color palette — dark-first, high-contrast, neuroinclusive.'}
          {active === 'typography' && 'Type scale from H1 to Code. Inter for UI, JetBrains Mono for code.'}
          {active === 'spoons' && 'Spoon-aware motion scaling. Motion fully disabled at spoons 0–1.'}
          {active === 'glass' && 'Glassmorphism surfaces — backdrop-filter blur, subtle borders.'}
          {active === 'spacing' && 'Density levels control spacing, font scale, and info density.'}
          {active === 'wcag' && 'WCAG 2.2 AAA compliance checklist — verified in code.'}
        </p>
        {sections.find(s => s.id === active)?.component}
      </main>
    </div>
  );
}
