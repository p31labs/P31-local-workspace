import { seededIndex } from "./amusement-seed";
import { createStandardDeck, type Card } from "./quantum-deck-local";
import { getGrandfatherPhase01, TRIM_HZ_MIN } from "./p31-quantum-clock-constants";

function utcYmdHourMinuteBucket(t: Date): string {
  return `${t.toISOString().slice(0, 13)}:${Math.floor(t.getUTCMinutes() / 15)}`;
}

/**
 * Deterministic “tick” card: grandfather phase + UTC bucket seed the index
 * into the standard deck order (quantum-deck parity, no CSPRNG).
 */
export function getQuantumClockTickCard(nowMs: number): {
  card: Card;
  phase01: number;
  fHz: number;
  seed: string;
} {
  const fHz = TRIM_HZ_MIN;
  const { phase01 } = getGrandfatherPhase01(nowMs, fHz);
  const t = new Date(nowMs);
  const bucket = utcYmdHourMinuteBucket(t);
  const phaseSlice = Math.floor(phase01 * 256);
  const seed = `qclock-tick:${bucket}:φ${phaseSlice}`;
  const deck = createStandardDeck();
  const i = seededIndex(52, seed);
  return { card: deck[i]!, phase01, fHz, seed };
}
