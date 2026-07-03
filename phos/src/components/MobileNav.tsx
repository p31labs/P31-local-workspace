import React from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  group: 'primary' | 'secondary';
}

interface MobileNavProps {
  surfaces: NavItem[];
  active: string;
  onSelect: (id: string) => void;
}

export default function MobileNav({ surfaces, active, onSelect }: MobileNavProps) {
  const visible = surfaces.filter(s => s.group === 'primary').slice(0, 5);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around h-16 px-2"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--phos-bg) 92%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--phos-border)',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {visible.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
            active === s.id
              ? 'text-[var(--phos-primary)]'
              : 'text-[var(--phos-text)] opacity-40 hover:opacity-70'
          }`}
          aria-label={s.label}
          aria-current={active === s.id ? 'page' : undefined}
        >
          <span className="text-lg leading-none" aria-hidden="true">{s.icon}</span>
          <span className="text-[9px] mt-1 font-sans tracking-wide">{s.label}</span>
        </button>
      ))}
    </nav>
  );
}
