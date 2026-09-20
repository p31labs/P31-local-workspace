/**
 * Lumi — the agent's face.
 *
 * A warm, friendly orb the family can name and trust. No model identity — just
 * a character. Motion is transform-only and scaled by --motion-scale, so
 * prefers-reduced-motion is honored for free via the token, with no JS
 * branching.
 *
 * Two presentation flags, both owned by the caller:
 *   - `wave`    a one-shot arrival tilt (Chapter 1's "Lumi waves"); plays once
 *               and settles into the idle bob.
 *   - `greeting` the happy face (arch eyes + big smile) + a brighter glow,
 *               used once an action has been celebrated.
 */
export function Lumi({ wave = false, greeting = false }: { wave?: boolean; greeting?: boolean }) {
  const wrapClass = [
    'lumi-wrap',
    wave && 'lumi-wrap--wave',
    greeting && 'lumi-wrap--greeting',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapClass}>
      <span className="lumi-glow" aria-hidden="true" />
      <div className="lumi-anim">
        <svg
          className="lumi"
          viewBox="0 0 120 120"
          role="img"
          aria-label="Lumi, a friendly glowing orb"
        >
        <circle className="lumi-body" cx="60" cy="60" r="52" />

        <g className={greeting ? 'lumi-face--hidden' : 'lumi-face'}>
          <circle cx="42" cy="56" r="5" fill="var(--p31-bg, #1a120b)" />
          <circle cx="78" cy="56" r="5" fill="var(--p31-bg, #1a120b)" />
          <path
            d="M 40 76 Q 60 90 80 76"
            stroke="var(--p31-bg, #1a120b)"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
          />
        </g>

        <g className={greeting ? 'lumi-face' : 'lumi-face--hidden'}>
          <path
            d="M 34 52 Q 42 44 50 52"
            stroke="var(--p31-bg, #1a120b)"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 70 52 Q 78 44 86 52"
            stroke="var(--p31-bg, #1a120b)"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 36 74 Q 60 96 84 74"
            stroke="var(--p31-bg, #1a120b)"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>
      </div>
    </div>
  );
}