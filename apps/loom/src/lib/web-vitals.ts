/**
 * The Loom — Core Web Vitals measurement.
 *
 * No third-party script: a PerformanceObserver for INP, LCP, and CLS (the
 * 2026 thresholds: INP ≤ 200ms, LCP ≤ 2.5s, CLS ≤ 0.1 at p75). Metrics are
 * collected and beamed to /api/loom/vitals if that endpoint exists (a
 * Cloudflare Function); absent a backend the beacon silently no-ops. In dev
 * the values are logged so a contributor can see them.
 *
 * The Loom animates only transform and opacity, so CLS should be near-zero by
 * construction — this observer is how that claim stays evidenced.
 *
 * Note: some of these APIs postdate the installed lib.dom (interactionId,
 * durationThreshold, LayoutShift), so they are reached via defensive casts.
 */

interface VitalsReport {
  inp?: number;
  lcp?: number;
  cls?: number;
  url: string;
}

let report: VitalsReport = { url: typeof location !== 'undefined' ? location.pathname : '' };

function send() {
  const body = JSON.stringify(report);
  if (navigator.sendBeacon) {
    void navigator.sendBeacon('/api/loom/vitals', body);
  } else {
    void fetch('/api/loom/vitals', { method: 'POST', body, keepalive: true }).catch(() => {});
  }
  if (import.meta.env?.DEV) console.info('[vitals]', report);
}

export function trackWebVitals(): () => void {
  const cleanup: Array<() => void> = [];

  try {
    const inp = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // interactionId and duration postdate lib.dom; read them defensively.
        const e = entry as unknown as { interactionId?: number; duration: number };
        if (e.interactionId) report.inp = Math.max(report.inp ?? 0, e.duration);
      }
      send();
    });
    inp.observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
    cleanup.push(() => inp.disconnect());
  } catch {
    // Event Timing unsupported — INP is skipped.
  }

  try {
    const lcp = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) report.lcp = last.startTime;
      send();
    });
    lcp.observe({ type: 'largest-contentful-paint', buffered: true });
    cleanup.push(() => lcp.disconnect());
  } catch {
    // LCP unsupported — skipped.
  }

  try {
    const cls = new PerformanceObserver((list) => {
      let value = 0;
      for (const entry of list.getEntries()) {
        const e = entry as unknown as { hadRecentInput?: boolean; value?: number };
        if (!e.hadRecentInput && typeof e.value === 'number') value += e.value;
      }
      report.cls = value;
      send();
    });
    cls.observe({ type: 'layout-shift', buffered: true });
    cleanup.push(() => cls.disconnect());
  } catch {
    // Layout Shift unsupported — skipped.
  }

  return () => {
    for (const c of cleanup) c();
  };
}