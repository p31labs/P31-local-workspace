/**
 * Lumi — the agent's face.
 *
 * A warm, friendly orb the family can name and trust. No model identity — just
 * a character. Motion is the CSS bobbing animation, which respects
 * --motion-scale and prefers-reduced-motion via the global rules.
 */
export function Lumi() {
  return (
    <svg className="lumi" viewBox="0 0 120 120" role="img" aria-label="Lumi">
      <circle cx="60" cy="60" r="54" fill="var(--p31-accent, #fbbf24)" />
      <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255, 255, 255, 0.28)" strokeWidth="3" />
      <circle cx="45" cy="52" r="7" fill="var(--p31-bg, #1a120b)" />
      <circle cx="75" cy="52" r="7" fill="var(--p31-bg, #1a120b)" />
      <path d="M 43 72 Q 60 84 77 72" stroke="var(--p31-bg, #1a120b)" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
