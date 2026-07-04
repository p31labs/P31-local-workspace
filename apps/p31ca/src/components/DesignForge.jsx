import { useState, useCallback } from "react";

const TOKENS = {
  void: "#0f1115",
  surface: "#161920",
  surface2: "#1c2028",
  glassBorder: "rgba(255,255,255,0.06)",
  cloud: "#e8e6e3",
  muted: "#6b7280",
  teal: "#5DCAA5",
  cyan: "#4db8a8",
  coral: "#cc6247",
  amber: "#cda852",
  lavender: "#8b7cc9",
  phosphorus: "#5dca5d",
};

const CATEGORIES = [
  { id: "pages", label: "Page Templates", icon: "📄" },
  { id: "components", label: "UI Components", icon: "🧩" },
  { id: "patterns", label: "Design Patterns", icon: "🎨" },
  { id: "documents", label: "Document Generators", icon: "📝" },
  { id: "tokens", label: "Token Reference", icon: "🎯" },
];

const TEMPLATES = {
  pages: [
    {
      id: "landing",
      name: "Landing Page",
      desc: "Hero + mission + product grid + publications + CTA",
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[PAGE TITLE] — P31 Labs</title>
  <meta name="description" content="[DESCRIPTION]">
  <meta property="og:title" content="[PAGE TITLE] — P31 Labs">
  <meta property="og:description" content="[DESCRIPTION]">
  <meta property="og:type" content="website">
  <meta property="og:image" content="/og/[PAGE]-og.png">
  <link rel="stylesheet" href="/p31-style.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--p31-void); color: var(--p31-cloud);
           font-family: var(--p31-font-sans); min-height: 100vh;
           -webkit-font-smoothing: antialiased; line-height: 1.6; }
    a { color: inherit; text-decoration: none; }
    :focus-visible { outline: 2px solid var(--p31-teal); outline-offset: 2px; border-radius: 4px; }

    .skip-link { position: absolute; top: -40px; left: 0; background: var(--p31-teal);
                 color: #000; padding: 8px 16px; z-index: 1000; font-weight: 700;
                 transition: top 0.2s; border-radius: 0 0 4px 0; }
    .skip-link:focus { top: 0; }

    .top-nav { display: flex; justify-content: space-between; align-items: center;
               padding: 1.5rem; border-bottom: 1px solid var(--p31-glass-border);
               background: rgba(15,17,21,0.8); backdrop-filter: blur(10px); z-index: 50; }
    .nav-brand { display: flex; align-items: center; gap: 0.5rem;
                 font-weight: 700; font-size: 0.9rem; }

    .btn-safe { padding: 0.5rem 0.75rem; border: 1px solid rgba(204,98,71,0.3);
                border-radius: 6px; background: rgba(204,98,71,0.08); color: var(--p31-coral);
                font-family: var(--p31-font-mono); font-size: 0.75rem; text-transform: uppercase;
                cursor: pointer; min-height: 44px; }

    .hero { padding: 4rem 2rem; text-align: center; max-width: 800px; margin: 0 auto; }
    .hero h1 { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 1rem; }
    .hero p { color: var(--p31-muted); font-size: 1.15rem; margin-bottom: 2rem; }

    .btn-primary { background: var(--p31-teal); color: #000; padding: 0.8rem 1.5rem;
                   border: none; border-radius: 8px; font-weight: 700; cursor: pointer;
                   font-family: var(--p31-font-sans); min-height: 44px; font-size: 1rem; }
    .btn-secondary { background: transparent; color: var(--p31-cloud); padding: 0.8rem 1.5rem;
                     border: 1px solid var(--p31-glass-border); border-radius: 8px;
                     font-weight: 600; cursor: pointer; min-height: 44px; }

    .section { max-width: 1000px; margin: 0 auto; padding: 3rem 2rem; }
    .section h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; }

    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }

    .glass-card { background: color-mix(in srgb, var(--p31-surface2) 60%, transparent);
                  border: 1px solid var(--p31-glass-border); border-radius: 12px;
                  padding: 2rem; backdrop-filter: blur(20px); }
    .glass-card h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
    .glass-card p { color: var(--p31-muted); font-size: 0.95rem; }

    .footer { padding: 1.5rem; display: flex; justify-content: center; gap: 2rem;
              border-top: 1px solid var(--p31-glass-border); background: var(--p31-surface);
              font-family: var(--p31-font-mono); font-size: 0.85rem;
              text-transform: uppercase; letter-spacing: 0.1em; color: var(--p31-muted); }

    body.safe-mode * { animation: none !important; transition: none !important; }
    body.safe-mode canvas, body.safe-mode .hide-safe { display: none !important; }
    body.safe-mode .glass-card { backdrop-filter: none; }
  </style>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <nav class="top-nav">
    <a href="/" class="nav-brand">
      <svg viewBox="0 0 100 100" width="24" height="24" fill="none" aria-hidden="true">
        <path d="M50 10 L90 85 L10 85 Z" stroke="#5DCAA5" stroke-width="5" stroke-linejoin="round"/>
        <path d="M50 10 L50 60 L90 85" stroke="#cc6247" stroke-width="5" stroke-linejoin="round" opacity="0.8"/>
        <path d="M50 60 L10 85" stroke="#cda852" stroke-width="5" stroke-linejoin="round" opacity="0.6"/>
      </svg>
      P31 Labs
    </a>
    <button class="btn-safe safe-toggle" aria-pressed="false"
            aria-label="Toggle safe mode">Safe Mode</button>
  </nav>

  <main id="main-content">
    <section class="hero">
      <h1>[HEADLINE]</h1>
      <p>[SUBHEADLINE — one sentence describing the page purpose]</p>
      <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
        <button class="btn-primary">[PRIMARY CTA]</button>
        <button class="btn-secondary">[SECONDARY CTA]</button>
      </div>
    </section>

    <section class="section">
      <h2>[SECTION TITLE]</h2>
      <div class="grid">
        <article class="glass-card">
          <h3>[CARD TITLE]</h3>
          <p>[CARD DESCRIPTION]</p>
        </article>
        <!-- Repeat cards as needed -->
      </div>
    </section>
  </main>

  <footer class="footer">
    <a href="/build">Build</a>
    <a href="/geodesic">Create</a>
    <a href="/connect">Connect</a>
  </footer>

  <script src="/public/lib/p31-safe-mode.js"><\/script>
  <script src="/public/lib/p31-phos-router.js"><\/script>
</body>
</html>`,
    },
    {
      id: "tool",
      name: "Interactive Tool Page",
      desc: "4-state tool surface with save/load, slider controls, output preview",
      code: `<!-- INTERACTIVE TOOL PAGE TEMPLATE -->
<!-- States: empty, loading, error, normal -->
<!-- Pattern: Passport, Observatory, any tool with user input → output -->

<main id="main-content" class="page-wrapper">
  <div class="header-row">
    <div class="title-group">
      <h1><span aria-hidden="true">[ICON]</span> [TOOL NAME]</h1>
      <p class="tagline">[ONE-LINE DESCRIPTION]</p>
    </div>
  </div>

  <!-- State: Loading -->
  <div id="state-loading" role="status" aria-label="Loading">
    <div class="glass-card">
      <div class="skeleton sk-line short"></div>
      <div class="skeleton sk-block"></div>
    </div>
  </div>

  <!-- State: Empty -->
  <div id="state-empty">
    <div class="glass-card" style="text-align:center; padding:3rem 2rem;">
      <span style="font-size:3rem; display:block; margin-bottom:1rem;">[ICON]</span>
      <h2>[EMPTY MESSAGE]</h2>
      <p style="color:var(--p31-muted); margin-bottom:2rem;">[EMPTY DESCRIPTION]</p>
      <button class="btn-primary" id="createBtn">[CREATE CTA]</button>
    </div>
  </div>

  <!-- State: Error -->
  <div id="state-error">
    <div class="glass-card" style="border-color:rgba(204,98,71,0.3); background:rgba(204,98,71,0.05);">
      <h2 style="color:var(--p31-coral);">[ERROR TITLE]</h2>
      <p style="color:var(--p31-muted); margin-bottom:1.5rem;">[ERROR DESCRIPTION]</p>
      <button class="btn-secondary" id="retryBtn">[RETRY/CONTINUE]</button>
    </div>
  </div>

  <!-- State: Normal -->
  <div id="state-normal">
    <!-- Controls -->
    <div class="glass-card" style="margin-bottom:2rem;">
      <h2>[CONTROL SECTION]</h2>
      <label for="mainSlider" class="sr-only">[SLIDER DESCRIPTION]</label>
      <input type="range" id="mainSlider" min="0" max="100" value="50"
             aria-label="[SLIDER LABEL]" style="width:100%; height:44px;">
    </div>

    <!-- Output -->
    <div class="glass-card">
      <h2>[OUTPUT SECTION]</h2>
      <pre id="output" aria-label="Generated output" tabindex="0"></pre>
      <div style="display:flex; gap:0.75rem; margin-top:1.5rem; flex-wrap:wrap;">
        <button class="btn-primary" id="saveBtn">Save</button>
        <button class="btn-secondary" id="copyBtn">Copy</button>
      </div>
      <div class="save-notice" id="notice" aria-live="polite"></div>
    </div>
  </div>
</main>

<script>
// State management
function showState(id) {
  ['state-loading','state-empty','state-error','state-normal'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? 'block' : 'none';
  });
}

// Init
function init() {
  showState('state-loading');
  setTimeout(() => {
    const saved = localStorage.getItem('[STORAGE_KEY]');
    if (saved) { showState('state-normal'); loadSaved(saved); }
    else { showState('state-empty'); }
  }, 80);
}

init();
<\/script>`,
    },
    {
      id: "about",
      name: "About / Team Page",
      desc: "Story + team cards + timeline + values",
      code: `<!-- ABOUT PAGE TEMPLATE -->
<section class="section">
  <h2>Our story</h2>
  <div class="glass-card" style="max-width:720px;">
    <p>[FOUNDING STORY — 2-3 paragraphs]</p>
  </div>
</section>

<section class="section">
  <h2>Team</h2>
  <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
    <!-- Team card -->
    <div class="glass-card" style="text-align:center;">
      <div style="width:80px; height:80px; border-radius:50%; background:var(--p31-surface);
                  margin:0 auto 1rem; display:flex; align-items:center; justify-content:center;
                  font-size:2rem; border:2px solid var(--p31-teal);">
        [INITIAL]
      </div>
      <h3>[NAME]</h3>
      <p style="color:var(--p31-muted); font-size:0.9rem;">[ROLE]</p>
    </div>
  </div>
</section>

<section class="section">
  <h2>Timeline</h2>
  <div style="border-left:2px solid var(--p31-glass-border); padding-left:2rem; margin-left:1rem;">
    <!-- Timeline entry -->
    <div style="margin-bottom:2rem; position:relative;">
      <div style="position:absolute; left:-2.65rem; top:0.3rem; width:10px; height:10px;
                  border-radius:50%; background:var(--p31-teal);"></div>
      <div style="font-family:var(--p31-font-mono); font-size:0.8rem; color:var(--p31-muted);
                  margin-bottom:0.25rem;">[DATE]</div>
      <h3 style="font-size:1rem; margin-bottom:0.25rem;">[MILESTONE]</h3>
      <p style="color:var(--p31-muted); font-size:0.9rem;">[DESCRIPTION]</p>
    </div>
  </div>
</section>`,
    },
    {
      id: "glossary",
      name: "Glossary / Reference",
      desc: "Searchable term list with dual definitions and anchor links",
      code: `<!-- GLOSSARY PAGE TEMPLATE -->
<div class="search-wrap" style="position:relative; margin-bottom:1.5rem;">
  <span style="position:absolute; left:0.9rem; top:50%; transform:translateY(-50%);
               color:var(--p31-muted); pointer-events:none;" aria-hidden="true">🔍</span>
  <input type="search" id="termSearch" placeholder="Search terminology..."
         aria-label="Search terms" autocomplete="off"
         style="width:100%; padding:0.9rem 1rem 0.9rem 2.75rem; background:rgba(0,0,0,0.2);
                border:1px solid var(--p31-glass-border); border-radius:8px;
                color:var(--p31-cloud); font-size:1rem;">
</div>

<p id="termCount" aria-live="polite" style="font-family:var(--p31-font-mono);
   font-size:0.8rem; color:var(--p31-muted); margin-bottom:1.5rem;"></p>

<div id="termList" role="list" aria-label="Terms">
  <!-- Term card (repeat per term) -->
  <article class="term-card" id="term-[SLUG]" role="listitem"
           style="background:color-mix(in srgb, var(--p31-surface) 60%, transparent);
                  border:1px solid var(--p31-glass-border); border-left:3px solid var(--p31-lavender);
                  border-radius:8px; padding:1.5rem; margin-bottom:1rem; scroll-margin-top:1.5rem;">
    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.75rem;">
      <span style="font-size:1.2rem; font-weight:700; font-family:var(--p31-font-mono);">[TERM]</span>
      <a href="#term-[SLUG]" aria-label="Permalink to [TERM]"
         style="color:var(--p31-muted); font-size:0.85rem; padding:0.25rem 0.5rem;
                min-width:44px; min-height:44px; display:inline-flex; align-items:center;">#</a>
    </div>
    <p style="margin-bottom:0.5rem;">[PLAIN LANGUAGE DEFINITION — Flesch-Kincaid ≤ 10th grade]</p>
    <p style="font-size:0.88rem; color:var(--p31-muted); font-family:var(--p31-font-mono);
              border-top:1px solid var(--p31-glass-border); padding-top:0.5rem; margin-top:0.5rem;">
      <strong style="color:var(--p31-lavender);">Technical:</strong> [TECHNICAL DEFINITION]
    </p>
  </article>
</div>

<div id="noResults" style="display:none; text-align:center; padding:3rem; color:var(--p31-muted);">
  <p id="noResultsMsg">No terms found.</p>
  <p style="font-size:0.85rem;">Try a shorter word or clear the search.</p>
</div>`,
    },
    {
      id: "dashboard",
      name: "Dashboard / Metrics",
      desc: "Metric cards + status panels + gauges",
      code: `<!-- DASHBOARD PAGE TEMPLATE -->
<section class="section">
  <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
    <!-- Metric card -->
    <div class="glass-card" style="text-align:center;">
      <div style="font-family:var(--p31-font-mono); font-size:0.75rem; text-transform:uppercase;
                  letter-spacing:0.1em; color:var(--p31-muted); margin-bottom:0.5rem;">[LABEL]</div>
      <div style="font-size:2.5rem; font-weight:700; color:var(--p31-teal);
                  font-family:var(--p31-font-mono);">[VALUE]</div>
      <div style="font-size:0.8rem; color:var(--p31-muted); margin-top:0.25rem;">[UNIT / CONTEXT]</div>
    </div>
  </div>
</section>

<section class="section">
  <h2>Status</h2>
  <!-- Status row -->
  <div style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem 0;
              border-bottom:1px solid var(--p31-glass-border);">
    <span style="width:8px; height:8px; border-radius:50%; background:var(--p31-phosphorus);
                 flex-shrink:0;"></span>
    <span style="flex:1;">[SYSTEM NAME]</span>
    <span style="font-family:var(--p31-font-mono); font-size:0.85rem; color:var(--p31-muted);">[STATUS]</span>
  </div>
</section>`,
    },
    {
      id: "support",
      name: "Support / Crisis Page",
      desc: "Minimal, calm, large touch targets, single-purpose",
      code: `<!-- SUPPORT PAGE — MINIMAL, CALM, LARGE TARGETS -->
<!-- This page auto-triggers safe mode -->
<main id="main-content" style="max-width:600px; margin:0 auto; padding:2rem;">
  <h1 style="font-size:1.75rem; text-align:center; margin-bottom:2rem;">You're not alone</h1>

  <div class="glass-card" style="margin-bottom:1.5rem; text-align:center;">
    <p style="font-size:1.1rem; margin-bottom:1.5rem;">What do you need right now?</p>

    <a href="tel:988" style="display:block; padding:1.25rem; min-height:60px;
       background:var(--p31-teal); color:#000; border-radius:12px; font-weight:700;
       font-size:1.1rem; margin-bottom:1rem; text-align:center;">
      Call 988 (Suicide & Crisis Lifeline)
    </a>

    <a href="sms:741741&body=HELLO" style="display:block; padding:1.25rem; min-height:60px;
       background:var(--p31-surface2); border:1px solid var(--p31-glass-border);
       border-radius:12px; font-weight:600; margin-bottom:1rem; text-align:center;">
      Text HOME to 741741 (Crisis Text Line)
    </a>

    <a href="/" style="display:block; padding:1rem; min-height:44px; color:var(--p31-muted);
       text-align:center; font-size:0.9rem;">
      Go home
    </a>
  </div>

  <p style="text-align:center; color:var(--p31-muted); font-size:0.85rem;">
    Calcitriol helps. Calcium helps. Water helps. Rest helps.
  </p>
</main>

<script>
  // Auto-engage safe mode on support page
  document.body.classList.add('safe-mode');
<\/script>`,
    },
  ],
  components: [
    {
      id: "glass-card",
      name: "Glass Card",
      desc: "Standard glass morphism container — the P31 building block",
      code: `.glass-card {
  background: color-mix(in srgb, var(--p31-surface2) 60%, transparent);
  border: 1px solid var(--p31-glass-border);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

body.safe-mode .glass-card {
  backdrop-filter: none;
  background: var(--p31-surface2);
}

/* Variants */
.glass-card.accent-teal   { border-left: 3px solid var(--p31-teal); }
.glass-card.accent-coral  { border-left: 3px solid var(--p31-coral); }
.glass-card.accent-amber  { border-left: 3px solid var(--p31-amber); }
.glass-card.accent-lavender { border-left: 3px solid var(--p31-lavender); }

/* Usage: <div class="glass-card accent-teal">...</div> */`,
    },
    {
      id: "btn-system",
      name: "Button System",
      desc: "Primary, secondary, danger, ghost, icon buttons",
      code: `/* ── P31 Button System ── */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; padding: 0.8rem 1.5rem; border-radius: 8px;
  font-family: var(--p31-font-sans); font-size: 1rem; font-weight: 700;
  cursor: pointer; min-height: 44px; border: none;
  transition: filter 150ms, transform 100ms;
  user-select: none; -webkit-tap-highlight-color: transparent;
}
.btn:active { transform: scale(0.97); }
.btn:focus-visible { outline: 2px solid var(--p31-teal); outline-offset: 2px; }

.btn-primary   { background: var(--p31-teal); color: #000; }
.btn-primary:hover { filter: brightness(1.1); }

.btn-secondary { background: transparent; color: var(--p31-cloud);
                 border: 1px solid var(--p31-glass-border); }
.btn-secondary:hover { border-color: var(--p31-teal); color: var(--p31-teal); }

.btn-danger    { background: var(--p31-coral); color: #fff; }
.btn-danger:hover { filter: brightness(1.1); }

.btn-ghost     { background: transparent; color: var(--p31-muted); padding: 0.5rem 0.75rem; }
.btn-ghost:hover { color: var(--p31-cloud); }

.btn-icon      { width: 44px; padding: 0; border-radius: 8px; }

/* Safe mode button (special) */
.btn-safe {
  padding: 0.5rem 0.75rem; border: 1px solid rgba(204,98,71,0.3);
  border-radius: 6px; background: rgba(204,98,71,0.08); color: var(--p31-coral);
  font-family: var(--p31-font-mono); font-size: 0.75rem; text-transform: uppercase;
  cursor: pointer; min-height: 44px;
}

/* Children's surfaces: 60px minimum */
.child-surface .btn { min-height: 60px; font-size: 1.15rem; padding: 14px 20px; }

body.safe-mode .btn { transition: none; }`,
    },
    {
      id: "input-system",
      name: "Input System",
      desc: "Text input, search, textarea, select, slider, toggle",
      code: `/* ── P31 Input System ── */
.input {
  width: 100%; padding: 0.8rem 1rem; background: rgba(0,0,0,0.2);
  border: 1px solid var(--p31-glass-border); border-radius: 8px;
  color: var(--p31-cloud); font-family: var(--p31-font-sans); font-size: 1rem;
  transition: border-color 200ms;
}
.input:focus { border-color: var(--p31-teal); outline: none; }
.input::placeholder { color: var(--p31-muted); }

.input-search { padding-left: 2.75rem; } /* Room for search icon */

.textarea { min-height: 120px; resize: vertical; line-height: 1.6; }

.select {
  appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 1rem center;
  padding-right: 2.5rem; cursor: pointer;
}

.slider { width: 100%; height: 44px; accent-color: var(--p31-teal); cursor: pointer; }

/* Toggle switch */
.toggle { position: relative; width: 48px; height: 28px; cursor: pointer; }
.toggle input { opacity: 0; width: 100%; height: 100%; position: absolute; cursor: pointer; }
.toggle-track { width: 48px; height: 28px; background: var(--p31-surface2);
                border: 1px solid var(--p31-glass-border); border-radius: 14px;
                transition: background 200ms; }
.toggle input:checked + .toggle-track { background: var(--p31-teal); border-color: var(--p31-teal); }
.toggle-thumb { position: absolute; top: 4px; left: 4px; width: 20px; height: 20px;
                background: var(--p31-cloud); border-radius: 50%; transition: transform 200ms;
                pointer-events: none; }
.toggle input:checked ~ .toggle-thumb { transform: translateX(20px); }

/* Label */
.label { display: block; font-size: 0.85rem; color: var(--p31-muted);
         font-family: var(--p31-font-mono); margin-bottom: 0.5rem; text-transform: uppercase;
         letter-spacing: 0.05em; }

/* Form group */
.form-group { margin-bottom: 1.5rem; }`,
    },
    {
      id: "badge-system",
      name: "Badge / Status System",
      desc: "Inline status indicators, pills, tags",
      code: `/* ── P31 Badge System ── */
.badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.25rem 0.75rem; border-radius: 99px;
  font-size: 0.8rem; font-family: var(--p31-font-mono); font-weight: 500;
}

.badge-live      { background: rgba(93,202,93,0.1); border: 1px solid rgba(93,202,93,0.3);
                   color: var(--p31-phosphorus); }
.badge-progress  { background: rgba(205,168,82,0.1); border: 1px solid rgba(205,168,82,0.3);
                   color: var(--p31-amber); }
.badge-draft     { background: rgba(139,124,201,0.1); border: 1px solid rgba(139,124,201,0.3);
                   color: var(--p31-lavender); }
.badge-critical  { background: rgba(204,98,71,0.1); border: 1px solid rgba(204,98,71,0.3);
                   color: var(--p31-coral); }
.badge-neutral   { background: var(--p31-surface); border: 1px solid var(--p31-glass-border);
                   color: var(--p31-muted); }

/* Status dot */
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-dot.live     { background: var(--p31-phosphorus); }
.status-dot.warning  { background: var(--p31-amber); }
.status-dot.critical { background: var(--p31-coral); }
.status-dot.offline  { background: var(--p31-muted); }

/* Tag */
.tag { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px;
       font-size: 0.75rem; font-family: var(--p31-font-mono);
       background: var(--p31-surface); color: var(--p31-muted); }`,
    },
    {
      id: "nav-system",
      name: "Navigation Components",
      desc: "Top nav, sidebar, breadcrumbs, tabs, pagination",
      code: `/* ── P31 Navigation System ── */

/* Top Nav */
.top-nav {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.5rem; border-bottom: 1px solid var(--p31-glass-border);
  background: rgba(15,17,21,0.8); backdrop-filter: blur(10px);
  position: sticky; top: 0; z-index: 50;
}
.nav-brand { display: flex; align-items: center; gap: 0.5rem;
             font-weight: 700; font-size: 0.9rem; color: var(--p31-cloud); }
.nav-links { display: flex; gap: 1.5rem; align-items: center; }
.nav-link { color: var(--p31-muted); font-size: 0.9rem; transition: color 150ms; }
.nav-link:hover, .nav-link.active { color: var(--p31-cloud); }

/* Breadcrumbs */
.breadcrumbs { display: flex; gap: 0.5rem; align-items: center;
               font-size: 0.85rem; color: var(--p31-muted); padding: 1rem 0; }
.breadcrumbs a { color: var(--p31-muted); }
.breadcrumbs a:hover { color: var(--p31-cloud); }
.breadcrumbs .separator { opacity: 0.3; }
.breadcrumbs .current { color: var(--p31-cloud); }

/* Tabs */
.tabs { display: flex; gap: 0; border-bottom: 1px solid var(--p31-glass-border); }
.tab { padding: 0.75rem 1.25rem; color: var(--p31-muted); font-size: 0.9rem;
       cursor: pointer; border-bottom: 2px solid transparent; transition: all 150ms;
       min-height: 44px; background: none; border-top: none; border-left: none; border-right: none; }
.tab:hover { color: var(--p31-cloud); }
.tab.active { color: var(--p31-teal); border-bottom-color: var(--p31-teal); }

body.safe-mode .top-nav { backdrop-filter: none; background: var(--p31-surface); }`,
    },
    {
      id: "skeleton",
      name: "Loading Skeleton",
      desc: "Shimmer loading placeholders matching content shapes",
      code: `/* ── P31 Loading Skeleton ── */
.skeleton {
  background: linear-gradient(90deg, var(--p31-surface) 25%,
              var(--p31-surface2) 50%, var(--p31-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

body.safe-mode .skeleton { animation: none; background: var(--p31-surface2); }

/* Preset sizes */
.sk-line       { height: 1rem; margin-bottom: 0.75rem; }
.sk-line.wide  { width: 100%; }
.sk-line.medium { width: 60%; }
.sk-line.short { width: 35%; }
.sk-block      { height: 8rem; width: 100%; margin-bottom: 1rem; }
.sk-avatar     { width: 48px; height: 48px; border-radius: 50%; }
.sk-card       { height: 12rem; width: 100%; border-radius: 12px; }

/* Usage:
<div class="skeleton sk-line short"></div>
<div class="skeleton sk-block"></div>
*/`,
    },
    {
      id: "toast",
      name: "Toast / Notification",
      desc: "Transient feedback messages",
      code: `/* ── P31 Toast System ── */
.toast-container {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 200;
  display: flex; flex-direction: column; gap: 0.75rem; max-width: 360px;
}
.toast {
  padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem;
  display: flex; align-items: center; gap: 0.75rem;
  animation: toast-in 200ms ease-out;
  border: 1px solid var(--p31-glass-border);
  background: var(--p31-surface2);
}
.toast.success { border-color: rgba(93,202,93,0.3); }
.toast.warning { border-color: rgba(205,168,82,0.3); }
.toast.error   { border-color: rgba(204,98,71,0.3); }

.toast .toast-icon { flex-shrink: 0; font-size: 1.1rem; }
.toast .toast-msg  { flex: 1; }
.toast .toast-close { cursor: pointer; color: var(--p31-muted); padding: 4px;
                      min-width: 44px; min-height: 44px; display: flex;
                      align-items: center; justify-content: center; }

@keyframes toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
body.safe-mode .toast { animation: none; }

/* JS: showToast('Saved!', 'success', 3000) */`,
    },
  ],
  patterns: [
    {
      id: "four-states",
      name: "Four-State Pattern",
      desc: "Empty → Loading → Error → Normal state machine for any interactive surface",
      code: `/* ── Four-State Pattern ── */
/* Every interactive P31 surface implements exactly 4 states.
   Only one is visible at a time. */

#state-loading, #state-empty, #state-error, #state-normal { display: none; }
#state-loading.active, #state-empty.active,
#state-error.active, #state-normal.active { display: block; }

/* JS Controller */
function showState(id) {
  ['state-loading','state-empty','state-error','state-normal'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle('active', s === id);
  });
}

function init() {
  showState('state-loading');
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    setTimeout(() => {
      if (!checkStorage()) { showState('state-error'); return; }
      if (saved) { showState('state-normal'); hydrate(saved); }
      else { showState('state-empty'); }
    }, 80);
  } catch(e) { showState('state-error'); }
}`,
    },
    {
      id: "responsive-grid",
      name: "Responsive Grid",
      desc: "Auto-fit grid with glass cards — 1 to 4 columns",
      code: `/* ── P31 Responsive Grid ── */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Force 2 columns on medium screens */
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

/* Force 3 columns */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

/* Stack on mobile */
@media (max-width: 640px) {
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
}

/* Masonry-like with varying heights */
.grid-masonry {
  columns: 2;
  column-gap: 1.5rem;
}
.grid-masonry > * {
  break-inside: avoid;
  margin-bottom: 1.5rem;
}
@media (max-width: 640px) {
  .grid-masonry { columns: 1; }
}`,
    },
    {
      id: "safe-mode-contract",
      name: "Safe Mode Contract",
      desc: "How every surface implements SOULSAFE / Gray Rock",
      code: `/* ── SOULSAFE / Gray Rock Protocol ── */
/* EVERY P31 surface MUST include this contract */

/* Step 1: Include the shared module */
/* <script src="/public/lib/p31-safe-mode.js"><\/script> */

/* Step 2: Include these CSS rules */
body.safe-mode {
  --p31-void: #000;
  --p31-surface: #0a0a0a;
  --p31-surface2: #111;
  --p31-cloud: #fff;
  --p31-muted: #888;
}
body.safe-mode * {
  animation: none !important;
  transition: none !important;
}
body.safe-mode canvas,
body.safe-mode .hide-safe {
  display: none !important;
}
body.safe-mode .glass-card {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

/* Step 3: For WebGL surfaces, listen for teardown event */
document.addEventListener('p31:safe-mode', (e) => {
  if (e.detail.active) {
    cancelAnimationFrame(animationId);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    if (scene) scene.clear();
    if (controls) controls.dispose();
  } else {
    location.reload(); // Simplest recovery
  }
});

/* Step 4: Include the safe mode button in nav */
/* <button class="btn-safe safe-toggle"
          aria-pressed="false"
          aria-label="Toggle safe mode">Safe Mode</button> */`,
    },
  ],
  documents: [
    {
      id: "md-report",
      name: "Markdown Report",
      desc: "P31-styled research report / brief / analysis",
      code: `# [TITLE]

**Document ID:** \`p31.[category]/1.0.0\`
**Date:** [YYYY-MM-DD]
**Author:** [AGENT ROLE] (Opus/Sonnet/Gemini)
**Status:** Draft | Review | Final
**Classification:** P0 (Core) | P1 (High) | P2 (Standard) | P3 (Reference)

---

## Executive Summary

[2-3 sentences. What this document is, what it concludes, what action it requires.]

---

## 1. Context

[Why this document exists. What problem it addresses. What prior work it builds on.]

## 2. Analysis

[The meat of the document. Use subsections as needed.]

### 2.1 [Subtopic]

[Content.]

### 2.2 [Subtopic]

[Content.]

## 3. Findings

[What the analysis revealed. Numbered findings if multiple.]

## 4. Recommendations

[What to do next. Concrete, actionable, with effort estimates.]

## 5. References

- [Source 1]
- [Source 2]

---

*Registered in p31-alignment.json as source [ID].*
*Verify: npm run verify:alignment*

💜🔺💜`,
    },
    {
      id: "docx-court",
      name: "Court Filing (.docx)",
      desc: "Georgia Superior Court formatted document",
      code: `/* ── Court Document Template ── */
/* Generate with: node scripts/gen-court-doc.mjs */

IN THE SUPERIOR COURT OF CAMDEN COUNTY
STATE OF GEORGIA
______________________________________________
                                              )
CHRISTYN JOHNSON,                             )
             Plaintiff,                       )
                                              )
           -vs-                               )  Civil Action No. 2025CV936
                                              )
WILLIAM JOHNSON,                              )
            Defendant.                        )
______________________________________________)

[DOCUMENT TITLE]

COMES NOW Defendant WILLIAM RODGER JOHNSON, pro se,
and [PURPOSE CLAUSE]. In support thereof,
Defendant presents the following [facts/arguments/responses].

I. [SECTION HEADING]

1. [Paragraph content.]

2. [Paragraph content.]

[Continue sections...]

PRAYER FOR RELIEF

WHEREFORE, Defendant respectfully requests that
this Honorable Court:

1. [Relief item 1];
2. [Relief item 2];
3. Grant such other and further relief as this
   Court deems just and proper.

Respectfully submitted,

______________________________
WILLIAM RODGER JOHNSON
Defendant, Pro Se
(912) 227-4980
willyj1587@gmail.com

CERTIFICATE OF SERVICE

I HEREBY CERTIFY that I have this ___ day of
[Month] 2026, served a copy of the foregoing upon
Plaintiff's counsel, Jennifer L. McGhan, Esq.,
via electronic mail to jenn@mcghanlaw.com and via
PeachCourt electronic filing.

______________________________
WILLIAM RODGER JOHNSON`,
    },
    {
      id: "cwp",
      name: "Work Control Document (CWP/WCD)",
      desc: "Structured task authorization with acceptance criteria",
      code: `# CWP-P31-[AREA]-[YEAR]-[MONTH]
# [SHORT DESCRIPTIVE TITLE]

**Date:** [YYYY-MM-DD]
**Issued by:** [AGENT ROLE]
**Executing agent:** [TARGET AGENT]
**Spoon estimate:** [N] 🥄

---

## Intent

[What this CWP achieves. One paragraph. Why it matters.]

## Scope

**IN SCOPE:**
- [Deliverable 1]
- [Deliverable 2]

**OUT OF SCOPE (Tag-out):**
- DO NOT [thing that's explicitly excluded]
- DO NOT [another exclusion]

## Deliverables

| File | Description |
|------|-------------|
| \`path/to/file.ext\` | [What it is] |

## Steps

1. [Step 1 — concrete action]
2. [Step 2 — concrete action]
3. [Step 3 — concrete action]

## Acceptance Criteria

- [ ] [Criterion 1 — binary pass/fail]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] \`npm run verify\` passes
- [ ] Registered in p31-alignment.json

## Dependencies

- Requires: [prerequisite CWP or condition]
- Blocks: [downstream CWP or feature]

---

*Spoons spent: [N] / [N] estimated*
*Status: ☐ Open | ☐ In Progress | ☐ Complete | ☐ Archived*`,
    },
    {
      id: "email-legal",
      name: "Legal Email Template",
      desc: "Formal correspondence to opposing counsel",
      code: `Subject: Re: [SUBJECT LINE]

[Ms./Mr.] [LAST NAME],

[Opening: factual corrections or position statement.
Keep to one paragraph. Reference the specific
correspondence being replied to.]

[Section 1 heading — if needed]

[Factual content. Cite specific dates, documents,
and order paragraphs. Reference evidence you have
("I have timestamped photographs confirming this")
but do NOT attach or describe evidence in detail.
Save specifics for court.]

[Section 2 heading — if needed]

[Additional content as needed.]

[Closing requests — numbered]

1. [Specific request 1.]
2. [Specific request 2.]
3. [Specific request 3.]

[Closing statement. Preference for cooperative
resolution. Final sentence closes the door on
further email exchange if desired.]

Respectfully,
William R. Johnson
(912) 227-4980`,
    },
  ],
  tokens: [
    {
      id: "color-ref",
      name: "Color Token Reference",
      desc: "Every color with hex, semantic meaning, WCAG ratio, and usage",
      code: `/* ── P31 SHARED SURFACE — Color Token Reference ── */
/* Source: p31-constants.json → p31-style.css → p31-shared-surface.css */
/* NEVER hardcode hex values. ALWAYS use var(--p31-*) */

/* BACKGROUNDS */
--p31-void:         #0f1115;  /* Deep canvas. THE background. NOT var(--p31-void). */
--p31-surface:      #161920;  /* Panel background */
--p31-surface2:     #1c2028;  /* Elevated card background */
--p31-glass-border: rgba(255,255,255,0.06); /* Subtle structural outline */
--p31-glass-bg:     color-mix(in srgb, var(--p31-surface2) 60%, transparent);

/* TEXT */
--p31-cloud:        #e8e6e3;  /* Primary text. 12.8:1 vs void. AAA. */
--p31-muted:        #6b7280;  /* Secondary text. 4.5:1 vs void. AA. Labels only. */

/* BRAND SEMANTIC */
--p31-teal:         #5DCAA5;  /* Trust/structure/primary. 8.2:1. AAA. */
--p31-cyan:         #4db8a8;  /* Highlight/accent. Alias target for teal in some contexts. */
--p31-coral:        #cc6247;  /* Voltage/urgency/legal/warning. 4.6:1. AA. */
--p31-amber:        #cda852;  /* Focus/biological/L.O.V.E./children. 7.1:1. AAA. */
--p31-lavender:     #8b7cc9;  /* Archive/documentation/scribe. 4.8:1. AA. */
--p31-phosphorus:   #5dca5d;  /* Success/growth/confirmation. */

/* CORRECTIONS LOG */
/* ❌ --p31-void: var(--p31-void)     → ✅ #0f1115 (Kimi used wrong value) */
/* ❌ --p31-teal: var(--p31-teal)     → ✅ #5DCAA5 (Gemini used wrong value) */
/* ❌ Border radius: 3rem/48px → ✅ 12px (Kimi too aggressive) */
/* ❌ Font: Inter only         → ✅ Inter + Atkinson Hyperlegible (a11y) */`,
    },
    {
      id: "spacing-ref",
      name: "Spacing & Layout Reference",
      desc: "Base-4 spacing scale, border radius, breakpoints",
      code: `/* ── P31 SHARED SURFACE — Spacing & Layout ── */

/* SPACING SCALE (base: 4px) */
/* 4  8  12  16  20  24  32  48  64 */
--space-1:  0.25rem;  /*  4px — tight: icon gaps */
--space-2:  0.5rem;   /*  8px — compact: button padding */
--space-3:  0.75rem;  /* 12px — standard: form padding */
--space-4:  1rem;     /* 16px — comfortable: card padding */
--space-5:  1.25rem;  /* 20px — medium */
--space-6:  1.5rem;   /* 24px — nav padding */
--space-8:  2rem;     /* 32px — section spacing */
--space-12: 3rem;     /* 48px — large breaks */
--space-16: 4rem;     /* 64px — page-level */

/* BORDER RADIUS */
--radius-sm:  4px;   /* badges, chips */
--radius-md:  8px;   /* buttons, inputs, cards */
--radius-lg:  12px;  /* panels, modals — THE canonical P31 radius */
--radius-xl:  16px;  /* overlays */
--radius-pill: 99px; /* fully rounded */

/* BREAKPOINTS */
/* mobile-first: no media query = mobile */
/* @media (min-width: 640px)  — tablet */
/* @media (min-width: 1024px) — desktop */
/* @media (min-width: 1280px) — wide */

/* TOUCH TARGETS */
/* General: min-height: 44px; min-width: 44px; */
/* Children: min-height: 60px; min-width: 60px; */
/* Crisis: full-width single tap target */

/* MAX WIDTHS */
--max-content:  1000px; /* Page content */
--max-narrow:   600px;  /* Focused tools, support page */
--max-wide:     1200px; /* Dashboard grids */`,
    },
    {
      id: "type-ref",
      name: "Typography Reference",
      desc: "Font stacks, sizes, weights, line heights",
      code: `/* ── P31 SHARED SURFACE — Typography ── */

/* FONT STACKS */
--p31-font-sans:  'Inter var', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--p31-font-mono:  'JetBrains Mono', 'Fira Code', monospace;
--p31-font-a11y:  'Atkinson Hyperlegible', sans-serif;
--p31-font-serif: 'Playfair Display', Georgia, serif; /* decorative headers ONLY */

/* TYPE SCALE */
/* h1: 2.5rem (40px) — weight 700 — tracking -0.02em */
/* h2: 1.75rem (28px) — weight 700 — tracking -0.01em */
/* h3: 1.25rem (20px) — weight 600 */
/* body: 1rem (16px) — weight 400 — line-height 1.6 */
/* small: 0.85rem (13.6px) — mono for labels */
/* tiny: 0.75rem (12px) — mono for timestamps */

/* RENDERING */
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;

/* WHEN TO USE WHICH FONT */
/* Inter var:               Everything by default */
/* Atkinson Hyperlegible:   Surfaces targeting dyslexia/low vision */
/* JetBrains Mono:          Code, data, timestamps, metrics, labels */
/* Playfair Display:        Decorative section headers ONLY, never body */

/* SELF-HOSTING (phosphorus31.org) */
/* @fontsource/inter — npm install */
/* @fontsource/jetbrains-mono — npm install */

/* CDN (p31ca.org, pending self-host) */
/* fonts.googleapis.com/css2?family=Inter:wght@400;500;700 */
/* fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700 */
/* fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400 */`,
    },
  ],
};

const ACCENT = { pages: TOKENS.teal, components: TOKENS.cyan, patterns: TOKENS.lavender, documents: TOKENS.amber, tokens: TOKENS.coral };

export default function DesignForge() {
  const [cat, setCat] = useState("pages");
  const [sel, setSel] = useState(null);
  const [copied, setCopied] = useState(false);

  const items = TEMPLATES[cat] || [];
  const selected = sel ? items.find((t) => t.id === sel) : null;

  const copyCode = useCallback(() => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [selected]);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: TOKENS.cloud, minHeight: "100vh", padding: "0" }}>
      <div style={{ borderBottom: `1px solid ${TOKENS.glassBorder}`, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <svg viewBox="0 0 100 100" width="28" height="28" fill="none">
          <path d="M50 10 L90 85 L10 85 Z" stroke={TOKENS.teal} strokeWidth="5" strokeLinejoin="round" />
          <path d="M50 10 L50 60 L90 85" stroke={TOKENS.coral} strokeWidth="5" strokeLinejoin="round" opacity="0.8" />
          <path d="M50 60 L10 85" stroke={TOKENS.amber} strokeWidth="5" strokeLinejoin="round" opacity="0.6" />
        </svg>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>P31 Design Forge</div>
          <div style={{ fontSize: "0.75rem", color: TOKENS.muted, fontFamily: "'JetBrains Mono', monospace" }}>
            template generator · p31-shared-surface v1.0.0
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", padding: "1rem 1.5rem", overflowX: "auto", borderBottom: `1px solid ${TOKENS.glassBorder}` }}>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => { setCat(c.id); setSel(null); }} style={{ padding: "0.6rem 1rem", border: cat === c.id ? `1px solid ${ACCENT[c.id]}` : `1px solid ${TOKENS.glassBorder}`, borderRadius: "8px", background: cat === c.id ? `${ACCENT[c.id]}15` : "transparent", color: cat === c.id ? ACCENT[c.id] : TOKENS.muted, cursor: "pointer", whiteSpace: "nowrap", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", minHeight: "40px" }}>
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 140px)" }}>
        <div style={{ width: "260px", borderRight: `1px solid ${TOKENS.glassBorder}`, padding: "1rem", overflowY: "auto", flexShrink: 0 }}>
          {items.map((t) => (
            <button key={t.id} onClick={() => setSel(t.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.75rem", marginBottom: "0.5rem", border: sel === t.id ? `1px solid ${ACCENT[cat]}` : `1px solid transparent`, borderRadius: "8px", background: sel === t.id ? `${ACCENT[cat]}10` : "transparent", cursor: "pointer", color: TOKENS.cloud }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{t.name}</div>
              <div style={{ fontSize: "0.75rem", color: TOKENS.muted, lineHeight: 1.4 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
          {selected ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>{selected.name}</h2>
                  <p style={{ fontSize: "0.85rem", color: TOKENS.muted }}>{selected.desc}</p>
                </div>
                <button onClick={copyCode} style={{ padding: "0.5rem 1rem", border: `1px solid ${copied ? TOKENS.phosphorus : TOKENS.glassBorder}`, borderRadius: "8px", background: copied ? `${TOKENS.phosphorus}15` : "transparent", color: copied ? TOKENS.phosphorus : TOKENS.cloud, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", minHeight: "40px" }}>
                  {copied ? "✓ Copied" : "Copy code"}
                </button>
              </div>
              <pre style={{ background: TOKENS.void, border: `1px solid ${TOKENS.glassBorder}`, borderRadius: "12px", padding: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", lineHeight: 1.6, overflowX: "auto", color: TOKENS.teal, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "70vh", overflowY: "auto" }}>
                {selected.code}
              </pre>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: TOKENS.muted, fontSize: "0.95rem" }}>
              ← Select a template to view its code
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
