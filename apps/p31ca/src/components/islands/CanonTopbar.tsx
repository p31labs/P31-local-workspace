import React, { useState, useEffect, useRef } from 'react';
import { NAV_ATOMS, ACT_NAMES } from '../../lib/nav';
import type { ActId, NavAtom } from '../../lib/nav';
import { useThemeStore, type ThemeId } from '@p31/shell-chrome/stores';
import { loadIdentity } from '@p31/shared-identity';

interface CanonTopbarProps {
  currentPath?: string;
}

const THEME_SWATCH: Record<ThemeId, string> = {
  garden: '#22c55e',
  ocean: '#06b6d4',
  aurora: '#a78bfa',
  zen: '#9ca3af',
  volt: '#f59e0b',
};

const WORLD_NAMES: Record<ThemeId, string> = {
  garden: 'Garden',
  ocean: 'Ocean',
  aurora: 'Aurora',
  zen: 'Zen',
  volt: 'Volt',
};

export const CanonTopbar: React.FC<CanonTopbarProps> = ({ currentPath: propPath = '/' }) => {
  const [theme, setTheme] = useState<ThemeId>('ocean');
  const [spoons, setSpoonsState] = useState(3);
  const [resolvedPath, setResolvedPath] = useState(propPath);
  const [labOpen, setLabOpen] = useState(false);
  const [deviceDid, setDeviceDid] = useState<string | null>(null);

  useEffect(() => {
    try {
      const identity = loadIdentity();
      if (identity?.did) setDeviceDid(identity.did);
    } catch {
      // no identity on this device — keep showing "Sign In"
    }
  }, []);
  const topbarRef = useRef<HTMLElement>(null);
  const labBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem('p31:spoons') || '3', 10);
    const level = Number.isFinite(stored) ? stored : 3;
    setSpoonsState(level);
    document.documentElement.setAttribute('data-spoons', String(level));

    useThemeStore.getState().syncFromDom();
    useThemeStore.getState().applyTheme();
    setTheme(useThemeStore.getState().theme);

    const themeUnsubscribe = useThemeStore.subscribe((s) => {
      if (s.theme !== theme) setTheme(s.theme);
    });

    if (typeof window !== 'undefined') {
      setResolvedPath(window.location.pathname);
      const onPathChange = () => setResolvedPath(window.location.pathname);
      window.addEventListener('p31:path-change', onPathChange);

      const onOutsideClick = (e: MouseEvent) => {
        if (labOpen && labBtnRef.current && !labBtnRef.current.contains(e.target as Node)) {
          const target = e.target as Element;
          if (!target.closest('.posner-lab-dropdown')) setLabOpen(false);
        }
      };
      document.addEventListener('click', onOutsideClick);

      return () => {
        themeUnsubscribe();
        window.removeEventListener('p31:path-change', onPathChange);
        document.removeEventListener('click', onOutsideClick);
      };
    }
    return () => themeUnsubscribe;
  }, []);

  const currentPath = typeof window !== 'undefined' ? resolvedPath : propPath;

  const setSpoons = (level: number) => {
    setSpoonsState(level);
    localStorage.setItem('p31:spoons', String(level));
    document.documentElement.setAttribute('data-spoons', String(level));
  };

  const handleThemeCycle = () => {
    const nextTheme = useThemeStore.getState().cycleTheme();
    const nextName = WORLD_NAMES[nextTheme];
    window.dispatchEvent(new CustomEvent('p31:toast', {
      detail: { message: `🌎 World shifted to ${nextName}`, duration: 2000 },
    }));
  };

  const renderAtomsByAct = (act: ActId) => {
    return NAV_ATOMS.filter((atom) => atom.act === act).map((atom) => {
      const isActive = currentPath === atom.href || (atom.href !== '/' && currentPath.startsWith(atom.href));
      return (
              <a
            key={atom.id}
            href={atom.href}
            aria-label={`${atom.label} (${atom.index} of ${NAV_ATOMS.length})`}
            className="posner-atomic relative flex items-center gap-[1px] px-[4px] py-[2px] font-mono rounded-md transition-all duration-150 whitespace-nowrap"
            style={{
              fontSize: '11px',
              color: isActive ? 'var(--p31-accent)' : 'var(--p31-text-secondary)',
              background: isActive ? 'rgba(0, 240, 255, 0.06)' : 'transparent',
              boxShadow: 'none',
            }}
          >
          <span
            className="block rounded-full transition-all duration-150"
            style={{
              width: 5,
              height: 5,
              background: isActive ? 'var(--p31-accent)' : 'rgba(255, 255, 255, 0.25)',
              boxShadow: 'none',
            }}
          />
          <span style={{ fontWeight: isActive ? 600 : 400 }}>{atom.label}</span>
        </a>
      );
    });
  };

  const SpoonIcon = () => (
    <svg viewBox="0 0 200 200" width="14" height="14" aria-hidden="true">
      <path d="M100 30 Q96 80 100 110 Q100 120 100 145" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="100" cy="145" rx="16" ry="26" fill="currentColor" />
      <circle cx="100" cy="30" r="6" fill="currentColor" />
    </svg>
  );

  return (
    <>
      <style>{`
        .posner-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          height: 48px;
          background: rgba(10, 10, 15, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          transition: border-color 0.2s ease, background-color 0.2s ease;
          font-size: 14px !important;
          line-height: 1;
        }
        .posner-topbar:hover {
          border-bottom-color: rgba(255, 255, 255, 0.12);
        }
        @media (min-width: 1024px) {
          .posner-topbar {
            height: 56px;
            padding: 0 24px;
          }
        }
        .posner-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.03);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          flex: 1;
          min-width: 0;
          font-size: 11px !important;
          justify-content: center;
        }
        .posner-nav * {
          font-size: 11px !important;
        }
        .posner-nav::-webkit-scrollbar {
          display: none;
        }
        .posner-divider {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.12);
          margin: 0 6px;
          flex-shrink: 0;
        }
        .posner-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: var(--p31-accent);
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.02em;
          flex-shrink: 0;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
        }
        .posner-brand:focus {
          outline: 2px solid var(--p31-accent);
          outline-offset: 2px;
        }
        .posner-brand-mark {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(0, 240, 255, 0.3);
          background: rgba(0, 240, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
        }
        .posner-theme-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .posner-brand:hover .posner-theme-dot {
          width: 8px;
          height: 8px;
          box-shadow: 0 0 6px currentColor;
        }
        .posner-right-controls {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .posner-lab-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          font-size: 12px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: var(--p31-text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          white-space: nowrap;
        }
        .posner-lab-btn:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--p31-text);
          background: rgba(255, 255, 255, 0.06);
        }
        .posner-control-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 10px;
          font-size: 12px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: var(--p31-text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          white-space: nowrap;
        }
        .posner-control-btn:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--p31-text);
          background: rgba(255, 255, 255, 0.06);
        }
        .posner-spoon-dial {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 3px 5px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.25);
        }
        .posner-spoon-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--p31-text-tertiary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          padding: 0;
        }
        .posner-spoon-btn:hover {
          color: var(--p31-text);
          background: rgba(255, 255, 255, 0.08);
        }
        .posner-spoon-btn.active {
          background: var(--p31-accent);
          color: #000;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
        }
        .posner-spoon-crisis {
          font-size: 14px;
          width: 24px;
          height: 24px;
        }
        /* Spoon-aware: hide at crisis (0) and low (1) */
        [data-spoons='0'] .posner-topbar,
        [data-spoons='0'] .posner-topbar *,
        [data-spoons='1'] .posner-topbar,
        [data-spoons='1'] .posner-topbar * {
          display: none !important;
        }
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .posner-topbar * {
            transition-duration: 0ms !important;
            animation-duration: 0ms !important;
          }
        }
      `}</style>

      <header ref={topbarRef} className="posner-topbar" role="banner">
        {/* Brand + Theme Cycle Dot */}
        <button
          onClick={handleThemeCycle}
          className="posner-brand"
          title="Click to cycle theme"
          aria-label="P31 Labs — Home. Click to cycle theme."
          type="button"
        >
          <span className="posner-brand-mark">31</span>
          <span className="hidden sm:inline">P31 LABS</span>
          <span
            className="posner-theme-dot"
            style={{ background: THEME_SWATCH[theme] }}
            aria-hidden="true"
          />
        </button>

        {/* 9-Atom Nav (always visible, horizontally scrollable on mobile) */}
        <nav className="posner-nav" role="navigation" aria-label="Primary navigation">
          <div className="flex items-center gap-[1px]">
            {renderAtomsByAct('to')}
          </div>
          <div className="posner-divider" aria-hidden="true" />
          <div className="flex items-center gap-[1px]">
            {renderAtomsByAct('in')}
          </div>
          <div className="posner-divider" aria-hidden="true" />
          <div className="flex items-center gap-[1px]">
            {renderAtomsByAct('through')}
          </div>
        </nav>

        {/* Right Controls */}
        <div className="posner-right-controls">
          <div className="posner-spoon-dial" role="radiogroup" aria-label="Spoon level">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                className={`posner-spoon-btn${spoons === level ? ' active' : ''}`}
                onClick={() => setSpoons(level)}
                role="radio"
                aria-checked={spoons === level}
                aria-label={`Spoon level ${level}`}
              >
                <SpoonIcon />
              </button>
            ))}
            <button
              type="button"
              className={`posner-spoon-btn posner-spoon-crisis${spoons === 0 ? ' active' : ''}`}
              onClick={() => setSpoons(0)}
              role="radio"
              aria-checked={spoons === 0}
              aria-label="Sensory rest mode"
            >
              🧘
            </button>
          </div>
          {deviceDid ? (
            <a
              href="/love"
              className="posner-control-btn"
              style={{ color: 'var(--p31-accent)', fontWeight: 600 }}
              title="Connected as device DID — open your LOVE ledger"
            >
              <span aria-hidden="true">🔑</span>{' '}
              {`${deviceDid.slice(0, 8)}…${deviceDid.slice(-6)}`}
            </a>
          ) : (
            <a href="/signin" className="posner-control-btn" style={{ color: 'var(--p31-text)', fontWeight: 600 }}>
              Sign In
            </a>
          )}
          <a
            href="https://github.com/p31labs"
            target="_blank"
            rel="noopener noreferrer"
            className="posner-control-btn"
            aria-label="GitHub"
            title="P31 Labs on GitHub"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.9 18.3 5.2 18.3 5.2.6 1.6.2 2.8.1 3.1.8-.8 1.2-1.8 1.2-3.1 0-4.4-2.7-5.4-5.3-5.7.4-.4.8-1.1.8-2.2v3.2C17.6 6.5 13.7 1.9 12 .5z" />
            </svg>
          </a>
          <div className="posner-lab-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
             <button
               ref={labBtnRef}
               type="button"
               className="posner-lab-btn"
               title="System status & lab"
               aria-haspopup="true"
               aria-expanded={labOpen}
               onClick={() => setLabOpen(!labOpen)}
             >
               Lab
               <span style={{ marginLeft: '4px', fontSize: '10px' }}>▾</span>
             </button>
             <div
               className={`posner-lab-menu ${labOpen ? 'open' : 'closed'}`}
               role="menu"
               style={{
                 position: 'absolute',
                 top: '100%',
                 right: 0,
                 marginTop: '6px',
                 minWidth: '120px',
                 background: 'rgba(10, 10, 15, 0.9)',
                 backdropFilter: 'blur(12px)',
                 border: '1px solid rgba(255,255,255,0.12)',
                 borderRadius: '10px',
                 padding: '4px',
                zIndex: 51,
                opacity: labOpen ? 1 : 0,
                visibility: labOpen ? 'visible' : 'hidden',
                pointerEvents: labOpen ? 'auto' : 'none',
                transition: 'opacity 0.12s ease, visibility 0.12s ease',
              }}
            >
              <a
                  href="/system"
                  className="posner-lab-menu-item"
                  role="menuitem"
                  style={{
                    display: 'block',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--p31-text-secondary)',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(0,240,255,0.08)'; (e.target as HTMLElement).style.color = 'var(--p31-text)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = 'var(--p31-text-secondary)'; }}
                  onClick={() => setLabOpen(false)}
                >
                  System
                </a>
                <a
                  href="/treasury"
                  className="posner-lab-menu-item"
                  role="menuitem"
                  style={{
                    display: 'block',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--p31-text-secondary)',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(0,240,255,0.08)'; (e.target as HTMLElement).style.color = 'var(--p31-text)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = 'var(--p31-text-secondary)'; }}
                  onClick={() => setLabOpen(false)}
                >
                  Treasury
                </a>
                <a
                  href="/arcade"
                  className="posner-lab-menu-item"
                  role="menuitem"
                  style={{
                    display: 'block',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--p31-text-secondary)',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(0,240,255,0.08)'; (e.target as HTMLElement).style.color = 'var(--p31-text)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = 'var(--p31-text-secondary)'; }}
                  onClick={() => setLabOpen(false)}
                >
                  Arcade
                </a>
            </div>
            <div
              className="posner-lab-menu"
              role="menu"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                minWidth: '120px',
                background: 'rgba(10, 10, 15, 0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '4px',
                zIndex: 51,
                opacity: labOpen ? 1 : 0,
                visibility: labOpen ? 'visible' : 'hidden',
                pointerEvents: labOpen ? 'auto' : 'none',
                transition: 'opacity 0.12s ease, visibility 0.12s ease',
              }}
            >
              <a
                href="/system"
                className="posner-lab-menu-item"
                role="menuitem"
                style={{
                  display: 'block',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: 'var(--p31-text-secondary)',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(0,240,255,0.08)'; (e.target as HTMLElement).style.color = 'var(--p31-text)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = 'var(--p31-text-secondary)'; }}
                onClick={() => setLabOpen(false)}
              >
                System
              </a>
              <a
                href="/treasury"
                className="posner-lab-menu-item"
                role="menuitem"
                style={{
                  display: 'block',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: 'var(--p31-text-secondary)',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(0,240,255,0.08)'; (e.target as HTMLElement).style.color = 'var(--p31-text)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = 'var(--p31-text-secondary)'; }}
                onClick={() => setLabOpen(false)}
              >
                Treasury
              </a>
              <a
                href="/arcade"
                className="posner-lab-menu-item"
                role="menuitem"
                style={{
                  display: 'block',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: 'var(--p31-text-secondary)',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(0,240,255,0.08)'; (e.target as HTMLElement).style.color = 'var(--p31-text)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = 'var(--p31-text-secondary)'; }}
                onClick={() => setLabOpen(false)}
              >
                Arcade
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default CanonTopbar;
