/**
 * PHOS telemetry — cookieless event reporting to the P31 Counterscale instance.
 * Pageviews are auto-tracked by the embedded tracker.js script. This helper
 * adds custom app events (surface navigation, spoon changes, LOVE awards) as
 * extra fields on the same /collect endpoint so they surface in Analytics Engine.
 */

const ENDPOINT = 'https://analytics.p31ca.org/collect';

type EventGroup = 'surface' | 'spoons' | 'love' | 'session';

function siteId(): string {
  const el = document.getElementById('counterscale-script') as HTMLScriptElement | null;
  return el?.dataset.siteId || 'phos';
}

export function trackEvent(group: EventGroup, action: string, label?: string) {
  try {
    const params = new URLSearchParams({
      sid: siteId(),
      p: location.pathname,
      h: location.hostname,
      r: document.referrer || '',
      eg: group,
      ea: action,
    });
    if (label) params.set('el', label);
    const url = `${ENDPOINT}?${params.toString()}`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }
  } catch {
    /* telemetry must never break the app */
  }
}
