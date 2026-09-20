interface OrbProps {
  /** Fires on click/tap or Enter/Space. The caller commits the focus event. */
  onTap: () => void;
  /** True while the field is responding — the orb glows and scales up. */
  active?: boolean;
  /** True once tapped and the celebration has settled — the orb dims, stays visible. */
  spent?: boolean;
  /** Human-readable name for screen readers. */
  label?: string;
}

/**
 * The field orb Chapter 2 ("Make something happen") asks the child to tap.
 *
 * A button, not a div with a click handler: it needs keyboard focus, an
 * accessible name, and a 96px touch target (well above the 48px floor and
 * the 64px child/elder target). The visual circle is drawn with a radial
 * gradient on a div (not an SVG) so its pulse/scale/glow composites on the
 * GPU, and the hit area is the full button — the "small visual, large hit
 * area" pattern from the touch research.
 */
export function Orb({ onTap, active = false, spent = false, label = 'Glowing orb' }: OrbProps) {
  const className = ['orb', active && 'orb--active', spent && 'orb--spent']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      onClick={onTap}
      aria-label={label}
      data-agent-kind="action"
      data-agent-action="loom.focus"
      data-agent-target="orb"
      data-agent-danger="none"
      data-agent-confirm="never"
      disabled={spent}
    >
      <span className="orb-visual" aria-hidden="true" />
      <span className="orb-glow" aria-hidden="true" />
    </button>
  );
}