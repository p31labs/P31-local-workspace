/**
 * WCD-08 Phase A: AchievementToast — Glassmorphism achievement notification.
 * 
 * Rendered inside CockpitLayout's toast layer (z-50, pointer-events: none).
 * Auto-dismisses after 3 seconds via CSS animation.
 * 
 * Sonnet: Wire to the existing achievement system. When an achievement fires,
 * set visible=true with the achievement data. After animation completes (3s),
 * set visible=false. Queue multiple toasts — show one at a time.
 */

interface AchievementToastProps {
  /** Achievement display name */
  title: string;
  /** Optional description text */
  description?: string;
  /** Controls visibility + triggers animation */
  visible: boolean;
}

export function AchievementToast({ title, description, visible }: AchievementToastProps) {
  if (!visible) return null;

  return (
    <div
      className="bg-black/60 backdrop-blur-[16px]
                 border border-[#00FF88]/20
                 rounded-2xl px-5 py-3.5 max-w-[320px] w-full
                 animate-toast-slide"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden="true">🏆</span>
        <div className="min-w-0">
          <div className="font-sans text-[15px] font-semibold text-white/90 leading-tight">
            {title}
          </div>
          {description && (
            <div className="font-sans text-xs text-white/45 mt-1 leading-relaxed">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
