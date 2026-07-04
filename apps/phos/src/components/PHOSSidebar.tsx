import React from 'react';

interface SurfaceItem {
  id: string;
  label: string;
  icon: string;
  group?: string;
  href?: string;
}

interface PHOSSidebarProps {
  surfaces: SurfaceItem[];
  active: string;
  onSelect: (id: string) => void;
  spoons: number;
}

export default function PHOSSidebar({ surfaces, active, onSelect, spoons }: PHOSSidebarProps) {
  const isCrisis = spoons === 0;
  const bottom = surfaces.filter(s => s.id === 'CHAT' || s.id === 'DASHBOARD' || s.id === 'SETTINGS');
  const primary = surfaces.filter(s =>
    s.id !== 'CHAT' && s.id !== 'DASHBOARD' && s.id !== 'SETTINGS' && s.group === 'primary'
  );

  return (
    <nav
      className="fixed left-3 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center gap-1 py-3 px-1.5 rounded-2xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--phos-bg) 85%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--phos-border)',
        transition: 'opacity 700ms',
        opacity: isCrisis ? 0.2 : 1,
      }}
      role="navigation"
      aria-label="Surface navigation"
    >
      {bottom.map(s => (
        <button
          key={s.id}
          onClick={() => s.href ? window.location.href = s.href : onSelect(s.id)}
          className="flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-200"
          style={{
            color: active === s.id ? 'var(--phos-primary)' : 'var(--phos-text)',
            opacity: active === s.id ? 1 : 0.35,
            backgroundColor: active === s.id ? 'color-mix(in srgb, var(--phos-primary) 10%, transparent)' : 'transparent',
          }}
          aria-label={s.label}
          aria-current={active === s.id ? 'page' : undefined}
          title={s.label}
        >
          <span className="text-base" aria-hidden="true">{s.icon}</span>
        </button>
      ))}

      <div className="w-5 h-px my-1" style={{ backgroundColor: 'var(--phos-border)' }} />

      {primary.map(s => (
        <button
          key={s.id}
          onClick={() => s.href ? window.location.href = s.href : onSelect(s.id)}
          className="flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-200"
          style={{
            color: active === s.id ? 'var(--phos-primary)' : 'var(--phos-text)',
            opacity: active === s.id ? 1 : 0.35,
            backgroundColor: active === s.id ? 'color-mix(in srgb, var(--phos-primary) 10%, transparent)' : 'transparent',
          }}
          aria-label={s.label}
          aria-current={active === s.id ? 'page' : undefined}
          title={s.label}
        >
          <span className="text-base" aria-hidden="true">{s.icon}</span>
        </button>
      ))}
    </nav>
  );
}
