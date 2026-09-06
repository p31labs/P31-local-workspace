/**
 * @file telemetry — Minimal, cookieless, no-PII event beacon for the P31 UI
 * modules. Reads the Counterscale `data-site-id` from the host page (same
 * pattern as apps/phos/src/shared/lib/telemetry.ts). Emits ONLY event names
 * and counts — never identity content.
 */

const ENDPOINT = 'https://analytics.p31ca.org/collect';

function siteId(): string {
  if (typeof document === 'undefined') return 'p31-ui';
  const el = document.getElementById('counterscale-script') as HTMLScriptElement | null;
  return el?.dataset.siteId || 'p31-ui';
}

export function trackComponentUsage(component: string, app: string) {
  trackUiEvent('component_usage', component, app);
}

export function trackUiEvent(group: string, action: string, label?: string) {
  try {
    if (typeof navigator === 'undefined') return;
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
    if (navigator.sendBeacon) navigator.sendBeacon(url);
    else new Image().src = url;
  } catch {
    /* telemetry must never break the app */
  }
}
