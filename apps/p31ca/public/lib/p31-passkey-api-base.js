/**
 * Same-origin passkey REST base from /p31-mesh-constants.json (npm run apply:constants).
 * Fallback: /api/passkey. Exposes window.p31GetPasskeyApiBase() → Promise<string>
 */
(function (global) {
  var FALLBACK = '/api/passkey';
  var cached = null;

  function normalize(p) {
    if (!p || typeof p !== 'string') return FALLBACK;
    var s = p.trim();
    if (!s.startsWith('/')) s = '/' + s;
    s = s.replace(/\/+$/, '');
    return s || FALLBACK;
  }

  global.p31GetPasskeyApiBase = function p31GetPasskeyApiBase() {
    if (cached != null) return Promise.resolve(cached);
    return fetch('/p31-mesh-constants.json', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        cached = normalize(j && j.passkeyApiBasePath);
        return cached;
      })
      .catch(function () {
        cached = FALLBACK;
        return cached;
      });
  };
})(typeof window !== 'undefined' ? window : this);
