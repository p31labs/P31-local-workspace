/**
 * p31-telemetry.js — P31 Labs shared telemetry module
 * CWP-2026-014 R08
 *
 * Drop-in <script> for every standalone app:
 *   <script src="/p31-telemetry.js"></script>
 *
 * Exposes: window.p31.track(type, payload)
 *
 * Auto-tracks:
 *   - page_view on DOMContentLoaded
 *   - session_end on pagehide/beforeunload (via sendBeacon)
 *
 * Genesis Gate endpoint resolved from:
 *   1. window.P31_TELEMETRY_URL (override)
 *   2. https://genesis.p31ca.org  (production default)
 *
 * Privacy:
 *   - No PII collected
 *   - Session ID is an anonymous per-session UUID
 *   - Fails silently — never blocks the page
 */

(function () {
  'use strict';

  const GENESIS_URL = window.P31_TELEMETRY_URL ?? 'https://genesis.p31ca.org';
  const SOURCE = document.title || window.location.pathname.replace(/\//g, '') || 'unknown';
  const SESSION_ID = (function () {
    try {
      const key = 'p31-telemetry-session';
      let id = sessionStorage.getItem(key);
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        sessionStorage.setItem(key, id);
      }
      return id;
    } catch { return Math.random().toString(36).slice(2); }
  })();

  const startTime = Date.now();

  function track(type, payload) {
    try {
      const event = {
        source: SOURCE,
        type: String(type),
        payload: payload && typeof payload === 'object' ? payload : {},
        timestamp: new Date().toISOString(),
        session_id: SESSION_ID,
      };
      fetch(GENESIS_URL + '/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true,
      }).catch(function () { /* silent fail */ });
    } catch { /* silent fail */ }
  }

  function trackBeacon(type, payload) {
    try {
      const event = {
        source: SOURCE,
        type: String(type),
        payload: payload && typeof payload === 'object' ? payload : {},
        timestamp: new Date().toISOString(),
        session_id: SESSION_ID,
      };
      const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
      navigator.sendBeacon(GENESIS_URL + '/event', blob);
    } catch { /* silent fail */ }
  }

  // ── Auto-track: page_view ──────────────────────────────────────────────
  function onPageView() {
    track('page_view', {
      url: window.location.href,
      referrer: document.referrer || null,
      title: document.title,
      screen: window.screen ? window.screen.width + 'x' + window.screen.height : null,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onPageView);
  } else {
    onPageView();
  }

  // ── Auto-track: session_end ────────────────────────────────────────────
  function onSessionEnd() {
    trackBeacon('session_end', {
      duration_ms: Date.now() - startTime,
      url: window.location.href,
    });
  }

  window.addEventListener('pagehide', onSessionEnd);
  // Fallback for browsers that don't fire pagehide reliably
  window.addEventListener('beforeunload', onSessionEnd);

  // ── Public API ─────────────────────────────────────────────────────────
  window.p31 = window.p31 || {};
  window.p31.track = track;
  window.p31.sessionId = SESSION_ID;
})();
