/**
 * Grandfather quantum-clock phase driver for static hub pages + Astro shells.
 * Sets --p31-grandfather-phase on <html> (0–1) from trim Hz rhythm.
 *
 * SYNC: TRIM_HZ_MIN must equal `export const TRIM_HZ_MIN` in
 *       andromeda/04_SOFTWARE/p31ca/src/lib/dome/p31-dome-constants.ts
 *       and `const TRIM_HZ_MIN` in public/tomography.html.
 * Proven by: npm run verify:quantum-clock (root)
 */

export const TRIM_HZ_MIN = 0.86;

const TAU = Math.PI * 2;
const HZ_MAX_REASONABLE = 1e6;

/**
 * @param {number} fHz
 */
function sanitizeHz(fHz) {
  if (typeof fHz === "number" && Number.isFinite(fHz) && fHz > 0 && fHz < HZ_MAX_REASONABLE) {
    return fHz;
  }
  return TRIM_HZ_MIN;
}

/**
 * @param {number} [fHz]
 * @returns {() => void} cancelFn
 */
export function startGrandfatherPhaseVar(fHz = TRIM_HZ_MIN) {
  if (typeof document === "undefined") {
    return () => {};
  }
  const hz = sanitizeHz(fHz);
  const root = document.documentElement;

  const mq =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  function reducedPreferred() {
    return mq?.matches === true;
  }

  /** @returns {boolean} whether the animation loop should be running */
  function shouldAnimate() {
    return !reducedPreferred() && !document.hidden;
  }

  let raf = 0;

  function setPhaseReduced() {
    root.style.setProperty("--p31-grandfather-phase", "0");
  }

  function tick() {
    const tMs = typeof performance !== "undefined" ? performance.now() : 0;
    const angleRad = ((tMs / 1000) * hz * TAU) % TAU;
    const phase01 = (angleRad / TAU) % 1;
    root.style.setProperty("--p31-grandfather-phase", phase01.toFixed(5));
    raf = requestAnimationFrame(tick);
  }

  function stopRafLoop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  /** Start RAF loop only when visibility + motion prefs allow */
  function syncLoop() {
    if (!shouldAnimate()) {
      stopRafLoop();
      setPhaseReduced();
      return;
    }
    if (!raf) {
      raf = requestAnimationFrame(tick);
    }
  }

  function onVisibility() {
    syncLoop();
  }

  /** Handles both MediaQueryListEvent (`change`) and legacy listener (receives MQ list). */
  function onMotionPreference(mqlOrEv) {
    const prefersReduce =
      typeof mqlOrEv?.matches === "boolean" ? mqlOrEv.matches : reducedPreferred();
    if (prefersReduce) {
      stopRafLoop();
      setPhaseReduced();
    } else {
      syncLoop();
    }
  }

  document.addEventListener("visibilitychange", onVisibility);
  if (mq) {
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onMotionPreference);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(onMotionPreference);
    }
  }

  syncLoop();

  return () => {
    stopRafLoop();
    document.removeEventListener("visibilitychange", onVisibility);
    if (mq) {
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", onMotionPreference);
      } else if (typeof mq.removeListener === "function") {
        mq.removeListener(onMotionPreference);
      }
    }
  };
}
