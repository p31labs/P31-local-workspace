/**
 * p31-phos-guide.mjs — PHOS guide v0 (the face).
 *
 * The unified personalization affordance for every P31 surface. PHOS is the
 * voice the operator (Will) cannot reliably serialize into real-time speech,
 * made portable so anyone can meet it. This component is the on-screen
 * incarnation: a 48px dot in the bottom-right corner of every page, expanding
 * to a 320×460 panel that greets the visitor, exposes their personalization
 * controls, and offers the next step.
 *
 * Bus bar role: PHOS is the FACE; the theme engine + subject-prefs + CogPass
 * reader are the NERVOUS SYSTEM. PHOS calls into the existing engines; it does
 * not parallel-implement state. See andromeda/04_SOFTWARE/p31ca/ground-truth/
 * p31.ground-truth.json#/busBar/phos.absorbsThemeSwitcher.
 *
 * Voice canon: docs/PHOS-VOICE-DRAFT.md (operator hand for §3.x and §4).
 * Schema:      andromeda/04_SOFTWARE/p31ca/ground-truth/cognitive-passport-v1-1.schema.json
 * Reader:      andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-reader.mjs
 *
 * Suppresses the floating theme switcher (p31-theme-switcher.mjs) by
 * preemptively setting window.p31ThemeSwitcher before its 100ms auto-mount
 * fires. PHOS embeds the same theme controls in its own panel.
 *
 * Public API on window.p31PhosGuide (frozen):
 *   .open()         → expand panel
 *   .close()        → collapse panel (still visible as dot)
 *   .toggle()       → flip
 *   .dismiss()      → permanently hide; sets localStorage p31-phos-dismissed
 *   .isOpen()       → boolean
 *   .isDismissed()  → boolean
 *   .setVoice(obj)  → inject per-page copy {greeting, hint, fallback, links}
 *   .refresh()      → re-render with current state
 *
 * Events on document:
 *   'p31:phos-booted'     detail = { inference }  — fires after signals collected + render
 *   'p31:phos-opened'     detail = {}
 *   'p31:phos-closed'     detail = {}
 *   'p31:phos-dismissed'  detail = {}
 *
 * Doctrine guards (Gray Rock):
 *   • Closed dot is INERT until first user interaction (no self-started motion)
 *   • If html.p31-gray-rock is pinned (CogPass screenComfort < 10), the dot
 *     never wakes — no pulse, no glow, no animation, ever
 *   • Glass blur respects data-p31-glass attribute (set by reader)
 *   • Auto-expand only fires on /welcome on first visit (p31-phos-greeted flag)
 *   • Honors data-p31-phos-guide="off" — won't render at all
 */

const STORAGE_DISMISSED = 'p31-phos-dismissed';
const STORAGE_GREETED   = 'p31-phos-greeted';
const CSS_MARKER        = 'data-p31-phos-guide-css';
const ROOT_MARKER       = 'data-p31-phos-guide-root';

const HAS_DOC = typeof document !== 'undefined';
const HAS_WIN = typeof window !== 'undefined';

// ─── default voice (operator-canon §3.1, §3.2; placeholders for §4) ─────────
// Mirrors docs/PHOS-VOICE-DRAFT.md. When andromeda/04_SOFTWARE/p31ca/public/
// lib/p31-phos-voice.json ships (operator extends §4), boot() will fetch and
// merge it over these defaults.
const DEFAULT_VOICE = Object.freeze({
  _default: {
    greeting: "Hi. I'm PHOS — your guide to P31.",
    hint: "Need help finding something?",
    fallback: "I'll be here.",
    links: [
      { label: "Create your context card", href: "/passport/" },
      { label: "Back to welcome", href: "/welcome" },
    ],
  },
  '/welcome': {
    greeting: "Hi. I'm PHOS.",
    hint:
      "For all the parents and kids out there raw dogging life — " +
      "help is on the way.\n\n" +
      "Start with your context card. Two minutes. " +
      "It makes everything here work better for you.",
    fallback: "Or just look around. I'll be here if you need me.",
    links: [
      { label: "Create your context card", href: "/passport/" },
      { label: "See what we build", href: "/lab" },
    ],
  },
  '/passport': {
    greeting: "This is your context card.",
    hint:
      "Fill in what feels right. Skip what doesn't. " +
      "Watch the page change as you go.",
    fallback:
      "When you're done, copy it into any AI tool — or keep it here. " +
      "The site will remember.",
    links: [
      { label: "Why this exists", href: "#why" },
      { label: "See an example", href: "#example" },
    ],
  },
  '/lab': {
    greeting: "Welcome to the lab.",
    hint:
      "Everything P31 has built lives here. " +
      "All of it free, all of it open source.",
    fallback:
      "If something feels overwhelming, your context card has " +
      "a Screen Comfort slider that quiets things down.",
    links: [
      { label: "Adjust Screen Comfort", href: "#screen-comfort" },
      { label: "Create your context card", href: "/passport/" },
    ],
  },
  '/support': {
    greeting: "Every dollar builds tools for neurodivergent families.",
    hint: "P31 takes 0% platform fees. No tracking. No donor data sold.",
    fallback: "Even $1 helps. Seriously.",
    links: [
      { label: "Back to welcome", href: "/welcome" },
      { label: "See what we build", href: "/lab" },
    ],
  },
  '/social-molecules': {
    greeting: "Your household is a molecule.",
    hint: "See who's connected and how the bonds are holding. Real-time family mesh status.",
    fallback: "If something feels off, check the Glass Box for live system telemetry.",
    links: [
      { label: "Glass Box — live status", href: "/glass-box" },
      { label: "Bonding tools", href: "/bonding" },
    ],
  },
  '/spaceship-earth': {
    greeting: "The pale blue dot view.",
    hint: "Install P31 as an app on your phone or desktop. Works offline. Your data stays local.",
    fallback: "The install button is below. If it doesn't appear, your browser already supports the features we need.",
    links: [
      { label: "How to install", href: "#install" },
      { label: "Explore the lab", href: "/lab" },
    ],
  },
  '/axiom': {
    greeting: "Start with what you know.",
    hint: "Axiom is the bond surface — where family connections are forged and tested.",
    fallback: "If you're new here, the context card helps everything make more sense.",
    links: [
      { label: "Bonding app", href: "/bonding" },
      { label: "Mesh start", href: "/mesh-start" },
    ],
  },
  '/bridge': {
    greeting: "Crossing into the mesh.",
    hint: "This is the entry point for the K4 network. Your first step toward a connected family topology.",
    fallback: "The mesh works best when everyone has a context card. Takes two minutes.",
    links: [
      { label: "Mesh setup", href: "/mesh-start" },
      { label: "Create context card", href: "/passport" },
    ],
  },
  '/glass-box-widget': {
    greeting: "Transparency, embeddable.",
    hint: "A smaller version of the Glass Box that can live on other sites. Real-time P31 status, anywhere.",
    fallback: "For the full experience with all controls, visit the main Glass Box.",
    links: [
      { label: "Full Glass Box", href: "/glass-box" },
      { label: "Get support", href: "/support" },
    ],
  },
  '/fleet-portal': {
    greeting: "Every ship in view.",
    hint: "URL index and health status for all P31 surfaces. Check what's live, what's maintenance, what's coming.",
    fallback: "If something you need is showing maintenance, the support page has alternatives.",
    links: [
      { label: "System status", href: "/glass-box" },
      { label: "Education hub", href: "/education/" },
    ],
  },
  '/education/': {
    greeting: "Learn how this works.",
    hint: "Curriculum, guides, and documentation for understanding the P31 architecture.",
    fallback: "Start with the research page if you want the technical deep-dive.",
    links: [
      { label: "Research (specs)", href: "/research" },
      { label: "Lab (practice)", href: "/lab" },
    ],
  },
  '/sovereign': {
    greeting: "Your own tools.",
    hint: "Personal mesh utilities. Tools that run on your device, under your control, without the cloud.",
    fallback: "The full lab has more tools. This is the sovereign subset — local-first, privacy-preserving.",
    links: [
      { label: "Lab (all tools)", href: "/lab" },
      { label: "Get support", href: "/support" },
    ],
  },
  '/delta-language': {
    greeting: "Words that wire together.",
    hint: "The terminology and conceptual framework behind P31. Delta, K4, isostatic rigidity, trimtabs.",
    fallback: "If this feels dense, the research page has the full architecture specs.",
    links: [
      { label: "Research (architecture)", href: "/research" },
      { label: "Documentation", href: "/docs" },
    ],
  },
});

let VOICE = { ...DEFAULT_VOICE };

// ─── CSS (single injection, marker-guarded) ──────────────────────────────────
const CSS = `
[${ROOT_MARKER}] {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 2147483000;
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
  color: var(--p31-cloud, #d8d6d0);
}
[${ROOT_MARKER}] *, [${ROOT_MARKER}] *::before, [${ROOT_MARKER}] *::after {
  box-sizing: border-box;
}
[${ROOT_MARKER}] .phos-dot {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--p31-void, #0f1115);
  border: 1.5px solid rgba(216, 214, 208, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 220ms ease, transform 220ms ease;
  -webkit-tap-highlight-color: transparent;
}
[${ROOT_MARKER}] .phos-dot:focus-visible {
  outline: 2px solid var(--p31-teal, #25897d);
  outline-offset: 3px;
}
/* Layer-2 wake: only after the page has had a real interaction.
   Set by the existing inline script that toggles html.p31-gray-rock off. */
html:not(.p31-gray-rock) [${ROOT_MARKER}] .phos-dot:hover {
  border-color: var(--p31-teal, #25897d);
  transform: scale(1.05);
}
/* Pinned Gray Rock (screenComfort < 10) never wakes */
html.p31-gray-rock [${ROOT_MARKER}] .phos-dot:hover {
  border-color: rgba(216, 214, 208, 0.45);
  transform: none;
}
[${ROOT_MARKER}] .phos-dot svg {
  width: 26px;
  height: 26px;
  display: block;
}
[${ROOT_MARKER}] .phos-panel {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 320px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  background: var(--p31-void, #0f1115);
  border: 1px solid rgba(216, 214, 208, 0.18);
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 1.5;
  display: none;
}
html[data-p31-glass="on"] [${ROOT_MARKER}] .phos-panel {
  background: rgba(15, 17, 21, 0.78);
  backdrop-filter: blur(18px) saturate(120%);
  -webkit-backdrop-filter: blur(18px) saturate(120%);
}
[${ROOT_MARKER}].is-open .phos-panel { display: block; }
[${ROOT_MARKER}] .phos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}
[${ROOT_MARKER}] .phos-title {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.02em;
  margin: 0;
  color: var(--p31-cloud, #d8d6d0);
}
[${ROOT_MARKER}] .phos-close {
  background: transparent;
  border: 0;
  color: var(--p31-muted, #6b7280);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
[${ROOT_MARKER}] .phos-close:hover { color: var(--p31-cloud, #d8d6d0); }
[${ROOT_MARKER}] .phos-greeting {
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--p31-cloud, #d8d6d0);
}
[${ROOT_MARKER}] .phos-hint {
  margin: 0 0 12px 0;
  color: rgba(216, 214, 208, 0.85);
  white-space: pre-line;
}
[${ROOT_MARKER}] .phos-fallback {
  margin: 0 0 16px 0;
  color: var(--p31-muted, #6b7280);
  font-size: 13px;
  font-style: italic;
}
[${ROOT_MARKER}] .phos-section {
  border-top: 1px solid rgba(216, 214, 208, 0.10);
  padding-top: 12px;
  margin-top: 12px;
}
[${ROOT_MARKER}] .phos-section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--p31-muted, #6b7280);
  margin: 0 0 8px 0;
}
[${ROOT_MARKER}] .phos-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
[${ROOT_MARKER}] .phos-links a {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(216, 214, 208, 0.06);
  color: var(--p31-cloud, #d8d6d0);
  text-decoration: none;
  font-weight: 600;
  font-size: 13.5px;
  transition: background-color 160ms ease;
}
[${ROOT_MARKER}] .phos-links a:hover {
  background: rgba(37, 137, 125, 0.18);
  color: var(--p31-teal, #25897d);
}
[${ROOT_MARKER}] .phos-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
[${ROOT_MARKER}] .phos-control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
[${ROOT_MARKER}] .phos-control-label {
  font-size: 12.5px;
  color: rgba(216, 214, 208, 0.85);
}
[${ROOT_MARKER}] .phos-button-group {
  display: inline-flex;
  border: 1px solid rgba(216, 214, 208, 0.15);
  border-radius: 6px;
  overflow: hidden;
}
[${ROOT_MARKER}] .phos-button-group button {
  background: transparent;
  border: 0;
  padding: 5px 9px;
  font-size: 11.5px;
  color: rgba(216, 214, 208, 0.75);
  cursor: pointer;
  font-family: inherit;
  border-right: 1px solid rgba(216, 214, 208, 0.10);
}
[${ROOT_MARKER}] .phos-button-group button:last-child { border-right: 0; }
[${ROOT_MARKER}] .phos-button-group button[aria-pressed="true"] {
  background: rgba(37, 137, 125, 0.18);
  color: var(--p31-teal, #25897d);
  font-weight: 700;
}
[${ROOT_MARKER}] .phos-slider {
  width: 100%;
  margin: 0;
}
[${ROOT_MARKER}] .phos-slider-value {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--p31-muted, #6b7280);
  min-width: 28px;
  text-align: right;
}
[${ROOT_MARKER}] .phos-footer {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(216, 214, 208, 0.10);
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--p31-muted, #6b7280);
}
[${ROOT_MARKER}] .phos-footer button {
  background: transparent;
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-decoration-color: rgba(216, 214, 208, 0.25);
}
[${ROOT_MARKER}] .phos-footer button:hover { color: var(--p31-coral, #cc6247); }

/* ── chips (inference + Akinator navigation) ── */
[${ROOT_MARKER}] .phos-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 2px;
}
[${ROOT_MARKER}] .phos-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 11px;
  border-radius: 20px;
  border: 1px solid rgba(216, 214, 208, 0.16);
  background: rgba(216, 214, 208, 0.05);
  color: var(--p31-cloud, #d8d6d0);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 140ms ease, border-color 140ms ease;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}
[${ROOT_MARKER}] .phos-chip:hover,
[${ROOT_MARKER}] .phos-chip:focus-visible {
  background: rgba(37, 137, 125, 0.16);
  border-color: rgba(37, 137, 125, 0.45);
  color: var(--p31-teal, #25897d);
}
[${ROOT_MARKER}] .phos-chip:focus-visible { outline: 2px solid var(--p31-teal,#25897d); outline-offset: 2px; }
[${ROOT_MARKER}] .phos-chip-icon { font-size: 13px; line-height: 1; }
/* ── voice toggle (in footer) ── */
[${ROOT_MARKER}] .phos-voice-btn {
  background: transparent;
  border: 0;
  color: inherit;
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
}
[${ROOT_MARKER}] .phos-voice-btn:hover { opacity: 1; }
[${ROOT_MARKER}] .phos-voice-btn[data-voice-on="false"] { opacity: 0.4; text-decoration: line-through; }

/* ── urgent mode (safe mode) ─────────────────────────────────────────────── */
/* When user is in sensory crisis: no animations, no blur, high contrast, */
/* one clear action only. */
[${ROOT_MARKER}][data-p31-urgent="true"] .phos-dot {
  background: #ff4444 !important;
  animation: none !important;
  box-shadow: none !important;
}
[${ROOT_MARKER}][data-p31-urgent="true"] .phos-panel {
  background: #000 !important;
  border-color: #333 !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
[${ROOT_MARKER}][data-p31-urgent="true"] .phos-title,
[${ROOT_MARKER}][data-p31-urgent="true"] .phos-hint {
  color: #fff !important;
}
[${ROOT_MARKER}][data-p31-urgent="true"] .phos-chip {
  background: #222 !important;
  border-color: #444 !important;
  color: #fff !important;
  transition: none !important;
}
[${ROOT_MARKER}][data-p31-urgent="true"] .phos-chip.primary {
  background: #fff !important;
  color: #000 !important;
  border-color: #fff !important;
}
[${ROOT_MARKER}] .phos-urgent-btn {
  position: absolute;
  top: -28px;
  right: 0;
  background: transparent;
  border: none;
  color: var(--p31-coral, #cc6247);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  opacity: 0.6;
  padding: 4px 8px;
}
[${ROOT_MARKER}] .phos-urgent-btn:hover { opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  [${ROOT_MARKER}] .phos-dot { transition: none; }
  [${ROOT_MARKER}] .phos-chip { transition: none; }
}
@media (max-width: 480px) {
  [${ROOT_MARKER}] {
    bottom: 12px;
    right: 12px;
  }
  [${ROOT_MARKER}] .phos-panel {
    width: 300px;
  }
}
`;

// ─── inline K₄ mark (matches the meatspace generator's drawK4Mark) ──────────
function k4MarkSvg() {
  // 4 vertices: 3 outer (triangle) + 1 centroid (the phosphorus core)
  return `
<svg viewBox="-30 -30 60 60" aria-hidden="true">
  <line x1="0" y1="22" x2="-19" y2="-11" stroke="currentColor" stroke-width="1.4" opacity="0.85"/>
  <line x1="0" y1="22" x2="19"  y2="-11" stroke="currentColor" stroke-width="1.4" opacity="0.85"/>
  <line x1="0" y1="22" x2="0"   y2="0"   stroke="currentColor" stroke-width="1.4" opacity="0.85"/>
  <line x1="-19" y1="-11" x2="19" y2="-11" stroke="currentColor" stroke-width="1.4" opacity="0.85"/>
  <line x1="-19" y1="-11" x2="0"  y2="0"   stroke="currentColor" stroke-width="1.4" opacity="0.85"/>
  <line x1="19"  y1="-11" x2="0"  y2="0"   stroke="currentColor" stroke-width="1.4" opacity="0.85"/>
  <circle cx="0"   cy="22"  r="2.6" fill="currentColor"/>
  <circle cx="-19" cy="-11" r="2.6" fill="currentColor"/>
  <circle cx="19"  cy="-11" r="2.6" fill="currentColor"/>
  <circle cx="0"   cy="0"   r="3.4" fill="#cc6247"/>
</svg>`.trim();
}

// ─── voice resolution (page key → voice entry) ──────────────────────────────
function voiceForPage(pathname) {
  if (!pathname) return VOICE._default;

  // Check data-p31-phos-page attribute first (set by BaseLayout.astro)
  // This allows explicit page targeting regardless of URL structure
  if (HAS_DOC) {
    const bodyPage = document.body?.getAttribute('data-p31-phos-page');
    if (bodyPage && VOICE[`/${bodyPage}`]) return VOICE[`/${bodyPage}`];
  }

  // Normalize: '/' → /welcome (front door), strip trailing slash so /lab/ ≡ /lab.
  // Try the normalized pathname first, then a .html-stripped variant
  // (so /buffer.html and /buffer both look up VOICE['/buffer']) — lets the
  // operator write voice keys as the natural route name in PHOS-VOICE-DRAFT.md
  // without thinking about which surfaces are static .html and which are
  // route-based.
  const root = pathname === '/' ? '/welcome' : pathname.replace(/\/+$/, '') || '/';
  if (VOICE[root]) return VOICE[root];
  const noHtml = root.replace(/\.html$/, '');
  if (noHtml !== root && VOICE[noHtml]) return VOICE[noHtml];
  return VOICE._default;
}

// ─── helpers (defensive reads of CogPass + engine state) ────────────────────
function isDismissed() {
  if (!HAS_WIN) return false;
  try { return window.localStorage.getItem(STORAGE_DISMISSED) === '1'; }
  catch { return false; }
}

function markDismissed() {
  if (!HAS_WIN) return;
  try { window.localStorage.setItem(STORAGE_DISMISSED, '1'); }
  catch { /* no-op */ }
}

function markGreeted() {
  if (!HAS_WIN) return;
  try { window.localStorage.setItem(STORAGE_GREETED, '1'); }
  catch { /* no-op */ }
}

function wasGreeted() {
  if (!HAS_WIN) return false;
  try { return window.localStorage.getItem(STORAGE_GREETED) === '1'; }
  catch { return false; }
}

function getRole() {
  if (HAS_WIN && window.p31CogPass && typeof window.p31CogPass.getRole === 'function') {
    return window.p31CogPass.getRole();
  }
  return 'stranger';
}

function isPhosGuideDisabled() {
  if (!HAS_DOC) return false;
  return document.documentElement.getAttribute('data-p31-phos-guide') === 'off';
}

function isGrayRockPinned() {
  if (!HAS_DOC) return false;
  return document.documentElement.getAttribute('data-p31-gray-rock') === 'pinned';
}

// ─── theme + appearance state (read from the engine when available) ────────
function getCurrentAppearance() {
  if (!HAS_DOC) return 'auto';
  const v = document.documentElement.getAttribute('data-p31-appearance');
  return v === 'light' || v === 'dark' ? v : 'auto';
}

// ─── screenComfort slider routing ──────────────────────────────────────────
// Slider 0-100 → coarse axis bands → engine writes
function applyScreenComfort(value) {
  const sc = Math.max(0, Math.min(100, value | 0));

  if (HAS_WIN && window.p31SubjectPrefs && typeof window.p31SubjectPrefs.set === 'function') {
    window.p31SubjectPrefs.set({
      motion:  sc < 30 ? 'reduced'  : 'full',
      density: sc < 30 ? 'spacious' : (sc > 70 ? 'compact' : 'comfortable'),
    });
  }
  if (HAS_DOC) {
    const root = document.documentElement;
    root.setAttribute('data-p31-glass',      sc < 30 ? 'off' : 'on');
    root.setAttribute('data-p31-animations', sc < 30 ? 'off' : 'on');
    if (sc < 10) {
      root.classList.add('p31-gray-rock');
      root.setAttribute('data-p31-gray-rock', 'pinned');
    } else {
      root.removeAttribute('data-p31-gray-rock');
      // Don't remove the p31-gray-rock class itself — let the existing
      // inline script's "remove on first interaction" lifecycle govern that.
    }
  }
}

// ─── urgent mode (sensory crisis / safe mode) ─────────────────────────────────
// Bypasses all inference, animation, and voice when user is in overwhelm.
// Triggered by: CogPass urgentMode flag, screenComfort < 5, or explicit toggle.

function isUrgentMode() {
  if (!HAS_WIN) return false;
  // Check explicit toggle first
  if (localStorage.getItem('p31-urgent-mode') === 'true') return true;
  // Check CogPass urgentMode flag
  try {
    const cogpass = JSON.parse(localStorage.getItem('p31-cogpass-v1') || '{}');
    if (cogpass.urgentMode === true) return true;
    if (cogpass.screenComfort != null && Number(cogpass.screenComfort) < 5) return true;
  } catch {}
  return false;
}

function clearUrgentMode() {
  if (!HAS_WIN) return;
  localStorage.removeItem('p31-urgent-mode');
  try {
    const cogpass = JSON.parse(localStorage.getItem('p31-cogpass-v1') || '{}');
    if (cogpass.urgentMode) {
      cogpass.urgentMode = false;
      localStorage.setItem('p31-cogpass-v1', JSON.stringify(cogpass));
    }
  } catch {}
}

// ─── inference engine ────────────────────────────────────────────────────────
// Deterministic signal-based routing. No ML, no network. Pure function.

const STANDARD_CHIPS = Object.freeze([
  { label: 'Find a tool',           path: '/lab',        icon: '🔬' },
  { label: 'Create my context card', path: '/passport',   icon: '🪪' },
  { label: 'Get support',           path: '/support',    icon: '💚' },
  { label: 'See what\'s live',      path: '/glass-box',  icon: '🪟' },
  { label: 'Help me decide →',      path: null,          icon: '🧭', action: 'decide' },
]);

const DECIDE_CHIPS = Object.freeze([
  { label: 'For myself',        path: '/lab',       icon: '🙋' },
  { label: 'For my family',     path: '/lab',       icon: '🏠' },
  { label: 'As a professional', path: '/glass-box', icon: '💼' },
  { label: '← Back',            path: null,         icon: null, action: 'back' },
]);

function classifyReferrer(ref) {
  if (!ref) return 'direct';
  if (/p31ca\.org/i.test(ref)) return 'internal';
  if (/phosphorus31\.org/i.test(ref)) return 'research';
  if (/twitter\.com|x\.com|linkedin\.com|facebook\.com|instagram\.com|tiktok\.com/i.test(ref)) return 'social';
  return 'external';
}

function collectSignals() {
  const hour = new Date().getHours();
  let previousPages = [];
  try { previousPages = JSON.parse(sessionStorage.getItem('p31-nav-history') || '[]'); } catch {}
  return {
    hasCogPass: HAS_WIN && !!localStorage.getItem('p31-cogpass-v1'),
    cogPassRole: getRole(),
    referrer: HAS_DOC ? document.referrer : '',
    referrerClass: classifyReferrer(HAS_DOC ? document.referrer : ''),
    isQr: HAS_WIN && /[?&]qr\b/i.test(location.search),
    device: HAS_WIN ? (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop') : 'desktop',
    timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
    previousPages,
    currentPath: HAS_WIN ? location.pathname : '/',
  };
}

function inferRoute(signals) {
  // Operator fast-path
  if (signals.cogPassRole === 'operator') {
    return {
      confidence: 0.95,
      suggestedPath: '/ops/',
      suggestedLabel: 'Ops Dashboard',
      chips: [{ label: 'Open Ops Dashboard', path: '/ops/', icon: '⬡' }, ...STANDARD_CHIPS.slice(0, 2)],
      phosMessage: "Welcome back.",
    };
  }

  // Returning user with CogPass + session history
  if (signals.hasCogPass && signals.cogPassRole === 'user' && signals.previousPages.length > 0) {
    const last = signals.previousPages[signals.previousPages.length - 1];
    return {
      confidence: 0.80,
      suggestedPath: last,
      suggestedLabel: 'Continue where you left off',
      chips: [
        { label: 'Continue →', path: last, icon: '→' },
        ...STANDARD_CHIPS.slice(0, 3),
      ],
      phosMessage: "Welcome back.",
    };
  }

  // QR scan — likely first-time visitor via printed/shared code
  if (signals.isQr || signals.referrerClass === 'external') {
    return {
      confidence: 0.80,
      suggestedPath: '/passport',
      suggestedLabel: 'Create your context card',
      chips: [
        { label: 'Create my context card', path: '/passport', icon: '🪪' },
        { label: 'Start here', path: '/welcome', icon: '👋' },
        { label: 'See what we build', path: '/lab', icon: '🔬' },
      ],
      phosMessage: "Glad you're here.",
    };
  }

  // Research referral (from phosphorus31.org — research audience)
  if (signals.referrerClass === 'research') {
    return {
      confidence: 0.75,
      suggestedPath: '/lab',
      suggestedLabel: 'Explore the tools',
      chips: [
        { label: 'Explore the tools', path: '/lab', icon: '🔬' },
        { label: 'Glass Box — what\'s live', path: '/glass-box', icon: '🪟' },
        { label: 'Create context card', path: '/passport', icon: '🪪' },
      ],
      phosMessage: null,
    };
  }

  // Default: standard chips, no strong inference signal
  return {
    confidence: 0.0,
    suggestedPath: null,
    suggestedLabel: null,
    chips: [...STANDARD_CHIPS],
    phosMessage: null,
  };
}

// Module-level inference cache (set at boot, used by renderPanelHtml)
let _inference = null;
let _chipsMode = 'standard'; // 'standard' | 'decide'

// ─── voice synthesis ─────────────────────────────────────────────────────────
// Web Speech API — zero deps, zero infrastructure.
// Fires when PHOS panel opens, not on page load (Gray Rock doctrine).
// Respects: p31-phos-voice=off localStorage flag, prefers-reduced-motion,
// and CogPass screenComfort < 10 (gray rock pinned).

function phosSpeak(text, rate = 0.92, pitch = 1.0) {
  if (!HAS_WIN || !window.speechSynthesis) return;
  if (localStorage.getItem('p31-phos-voice') === 'off') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (isGrayRockPinned()) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = rate;
  utt.pitch = pitch;
  window.speechSynthesis.cancel(); // prevent queue buildup
  window.speechSynthesis.speak(utt);
}

function isVoiceEnabled() {
  return HAS_WIN && 'speechSynthesis' in window && localStorage.getItem('p31-phos-voice') !== 'off';
}

function toggleVoice() {
  if (!HAS_WIN) return;
  if (isVoiceEnabled()) {
    localStorage.setItem('p31-phos-voice', 'off');
    window.speechSynthesis?.cancel();
  } else {
    localStorage.removeItem('p31-phos-voice');
  }
  refresh();
}

// ─── render ─────────────────────────────────────────────────────────────────
let rootEl = null;
let isOpenState = false;
let currentScreenComfort = 50;

function renderPanelHtml(voice, role) {
  // Urgent mode: simplified UI, no choices, no animations, immediate escape
  if (isUrgentMode()) {
    return `
      <div class="phos-header">
        <h2 class="phos-title">Safe Mode</h2>
        <button class="phos-close" type="button" aria-label="Close panel" data-phos-close>×</button>
      </div>
      <p class="phos-hint">All motion and sound disabled. One option available.</p>
      <div class="phos-section">
        <a class="phos-chip primary" href="/support" data-phos-link>Get to safe space →</a>
      </div>
      <div class="phos-footer">
        <span>P31 · Safe Mode</span>
        <button type="button" data-phos-urgent-clear>Exit Safe Mode</button>
      </div>
    `;
  }

  const roleBadge =
    role === 'operator' ? '<span class="phos-section-label" style="color:var(--p31-coral,#cc6247);margin-left:6px;">OP</span>' :
    role === 'user'     ? '<span class="phos-section-label" style="margin-left:6px;">CARD</span>' :
                          '';
  const escaped = (s) => String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // Chips section — shown when inference has chips (replaces static links on navigation)
  const activeChips = _chipsMode === 'decide' ? DECIDE_CHIPS : (_inference?.chips ?? null);
  let navigationSection = '';
  if (activeChips && activeChips.length > 0) {
    const chipsHtml = activeChips.map(chip => {
      if (chip.path) {
        return `<a class="phos-chip" href="${escaped(chip.path)}" data-phos-chip data-phos-link${chip.action ? ` data-phos-chip-action="${escaped(chip.action)}"` : ''}>` +
          (chip.icon ? `<span class="phos-chip-icon" aria-hidden="true">${escaped(chip.icon)}</span>` : '') +
          `${escaped(chip.label)}</a>`;
      }
      return `<button class="phos-chip" type="button" data-phos-chip data-phos-chip-action="${escaped(chip.action || '')}">${chip.icon ? `<span class="phos-chip-icon" aria-hidden="true">${escaped(chip.icon)}</span>` : ''}${escaped(chip.label)}</button>`;
    }).join('');
    navigationSection = `
      <div class="phos-section">
        <p class="phos-section-label">Where to</p>
        <div class="phos-chips" role="group" aria-label="Navigation chips">${chipsHtml}</div>
      </div>`;
  } else if (voice.links && voice.links.length > 0) {
    // Fallback to static voice links if no inference chips
    const linksHtml = voice.links
      .map(l => `<li><a href="${escaped(l.href)}" data-phos-link>${escaped(l.label)}</a></li>`)
      .join('');
    navigationSection = `
      <div class="phos-section">
        <p class="phos-section-label">Where to</p>
        <ul class="phos-links">${linksHtml}</ul>
      </div>`;
  }

  const appearance = getCurrentAppearance();
  const ap = (id, label) =>
    `<button type="button" data-phos-appearance="${id}" aria-pressed="${appearance === id ? 'true' : 'false'}">${label}</button>`;

  const hasVoiceApi = HAS_WIN && 'speechSynthesis' in window;
  const voiceOn = isVoiceEnabled();
  const voiceBtn = hasVoiceApi
    ? `<button type="button" class="phos-voice-btn" data-phos-voice-toggle data-voice-on="${voiceOn}" aria-label="${voiceOn ? 'Mute PHOS voice' : 'Enable PHOS voice'}" title="${voiceOn ? 'Mute voice' : 'Enable voice'}">${voiceOn ? '🔊' : '🔇'}</button>`
    : '';

  return `
    <div class="phos-header">
      <h2 class="phos-title">${escaped(voice.greeting)}${roleBadge}</h2>
      <button class="phos-close" type="button" aria-label="Close PHOS panel" data-phos-close>×</button>
    </div>
    ${voice.hint ? `<p class="phos-hint">${escaped(voice.hint)}</p>` : ''}
    ${voice.fallback ? `<p class="phos-fallback">${escaped(voice.fallback)}</p>` : ''}

    ${navigationSection}

    <div class="phos-section">
      <p class="phos-section-label">Comfort</p>
      <div class="phos-controls">
        <div class="phos-control-row">
          <span class="phos-control-label">Screen Comfort</span>
          <span class="phos-slider-value" data-phos-sc-value>${currentScreenComfort}</span>
        </div>
        <input class="phos-slider" type="range" min="0" max="100" step="5"
               value="${currentScreenComfort}" data-phos-screen-comfort
               aria-label="Screen Comfort (0 quiet, 100 vibrant)" />
        <div class="phos-control-row">
          <span class="phos-control-label">Appearance</span>
          <div class="phos-button-group" role="group" aria-label="Appearance">
            ${ap('auto',  'Auto')}
            ${ap('light', 'Light')}
            ${ap('dark',  'Dark')}
          </div>
        </div>
      </div>
    </div>

    <div class="phos-footer">
      <span>P31 · nine around one</span>
      <div style="display:flex;align-items:center;gap:10px;">
        ${voiceBtn}
        <button type="button" data-phos-dismiss>Don't show again</button>
      </div>
    </div>

    <button type="button" class="phos-urgent-btn" data-phos-urgent-trigger title="Enter Safe Mode (immediate calm)">Safe Mode</button>
  `;
}

function buildRoot() {
  if (!HAS_DOC) return null;
  if (rootEl) return rootEl;

  // CSS injection (idempotent)
  if (!document.querySelector(`style[${CSS_MARKER}]`)) {
    const style = document.createElement('style');
    style.setAttribute(CSS_MARKER, '');
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  rootEl = document.createElement('div');
  rootEl.setAttribute(ROOT_MARKER, '');
  rootEl.innerHTML = `
    <button class="phos-dot" type="button" aria-label="Open PHOS guide" data-phos-toggle>
      ${k4MarkSvg()}
    </button>
    <div class="phos-panel" role="dialog" aria-label="PHOS personalization guide" data-phos-panel></div>
  `;
  document.body.appendChild(rootEl);

  rootEl.addEventListener('click', onRootClick);
  rootEl.addEventListener('input',  onRootInput);
  return rootEl;
}

function refresh() {
  if (!rootEl) return;
  const voice = voiceForPage(HAS_WIN ? window.location.pathname : '/');
  const role = getRole();
  const panel = rootEl.querySelector('[data-phos-panel]');
  if (panel) panel.innerHTML = renderPanelHtml(voice, role);

  // Update urgent mode attribute on root for CSS styling
  const urgent = isUrgentMode();
  rootEl.setAttribute('data-p31-urgent', urgent ? 'true' : 'false');

  // Show/hide urgent mode trigger button based on state
  const urgentBtn = rootEl.querySelector('[data-phos-urgent-trigger]');
  if (urgentBtn) urgentBtn.style.display = urgent ? 'none' : 'block';
}

function open() {
  if (!rootEl || isDismissed() || isPhosGuideDisabled()) return;
  refresh();
  rootEl.classList.add('is-open');
  isOpenState = true;
  markGreeted();
  dispatch('p31:phos-opened');

  // Voice synthesis fires on open, not on page load (Gray Rock doctrine)
  const voice = voiceForPage(HAS_WIN ? window.location.pathname : '/');
  const inferMsg = _inference?.phosMessage;
  const speakText = inferMsg
    ? `${voice.greeting} ${inferMsg}`
    : voice.greeting;
  // Small delay so the panel renders before speech starts
  setTimeout(() => phosSpeak(speakText), 300);
}

function close() {
  if (!rootEl) return;
  rootEl.classList.remove('is-open');
  isOpenState = false;
  dispatch('p31:phos-closed');
}

function toggle() { (isOpenState ? close : open)(); }

function dismiss() {
  markDismissed();
  if (rootEl && rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
  rootEl = null;
  isOpenState = false;
  dispatch('p31:phos-dismissed');
}

function dispatch(name, detail = {}) {
  if (!HAS_DOC) return;
  try { document.dispatchEvent(new CustomEvent(name, { detail })); }
  catch { /* no-op */ }
}

// ─── event delegation on rootEl ─────────────────────────────────────────────
function onRootClick(e) {
  const t = e.target.closest('[data-phos-toggle], [data-phos-close], [data-phos-dismiss], [data-phos-appearance], [data-phos-link], [data-phos-chip], [data-phos-voice-toggle], [data-phos-urgent-clear]');
  if (!t) return;

  if (t.matches('[data-phos-toggle]')) { toggle(); return; }
  if (t.matches('[data-phos-close]'))  { close();  return; }
  if (t.matches('[data-phos-dismiss]')) { dismiss(); return; }

  if (t.matches('[data-phos-urgent-clear]')) {
    clearUrgentMode();
    refresh();
    return;
  }

  if (t.matches('[data-phos-urgent-trigger]')) {
    if (HAS_WIN) localStorage.setItem('p31-urgent-mode', 'true');
    refresh();
    return;
  }

  if (t.matches('[data-phos-voice-toggle]')) {
    toggleVoice();
    return;
  }

  if (t.matches('[data-phos-appearance]')) {
    const ap = t.getAttribute('data-phos-appearance');
    if (HAS_WIN && window.p31Theme && typeof window.p31Theme.setAppearance === 'function') {
      window.p31Theme.setAppearance(ap);
    } else if (HAS_DOC) {
      document.documentElement.setAttribute('data-p31-appearance', ap === 'auto' ? 'hub' : ap);
    }
    refresh();
    return;
  }

  // Chip action buttons (no href — Akinator flow)
  if (t.matches('[data-phos-chip]')) {
    const action = t.getAttribute('data-phos-chip-action');
    if (action === 'decide') {
      _chipsMode = 'decide';
      refresh();
      e.preventDefault();
      return;
    }
    if (action === 'back') {
      _chipsMode = 'standard';
      refresh();
      e.preventDefault();
      return;
    }
    // Chip with href — track nav history then let it follow naturally
    const href = t.getAttribute('href');
    if (href && HAS_WIN) {
      try {
        const history = JSON.parse(sessionStorage.getItem('p31-nav-history') || '[]');
        history.push(href);
        if (history.length > 10) history.shift();
        sessionStorage.setItem('p31-nav-history', JSON.stringify(history));
      } catch {}
    }
    // href chips follow naturally; button chips were handled above
    return;
  }
  // [data-phos-link] follows its href naturally — no preventDefault
}

function onRootInput(e) {
  const t = e.target;
  if (t && t.matches && t.matches('[data-phos-screen-comfort]')) {
    currentScreenComfort = Number(t.value) | 0;
    const v = rootEl && rootEl.querySelector('[data-phos-sc-value]');
    if (v) v.textContent = String(currentScreenComfort);
    applyScreenComfort(currentScreenComfort);
  }
}

// ─── voice loader (defaults baked in; runtime fetches p31-phos-voice.json) ─
// p31-phos-voice.json schema: p31.phosVoice/1.0.0 (built by
// scripts/build-phos-voice-json.mjs from docs/PHOS-VOICE-DRAFT.md §4).
// Top-level _meta key is metadata (skipped here); other keys are pathnames
// pointing to { _tag, _tagSource?, greeting, hint, fallback, links }.
// _tag and _tagSource are passed through harmlessly (voiceForPage reads only
// greeting/hint/fallback/links). Keeping them lets future PHOS UI surface
// "operator-voice vs draft" badges or ?phos-debug=tags views.
function setVoice(obj) {
  if (!obj || typeof obj !== 'object') return;
  // Strip _meta before merging so it doesn't pollute the voice map
  const { _meta: _ignored, ...slotEntries } = obj;
  VOICE = { ...DEFAULT_VOICE, ...slotEntries };
  refresh();
}

async function tryLoadVoiceJson() {
  if (!HAS_WIN || !window.fetch) return;
  try {
    const res = await fetch('/lib/p31-phos-voice.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) return;
    const json = await res.json();
    if (json && typeof json === 'object') setVoice(json);
  } catch { /* file not yet committed; defaults stand */ }
}

// ─── boot ────────────────────────────────────────────────────────────────────
function boot() {
  if (!HAS_DOC || !HAS_WIN) return;

  // Suppress the floating theme-switcher widget — PHOS owns this surface now.
  // Set the auto-mount guard BEFORE the switcher's setTimeout(100) fires.
  if (!window.p31ThemeSwitcher) {
    window.p31ThemeSwitcher = {
      _supersededByPhos: true,
      // No-op shims so any external caller doesn't crash
      open:  () => open(),
      close: () => close(),
    };
  }

  if (isPhosGuideDisabled()) return; // CogPass stylePreferences.phosGuide=false
  if (isDismissed())         return; // operator chose "Don't show again"

  buildRoot();

  // Run inference at boot (passive, no user interaction required)
  _inference = inferRoute(collectSignals());
  _chipsMode = 'standard';

  refresh();

  // Notify the page that PHOS has booted with inference results
  dispatch('p31:phos-booted', { inference: _inference });

  // Hot updates: re-render when CogPass loads / clears (role + voice may change)
  document.addEventListener('p31:cogpass-loaded', () => {
    _inference = inferRoute(collectSignals());
    _chipsMode = 'standard';
    refresh();
  });
  document.addEventListener('p31:cogpass-cleared', () => {
    _inference = inferRoute(collectSignals());
    _chipsMode = 'standard';
    refresh();
  });

  // Best-effort voice JSON pickup when operator's §4 lands
  tryLoadVoiceJson();

  // Auto-expand on /welcome on first visit (operator voice §3.2 first-greeting)
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/welcome';
  const isWelcome = pathname === '/welcome' || pathname === '/' || pathname === '';
  if (isWelcome && !wasGreeted() && !isGrayRockPinned()) {
    // Defer so the page can paint Layer 1 first — Gray Rock doctrine
    setTimeout(open, 600);
  }
}

// ─── install + boot ─────────────────────────────────────────────────────────
if (HAS_WIN) {
  window.p31PhosGuide = Object.freeze({
    open,
    close,
    toggle,
    dismiss,
    isOpen:       () => isOpenState,
    isDismissed,
    setVoice,
    refresh,
    speak:        phosSpeak,
    getInference: () => _inference,
    collectSignals,
    inferRoute,
    isUrgentMode,
    setUrgentMode: (v) => { if (HAS_WIN) localStorage.setItem('p31-urgent-mode', v ? 'true' : 'false'); refresh(); },
    clearUrgentMode,
  });

  if (HAS_DOC) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  }
}

export {
  STORAGE_DISMISSED,
  STORAGE_GREETED,
  DEFAULT_VOICE,
  voiceForPage,
  k4MarkSvg,
  applyScreenComfort,
  collectSignals,
  inferRoute,
  phosSpeak,
  open, close, toggle, dismiss,
  isDismissed, setVoice, refresh,
  boot,
};

export default {
  open, close, toggle, dismiss,
  isDismissed, setVoice, refresh,
  speak: phosSpeak,
  getInference: () => _inference,
  collectSignals,
  inferRoute,
};
