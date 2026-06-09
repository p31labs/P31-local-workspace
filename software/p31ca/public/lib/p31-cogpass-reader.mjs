/**
 * p31-cogpass-reader.mjs — CogPass v1.1.0 reader (the activator).
 *
 * Reads a saved Cognitive Passport from localStorage and configures the
 * existing personalization stack to match. This is a CONFIGURATOR, not a
 * parallel state store. It calls into:
 *
 *   • window.p31SubjectPrefs (from /lib/p31-subject-prefs.js) for
 *     accessibility axes (contrast, density, motion, temperature)
 *   • window.p31Theme        (from /lib/p31-theme-engine.mjs)   for
 *     visual themes (hub|org|midnight|genesis|paper|matrix), modes
 *     (default|focus|calm|vibrant|muted), and appearance (auto|light|dark)
 *
 * Schema spec: andromeda/04_SOFTWARE/p31ca/ground-truth/cognitive-passport-v1-1.schema.json
 * Bus bar:     andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json#/busBar
 * Alignment:   p31-alignment.json sources.cognitive-passport-v1-1-overlay-schema
 * Privacy:     andromeda/04_SOFTWARE/p31ca/public/privacy.html §2f (must precede deploy)
 *
 * Storage key: "p31-cogpass-v1" (declared in privacy.html §2f)
 * Schema URI:  "p31.cognitivePassport/1.1.0" (additive overlay on /1.0.0)
 *
 * Browser-only. No-ops cleanly under SSR or when localStorage is unavailable
 * (private browsing). All operations are best-effort with graceful fallback
 * to the Gray Rock default state.
 *
 * Public API on window.p31CogPass:
 *   .get()              → current passport object or null
 *   .set(passport)      → save + apply (returns normalized passport)
 *   .clear()            → remove + reset to defaults
 *   .getRole()          → 'stranger' | 'user' | 'operator'
 *   .getDisplayName()   → string ('' if not set)
 *   .onChange(fn)       → register callback; returns unsubscribe fn
 *
 * Events on document:
 *   'p31:cogpass-loaded'  detail = { passport, role }
 *   'p31:cogpass-cleared' detail = {}
 *   'p31:cogpass-error'   detail = { error, raw }
 */

const STORAGE_KEY = 'p31-cogpass-v1';
const SCHEMA_URI_V11 = 'p31.cognitivePassport/1.1.0';
const ATTR_LOADED = 'data-p31-cogpass';        // 'none' | 'loaded'
const ATTR_ROLE = 'data-p31-cogpass-role';     // 'stranger' | 'user' | 'operator'

// SSR / private-browsing guards
const HAS_DOC = typeof document !== 'undefined';
const HAS_WIN = typeof window !== 'undefined';

// ─── storage with graceful fallback ──────────────────────────────────────────
function safeRead() {
  if (!HAS_WIN) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeWrite(passport) {
  if (!HAS_WIN) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(passport));
    return true;
  } catch {
    return false;
  }
}

function safeRemove() {
  if (!HAS_WIN) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

// ─── normalization ───────────────────────────────────────────────────────────
/**
 * Accept whatever the user gave us; produce a passport that has the v1.1.0
 * shape with safe defaults. Never throws. Unknown fields preserved.
 */
function normalize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const p = { ...raw };

  // identity (with operator/user gate)
  p.identity = { ...(raw.identity || {}) };
  if (p.identity.accessLevel !== 'operator') p.identity.accessLevel = 'user';
  if (typeof p.identity.displayName !== 'string') p.identity.displayName = '';

  // accessibility (with screenComfort cascade)
  p.accessibility = { ...(raw.accessibility || {}) };
  const sc = clampInt(p.accessibility.screenComfort, 0, 100, 50);
  p.accessibility.screenComfort = sc;
  p.accessibility.motionPreference = oneOf(p.accessibility.motionPreference,
    ['auto', 'reduced', 'none', 'full'], 'auto');
  p.accessibility.contrastPreference = oneOf(p.accessibility.contrastPreference,
    ['auto', 'high', 'max', 'standard', 'low'], 'standard');
  p.accessibility.fontSize = oneOf(p.accessibility.fontSize,
    ['small', 'standard', 'large', 'xl'], 'standard');
  p.accessibility.informationDensity = oneOf(p.accessibility.informationDensity,
    ['minimal', 'standard', 'dense', 'comfortable', 'compact', 'spacious'], 'standard');
  p.accessibility.temperaturePreference = oneOf(p.accessibility.temperaturePreference,
    ['cool', 'neutral', 'warm'], 'neutral');

  // stylePreferences (with screenComfort overrides)
  p.stylePreferences = { ...(raw.stylePreferences || {}) };
  p.stylePreferences.theme = oneOf(p.stylePreferences.theme,
    ['auto', 'hub', 'org', 'midnight', 'genesis', 'paper', 'matrix'], 'auto');
  p.stylePreferences.mode = oneOf(p.stylePreferences.mode,
    ['default', 'focus', 'calm', 'vibrant', 'muted'], 'default');
  p.stylePreferences.appearance = oneOf(p.stylePreferences.appearance,
    ['auto', 'light', 'dark'], 'auto');
  p.stylePreferences.glassEnabled = !!p.stylePreferences.glassEnabled;
  p.stylePreferences.animationsEnabled = p.stylePreferences.animationsEnabled !== false;
  p.stylePreferences.phosGuide = p.stylePreferences.phosGuide !== false;
  p.stylePreferences.phosRegister = oneOf(p.stylePreferences.phosRegister,
    ['auto', 'warm', 'technical', 'minimal'], 'auto');

  // ── screenComfort cascade (low values override user preferences for safety) ─
  if (sc < 30) {
    p.stylePreferences.glassEnabled = false;
    p.stylePreferences.animationsEnabled = false;
    if (p.accessibility.motionPreference === 'auto' || p.accessibility.motionPreference === 'full') {
      p.accessibility.motionPreference = 'reduced';
    }
  }
  if (sc < 10) {
    if (p.accessibility.motionPreference !== 'none') {
      p.accessibility.motionPreference = 'none';
    }
  }

  // ── phosRegister auto-resolution from communication.preferredTone ─────────
  if (p.stylePreferences.phosRegister === 'auto') {
    const tone = (raw.communication && raw.communication.preferredTone) || 'direct';
    p.stylePreferences.phosRegister =
      tone === 'technical' ? 'technical' :
      tone === 'warm' || tone === 'casual' ? 'warm' :
      'minimal';
  }

  return p;
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function oneOf(v, allowed, fallback) {
  return allowed.includes(v) ? v : fallback;
}

// ─── information-density mapping (cogpass v1.1 → p31-subject-prefs) ─────────
// p31-subject-prefs declares: 'comfortable' | 'compact' | 'spacious'
// CogPass v1.1 also accepts:  'minimal'    | 'standard' | 'dense'
// Map the v1.1 vocabulary onto the existing prefs vocabulary.
function densityToSubjectPrefs(density) {
  switch (density) {
    case 'minimal':
    case 'spacious':    return 'spacious';
    case 'dense':
    case 'compact':     return 'compact';
    case 'standard':
    case 'comfortable':
    default:            return 'comfortable';
  }
}

// ─── application: passport → live engines ───────────────────────────────────
function applyToEngines(passport) {
  if (!HAS_DOC) return;
  const root = document.documentElement;

  // 1. Top-level data attributes (so CSS + nav can react)
  root.setAttribute(ATTR_LOADED, 'loaded');
  root.setAttribute(ATTR_ROLE, passport.identity.accessLevel);

  // 2. Accessibility → p31SubjectPrefs (existing axes + temperature)
  const subjectAPI = HAS_WIN && window.p31SubjectPrefs;
  if (subjectAPI && typeof subjectAPI.set === 'function') {
    subjectAPI.set({
      contrast: mapContrast(passport.accessibility.contrastPreference),
      density: densityToSubjectPrefs(passport.accessibility.informationDensity),
      motion: mapMotion(passport.accessibility.motionPreference),
      temp: passport.accessibility.temperaturePreference,
    });
  }

  // 3. Style → p31Theme (theme + mode + appearance)
  const themeAPI = HAS_WIN && window.p31Theme;
  if (themeAPI && typeof themeAPI.setTheme === 'function') {
    if (passport.stylePreferences.theme !== 'auto') {
      themeAPI.setTheme(passport.stylePreferences.theme);
    }
    if (passport.stylePreferences.mode) {
      themeAPI.setMode(passport.stylePreferences.mode);
    }
    if (passport.stylePreferences.appearance) {
      themeAPI.setAppearance(passport.stylePreferences.appearance);
    }
  }

  // 4. Font scale (one new axis CogPass owns; sets a CSS var for any consumer)
  const fontScale = {
    small: '0.875', standard: '1.0', large: '1.125', xl: '1.25',
  }[passport.accessibility.fontSize] || '1.0';
  root.style.setProperty('--p31-font-scale', fontScale);

  // 5. Glass + animations as CSS hooks (PHOS guide / theme tooling read these)
  root.setAttribute('data-p31-glass', passport.stylePreferences.glassEnabled ? 'on' : 'off');
  root.setAttribute('data-p31-animations', passport.stylePreferences.animationsEnabled ? 'on' : 'off');
  root.setAttribute('data-p31-phos-guide', passport.stylePreferences.phosGuide ? 'on' : 'off');
  root.setAttribute('data-p31-phos-register', passport.stylePreferences.phosRegister);

  // 6. screenComfort < 10: enforce permanent Gray Rock (don't remove on interaction)
  //    Multiple existing surfaces use the html.p31-gray-rock class as the
  //    Gray Rock opt-in (passport, command center, soup); pin it for the
  //    operator's lowest-stim setting.
  if (passport.accessibility.screenComfort < 10) {
    root.classList.add('p31-gray-rock');
    root.setAttribute('data-p31-gray-rock', 'pinned');
  }
}

function mapContrast(c) {
  // p31-subject-prefs accepts 'standard' | 'high' (no 'auto' / 'max' / 'low')
  if (c === 'high' || c === 'max') return 'high';
  return 'standard';
}

function mapMotion(m) {
  // p31-subject-prefs accepts 'reduced' | 'full' (no 'auto' / 'none')
  // 'auto' lets the existing prefers-reduced-motion media query lead
  if (m === 'none' || m === 'reduced') return 'reduced';
  if (m === 'auto') {
    if (HAS_WIN && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'reduced'
        : 'full';
    }
    return 'reduced'; // safer default
  }
  return 'full';
}

function resetToDefaults() {
  if (!HAS_DOC) return;
  const root = document.documentElement;
  root.setAttribute(ATTR_LOADED, 'none');
  root.setAttribute(ATTR_ROLE, 'stranger');
  root.removeAttribute('data-p31-glass');
  root.removeAttribute('data-p31-animations');
  root.removeAttribute('data-p31-phos-guide');
  root.removeAttribute('data-p31-phos-register');
  root.removeAttribute('data-p31-gray-rock');
  root.style.removeProperty('--p31-font-scale');
  // Note: we do NOT reset p31SubjectPrefs or p31Theme here — they own their
  // own state and persistence. Clearing the CogPass means reverting to whatever
  // the user had set independently before they loaded a passport.
}

// ─── change listeners ────────────────────────────────────────────────────────
const listeners = new Set();
function notify(detail) {
  listeners.forEach(cb => {
    try { cb(detail); } catch (e) { console.warn('p31CogPass listener threw', e); }
  });
}

// ─── event helpers ──────────────────────────────────────────────────────────
function dispatch(name, detail) {
  if (!HAS_DOC) return;
  try {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  } catch {
    /* no-op (older browsers without CustomEvent) */
  }
}

// ─── public API ──────────────────────────────────────────────────────────────
function getRole() {
  const passport = safeRead();
  if (!passport) return 'stranger';
  const normalized = normalize(passport);
  if (!normalized) return 'stranger';
  return normalized.identity.accessLevel === 'operator' ? 'operator' : 'user';
}

function getDisplayName() {
  const passport = safeRead();
  if (!passport) return '';
  const normalized = normalize(passport);
  return (normalized && normalized.identity && normalized.identity.displayName) || '';
}

function get() {
  const raw = safeRead();
  return raw ? normalize(raw) : null;
}

function set(passport) {
  const normalized = normalize(passport);
  if (!normalized) {
    dispatch('p31:cogpass-error', { error: 'invalid passport', raw: passport });
    return null;
  }
  // Ensure the schema URI is stamped (for forward compatibility / verifier)
  normalized.$schema = SCHEMA_URI_V11;
  if (!safeWrite(normalized)) {
    dispatch('p31:cogpass-error', { error: 'localStorage unavailable', raw: passport });
    return normalized;
  }
  applyToEngines(normalized);
  const role = normalized.identity.accessLevel === 'operator' ? 'operator' : 'user';
  dispatch('p31:cogpass-loaded', { passport: normalized, role });
  notify({ type: 'loaded', passport: normalized, role });
  return normalized;
}

function clear() {
  safeRemove();
  resetToDefaults();
  dispatch('p31:cogpass-cleared', {});
  notify({ type: 'cleared' });
}

function onChange(fn) {
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ─── boot ────────────────────────────────────────────────────────────────────
/**
 * Hydrate from localStorage on load. The theme engine and subject-prefs
 * scripts auto-init themselves; we wait briefly so they're ready before we
 * call into their APIs. If they never load (e.g. a page that doesn't include
 * them), we still set the data attributes so CSS + nav can react.
 */
function boot() {
  if (!HAS_DOC) return;

  const raw = safeRead();

  if (!raw) {
    resetToDefaults();
    return;
  }

  const passport = normalize(raw);
  if (!passport) {
    // Malformed: clear and revert
    safeRemove();
    resetToDefaults();
    dispatch('p31:cogpass-error', { error: 'parse failed', raw });
    return;
  }

  // Wait briefly for downstream APIs (they auto-init in their own scripts).
  // 0ms first try (often the scripts have already loaded), then up to 3 retries.
  let tries = 0;
  const tryApply = () => {
    const ready = HAS_WIN && (window.p31Theme || window.p31SubjectPrefs);
    if (ready || tries >= 3) {
      applyToEngines(passport);
      const role = passport.identity.accessLevel === 'operator' ? 'operator' : 'user';
      dispatch('p31:cogpass-loaded', { passport, role });
      notify({ type: 'loaded', passport, role });
      return;
    }
    tries++;
    setTimeout(tryApply, 50);
  };
  tryApply();
}

// ─── install global API + boot ──────────────────────────────────────────────
if (HAS_WIN) {
  window.p31CogPass = Object.freeze({
    get,
    set,
    clear,
    getRole,
    getDisplayName,
    onChange,
    SCHEMA_URI_V11,
    STORAGE_KEY,
  });

  if (HAS_DOC) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  }
}

// ─── exports for explicit imports / testing ────────────────────────────────
export {
  STORAGE_KEY,
  SCHEMA_URI_V11,
  ATTR_LOADED,
  ATTR_ROLE,
  normalize,
  densityToSubjectPrefs,
  mapContrast,
  mapMotion,
  applyToEngines,
  resetToDefaults,
  get,
  set,
  clear,
  getRole,
  getDisplayName,
  onChange,
  boot,
};

export default { get, set, clear, getRole, getDisplayName, onChange };
