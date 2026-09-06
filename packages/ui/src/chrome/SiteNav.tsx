/**
 * @file SiteNav — Canonical nav bar for P31 Astro sites (phosphorus31 + p31ca).
 *
 * Shared React island. Uses the canonical design system:
 *   - candy-pill header (phosphorus green translucent, cyan outline, glow shadow)
 *   - Crown (unified brand glyph)
 *   - SpoonDial mode="pips" (6 pip dots + crisis toggle)
 *   - var(--p31-nav-h) height
 * Identical visual output on both sites.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crown } from '@p31/design-core/generated/Crown';
import { SpoonDial } from './SpoonDial';

export interface SiteNavLink {
  href: string;
  label: string;
  external?: boolean;
}

export interface SiteNavProps {
  navLinks: SiteNavLink[];
  bondingHref?: string;
  bondingLabel?: string;
  brand?: 'p31ca' | 'phosphorus' | 'phos' | 'willow';
  onNavClick?: (href: string) => void;
  headerActions?: React.ReactNode;
  spoonMode?: 'compact' | 'icon' | 'full' | 'pips' | 'button';
  showAuth?: boolean;
  showMenu?: boolean;
  gitRepoUrl?: string;
}

const STATS = [
  { value: '4,200+', label: 'Tests' },
  { value: '22', label: 'Papers' },
  { value: '36', label: 'MCP Tools' },
];

function handleLink(href: string, onNavClick: ((href: string) => void) | undefined) {
  if (onNavClick) onNavClick(href);
}

export function SiteNav({ navLinks, bondingHref = 'https://bonding.p31ca.org', bondingLabel = 'BONDING', brand = 'p31ca', onNavClick, headerActions, spoonMode = 'icon', showAuth = true, showMenu = true, gitRepoUrl = 'https://github.com/p31labs' }: SiteNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [spoons, setSpoons] = useState(3);
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isLanding = brand === 'p31ca' || brand === 'phosphorus';
  const isWorkspace = brand === 'phos';
  const isConversation = brand === 'willow';

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const s = parseInt(localStorage.getItem('p31:spoons') || '3', 10);
    setSpoons(s);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previouslyActive = document.activeElement;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !focusable.length) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    drawer.addEventListener('keydown', handleKeyDown);
    return () => {
      drawer.removeEventListener('keydown', handleKeyDown);
      (previouslyActive as HTMLElement | null)?.focus?.();
    };
  }, [menuOpen]);

  const handleSetSpoons = (level: number) => {
    localStorage.setItem('p31:spoons', String(level));
    document.documentElement.setAttribute('data-spoons', String(level));
    const themeMap: Record<number, string> = { 0: 'crisis', 1: 'sanctuary', 2: 'sanctuary', 3: 'bridge', 4: 'quantum', 5: 'quantum' };
    document.documentElement.setAttribute('data-theme', themeMap[level] || 'quantum');
    if ((window as any).applySpoons) (window as any).applySpoons(level);
    else if ((window as any).__p31starfield) (window as any).__p31starfield.setSpoons(level);
    setSpoons(level);
  };

  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <div className="sticky top-0 left-0 right-0 z-[var(--p31-z-nav,40)] shrink-0">
      <div className="flex justify-center px-4 pt-3">
        <header
          className="flex items-center justify-between w-full max-w-[1440px] mx-auto px-4 py-1 relative"
          style={{
            background: isLanding
              ? 'var(--p31-nav-bg, rgba(57,255,20,0.12))'
              : 'var(--p31-surface, rgba(18,18,26,0.96))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: isLanding
              ? '1px solid var(--p31-nav-border, rgba(0,240,255,0.8))'
              : '1px solid var(--p31-glass-border, rgba(255,255,255,0.08))',
            borderRadius: '16px',
            boxShadow: isLanding
              ? 'var(--p31-nav-glow, 0 0 30px rgba(0,240,255,0.25)), var(--p31-nav-inset, inset 0 0 20px rgba(57,255,20,0.15))'
              : 'var(--p31-glass-shadow, 0 8px 32px rgba(0,0,0,0.15))',
          }}
        >
          <a href="/" style={{ textDecoration: 'none' }} className="flex items-center gap-2 shrink-0">
            <Crown size="xs" brand={brand} inverted={brand === 'phosphorus' || brand === 'willow'} />
            <span className="text-base font-bold tracking-tight hidden sm:inline" style={{ color: 'var(--p31-text-primary)' }}>
              {isLanding ? 'P31 Labs' : brand === 'phos' ? 'PHOS' : 'WILLOW'}
            </span>
          </a>

          {/* Mobile: compact SpoonDial. Desktop: configured mode */}
          <div className="flex md:hidden items-center justify-center flex-1 px-2"
            data-mcp-tool="setSpoonLevel"
            data-mcp-type="control"
            data-mcp-range="0,5"
            data-mcp-current={spoons}
          >
            <SpoonDial spoons={spoons} setSpoons={handleSetSpoons} mode="compact" fullscreen={false} />
          </div>
          <div className="hidden md:flex items-center justify-center flex-1 px-4"
            data-mcp-tool="setSpoonLevel"
            data-mcp-type="control"
            data-mcp-range="0,5"
            data-mcp-current={spoons}
          >
            <SpoonDial spoons={spoons} setSpoons={handleSetSpoons} mode={spoonMode} fullscreen={false} />
          </div>

          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {navLinks.map((n) => {
              const active = isActive(n.href);
              const linkClass = active
                ? 'px-3 py-2 rounded-lg text-sm font-medium transition-colors text-[var(--p31-accent)] bg-white/5 min-h-[48px] flex items-center'
                : 'px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white/70 hover:text-[var(--p31-accent)] min-h-[48px] flex items-center';
              return (
                <a
                  key={`d-${n.href}${n.label}`}
                  href={n.href}
                  target={n.external ? '_blank' : undefined}
                  rel={n.external ? 'noopener noreferrer' : undefined}
                  className={linkClass}
                  style={{ textDecoration: 'none' }}
                  onClick={(e) => { if (onNavClick) { e.preventDefault(); handleLink(n.href, onNavClick); } }}
                  data-mcp-tool="navigate"
                  data-mcp-href={n.href}
                  data-mcp-external={n.external ? 'true' : 'false'}
                >
                  {n.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {headerActions}

            {gitRepoUrl && (
              <a
                href={gitRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-white/10 text-white/80 hover:text-[var(--p31-accent)] hover:border-[var(--p31-accent)] transition-colors hidden sm:inline-flex"
                aria-label="GitHub"
                style={{ textDecoration: 'none' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
            )}

            {showAuth && (
              <a
                href="/auth/signin"
                className="inline-flex items-center px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:text-[var(--p31-accent)] hover:border-[var(--p31-accent)] transition-colors text-sm hidden sm:inline-flex"
                style={{ textDecoration: 'none' }}
              >
                Sign In
              </a>
            )}

            {showMenu && (
              <button
                className="p-2.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/5 transition-colors md:hidden min-h-[48px] min-w-[48px] flex items-center justify-center"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                data-mcp-tool="toggleDrawer"
                data-mcp-state={menuOpen ? 'open' : 'closed'}
                data-mcp-target="nav-drawer"
              >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect y="4" width="20" height="2" rx="1" /><rect y="9" width="20" height="2" rx="1" /><rect y="14" width="20" height="2" rx="1" /></svg>
              )}
            </button>
            )}
          </div>
        </header>
      </div>

      {/* Stats strip — marketing sites only */}
      {isLanding && (
        <div className="hidden md:flex items-center justify-center gap-6 py-2">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--p31-accent)] tabular-nums">{stat.value}</span>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Off-canvas drawer — portaled to document.body on client */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-[var(--p31-z-nav-drawer,50)] transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          aria-hidden={!menuOpen}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          {/* Drawer panel */}
          <div
            ref={drawerRef}
            className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] flex flex-col transition-transform duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{
              background: 'var(--p31-surface)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderLeft: '1px solid var(--p31-glass-border, rgba(255,255,255,0.08))',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-end p-4">
              <button
                ref={closeButtonRef}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation"
                data-mcp-tool="closeDrawer"
                data-mcp-target="nav-drawer"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 pb-8" style={{ overscrollBehavior: 'contain' }}>
              {navLinks.map((n) => {
                const active = isActive(n.href);
                const linkClass = active
                  ? 'block py-3 px-4 rounded-xl font-medium text-sm transition-colors text-[var(--p31-accent)] bg-white/5 min-h-[48px] flex items-center'
                  : 'block py-3 px-4 rounded-xl font-medium text-sm transition-colors text-white/80 hover:text-[var(--p31-accent)] hover:bg-white/5 min-h-[48px] flex items-center';
                return (
                  <a
                    key={`m-${n.href}${n.label}`}
                    href={n.href}
                    target={n.external ? '_blank' : undefined}
                    rel={n.external ? 'noopener noreferrer' : undefined}
                    className={linkClass}
                    style={{ textDecoration: 'none' }}
                    onClick={(e) => {
                      setMenuOpen(false);
                      if (onNavClick) { e.preventDefault(); handleLink(n.href, onNavClick); }
                    }}
                  >
                    {n.label}
                  </a>
                );
              })}
              {showAuth && (
                <>
                  <div className="h-px bg-white/10 my-3 mx-2" />
                  <a
                    href="/auth/signin"
                    className="block py-3 px-4 rounded-xl text-sm font-semibold text-[var(--p31-accent)] bg-white/5 hover:bg-white/10 transition-colors"
                    style={{ textDecoration: 'none' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign In
                  </a>
                </>
              )}
            </nav>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default SiteNav;
