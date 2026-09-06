export interface IconMetadata {
  svg: string;
  family: 'regular' | 'advanced';
  colors: string[];
  animated: boolean;
  description: string;
}

export const ICON_CATALOG: Record<string, IconMetadata> = {
  'k4-tetrahedron': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="K4 Tetrahedron animated icon">
  <title>K4 Tetrahedron</title>
  <desc>A regular tetrahedron with glowing pulsing nodes representing sovereign foundational structure.</desc>
  <style>
    .k4-edge-p { stroke: var(--p31-accent, #00F0FF); stroke-width: 2; opacity: 0.4; stroke-dasharray: 200; stroke-dashoffset: 200; animation: edgeReveal 3s ease-out forwards; }
    .k4-node-p { fill: var(--p31-accent, #00F0FF); }
    .k4-node-s { fill: var(--p31-accent-violet, #A78BFA); }
    .k4-node-n { fill: var(--p31-text, #F5F5F7); opacity: 0.9; }
    .k4-center-p { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 105px; animation: centerPulse 4s infinite ease-in-out; }
    .k4-group { transform-origin: 100px 105px; animation: slowRotate 30s infinite linear; }
    @keyframes edgeReveal { to { stroke-dashoffset: 0; opacity: 0.7; } }
    @keyframes centerPulse { 0%, 100% { transform: scale(0.9); opacity: 0.6; filter: drop-shadow(0 0 4px var(--p31-accent, #00F0FF)); } 50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 14px var(--p31-accent, #00F0FF)); } }
    @keyframes slowRotate { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .k4-edge-p { animation: none; stroke-dashoffset: 0; opacity: 0.5; } .k4-center-p, .k4-group { animation: none; } .k4-center-p { transform: scale(1); opacity: 0.8; } }
  </style>
  <g class="k4-group">
    <line x1="100" y1="35" x2="40" y2="145" class="k4-edge-p"/>
    <line x1="100" y1="35" x2="160" y2="145" class="k4-edge-p"/>
    <line x1="100" y1="35" x2="100" y2="145" class="k4-edge-p"/>
    <line x1="40" y1="145" x2="160" y2="145" class="k4-edge-p"/>
    <line x1="40" y1="145" x2="100" y2="145" class="k4-edge-p"/>
    <line x1="160" y1="145" x2="100" y2="145" class="k4-edge-p"/>
    <circle cx="100" cy="35" r="5" class="k4-node-p"/>
    <circle cx="40" cy="145" r="5" class="k4-node-s"/>
    <circle cx="160" cy="145" r="5" class="k4-node-n"/>
    <circle cx="100" cy="105" r="10" class="k4-center-p"/>
  </g>
</svg>`,
    family: 'regular',
    colors: ['--p31-accent', '--p31-accent-violet', '--p31-text'],
    animated: true,
    description: 'Foundational structure, sovereignty',
  },
  'molecule': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="Molecule animated icon">
  <title>Molecule / Atom</title>
  <desc>A central nucleus with elliptical orbits and rotating electrons representing bonding and quantum mechanics.</desc>
  <style>
    .mo-orb-s { fill: none; stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1.5; opacity: 0.35; }
    .mo-sys { transform-origin: 100px 100px; animation: moSpin 30s infinite linear; }
    .mo-core-p { fill: var(--p31-accent-green, #34D399); transform-origin: 100px 100px; animation: moPulse 2.5s infinite alternate ease-in-out; }
    .mo-elec-n { fill: var(--p31-text, #F5F5F7); opacity: 0.9; filter: drop-shadow(0 0 4px var(--p31-accent-green, #34D399)); }
    @keyframes moSpin { to { transform: rotate(360deg); } }
    @keyframes moPulse { 0% { transform: scale(0.9); filter: drop-shadow(0 0 4px var(--p31-accent-green, #34D399)); } 100% { transform: scale(1.12); filter: drop-shadow(0 0 14px var(--p31-accent-green, #34D399)); } }
    @media (prefers-reduced-motion: reduce) { .mo-sys, .mo-core-p { animation: none; } .mo-core-p { transform: scale(1); opacity: 0.8; } }
  </style>
  <g class="mo-sys">
    <ellipse cx="100" cy="100" rx="75" ry="25" class="mo-orb-s"/>
    <ellipse cx="100" cy="100" rx="75" ry="25" class="mo-orb-s" transform="rotate(60 100 100)"/>
    <ellipse cx="100" cy="100" rx="75" ry="25" class="mo-orb-s" transform="rotate(120 100 100)"/>
    <circle cx="175" cy="100" r="4.5" class="mo-elec-n"/>
    <circle cx="62" cy="35" r="4.5" class="mo-elec-n"/>
    <circle cx="62" cy="165" r="4.5" class="mo-elec-n"/>
  </g>
  <circle cx="100" cy="100" r="14" class="mo-core-p"/>
</svg>`,
    family: 'regular',
    colors: ['--p31-accent-green', '--p31-accent-violet', '--p31-text'],
    animated: true,
    description: 'Bonding, quantum mechanics, care connections',
  },
  'signal': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="Signal animated icon">
  <title>Signal</title>
  <desc>Radiating care signal with concentric elliptical waves representing coordination and communication in the P31 mesh.</desc>
  <style>
    .sg-wave { fill: none; stroke-width: 2; stroke-linecap: round; opacity: 0; }
    .sg-wave-p { stroke: var(--p31-accent, #00F0FF); }
    .sg-wave-s { stroke: var(--p31-accent-violet, #A78BFA); }
    .sg-wave-n { stroke: var(--p31-text, #F5F5F7); opacity: 0.5; }
    .sg-w1 { animation: sgRipple 4s infinite 0s; }
    .sg-w2 { animation: sgRipple 4s infinite 0.8s; }
    .sg-w3 { animation: sgRipple 4s infinite 1.6s; }
    .sg-w4 { animation: sgRipple 4s infinite 2.4s; }
    .sg-core-p { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 100px; animation: sgCore 2.5s infinite alternate ease-in-out; }
    @keyframes sgRipple { 0% { transform: scale(0.1); opacity: 0.8; } 100% { transform: scale(1.1); opacity: 0; } }
    @keyframes sgCore { 0% { transform: scale(0.85); filter: drop-shadow(0 0 2px var(--p31-accent, #00F0FF)); } 100% { transform: scale(1.15); filter: drop-shadow(0 0 16px var(--p31-accent, #00F0FF)); } }
    @media (prefers-reduced-motion: reduce) { .sg-wave, .sg-core-p { animation: none; } .sg-wave { opacity: 0.15; transform: scale(0.5); } .sg-core-p { transform: scale(1); } }
  </style>
  <ellipse cx="100" cy="100" rx="20" ry="50" class="sg-wave sg-wave-p sg-w1"/>
  <ellipse cx="100" cy="100" rx="40" ry="70" class="sg-wave sg-wave-s sg-w2"/>
  <ellipse cx="100" cy="100" rx="60" ry="90" class="sg-wave sg-wave-n sg-w3"/>
  <ellipse cx="100" cy="100" rx="80" ry="110" class="sg-wave sg-wave-s sg-w4"/>
  <circle cx="100" cy="100" r="10" class="sg-core-p"/>
</svg>`,
    family: 'regular',
    colors: ['--p31-accent', '--p31-accent-violet', '--p31-text'],
    animated: true,
    description: 'Coordination, communication, mesh signalling',
  },
  'mesh-node': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="Mesh Node animated icon">
  <title>Mesh Node</title>
  <desc>Interconnected nodes with streaming connections representing the distributed sovereign mesh infrastructure.</desc>
  <style>
    .ms-line-s { stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1.5; opacity: 0.4; stroke-dasharray: 8 6; animation: msStream 15s infinite linear; }
    .ms-line-d { stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1; opacity: 0.15; }
    .ms-node-n { fill: var(--p31-text, #F5F5F7); animation: msBlink 4s infinite alternate ease-in-out; }
    .ms-center-p { fill: var(--p31-accent-red, #FB7185); transform-origin: 100px 100px; animation: msAura 2s infinite alternate ease-in-out; }
    .nd-1 { animation-delay: 0s; }
    .nd-2 { animation-delay: 0.5s; }
    .nd-3 { animation-delay: 1s; }
    .nd-4 { animation-delay: 1.5s; }
    .nd-5 { animation-delay: 2s; }
    @keyframes msStream { to { stroke-dashoffset: 200; } }
    @keyframes msBlink { 0% { r: 3; opacity: 0.4; } 100% { r: 5; opacity: 1; filter: drop-shadow(0 0 5px var(--p31-text, #F5F5F7)); } }
    @keyframes msAura { 0% { r: 9; filter: drop-shadow(0 0 4px var(--p31-accent-red, #FB7185)); } 100% { r: 12; filter: drop-shadow(0 0 20px var(--p31-accent-red, #FB7185)); } }
    @media (prefers-reduced-motion: reduce) { .ms-line-s, .ms-node-n, .ms-center-p { animation: none; } .ms-center-p { r: 10; opacity: 0.8; } .ms-node-n { r: 4; opacity: 0.7; } }
  </style>
  <line x1="100" y1="100" x2="30" y2="50" class="ms-line-s"/>
  <line x1="100" y1="100" x2="160" y2="40" class="ms-line-s"/>
  <line x1="100" y1="100" x2="170" y2="150" class="ms-line-s"/>
  <line x1="100" y1="100" x2="50" y2="160" class="ms-line-s"/>
  <line x1="100" y1="100" x2="100" y2="20" class="ms-line-s"/>
  <line x1="30" y1="50" x2="100" y2="20" class="ms-line-d"/>
  <line x1="160" y1="40" x2="100" y2="20" class="ms-line-d"/>
  <line x1="50" y1="160" x2="170" y2="150" class="ms-line-d"/>
  <circle cx="30" cy="50" class="ms-node-n nd-1"/>
  <circle cx="160" cy="40" class="ms-node-n nd-2"/>
  <circle cx="170" cy="150" class="ms-node-n nd-3"/>
  <circle cx="50" cy="160" class="ms-node-n nd-4"/>
  <circle cx="100" cy="20" class="ms-node-n nd-5"/>
  <circle cx="100" cy="100" class="ms-center-p"/>
</svg>`,
    family: 'regular',
    colors: ['--p31-accent-red', '--p31-accent-violet', '--p31-text'],
    animated: true,
    description: 'Mesh infrastructure, distributed nodes',
  },
  'spoon': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="Spoon animated icon">
  <title>Spoon</title>
  <desc>An elegant spoon swaying slightly with a glowing bowl, representing cognitive capacity and spoon-aware design.</desc>
  <style>
    .sp-group { transform-origin: 100px 30px; animation: spSway 8s infinite ease-in-out; }
    .sp-bowl-p { fill: var(--p31-accent-iris, #818CF8); animation: spGlow 3s infinite alternate ease-in-out; }
    .sp-handle-s { stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 5; stroke-linecap: round; fill: none; }
    .sp-rip { fill: none; stroke: var(--p31-accent-violet, #A78BFA); opacity: 0; transform-origin: 100px 145px; }
    .sp-rip-1 { animation: spExpand 5s infinite ease-out; }
    .sp-rip-2 { animation: spExpand 5s infinite ease-out; animation-delay: 2.5s; }
    .sp-finial-n { fill: var(--p31-text, #F5F5F7); opacity: 0.8; }
    @keyframes spSway { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
    @keyframes spGlow { 0% { filter: drop-shadow(0 0 4px var(--p31-accent-iris, #818CF8)); opacity: 0.7; } 100% { filter: drop-shadow(0 0 16px var(--p31-accent-iris, #818CF8)); opacity: 1; } }
    @keyframes spExpand { 0% { transform: scale(0.5); opacity: 0.8; stroke-width: 4; } 70% { transform: scale(2); opacity: 0; stroke-width: 1; } 100% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .sp-group, .sp-bowl-p, .sp-rip { animation: none; } .sp-group { transform: rotate(0deg); } .sp-bowl-p { opacity: 0.8; } }
  </style>
  <g class="sp-group">
    <ellipse cx="100" cy="145" rx="22" ry="32" class="sp-rip sp-rip-1"/>
    <ellipse cx="100" cy="145" rx="22" ry="32" class="sp-rip sp-rip-2"/>
    <path d="M 100 30 Q 96 80 100 110" class="sp-handle-s"/>
    <path d="M 100 110 Q 100 120 100 145" class="sp-handle-s" style="stroke-width:3"/>
    <ellipse cx="100" cy="145" rx="16" ry="26" class="sp-bowl-p"/>
    <circle cx="100" cy="30" r="6" class="sp-finial-n"/>
  </g>
</svg>`,
    family: 'regular',
    colors: ['--p31-accent-iris', '--p31-accent-violet', '--p31-text'],
    animated: true,
    description: 'Cognitive capacity, spoon-aware design',
  },
  'p31-wordmark': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="P31 Wordmark animated icon">
  <title>P31 Wordmark</title>
  <desc>Stylized P31 text surrounded by counter-rotating geometric rings representing sovereign brand identity.</desc>
  <style>
    .wm-text-p { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 64px; fill: var(--p31-accent-red, #FB7185); letter-spacing: -2px; }
    .wm-glow { animation: wmGlow 3s infinite alternate ease-in-out; }
    .wm-ring-o { fill: none; stroke: var(--p31-accent-red, #FB7185); stroke-width: 2; stroke-dasharray: 40 20; transform-origin: 100px 100px; animation: wmFwd 20s infinite linear; }
    .wm-ring-i { fill: none; stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1.5; stroke-dasharray: 10 10; opacity: 0.5; transform-origin: 100px 100px; animation: wmRev 15s infinite linear; }
    .wm-dot-n { fill: var(--p31-text, #F5F5F7); opacity: 0.7; }
    @keyframes wmFwd { to { transform: rotate(360deg); } }
    @keyframes wmRev { to { transform: rotate(-360deg); } }
    @keyframes wmGlow { 0% { filter: drop-shadow(0 0 3px var(--p31-accent-red, #FB7185)); opacity: 0.85; } 100% { filter: drop-shadow(0 0 18px var(--p31-accent-red, #FB7185)); opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .wm-ring-o, .wm-ring-i, .wm-glow { animation: none; } .wm-ring-o, .wm-ring-i { stroke-dashoffset: 0; } .wm-glow { opacity: 0.9; } }
  </style>
  <circle cx="100" cy="100" r="85" class="wm-ring-o"/>
  <circle cx="100" cy="100" r="72" class="wm-ring-i"/>
  <text x="100" y="122" text-anchor="middle" class="wm-text-p wm-glow">P31</text>
  <circle cx="100" cy="45" r="3" class="wm-dot-n"/>
  <circle cx="100" cy="155" r="3" class="wm-dot-n"/>
</svg>`,
    family: 'regular',
    colors: ['--p31-accent-red', '--p31-accent-violet', '--p31-text'],
    animated: true,
    description: 'Sovereign brand identity',
  },
  'love-heart': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="LOVE Heart animated icon">
  <title>LOVE Heart</title>
  <desc>A geometric pulsing heart with an infinity-loop outline representing the care economy.</desc>
  <style>
    .lv-path-s { fill: none; stroke: var(--p31-accent, #00F0FF); stroke-width: 2; stroke-linecap: round; }
    .lv-dash { stroke-dasharray: 12 16; animation: lvFlow 20s infinite linear; }
    .lv-glow-p { fill: var(--p31-accent-violet, #A78BFA); transform-origin: 100px 100px; animation: lvBreath 4s infinite alternate ease-in-out; }
    .lv-dot-n { fill: var(--p31-text, #F5F5F7); opacity: 0.8; }
    @keyframes lvBreath { 0% { transform: scale(0.92); opacity: 0.6; filter: drop-shadow(0 0 4px var(--p31-accent-violet, #A78BFA)); } 100% { transform: scale(1.04); opacity: 0.95; filter: drop-shadow(0 0 20px var(--p31-accent-violet, #A78BFA)); } }
    @keyframes lvFlow { to { stroke-dashoffset: 400; } }
    @media (prefers-reduced-motion: reduce) { .lv-glow-p, .lv-dash { animation: none; } .lv-glow-p { transform: scale(1); opacity: 0.8; } .lv-dash { stroke-dashoffset: 0; } }
  </style>
  <path d="M100 165 C 100 165, 20 100, 20 50 C 20 15, 70 10, 100 45 C 130 10, 180 15, 180 50 C 180 100, 100 165, 100 165 Z" class="lv-path-s lv-dash" opacity="0.6"/>
  <path d="M100 150 C 100 150, 40 95, 40 55 C 40 30, 65 20, 100 50 C 135 20, 160 30, 160 55 C 160 95, 100 150, 100 150 Z" class="lv-glow-p"/>
  <circle cx="100" cy="45" r="4" class="lv-dot-n"/>
  <circle cx="100" cy="155" r="3" fill="var(--p31-accent, #00F0FF)" opacity="0.6"/>
</svg>`,
    family: 'regular',
    colors: ['--p31-accent', '--p31-accent-violet', '--p31-text'],
    animated: true,
    description: 'Care economy, LOVE ledger',
  },
  '863hz-resonance': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="863 Hz Resonance animated icon">
  <title>863 Hz Resonance</title>
  <desc>Concentric expanding rings with crossing sine waves representing the Larmor frequency of phosphorus-31.</desc>
  <style>
    .res-ring-p { fill: none; stroke: var(--p31-accent-gold, #FBBF24); stroke-width: 1.5; opacity: 0; transform-origin: 100px 100px; animation: ringPulse 6s infinite ease-out; }
    .res-ring-1 { animation-delay: 0s; }
    .res-ring-2 { animation-delay: 2s; }
    .res-ring-3 { animation-delay: 4s; }
    .res-wave-s { fill: none; stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 2; stroke-linecap: round; opacity: 0.5; }
    .res-wave-1 { transform-origin: 100px 100px; animation: waveOscillate 8s infinite ease-in-out; }
    .res-wave-2 { transform-origin: 100px 100px; animation: waveOscillate 8s infinite ease-in-out reverse; }
    .res-core-p { fill: var(--p31-accent-gold, #FBBF24); transform-origin: 100px 100px; animation: coreOscillate 3s infinite alternate ease-in-out; }
    .res-dot-n { fill: var(--p31-text, #F5F5F7); opacity: 0.8; }
    @keyframes ringPulse { 0% { transform: scale(0.1); opacity: 1; stroke-width: 4; } 100% { transform: scale(1.05); opacity: 0; stroke-width: 1; } }
    @keyframes waveOscillate { 0%, 100% { opacity: 0.3; transform: rotate(-3deg); } 50% { opacity: 0.7; transform: rotate(3deg); } }
    @keyframes coreOscillate { 0% { filter: drop-shadow(0 0 2px var(--p31-accent-gold, #FBBF24)); opacity: 0.7; r: 8; } 100% { filter: drop-shadow(0 0 16px var(--p31-accent-gold, #FBBF24)); opacity: 1; r: 11; } }
    @media (prefers-reduced-motion: reduce) { .res-ring-p { animation: none; opacity: 0.15; transform: scale(0.5); } .res-wave-1, .res-wave-2 { animation: none; opacity: 0.4; } .res-core-p { animation: none; opacity: 0.8; r: 9; } }
  </style>
  <circle cx="100" cy="100" r="90" class="res-ring-p res-ring-1"/>
  <circle cx="100" cy="100" r="90" class="res-ring-p res-ring-2"/>
  <circle cx="100" cy="100" r="90" class="res-ring-p res-ring-3"/>
  <g class="res-wave-1"><path d="M10 100 Q 55 40 100 100 T 190 100" class="res-wave-s"/></g>
  <g class="res-wave-2"><path d="M10 100 Q 55 160 100 100 T 190 100" class="res-wave-s"/></g>
  <circle cx="100" cy="100" r="9" class="res-core-p"/>
  <circle cx="100" cy="50" r="3" class="res-dot-n"/>
</svg>`,
    family: 'regular',
    colors: ['--p31-accent-gold', '--p31-accent-violet', '--p31-text'],
    animated: true,
    description: 'Phosphorus-31 Larmor frequency, quantum resonance',
  },
  'sovereign-crown': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="Sovereign Crown animated icon">
  <title>Sovereign Crown</title>
  <desc>A six-pointed sovereign crown with rotating accents, lighting nodes, and a radiant central jewel. 6-color palette.</desc>
  <defs>
    <linearGradient id="crown-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.9"/>
      <stop offset="25%" stop-color="#A78BFA" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#FBBF24" stop-opacity="0.8"/>
      <stop offset="75%" stop-color="#818CF8" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#00F0FF" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <style>
    .cr-crown { stroke: rgba(255,255,255,0.1); stroke-width: 0.75; stroke-linejoin: round; }
    .cr-c1 { fill: var(--p31-accent, #00F0FF); }
    .cr-c2 { fill: var(--p31-accent-violet, #A78BFA); }
    .cr-c3 { fill: var(--p31-accent-gold, #FBBF24); }
    .cr-c4 { fill: var(--p31-accent-green, #34D399); }
    .cr-c5 { fill: var(--p31-accent-iris, #818CF8); }
    .cr-c6 { fill: var(--p31-accent-red, #FB7185); }
    .cr-master { transition: filter 0.6s ease-in-out, opacity 0.6s ease-in-out; }
    .cr-jewel { filter: drop-shadow(0 0 4px currentColor); transform-origin: 100px 100px; }
    .cr-j1 { animation: crOrbit 16s infinite linear; }
    .cr-j3 { animation: crOrbit 16s infinite linear; animation-delay: -5.33s; }
    .cr-j5 { animation: crOrbit 16s infinite linear; animation-delay: -10.67s; }
    .cr-core { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 100px; animation: crCore 3s infinite alternate ease-in-out; }
    .cr-band { fill: none; stroke-width: 1.5; stroke-linecap: round; }
    .cr-ring { fill: none; stroke-width: 1; opacity: 0.2; transform-origin: 100px 100px; }
    .cr-b1 { stroke: var(--p31-accent, #00F0FF); animation: crBand 8s infinite linear; }
    .cr-b2 { stroke: var(--p31-accent-violet, #A78BFA); animation: crBand 8s infinite linear reverse; }
    .cr-b3 { stroke: var(--p31-accent-gold, #FBBF24); animation: crBand 8s infinite linear; }
    @keyframes crOrbit { to { transform: rotate(360deg); } }
    @keyframes crCore { 0% { transform: scale(0.85); filter: drop-shadow(0 0 4px var(--p31-accent, #00F0FF)); } 100% { transform: scale(1.1); filter: drop-shadow(0 0 20px var(--p31-accent, #00F0FF)); } }
    @keyframes crBand { to { stroke-dashoffset: 400; } }
    .cr-rotate { transform-origin: 100px 100px; animation: crRotate 30s infinite linear; }
    @keyframes crRotate { to { transform: rotate(360deg); } }
    .master-pulse .cr-master { filter: drop-shadow(0 0 22px var(--p31-accent, #00F0FF)) !important; opacity: 1 !important; }
    @media (prefers-reduced-motion: reduce) { .cr-rotate, .cr-jewel, .cr-core, .cr-ring, .cr-band { animation: none; } .cr-core { r: 14; opacity: 0.9; } }
  </style>
  <g>
    <path d="M 40 155 Q 60 80 70 38 Q 85 18 100 19 Q 115 18 130 38 Q 140 80 160 155" class="cr-crown" fill="none" stroke="url(#crown-grad)" stroke-width="2.5"/>
    <path d="M 40 155 Q 60 80 70 38 Q 85 18 100 19 Q 115 18 130 38 Q 140 80 160 155 Q 145 145 130 142 Q 115 139 100 139 Q 85 139 70 142 Q 55 145 40 155 Z" fill="rgba(255,255,255,0.04)"/>
    <polygon points="100,19 108,38 128,38" class="cr-c1"/>
    <polygon points="100,19 92,38 72,38" class="cr-c2"/>
    <polygon points="70,38 78,55 92,38" class="cr-c3"/>
    <polygon points="130,38 122,55 108,38" class="cr-c4"/>
    <polygon points="72,38 85,60 100,58 92,38" class="cr-c5"/>
    <polygon points="128,38 115,60 100,58 108,38" class="cr-c6"/>
    <polygon points="100,52 108,70 100,82" class="cr-c1" opacity="0.7"/>
    <polygon points="100,52 92,70 100,82" class="cr-c2" opacity="0.7"/>
  </g>
  <g class="cr-rotate">
    <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    <circle cx="100" cy="100" r="75" class="cr-band cr-b1" stroke-dasharray="60 30"/>
    <circle cx="100" cy="100" r="72" class="cr-band cr-b2" stroke-dasharray="30 60"/>
    <circle cx="100" cy="100" r="68" class="cr-band cr-b3" stroke-dasharray="50 50"/>
    <circle cx="100" cy="38" r="4.5" class="cr-jewel cr-j1 cr-c3"/>
    <circle cx="130" cy="38" r="3.5" class="cr-jewel cr-j3 cr-c6"/>
    <circle cx="144" cy="75" r="3" class="cr-jewel cr-j5 cr-c4"/>
    <circle cx="100" cy="100" r="16" class="cr-core cr-master"/>
    <circle cx="100" cy="100" r="11" fill="none" stroke="var(--p31-accent-violet, #A78BFA)" stroke-width="1" opacity="0.5">
      <animate attributeName="r" from="11" to="14" dur="1.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="0.5" to="0.2" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="100" cy="100" r="5" fill="var(--p31-bg, #0A0A0F)" opacity="0.9"/>
  </g>
</svg>`,
    family: 'advanced',
    colors: ['--p31-accent', '--p31-accent-violet', '--p31-accent-gold', '--p31-accent-green', '--p31-accent-iris', '--p31-accent-red'],
    animated: true,
    description: 'Sovereign authority, six-faceted leadership',
  },
  'prism-fold': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="Prism Fold animated icon">
  <title>Prism Fold</title>
  <desc>A 3D geometric hexagon with six triangular facets that unfold and refold. 6-color palette, center pivot.</desc>
  <style>
    .pf-facet { stroke: rgba(255,255,255,0.1); stroke-width: 0.75; stroke-linejoin: round; }
    .pf-c1 { fill: var(--p31-accent, #00F0FF); }
    .pf-c2 { fill: var(--p31-accent-violet, #A78BFA); }
    .pf-c3 { fill: var(--p31-accent-gold, #FBBF24); }
    .pf-c4 { fill: var(--p31-accent-green, #34D399); }
    .pf-c5 { fill: var(--p31-accent-iris, #818CF8); }
    .pf-c6 { fill: var(--p31-accent-red, #FB7185); }
    .pf-group { transform-origin: 100px 100px; animation: pfRotate 30s infinite linear; }
    .pf-fold { transform-origin: var(--fx, 100px) var(--fy, 100px); animation: pfFold 4s infinite alternate ease-in-out; }
    .pf-1 { --fx: 116px; --fy: 78px; animation-delay: 0s; }
    .pf-2 { --fx: 100px; --fy: 72px; animation-delay: 0.5s; }
    .pf-3 { --fx: 84px; --fy: 78px; animation-delay: 1s; }
    .pf-4 { --fx: 87px; --fy: 110px; animation-delay: 1.5s; }
    .pf-5 { --fx: 100px; --fy: 115px; animation-delay: 2s; }
    .pf-6 { --fx: 113px; --fy: 110px; animation-delay: 2.5s; }
    .pf-master { transition: opacity 0.4s ease, filter 0.4s ease; }
    .pf-inner { fill: var(--p31-accent, #00F0FF); opacity: 0.1; transform-origin: 100px 100px; animation: pfInner 4s infinite alternate ease-in-out; }
    @keyframes pfFold {
      0% { transform: rotateX(0deg) rotateY(0deg); opacity: 0.55; stroke-width: 0.75; }
      60% { transform: rotateX(35deg) rotateY(25deg); opacity: 1; stroke-width: 0.75; }
      100% { transform: rotateX(25deg) rotateY(40deg); opacity: 0.55; stroke-width: 0.75; }
    }
    @keyframes pfInner { 0% { transform: scale(0.85); opacity: 0.05; } 100% { transform: scale(1.15); opacity: 0.16; } }
    @keyframes pfRotate { to { transform: rotate(360deg); } }
    @keyframes pfPulse { 0%, 100% { r: 46; opacity: 0.1; } 50% { r: 50; opacity: 0.2; } }
    .pf-outer { fill: none; stroke: var(--p31-accent, #00F0FF); stroke-width: 1; opacity: 0.15; animation: pfPulse 3s infinite ease-in-out; transform-origin: 100px 100px; }
    .master-pulse .pf-master { opacity: 0.35 !important; filter: drop-shadow(0 0 18px var(--p31-accent, #00F0FF)) !important; }
    @media (prefers-reduced-motion: reduce) { .pf-group, .pf-fold, .pf-inner, .pf-master, .pf-outer { animation: none; } .pf-fold { transform: none; } .pf-inner { opacity: 0.1; } .pf-outer { opacity: 0.15; } }
  </style>
  <g class="pf-group">
    <circle cx="100" cy="100" r="46" class="pf-outer" stroke-dasharray="8 6"/>
    <circle cx="100" cy="100" r="60" class="pf-inner pf-master"/>
    <polygon points="100,60 120,80 100,100" class="pf-facet pf-c1 pf-fold pf-1"/>
    <polygon points="100,60 100,80 80,80" class="pf-facet pf-c2 pf-fold pf-2"/>
    <polygon points="80,80 100,100 80,110" class="pf-facet pf-c3 pf-fold pf-3"/>
    <polygon points="100,100 80,110 100,120" class="pf-facet pf-c4 pf-fold pf-4"/>
    <polygon points="100,100 100,120 120,110" class="pf-facet pf-c5 pf-fold pf-5"/>
    <polygon points="100,100 120,110 120,80" class="pf-facet pf-c6 pf-fold pf-6"/>
  </g>
</svg>`,
    family: 'advanced',
    colors: ['--p31-accent', '--p31-accent-violet', '--p31-accent-gold', '--p31-accent-green', '--p31-accent-iris', '--p31-accent-red'],
    animated: true,
    description: 'Geometric transformation, multi-facet perspective',
  },
  'nebula-burst': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="Nebula Burst animated icon">
  <title>Nebula Burst</title>
  <desc>A generative particle cloud with expanding wave rings, representing emergence and structure from chaos. 6-color palette.</desc>
  <style>
    .nb-ripple { fill: none; stroke-width: 1.5; stroke-linecap: round; opacity: 0; transform-origin: 100px 100px; }
    .nb-r1 { stroke: var(--p31-accent, #00F0FF); animation: nbRipple 6s infinite ease-out; }
    .nb-r2 { stroke: var(--p31-accent-violet, #A78BFA); animation: nbRipple 6s infinite ease-out 2s; }
    .nb-r3 { stroke: var(--p31-accent-gold, #FBBF24); animation: nbRipple 6s infinite ease-out 4s; }
    .nb-r4 { stroke: var(--p31-accent-green, #34D399); animation: nbRipple 6s infinite ease-out 6s; }
    @keyframes nbRipple { 0% { transform: scale(0.05); opacity: 0.7; stroke-width: 4; } 100% { transform: scale(1); opacity: 0; stroke-width: 1; } }
    .nb-dot { r: 2.5; animation: nbDrift var(--d, 8s) infinite alternate ease-in-out; }
    .nb-dot:nth-child(6n+1) { fill: var(--p31-accent, #00F0FF); }
    .nb-dot:nth-child(6n+2) { fill: var(--p31-accent-violet, #A78BFA); }
    .nb-dot:nth-child(6n+3) { fill: var(--p31-accent-gold, #FBBF24); }
    .nb-dot:nth-child(6n+4) { fill: var(--p31-accent-green, #34D399); }
    .nb-dot:nth-child(6n+5) { fill: var(--p31-accent-red, #FB7185); }
    .nb-dot:nth-child(6n+6) { fill: var(--p31-accent-iris, #818CF8); }
    @keyframes nbDrift { 0% { transform: translate(0, 0); opacity: 0.3; } 100% { transform: translate(var(--tx, 20px), var(--ty, -20px)); opacity: 0.9; } }
    .nb-master { transition: opacity 0.4s ease, filter 0.4s ease; }
    .nb-cluster { transform-origin: 100px 100px; animation: nbCluster 28s infinite ease-in-out; }
    @keyframes nbCluster { 0%, 100% { transform: rotate(0deg) scale(1); } 25% { transform: rotate(3deg) scale(1.02); } 75% { transform: rotate(-3deg) scale(0.98); } }
    .master-pulse .nb-master { opacity: 0.9 !important; filter: drop-shadow(0 0 12px var(--p31-accent, #00F0FF)) !important; }
    @media (prefers-reduced-motion: reduce) { .nb-ripple, .nb-dot, .nb-cluster { animation: none; } .nb-dot { opacity: 0.5; transform: none; } .nb-ripple { opacity: 0; } }
  </style>
    <circle cx="100" cy="100" r="90" class="nb-ripple nb-r1 nb-master"/>
  <circle cx="100" cy="100" r="90" class="nb-ripple nb-r2"/>
  <circle cx="100" cy="100" r="90" class="nb-ripple nb-r3"/>
  <circle cx="100" cy="100" r="90" class="nb-ripple nb-r4"/>
  <g class="nb-cluster">
    <circle cx="100" cy="40" class="nb-dot" style="--d:12s;--tx:15px;--ty:-10px"/>
    <circle cx="80" cy="50" class="nb-dot" style="--d:9s;--tx:-10px;--ty:15px"/>
    <circle cx="120" cy="45" class="nb-dot" style="--d:11s;--tx:12px;--ty:-8px"/>
    <circle cx="60" cy="65" class="nb-dot" style="--d:7s;--tx:-8px;--ty:12px"/>
    <circle cx="140" cy="60" class="nb-dot" style="--d:10s;--tx:14px;--ty:-12px"/>
    <circle cx="45" cy="85" class="nb-dot" style="--d:8s;--tx:-12px;--ty:8px"/>
    <circle cx="155" cy="80" class="nb-dot" style="--d:13s;--tx:10px;--ty:-14px"/>
    <circle cx="35" cy="105" class="nb-dot" style="--d:6s;--tx:-14px;--ty:6px"/>
    <circle cx="165" cy="100" class="nb-dot" style="--d:14s;--tx:16px;--ty:-10px"/>
    <circle cx="40" cy="125" class="nb-dot" style="--d:9s;--tx:-10px;--ty:14px"/>
    <circle cx="160" cy="120" class="nb-dot" style="--d:11s;--tx:12px;--ty:-6px"/>
    <circle cx="55" cy="140" class="nb-dot" style="--d:7s;--tx:-8px;--ty:10px"/>
    <circle cx="145" cy="135" class="nb-dot" style="--d:10s;--tx:14px;--ty:-12px"/>
    <circle cx="75" cy="150" class="nb-dot" style="--d:8s;--tx:-12px;--ty:8px"/>
    <circle cx="125" cy="148" class="nb-dot" style="--d:12s;--tx:10px;--ty:-10px"/>
    <circle cx="100" cy="155" class="nb-dot" style="--d:6s;--tx:-14px;--ty:12px"/>
    <circle cx="90" cy="35" class="nb-dot" style="--d:11s;--tx:8px;--ty:-15px"/>
    <circle cx="110" cy="35" class="nb-dot" style="--d:9s;--tx:-8px;--ty:10px"/>
    <circle cx="50" cy="100" class="nb-dot" style="--d:13s;--tx:16px;--ty:-8px"/>
    <circle cx="150" cy="95" class="nb-dot" style="--d:7s;--tx:-10px;--ty:14px"/>
    <circle cx="95" cy="60" class="nb-dot" style="--d:10s;--tx:12px;--ty:-12px"/>
    <circle cx="105" cy="65" class="nb-dot" style="--d:8s;--tx:-14px;--ty:8px"/>
    <circle cx="70" cy="90" class="nb-dot" style="--d:12s;--tx:10px;--ty:-10px"/>
    <circle cx="130" cy="85" class="nb-dot" style="--d:6s;--tx:-8px;--ty:15px"/>
    <circle cx="85" cy="115" class="nb-dot" style="--d:14s;--tx:14px;--ty:-6px"/>
    <circle cx="115" cy="110" class="nb-dot" style="--d:9s;--tx:-12px;--ty:10px"/>
    <circle cx="75" cy="130" class="nb-dot" style="--d:11s;--tx:8px;--ty:-14px"/>
    <circle cx="125" cy="125" class="nb-dot" style="--d:7s;--tx:-10px;--ty:8px"/>
    <circle cx="100" cy="75" class="nb-dot" style="--d:10s;--tx:15px;--ty:-14px"/>
    <circle cx="100" cy="130" class="nb-dot" style="--d:8s;--tx:-12px;--ty:12px"/>
    <circle cx="65" cy="105" class="nb-dot" style="--d:13s;--tx:10px;--ty:-8px"/>
    <circle cx="135" cy="105" class="nb-dot" style="--d:6s;--tx:-14px;--ty:10px"/>
    <circle cx="90" cy="90" class="nb-dot" style="--d:12s;--tx:8px;--ty:-12px"/>
    <circle cx="110" cy="95" class="nb-dot" style="--d:9s;--tx:-10px;--ty:14px"/>
    <circle cx="80" cy="75" class="nb-dot" style="--d:11s;--tx:12px;--ty:-8px"/>
    <circle cx="120" cy="135" class="nb-dot" style="--d:7s;--tx:-8px;--ty:10px"/>
    <circle cx="100" cy="50" class="nb-dot" style="--d:10s;--tx:14px;--ty:-14px"/>
    <circle cx="100" cy="150" class="nb-dot" style="--d:8s;--tx:-12px;--ty:8px"/>
    <circle cx="55" cy="95" class="nb-dot" style="--d:14s;--tx:10px;--ty:-12px"/>
    <circle cx="145" cy="100" class="nb-dot" style="--d:6s;--tx:-14px;--ty:10px"/>
    <circle cx="70" cy="110" class="nb-dot" style="--d:13s;--tx:8px;--ty:-15px"/>
    <circle cx="130" cy="115" class="nb-dot" style="--d:9s;--tx:-10px;--ty:8px"/>
  </g>
</svg>`,
    family: 'advanced',
    colors: ['--p31-accent', '--p31-accent-violet', '--p31-accent-gold', '--p31-accent-green', '--p31-accent-red', '--p31-accent-iris'],
    animated: true,
    description: 'Emergence, chaos to structure, generative particles',
  },
  'comet-orb': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="Comet Orb animated icon">
  <title>Comet Orb</title>
  <desc>Swirling energy orb with harmonized elliptical rings and orbiting particles. 6-color palette, 48s sync cycle.</desc>
  <style>
    .co-ring { fill: none; stroke-width: 1.5; stroke-linecap: round; }
    .co-orbit-1 { transform-origin: 100px 100px; animation: coCw 16s infinite linear; }
    .co-orbit-2 { transform-origin: 100px 100px; animation: coCcw 12s infinite linear; }
    .co-orbit-3 { transform-origin: 100px 100px; animation: coCw 16s infinite linear; }
    .co-orbit-4 { transform-origin: 100px 100px; animation: coCcw 12s infinite linear; }
    .co-r1 { stroke: var(--p31-accent, #00F0FF); stroke-dasharray: 44 156; animation: coDash 4s infinite linear; }
    .co-r2 { stroke: var(--p31-accent-violet, #A78BFA); stroke-dasharray: 39 141; animation: coDash 4s infinite linear; }
    .co-r3 { stroke: var(--p31-accent-gold, #FBBF24); stroke-dasharray: 50 150; animation: coDash 4s infinite linear reverse; }
    .co-r4 { stroke: var(--p31-accent-green, #34D399); stroke-dasharray: 27 153; animation: coDash 4s infinite linear reverse; }
    .co-c1 { fill: var(--p31-accent, #00F0FF); }
    .co-c2 { fill: var(--p31-accent-violet, #A78BFA); }
    .co-c3 { fill: var(--p31-accent-gold, #FBBF24); }
    .co-c4 { fill: var(--p31-accent-green, #34D399); }
    .co-c5 { fill: var(--p31-accent-red, #FB7185); }
    .co-c6 { fill: var(--p31-accent-iris, #818CF8); }
    .co-particle { filter: drop-shadow(0 0 3px currentColor); }
    .co-p1 { animation: coCw 16s infinite linear; }
    .co-p2 { animation: coCcw 12s infinite linear; }
    .co-p3 { animation: coCw 16s infinite linear; }
    .co-p4 { animation: coCcw 12s infinite linear; }
    .co-p5 { animation: coCw 16s infinite linear; animation-delay: 8s; }
    .co-p6 { animation: coCcw 12s infinite linear; animation-delay: 6s; }
    .co-master { transition: filter 0.6s ease-in-out; }
    .co-core { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 100px; animation: coCore 2s infinite alternate ease-in-out; }
    .co-trail { fill: none; stroke-width: 1; opacity: 0; }
    .co-t1 { stroke: var(--p31-accent, #00F0FF); animation: coTrail 3s infinite ease-out; }
    .co-t2 { stroke: var(--p31-accent-violet, #A78BFA); animation: coTrail 3s infinite ease-out; animation-delay: 1.5s; }
    @keyframes coCw { to { transform: rotate(360deg); } }
    @keyframes coCcw { to { transform: rotate(-360deg); } }
    @keyframes coDash { to { stroke-dashoffset: 200; } }
    @keyframes coCore { 0% { transform: scale(0.85); opacity: 0.8; filter: drop-shadow(0 0 4px var(--p31-accent, #00F0FF)); } 100% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 22px var(--p31-accent, #00F0FF)); } }
    @keyframes coTrail { 0% { opacity: 0.5; stroke-width: 2.5; } 100% { opacity: 0; stroke-width: 0; } }
    .master-pulse .co-master { filter: drop-shadow(0 0 22px var(--p31-accent, #00F0FF)) !important; }
    @media (prefers-reduced-motion: reduce) { .co-orbit-1, .co-orbit-2, .co-orbit-3, .co-orbit-4, .co-particle, .co-core, .co-trail, .co-ring { animation: none; } .co-ring { stroke-dashoffset: 0; opacity: 0.3; } .co-core { r: 10; } }
  </style>
  <g class="co-orbit-1">
    <ellipse cx="100" cy="100" rx="88" ry="30" class="co-ring co-r1"/>
    <path d="M 100 70 Q 140 70 185 100 Q 140 130 100 130" class="co-trail co-t1"/>
    <circle cx="185" cy="100" r="3.5" class="co-particle co-c1 co-p1"/>
  </g>
  <g class="co-orbit-2">
    <ellipse cx="100" cy="100" rx="78" ry="26" class="co-ring co-r2" transform="rotate(60 100 100)"/>
    <circle cx="51" cy="27" r="3" class="co-particle co-c5 co-p2"/>
  </g>
  <g class="co-orbit-3">
    <ellipse cx="100" cy="100" rx="66" ry="22" class="co-ring co-r3" transform="rotate(120 100 100)"/>
    <path d="M 100 80 Q 50 80 15 100 Q 50 120 100 120" class="co-trail co-t2"/>
    <circle cx="15" cy="100" r="4" class="co-particle co-c3 co-p3"/>
  </g>
  <g class="co-orbit-4">
    <ellipse cx="100" cy="100" rx="54" ry="18" class="co-ring co-r4" transform="rotate(30 100 100)"/>
    <circle cx="158" cy="64" r="2.5" class="co-particle co-c4 co-p4"/>
  </g>
  <circle cx="100" cy="100" r="10" class="co-core co-master"/>
  <circle cx="42" cy="66" r="3" class="co-particle co-c6 co-p5"/>
  <circle cx="158" cy="134" r="3" class="co-particle co-c2 co-p6"/>
</svg>`,
    family: 'advanced',
    colors: ['--p31-accent', '--p31-accent-violet', '--p31-accent-gold', '--p31-accent-green', '--p31-accent-red', '--p31-accent-iris'],
    animated: true,
    description: 'Swirling energy, harmonized orbital motion',
  },
};

export const ICON_NAMES = Object.keys(ICON_CATALOG);
