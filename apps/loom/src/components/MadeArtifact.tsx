import { useCallback, useState, type CSSProperties } from 'react';

interface MadeArtifactProps {
  /** Child-facing color name — "Amber", not "--p31-accent". */
  colorName: string;
  /** The token the color resolves to. */
  colorToken: string;
  /** Fires when the child taps their artifact. Proves it works. */
  onTap: () => void;
}

/**
 * The thing they made together. A real button — tappable, focusable, alive —
 * in the color the child chose, with the shape Lumi proposed. Tapping it
 * proves the artifact is real; the pulse is the proof, not a flourish.
 *
 * Deliberately a *button* and not a rendered preview image: a 10-year-old
 * can feel the difference between "here's a picture of what we made" and
 * "here's the thing — go on, tap it."
 */
export function MadeArtifact({ colorName, colorToken, onTap }: MadeArtifactProps) {
  const [pulsed, setPulsed] = useState(false);

  const handleTap = useCallback(() => {
    setPulsed(true);
    onTap();
  }, [onTap]);

  const handlePulseEnd = useCallback(() => setPulsed(false), []);

  return (
    <div className="made-artifact">
      <button
        type="button"
        className={`made-artifact-btn ${pulsed ? 'made-artifact-btn--pulsed' : ''}`}
        style={{ '--artifact-color': `var(${colorToken})` } as CSSProperties}
        onClick={handleTap}
        onAnimationEnd={pulsed ? handlePulseEnd : undefined}
        aria-label={`Our ${colorName.toLowerCase()} button. Tap it.`}
        data-agent-kind="action"
        data-agent-action="artifact.tap"
        data-agent-target="artifact"
        data-agent-danger="none"
        data-agent-confirm="never"
      >
        Hello!
      </button>
      <span className="made-artifact-label" aria-hidden="true">
        Our {colorName.toLowerCase()} button
      </span>
    </div>
  );
}