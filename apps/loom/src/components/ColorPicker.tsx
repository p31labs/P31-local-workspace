import type { CSSProperties } from 'react';

interface ColorOption {
  /** Child-facing label. Not the token name — "Pink", not "iris". */
  name: string;
  /** The CSS custom property the swatch resolves to. */
  token: string;
}

interface ColorPickerProps {
  colors: readonly ColorOption[];
  onPick: (color: string) => void;
}

/**
 * The child's first authored choice. Three swatches — enough to feel like a
 * real decision, few enough that a 7-year-old isn't asked to rank.
 *
 * Each swatch is a real <button>: focusable, named for screen readers (the
 * label is visible, but the aria-label carries "Pick amber" so the *action*
 * is announced, not just the color), and 96px tall so it clears the 64px
 * child/elder target. The visual circle inside is 64px; the button's padding
 * extends the hit area — the small-visual-large-target pattern.
 */
export function ColorPicker({ colors, onPick }: ColorPickerProps) {
  return (
    <div className="color-picker" role="group" aria-label="Pick a color">
      {colors.map((c) => (
        <button
          key={c.name}
          type="button"
          className="color-swatch"
          style={{ '--swatch-color': `var(${c.token})` } as CSSProperties}
          onClick={() => onPick(c.name)}
          aria-label={`Pick ${c.name}`}
          data-agent-kind="action"
          data-agent-action="color.pick"
          data-agent-target={`color-${c.name.toLowerCase()}`}
          data-agent-danger="none"
          data-agent-confirm="never"
        >
          <span className="color-swatch-circle" aria-hidden="true" />
          <span className="color-swatch-label">{c.name}</span>
        </button>
      ))}
    </div>
  );
}