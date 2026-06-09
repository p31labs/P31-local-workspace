// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// AchievementToast: slide-in notifications for unlocks
//
// Renders from the toast queue in gameStore.
// Auto-dismisses after duration (handled by store).
// CSS animations defined in index.css.
//
// WCD-23: Discovery variant — high-contrast reveal toast
// with molecule name in Inter + formula in JetBrains Mono
// + LOVE reward indicator.
// ═══════════════════════════════════════════════════════

import { useGameStore } from '../store/gameStore';
import { FormulaDisplay } from './FormulaDisplay';

export function AchievementToast() {
  const toasts = useGameStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2 w-[min(360px,calc(100vw-32px))] pointer-events-none">
      {toasts.slice(0, 3).map((toast) => {
        const age = Date.now() - toast.createdAt;
        const isExiting = age > toast.duration - 300;

        // WCD-23: Discovery variant — ephemeral floating text
        if (toast.variant === 'discovery') {
          return (
            <div
              key={toast.id}
              className={`
                flex items-center gap-3
                px-4 py-2
                max-w-[360px] w-full
                ${isExiting ? 'toast-exit' : 'discovery-enter'}
              `}
            >
              <span className="text-lg opacity-70">{toast.icon}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-white/80">
                  {toast.text}
                </span>
                {toast.subtext && (
                  <span className="text-xs text-[#FFD700]/50 font-mono">
                    <FormulaDisplay formula={toast.subtext} />
                  </span>
                )}
              </div>
              {toast.love != null && toast.love > 0 && (
                <span className="text-xs font-bold text-[#FFD700]/60 ml-auto whitespace-nowrap">
                  +{toast.love} LOVE
                </span>
              )}
            </div>
          );
        }

        // WCD-25: Hero goal variant — ephemeral floating text, slightly bigger
        if (toast.variant === 'hero') {
          return (
            <div
              key={toast.id}
              className={`
                flex items-center gap-3
                px-4 py-2
                max-w-[360px] w-full
                ${isExiting ? 'toast-exit' : 'discovery-enter'}
              `}
            >
              <span className="text-xl opacity-70">{toast.icon}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono text-[#FFD700]/30 uppercase tracking-wider">Hero Goal</span>
                <span className="text-base font-bold text-[#FFD700]/80">
                  {toast.text}
                </span>
                {toast.subtext && (
                  <span className="text-xs text-[#FFD700]/40 font-mono">
                    <FormulaDisplay formula={toast.subtext} />
                  </span>
                )}
              </div>
              {toast.love != null && toast.love > 0 && (
                <span className="text-sm font-bold text-[#FFD700]/60 ml-auto whitespace-nowrap">
                  +{toast.love} LOVE
                </span>
              )}
            </div>
          );
        }

        // Standard toast — ephemeral floating text
        return (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3
              px-4 py-2
              max-w-[360px] w-full
              ${isExiting ? 'toast-exit' : 'toast-enter-center'}
            `}
          >
            <span className="text-lg opacity-60">{toast.icon}</span>
            <div className="flex flex-col">
              <span className="text-sm text-white/70">
                {toast.text}
              </span>
              {toast.subtext && (
                <span className="text-xs text-white/40">
                  {toast.subtext}
                </span>
              )}
            </div>
            {toast.love != null && toast.love > 0 && (
              <span className="text-xs font-bold text-amber-400/50 ml-auto">
                +{toast.love} L.O.V.E.
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
