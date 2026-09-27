import { useState, useEffect } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

interface Settings {
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: number;
  accentColor: string;
}

const defaultSettings: Settings = {
  dyslexiaFont: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: 16,
  accentColor: '#00F0FF',
};

const accentColors = [
  { name: 'Cyan', value: '#00F0FF' },
  { name: 'Violet', value: '#A78BFA' },
  { name: 'Gold', value: '#FBBF24' },
  { name: 'Green', value: '#34D399' },
  { name: 'Rose', value: '#FB7185' },
];

export function SettingsSurface() {
  const { spoons, setSpoons } = useSpoon();
  const [settings, setSettings] = useState<Settings>(() => {
    try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem('phos:settings') || '{}') }; }
    catch { return defaultSettings; }
  });

  useEffect(() => {
    localStorage.setItem('phos:settings', JSON.stringify(settings));
    const root = document.documentElement;
    if (settings.dyslexiaFont) root.style.setProperty('--p31-font-sans', 'OpenDyslexic, sans-serif');
    else root.style.removeProperty('--p31-font-sans');
    if (settings.highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');
    root.style.setProperty('--p31-font-size-base', `${settings.fontSize}px`);
  }, [settings]);

  const toggle = (key: keyof Settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="settingsSurface" data-mcp-state={String(spoons)}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Settings</h1>
        <p className="text-cloud/50 text-sm">Make it yours.</p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Spoons</h2>
        <div className="flex gap-2 mb-3" role="radiogroup" aria-label="Spoon level">
          {[0, 1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              role="radio"
              aria-checked={spoons === n}
              onClick={() => setSpoons(n as 0|1|2|3|4|5)}
              data-mcp-tool="setSpoonLevel"
              data-mcp-type="control"
              data-mcp-range="0,5"
              data-mcp-current={String(spoons)}
              data-mcp-state={spoons === n ? 'active' : 'inactive'}
              className={`w-10 h-10 rounded-xl border text-sm font-mono-tech transition-all ${
                spoons === n
                  ? 'border-quantum-cyan bg-quantum-cyan/20 text-quantum-cyan scale-110'
                  : 'border-white/10 text-mist hover:border-white/20'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-cloud/40 text-xs font-mono-tech">
          {spoons <= 1 ? 'Crisis mode — motion disabled, chrome hidden' :
           spoons <= 3 ? 'Steady — standard motion and layout' :
           'Full — all effects enabled'}
        </p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Accessibility</h2>
        <div className="space-y-3">
          {[
            { key: 'dyslexiaFont' as const, label: 'Dyslexia-friendly font', desc: 'OpenDyslexic typeface' },
            { key: 'reducedMotion' as const, label: 'Reduce motion', desc: 'Disable all animations' },
            { key: 'highContrast' as const, label: 'High contrast', desc: 'Increase text contrast' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              data-mcp-tool="toggleAccessibility"
              data-mcp-type="action"
              data-mcp-target={`toggle-${item.key}`}
              data-mcp-state={settings[item.key] ? 'on' : 'off'}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-void-surface/50 border border-white/[0.04] hover:border-white/[0.08] transition-colors text-left"
            >
              <div>
                <p className="text-sm text-ink">{item.label}</p>
                <p className="text-xs text-cloud/40">{item.desc}</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${
                settings[item.key] ? 'bg-quantum-cyan/30' : 'bg-white/10'
              }`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                  settings[item.key] ? 'left-4.5 bg-quantum-cyan' : 'left-0.5 bg-cloud/40'
                }`} />
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Font Size</h2>
        <input
          type="range"
          min="12"
          max="24"
          value={settings.fontSize}
          onChange={e => setSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
          className="w-full accent-quantum-cyan"
          aria-label="Font size"
          data-mcp-tool="setFontSize"
          data-mcp-type="input"
          data-mcp-target="font-size-input"
          data-mcp-range="12,24"
          data-mcp-current={String(settings.fontSize)}
        />
        <p className="text-cloud/40 text-xs font-mono-tech text-center mt-2">{settings.fontSize}px</p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Accent Color</h2>
        <div className="flex gap-3">
          {accentColors.map(c => (
            <button
              key={c.value}
              onClick={() => setSettings(prev => ({ ...prev, accentColor: c.value }))}
              data-mcp-tool="setAccentColor"
              data-mcp-type="control"
              data-mcp-target={`accent-${c.name}`}
              data-mcp-state={settings.accentColor === c.value ? 'active' : 'inactive'}
              className={`w-10 h-10 rounded-xl border-2 transition-all ${
                settings.accentColor === c.value ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ background: c.value + '30' }}
              aria-label={`Accent color: ${c.name}`}
            >
              <div className="w-4 h-4 rounded-full mx-auto" style={{ background: c.value }} />
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
