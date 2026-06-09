/** P31 app registry — single source for about pages + hub landing. */
import { appUrlForWorkerSpa } from "./worker-spa-launches.mjs";

export const registry = [
  {
    id: 'ede', title: 'EDE', tagline: 'Everything Development Environment',
    icon: '⬡', accent: '#cc6247', status: 'live', statusLabel: 'LIVE',
    appUrl: '/ops#ede',
    tech: ['Babel Standalone', 'Sandboxed iframe', "Samson's Law Linter", 'Q Distribution', 'Offline-First'],
    features: [
      'JSX transpilation with Babel — zero npm, runs entirely in the browser',
      "Samson's Law entropy linter flags cognitive overload patterns before they compound",
      'Q Distribution spoon tracking with 4-tier progressive disclosure — interface simplifies as load rises',
      'Sandboxed iframe execution with live error recovery — no crash kills your session',
      'Offline-first: works without network after first load; IndexedDB autosaves drafts'
    ],
    howTo: [
      'Open EDE — the editor loads with a starter JSX component pre-seeded',
      'Write or paste JSX — Babel transpiles on keypress, live preview updates in the sandbox pane',
      'Watch the spoon meter in the top bar — at 4 spoons the interface collapses to essentials; at 1 spoon it enters somatic breathing mode'
    ],
    techNotes: 'No build toolchain. Babel Standalone handles all JSX transpilation in a Web Worker so the main thread stays responsive. The sandboxed iframe has a null origin and postMessage bridge for output. Q Distribution is a discrete probability model over cognitive load states.',
    related: ['buffer', 'cortex', 'spaceship-earth']
  },
  {
    id: 'bonding', title: 'BONDING', tagline: 'Molecular Social Protocol',
    icon: '⚛️', accent: '#3ba372', status: 'live', statusLabel: 'LIVE',
    appUrl: 'https://bonding.p31ca.org',
    tech: ['React 19', 'Three.js r183', 'Zustand v5', 'Vitest 4', 'CF Pages'],
    features: [
      'K₄ impedance matching — every bond is a complete graph edge, not a directed arrow',
      '424 automated tests across 32 suites — production quality enforcement',
      'Multiplayer relay via Cloudflare Workers KV at 3–10s polling intervals',
      'Timestamped bond events double as court-admissible engagement evidence',
      'Offline mode with localStorage mock relay for two-tab local testing'
    ],
    howTo: [
      'Open BONDING and create a room or join with a room code',
      'Place molecular nodes representing people — drag to bond when proximity allows',
      'Each bond logs a timestamp; export the session JSON for evidence documentation'
    ],
    techNotes: 'React 19 + Three.js R3F renders the 3D molecular graph. Zustand v5 manages bond state with immer patches. The relay is Cloudflare Workers KV — no WebSocket, no Durable Objects, offline-tolerant.',
    related: ['attractor', 'collider', 'axiom'],
    certification: {
      triper: { task: true, resilience: true, interface: true, purity: true, e2e: true, regression: true, date: '2026-05-15' },
      tetra: { level: 3, sierpinski: 4, date: '2026-05-18' },
      score: 98
    }
  },
  {
    id: 'social-molecules',
    title: 'Social Molecules',
    tagline: 'C.A.R.S. — Collaborative Affective Realtime Sim',
    icon: '⚗️',
    accent: '#3ba372',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: '/connect#social',
    tech: ['SoupEngine', 'p31.carsWire/0.1.0', 'WebSocket', 'Three.js', 'Ghost molecules'],
    features: [
      'Operator shell: boot screen, load menu (live sim vs mesh assistant), and settings without leaving the page',
      'Field chat staging — glass transcript, role chips, timestamps; pairs with Mesh Start for real k4-personal /chat',
      'Load menu: same-origin Sovereign Lab (/lab) and browser slicer (/slicer); lab mirrors from bonding-soup via npm run sync:sovereign-p31ca',
      'Live edge ribbon: /p31-mesh-constants.json + probes k4-personal /api/health and same-origin hub /api/health (refresh; no secrets)',
      'Neuro-inclusive defaults: prefers-reduced-motion seeds first-visit prefs; skip link to console; Escape closes overlays; modal focus returns to opener',
      'Local prefs: reduced motion, compact transcript density, ethics strip visibility (persisted)',
      'Wire: mock WebSocket accepts labTelemetry (Sovereign Lab) into room eventLog — cars-contract/p31.carsWire.json + verify:cars-wire',
      'Deep links to the live soup vertical, BONDING (3D graph), and the canonical C.A.R.S. wire catalog'
    ],
    howTo: [
      'Dismiss the boot veil, open Load menu — choose Live C.A.R.S. sim, Mesh assistant, Sovereign Lab, browser slicer, or stay in Field chat',
      'Use Settings (gear) to tune motion and layout; prefs save to this origin only — first visit respects system reduced-motion',
      'Keyboard: Escape closes Load or Settings; skip link jumps past boot to the console',
      'When you need a private DO conversation, jump to Mesh Start from Load or Field chat footer',
      'Optional: run the home mock WebSocket and connect Sovereign Lab with ?carsWs= to stream trim coherence as labTelemetry'
    ],
    techNotes:
      'Static hub cockpit framing the home-repo C.A.R.S. stack (soup vertical on bonding Pages deploy). Message kinds for multiplayer are locked via cars-contract/p31.carsWire.json + npm run verify:cars-wire in the bonding-soup repo; labTelemetry is an extra client-to-mock type for Sovereign Lab only (not sent by soup.ts).',
    related: ['bonding', 'buffer', 'planetary-onboard']
  },
  {
    id: 'spaceship-earth', title: 'Spaceship Earth', tagline: 'Sovereign Command Center',
    icon: '🌐', accent: '#3ba372', status: 'live', statusLabel: 'LIVE',
    appUrl: '/spaceship-earth/',
    tech: ['PWA', 'PGlite (WASM PostgreSQL)', 'Three.js R3F', 'IndexedDB', 'Service Worker'],
    features: [
      'WebAssembly PostgreSQL (PGlite) persists via IndexedDB — full SQL offline',
      'Three.js R3F renders the K₄ topology in real time',
      'PWA: installable, offline-capable, no cloud dependency after first load',
      'Panels: telemetry, mesh health, spoon ledger, legal timeline, mission log',
      'Exports: session JSON, CSV for court, PDF summary'
    ],
    howTo: [
      'Install as a PWA from the browser prompt — appears on your home screen',
      'First launch pulls live telemetry from the k4-cage worker; all subsequent state is local',
      'Use the mission log panel to annotate events — each entry is SHA-256 timestamped'
    ],
    techNotes: 'PGlite runs PostgreSQL in a Web Worker via WASM. Service Worker caches the full asset bundle. The R3F tetrahedron reflects live mesh state from k4-cage via periodic fetch.',
    related: ['buffer', 'cortex', 'tether'],
    certification: {
      triper: { task: true, resilience: true, interface: true, purity: true, e2e: true, regression: true, date: '2026-05-14' },
      tetra: { level: 4, sierpinski: 4, date: '2026-05-16' },
      score: 96
    }
  },
  {
    id: 'buffer', title: 'The Buffer', tagline: 'Message Guardian & Fawn Guard',
    icon: '🛡️', accent: '#cda852', status: 'live', statusLabel: 'LIVE',
    appUrl: '/ops#buffer',
    tech: ['Voltage Scoring', 'Fawn Guard Algorithm', 'BLUF Extraction', '4-2-6 Breathwork'],
    features: [
      'Educational drafting aid only — not therapy, diagnosis, or legal advice; Fawn Guard flags language patterns from public literature, not a clinical assessment',
      'Voltage scoring: paste any message and get urgency / emotional charge / cognitive load ratings',
      'Fawn Guard: detects codependency patterns and people-pleasing signals in your drafts',
      'BLUF extraction pulls the bottom line up front and lists action items',
      '4-2-6 breathing exercise activates when voltage exceeds threshold',
      'Draft mode: write a reply, run Fawn Guard before sending'
    ],
    howTo: [
      'Paste an incoming message into the left pane — voltage scores appear immediately',
      'Switch to Draft mode, write your response, and run Fawn Guard before sending',
      'If voltage is high, click the breathing button — 4-2-6 cycle runs before you reply'
    ],
    techNotes: 'Pure vanilla JS, zero dependencies. Voltage scoring is a weighted keyword + syntax model. Fawn Guard uses pattern matching against a curated set of codependency markers from clinical literature.',
    related: ['ede', 'spaceship-earth', 'somatic-anchor']
  },
  {
    id: 'quantum-family', title: 'THE QUANTUM FAMILY', tagline: 'Sovereign Welcome Pack',
    icon: '🔺', accent: '#8b7cc9', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'quantum-family.html',
    tech: ['Three.js', 'Web Audio API', 'PWA', 'IndexedDB', 'Vibration API'],
    features: [
      'Parenting / wellness companion only — not medical diagnosis, therapy, or crisis care; use licensed professionals for health emergencies',
      'Calm Engine: lightweight prompts when the UI senses high-motion patterns (heuristic, not clinical)',
      'Grounding Games: 5-4-3-2-1 sensory game, bubble breathing, weighted blanket sim',
      'Sound Garden: generative ambient audio tuned to 863 Hz Larmor + 432 Hz base',
      'Family Tetrahedron: live K₄ mesh showing connection status across all 4 nodes',
      'Touch-native tablet OS — designed for a child\'s hands and attention span'
    ],
    howTo: [
      'Hand the tablet to S.J. or W.J. — the Calm Engine takes over if dysregulation signals appear',
      'The Sound Garden opens automatically at bedtime (configurable)',
      'Watch the Family Tetrahedron — a lit edge means that node is active right now'
    ],
    techNotes: 'Entirely offline after first cache. Three.js renders the tetrahedron. Web Audio API synthesizes the sound garden without streaming. Vibration API drives haptic grounding pulses on supported devices.',
    related: ['mission-control', 'signal', 'prism']
  },
  {
    id: 'kenosis', title: 'Project Kenosis', tagline: 'Autopoietic Edge Network',
    icon: '🕸️', accent: '#3ba372', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'kenosis.html',
    tech: ['Cloudflare Workers', 'SIC-POVM', '7-Node Mesh', 'Byzantine Fault Tolerance'],
    features: [
      '7-node self-braced Delta mesh across Cloudflare\'s global edge — no single point of failure',
      'SIC-POVM symmetric informationally complete measurements for node state assessment',
      'Automatic failover: any 3 nodes can sustain full mesh operation',
      'Cosmic Snapshot recalibration when Byzantine fault threshold is crossed',
      'Socio-thermodynamic simulation with 1500 VFD human agents'
    ],
    howTo: [
      'Open the Kenosis visualizer — nodes appear as vertices of the Delta mesh',
      'Click a node to inspect its SIC-POVM state vector and connectivity',
      'Use the chaos injector to kill nodes and watch Byzantine fault recovery in real time'
    ],
    techNotes: 'Each Cloudflare Worker is a mesh node. Workers communicate via Service Bindings + KV. SIC-POVM gives a provably optimal informationally complete measurement basis for the 7-node system.',
    related: ['attractor', 'genesis-gate', 'cortex']
  },
  {
    id: 'genesis-gate', title: 'Genesis Gate', tagline: 'Governance Control Plane',
    icon: '🔬', accent: '#3ba372', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: appUrlForWorkerSpa('genesis-gate'),
    tech: ['TypeScript ESM', 'Cloudflare Workers', 'TelemetryModule', 'GovernanceHook'],
    features: [
      'TelemetryModule: real-time event stream from all P31 infrastructure endpoints',
      'InterceptModule: gate-checks all outbound API calls against governance rules',
      'GovernanceHook: enforces CWP authorization before state changes commit',
      'GenesisOrchestrator: coordinates multi-worker deployments in dependency order',
      'v4.1.0 with full audit trail — every governance decision is logged and signed'
    ],
    howTo: [
      'POST to /api/telemetry to push an event into the stream',
      'GET /api/health returns the full governance state vector',
      'POST to /api/govern with a CWP ID to trigger a guarded state transition'
    ],
    techNotes:
      'Pure TypeScript ESM Cloudflare Worker. GovernanceHook uses a merkle-linked audit chain so every state transition is verifiable offline. No external dependencies. Hub launch uses a short p31ca.org path (302 → workers.dev bundle); PRS lists this card as concept-tier — treat as experimental.',
    related: ['cortex', 'kenosis', 'spaceship-earth']
  },
  {
    id: 'cortex', title: 'p31-cortex', tagline: 'AI Agent Orchestration',
    icon: '🧠', accent: '#3ba372', status: 'live', statusLabel: 'LIVE',
    appUrl: '/ops#cortex',
    tech: ['Cloudflare Durable Objects', 'D1 Database', 'CF AI Bindings', 'Workers Analytics'],
    features: [
      'Six autonomous agents: benefits, finance, grant, legal, content, ko-fi',
      'Durable Objects provide persistent agent state across cold starts',
      'D1 database stores agent memory and decision history',
      'CF AI Bindings run inference at the edge — no external LLM API calls',
      'Agent-to-agent messaging via Service Bindings for coordinated responses'
    ],
    howTo: [
      'Navigate to the cortex dashboard — each agent appears as a card with status',
      'Click an agent to open its task queue and recent decisions',
      'POST to /api/agent/{name}/task to queue a new task programmatically'
    ],
    techNotes: 'Each agent is a separate Durable Object class with its own hibernation schedule. D1 provides the shared memory substrate. CF Workers Analytics tracks agent performance per invocation.',
    related: ['genesis-gate', 'kenosis', 'spaceship-earth']
  },
  {
    id: 'attractor', title: 'NANO-07 Attractor', tagline: 'Kenosis Mesh Visualizer',
    icon: '🌀', accent: '#00ffff', status: 'live', statusLabel: 'LIVE',
    appUrl: '/ops#attractor',
    tech: ['Three.js', 'SIC-POVM', 'Byzantine Fault Sim', 'Chaos Injector'],
    features: [
      '1500 human VFD agents tether to nearest online Cloudflare Worker node in real time',
      'Kill any node and watch Byzantine fault recovery — mesh self-heals within 3 hops',
      'Chaos injector lets you simulate network partitions and latency spikes',
      'Cosmic Snapshot recalibration animates when fault threshold is crossed',
      'SIC-POVM state vectors render as color gradients on each agent particle'
    ],
    howTo: [
      'Open the visualizer — 1500 agent particles appear orbiting the 7-node mesh',
      'Click any node to kill it — agents immediately reroute to adjacent nodes',
      'Use the chaos panel to inject sustained faults and observe equilibrium restoration'
    ],
    techNotes: 'Pure Three.js — no React wrapper. The simulation runs in a requestAnimationFrame loop with a shared Float32Array for agent positions to minimize GC pressure.',
    related: ['kenosis']
  },
  {
    id: 'discord-bot', title: 'p31-bot', tagline: 'Community Command Plane',
    icon: '🤖', accent: '#3ba372', status: 'live', statusLabel: 'LIVE',
    appUrl: '/ops#discord',
    tech: ['Discord.js v14', 'TypeScript', 'Railway Deploy', 'CF Workers KV'],
    features: [
      '20+ slash commands covering the full P31 ecosystem',
      '/spoon — log and query the Q Distribution spoon ledger',
      '/egg — track and award egg tokens in the P31 economy',
      '/quantum-egg-hunt — seasonal hunt with clues and rewards',
      '/telemetry — relay live infrastructure status directly into Discord'
    ],
    howTo: [
      'The bot is live in the P31 Discord server — use /help to see all commands',
      'Use /spoon log [count] to record a spoon expenditure for the day',
      'Use /egg award @user [reason] to recognize a contribution'
    ],
    techNotes: 'Discord.js v14 slash commands deployed on Railway. Bot state persists to Cloudflare Workers KV so it survives Railway restarts without data loss.',
    related: ['cortex', 'genesis-gate', 'bridge']
  },
  {
    id: 'donate', title: 'Donate Pipeline', tagline: 'MAP — Stripe Payment Link + Sponsors',
    icon: '💚', accent: '#3ba372', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'donate.html',
    tech: [
      'Stripe Payment Link (MAP)',
      'Optional client_reference_id binding',
      'GitHub Sponsors',
      'donate-api Worker (optional programmatic Checkout)',
      'Ko-fi → Discord bot'
    ],
    features: [
      'Hub (/donate): canonical Stripe Payment Link; MAP attaches ?client_reference_id when localStorage p31_subject_id matches derivation — no PAN on p31ca origin',
      'GitHub Sponsors (developer-centric path); donate-api retains POST /create-checkout + signed webhooks when programmatic Checkout is needed',
      'Ko-fi: verified POST to Discord p31-bot (spoon ledger + telemetry) — not the donate-api Worker',
      'MAP automation: verify-monetary-surface, donate-api Vitest, CI in Andromeda',
      'EIN 42-1888158 on public donate copy; 501(c)(3) status per operator-approved language'
    ],
    howTo: [
      'Open hub /donate — Stripe MAP Payment Link + GitHub Sponsors',
      'Ko-fi: configure dashboard to hit the org Discord ingress (see p31-bot webhook docs)',
      'Launch ops checklist: docs/ENTERPRISE-LAUNCH-PREP.md (P31 home) · MAP CWP: 04_SOFTWARE/docs/CONTROLLED-WORK-PACKAGE-MONETARY-PIPELINE.md'
    ],
    techNotes:
      'Primary MAP on hub = static Payment Link (no Stripe.js). donate-api Worker = optional programmatic Checkout + webhooks; Ko-fi = Discord-only path. Run `npm run verify` in donate-api and root `verify:monetary` after monetary edits.',
    related: ['spaceship-earth', 'genesis-gate', 'cortex']
  },
  {
    id: 'book', title: 'Mother Nature & Father Time', tagline: "Children's Picture Book",
    icon: '📖', accent: '#3ba372', status: 'live', statusLabel: 'LIVE',
    appUrl: '/research#book',
    tech: ['Vite 8', 'React 19', 'CF Pages', 'Touch Navigation'],
    features: [
      '14-page illustrated digital reader dedicated to S.J. and W.J.',
      'Touch-native navigation: swipe or tap to turn pages, pinch to zoom',
      'Dark-mode native — comfortable for bedtime reading without blue light',
      'Bilingual-ready architecture: page strings externalized for translation',
      'Offline-capable via Service Worker — works on the plane'
    ],
    howTo: [
      'Open the book and tap the cover to start',
      'Swipe left/right to turn pages — or use the arrow buttons',
      'Long-press any illustration to expand it fullscreen'
    ],
    techNotes: 'Vite 8 + React 19 compiled to a CF Pages bundle. Page strings live in a JSON manifest so new translations only require a JSON update, no code change.',
    related: ['mission-control', 'quantum-family', 'signal']
  },
  // ── Production Suite v8.0 ────────────────────────────────────────────────
  {
    id: 'appointment-tracker', title: 'Appointment Tracker', tagline: 'Legal & Family Calendar',
    icon: '📅', accent: '#8b5cf6', status: 'live', statusLabel: 'LIVE',
    appUrl: appUrlForWorkerSpa('appointment-tracker'),
    tech: ['Cloudflare Worker', 'LocalStorage', 'CSV Export', 'Recurring Events'],
    features: [
      'Color-coded categories: legal (red), kids (blue), medical (purple), personal (green)',
      'Recurring events with RRULE-style repetition — never miss a court date',
      'CSV export for your own scheduling / filing workflows — not a legal service',
      'Local notifications 24h and 1h before any legal appointment',
      'Zero cloud — all data lives in localStorage, nothing leaves the device'
    ],
    howTo: [
      'Add an event: click a date, choose category, set recurrence if needed',
      'Legal events auto-tag with case number field for court documentation',
      'Export to CSV: click the export button — opens as a spreadsheet in any app'
    ],
    techNotes:
      'Cloudflare Worker serves the SPA. All calendar state is localStorage — the Worker only delivers the HTML/CSS/JS bundle. No backend, no data collection. Short p31ca.org URL is a convenience 302 to the Worker bundle (ecosystem:glass probe: worker-spa-appointment-tracker).',
    related: ['legal-evidence', 'spaceship-earth', 'contact-locker']
  },
  {
    id: 'love-ledger', title: 'Love Ledger', tagline: 'Family LOVE Token Economy',
    icon: '💜', accent: '#ec4899', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: appUrlForWorkerSpa('love-ledger'),
    tech: ['Cloudflare Worker', 'Chart.js', 'Leaderboard', 'Streak Counter'],
    features: [
      'Track LOVE tokens earned through care, creation, and consistency',
      'Family leaderboard with animated rankings — non-competitive, celebratory framing',
      'Weekly Chart.js graph shows giving patterns over time',
      'Streak counter rewards sustained consistency — no punishment for missing days',
      'LOVE token categories: physical care, emotional presence, creative collaboration'
    ],
    howTo: [
      'Log a LOVE token: select who gave it, who received it, and the category',
      'View the leaderboard — sorted by total tokens this week',
      'Check the streak panel to see your longest care streak'
    ],
    techNotes:
      'Chart.js renders weekly trends. All token data in localStorage. The ledger format mirrors the Phenix LOVE Protocol from Paper I (DOI on file at Zenodo). Short p31ca.org URL 302 → workers.dev bundle (probe: worker-spa-love-ledger).',
    related: ['bridge', 'mission-control', 'quantum-family']
  },
  {
    id: 'medical-tracker', title: 'Medical Tracker', tagline: 'Hypoparathyroidism HPT-SD Monitor',
    icon: '🩺', accent: '#3b82f6', status: 'live', statusLabel: 'LIVE',
    appUrl: appUrlForWorkerSpa('medical-tracker'),
    tech: ['Cloudflare Worker', 'Chart.js', 'WebCrypto', '0-4 Symptom Scaling'],
    features: [
      'Personal calcium / PTH log with timestamps — educational self-tracking only; not a certified EHR, not medical advice — confirm all care decisions with your clinician',
      'HPT-SD symptom tracking on a 0–4 severity scale (Chvostek, Trousseau, tetany)',
      '7-day Chart.js trend graph for pattern identification',
      'WebCrypto encrypted export — share with a physician without cloud exposure',
      'Medication adherence log with dose and time fields'
    ],
    howTo: [
      'Log daily: calcium level, PTH result, symptom scores (0–4 each)',
      'View the 7-day chart — identify correlations between calcium dips and symptom spikes',
      'Export encrypted: enter a passphrase, download the encrypted JSON for physician sharing'
    ],
    techNotes:
      'The 0–4 scale references common hypoparathyroidism symptom descriptions in the literature; it does not replace labs or clinician judgment. WebCrypto AES-GCM with PBKDF2 key derivation for export encryption. Short p31ca.org URL 302 → workers.dev (probe: worker-spa-medical-tracker).',
    related: ['sleep-tracker', 'somatic-anchor', 'legal-evidence']
  },
  {
    id: 'somatic-anchor', title: 'Somatic Anchor', tagline: '863 Hz Larmor Grounding Tool',
    icon: '🕸️', accent: '#10b981', status: 'live', statusLabel: 'LIVE',
    appUrl: appUrlForWorkerSpa('somatic-anchor'),
    tech: ['Cloudflare Worker', 'Web Audio API', 'Vibration API', '4-4-6 Breathwork'],
    features: [
      'Wellness / grounding aid only — not medical treatment; stop if you feel worse and seek appropriate care',
      '4-4-6 box breathing with visual cue — inhale 4, hold 4, exhale 6',
      '863 Hz Larmor frequency tone (³¹P in Earth\'s field) as a somatic anchor point',
      '5-4-3-2-1 grounding exercise with visual and haptic prompts',
      'Haptic pulse patterns via Vibration API — works on Android without earbuds',
      'No timer pressure — you set the pace; the app follows'
    ],
    howTo: [
      'Open when dysregulated — the breathing guide starts automatically',
      'Plug in earbuds and enable the 863 Hz tone for the full somatic effect',
      'Complete the 5-4-3-2-1 exercise at the end — takes about 3 minutes total'
    ],
    techNotes:
      'Web Audio API generates the 863 Hz tone via an OscillatorNode — no audio file to download. Vibration API drives the haptic guide. All state resets on close — no data stored. Short p31ca.org URL 302 → workers.dev (probe: worker-spa-somatic-anchor).',
    related: ['prism', 'signal', 'echo']
  },
  {
    id: 'larmor', title: 'LARMOR', tagline: '863 Hz Somatic Regulation',
    icon: '╯', accent: '#cda852', status: 'live', statusLabel: 'DEPLOYED',
    appUrl: 'larmor.html',
    tech: ['Web Audio API', '863 Hz Oscillator', 'Vibration API', '4-4-6 Breathwork'],
    features: [
      '863 Hz pure tone via Web Audio API OscillatorNode — no audio file to download',
      '463 Hz A/B pair creates 863 Hz binaural beat; plug in earbuds for the full somatic effect',
      'Haptic pulse patterns via Vibration API — works on Android without earbuds',
      '4-4-6 box breathing with visual cue — inhale 4, hold 4, exhale 6',
      'Calcium equivalence framing: 863 Hz is the Larmor frequency of ³¹P in Earth\'s magnetic field',
      'Zero timer pressure — the rhythmic beat keeps you oriented without a deadline'
    ],
    howTo: [
      'Open when dysregulated or before a high-stakes interaction',
      'Plug in earbuds and enable the binaural beat for the full 863 Hz somatic effect',
      'Tap the tone wave to start; tap again to pause',
      'Follow the 4-4-6 breathing guide — the visual expands on inhale, holds, contracts on exhale'
    ],
    techNotes: 'No audio file: the 863 Hz tone is synthesized in real time via OscillatorNode. The A/B pair creates the beat frequency (463 Hz left ear, 863 Hz right ear → 400 Hz binaural difference; adjust to 46/863 → 863 Hz difference for pure Larmor). All state resets on close — no data stored in localStorage or IndexedDB. Practitioners are referred to licensed medical professionals; this is a grounding aid, not a treatment.',
    related: ['somatic-anchor', 'buffer', 'medical-tracker']
  },
  {
    id: 'legal-evidence', title: 'Legal Evidence', tagline: 'SHA-256 Tamper-Evident Chain',
    icon: '🛣', accent: '#f59e0b', status: 'live', statusLabel: 'LIVE',
    appUrl: appUrlForWorkerSpa('legal-evidence'),
    tech: ['Cloudflare Worker', 'WebCrypto SHA-256', 'Hash Chain', 'JSON chain export'],
    features: [
      'SHA-256 hash chain: each exhibit links to the hash of the previous one — tamper-evident',
      'Exhibit fields: date, description, file reference, category (legal/medical/financial)',
      'Structured JSON export with hash-chain verification helpers — admissibility depends on jurisdiction and counsel; not a guarantee',
      'QR code generation for each exhibit — print and attach to physical filing',
      'Batch import from CSV for bulk evidence ingestion'
    ],
    howTo: [
      'Add an exhibit: fill in date, description, and category — SHA-256 is computed automatically',
      'The chain viewer shows every exhibit linked to the one before it',
      'Export the full chain as JSON — the verification proof can be independently confirmed'
    ],
    techNotes:
      'WebCrypto SubtleCrypto.digest() computes SHA-256 in-browser. The chain is a linked list of {hash, prevHash, data} objects stored in localStorage and exported as a signed JSON bundle. This tool documents your own exhibits — not legal advice. Short p31ca.org URL 302 → workers.dev (probe: worker-spa-legal-evidence).',
    related: ['appointment-tracker', 'contact-locker', 'vault']
  },
  {
    id: 'kids-growth', title: 'Kids Growth', tagline: 'S.J. & W.J. Milestone Tracker',
    icon: '👶', accent: '#f472b6', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'kids-growth.html',
    tech: ['Static (p31ca.org)', 'Chart.js 4', 'LocalStorage', 'Print & JSON export'],
    features: [
      'Height and weight tracking with Chart.js growth curves',
      'CDC percentile bands overlaid on charts for developmental context',
      'Milestone checklists: motor, language, social, cognitive — by age range',
      'Photo journal with date stamps — stored locally, never uploaded',
      'Export: PDF-ready growth summary for pediatric appointments'
    ],
    howTo: [
      'Add a measurement: select the child (S.J. / W.J.), enter height and weight',
      'Charts update immediately with the new data point plotted against CDC bands',
      'Check milestone lists for the current age — check off achievements as they occur'
    ],
    techNotes: 'Height and weight time series in Chart.js; milestone lists are general parenting prompts only—not a screening tool. All data is localStorage on-device; use JSON export before switching browsers.',
    related: ['medical-tracker', 'appointment-tracker', 'mission-control']
  },
  {
    id: 'contact-locker', title: 'Contact Locker', tagline: 'AES-256-GCM Encrypted Directory',
    icon: '🔐', accent: '#06b6d4', status: 'live', statusLabel: 'LIVE',
    appUrl: appUrlForWorkerSpa('contact-locker'),
    tech: ['Cloudflare Worker', 'WebCrypto AES-256-GCM', 'PBKDF2', 'Room Code Auth'],
    features: [
      'AES-256-GCM encryption with PBKDF2 key derivation from a Room Code passphrase',
      'Quick dial panel: one-tap call for emergency contacts without unlocking the full vault',
      'Contact categories: legal, medical, family, support network',
      'Export encrypted bundle — safe to back up to iCloud or Google Drive',
      'No cloud sync, no account — Room Code is the only credential'
    ],
    howTo: [
      'Set a Room Code on first open — this derives your AES-256-GCM key',
      'Add contacts: name, phone, category, notes — all encrypted immediately',
      'Emergency panel: tap ☎ to quick-dial without full decrypt'
    ],
    techNotes:
      'PBKDF2 with 200,000 iterations and a random 16-byte salt derives the AES-256-GCM key. All crypto operations via WebCrypto SubtleCrypto — no third-party crypto library. Short p31ca.org URL 302 → workers.dev (probe: worker-spa-contact-locker).',
    related: ['legal-evidence', 'vault', 'appointment-tracker']
  },
  {
    id: 'sleep-tracker', title: 'Sleep Tracker', tagline: 'Sleep log (HPT-aware notes, not a medical device)',
    icon: '😴', accent: '#6366f1', status: 'live', statusLabel: 'LIVE',
    appUrl: appUrlForWorkerSpa('sleep-tracker'),
    tech: ['Cloudflare Worker', 'Chart.js', 'LocalStorage', '7-Day Trend Analysis'],
    features: [
      'Log bedtime and wake time — duration computed automatically',
      'Quality rating 1–5 with optional notes for symptom correlation',
      '7-day Chart.js trend with sleep goal band highlighted',
      'Streak counter: consecutive nights meeting sleep goal — no punishment for missing',
      'HPT-SD correlation: cross-reference sleep quality with calcium log dates'
    ],
    howTo: [
      'Log before bed: enter planned bedtime and quality from last night',
      'Log on wake: confirm actual wake time — duration and efficiency compute automatically',
      'View the 7-day chart — identify which nights correlate with HPT-SD symptom spikes'
    ],
    techNotes:
      'Chart.js annotated charts with a goal-band plugin. Sleep entries keyed by ISO date in localStorage. Duration and efficiency calculations done client-side. Wellness logging only — not FDA-regulated monitoring. Short p31ca.org URL 302 → workers.dev (probe: worker-spa-sleep-tracker).',
    related: ['medical-tracker', 'somatic-anchor', 'spaceship-earth']
  },
  {
    id: 'budget-tracker', title: 'Budget Tracker', tagline: 'Zero-Based Budgeting',
    icon: '💰', accent: '#22c55e', status: 'live', statusLabel: 'LIVE',
    appUrl: appUrlForWorkerSpa('budget-tracker'),
    tech: ['Cloudflare Worker', 'Chart.js', 'LocalStorage', 'SNAP-Friendly Categories'],
    features: [
      'Zero-based budgeting: every dollar assigned a job before the month starts',
      'SNAP-aware categories: food, housing, utilities, transportation, medical, legal',
      'Income vs. expense chart with Chart.js — safe-to-spend calculation updates live',
      'Safe-to-spend number prominent in the top bar — the one number to watch',
      'Export to CSV for benefits documentation or grant reporting'
    ],
    howTo: [
      'Set monthly income at the top — safe-to-spend starts at that number',
      'Add expenses by category as they occur — safe-to-spend decreases in real time',
      'Export at month end for documentation — CSV matches SNAP eligibility report format'
    ],
    techNotes:
      'All arithmetic done client-side. Chart.js pie and bar charts update on each entry. CSV export uses the RFC 4180 format compatible with Google Sheets and Excel. Short p31ca.org URL 302 → workers.dev (probe: worker-spa-budget-tracker).',
    related: ['legal-evidence', 'appointment-tracker']
  },
  // ── Apps ────────────────────────────────────────────────────────────────
  {
    id: 'phenix-os', title: 'Phenix OS', tagline: 'AuDHD Operator Command Console',
    icon: '◈', accent: '#4db8a8', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'phenix-os.html',
    tech: ['Three.js', 'SIC-POVM', 'Fawn Guard', 'Web Audio', 'IndexedDB'],
    features: [
      'SIC-POVM tetrahedron navigator — decision-making mapped to 4 cognitive axes',
      'Fawn Guard comm shield intercepts outbound messages before they go',
      'Chaos Ingestion engine: log and triage incoming demands by cognitive cost',
      'Focus Timer: non-coercive, pause-able, resets without judgment',
      'Encrypted Bottles: private messages to self with AES-256 time lock'
    ],
    howTo: [
      'Open Phenix OS — your current cognitive state appears on the tetrahedron navigator',
      'Route incoming demands through Chaos Ingestion before acting on them',
      'Use the Fawn Guard before sending any response drafted under stress'
    ],
    techNotes: 'SIC-POVM vectors map 4 cognitive dimensions onto the tetrahedral faces. Three.js renders the navigator. Fawn Guard shares the same pattern engine as The Buffer.',
    related: ['buffer', 'spaceship-earth', 'tether']
  },
  {
    id: 'simple-sovereignty', title: 'Simple Sovereignty', tagline: 'Sovereign Stack Portal',
    icon: '▲', accent: '#4db8a8', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'sovereignty.html',
    tech: ['Portal Hub', 'Live Terminal', 'Dark/Light Mode', 'Sovereignty Tracker'],
    features: [
      'Portal grid linking Phenix OS, Quantum Family, Vault, and Guardian in one view',
      'Live terminal manifest: shows all active P31 endpoints with health status',
      'Sovereignty level tracker: a numeric score across legal, financial, technical, relational axes',
      'Dark/light mode with full contrast accessibility',
      'One-click launch into any connected app without re-authentication'
    ],
    howTo: [
      'Open as your browser home page — sovereignty score and mesh status visible immediately',
      'Click any portal tile to launch that app in a new tab',
      'Check the terminal manifest to see which workers are live vs. degraded'
    ],
    techNotes: 'Sovereignty score is a weighted composite computed locally from localStorage checkpoints across the four axes. Terminal manifest polls the /health endpoints every 60s.',
    related: ['spaceship-earth', 'phenix-os', 'vault']
  },
  {
    id: 'node-one', title: 'Node One (The Totem)', tagline: 'Physical Haptic Anchor',
    icon: '📟', accent: '#cda852', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'node-one.html',
    tech: ['Waveshare ESP32-S3', 'LVGL 8.4', 'ESP-IDF 5.5.x', 'NXP SE050', 'Kailh Choc Navy'],
    features: [
      'Kailh Choc Navy tactile switches — 45 gf actuation, no silent mushy feedback',
      'NXP SE050 cryptographic secure element: hardware identity lock, keys never leave silicon',
      '863 Hz Larmor frequency haptic pulse — somatic anchor grounded in physics',
      'LVGL 8.4 touch display with ESP-IDF 5.5.x — custom UI built for one-handed use',
      'Software segregation (The Buffer middleware): firmware never touches cognitive logic'
    ],
    howTo: [
      'Node One is a hardware device — see the firmware repo for build instructions',
      'Pair with The Buffer over local BLE — Buffer handles all cognitive decision support',
      'The NXP SE050 auto-provisions identity on first power-on; no configuration required'
    ],
    techNotes: 'Firmware target: Waveshare ESP32-S3-Touch-LCD-3.5B (N16R8). Build with ESP-IDF 5.5.x. LVGL 8.4 selected over 9.x for 30% lower RAM overhead on the S3. CWP-046 firmware prompt at WCDs/CWP-046_DeepSeek_Prompt.md.',
    related: ['buffer', 'somatic-anchor', 'node-zero']
  },
  {
    id: 'node-zero', title: 'Node Zero', tagline: 'Sovereign Mesh Hardware Node',
    icon: '📡', accent: '#cda852', status: 'beta', statusLabel: 'BETA',
    appUrl: '/node-zero',
    tech: ['ESP-IDF 5.5.x', 'LVGL 8.4', 'AXS15231B QSPI', 'SX1262 LoRa 915MHz', 'Meshtastic LONG_FAST', 'Q-Factor API'],
    features: [
      'Waveshare ESP32-S3 N16R8: 16MB flash, 8MB Octal PSRAM, 480×320 QSPI touch display',
      'SX1262 LoRa 915MHz — Meshtastic LONG_FAST (SF11 BW250 CR4/5): ~5.5 km mesh range',
      'Q-Factor integration: POSTs spoon events to api.p31ca.org every 5 minutes, mirrors Q-score on display',
      'Device DID auto-generated on first boot, stored in NVS — same hex schema as browser p31-did',
      'Full-frame PSRAM double buffer: eliminates DMA underrun, smooth 60fps LVGL rendering',
      'AXP2101 PMIC + ES8311 codec on shared I2C mutex — concurrent-safe at 60Hz touch polling'
    ],
    howTo: [
      'Flash: cd 05_FIRMWARE/node-zero && ./flash.sh — nukes ghost firmware, rebuilds clean',
      'Provision WiFi: ./provision.sh --port /dev/ttyUSB0 — writes SSID/pass to NVS partition',
      'Mesh: meshtastic --configure 05_FIRMWARE/meshtastic/p31-mesh-config.yaml (after ./ignite-phase2.sh)',
      'DID appears on Node Zero display and in serial monitor after first WiFi connect'
    ],
    techNotes: 'Firmware: 05_FIRMWARE/node-zero/. Key fix: AXS15231B QSPI requires dc_gpio_num=GPIO_NUM_NC (not GPIO 0=BOOT button). Hardware MADCTL rotation causes silicon blank-screen bug at non-8-pixel boundaries — use LVGL sw_rotate=1. GPIO 26-37 reserved for Octal PSRAM. LoRa on GPIO 38-45 (repurposed camera pins).',
    related: ['vault', 'node-one', 'genesis-gate']
  },
  {
    id: 'sovereign', title: 'SOVEREIGN', tagline: 'Sovereign OS 3D Cockpit',
    icon: '🔑', accent: '#4db8a8', status: 'live', statusLabel: 'LIVE',
    appUrl: '/research#sovereign',
    tech: ['Three.js r183', 'Bloom Postprocessing', 'Jitterbug Transform', 'SIC-POVM'],
    features: [
      'Interactive 3D cockpit: Tetrix Group, SIC-POVM vectors, Bloch sphere rendered simultaneously',
      'Isotropic Vector Matrix visualization — the cuboctahedron in wireframe bloom',
      'Jitterbug transformation: animate the cuboctahedron-to-octahedron collapse in real time',
      'Bloom postprocessing with Three.js UnrealBloomPass — edge glow on active vectors',
      'Click any geometric node to inspect its SIC-POVM coordinates and orbit parameters'
    ],
    howTo: [
      'Orbit with left-click drag, zoom with scroll, pan with right-click drag',
      'Click the Jitterbug button to animate the cuboctahedron-to-octahedron transformation',
      'Click any SIC-POVM vector to freeze it and read its coordinate in the inspector panel'
    ],
    techNotes: 'Three.js r183 with UnrealBloomPass for selective glow. The Jitterbug transform is an interpolated animation across 48 frames of vertex positions derived from Fuller\'s original geometry.',
    related: ['axiom']
  },
  {
    id: 'observatory', title: 'OBSERVATORY', tagline: 'Geodesic Data Dome',
    icon: '🔺', accent: '#25897d', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'observatory.html',
    tech: ['Three.js r160', 'WebGL Bloom', 'ES Modules', 'Panel Inspector'],
    features: [
      'Full geodesic dome — each triangular panel is a live data node',
      'Click any panel to inspect its axis, state, bus type, and health metrics',
      'Search and filter panels by axis (X/Y/Z), state (active/degraded/offline), or bus',
      'Bloom pipeline: degraded nodes pulse amber, offline nodes go dark, active glow teal',
      'Dust motes and aurora band background — the dome feels inhabited, not inert'
    ],
    howTo: [
      'Orbit the dome with left-click drag — look for amber panels indicating degraded nodes',
      'Click any panel to open the inspector — shows the full node data object',
      'Use the search bar to filter: type "offline" to find all dark panels at once'
    ],
    techNotes: 'Geodesic geometry generated procedurally from a frequency-2 icosphere subdivision. Panel data is seeded from the Kenosis mesh state via a periodic fetch to the k4-cage worker.',
    related: ['sovereign', 'attractor', 'kenosis']
  },
  {
    id: 'bridge', title: 'BRIDGE', tagline: 'LOVE Economy Dashboard',
    icon: '🌐', accent: '#cda852', status: 'live', statusLabel: 'LIVE',
    appUrl: '/connect#bridge',
    tech: ['SVG Gauges', 'Phenix Wallet', 'Vesting Schedules', 'Stealth Addresses'],
    features: [
      'Circular SVG gauges for LOVE token supply, velocity, and distribution',
      'Vesting schedules for S.J. and W.J. — tokens unlock on milestone dates',
      'Stealth address generator for private LOVE transfers without ledger exposure',
      'Full transaction ledger with CSV export for grant reporting',
      'Multi-tab: Overview, Vesting, Ledger, Stealth, Export'
    ],
    howTo: [
      'Open BRIDGE — the overview gauges show current LOVE token state',
      'Switch to Vesting to see S.J. and W.J.\'s milestone schedules',
      'Use Stealth to generate a private transfer address for sensitive LOVE flows'
    ],
    techNotes: 'SVG gauges are pure SVG with CSS animations — no canvas. Stealth addresses use a simplified Diffie-Hellman scheme over secp256k1 coordinates via WebCrypto.',
    related: ['love-ledger', 'quantum-family']
  },
  {
    id: 'vault', title: 'VAULT', tagline: 'Ground Truth Identity Store',
    icon: '🔐', accent: '#8b7cc9', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'vault-room.html',
    tech: ['WebCrypto API', 'AES-256-GCM', 'Ed25519-equivalent', 'Daubert Export'],
    features: [
      'Ed25519-equivalent keypair generation in-browser — private key never touches the server',
      'Encrypted API key storage with per-key access controls and rotation reminders',
      'Vault layer management: separate compartments for legal, financial, identity, technical',
      'Daubert-standard court-ready evidence export with hash chain verification',
      'Zero cloud dependency — operates fully offline'
    ],
    howTo: [
      'Generate your vault keypair — public key is your identity anchor',
      'Add secrets to layers: paste an API key or certificate, set an expiry reminder',
      'Export a layer as a Daubert bundle: the JSON includes a SHA-256 chain proof'
    ],
    techNotes: 'Each layer is encrypted with a separate AES-256-GCM key derived from the master keypair. Daubert export attaches a W3C-verifiable credential structure for court use.',
    related: ['node-zero', 'contact-locker', 'legal-evidence']
  },
  {
    id: 'collider', title: 'COLLIDER', tagline: 'Particle Physics Sandbox',
    icon: '⚛️', accent: '#cc6247', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'collider.html',
    tech: ['Canvas 2D', 'Physics Engine', 'Valence Rules', 'Quest Chains'],
    features: [
      'Atoms drift with realistic physics and bond automatically on proximity by valence rules',
      '20+ molecule recipes: water, methane, ethanol, ATP, dopamine — discoverable by collision',
      'Cyclotron accelerator mode: inject high-energy particles and watch fusion collisions',
      '3 quest chains: Organic Chemistry, Alchemy, Stellar Nucleosynthesis',
      'No timed tests, no failure states — exploration at any pace'
    ],
    howTo: [
      'Drag atoms from the element palette onto the canvas — they immediately follow physics',
      'Bring two compatible atoms close — if valence rules allow a bond, it forms automatically',
      'Unlock the cyclotron by completing Quest 1: bond H₂O, CO₂, and CH₄'
    ],
    techNotes: 'Canvas 2D with a custom Verlet integration physics loop. Valence bond rules are a lookup table keyed by element pair. Zero external dependencies.',
    related: ['axiom', 'bonding', 'attractor']
  },
  {
    id: 'axiom', title: 'AXIOM', tagline: 'Physics & Chemistry Lab',
    icon: '⚛️', accent: '#3ba372', status: 'live', statusLabel: 'LIVE',
    appUrl: '/ops#axiom',
    tech: ['Rapier.js', 'Three.js', 'NIST ASD Data', 'Offline-First'],
    features: [
      'Posner molecule explorer: Ca₉(PO₄)₆ rendered in full 3D with bond lengths from NIST data',
      'Larmor precession visualizer: spin any nucleus in Earth\'s field, read the frequency',
      'Spectral emission sandbox: excite atoms and watch emission lines appear on the spectrum',
      'K₄ topology builder: assemble K₄ complete graphs and verify planarity',
      'AuDHD pedagogy — no timed tests, no failure states, no completion pressure'
    ],
    howTo: [
      'Pick a module from the top nav: Posner, Larmor, Spectral, or K₄ Builder',
      'In Larmor mode: select ³¹P and Earth\'s field — the 863 Hz frequency appears',
      'In Spectral mode: click an element, excite it, and see the emission spectrum vs. NIST reference'
    ],
    techNotes: 'Rapier.js handles rigid-body physics for the molecule explorer. Three.js renders all 3D scenes. NIST ASD data is bundled as a 2MB JSON lookup table — no API call required.',
    related: ['collider', 'sovereign', 'bonding']
  },
  {
    id: 'mission-control', title: 'Mission Control', tagline: 'Kids Token Economy',
    icon: '🚀', accent: '#ff00ff', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'mission-control.html',
    tech: ['Pixel RPG Engine', 'Genesis Token Economy', 'Press Start 2P Font', 'Custom Toast'],
    features: [
      'Willow (CCO) and Bash (CSO) character cards with XP bars and role badges',
      'Mission board: assign tasks with token rewards — kids check off on the tablet',
      'Genesis token economy: earned tokens unlock the secret base reward grid',
      'Animated completion sequence — no alert(), no modal — custom pixel toast',
      'Parent mode (PIN-protected) for adding missions and adjusting token values'
    ],
    howTo: [
      'Open in Parent mode: add missions with token values from the mission editor',
      'Hand the tablet to the kids — they see the mission board and check off tasks',
      'Token total updates live; when threshold is hit, the secret base reward animates'
    ],
    techNotes: 'Pixel RPG aesthetic with Press Start 2P font via Google Fonts. The token economy state is localStorage. Custom toast system replaces alert() for AuDHD-friendly feedback.',
    related: ['quantum-family', 'love-ledger', 'bridge']
  },
  {
    id: 'quantum-life-os', title: 'Quantum Life OS', tagline: 'Quantum-Coherent Life System',
    icon: '✨', accent: '#00ffff', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'quantum-os.html',
    tech: ['Quantum Stats Engine', 'Consciousness Model', 'Control Panel', 'Dark/Light Mode'],
    features: [
      'Coherence, Life Force, and Consciousness stat cards — a somatic dashboard in quantum terms',
      'Control panel: heal, meditate, emergency reset — each action has a simulated effect',
      'Quantum insight generator: produces reflection prompts from the current state vector',
      'Terminal log: every action is logged with a timestamp and quantum explanation',
      'Dark/light mode with full accessibility contrast ratios'
    ],
    howTo: [
      'Open QLOS — your three stats initialize based on time of day and a randomized seed',
      'Use the control panel to take actions: Meditate raises Coherence, Heal raises Life Force',
      'Read the quantum insight panel — the current state vector generates a personalized prompt'
    ],
    techNotes: 'The quantum framing frames the operator\'s nervous system as a physical system worth monitoring. No real quantum computation — it is metaphor-as-interface, designed to make self-regulation feel like calibration.',
    related: ['phenix-os', 'somatic-anchor', 'prism']
  },
  {
    id: 'qg-ide', title: 'QG-IDE', tagline: 'Quantum Geodesic IDE',
    icon: '💻', accent: '#4db8a8', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'qg-ide.html',
    tech: ['Code Editor', 'SVG Tetrahedron', 'Centaur AI Copilot', 'PHX Coherence', '6 Workspaces'],
    features: [
      '6-workspace IDE: Code, Tetrahedron, Terminal, Centaur Copilot, PHX Companion, File Browser',
      'SVG tetrahedron workspace: drag vertices, measure edges, export as SVG or JSON',
      'Centaur AI copilot pane: paste context and get structured responses without leaving the IDE',
      'Pre-seeded with SIC-POVM measurement code — start experimenting immediately',
      'PHX coherence companion tracks session focus and offers micro-breaks'
    ],
    howTo: [
      'Open QG-IDE — start in the Code workspace with SIC-POVM starter code loaded',
      'Switch to Tetrahedron to visualize the geometry of your current algorithm',
      'Open Centaur Copilot to get AI assistance — paste your code, get structured feedback'
    ],
    techNotes: 'Each workspace is a separate div panel with CSS grid layout. The tetrahedron SVG uses viewBox transforms for rotation. Centaur Copilot uses a configurable API endpoint — works with any OpenAI-compatible API.',
    related: ['ede', 'sovereign', 'axiom']
  },
  {
    id: 'resonance', title: 'RESONANCE', tagline: 'Conversation-to-Music Engine',
    icon: '🎵', accent: '#8b7cc9', status: 'live', statusLabel: 'LIVE',
    appUrl: '/research#resonance',
    tech: ['Web Audio API', 'Pentatonic Synthesis', '172.35 Hz P31 NMR', 'SVG Molecule'],
    features: [
      'Type any word or paste text — each word hashes to a pentatonic note at P31\'s 172.35 Hz base',
      'Mood detection shapes synthesis: anxious text triggers minor modes, calm text triggers major',
      'Sonic molecule SVG: each word becomes a node, bonds form between semantically close words',
      'Coherence tracking across 5 states: chaotic, dissonant, neutral, resonant, coherent',
      'Record mode: capture up to 60 seconds of generated music as a WAV blob'
    ],
    howTo: [
      'Type into the text area — music generates as you type',
      'Paste a full message to generate a sonic summary of the conversation',
      'Watch the SVG molecule form — semantically similar words bond first'
    ],
    techNotes: 'Web Audio API OscillatorNode + GainNode chain per word. The pentatonic mapping uses a CRC32 hash mod 5. Sentiment scoring is a word-count model against a 2000-word affect lexicon.',
    related: ['echo', 'prism', 'signal']
  },
  {
    id: 'k4market', title: 'K4 MARKET', tagline: 'Tetrahedral Price Geometry',
    icon: '📐', accent: '#3ba372', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'k4market.html',
    tech: ['Three.js r160', 'OHLCV Mapping', 'OrbitControls', 'Synthetic Live Data'],
    features: [
      'OHLCV mapped to K₄ tetrahedron: Open→V1, High→V2, Low→V3, Close→V4, Volume→edge weights',
      'Six-edge panel shows all K₄ connections and real-time weight values',
      'Live Data mode: synthetic OHLCV refreshes on interval to simulate market movement',
      'Volume Pulses: sphere scale pulses proportionally to the candle\'s volume',
      'Edge Flow: particles traverse edges at speeds mapped to edge weight'
    ],
    howTo: [
      'Click Live Data to start the synthetic feed — spheres shift as OHLCV updates',
      'Toggle Volume Pulses to see which vertex carries the most energy each candle',
      'Enable Edge Flow and rotate the tetrahedron with mouse drag to inspect connectivity'
    ],
    techNotes: 'Three.js r160 (unpkg). OHLCV → K₄ vertex mapping: Open→V1, High→V2, Low→V3, Close→V4, Volume→edge weights. For symbol search, timeframes, and Larmor ring see tomography.html.',
    related: ['tomography', 'sovereign']
  },
  {
    id: 'tomography', title: 'K4 TOMOGRAPHY', tagline: 'Symbol-Seeded Depth View',
    icon: '🔬', accent: '#4db8a8', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'tomography.html',
    tech: ['Three.js r183', 'Barycentric Mapping', 'PRNG OHLCV', 'Larmor Ring'],
    features: [
      'Symbol search — demo OHLCV series generated deterministically from ticker string hash',
      'Timeframe selector: 1H / 1D / 1W / 1M — barycentric distribution shifts at each resolution',
      'OHLCV candles placed as barycentric point clouds inside the regular tetrahedron',
      'Support/resistance coloring: green clusters near highs, red clusters near lows, volume-weighted',
      'Larmor ring torus overlay at 0.86 Hz — highlights price oscillation frequencies',
      'Wireframe toggle for topology inspection'
    ],
    howTo: [
      'Type any symbol and press Enter — a deterministic chart generates from the ticker hash',
      'Switch timeframes to see how the barycentric distribution changes across resolutions',
      'Toggle the Larmor ring to overlay the 0.86 Hz torus against support/resistance clusters'
    ],
    techNotes: 'Three.js r183 (jsdelivr). Barycentric OHLCV placement: each candle\'s (O,H,L,C) tuple maps to a point inside the tetrahedron via λ₁=O, λ₂=H, λ₃=L, λ₄=C (normalised). PRNG seeded by CRC32(symbol). Larmor ring rotation speed = LARMOR_HZ × dt.',
    related: ['sovereign']
  },
  {
    id: 'quantum-clock', title: 'QUANTUM CLOCK', tagline: 'Grandfather Rhythm · Coherence (Pedagogy)',
    icon: '◔', accent: '#8b7ec8', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'quantum-clock.html',
    tech: ['Static HTML', 'TRIM ↔ dome constants', 'Quantum clock events'],
    features: [
      'Explains Grandfather (slow TRIM→Larmor phase on --p31-grandfather-phase) vs Cuckoo (episodic chimes)',
      'Machine-linked: verify:quantum-clock ties tomography + grandfather boot to p31-dome-constants',
      'Same honesty contract as the hub trim line — not medical timing or NTP'
    ],
    howTo: [
      'Read the short page, then open Sovereign dome or tomography to feel the 0.86 Hz family',
      'Follow docs/PLAN-QUANTUM-CLOCK.md when extending Cuckoo integrations'
    ],
    techNotes: 'Tailwind CDN + p31-style. Meta p31.quantumClockPage/0.1.0. Short URL /quantum-clock in _redirects.',
    related: ['quantum-deck', 'quantum-composer', 'tomography', 'education', 'somatic-anchor']
  },
  {
    id: 'quantum-deck', title: 'QUANTUM DECK', tagline: 'Fair Shuffle · Suite Core',
    icon: '🃏', accent: '#4db8a8', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'quantum-deck.html',
    tech: ['Web Crypto', '@p31/quantum-deck', 'JSON save schema stub'],
    features: [
      '52-card engine mirrored from packages/quantum-deck on every verify:quantum-deck (p31-quantum-deck-core.mjs)',
      'Shuffle uses globalThis.crypto.getRandomValues + unbiased int — same disclosure posture as magic-crystal',
      'Save envelope p31.quantumDeckSave/0.1.0 — rules engines land in later milestones'
    ],
    howTo: [
      'Tap Shuffle to draw a fresh permutation — inspect the first row of card ids',
      'Pair with K4 Tomography + market when teaching “measurement vs hidden information” metaphor'
    ],
    techNotes: 'Static shell; core copied from packages/quantum-deck/src/deck.mjs. No wagering, no loot RNG. Short /deck in _redirects.',
    related: ['quantum-clock', 'tomography', 'signal']
  },
  {
    id: 'quantum-composer',
    title: 'Quantum composer',
    tagline: 'K₄ partials · Larmor ladder · TRIM beats',
    icon: '♪',
    accent: '#34d399',
    status: 'concept',
    statusLabel: 'CONCEPT',
    appUrl: 'quantum-composer.html',
    tech: ['Web Audio', 'LARMOR_HZ ↔ p31-constants', 'TRIM via grandfather boot'],
    features: [
      'Four voices on harmonic divisions of the operator-locked 31P Larmor line (same Hz story as the dome trim)',
      'Born-normalized vertex weights, slow interference at Grandfather TRIM rate, optional entangled detune pairs',
      'Measurement control = weighted auditory spotlight — honest play, not hardware claims'
    ],
    howTo: [
      'Press Play (browser audio unlock), set vertex weights, ride Interference and Entangle',
      'Tap Measure for a weighted collapse solo; pair with Quantum clock + Tomography for the full rhythm metaphor',
      'C.A.R.S. Soup soundtrack is a sibling engine — zones and 8-voice cap in the home repo'
    ],
    techNotes: 'Module public/lib/p31-quantum-composer.mjs; verify:quantum-clock checks LARMOR_HZ vs p31-constants.json. Short /composer.',
    related: ['quantum-clock', 'quantum-deck', 'tomography', 'social-molecules']
  },
  {
    id: 'geodesic', title: 'GEODESIC', tagline: '3D Structure Builder',
    icon: '🔷', accent: '#3ba372', status: 'live', statusLabel: 'LIVE',
    appUrl: '/dome#geodesic',
    tech: ['Three.js r183', 'OrbitControls', 'Snap Grid', 'Rigidity Scoring'],
    features: [
      'Place tetrahedra, octahedra, icosahedra, struts, and hubs in 3D snap-grid space',
      'Real-time rigidity scoring: Maxwell count (m = 3j − e − 6) updates on every placement',
      'Challenge system with tier progression: Stable → Strong → Geodesic Master',
      'Export current structure as a JSON scene file for future editing',
      'Color-coded stress map: over-constrained members in red, under-constrained in blue'
    ],
    howTo: [
      'Select a shape from the palette and click to place it on the snap grid',
      'Watch the rigidity score — add struts to increase it toward the target',
      'Complete challenges to unlock new shapes and construction tools'
    ],
    techNotes: 'Three.js r183 with OrbitControls for navigation. Snap grid uses integer multiples of 0.5 world units. Rigidity score uses Maxwell\'s rule extended for 3D: m = 3j − e − 6.',
    related: ['sovereign', 'collider', 'axiom']
  },
  {
    id: 'p31-delta-hiring',
    title: 'P31 Delta hiring',
    tagline: 'Proof-based roles · WCD work samples · portable p31.proofRecord',
    icon: 'Δ',
    accent: '#6b9e8f',
    status: 'concept',
    statusLabel: 'CONCEPT',
    appUrl: 'delta-hiring/index.html',
    tech: ['Vite 5', 'TypeScript', 'Fuse.js', 'localStorage', 'p31.proofRecord'],
    features: [
      'Role packets with rubric weights, accommodations, and linked WCD identifiers — browse and search offline-first',
      'Help center and glossary grounded in mesh vocabulary; hash routes for deep links',
      'Import and validate portable proof JSON (`p31.proofRecord`); export drafts from the browser only when you choose',
      'Same-origin deploy under p31ca.org (`/delta-hiring/`, short URL `/hiring`) after `sync:p31ca` from the source package'
    ],
    howTo: [
      'Open `/hiring` or `/delta-hiring/` — pick a role packet and read the WCD-linked expectations',
      'Use search and hash routes to jump to governance notes or a specific role',
      'When ready, export proof JSON from the app; keep drafts local until you explicitly share them'
    ],
    techNotes: 'Built in `04_SOFTWARE/p31-delta-hiring` (Vite SPA). Static assets sync to `p31ca/public/delta-hiring/`. Ground-truth key `routes.p31DeltaHiring`; mesh navigator link in `public/connect.html`.',
    related: ['geodesic', 'legal-evidence', 'content-forge']
  },
  {
    id: 'super-centaur',
    title: 'Super-Centaur pack',
    tagline: 'Data health · MAP · mesh fleet · sovereignty',
    icon: '🜊',
    accent: '#25897d',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: '/ops#centaur',
    tech: ['Static HTML', 'Machine JSON', 'CWP index', 'mesh-bridge sync'],
    features: [
      'Single operator page tying SUPER-CENTAUR, monetary pipeline (MAP), and ecosystem CWPs to live p31ca URLs',
      'Mesh fleet table and FLEET_HEALTH_PATHS kept in lockstep with CWP-30 mesh-bridge.ts via verify:super-centaur-pack',
      'Short entry /centaur and /super-centaur redirect to the starter; machine manifest at p31-super-centaur-pack.json'
    ],
    howTo: [
      'Open the starter page from the hub or /centaur — skim structural, data, and financial sections',
      'Use the JSON pack for agents and scripts; follow repoPath links into Andromeda for full CWPs',
      'After changing mesh-bridge MESH URLs or health paths, run npm run verify:super-centaur-pack in p31ca'
    ],
    techNotes: 'Verifier reads integration-handoff/CWP-30/mesh-bridge.ts and requires public/p31-super-centaur-pack.json meshFleet to match. Ring D deploy (phosphorus SUPER-CENTAUR) is out of scope for this static surface.',
    related: ['geodesic', 'spaceship-earth']
  },
  {
    id: 'canon-demo',
    title: 'Universal canon',
    tagline: 'Live tokens · hub ↔ org · Ring D hookup',
    icon: '◈',
    accent: '#4db8a8',
    status: 'concept',
    statusLabel: 'CONCEPT',
    appUrl: 'p31-canon-demo.html',
    tech: ['p31.universalCanon', 'CSS variables', 'Tailwind CDN', 'localStorage'],
    features: [
      'Interactive Hub / Org / Auto switch on <html data-p31-appearance> with persisted preference',
      'Palette, surfaces, type scale, space ladder, and motion demos driven by generated p31-style.css',
      'Short URLs /canon and /tokens; footer links to raw CSS and Super-Centaur pack'
    ],
    howTo: [
      'Open /canon — flip Org to see light-field tokens while brand accents stay aligned with the hub',
      'Copy the snippet for phosphorus31.org; full runbook in design-tokens/PHOSPHORUS31-RING.md',
      'After editing p31-universal-canon.json run npm run apply:p31-style and refresh'
    ],
    techNotes: 'Single source: andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json. BONDING is intentionally excluded from this canon.',
    related: ['super-centaur', 'tomography', 'geodesic', 'contract-builder']
  },
  {
    id: 'contract-builder',
    title: 'Contract builder',
    tagline: 'Alignment JSON · schema anchors · verify hints',
    icon: '⎘',
    accent: '#818cf8',
    status: 'concept',
    statusLabel: 'CONCEPT',
    appUrl: 'contract-builder.html',
    tech: ['p31.contractRegistry', 'p31-alignment.json', 'ephemeralization'],
    features: [
      'Filterable table of every .json source row in p31-alignment.json with extracted schema / $id anchors',
      'Verify hints from derivation rows that reference each path — run the listed npm scripts after edits',
      'Raw registry at /p31-contract-registry.json; regenerated by npm run build:contract-registry from the home repo'
    ],
    howTo: [
      'Open /contracts or this card — search by path or schema',
      'Change a contract JSON or alignment source → run npm run verify in the home tree (build:contract-registry runs early in the bar)',
      'Commit contracts/p31-contract-registry.json when alignment sources change so CI stays green'
    ],
    techNotes: 'Hub mirrors the registry into public/ only when present in the same checkout. Partial clones without andromeda still verify the home contracts/ file.',
    related: ['integrations', 'super-centaur']
  },
  {
    id: 'content-forge', title: 'CONTENT FORGE', tagline: 'Editorial Publishing Suite',
    icon: '✍️', accent: '#4db8a8', status: 'live', statusLabel: 'LIVE',
    appUrl: '/ops#content-forge',
    tech: ['Markdown Editor', 'Seed Bank', '8-Point Checklist', 'LocalStorage'],
    features: [
      'Seed bank: capture ideas and move them through Draft → Review → Publish lifecycle',
      '6 framework templates: Thread, Essay, Tutorial, Announcement, Research Brief, Story',
      '8-point publishing checklist: OQE, headline, hook, CTA, tags, image alt, links, review',
      'Live word count with estimated read time — optimized for Substack\'s sweet spot',
      'All state localStorage — no account, no cloud, no data exposure'
    ],
    howTo: [
      'Add a seed: paste a topic or first line into the seed bank',
      'Open a seed and choose a framework template — structure appears immediately',
      'Run the 8-point checklist before hitting publish — OQE gate is the last checkpoint'
    ],
    techNotes: 'Markdown editor is CodeMirror 6 with a custom P31 keymap. The OQE gate (Objective Quality Evidence) is a required field that must cite a source before the checklist clears.',
    related: ['discord-bot', 'cortex', 'forge']
  },
  {
    id: 'tactile', title: 'TACTILE', tagline: 'Mechanical Keyboard Builder & Typing Lab',
    icon: '⌨️', accent: '#cda852', status: 'live', statusLabel: 'LIVE',
    appUrl: '/connect#tactile',
    tech: ['Web Audio API', 'Haptics', 'Keyboard Layout Engine', 'Typing Games'],
    features: [
      'Per-key switch assignment: Kailh Choc Navy, Brown, Red, Blue — each with authentic audio',
      '4 keycap themes: Void (dark), Cloud (light), Butter (gold), Phosphorus (green)',
      'Educational typing tests: no timers, no failure states, no WPM pressure',
      '3 typing games: Resonance Typer, Word Garden, Character Cascade — all AuDHD-friendly',
      'Export keyboard layout as JSON — bring it to the switches.html configurator'
    ],
    howTo: [
      'Open TACTILE — a 65% layout appears with default Choc Navy switches',
      'Click any key to change its switch type — click-clack audio previews the switch',
      'Switch to Typing Lab for practice sessions — no timer, no WPM, just flow'
    ],
    techNotes: 'Web Audio API synthesizes mechanical switch sounds from recorded samples played at the switch-appropriate frequency. The layout engine represents the keyboard as a sparse grid map.',
    related: ['signal', 'echo', 'kinematics']
  },
  {
    id: 'forge', title: 'FORGE', tagline: 'Special Interest Vault',
    icon: '🗄️', accent: '#3ba372', status: 'live', statusLabel: 'LIVE',
    appUrl: '/ops#forge',
    tech: ['SQLite WASM', 'D3.js Skill Tree', 'Local-First', 'RPG Aesthetic'],
    features: [
      'SQLite WASM: local relational database for special interests — query your hyperfixations',
      'D3.js skill-tree visualization: special interests as nodes, connections as learned relationships',
      'RPG aesthetic: earn XP for cataloging entries, unlock new node types',
      'Zero social sharing — purely for the joy of archiving, no comparison, no exposure',
      'Media attachments: link images, videos, documents without uploading them'
    ],
    howTo: [
      'Create your first node: name a special interest, add a description and category',
      'Connect nodes: draw edges between related interests — the tree grows organically',
      'Import a CSV of existing notes to seed the vault without manual entry'
    ],
    techNotes: 'SQLite WASM (wa-sqlite) runs in a Worker thread. D3.js force simulation positions nodes. No IndexedDB fallback — SQLite WASM persists its file via the Origin Private File System API.',
    related: ['content-forge', 'ede', 'spaceship-earth']
  },
  {
    id: 'signal', title: 'SIGNAL', tagline: 'Stim Room & Mini Games',
    icon: '🎮', accent: '#cda852', status: 'live', statusLabel: 'LIVE',
    appUrl: '/connect#signal',
    tech: ['WebGL Shaders', 'Cellular Automaton', 'Rapier.js', '12-Spoon Budget'],
    features: [
      'WebGL fluid pool: drag to create flow currents — infinite stimming surface',
      'Cellular sand mandala: grow and erase fractal sand patterns with touch or mouse',
      'Spoon physics jar: add and remove spoon objects, watch them settle under gravity',
      '4 mini games: Kenosis Hop, Element Match, Resonance Catch, Sierpinski Builder',
      '12-spoon budget: all games designed to cost ≤2 spoons each — no marathon sessions'
    ],
    howTo: [
      'Open SIGNAL and pick a stim surface from the top bar',
      'The fluid pool is open-ended — there is no goal, no timer, no score',
      'Mini games are in the Games tab — each one ends automatically at the 2-spoon mark'
    ],
    techNotes: 'WebGL fluid is a Navier-Stokes solver in GLSL. Cellular automaton uses a 512×512 buffer with double-buffering for smooth updates. Rapier.js handles the spoon jar physics.',
    related: ['prism', 'echo']
  },
  {
    id: 'prism', title: 'PRISM', tagline: 'Sensory Diet Synthesizer',
    icon: '🌈', accent: '#4db8a8', status: 'live', statusLabel: 'LIVE',
    appUrl: '/ops#prism',
    tech: ['Web Audio API', 'WebGL', 'Binaural Beats', 'Offline PWA'],
    features: [
      'Brown noise and pink noise generation — locally synthesized, no streaming required',
      'Binaural beats: delta (2 Hz), theta (6 Hz), alpha (10 Hz), gamma (40 Hz)',
      'Slow-breathing color bath: WebGL color field that cycles at breath rate',
      'Over-stimulated vs. under-stimulated calibration: different presets for each state',
      'Offline PWA — install it and use it on the plane without Wi-Fi'
    ],
    howTo: [
      'Set your state: Over-stimulated (too much input) or Under-stimulated (flat/bored)',
      'PRISM selects the optimal noise color and binaural beat frequency automatically',
      'Adjust the color bath speed with the slider — slower for dysregulation, faster for under-stim'
    ],
    techNotes: 'Brown/pink noise generated from white noise via IIR filter in Web Audio API. Binaural beats use two OscillatorNodes with 40 Hz offset. WebGL color field is a fragment shader with simplex noise.',
    related: ['somatic-anchor', 'signal', 'echo']
  },
  {
    id: 'tether', title: 'TETHER', tagline: 'Spatial Executive Function Map',
    icon: '🪐', accent: '#cda852', status: 'live', statusLabel: 'LIVE',
    appUrl: '/connect#tether',
    tech: ['Matter.js', 'Canvas API', 'IndexedDB', 'Gravity Well Physics'],
    features: [
      'Tasks rendered as planets orbiting a sun — gravity well = cognitive energy cost',
      'Replaces linear to-do lists (PDA trigger) with physics-based spatial grouping',
      'High-energy tasks orbit far out, low-energy tasks cluster near center',
      'Tap a planet to expand its task detail — swipe to defer to a later orbit',
      'IndexedDB persistence: tasks survive browser close without a cloud sync'
    ],
    howTo: [
      'Add a task: tap the center sun and type — it launches as a planet immediately',
      'Rate the cognitive cost (1–5) — the planet\'s orbit radius sets automatically',
      'Drag a planet inward when you\'re ready to tackle it — it enters the "active" ring'
    ],
    techNotes: 'Matter.js provides the gravitational simulation. Tasks stored as IndexedDB records keyed by UUID. The canvas re-renders on every requestAnimationFrame for smooth orbital motion.',
    related: ['phenix-os', 'spaceship-earth', 'signal']
  },
  {
    id: 'echo', title: 'ECHO', tagline: 'Vocal Looper & Script Rehearsal',
    icon: '🗣️', accent: '#8b7cc9', status: 'live', statusLabel: 'LIVE',
    appUrl: '/connect#echo',
    tech: ['Web Audio API', 'MediaRecorder', 'BufferSource playbackRate', 'Offline-First'],
    features: [
      'Private loop station: mic → WebM → decoded AudioBuffers, layered up to 6 loops',
      'Pitch via playbackRate (varispeed): global semitone slider retunes loops in real time',
      'Each loop loops via buffer source with independent gain — mix layers in mono',
      'Offline-first: audio never leaves your device; no accounts, no uploads',
      'Live input meter via AnalyserNode on the microphone graph'
    ],
    howTo: [
      'Grant mic permission on first Record — waveform uses live time-domain frames',
      'Set pitch (semitones) before recording, or move the slider to retune all loops (playing loops restart)',
      'Play All stacks every loop; Stop All clears buffer sources without deleting buffers'
    ],
    techNotes: 'Recording: MediaRecorder( webm/opus ) → Blob → decodeAudioData. Playback: AudioBufferSourceNode with loop=true; pitch uses playbackRate = 2^(semitones/12) (varispeed: pitch and duration scale together — not a phase-vocoder). Graph uses AnalyserNode + GainNode only; no deprecated ScriptProcessorNode.',
    related: ['prism', 'resonance', 'signal']
  },
  {
    id: 'liminal', title: 'LIMINAL', tagline: 'Poetry · Astrology · Drawing',
    icon: '🌙', accent: '#8b7cc9', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'liminal.html',
    tech: ['Perfect Freehand', 'SwissEph-JS', 'Web Speech API', 'Wabi-Sabi Canvas'],
    features: [
      'Wabi-sabi canvas: brush strokes fade over 60 seconds — impermanence as feature, not bug',
      'Voice-to-poem: speak freely, Web Speech API transcribes, the app arranges into verse',
      'Offline ephemeris pattern finder: SwissEph-JS computes planetary positions without internet',
      'Constellation drawing: trace star patterns with Perfect Freehand brush tool',
      'Breath-locked session start: inhale to begin, exhale to release — grounding ritual'
    ],
    howTo: [
      'Take a breath and hold it — the canvas unlocks on exhale (breath-lock ritual)',
      'Draw with your finger or stylus — strokes fade after 60 seconds',
      'Switch to Voice mode and speak — your words become a poem in real time'
    ],
    techNotes: 'Perfect Freehand generates variable-width pressure-sensitive strokes from pointer events. SwissEph-JS is a WASM port of the Swiss Ephemeris — planet positions accurate to arcseconds.',
    related: ['echo', 'prism', 'resonance']
  },
  {
    id: 'kinematics', title: 'KINEMATICS', tagline: 'Proprioceptive Movement Node',
    icon: '🕺', accent: '#cc6247', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'kinematics.html',
    tech: ['DeviceOrientation API', 'Tone.js', 'Accelerometer', 'Screen-Free Mode'],
    features: [
      'Phone goes in pocket — accelerometer data drives a live generative soundscape',
      'Full-body gross motor movement encouraged away from the screen',
      'Tone.js synthesizes the soundscape: fast movement = higher pitch, slow = lower',
      'Screen-free mode: the display goes dark after 10 seconds; audio continues',
      'Movement and sensory play, not clinical assessment — no metrics, no scoring'
    ],
    howTo: [
      'Put on earbuds and open KINEMATICS',
      'Tap "Start Session" then put your phone in your pocket',
      'Walk, run, shake, dance — the soundscape responds to your movement'
    ],
    techNotes: 'DeviceOrientation and DeviceMotion APIs drive the synth parameters. Tone.js provides the synthesis engine with reverb and filter for ambient texture. Screen lock is via the Screen Wake Lock API (keeps audio running).',
    related: ['signal', 'prism', 'somatic-anchor']
  },
  {
    id: 'connect',
    title: 'THE MESH',
    tagline: 'K₄ cage + product graph',
    icon: '⬡',
    accent: '#4db8a8',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: '/connect',
    tech: ['Three.js r160', 'K₄ tetrahedron', 'Product satellites', 'Static HTML'],
    features: [
      'Family K₄ rendered as a tetrahedron with four vertices and product satellites you can open',
      'No separate build — one static `connect.html` on p31ca.org',
      'Pairs with the observatory, tomography, and k4 market surfaces in the same stack',
    ],
    howTo: [
      'Open `/connect.html` or use Launch on the hub about page',
      'Drag to rotate the cage; follow outbound links to mesh-adjacent products',
    ],
    techNotes: 'Three.js in a single file from `p31ca/public/`. See synergetic manifest for Three pin alignment.',
    related: ['planetary-onboard'],
  },
  {
    id: 'planetary-onboard',
    title: 'Planetary onboard',
    tagline: 'Threshold — four doors, no funnel',
    icon: '🜂',
    accent: '#25897d',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: '/ops#onboard',
    tech: ['Static HTML', 'Gray Rock first paint', 'No analytics', 'Door 4 invite / room gates'],
    features: [
      'Void + still K₄ + one sentence, then four doors (understand · use · build · know someone)',
      'Door 1 walks origin → products → evidence → help without accounts; numbers link to verifiable sources',
      'Door 2 self-identifies role then deep-links Passport, BONDING, doc library; `?welcome=kid` / `?a=child` opens the parent path',
      'Door 3 is the developer spine (clone, verify, AGENTS.md); Door 4 routes room codes to bonding and invite URLs to mesh-start when same-origin',
    ],
    howTo: [
      'Open `/planetary-onboard.html` or short `/onboard`; add `?fast=1` to skip the timed Gray Rock reveal',
      'Mesh passkey + pact lives on `/mesh-start.html` and `/auth` when you already have an invite — not on this threshold',
      'Wye→Delta narrative and legacy copy rhythm: `/delta.html` + `docs/PLAN-MESH-WYE-DELTA-ONBOARDING.md`',
    ],
    techNotes:
      'Replaced multi-phase Wye UI (Apr 2026) with threshold design; `p31-welcome-packages.json` still used by `mesh-start.html`. Passkey Worker unchanged. Egg-hunt archetype substrings kept as hidden anchors.',
    related: ['connect', 'buffer', 'ede'],
  },
  {
    id: 'integrations',
    title: 'Integrations bridge',
    tagline: 'OSS home, wearables, operator endpoints',
    icon: '🔗',
    accent: '#4db8a8',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: '/integrations/',
    tech: ['Astro', 'p31.integrationsBridge/1.0.0', 'apply:constants', 'p31-constants.json'],
    features: [
      'Single place for which bridges exist (e.g. Home Assistant, Nostr, calendar) and their status',
      'No secrets: endpoint slots that are empty in constants read as disabled',
      'Paired with `public/p31-integrations.json` from `apply:constants` and `/ops` glass checks',
    ],
    howTo: [
      'Open `/integrations/` from the hub or ops — review availability and follow linked docs for setup',
    ],
    techNotes:
      'Astro route at `src/pages/integrations.astro`. Ground truth: `routes.integrationsBridge` and `edgeRedirects` for `/integrations` → `/integrations/`.',
    related: ['connect', 'planetary-onboard', 'bridge'],
  },
  {
    id: 'education',
    title: 'P31 Labs Education',
    tagline: 'Progressive curriculum — mesh, integrity, labs',
    icon: '📚',
    accent: '#25897d',
    status: 'concept',
    statusLabel: 'CONCEPT',
    appUrl: '/education/',
    tech: [
      'Static HTML',
      'p31.labsEducation/0.2.0',
      'p31.labsEducationCatalog/0.2.0',
      'p31.labsEducationCurriculum/0.2.0',
    ],
    features: [
      'Discover, tracks, modules, and labs — public read on E0–E2; no accounts on this tier',
      'Machine-checked catalog + curriculum JSON; `verify:education` in p31ca prebuild',
      'Ethics + parent FAQ; E3 portal placeholder until policy + Worker scope land',
    ],
    howTo: [
      'Open `/education/` or short `/learn` — browse tracks, complete labs, filter the catalog',
    ],
    techNotes:
      'Static tree under `public/education/`. Ground truth: `routes.p31LabsEducation`; short paths in `_redirects`. Normative plan: P31 home `docs/PLAN-P31-LABS-EDUCATION-SITE.md`.',
    related: ['planetary-onboard', 'geodesic', 'connect', 'integrations', 'poets'],
  },
  {
    id: 'poets',
    title: 'Poets Room',
    tagline: 'Void, a daily line, a shelf — nothing to verify here but the door',
    icon: '🪶',
    accent: '#8a9aa8',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: '/connect#poets',
    tech: ['Static', 'No crew APIs', 'localStorage only', 'Quotes JSON'],
    features: [
      'First paint is quiet; one quote fades in by calendar day (`poets-room-quotes.json`)',
      'Scroll reveals a small shelf (K₄, Posner echo, BONDING ship day, Paper IV, 863 Hz tap, local photo drop) and a private writing space — never uploaded',
      'Hub mirrors home intent; exit link returns to C.A.R.S. soup when you need the rest of the house',
    ],
    howTo: [
      'Sit with the line; scroll only if you want the shelf or the cursor',
      'Drop a photo on the slot if you want something tactile on the mantle — it stays in this browser',
      '863 Hz plays one second on tap (respects reduced motion — silence only)',
    ],
    techNotes:
      'Home source `poets-room.html` + `poets-room-quotes.json`; hub `public/poets.html` + `public/poets-room-quotes.json`. Ground-truth `routes.poetsLobby`. No `/poets`→`poets.html` in `_redirects` (CF Pages ping-pong).',
    related: ['planetary-onboard', 'education', 'connect'],
  },
  // ── P31 Arcade — Four physics games at 10000% ──────────────────────────────
  {
    id: 'arcade-hub',
    title: 'P31 Arcade',
    tagline: 'Four physics games at 10000%',
    icon: '🎮',
    accent: '#ff6b35',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: 'https://p31-arcade-hub.pages.dev',
    tech: ['Cloudflare Pages', 'Astro', 'React', 'PGLite', 'WebGL'],
    features: [
      'Central hub for five physics-based arcade games: Smallball, Gridiron, Strategy, Cards, Liquid Sculptor',
      'K₄ mesh integration — games share unified authentication and player progression',
      'Spoon Theory UX across all games — energy-aware interfaces that adapt to player capacity',
      'Local-first architecture with PGLite WebAssembly PostgreSQL',
      'AAA graphics system with WebGL particle effects and volumetric rendering'
    ],
    howTo: [
      'Open the Arcade Hub at https://p31-arcade-hub.pages.dev',
      'Choose a game tile — each game loads with your unified player profile',
      'Use Spoon Selector to set your energy level — UI adapts accordingly'
    ],
    techNotes: 'Astro-based static site with React islands. Each game is a separate deployment with shared p31-arcade-shared package for common components. PGLite provides local PostgreSQL via WebAssembly.',
    related: ['arcade-smallball', 'arcade-gridiron', 'arcade-strategy', 'arcade-cards', 'arcade-liquid-sculptor']
  },
  {
    id: 'arcade-smallball',
    title: 'Smallball',
    tagline: '2.5D baseball with Spoon Theory UX',
    icon: '⚾',
    accent: '#3b82f6',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: 'https://p31-smallball.pages.dev',
    tech: ['React 18', 'PGLite', 'Markov Chains', 'Three.js', 'AAA Graphics'],
    features: [
      'Local-first baseball simulation with PGLite database for franchise persistence',
      'Markov chain-driven pitching AI with realistic pitch selection logic',
      'Spoon-based energy system — low spoons reduces pitch precision and batting power',
      'AAA Graphics Core: WebGL particles, volumetric lighting, post-processing effects',
      'Iron Mike training game — practice batting against legendary pitching machine'
    ],
    howTo: [
      'Select your spoon level from the selector — determines UI complexity and game pacing',
      'Create a franchise — owner pubkey secures your team data locally',
      'Play games or enter Iron Mike mode for training'
    ],
    techNotes: 'PGLite runs PostgreSQL in browser via WebAssembly. Markov chains model pitch sequences. Three.js handles 2.5D perspective. Graphics system supports 8 rendering tiers from mobile to desktop.',
    related: ['arcade-hub', 'arcade-gridiron', 'arcade-strategy']
  },
  {
    id: 'arcade-gridiron',
    title: 'Gridiron',
    tagline: 'Strategic football with energy management',
    icon: '🏈',
    accent: '#8b5cf6',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: 'https://p31-gridiron.pages.dev',
    tech: ['React 18', 'PGLite', 'Spoon Shell', 'CF Pages', 'TypeScript'],
    features: [
      'Strategic American football with spoon-based play calling system',
      'Franchise persistence via PGLite — seasons, stats, and achievements stored locally',
      'Energy-aware UI — Spoon Shell adapts interface to cognitive load',
      'Probability-driven outcomes with deterministic replay capability',
      'Tactical depth with formation selection, playbooks, and in-game adjustments'
    ],
    howTo: [
      'Set your spoon level — determines available play complexity and decision time',
      'Create your franchise and build your team roster',
      'Call plays using the spoon-adaptive interface — simpler at low energy, full depth at high energy'
    ],
    techNotes: 'Uses shared Spoon Shell component library for energy-aware UX. PGLite provides local SQL database. Deterministic RNG enables replay of any game state.',
    related: ['arcade-hub', 'arcade-smallball', 'arcade-strategy']
  },
  {
    id: 'arcade-strategy',
    title: 'Strategy Board',
    tagline: 'Turn-based tactical warfare',
    icon: '♟️',
    accent: '#10b981',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: 'https://p31-strategy.pages.dev',
    tech: ['React 18', 'Canvas API', 'Pathfinding', 'CF Pages'],
    features: [
      'Turn-based tactical strategy with unit positioning and resource management',
      'Hex-based grid system with line-of-sight and terrain modifiers',
      'AI opponents with varying difficulty using minimax + heuristics',
      'Campaign mode with persistent progress via localStorage',
      'Quick battle mode for short spoon-friendly sessions'
    ],
    howTo: [
      'Select game mode — Campaign for story progress, Quick Battle for instant action',
      'Move units on hex grid — consider terrain and line of sight',
      'Manage resources — balance offense, defense, and economy'
    ],
    techNotes: 'Canvas-based rendering for smooth animations. A* pathfinding for unit movement. AI uses minimax with alpha-beta pruning.',
    related: ['arcade-hub', 'arcade-cards', 'arcade-gridiron']
  },
  {
    id: 'arcade-cards',
    title: 'Card Table',
    tagline: 'Strategic card game collection',
    icon: '🃏',
    accent: '#f59e0b',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: 'https://p31-cards.pages.dev',
    tech: ['React 18', 'Game Theory', 'Probability Engine', 'CF Pages'],
    features: [
      'Collection of strategic card games with probability-based decision making',
      'Poker, Blackjack, and original P31 card variants',
      'Deck analysis tools showing odds and expected values',
      'Tournament mode with bracket tracking',
      'Spoon-adaptive — simpler games suggested at low energy'
    ],
    howTo: [
      'Choose a game from the card table menu',
      'Review probability hints if enabled in settings',
      'Track your win/loss record and bankroll over time'
    ],
    techNotes: 'Game theory optimal play suggestions. Monte Carlo simulation for probability estimation. Card counting tracking for skill-based games.',
    related: ['arcade-hub', 'arcade-strategy', 'arcade-smallball']
  },
  {
    id: 'arcade-liquid-sculptor',
    title: 'Liquid Sculptor',
    tagline: 'Fluid dynamics sandbox',
    icon: '💧',
    accent: '#06b6d4',
    status: 'live',
    statusLabel: 'LIVE',
    appUrl: 'https://p31-liquid-sculptor.pages.dev',
    tech: ['WebGL', 'Navier-Stokes', 'React 18', 'Three.js', 'CF Pages'],
    features: [
      'Real-time fluid dynamics simulation using Navier-Stokes equations',
      'Interactive sculpting — add forces, obstacles, and dye injectors',
      'WebGL compute shaders for GPU-accelerated particle systems',
      'Save and share fluid sculptures as JSON snapshots',
      'Zen mode — no UI, just the flowing simulation for relaxation'
    ],
    howTo: [
      'Click and drag to add forces to the fluid',
      'Add obstacles to create interesting flow patterns',
      'Inject dye to visualize the flow dynamics',
      'Export your sculpture as a shareable snapshot'
    ],
    techNotes: 'WebGL 2.0 compute shaders for fluid simulation. Double-buffered render targets for stable integration. Optimized for 60fps on mid-range GPUs.',
    related: ['arcade-hub', 'signal', 'prism']
  },
  // ── Research / quantum tooling ────────────────────────────────────────────
  {
    id: 'quantum-core', title: 'Quantum Core', tagline: 'PQC & Algorithm Primitives',
    icon: '🌀', accent: '#4db8a8', status: 'concept', statusLabel: 'CONCEPT',
    appUrl: 'quantum-core.html',
    tech: ['FIPS-203 ML-KEM-768', 'FIPS-204 ML-DSA-65', 'SIC-POVM Swarm', '@noble/post-quantum'],
    features: [
      'ML-KEM-768 (FIPS-203): real module-lattice key encapsulation — 1184-byte ek, 1088-byte ct, 32-byte ss',
      'ML-DSA-65 (FIPS-204): real lattice digital signatures — 1952-byte pk, 3309-byte sig max',
      'HybridPQCScheme: ML-DSA sign + ML-KEM encapsulate in one call; decapsulateAndVerify round-trip',
      'All three security levels: ML-KEM-512/768/1024 + ML-DSA-44/65/87',
      'SIC-POVM swarm management: d² agents per dimension, biological tomography, calcium homeostasis cost',
      'IBM Quantum bridge: execute circuits against IBM hardware via cloud API'
    ],
    howTo: [
      'Import MLKEM or MLDSA from @p31/quantum-core — keygen(), encapsulate(), sign(), verify()',
      'HybridPQCScheme: generateHybridKeyPair() → signAndEncapsulate() → decapsulateAndVerify()',
      'All operations synchronous, zero WASM, runs in Node + Cloudflare Workers + browser'
    ],
    techNotes: '@noble/post-quantum (audited, MIT, zero-dependency). 45/45 tests pass. Key sizes verified against FIPS 203 Table 3 and FIPS 204. IBM Quantum API calls proxied through a Cloudflare Worker to avoid CORS.',
    related: ['node-zero', 'genesis-gate', 'vault']
  },
  {
    id: 'alchemy', title: 'Neuro-Cognition Alchemy', tagline: 'Theoretical Research Framework',
    icon: '📐', accent: '#4db8a8', status: 'research', statusLabel: 'PUBLISHED',
    appUrl: '/research#alchemy',
    tech: ['Thermodynamics', 'Periodic Table Mapping', 'K₄ Graph Theory', 'Zenodo DOI'],
    features: [
      'Bridges the epistemic gap between neurobiological reality and sociological interaction',
      'Chemical thermodynamics as a formal framework for cognitive state transitions',
      'Tetrahedral geometry (K₄) models the 4-dimensional cognitive field',
      'Periodic table mapping: elements as cognitive archetypes in a structured ontology',
      'Published on Zenodo — DOI and full citation on the detail page'
    ],
    howTo: [
      'Read the framework overview — it maps chemical concepts to cognitive states',
      'Interactive periodic table: hover an element to see its cognitive archetype mapping',
      'Download the full paper from Zenodo via the DOI link at the bottom'
    ],
    techNotes: 'The interactive periodic table is pure SVG with CSS hover states. The framework paper (Papers I–IV) is published with DOIs at Zenodo under ORCID 0009-0002-2492-9079.',
    related: ['axiom', 'bonding', 'collider']
  },
  {
    id: 'k4-agent-hubs',
    title: 'K₄ Agent Hubs',
    tagline: 'Four hubs. One mesh.',
    icon: '⬡',
    accent: '#7c6af7',
    status: 'concept',
    statusLabel: 'CONCEPT',
    appUrl: 'agents.html',
    tech: ['Cloudflare Workers', 'Durable Objects', 'Ed25519', '@p31/k4-agent-hub-client', 'Ollama · Anthropic fallback'],
    features: [
      'Four cooperating Cloudflare Workers — Forge (make), Counsel (protect), Scholar (understand), Scribe (remember) — forming a complete K₄ graph (six edges)',
      'Every dock and every call is signed with Ed25519: the operator holds one keypair (~/.p31/agent-hub-key.json); the hub never stores a credential',
      'Dispatch chain: local Ollama fleet → simplex-v7 Anthropic fallback → structured echo — zero-downtime skill routing at any connectivity level',
      'Personal tetrahedron docks via a bipartite K₄,₄ cover (structure↔Forge, connection↔Counsel, rhythm↔Scholar, creation↔Scribe)',
      'Operator CLI: p31 agent-hub keypair / dock / call / cross / topology / federation'
    ],
    howTo: [
      'Run: p31 agent-hub keypair — generates or reads ~/.p31/agent-hub-key.json',
      'Run: p31 agent-hub topology --base <hub-url> — inspect the K₄ vertex and edge map',
      'Run: p31 agent-hub call forge ts-worker --prompt "scaffold a /healthz route" — signed dock + call in one step'
    ],
    techNotes: 'Worker package: packages/k4-agent-hub/ (schema p31.k4AgentHub/1.1.0). Operator client: packages/k4-agent-hub-client/. Simplex-v7 adapter: simplex-v7/src/skills/k4-dispatch.ts (POST /api/k4/dispatch). Canon manifest: p31-k4-agent-hub.json. Verify gate: npm run verify:k4-agent-hub.',
    related: ['node-zero', 'node-one', 'sovereign', 'quantum-family', 'mission-control']
  }
];
