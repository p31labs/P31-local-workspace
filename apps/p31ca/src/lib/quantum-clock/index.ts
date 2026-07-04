/**
 * P31 Quantum Clock — Grandfather (continuous phase) + Cuckoo (episodic chimes).
 * All Hz values derive from the same kernel as the Sovereign dome: `p31-dome-constants`.
 * Display / pedagogy only — not metrology. See `docs/PLAN-QUANTUM-CLOCK.md`.
 */
export {
  P31_LARMOR_HZ,
  P31_LARMOR_HZ as LARMOR_DISPLAY_HZ,
  TRIM_HZ_MIN,
  trimHzFromKnob,
  breathInhaleHz,
  breathExhaleHz,
} from "../dome/p31-dome-constants";

const TAU = Math.PI * 2;

/**
 * Monotonic clock phase for rhythmic UI (e.g. rAF). Uses wall seconds from tMs, not Date.
 * @param tMs — typically `performance.now()` from a single origin
 * @param fHz — e.g. `TRIM_HZ_MIN` (grandfather slow) or `trimHzFromKnob(t)`
 */
export function getGrandfatherAngleRad(tMs: number, fHz: number): number {
  return ((tMs / 1000) * fHz * TAU) % TAU;
}

export function getGrandfatherPhase(
  tMs: number,
  fHz: number
): { angleRad: number; tSeconds: number } {
  const tSec = tMs / 1000;
  return {
    angleRad: (tSec * fHz * TAU) % TAU,
    tSeconds: tSec,
  };
}

export type CuckooKind = "telemetry" | "mesh" | "breath" | "custom";

export function createCuckooBus() {
  const t = new EventTarget();
  return {
    on(kind: CuckooKind, fn: (e: CustomEvent) => void) {
      t.addEventListener(kind, fn as EventListener);
    },
    chime(kind: CuckooKind, detail?: unknown) {
      t.dispatchEvent(new CustomEvent(kind, { detail }));
    },
    off(kind: CuckooKind, fn: (e: CustomEvent) => void) {
      t.removeEventListener(kind, fn as EventListener);
    },
  };
}

/** Bubbles on `document` for optional extensions / devtools / future ops bar. */
export const P31_QUANTUM_CLOCK_EVENT = "p31:quantum-clock" as const;

export function chimeQuantumClock(
  bus: ReturnType<typeof createCuckooBus>,
  kind: CuckooKind,
  detail?: unknown
): void {
  bus.chime(kind, detail);
  if (typeof document === "undefined") return;
  const t = typeof performance !== "undefined" ? performance.now() : 0;
  const extra =
    detail !== undefined &&
    detail !== null &&
    typeof detail === "object" &&
    !Array.isArray(detail)
      ? (detail as Record<string, unknown>)
      : { payload: detail };
  document.dispatchEvent(
    new CustomEvent(P31_QUANTUM_CLOCK_EVENT, {
      bubbles: true,
      detail: { cuckoo: kind, t, ...extra },
    })
  );
}

/**
 * Sets `--p31-grandfather-phase` on `<html>` (0–1) from `TRIM_HZ_MIN` rhythm. Respects `prefers-reduced-motion`.
 * @returns cancel rAF
 */
export function startGrandfatherPhaseVar(fHz: number): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduced) {
    document.documentElement.style.setProperty("--p31-grandfather-phase", "0");
    return () => {};
  }
  let raf = 0;
  function tick() {
    const a = getGrandfatherAngleRad(performance.now(), fHz);
    const phase01 = (a / TAU) % 1;
    document.documentElement.style.setProperty(
      "--p31-grandfather-phase",
      phase01.toFixed(5)
    );
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
