import { useCallback, useState, type CSSProperties } from 'react';

interface MadeArtifactProps {
  /** Child-facing color name — "Amber", not "--p31-accent". */
  colorName: string;
  /** The token the color resolves to. */
  colorToken: string;
  /** Fires when the child taps their artifact. Proves it works. */
  onTap: () => void;
  /** Elder presentation: no hover lift, no press-shrink, a gentler pulse.
   *  The artifact still commits a focus on tap — nothing about the
   *  interaction changes, only the amount of movement it asks of the eye. */
  calm?: boolean;
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
export function MadeArtifact({ colorName, colorToken, onTap, calm = false }: MadeArtifactProps) {
  const [pulsed, setPulsed] = useState(false);

  const handleTap = useCallback(() => {
    setPulsed(true);
    onTap();
  }, [onTap]);

  const handlePulseEnd = useCallback(() => setPulsed(false), []);

  const btnClass = [
    'made-artifact-btn',
    pulsed && 'made-artifact-btn--pulsed',
    calm && 'made-artifact-btn--calm',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`made-artifact ${calm ? 'made-artifact--calm' : ''}`}>
      <button
        type="button"
        className={btnClass}
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
        {calm ? `The ${colorName.toLowerCase()} button` : `Our ${colorName.toLowerCase()} button`}
      </span>
    </div>
  );
}