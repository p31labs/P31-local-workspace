/**
 * WCD-08 Phase A: TopBar — Navigation, title, and LOVE counter.
 * 
 * Left:   Jitterbug nav trigger (collapsed tetrahedron icon)
 * Center: "BONDING" title
 * Right:  LoveCounter (from CWP-03 Rev B, positioning stripped)
 * 
 * The JitterbugNavigator full animation opens as a modal overlay
 * on tap — that's a SEPARATE WCD. Phase A just shows the icon.
 */

import { GlassPanel } from './GlassPanel';
import { useEconomyStore } from '../genesis/economyStore';

// ─── Inline LoveCounter (stripped of absolute positioning) ──────
// CWP-03 Rev B's LoveCounter used position: absolute; top: 12; right: 12.
// In The Cockpit, it's a flex child. Positioning handled by TopBar.

function LoveCounter() {
  const totalLove = useEconomyStore(s => s.totalLove);
  const currentStreak = useEconomyStore(s => s.currentStreak);
  const hasHydrated = useEconomyStore(s => s._hasHydrated);

  if (!hasHydrated) return <div className="w-20" />; // placeholder during hydration

  return (
    <div className="flex items-center gap-2 font-mono text-lg font-bold text-[#FFD700]">
      <span className="text-xl">💛</span>
      <span>{totalLove.toFixed(1)}</span>
      {currentStreak > 1 && (
        <span className="text-xs opacity-50">🔥{currentStreak}d</span>
      )}
    </div>
  );
}

// ─── Nav Icon (collapsed tetrahedron) ───────────────────────────

function NavTrigger({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center
                 rounded-xl border border-white/[0.08]
                 hover:border-white/[0.15] active:scale-95
                 transition-all duration-150"
      aria-label="Open navigation"
    >
      {/* Minimal tetrahedron glyph — phosphor green */}
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 3L17 16H3Z"
          stroke="#00FF88"
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity="0.6"
        />
        {/* Center dot — the phosphorus atom */}
        <circle cx="10" cy="12" r="1.5" fill="#00FF88" opacity="0.4" />
      </svg>
    </button>
  );
}

// ─── TopBar ─────────────────────────────────────────────────────

interface TopBarProps {
  /** Callback when nav trigger is tapped. Opens Jitterbug overlay. */
  onNavOpen?: () => void;
  /** Override title text. Default: "BONDING" */
  title?: string;
}

export function TopBar({ onNavOpen, title = 'BONDING' }: TopBarProps) {
  return (
    <GlassPanel className="h-full flex items-center justify-between px-4 gap-3">
      <NavTrigger onClick={onNavOpen} />

      <span className="font-mono text-xs font-medium text-white/30 tracking-[0.15em] uppercase select-none">
        {title}
      </span>

      <LoveCounter />
    </GlassPanel>
  );
}
