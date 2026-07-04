/**
 * Technical Hub card data — merged from MVP `public/mvp-hub-legacy.html` + current deployments.
 * Cards prefer *-about.html onboarding; external URLs are Workers/Pages where noted.
 * Ecosystem ownership (nonprofit vs hub vs Workers): docs/SITE_MAP_AND_OWNERSHIP.md
 */

export interface HubProduct {
  id: string;
  title: string;
  subtitle: string;
  status: 'live' | 'dev' | 'prototype' | 'research';
  url: string;
  stack: string[];
}

/** Core live stack — about pages first */
export const liveProducts: HubProduct[] = [
  { id: 'bonding', title: 'BONDING', subtitle: 'Multiplayer chemistry game — parents play alongside kids across any distance.', status: 'live', url: '/bonding-about.html', stack: ['React 19', 'Three.js', 'Zustand v5'] },
  { id: 'spaceship-earth', title: 'Spaceship Earth', subtitle: 'Sovereign cognitive cockpit — spoon tracking, breathing pacer, sensory buffer.', status: 'live', url: '/spaceship-earth-about.html', stack: ['React 19', 'R3F', 'Polymorphic Skins'] },
  { id: 'ede', title: 'EDE', subtitle: 'Everything Development Environment — browser-native IDE with Jitterbug Compiler.', status: 'live', url: '/ede-about.html', stack: ['Babel', 'IndexedDB', 'Offline-First'] },
  { id: 'buffer', title: 'The Buffer', subtitle: 'Fawn Guard voltage processor — communication shield for high-conflict co-parenting.', status: 'live', url: '/buffer-about.html', stack: ['Voltage Scoring', 'BLUF Extraction'] },
  { id: 'larmor', title: 'Larmor', subtitle: '863 Hz somatic regulation — phosphorus-31 Larmor in Earth field (Web Audio).', status: 'live', url: '/larmor-about.html', stack: ['Web Audio', 'Binaural Beats'] },
  { id: 'mesh', title: 'P31 Mesh', subtitle: 'Serverless peer mesh on Cloudflare — K4 topology, signaling, vagal sync.', status: 'live', url: 'https://p31-mesh.pages.dev', stack: ['CF Workers', 'WebRTC'] },
  { id: 'vault', title: 'P31 Vault', subtitle: 'Ground-truth identity — keys, layers, Daubert export (local-first).', status: 'live', url: '/vault-about.html', stack: ['Web Crypto', 'IndexedDB'] },
  { id: 'genesis-gate', title: 'Genesis Gate', subtitle: 'Telemetry event bus — intercept, governance hooks, orchestrator.', status: 'live', url: '/genesis-gate-about.html', stack: ['TypeScript ESM', 'CF Workers'] },
  { id: 'kenosis', title: 'Kenosis Mesh', subtitle: '7-node SIC-POVM routing on the edge — complete K4 graph.', status: 'live', url: '/kenosis-about.html', stack: ['Durable Objects', 'K4'] },
  { id: 'fawn-guard', title: 'Fawn Guard', subtitle: 'Draft fawn-pattern analysis — hub client + Worker API.', status: 'live', url: '/fawn-guard-about.html', stack: ['CF Workers', 'Rules'] },
  { id: 'donate-api', title: 'Donate Pipeline', subtitle: 'Stripe Checkout + Ko-fi bridge — receipts, nonprofit routing.', status: 'live', url: '/donate-about.html', stack: ['Stripe', 'CF Worker'] },
  { id: 'discord-bot', title: 'p31-bot', subtitle: 'Discord community engine — slash commands, cron, telemetry relay.', status: 'live', url: '/discord-bot-about.html', stack: ['Discord.js', 'Railway'] },
  { id: 'cortex', title: 'p31-cortex', subtitle: 'AI agent orchestration — Durable Objects, D1, Discord + hub routing.', status: 'live', url: '/cortex-about.html', stack: ['Durable Objects', 'D1', 'AI'] },
  { id: 'command-center', title: 'Command Center', subtitle: 'Fleet health — status API, cron pings; powers hub fleet strip.', status: 'live', url: 'https://command-center.trimtab-signal.workers.dev', stack: ['CF Workers', 'KV', 'Cron'] },
  { id: 'quantum-family', title: 'The Quantum Family', subtitle: 'Dependent-facing welcome pack — touch UI, sound garden, grounding, tetrahedron.', status: 'live', url: '/quantum-family-about.html', stack: ['Three.js', 'Web Audio', 'PWA'] },
  { id: 'attractor', title: 'NANO-07 Attractor', subtitle: 'Kenosis mesh visualizer — socio-thermodynamic 7-node simulation.', status: 'live', url: '/attractor-about.html', stack: ['Three.js', 'SIC-POVM', 'Workers'] },
  { id: 'book', title: 'Mother Nature & Father Time', subtitle: "Children's picture book reader — touch-native, bilingual-ready.", status: 'live', url: '/book-about.html', stack: ['Vite', 'React 19', 'CF Pages'] },
];

/** Production suite v8 — edge utility Workers (MVP hub) */
export const suiteProducts: HubProduct[] = [
  { id: 'appointment-tracker', title: 'Appointment Tracker', subtitle: 'Legal & family calendar — recurring events, CSV export, local notifications.', status: 'live', url: 'https://p31-appointment-tracker.trimtab-signal.workers.dev', stack: ['LocalStorage', 'CSV'] },
  { id: 'love-ledger', title: 'Love Ledger', subtitle: 'Family LOVE tokens — leaderboard, streak, weekly chart.', status: 'live', url: 'https://p31-love-ledger.trimtab-signal.workers.dev', stack: ['Chart.js', 'KV'] },
  { id: 'medical-tracker', title: 'Medical Tracker', subtitle: 'Calcium / PTH logging, HPT-SD symptoms, 7-day chart.', status: 'live', url: 'https://p31-medical-tracker.trimtab-signal.workers.dev', stack: ['Chart.js', 'WebCrypto'] },
  { id: 'somatic-anchor', title: 'Somatic Anchor', subtitle: '4-4-6 breathing, 863 Hz, grounding, haptic pulses.', status: 'live', url: 'https://p31-somatic-anchor.trimtab-signal.workers.dev', stack: ['Web Audio', 'Vibration'] },
  { id: 'legal-evidence', title: 'Legal Evidence', subtitle: 'Court-ready exhibits — SHA-256 chain, JSON export.', status: 'live', url: 'https://p31-legal-evidence.trimtab-signal.workers.dev', stack: ['WebCrypto', 'SHA-256'] },
  { id: 'kids-growth', title: 'Kids Growth', subtitle: 'Height/weight milestones, growth charts (local-first).', status: 'live', url: 'https://p31-kids-growth.trimtab-signal.workers.dev', stack: ['Chart.js', 'LocalStorage'] },
  { id: 'contact-locker', title: 'Contact Locker', subtitle: 'AES-256 encrypted contact directory — room code unlock.', status: 'live', url: 'https://p31-contact-locker.trimtab-signal.workers.dev', stack: ['WebCrypto', 'PBKDF2'] },
  { id: 'sleep-tracker', title: 'Sleep Tracker', subtitle: 'Sleep log, quality rating, 7-day trend, goals.', status: 'live', url: 'https://p31-sleep-tracker.trimtab-signal.workers.dev', stack: ['Chart.js', 'LocalStorage'] },
  { id: 'budget-tracker', title: 'Budget Tracker', subtitle: 'Zero-based budgeting — categories, safe-to-spend.', status: 'live', url: 'https://p31-budget-tracker.trimtab-signal.workers.dev', stack: ['Chart.js', 'LocalStorage'] },
];

/** Prototypes & in-dev — about pages on p31ca */
export const devProducts: HubProduct[] = [
  { id: 'node-zero', title: 'Node Zero', subtitle: 'ESP32-S3 display device — LVGL 8.4, ESP-IDF, QSPI (roadmap).', status: 'prototype', url: '/node-zero-about.html', stack: ['ESP-IDF', 'LVGL', 'QSPI'] },
  { id: 'node-one', title: 'Node One (Totem)', subtitle: 'Handheld haptic anchor — LoRa, SE050; wellness / comms (pre-market).', status: 'dev', url: '/node-one-about.html', stack: ['ESP32-S3', 'SE050', 'SX1262'] },
  { id: 'tactile', title: 'TACTILE', subtitle: 'Keyboard builder & typing sim — layouts, switch feel, games.', status: 'dev', url: '/tactile-about.html', stack: ['Canvas', 'Web Audio'] },
  { id: 'thermodynamic', title: 'Thermodynamic Syllabus', subtitle: 'Point Peter particle sim — EDE triptych, monotropic channels.', status: 'dev', url: '/ede-about.html', stack: ['Canvas', 'React 19'] },
  { id: 'phenix-os', title: 'Phenix OS', subtitle: 'AuDHD operator console — SIC-POVM nav, Fawn shield, chaos ingest.', status: 'prototype', url: '/phenix-os-about.html', stack: ['Three.js', 'Web Audio'] },
  { id: 'simple-sovereignty', title: 'Simple Sovereignty', subtitle: 'Sovereign stack portal — terminal manifest, hub grid.', status: 'prototype', url: '/simple-sovereignty-about.html', stack: ['Portal', 'Terminal'] },
  { id: 'sovereign', title: 'SOVEREIGN', subtitle: '3D cockpit — SIC-POVM, Bloch sphere, Jitterbug transform.', status: 'prototype', url: '/sovereign-about.html', stack: ['Three.js r183', 'Bloom'] },
  { id: 'observatory', title: 'Observatory', subtitle: 'Geodesic data dome — face-per-node, bloom pipeline.', status: 'prototype', url: '/observatory-about.html', stack: ['Three.js', 'WebGL Bloom'] },
  { id: 'bridge', title: 'BRIDGE', subtitle: 'LOVE economy dashboard — gauges, vesting, ledger export.', status: 'prototype', url: '/bridge-about.html', stack: ['SVG', 'Phenix Wallet'] },
  { id: 'collider', title: 'COLLIDER', subtitle: 'Particle sandbox — valence bonds, cyclotron, molecule recipes.', status: 'prototype', url: '/collider-about.html', stack: ['Canvas 2D', 'Physics'] },
  { id: 'axiom', title: 'AXIOM', subtitle: 'Physics & chemistry lab — Posner, Larmor, spectra, K4 builder.', status: 'prototype', url: '/axiom-about.html', stack: ['Rapier.js', 'Three.js'] },
  { id: 'mission-control', title: 'Mission Control', subtitle: 'Wonky Sprout token economy — pixel RPG, missions.', status: 'prototype', url: '/mission-control-about.html', stack: ['Pixel RPG', 'Tokens'] },
  { id: 'quantum-life-os', title: 'Quantum Life OS', subtitle: 'Quantum-coherent life UI — stats, control panel, insight terminal.', status: 'prototype', url: '/quantum-life-os-about.html', stack: ['State machine', 'Dark/Light'] },
  { id: 'qg-ide', title: 'QG-IDE', subtitle: 'Quantum geodesic IDE — code, tetrahedron viz, copilot slots.', status: 'prototype', url: '/qg-ide-about.html', stack: ['Editor', 'SVG'] },
  { id: 'resonance', title: 'RESONANCE', subtitle: 'Conversation-to-music — pentatonic hash, mood, molecule SVG.', status: 'prototype', url: '/resonance-about.html', stack: ['Web Audio', 'SVG'] },
  { id: 'k4market', title: 'K4 Market', subtitle: 'Tetrahedron market tomography — OHLCV → K4, Larmor ring.', status: 'prototype', url: '/k4market-about.html', stack: ['Three.js', 'OHLCV'] },
  { id: 'geodesic', title: 'GEODESIC', subtitle: '3D structure builder — tetra/octa/icosa, rigidity scoring.', status: 'prototype', url: '/geodesic-about.html', stack: ['Three.js', 'OrbitControls'] },
  { id: 'content-forge', title: 'Content Forge', subtitle: 'Editorial suite — seed bank, checklist, local drafts.', status: 'prototype', url: '/content-forge-about.html', stack: ['Markdown', 'localStorage'] },
  { id: 'forge', title: 'FORGE', subtitle: 'Special-interest vault — SQLite WASM, local-first hyperfixation graph.', status: 'prototype', url: '/forge-about.html', stack: ['SQLite WASM', 'D3'] },
  { id: 'signal', title: 'SIGNAL', subtitle: 'Stim room & mini games — WebGL pool, sand mandala, spoon jar.', status: 'prototype', url: '/signal-about.html', stack: ['WebGL', 'Rapier'] },
  { id: 'prism', title: 'PRISM', subtitle: 'Sensory diet synthesizer — noise, binaural, color bath.', status: 'prototype', url: '/prism-about.html', stack: ['Web Audio', 'WebGL'] },
  { id: 'tether', title: 'TETHER', subtitle: 'Spatial executive function map — orbital tasks, Matter.js.', status: 'prototype', url: '/tether-about.html', stack: ['Matter.js', 'Canvas'] },
  { id: 'echo', title: 'ECHO', subtitle: 'Vocal looper & script sandbox — pitch-shift, offline.', status: 'prototype', url: '/echo-about.html', stack: ['Web Audio', 'Pitch'] },
  { id: 'liminal', title: 'LIMINAL', subtitle: 'Poetry, ephemeris, wabi-sabi canvas — breath-locked sessions.', status: 'prototype', url: '/liminal-about.html', stack: ['Canvas', 'SwissEph'] },
  { id: 'kinematics', title: 'KINEMATICS', subtitle: 'Pocket movement soundscape — accelerometer → generative audio.', status: 'prototype', url: '/kinematics-about.html', stack: ['DeviceOrientation', 'Tone.js'] },
];

/** Research-grade tooling (published frameworks) */
export const researchApps: HubProduct[] = [
  { id: 'quantum-core', title: 'Quantum Core', subtitle: 'PQC primitives & SIC-POVM swarm — IBM Quantum bridge.', status: 'research', url: '/quantum-core-about.html', stack: ['FIPS-203/204', 'IBM Q'] },
  { id: 'alchemy', title: 'Neuro-Cognition Alchemy', subtitle: 'Theoretical framework — thermodynamics, K4 graphs, periodic mapping.', status: 'research', url: '/alchemy-about.html', stack: ['Thermodynamics', 'K4'] },
];

export const liveDeploymentCount = liveProducts.length + suiteProducts.length;
