/**
 * PHOS 2.0 — Sovereign Edge Renderer
 * Cloudflare Worker | phos.p31ca.org
 */
interface Env {}

interface Surface {
  id: string;
  label: string;
  emoji: string;
  description: string;
  interactionType: 'crud' | 'static' | 'custom';
}

const SURFACES: Surface[] = [
  { id: 'attention', label: 'Attention & Focus', emoji: '🧠', description: 'Monitor and guide cognitive resources.', interactionType: 'custom' },
  { id: 'brain', label: 'Brain Dump', emoji: '🧬', description: 'Rapid cognitive offloading.', interactionType: 'crud' },
  { id: 'breath', label: 'Breathing', emoji: '🌬️', description: 'Resonant frequency pacing.', interactionType: 'custom' },
  { id: 'code', label: 'Code', emoji: '💻', description: 'Syntax and logic structuring.', interactionType: 'crud' },
  { id: 'compass', label: 'Compass', emoji: '🧭', description: 'Waypoints and directionality.', interactionType: 'custom' },
  { id: 'dashboard', label: 'Dashboard', emoji: '📊', description: 'System overview and telemetry.', interactionType: 'custom' },
  { id: 'design', label: 'Design', emoji: '🎨', description: 'Aesthetic and token controls.', interactionType: 'static' },
  { id: 'developer', label: 'Developer', emoji: '🔧', description: 'System internals and logs.', interactionType: 'custom' },
  { id: 'docs', label: 'Docs', emoji: '📚', description: 'Knowledge base and specifications.', interactionType: 'static' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦', description: 'Relational connection points.', interactionType: 'crud' },
  { id: 'flow', label: 'Flow', emoji: '🌊', description: 'Momentum and state management.', interactionType: 'crud' },
  { id: 'focus', label: 'Focus', emoji: '🎯', description: 'Targeted single-task execution.', interactionType: 'custom' },
  { id: 'health', label: 'Health', emoji: '❤️', description: 'Biometric and somatic tracking.', interactionType: 'crud' },
  { id: 'hearth', label: 'Hearth', emoji: '🔥', description: 'Core daily intentions.', interactionType: 'custom' },
  { id: 'ledger', label: 'Ledger', emoji: '📒', description: 'Resource and energy accounting.', interactionType: 'custom' },
  { id: 'marketplace', label: 'Marketplace', emoji: '🏪', description: 'Exchange and acquisition.', interactionType: 'custom' },
  { id: 'mcp', label: 'MCP', emoji: '🔌', description: 'Model Context Protocol interfaces.', interactionType: 'static' },
  { id: 'memory', label: 'Memory', emoji: '💾', description: 'Long-term storage indexing.', interactionType: 'custom' },
  { id: 'movement', label: 'Movement', emoji: '🏃', description: 'Kinematic tracking.', interactionType: 'crud' },
  { id: 'papers', label: 'Papers', emoji: '📄', description: 'Document processing.', interactionType: 'crud' },
  { id: 'passport', label: 'Passport', emoji: '🛂', description: 'Identity and sovereignty data.', interactionType: 'custom' },
  { id: 'pilot', label: 'Pilot', emoji: '✈️', description: 'Navigation and trajectory.', interactionType: 'crud' },
  { id: 'regulation', label: 'Regulation', emoji: '⚖️', description: 'Nervous system balancing.', interactionType: 'static' },
  { id: 'research', label: 'Research', emoji: '🔬', description: 'Deep inquiry tracking.', interactionType: 'crud' },
  { id: 'school', label: 'School', emoji: '📖', description: 'Structured learning paths.', interactionType: 'crud' },
  { id: 'sensory', label: 'Sensory', emoji: '👁️', description: 'Stimulus gating and control.', interactionType: 'static' },
  { id: 'settings', label: 'Settings', emoji: '⚙️', description: 'Core system configuration.', interactionType: 'custom' },
  { id: 'sleep', label: 'Sleep', emoji: '😴', description: 'Restoration metrics.', interactionType: 'crud' },
  { id: 'smell', label: 'Smell', emoji: '👃', description: 'Olfactory environment.', interactionType: 'crud' },
  { id: 'sound', label: 'Sound', emoji: '🔊', description: 'Auditory landscape.', interactionType: 'crud' },
  { id: 'taste', label: 'Taste', emoji: '👅', description: 'Gustatory input.', interactionType: 'crud' },
  { id: 'terminal', label: 'Terminal', emoji: '📟', description: 'Direct command interface.', interactionType: 'custom' },
  { id: 'touch', label: 'Touch', emoji: '✋', description: 'Tactile engagement.', interactionType: 'static' },
  { id: 'vault', label: 'Vault', emoji: '🔐', description: 'Secure credential storage.', interactionType: 'custom' },
  { id: 'vision', label: 'Vision Board', emoji: '👁️', description: 'Visual manifestation.', interactionType: 'crud' },
];

const THEMES = ['cipher','garden','retro','ocean','sunset','mono','frost','ember','willow','phos','tetra','apex'];

function renderCSS(): string {
  return `<style>
:root {
  --p31-bg: #09090b; --p31-surface: #18181b; --p31-void: #0a0a0f;
  --p31-accent: #f4f4f5; --p31-accent-cyan: #06b6d4; --p31-accent-violet: #8b5cf6;
  --p31-accent-gold: #fbbf24; --p31-accent-green: #10b981; --p31-accent-red: #f43f5e;
  --p31-text: oklch(96% 0.005 240); --p31-text-secondary: #a1a1aa; --p31-text-tertiary: #52525b;
  --p31-glass-bg: rgba(24,24,27,0.65); --p31-glass-border: rgba(255,255,255,0.08);
  --p31-glass-shadow: 0 4px 30px rgba(0,0,0,0.1);
  --p31-blur: 12px; --p31-radius: 16px; --p31-radius-sm: 12px; --p31-radius-pill: 9999px;
  --p31-space-xs: .25rem; --p31-space-sm: .5rem; --p31-space-md: 1rem;
  --p31-space-lg: 1.5rem; --p31-space-xl: 2rem; --p31-space-2xl: 3rem; --p31-space-3xl: 4rem;
  --p31-scale-xs: .75rem; --p31-scale-sm: .875rem; --p31-scale-md: 1rem;
  --p31-scale-lg: 1.125rem; --p31-scale-xl: 1.25rem; --p31-scale-2xl: 1.5rem;
  --p31-scale-3xl: 1.875rem; --p31-scale-4xl: 2.25rem;
  --p31-font-sans: 'Inter',system-ui,-apple-system,sans-serif;
  --p31-font-mono: 'JetBrains Mono','Fira Code',monospace;
  --p31-motion-fast: 150ms; --p31-motion-std: 300ms; --p31-motion-slow: 500ms;
  --p31-glow-cyan: 0 0 15px rgba(6,182,212,0.5);
  --p31-glow-violet: 0 0 15px rgba(139,92,246,0.5);
  --p31-glow-gold: 0 0 15px rgba(251,191,36,0.5);
  --p31-nav-h: 48px;
}
[data-spoons="0"], [data-spoons="1"] {
  --p31-motion-fast: 0ms !important; --p31-motion-std: 0ms !important; --p31-motion-slow: 0ms !important;
  --p31-blur: 4px;
}
[data-spoons="4"], [data-spoons="5"] {
  --p31-motion-fast: 80ms; --p31-motion-std: 150ms; --p31-motion-slow: 300ms;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  background: var(--p31-bg,#09090b); color: var(--p31-text,oklch(96% 0.005 240));
  font-family: var(--p31-font-sans,system-ui); line-height:1.5; min-height:100vh; overflow-x:hidden;
}

/* Starfield background */
#starfield-bg{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.6}
.starfield-mesh{background-image:
  linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),
  linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);
  background-size:80px 80px;
}
.starfield-shimmer{animation:p31-shimmer 8s ease-in-out infinite}
.starfield-node{animation:p31-node-pulse 3s ease-in-out infinite;filter:url(#p31-star-glow)}
.starfield-node--dissolve{animation:p31-node-dissolve .8s ease-out forwards}
.starfield-line{stroke:var(--p31-accent-cyan,#06b6d4);stroke-width:.5;opacity:.15;
  animation:p31-line-shimmer 6s ease-in-out infinite}
@keyframes p31-shimmer{0%,100%{opacity:.3}50%{opacity:.6}}
@keyframes p31-node-pulse{0%,100%{opacity:.4;r:4}50%{opacity:.8;r:6}}
@keyframes p31-node-dissolve{0%{opacity:.8;transform:scale(1)}100%{opacity:0;transform:scale(.3)}}
@keyframes p31-line-shimmer{0%,100%{opacity:.08}50%{opacity:.25}}

/* Candybar nav pill */
.candybar{position:sticky;top:var(--p31-space-md,1rem);z-index:200;
  display:flex;justify-content:center;padding:0 var(--p31-space-md,1rem)}
.candybar-pill{display:flex;align-items:center;gap:var(--p31-space-md,1rem);
  padding:var(--p31-space-sm,.5rem) var(--p31-space-lg,1.5rem);
  background:var(--p31-glass-bg,rgba(24,24,27,.65));
  border:1px solid var(--p31-glass-border,rgba(255,255,255,.08));
  box-shadow:var(--p31-glass-shadow,0 4px 30px rgba(0,0,0,.1));
  backdrop-filter:blur(var(--p31-blur,12px));
  -webkit-backdrop-filter:blur(var(--p31-blur,12px));
  border-radius:var(--p31-radius-pill,9999px); transition:all var(--p31-motion-std,.3s)}
.candybar-pill:hover{border-color:var(--p31-accent-cyan,#06b6d4)}
.candybar-brand{font-weight:700;letter-spacing:.15em;font-size:var(--p31-scale-lg,1.125rem);
  background:linear-gradient(135deg,var(--p31-accent-cyan,#06b6d4),var(--p31-accent-violet,#8b5cf6));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent}
.candybar-spoons{display:flex;align-items:center;gap:var(--p31-space-xs,.25rem);
  font-size:var(--p31-scale-sm,.875rem);color:var(--p31-text-secondary,#a1a1aa)}
.candybar-toggle{font-size:var(--p31-scale-xs,.75rem);color:var(--p31-text-tertiary,#52525b);
  cursor:pointer;padding:2px 8px;border-radius:var(--p31-radius-pill,9999px);
  background:rgba(255,255,255,.04);transition:all var(--p31-motion-fast,.15s);user-select:none}
.candybar-toggle:hover{background:rgba(6,182,212,.1);color:var(--p31-accent-cyan,#06b6d4)}
.candybar-toggle--open{transform:rotate(180deg)}
.candybar-shade{overflow:hidden;max-height:0;transition:max-height var(--p31-motion-slow,.5s)
  cubic-bezier(.4,0,.2,1);display:flex;justify-content:center}
.candybar-shade--open{max-height:300px}
.candybar-shade-inner{display:flex;gap:var(--p31-space-xs,.25rem);padding:var(--p31-space-sm,.5rem);
  flex-wrap:wrap;justify-content:center;max-width:640px}
.shade-link,.shade-spoon{padding:6px 16px;border-radius:var(--p31-radius-pill,9999px);
  border:1px solid var(--p31-glass-border,rgba(255,255,255,.08));
  background:rgba(255,255,255,.03);color:var(--p31-text,oklch(96% 0.005 240));
  cursor:pointer;font-size:var(--p31-scale-sm,.875rem);
  transition:all var(--p31-motion-fast,.15s);text-decoration:none;white-space:nowrap}
.shade-link:hover,.shade-spoon:hover{background:rgba(6,182,212,.1);
  border-color:var(--p31-accent-cyan,#06b6d4)}
.shade-spoon--active{background:rgba(139,92,246,.15);border-color:var(--p31-accent-violet,#8b5cf6)}

/* Spoon SVG meter */
.spoon-meter-wrap{display:flex;align-items:center;gap:var(--p31-space-md,1rem)}
.spoon-meter-svg{width:48px;height:120px;overflow:hidden}
.spoon-fill{transition:height var(--p31-motion-slow,.5s) cubic-bezier(.4,0,.2,1)}
.spoon-level{font-family:var(--p31-font-mono,monospace);font-size:var(--p31-scale-xl,1.25rem);
  font-weight:700;color:var(--p31-accent-cyan,#06b6d4)}
.spoon-gradient-start{stop-color:var(--p31-accent-violet,#8b5cf6)}
.spoon-gradient-end{stop-color:var(--p31-accent-red,#f43f5e)}

/* Crown SVG */
.crown-wrap{display:inline-flex;align-items:center;justify-content:center;
  width:80px;height:80px;overflow:hidden}
.crown-edge{stroke:var(--p31-accent-cyan,#06b6d4);stroke-width:1.5;fill:none;
  stroke-dasharray:100;stroke-dashoffset:100;animation:p31-edge-draw 1.2s ease-out forwards}
.crown-edge--1{animation-delay:0s}
.crown-edge--2{animation-delay:.15s}
.crown-edge--3{animation-delay:.3s}
.crown-edge--4{animation-delay:.45s}
.crown-edge--5{animation-delay:.6s}
.crown-edge--6{animation-delay:.75s}
.crown-vert{animation:p31-vert-pulse 2s ease-in-out infinite}
.crown-vert--t{fill:var(--p31-accent-cyan,#06b6d4);animation-delay:0s}
.crown-vert--l{fill:var(--p31-accent-violet,#8b5cf6);animation-delay:.5s}
.crown-vert--r{fill:var(--p31-accent-gold,#fbbf24);animation-delay:1s}
.crown-vert--c{fill:var(--p31-accent-green,#10b981);animation-delay:1.5s;animation-duration:1.5s}
@keyframes p31-edge-draw{to{stroke-dashoffset:0}}
@keyframes p31-vert-pulse{0%,100%{r:5}50%{r:8}}

/* Chat surface */
.chat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
  gap:var(--p31-space-lg,1.5rem)}
.chat-chip{background:var(--p31-glass-bg,rgba(24,24,27,.65));
  border:1px solid var(--p31-glass-border,rgba(255,255,255,.08));
  box-shadow:var(--p31-glass-shadow,0 4px 30px rgba(0,0,0,.1));
  backdrop-filter:blur(var(--p31-blur,12px));
  -webkit-backdrop-filter:blur(var(--p31-blur,12px));
  border-radius:var(--p31-radius,16px);overflow:hidden;
  transition:all var(--p31-motion-std,.3s)}
.chat-chip:hover{transform:translateY(-2px);border-color:var(--p31-accent-cyan,#06b6d4);
  box-shadow:var(--p31-glow-cyan,0 0 15px rgba(6,182,212,.5))}
.chat-chip-header{display:flex;justify-content:space-between;align-items:center;
  padding:var(--p31-space-md,1rem);border-bottom:1px solid var(--p31-glass-border,rgba(255,255,255,.08))}
.chat-chip-sender{font-weight:600;font-size:var(--p31-scale-sm,.875rem)}
.chat-chip-time{font-size:var(--p31-scale-xs,.75rem);color:var(--p31-text-tertiary,#52525b)}
.chat-chip-toggle{cursor:pointer;background:none;border:none;color:var(--p31-text-secondary,#a1a1aa);
  font-size:var(--p31-scale-lg,1.125rem);padding:0 4px;transition:transform var(--p31-motion-fast,.15s)}
.chat-chip-toggle--open{transform:rotate(180deg)}
.chat-chip-body{padding:var(--p31-space-md,1rem);max-height:0;overflow:hidden;
  transition:max-height var(--p31-motion-std,.3s) ease-in-out,padding var(--p31-motion-fast,.15s);
  color:var(--p31-text-secondary,#a1a1aa);font-size:var(--p31-scale-sm,.875rem);line-height:1.6}
.chat-chip-body--open{max-height:500px;padding:var(--p31-space-md,1rem)}
.chat-chip-footer{display:flex;gap:var(--p31-space-sm,.5rem);padding:var(--p31-space-sm,.5rem) var(--p31-space-md,1rem);
  border-top:1px solid var(--p31-glass-border,rgba(255,255,255,.08))}
.chip-btn{padding:6px 14px;border-radius:var(--p31-radius-pill,9999px);
  border:1px solid var(--p31-glass-border,rgba(255,255,255,.08));
  background:rgba(255,255,255,.03);color:var(--p31-text-secondary,#a1a1aa);
  cursor:pointer;font-size:var(--p31-scale-xs,.75rem);
  transition:all var(--p31-motion-fast,.15s);min-height:32px}
.chip-btn:hover{background:rgba(6,182,212,.1);border-color:var(--p31-accent-cyan,#06b6d4);
  color:var(--p31-accent-cyan,#06b6d4)}
.chip-btn--connect{color:var(--p31-accent-violet,#8b5cf6);border-color:rgba(139,92,246,.3)}

/* Sandbox chip */
.sandbox{background:rgba(10,10,15,.85);border:1px solid rgba(16,185,129,.25)}
.sandbox-code{font-family:var(--p31-font-mono,monospace);font-size:var(--p31-scale-xs,.75rem);
  background:rgba(0,0,0,.4);padding:var(--p31-space-md,1rem);border-radius:8px;
  margin:var(--p31-space-sm,.5rem) 0;overflow-x:auto;color:var(--p31-accent-green,#10b981);
  white-space:pre-wrap;min-height:48px}
.sandbox-output{font-family:var(--p31-font-mono,monospace);font-size:var(--p31-scale-xs,.75rem);
  padding:var(--p31-space-sm,.5rem) var(--p31-space-md,1rem);color:var(--p31-text-secondary,#a1a1aa);
  border-top:1px dashed var(--p31-glass-border,rgba(255,255,255,.08))}
.sandbox-run{padding:6px 18px;border-radius:var(--p31-radius-pill,9999px);
  border:1px solid var(--p31-accent-green,#10b981);background:rgba(16,185,129,.1);
  color:var(--p31-accent-green,#10b981);cursor:pointer;font-size:var(--p31-scale-xs,.75rem);
  transition:all var(--p31-motion-fast,.15s);min-height:32px}
.sandbox-run:hover{background:rgba(16,185,129,.2)}

/* Glass cards */
.glass{background:var(--p31-glass-bg,rgba(24,24,27,.65));
  border:1px solid var(--p31-glass-border,rgba(255,255,255,.08));
  box-shadow:var(--p31-glass-shadow,0 4px 30px rgba(0,0,0,.1));
  backdrop-filter:blur(var(--p31-blur,12px));
  -webkit-backdrop-filter:blur(var(--p31-blur,12px));
  border-radius:var(--p31-radius,16px);padding:var(--p31-space-lg,1.5rem);
  transition:all var(--p31-motion-std,.3s)}
.glass--hover:hover{transform:translateY(-2px);border-color:var(--p31-accent-cyan,#06b6d4);
  box-shadow:var(--p31-glow-cyan,0 0 15px rgba(6,182,212,.5))}
.gradient-text{background:linear-gradient(135deg,var(--p31-accent-cyan,#06b6d4),var(--p31-accent-violet,#8b5cf6));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700}

/* Layout */
.container{max-width:1200px;margin:0 auto;padding:var(--p31-space-lg,1.5rem) var(--p31-space-md,1rem);
  position:relative;z-index:1}
.grid-layout{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
  gap:var(--p31-space-lg,1.5rem);margin-top:var(--p31-space-xl,2rem)}
.surface-card{display:flex;flex-direction:column;cursor:pointer;text-decoration:none;color:inherit}
.surface-card:hover{transform:translateY(-2px);border-color:var(--p31-accent-cyan,#06b6d4);
  box-shadow:var(--p31-glow-cyan,0 0 15px rgba(6,182,212,.5))}
.back-link{display:inline-flex;align-items:center;gap:8px;color:var(--p31-text-secondary,#a1a1aa);
  text-decoration:none;font-size:var(--p31-scale-sm,.875rem);
  transition:color var(--p31-motion-fast,.15s);margin-bottom:var(--p31-space-lg,1.5rem)}
.back-link:hover{color:var(--p31-accent-cyan,#06b6d4)}
.header-row{display:flex;align-items:center;gap:var(--p31-space-lg,1.5rem);margin-bottom:var(--p31-space-2xl,3rem);
  flex-wrap:wrap;min-width:0}
.header-row h1{flex:1;min-width:0}

/* Settings */
.settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--p31-space-lg,1.5rem)}
@media(max-width:768px){.settings-grid{grid-template-columns:1fr}}

/* Theme orb */
#theme-orb{position:fixed;bottom:var(--p31-space-xl,2rem);right:var(--p31-space-xl,2rem);
  width:48px;height:48px;border-radius:50%;cursor:pointer;z-index:999;
  display:flex;align-items:center;justify-content:center;font-size:24px;
  border:2px solid var(--p31-glass-border,rgba(255,255,255,.08));
  background:linear-gradient(135deg,var(--p31-accent-cyan,#06b6d4),var(--p31-accent-violet,#8b5cf6));
  box-shadow:var(--p31-glow-cyan,0 0 15px rgba(6,182,212,.5));
  transition:transform var(--p31-motion-fast,.15s)}
#theme-orb:hover{transform:scale(1.1)}

/* Inputs / buttons */
.p31-input{flex:1;padding:12px 16px;border-radius:8px;
  border:1px solid var(--p31-glass-border,rgba(255,255,255,.08));
  background:rgba(0,0,0,.3);color:var(--p31-text,oklch(96% 0.005 240));
  font-size:14px;outline:none;font-family:var(--p31-font-mono,monospace)}
.p31-input:focus{border-color:var(--p31-accent-cyan,#06b6d4)}
.p31-btn{padding:10px 20px;border-radius:8px;border:none;
  background:var(--p31-accent-violet,#8b5cf6);color:var(--p31-text,oklch(96% 0.005 240));
  cursor:pointer;font-weight:600;min-height:48px;transition:opacity var(--p31-motion-fast,.15s)}
.p31-btn:hover{opacity:.85}
.p31-btn--ghost{border:1px solid var(--p31-glass-border,rgba(255,255,255,.08));
  background:transparent;color:var(--p31-text,oklch(96% 0.005 240))}
.p31-btn--danger{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);
  color:var(--p31-accent-red,#f43f5e)}
.p31-btn--sm{padding:6px 16px;font-size:var(--p31-scale-xs,.75rem);min-height:32px;border-radius:var(--p31-radius-pill,9999px)}
.p31-pre{background:rgba(0,0,0,.4);padding:16px;border-radius:8px;
  font-family:var(--p31-font-mono,monospace);font-size:12px;
  border:1px solid var(--p31-glass-border,rgba(255,255,255,.08));overflow-x:auto}
</style>`;
}

function renderStarfield(): string {
  const nodes: string[] = [];
  const lines: string[] = [];
  const rng = mulberry32(42);
  const pts: [number,number][] = [];
  const W=1200,H=800;
  for(let i=0;i<34;i++){pts.push([rng()*W,rng()*H]);}
  for(let i=0;i<pts.length;i++){
    const [x,y]=pts[i]; const r=3+rng()*3; const d=2+rng()*4;
    nodes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="var(--p31-accent-cyan,#06b6d4)" opacity="0.5" class="starfield-node" style="animation-delay:${(i*0.15).toFixed(2)}s;animation-duration:${(2.5+rng()*2).toFixed(1)}s"><animate attributeName="r" values="${r};${r+2};${r}" dur="${(2.5+rng()*2).toFixed(1)}s" repeatCount="indefinite"/></circle>`);
  }
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      const dx=pts[i][0]-pts[j][0],dy=pts[i][1]-pts[j][1];
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<160){lines.push(`<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" class="starfield-line" style="animation-delay:${((i+j)*0.1).toFixed(2)}s"/>`);}
    }
  }
  return `<div id="starfield-bg" class="starfield-mesh starfield-shimmer"><svg width="100%" height="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><filter id="p31-star-glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${lines.join('')}${nodes.join('')}</svg></div>`;
}

function renderNav(spoons: number): string {
  return `<nav class="candybar" data-mcp-tool="phosNav" data-mcp-type="surface">
  <div style="display:flex;flex-direction:column;align-items:center;gap:0;width:100%;max-width:720px">
    <div class="candybar-pill" style="width:100%;justify-content:space-between">
      <span class="candybar-brand">👑 PHOS</span>
      <span class="candybar-spoons">🍴 <span id="nav-spoons">${spoons}</span>/5</span>
      <span class="candybar-toggle" id="nav-toggle" onclick="document.getElementById('nav-shade').classList.toggle('candybar-shade--open');this.classList.toggle('candybar-toggle--open')" role="button" aria-label="Toggle navigation shade" tabindex="0">▼</span>
    </div>
    <div class="candybar-shade" id="nav-shade">
      <div class="candybar-shade-inner">
        <a href="/" class="shade-link" data-mcp-tool="navHome" data-mcp-type="action">Home</a>
        <a href="/chat" class="shade-link" data-mcp-tool="navChat" data-mcp-type="action">Chat</a>
        <a href="/settings" class="shade-link" data-mcp-tool="navSettings" data-mcp-type="action">Settings</a>
        ${[0,1,2,3,4,5].map(l=>`<button class="shade-spoon${l===spoons?' shade-spoon--active':''}" onclick="window.__p31MCPTools.setSpoonLevel(${l})" data-mcp-tool="setSpoons${l}" data-mcp-type="action">Spoon ${l}</button>`).join('')}
      </div>
    </div>
  </div></nav>`;
}

function renderSpoonMeter(level: number): string {
  const pct=(level/5)*100;
  const colors=['#f43f5e','#f43f5e','#fbbf24','#06b6d4','#8b5cf6','#8b5cf6'];
  const color=colors[Math.min(level,5)];
  return `<span class="spoon-meter-wrap">
  <svg class="spoon-meter-svg" viewBox="0 0 48 140" xmlns="http://www.w3.org/2000/svg" aria-label="Spoon meter showing ${level} out of 5 spoons">
    <defs>
      <clipPath id="spoon-clip"><rect x="12" y="10" width="24" height="120" rx="4"/><ellipse cx="24" cy="130" rx="18" ry="20"/></clipPath>
      <linearGradient id="spoon-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" class="spoon-gradient-start"/><stop offset="30%" stop-color="${color}"/><stop offset="100%" class="spoon-gradient-end"/>
      </linearGradient>
    </defs>
    <rect x="12" y="10" width="24" height="105" rx="4" fill="rgba(255,255,255,0.06)" stroke="var(--p31-glass-border,rgba(255,255,255,.08))" stroke-width="1"/>
    <ellipse cx="24" cy="115" rx="18" ry="18" fill="rgba(255,255,255,0.06)" stroke="var(--p31-glass-border,rgba(255,255,255,.08))" stroke-width="1"/>
    <g clip-path="url(#spoon-clip)">
      <rect x="12" y="${130-pct*1.2}" width="24" height="${pct*1.2}" fill="url(#spoon-grad)" class="spoon-fill"/>
    </g>
    <text x="24" y="152" text-anchor="middle" font-family="var(--p31-font-mono,monospace)" font-size="14" font-weight="700" fill="var(--p31-accent-cyan,#06b6d4)">${level}/5</text>
  </svg></span>`;
}

function renderCrown(): string {
  return `<span class="crown-wrap">
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="K4 Tetrahedron Crown">
    <defs>
      <filter id="crown-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <radialGradient id="grad-t"><stop offset="0%" stop-color="var(--p31-accent-cyan,#06b6d4)" stop-opacity="1"/><stop offset="100%" stop-color="var(--p31-accent-cyan,#06b6d4)" stop-opacity="0.2"/></radialGradient>
      <radialGradient id="grad-l"><stop offset="0%" stop-color="var(--p31-accent-violet,#8b5cf6)" stop-opacity="1"/><stop offset="100%" stop-color="var(--p31-accent-violet,#8b5cf6)" stop-opacity="0.2"/></radialGradient>
      <radialGradient id="grad-r"><stop offset="0%" stop-color="var(--p31-accent-gold,#fbbf24)" stop-opacity="1"/><stop offset="100%" stop-color="var(--p31-accent-gold,#fbbf24)" stop-opacity="0.2"/></radialGradient>
      <radialGradient id="grad-c"><stop offset="0%" stop-color="var(--p31-accent-green,#10b981)" stop-opacity="1"/><stop offset="100%" stop-color="var(--p31-accent-green,#10b981)" stop-opacity="0.2"/></radialGradient>
    </defs>
    <line x1="50" y1="18" x2="20" y2="70" class="crown-edge crown-edge--1"/><line x1="50" y1="18" x2="80" y2="70" class="crown-edge crown-edge--2"/>
    <line x1="20" y1="70" x2="80" y2="70" class="crown-edge crown-edge--3"/><line x1="50" y1="18" x2="50" y2="55" class="crown-edge crown-edge--4"/>
    <line x1="20" y1="70" x2="50" y2="55" class="crown-edge crown-edge--5"/><line x1="80" y1="70" x2="50" y2="55" class="crown-edge crown-edge--6"/>
    <circle cx="50" cy="18" r="5" fill="url(#grad-t)" filter="url(#crown-glow)" class="crown-vert crown-vert--t"><animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite"/></circle>
    <circle cx="20" cy="70" r="5" fill="url(#grad-l)" filter="url(#crown-glow)" class="crown-vert crown-vert--l"><animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" begin="0.5s"/></circle>
    <circle cx="80" cy="70" r="5" fill="url(#grad-r)" filter="url(#crown-glow)" class="crown-vert crown-vert--r"><animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" begin="1s"/></circle>
    <circle cx="50" cy="55" r="6" fill="url(#grad-c)" filter="url(#crown-glow)" class="crown-vert crown-vert--c"><animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" begin="1.5s"/></circle>
  </svg></span>`;
}

function renderChat(): string {
  return `<div class="chat-grid">
<div class="chat-chip">
  <div class="chat-chip-header"><span class="chat-chip-sender gradient-text">Aria</span><span class="chat-chip-time">14:32</span><button class="chat-chip-toggle" onclick="this.classList.toggle('chat-chip-toggle--open');this.closest('.chat-chip').querySelector('.chat-chip-body').classList.toggle('chat-chip-body--open')">▼</button></div>
  <div class="chat-chip-body">The attention surface is showing elevated coherence today. Your morning focus window peaked at 09:47 with a 94% sustained attention score.</div>
  <div class="chat-chip-footer"><button class="chip-btn chip-btn--connect">Connect</button><button class="chip-btn">Reply</button></div>
</div>
<div class="chat-chip">
  <div class="chat-chip-header"><span class="chat-chip-sender gradient-text">K4</span><span class="chat-chip-time">13:08</span><button class="chat-chip-toggle" onclick="this.classList.toggle('chat-chip-toggle--open');this.closest('.chat-chip').querySelector('.chat-chip-body').classList.toggle('chat-chip-body--open')">▼</button></div>
  <div class="chat-chip-body chat-chip-body--open">Tetrahedral mesh integrity: 100%. All 4 vertices synchronized. Edge weights recalibrated after the 14:00 coherence pulse. Planarity maintained. β₂ = 1 confirmed.</div>
  <div class="chat-chip-footer"><button class="chip-btn chip-btn--connect">Connect</button><button class="chip-btn">Reply</button></div>
</div>
<div class="chat-chip">
  <div class="chat-chip-header"><span class="chat-chip-sender gradient-text">Ledger</span><span class="chat-chip-time">11:55</span><button class="chat-chip-toggle" onclick="this.classList.toggle('chat-chip-toggle--open');this.closest('.chat-chip').querySelector('.chat-chip-body').classList.toggle('chat-chip-body--open')">▼</button></div>
  <div class="chat-chip-body">Care transaction #A7F3 confirmed. 12 LOVE credited to attention surface. Hash chain verified: sha256(prev || entry) matches stored digest.</div>
  <div class="chat-chip-footer"><button class="chip-btn chip-btn--connect">Connect</button><button class="chip-btn">Reply</button></div>
</div>
<div class="chat-chip">
  <div class="chat-chip-header"><span class="chat-chip-sender gradient-text">Breath</span><span class="chat-chip-time">10:15</span><button class="chat-chip-toggle" onclick="this.classList.toggle('chat-chip-toggle--open');this.closest('.chat-chip').querySelector('.chat-chip-body').classList.toggle('chat-chip-body--open')">▼</button></div>
  <div class="chat-chip-body">Resonant frequency session complete. 5.5 Hz pacing maintained for 12 minutes. HRV coherence ratio: 0.87. Recommend following with a 2-minute restoration pause.</div>
  <div class="chat-chip-footer"><button class="chip-btn chip-btn--connect">Connect</button><button class="chip-btn">Reply</button></div>
</div>
<div class="chat-chip sandbox">
  <div class="chat-chip-header"><span class="chat-chip-sender gradient-text">Sandbox</span><span class="chat-chip-time">now</span><button class="chat-chip-toggle" onclick="this.classList.toggle('chat-chip-toggle--open');this.closest('.chat-chip').querySelector('.chat-chip-body').classList.toggle('chat-chip-body--open')">▼</button></div>
  <div class="chat-chip-body chat-chip-body--open">
    <div class="sandbox-code" contenteditable="true" spellcheck="false">// Sovereign execution environment\nconst spoons = document.documentElement.getAttribute('data-spoons');\nconsole.log('Active spoons:', spoons);</div>
    <button class="sandbox-run" onclick="try{eval(this.previousElementSibling.textContent);this.parentElement.nextElementSibling.textContent='✓ Executed at '+new Date().toLocaleTimeString()}catch(e){this.parentElement.nextElementSibling.textContent='✗ '+e.message}">Run</button>
  </div>
  <div class="sandbox-output">Ready — click Run to execute</div>
  <div class="chat-chip-footer"><button class="chip-btn chip-btn--connect">Connect</button><button class="chip-btn">Reply</button></div>
</div>
</div>`;
}

function renderSettings(spoons: number): string {
  return `<div class="settings-grid">
<div class="glass">
  <h2 class="gradient-text" style="font-size:var(--p31-scale-2xl,1.5rem);margin-bottom:var(--p31-space-lg,1.5rem)">Spoon Level</h2>
  <p style="color:var(--p31-text-secondary,#a1a1aa);font-size:var(--p31-scale-sm,.875rem);margin-bottom:var(--p31-space-md,1rem)">Adjust cognitive load for motion, blur, and sensory density.</p>
  <div style="display:flex;align-items:center;gap:var(--p31-space-xl,2rem);flex-wrap:wrap;min-width:0">
    <div style="display:flex;flex-direction:column;gap:var(--p31-space-xs,.25rem)">
      ${[0,1,2,3,4,5].map(l=>`<button onclick="window.__p31MCPTools.setSpoonLevel(${l})" class="p31-btn--sm chip-btn" style="${l===spoons?'background:rgba(139,92,246,.2);border-color:var(--p31-accent-violet,#8b5cf6);color:var(--p31-accent-violet,#8b5cf6)':''}" data-mcp-tool="setSpoons${l}" data-mcp-type="action">Level ${l}${l===0?' — Crisis':''}${l===5?' — Full':''}</button>`).join('')}
    </div>
    ${renderSpoonMeter(spoons)}
  </div>
</div>
<div class="glass">
  <h2 class="gradient-text" style="font-size:var(--p31-scale-2xl,1.5rem);margin-bottom:var(--p31-space-lg,1.5rem)">K4 Crown</h2>
  <p style="color:var(--p31-text-secondary,#a1a1aa);font-size:var(--p31-scale-sm,.875rem);margin-bottom:var(--p31-space-md,1rem)">Sovereign tetrahedron: 4 vertices, 6 edges, planar geometry.</p>
  ${renderCrown()}
</div>
<div class="glass">
  <h2 class="gradient-text" style="font-size:var(--p31-scale-2xl,1.5rem);margin-bottom:var(--p31-space-lg,1.5rem)">Theme</h2>
  <p style="color:var(--p31-text-secondary,#a1a1aa);font-size:var(--p31-scale-sm,.875rem);margin-bottom:var(--p31-space-md,1rem)">12 themes available. Click to cycle or use the orb.</p>
  <div style="display:flex;gap:var(--p31-space-xs,.25rem);flex-wrap:wrap;min-width:0">
    ${THEMES.map(t=>`<button class="p31-btn--sm chip-btn" onclick="document.documentElement.setAttribute('data-theme','${t}')">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}
  </div>
</div>
<div class="glass">
  <h2 class="gradient-text" style="font-size:var(--p31-scale-2xl,1.5rem);margin-bottom:var(--p31-space-lg,1.5rem)">Diagnostics</h2>
  <pre class="p31-pre">Engine: Cloudflare Worker Edge-Renderer\nProtocol: WebMCP 2026-07-28\nTarget: phos.p31ca.org\nSpoons: ${spoons}/5\nState: The Cage Holds. 863 Hz. K₄ is planar. β₂ = 1.\nSurfaces: ${SURFACES.length}</pre>
</div>
</div>`;
}

function shell(title: string, body: string, spoons: number): string {
  return `<!DOCTYPE html>
<html lang="en" data-spoons="${spoons}" data-theme="phos">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | PHOS</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
${renderCSS()}
</head>
<body>
${renderStarfield()}
${renderNav(spoons)}
<main class="container">${body}</main>
<div id="theme-orb" data-mcp-tool="themeOrb" data-mcp-type="action" title="Cycle theme">🔮</div>
${renderDispatcherScript(spoons)}
</body></html>`;
}

function renderDispatcherScript(spoons: number): string {
  return `<script>
(function(){
  var THEMES=${JSON.stringify(THEMES)};
  var themeIdx=0;
  window.__p31MCPTools={
    setSpoonLevel:function(l){
      var el=document.documentElement;
      el.setAttribute('data-spoons',l);
      localStorage.setItem('p31-spoons',l);
      var ns=document.getElementById('nav-spoons');if(ns)ns.textContent=l;
      var btns=document.querySelectorAll('.shade-spoon');
      btns.forEach(function(b,i){b.classList.toggle('shade-spoon--active',i===l)});
      window.dispatchEvent(new CustomEvent('spoons:changed',{detail:{level:l}}));
    },
    navigate:function(h,e){if(e)window.open(h,'_blank');else window.location.href=h}
  };
  window.__p31MCPExec=function(n,a){var t=window.__p31MCPTools[n];if(t)return t.apply(null,a)};
  var orb=document.getElementById('theme-orb');
  if(orb){orb.addEventListener('click',function(){
    themeIdx=(themeIdx+1)%THEMES.length;
    document.documentElement.setAttribute('data-theme',THEMES[themeIdx]);
    window.dispatchEvent(new CustomEvent('theme:changed',{detail:{theme:THEMES[themeIdx]}}));
  })}
  var ss=localStorage.getItem('p31-spoons');
  if(ss!==null)window.__p31MCPTools.setSpoonLevel(parseInt(ss,10));
  try{
    var _ctx=(typeof document!=='undefined'&&document.modelContext)?document.modelContext:(typeof navigator!=='undefined'&&navigator.modelContext)?navigator.modelContext:null;
    if(_ctx&&_ctx.registerTool){
      _ctx.registerTool({name:'setSpoonLevel',description:'Set spoons 0-5',handler:function(p){window.__p31MCPTools.setSpoonLevel(p.level||p)}});
      _ctx.registerTool({name:'navigate',description:'Navigate',handler:function(p){window.__p31MCPTools.navigate(p.href||p)}});
    }
  }catch(e){}
})();
</script>`;
}

function mulberry32(a: number): () => number {
  return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
}

function renderCRUD(label: string, emoji: string, prefix: string): string {
  return `<div class="glass" data-mcp-tool="${prefix}Surface" data-mcp-state="active">
<h2 class="gradient-text" style="font-size:var(--p31-scale-xl,1.25rem);margin-bottom:var(--p31-space-sm,.5rem)">${emoji} ${label}</h2>
<p style="color:var(--p31-text-secondary,#a1a1aa);font-size:var(--p31-scale-sm,.875rem);margin-bottom:var(--p31-space-md,1rem)">Sovereign tracking for ${label.toLowerCase()}.</p>
<div style="display:flex;gap:8px;margin-bottom:var(--p31-space-lg,1.5rem)">
  <input class="p31-input" data-mcp-tool="${prefix}Input" data-mcp-type="input" data-mcp-target="${prefix}-draft" placeholder="Initialize entry..." />
  <button class="p31-btn" data-mcp-tool="add${capitalize(prefix)}Item" data-mcp-type="action">Commit</button>
</div>
<div data-mcp-tool="${prefix}List" data-mcp-target="${prefix}-list" style="display:flex;flex-direction:column;gap:12px">
  <div style="padding:16px;border-radius:8px;background:var(--p31-glass-bg,rgba(24,24,27,.65));border:1px solid var(--p31-glass-border,rgba(255,255,255,.08));display:flex;justify-content:space-between;align-items:center"><span style="font-family:var(--p31-font-mono,monospace);font-size:var(--p31-scale-sm,.875rem)">Example entry from genesis state.</span><button class="p31-btn--sm p31-btn--danger" data-mcp-tool="delete${capitalize(prefix)}Item" data-mcp-type="action" data-mcp-target="${prefix}-item-sample">Purge</button></div>
</div></div>`;
}

function renderSurfacePage(s: Surface): string {
  if(s.interactionType==='crud') return renderCRUD(s.label,s.emoji,s.id);
  return `<div class="glass" data-mcp-tool="${s.id}Surface" data-mcp-state="active">
<h2 class="gradient-text" style="font-size:var(--p31-scale-xl,1.25rem);margin-bottom:var(--p31-space-sm,.5rem)">${s.emoji} ${s.label}</h2>
<p style="color:var(--p31-text-secondary,#a1a1aa);margin-bottom:var(--p31-space-lg,1.5rem)">${s.description}</p>
<div style="padding:24px;text-align:center;border:1px dashed var(--p31-glass-border,rgba(255,255,255,.08));border-radius:8px"><span data-mcp-tool="${s.id}Status" data-mcp-type="status" data-mcp-state="idle" style="display:inline-block;padding:6px 12px;background:rgba(255,255,255,.05);border-radius:16px;font-size:12px">System: Nominal</span></div>
<div style="margin-top:var(--p31-space-lg,1.5rem);display:flex;gap:12px">
  <button class="p31-btn" data-mcp-tool="${s.id}PrimaryAction" data-mcp-type="action">Execute</button>
  <button class="p31-btn p31-btn--ghost" data-mcp-tool="${s.id}SecondaryAction" data-mcp-type="action">Calibrate</button>
</div></div>`;
}

function capitalize(s: string): string { return s.charAt(0).toUpperCase()+s.slice(1); }

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url=new URL(request.url);
    const path=url.pathname;
    const spoons=parseInt(url.searchParams.get('spoons')||'3',10);
    const h: Record<string,string>={
      'Content-Type':'text/html; charset=utf-8',
      'Cache-Control':'public, max-age=300, s-maxage=600',
      'X-Generator':'p31-phos-worker/2.0',
      'X-Protocol-Version':'2026-07-28'
    };
    try{
      if(path==='/health') return new Response(JSON.stringify({status:'ok',surfaces:SURFACES.length,ts:new Date().toISOString(),version:'2.0'}),{headers:{...h,'Content-Type':'application/json'}});
      if(path==='/chat') return new Response(shell('Chat',`<div class="header-row" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:var(--p31-space-lg,1.5rem);flex-wrap:wrap;min-width:0"><a href="/" class="back-link">← Grid</a><h1 class="gradient-text" style="font-size:var(--p31-scale-3xl,1.875rem);min-width:0">Spatial Chat</h1></div>${renderCrown()}</div>${renderChat()}`,spoons),{headers:h});
      if(path==='/settings') return new Response(shell('Settings',`<div class="header-row" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:var(--p31-space-lg,1.5rem)"><a href="/" class="back-link">← Grid</a><h1 class="gradient-text" style="font-size:var(--p31-scale-3xl,1.875rem);min-width:0">⚙️ Settings</h1></div>${renderSpoonMeter(spoons)}</div>${renderSettings(spoons)}`,spoons),{headers:h});
      if(path.startsWith('/surface/')){
        const id=path.split('/')[2];
        const s=SURFACES.find(x=>x.id===id);
        if(s) return new Response(shell(s.label,`<a href="/" class="back-link">← Return to Grid</a><div style="max-width:800px;margin:0 auto">${renderSurfacePage(s)}</div>`,spoons),{headers:h});
        return new Response(shell('404','<div class="glass"><h2 class="gradient-text" style="font-size:var(--p31-scale-2xl,1.5rem);margin-bottom:var(--p31-space-md,1rem)">Surface not found</h2><p style="color:var(--p31-text-secondary,#a1a1aa)">This surface does not exist in the tetrahedral mesh.</p></div>',spoons),{status:404,headers:h});
      }
      const cards=SURFACES.map(s=>`<a href="/surface/${s.id}" class="glass glass--hover surface-card" data-mcp-tool="${s.id}Card" data-mcp-type="action" data-mcp-target="surface-${s.id}"><h3 style="margin-bottom:8px">${s.emoji} ${s.label}</h3><p style="font-size:var(--p31-scale-sm,.875rem);color:var(--p31-text-secondary,#a1a1aa)">${s.description}</p></a>`).join('');
      return new Response(shell('Home',`<div class="header-row" style="justify-content:space-between"><h1 class="gradient-text" style="font-size:var(--p31-scale-4xl,2.25rem);min-width:0">Sovereign Workspace</h1>${renderCrown()}</div><p style="color:var(--p31-text-secondary,#a1a1aa);margin-bottom:var(--p31-space-md,1rem)">${SURFACES.length} spoon-aware, tokenized, WebMCP-annotated surfaces.</p><div class="grid-layout" data-mcp-tool="phosHome" data-mcp-type="surface">${cards}</div>`,spoons),{headers:h});
    }catch(e:any){return new Response(`Error: ${e.message}`,{status:500,headers:h})}
  }
};
