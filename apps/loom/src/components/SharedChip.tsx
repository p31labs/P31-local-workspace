interface SharedChipProps {
  /** Total events the human has committed. */
  count: number;
}

/**
 * A descriptive count of the child's own actions. Never a score, never a
 * streak, never a comparison. Reads as "N things with Lumi" — the child and
 * Lumi did them together, which is the point of the co-presence loop.
 * Singular/plural handled so "1 thing" doesn't read as broken.
 */
export function SharedChip({ count }: SharedChipProps) {
  if (count < 1) return null;
  const noun = count === 1 ? 'thing' : 'things';
  return (
    <div className="shared-chip" role="status" aria-live="polite">
      You&rsquo;ve done <span className="shared-chip-count">{count}</span> {noun} with Lumi
    </div>
  );
}