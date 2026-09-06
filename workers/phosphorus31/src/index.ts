/**
 * phosphorus31.org — Sovereign Landing Page
 *
 * Edge-rendered, tokenized, WebMCP-annotated.
 * Serves the public face of P31 Labs: mission, pillars, sovereign stack, get involved.
 *
 * Design: "Grounded Sanctuary" — warm earth palette, glassmorphism, calm tech.
 * Tokens: 124 CSS custom properties from design-system.json.
 * Annotations: data-mcp-* for agent discoverability.
 * Structured data: JSON-LD for 501(c)(3) nonprofit.
 */

const TOKEN_CSS = `
  --p31-base: 16px;
  --p31-scale-xs: calc(var(--p31-base) * 0.75);
  --p31-scale-sm: var(--p31-base);
  --p31-scale-md: calc(var(--p31-base) * 1.3333);
  --p31-scale-lg: calc(var(--p31-base) * 1.7777);
  --p31-scale-xl: calc(var(--p31-base) * 2.3703);
  --p31-scale-2xl: calc(var(--p31-base) * 3.1604);
  --p31-bg: oklch(15% 0.01 50);
  --p31-surface: oklch(22% 0.03 45);
  --p31-surface2: oklch(26% 0.02 50);
  --p31-accent: oklch(60% 0.08 200);
  --p31-accent-cyan: oklch(60% 0.08 200);
  --p31-accent-violet: oklch(55% 0.07 310);
  --p31-accent-gold: oklch(62% 0.08 40);
  --p31-accent-green: oklch(58% 0.07 125);
  --p31-accent-red: oklch(62% 0.08 20);
  --p31-text-primary: oklch(96% 0.005 85);
  --p31-text-secondary: oklch(80% 0.004 85);
  --p31-text-tertiary: oklch(60% 0.003 85);
  --p31-glass-bg: oklch(100% 0.01 240 / 0.04);
  --p31-glass-border: oklch(100% 0.01 240 / 0.08);
  --p31-glass-border-hover: oklch(100% 0.01 240 / 0.15);
  --p31-glass-shadow: 0 8px 32px rgba(0,0,0,0.15);
  --p31-glow-cyan: 0 0 20px rgba(91,141,141,0.25);
  --p31-blur-standard: 12px;
  --p31-radius-sm: 8px;
  --p31-radius-md: 16px;
  --p31-radius-lg: 24px;
  --p31-radius-xl: 32px;
  --p31-radius-full: 9999px;
  --p31-space-sm: clamp(12px, 1.5vw, 16px);
  --p31-space-md: clamp(16px, 2.5vw, 21px);
  --p31-space-lg: clamp(21px, 3.5vw, 28px);
  --p31-space-xl: clamp(28px, 5vw, 38px);
  --p31-font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --p31-font-mono: ui-monospace, 'SF Mono', 'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
`;

const WEBMCP_TOKEN = 'A5o9byBMcCbjEcoVVn4qktyGM/w8ne3TPRceMBq+2N9zO4WXRyH3DkVAhAinaWiQ5fNjPx0VO7K+JVwd21q36gUAAAB3eyJvcmlnaW4iOiJodHRwczovL3Bob3NwaG9ydXMzMS5vcmc6NDQzIiwiZmVhdHVyZSI6IldlYk1DUCIsImV4cGlyeSI6MTc5NDg3MzYwMCwiaXNTdWJkb21haW4iOnRydWUsImlzVGhpcmRQYXJ0eSI6dHJ1ZX0=';

interface PageContext {
  brand: string;
  spoons: number;
  page: string;
}

// ─── CSS ───────────────────────────────────────────────────────────────────────────────

const CSS = `
:root {
  ${TOKEN_CSS}
  --p31-motion-duration: 200ms;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  background:var(--p31-bg);
  color:var(--p31-text-primary);
  font-family:var(--p31-font-sans);
  line-height:1.6;
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
}
.app{max-width:1200px;margin:0 auto;padding:clamp(16px,4vw,48px)}
.glass{
  background:var(--p31-glass-bg);
  backdrop-filter:blur(var(--p31-blur-standard));
  -webkit-backdrop-filter:blur(var(--p31-blur-standard));
  border:1px solid var(--p31-glass-border);
  border-radius:var(--p31-radius-lg);
  padding:clamp(24px,3vw,48px);
  box-shadow:var(--p31-glass-shadow);
  transition:background var(--p31-motion-duration) ease,border-color var(--p31-motion-duration) ease;
}
.glass:hover{border-color:var(--p31-glass-border-hover)}
.gradient-text{
  background:linear-gradient(135deg,var(--p31-accent-cyan),var(--p31-accent-violet));
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}
h1{font-size:clamp(32px,6vw,56px);font-weight:700;line-height:1.1;margin:0 0 8px 0}
h2{font-size:clamp(24px,4vw,32px);font-weight:600;line-height:1.2;margin:0 0 16px 0;color:var(--p31-text-primary)}
h3{font-size:clamp(18px,2.5vw,22px);font-weight:600;margin:0 0 8px 0}
p{color:var(--p31-text-secondary);max-width:640px;margin:0 0 16px 0;font-size:clamp(14px,1.5vw,16px);line-height:1.7}
p:last-child{margin-bottom:0}
.subtitle{font-size:clamp(16px,1.8vw,20px);color:var(--p31-text-tertiary);max-width:720px}
.badge{
  display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:var(--p31-radius-full);
  background:var(--p31-glass-bg);border:1px solid var(--p31-glass-border);font-size:12px;font-weight:500;
}
.btn-primary{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:12px 32px;
  background:var(--p31-accent-cyan);color:var(--p31-bg);border:none;border-radius:var(--p31-radius-full);
  font-family:inherit;font-size:16px;font-weight:600;cursor:pointer;transition:all 0.2s ease;text-decoration:none;
}
.btn-primary:hover{opacity:0.85;transform:translateY(-2px);box-shadow:0 0 24px rgba(91,141,141,0.3)}
.btn-secondary{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:12px 32px;
  background:transparent;color:var(--p31-text-primary);border:1px solid var(--p31-glass-border);border-radius:var(--p31-radius-full);
  font-family:inherit;font-size:16px;font-weight:500;cursor:pointer;transition:all 0.2s ease;text-decoration:none;
}
.btn-secondary:hover{background:var(--p31-glass-bg);border-color:var(--p31-accent-cyan)}
.grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}
.pillar-card{text-align:left;transition:transform 0.2s ease,box-shadow 0.2s ease}
.pillar-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.15)}
.pillar-icon{font-size:40px;margin-bottom:12px;display:block}
.badge-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.badge-tech{
  display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:var(--p31-radius-full);
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;font-family:var(--p31-font-mono);
  color:var(--p31-text-tertiary);
}
.trust-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px}
.trust-badge{
  display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:var(--p31-radius-full);
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);font-size:12px;color:var(--p31-text-secondary);
}
.link-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}
.link-row a{color:var(--p31-accent-cyan);text-decoration:none;font-weight:500;padding:8px 16px;border-radius:var(--p31-radius-sm);border:1px solid transparent;transition:all 0.2s ease}
.link-row a:hover{border-color:var(--p31-accent-cyan);background:rgba(91,141,141,0.06)}
footer{
  margin-top:64px;padding:32px 0;border-top:1px solid var(--p31-glass-border);
  display:flex;flex-direction:column;gap:16px;align-items:center;text-align:center;
  font-size:12px;color:var(--p31-text-tertiary)
}
footer .footer-links{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
footer .footer-links a{color:var(--p31-text-secondary);text-decoration:none}
footer .footer-links a:hover{color:var(--p31-accent-cyan)}
footer .constants{font-family:var(--p31-font-mono);font-size:11px;opacity:0.6;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
@media (max-width:768px){
  .app{padding:16px}
  .glass{padding:20px}
  .btn-primary,.btn-secondary{width:100%;justify-content:center}
  .grid-2,.grid-3{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){*{animation-duration:0.01ms !important;transition-duration:0.01ms !important}}
`;

// ─── Renderers ──────────────────────────────────────────────────────────────────────────

function renderHero(ctx: PageContext): string {
  const s = ctx.spoons;
  return `
  <header class="glass" style="text-align:center;padding:clamp(32px,5vw,64px);" data-mcp-tool="heroSection" data-mcp-target="hero" data-mcp-state="${s}">
    <div class="trust-row" style="justify-content:center;margin-bottom:16px;">
      <span class="trust-badge" data-mcp-tool="trustBadge" data-mcp-target="badge-nonprofit">⚖️ 501(c)(3)</span>
      <span class="trust-badge" data-mcp-tool="trustBadge" data-mcp-target="badge-open">🔓 Open Source</span>
      <span class="trust-badge" data-mcp-tool="trustBadge" data-mcp-target="badge-neuro">🧠 Made by Neurodivergent Humans</span>
    </div>
    <h1 style="margin-bottom:12px;"><span class="gradient-text">Sovereign technology</span> for neurodivergent families</h1>
    <p class="subtitle" style="margin:0 auto 32px;">P31 Labs builds free, open‑source tools that respect your cognition and your privacy. No tracking. No paywalls. No VC.</p>
    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">
      <a href="#pillars" class="btn-primary" data-mcp-tool="navigate" data-mcp-type="action" data-mcp-target="cta-explore">Explore the Sovereign Stack →</a>
      <a href="#support" class="btn-secondary" data-mcp-tool="navigate" data-mcp-type="action" data-mcp-target="cta-support">Support Our Mission →</a>
    </div>
  </header>
  `;
}

function renderMission(): string {
  return `
  <section class="glass" style="border-left:4px solid var(--p31-accent-cyan);" data-mcp-tool="missionSection" data-mcp-target="mission">
    <h2>Why P31 Labs exists</h2>
    <blockquote style="font-size:clamp(18px,2vw,24px);font-weight:300;color:var(--p31-text-primary);margin:16px 0;padding-left:20px;border-left:3px solid var(--p31-accent-violet);">
      "We build what we needed but couldn't find."
    </blockquote>
    <p style="max-width:800px;">
      Founded by a late‑diagnosed AuDHD parent, P31 Labs creates tools for neurodivergent families—tools that respect cognitive thresholds,
      preserve privacy, and are built to last. Our children, Bash (10) and Willow (6), test everything we make.
    </p>
    <div class="link-row">
      <a href="/about" data-mcp-tool="navLink" data-mcp-type="action" data-mcp-target="link-about">Learn more about our story →</a>
    </div>
  </section>
  `;
}

function renderPillars(): string {
  const pillars = [
    { id: 'phos', icon: '🌿', title: 'PHOS', desc: 'Ambient workspace for focus, flow, and spoon‑aware cognition.', link: '/phos' },
    { id: 'bonding', icon: '🧬', title: 'BONDING', desc: 'Multiplayer chemistry game for parent‑child connection. Build molecules, earn LOVE, document every moment.', link: '/bonding' },
    { id: 'willow', icon: '🌱', title: 'WILLOW', desc: 'Child‑safe companion chat with emotional support and growth tracking.', link: '/willow' },
    { id: 'justice', icon: '⚖️', title: 'Sovereign Justice', desc: 'Online dispute resolution, multi‑sig escrow, and SHA‑256 evidence chain for custody and family law.', link: '/justice' },
  ];
  return `
  <section id="pillars" class="glass" data-mcp-tool="pillarsSection" data-mcp-target="pillars">
    <h2>The Sovereign Stack</h2>
    <p style="max-width:800px;">Four open‑source pillars that work together to create a sovereign, agent‑native ecosystem for neurodivergent families.</p>
    <div class="grid-2" style="margin-top:24px;">
      ${pillars.map(p => `
        <div class="glass pillar-card" data-mcp-tool="pillarCard" data-mcp-target="card-${p.id}" style="padding:24px;cursor:pointer;">
          <span class="pillar-icon">${p.icon}</span>
          <h3>${p.title}</h3>
          <p style="font-size:14px;margin-bottom:12px;">${p.desc}</p>
          <a href="${p.link}" class="btn-secondary" style="min-height:40px;padding:8px 20px;font-size:14px;width:auto;" data-mcp-tool="navigate" data-mcp-type="action" data-mcp-target="pillar-${p.id}">Explore ${p.title} →</a>
        </div>
      `).join('')}
    </div>
  </section>
  `;
}

function renderTechStack(): string {
  const techs = ['WebMCP Origin Trial', 'MCP 2026‑07‑28', 'A2UI v0.9.1', 'DID‑Linked Resources', 'LOVE Soulbound Tokens', 'Edge‑Rendered', 'Post‑Quantum Crypto', 'EigenTrust Reputation'];
  return `
  <section class="glass" style="border-left:4px solid var(--p31-accent-violet);" data-mcp-tool="techSection" data-mcp-target="tech">
    <h2>Built for the Agent‑Native Web</h2>
    <p style="max-width:800px;">Every component is tokenized, annotated, and controllable by AI agents—or by you. No lock‑in, no proprietary data, no hidden costs.</p>
    <div class="badge-grid">
      ${techs.map(t => `<span class="badge-tech" data-mcp-tool="techBadge" data-mcp-target="tech-${t.replace(/\s/g,'-').toLowerCase()}">${t}</span>`).join('')}
    </div>
  </section>
  `;
}

function renderSupport(): string {
  return `
  <section id="support" class="glass" style="border-left:4px solid var(--p31-accent-gold);" data-mcp-tool="supportSection" data-mcp-target="support">
    <h2>Get Involved</h2>
    <p style="max-width:800px;">P31 Labs is funded entirely by community support. Every dollar goes to tools, not VC returns.</p>
    <div class="grid-2" style="margin-top:24px;">
      <div class="glass" style="padding:24px;text-align:center;" data-mcp-tool="supportCard" data-mcp-target="card-donate">
        <h3 style="margin-bottom:4px;">❤️ Donate</h3>
        <p style="font-size:14px;">Ko‑fi, GitHub Sponsors, or direct grant funding.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;">
          <a href="https://ko-fi.com/trimtab69420" class="btn-secondary" style="min-height:40px;padding:8px 20px;font-size:14px;width:auto;" data-mcp-tool="externalLink" data-mcp-type="action" data-mcp-target="link-kofi">Ko‑fi →</a>
          <a href="https://github.com/sponsors/p31labs" class="btn-secondary" style="min-height:40px;padding:8px 20px;font-size:14px;width:auto;" data-mcp-tool="externalLink" data-mcp-type="action" data-mcp-target="link-github-sponsor">GitHub Sponsors →</a>
        </div>
      </div>
      <div class="glass" style="padding:24px;text-align:center;" data-mcp-tool="supportCard" data-mcp-target="card-community">
        <h3 style="margin-bottom:4px;">💬 Join the Community</h3>
        <p style="font-size:14px;">Discord, GitHub, and our research network.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;">
          <a href="https://discord.gg/uYW5rTCuZ" class="btn-secondary" style="min-height:40px;padding:8px 20px;font-size:14px;width:auto;" data-mcp-tool="externalLink" data-mcp-type="action" data-mcp-target="link-discord">Discord →</a>
          <a href="https://github.com/p31labs" class="btn-secondary" style="min-height:40px;padding:8px 20px;font-size:14px;width:auto;" data-mcp-tool="externalLink" data-mcp-type="action" data-mcp-target="link-github">GitHub →</a>
        </div>
      </div>
    </div>
  </section>
  `;
}

function renderFooter(): string {
  return `
  <footer data-mcp-tool="footer" data-mcp-target="footer">
    <div class="footer-links">
      <a href="/about" data-mcp-tool="navLink" data-mcp-type="action" data-mcp-target="footer-about">About</a>
      <a href="/blog" data-mcp-tool="navLink" data-mcp-type="action" data-mcp-target="footer-blog">Blog</a>
      <a href="https://github.com/p31labs" data-mcp-tool="externalLink" data-mcp-type="action" data-mcp-target="footer-github">GitHub</a>
      <a href="https://discord.gg/uYW5rTCuZ" data-mcp-tool="externalLink" data-mcp-type="action" data-mcp-target="footer-discord">Discord</a>
      <a href="/support" data-mcp-tool="navLink" data-mcp-type="action" data-mcp-target="footer-support">Support</a>
    </div>
    <div>
      © 2026 P31 Labs, Inc. · Georgia 501(c)(3) · EIN 42‑1888158
    </div>
    <div class="constants">
      <span>863 Hz</span>
      <span>K₄ planar</span>
      <span>β₂ = 1</span>
    </div>
  </footer>
  `;
}

function renderPage(ctx: PageContext, body: string): string {
  const s = ctx.spoons;
  return `<!DOCTYPE html>
<html lang="en" data-brand="${ctx.brand}" data-spoons="${s}" data-theme="quantum">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>P31 Labs — Sovereign Technology for Neurodivergent Families</title>
  <meta name="description" content="Georgia 501(c)(3) nonprofit building free, open-source, agent-native technology for neurodivergent families. No tracking. No paywalls. No VC." />
  <meta name="theme-color" content="#141210" />
  <meta http-equiv="origin-trial" content="${WEBMCP_TOKEN}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta property="og:title" content="P31 Labs — Sovereign Technology for Neurodivergent Families" />
  <meta property="og:description" content="Free, open-source, agent-native technology for neurodivergent families. No tracking. No paywalls." />
  <meta property="og:image" content="https://phosphorus31.org/og-default.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://phosphorus31.org/" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NGO",
    "name": "P31 Labs, Inc.",
    "url": "https://phosphorus31.org",
    "description": "Georgia 501(c)(3) nonprofit building free, open-source, agent-native technology for neurodivergent families.",
    "nonprofitStatus": "Nonprofit501c3",
    "foundingDate": "2024",
    "taxID": "42-1888158",
    "logo": "https://phosphorus31.org/favicon.svg",
    "sameAs": [
      "https://github.com/p31labs",
      "https://discord.gg/uYW5rTCuZ",
      "https://ko-fi.com/trimtab69420"
    ]
  }
  </script>
  <style>${CSS}</style>
</head>
<body>
  <div class="app" data-mcp-tool="phosphorus31Landing" data-mcp-state="${s}" data-mcp-target="landing-root">
    ${body}
    ${renderFooter()}
  </div>
  <script>
    (function() {
      var spoons = parseInt(document.documentElement.getAttribute('data-spoons') || '3', 10);
    })();
  </script>
</body>
</html>`;
}

// ─── Routes ─────────────────────────────────────────────────────────────────────────────

const PAGES: Record<string, (ctx: PageContext) => string> = {
  '/': (ctx) => renderHero(ctx) + renderMission() + renderPillars() + renderTechStack() + renderSupport(),
};

function clampSpoons(n: number): number {
  return Math.max(0, Math.min(5, Math.round(n)));
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok', version: '3.0.0', pages: Object.keys(PAGES), ts: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (path === '/favicon.svg') {
      return new Response(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="oklch(60% 0.08 200)"/><path d="M30 60 Q50 30 70 60" stroke="#fff" fill="none" stroke-width="4"/><circle cx="50" cy="50" r="3" fill="#fff"/></svg>`, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    if (path === '/robots.txt') {
      return new Response('User-agent: *\nAllow: /\nSitemap: https://phosphorus31.org/sitemap.xml\n', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    if (path === '/llms.txt') {
      return new Response(`# P31 Labs — Sovereign Technology for Neurodivergent Families
Georgia 501(c)(3) nonprofit. EIN 42-1888158.

## Available MCP Endpoints
- federation-bridge: https://federation.p31ca.org (profiles, DID verification, DLR, DIDComm, credentials)
- ledger-bridge: https://ledger-bridge.trimtab-signal.workers.dev (SBT mint, SD-JWT VC issue/verify, PQC)
- p31-design-mcp: https://p31-design-mcp.trimtab-signal.workers.dev (23 tools: setSpoonLevel, etc.)
- bros: https://bros.trimtab-signal.workers.dev (persona switching, signaling)
- dads: https://dads.trimtab-signal.workers.dev (EigenTrust, LOVE minting)
- marketplace-mcp: https://marketplace-mcp.trimtab-signal.workers.dev (10 tools: listings, offers, escrow)
- p31-justice-hub: https://p31-justice-hub.trimtab-signal.workers.dev (evidence, escrow, ODR)

## WebMCP Tools
All pages have data-mcp-* annotations for agent control:
- setSpoonLevel(level) — adjust cognitive load (0-5)
- navigate(href) — navigate between surfaces
- toggleDrawer(state) — open/close drawers

## Data Formats
- JSON-LD (structured data), DID Documents (application/did+json)
- Verifiable Credentials (application/vc+ld+json), SD-JWT (dc+sd-jwt)
- A2UI catalog: /.well-known/a2ui-catalog.json

## Wallet
- Phenix Donation Wallet: self-sovereign credential storage, SD-JWT presentation, ZK proofs
- Stores p31.care, p31.sbt, and p31.identity VCs
- Supports Ed25519 + ML-DSA-65 (post-quantum)

## More Info
- GitHub: https://github.com/p31labs
- Discord: https://discord.gg/uYW5rTCuZ
`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    if (path === '/.well-known/mcp-servers.json') {
      return new Response(JSON.stringify({
        servers: [
          { name: 'p31-design-mcp', url: 'https://p31-design-mcp.trimtab-signal.workers.dev', tools: 23, protocol: '2026-07-28', status: 'production' },
          { name: 'federation-bridge', url: 'https://federation.p31ca.org', tools: 18, protocol: '2026-07-28', status: 'production' },
          { name: 'ledger-bridge', url: 'https://ledger-bridge.trimtab-signal.workers.dev', tools: 8, protocol: '2026-07-28', status: 'production' },
          { name: 'bros', url: 'https://bros.trimtab-signal.workers.dev', tools: 8, protocol: '2026-07-28', status: 'production' },
          { name: 'dads', url: 'https://dads.trimtab-signal.workers.dev', tools: 7, protocol: '2026-07-28', status: 'production' },
          { name: 'marketplace-mcp', url: 'https://marketplace-mcp.trimtab-signal.workers.dev', tools: 10, protocol: '2026-07-28', status: 'production' },
          { name: 'p31-justice-hub', url: 'https://p31-justice-hub.trimtab-signal.workers.dev', tools: 8, protocol: '2026-07-28', status: 'production' },
          { name: 'p31-crypto-mcp', url: 'https://p31-crypto-mcp.trimtab-signal.workers.dev', tools: 12, protocol: '2026-07-28', status: 'production' },
          { name: 'component-registry', url: 'https://p31-component-registry.trimtab-signal.workers.dev', tools: 5, protocol: '2026-07-28', status: 'production' },
          { name: 'phenix-wallet-mcp', url: 'https://phenix-wallet-mcp.trimtab-signal.workers.dev', tools: 9, protocol: '2026-07-28', status: 'production' },
        ],
        total_tools: 108,
        protocol: '2026-07-28',
        updated: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
      });
    }

    if (path === '/.well-known/agents.json') {
      return new Response(JSON.stringify({
        name: 'P31 Labs',
        description: 'Sovereign technology for neurodivergent families. Georgia 501(c)(3) nonprofit.',
        url: 'https://phosphorus31.org',
        version: '3.0.0',
        agent_type: 'multi-agent-orchestration',
        capabilities: ['mcp_server', 'webmcp_annotated_site', 'a2ui_catalog', 'did_identity', 'vc_issuer', 'sbt_minting', 'self_sovereign_wallet', 'donation_wallet'],
        endpoints: {
          mcp: 'https://p31-design-mcp.trimtab-signal.workers.dev',
          a2ui: 'https://render.p31ca.org/a2ui/render',
          did: 'https://federation.p31ca.org/.well-known/did.json',
          dlr: 'https://federation.p31ca.org/resources',
          profiles: 'https://federation.p31ca.org/.well-known/profiles/',
        },
          wallet: {
            name: 'Phenix Donation Wallet',
            description: 'Self-sovereign wallet for storing SD-JWT VCs, presenting credentials, and generating ZK proofs for selective disclosure',
            capabilities: ['sd_jwt_storage', 'credential_presentation', 'zk_proof_generation', 'key_management', 'did_authentication'],
            supported_credential_types: ['p31.care', 'p31.sbt', 'p31.identity'],
            crypto_suites: ['Ed25519', 'ML-DSA-65 (FIPS 204)'],
            mcp_endpoint: 'https://phenix-wallet-mcp.trimtab-signal.workers.dev',
            ui_endpoint: 'https://phenix-wallet.trimtab-signal.workers.dev',
          },
        authentication: ['none', 'did_key', 'x402_usdc'],
        mcp_servers: '/.well-known/mcp-servers.json',
        a2ui_catalog: '/.well-known/a2ui-catalog.json',
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
      });
    }

    if (path === '/sitemap.xml') {
      const urls = Object.keys(PAGES).map(p => `  <url><loc>https://phosphorus31.org${p}</loc><changefreq>weekly</changefreq></url>`).join('\n');
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, {
        headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    const renderer = PAGES[path];
    if (!renderer) {
      const notFound = renderPage({ brand: 'phosphorus31', spoons: 3, page: '/' },
        `<div class="glass"><h1 class="gradient-text">404</h1><p>Page not found.</p><a href="/" class="btn-primary" style="width:auto;margin-top:16px;">Return home →</a></div>`
      );
      return new Response(notFound, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
    }

    const spoonsRaw = url.searchParams.get('spoons');
    const spoons = spoonsRaw ? clampSpoons(parseInt(spoonsRaw, 10)) : 3;
    const ctx: PageContext = { brand: 'phosphorus31', spoons, page: path };
    const body = renderer(ctx);
    const html = renderPage(ctx, body);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'X-Generator': 'p31-phosphorus31-worker/3.0',
        'X-Protocol-Version': '2026-07-28',
        'Origin-Trial': WEBMCP_TOKEN,
      },
    });
  },
};
