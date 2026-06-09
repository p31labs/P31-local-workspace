/**
 * @file perfMonitor — Thin perf metrics relay between RAF loop and DevOverlay.
 *
 * GPU ms is set by ImmersiveCockpit's RAF loop via the EXT_disjoint_timer_query_webgl2
 * extension and read by DevOverlay every 500ms. Using module-scope state (not the
 * Zustand store) keeps GPU timing out of React's reconciler.
 */

let _gpuMs = 0;

/** Called by ImmersiveCockpit once per frame with the resolved GPU query result. */
export const setGpuMs = (ms: number): void => { _gpuMs = ms; };

/** Read by DevOverlay (polled every 500ms). */
export const getGpuMs = (): number => _gpuMs;
