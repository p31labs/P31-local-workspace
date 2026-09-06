#!/usr/bin/env python3
"""Build the phosphorus31.org sovereign index.html"""

html = r'''<!DOCTYPE html>
<html lang="en" data-spoons="3" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>P31 Labs | Sovereign Care for Neurodivergent Families</title>
  <meta name="description" content="Georgia 501(c)(3) nonprofit building free, open-source assistive technology for neurodivergent families." />
  <meta name="theme-color" content="#0A0A0F" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta property="og:title" content="P31 Labs | Sovereign Care for Neurodivergent Families" />
  <meta property="og:description" content="Georgia 501(c)(3) nonprofit building free, open-source assistive technology for neurodivergent families." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://phosphorus31.org/" />
  <meta property="og:image" content="https://phosphorus31.org/og-default.png" />
  <meta property="og:site_name" content="P31 Labs" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="P31 Labs | Sovereign Care for Neurodivergent Families" />
  <meta name="twitter:description" content="Georgia 501(c)(3) nonprofit building free, open-source assistive technology for neurodivergent families." />
  <meta name="twitter:image" content="https://phosphorus31.org/og-default.png" />
  <meta name="robots" content="index, follow" />
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"NGO","name":"P31 Labs, Inc.","legalName":"P31 Labs, Inc.","url":"https://phosphorus31.org","logo":"https://phosphorus31.org/favicon.svg","description":"Georgia 501(c)(3) nonprofit building free, open-source assistive technology for neurodivergent families.","nonprofitStatus":"Nonprofit501c3","foundingDate":"2024","address":{"@type":"PostalAddress","addressRegion":"GA","addressCountry":"US"},"sameAs":["https://github.com/p31labs","https://ko-fi.com/trimtab69420","https://discord.gg/uYW5rTCuZ"],"taxID":"42-1888158"}
  </script>
  <style>
    :root {
      --bg: #0A0A0F;
      --surface: #12121A;
      --surface2: #1C1C2A;
      --accent: #00F0FF;
      --accent-violet: #A78BFA;
      --accent-gold: #FBBF24;
      --accent-green: #34D399;
      --accent-red: #FB7185;
      --accent-iris: #818CF8;
      --text: #F5F5F7;
      --text-secondary: rgba(245,245,247,0.6);
      --text-tertiary: rgba(245,245,247,0.3);
      --glass-bg: rgba(255,255,255,0.04);
      --glass-border: rgba(255,255,255,0.08);
      --glass-border-hover: rgba(255,255,255,0.15);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 24px;
      --radius-full: 9999px;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      --font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'JetBrains Mono', monospace;
    }
    html[data-theme="light"] {
      --bg: #F8FAFC;
      --surface: #FFFFFF;
      --surface2: #F1F5F9;
      --text: #0F172A;
      --text-secondary: rgba(15,23,42,0.6);
      --text-tertiary: rgba(15,23,42,0.3);
      --glass-bg: rgba(0,0,0,0.03);
      --glass-border: rgba(0,0,0,0.08);
      --glass-border-hover: rgba(0,0,0,0.15);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    body { font-family: var(--font-sans); background: var(--bg); color: var(--text-secondary); line-height: 1.7; min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    h1, h2, h3, h4, h5, h6 { color: var(--text); font-weight: 700; }
    code, pre, .font-mono { font-family: var(--font-mono); }

    .skip-link { position: fixed; top: -100%; left: 0; z-index: 9999; padding: 0.75rem 1.5rem; background: var(--accent); color: #0A0A0F; font-family: var(--font-mono); font-size: 0.875rem; font-weight: 600; text-decoration: none; border-radius: 0 0 8px 0; }
    .skip-link:focus { top: 0; }

    .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: var(--radius-xl); transition: border-color 0.3s ease, box-shadow 0.3s ease; }
    .glass-panel:hover { border-color: var(--glass-border-hover); }
    .glass-card { background: var(--glass-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 1.5rem; transition: border-color 0.3s ease, background 0.3s ease, transform 0.3s ease; }
    .glass-card:hover { border-color: var(--glass-border-hover); transform: translateY(-2px); }
    .glass-strong { background: rgba(5,5,8,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--glass-border); }
    html[data-theme="light"] .glass-strong { background: rgba(255,255,255,0.92); }
    .glass-subtle { background: var(--glass-bg); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid var(--glass-border); }
    .link-glow { transition: color 0.2s ease; }
    .link-glow:hover { color: var(--accent); text-decoration: underline; }

    #starfield { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }

    .top-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem; height: 44px; }
    .logo { font-family: var(--font-mono); font-weight: 800; font-size: 1rem; color: var(--accent); text-decoration: none; letter-spacing: 0.05em; }
    .logo:hover { text-decoration: none; }
    .nav-links { display: flex; gap: 0.25rem; align-items: center; flex-wrap: wrap; }
    .nav-links a { color: var(--text-secondary); font-size: 0.75rem; font-weight: 500; padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); text-decoration: none; transition: color 0.2s, background 0.2s; white-space: nowrap; }
    .nav-links a:hover, .nav-links a.active { color: var(--accent); background: var(--glass-bg); text-decoration: none; }

    .tetra-nav { position: fixed; top: 44px; left: 0; right: 0; z-index: 49; display: flex; justify-content: center; gap: 0.333rem; padding: 4px 16px; background: var(--glass-bg); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-bottom: 1px solid var(--glass-border); }
    .tetra-nav a { text-decoration: none; flex: 0 0 auto; padding: 2px 12px; font-size: 10px; font-family: var(--font-mono); border-radius: 4px; transition: all 0.2s; letter-spacing: 0.05em; }
    .tetra-nav a:nth-child(1) { color: var(--accent); }
    .tetra-nav a:nth-child(2) { color: var(--accent-violet); }
    .tetra-nav a:nth-child(3) { color: var(--accent-gold); }
    .tetra-nav a:nth-child(4) { color: var(--accent-green); }
    .tetra-nav a:hover, .tetra-nav a.active { background: var(--glass-bg); text-decoration: none; }

    #theme-toggle { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text); cursor: pointer; font-size: 1rem; width: 32px; height: 32px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; transition: border-color 0.3s; flex-shrink: 0; }
    #theme-toggle:hover { border-color: var(--glass-border-hover); }

    #main-content { flex: 1; padding-top: calc(44px + 28px); position: relative; z-index: 10; }
    .page { display: none; }
    .page.active { display: block; }

    .section { padding: 5rem 1.5rem; }
    .container { max-width: 72rem; margin: 0 auto; }
    .section-title { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .section-desc { color: var(--text-secondary); margin-bottom: 2.5rem; max-width: 42rem; }
    @media (min-width: 768px) { .section-title { font-size: 2.25rem; } .section { padding: 7rem 1.5rem; } }

    .grid-2 { display: grid; gap: 1rem; }
    .grid-3 { display: grid; gap: 1rem; }
    .grid-4 { display: grid; gap: 1rem; }
    @media (min-width: 768px) { .grid-2 { grid-template-columns: repeat(2,1fr); } .grid-4 { grid-template-columns: repeat(4,1fr); } }
    @media (min-width: 1024px) { .grid-3 { grid-template-columns: repeat(3,1fr); } }

    .tetra-grid { display: grid; gap: 0.333rem; }
    @media (min-width: 768px) { .tetra-grid { grid-template-columns: repeat(4,1fr); } }
    @media (max-width: 767px) { .tetra-grid { grid-template-columns: repeat(2,1fr); } }

    .hero-feather { position: relative; isolation: isolate; text-align: center; padding: 3rem 1.5rem 2rem; margin: -2rem -1.5rem 0; }
    .hero-feather::before { content: ""; position: absolute; inset: -10% -5%; z-index: -1; background: radial-gradient(120% 100% at 50% 30%, rgba(0,240,255,0.05) 0%, transparent 55%), radial-gradient(130% 120% at 50% 35%, rgba(5,5,8,0.6) 0%, rgba(5,5,8,0.28) 45%, transparent 80%); -webkit-mask-image: radial-gradient(115% 115% at 50% 40%, #000 55%, transparent 100%); mask-image: radial-gradient(115% 115% at 50% 40%, #000 55%, transparent 100%); pointer-events: none; }
    .hero-title { font-size: 2.25rem; line-height: 1.15; margin-bottom: 1rem; font-weight: 800; }
    .hero-shimmer { background: linear-gradient(to right, #00F0FF, #A78BFA, #818CF8); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: textShimmer 6s ease-in-out infinite; }
    @media (min-width: 768px) { .hero-title { font-size: 3.75rem; } }

    .stat-number { font-family: var(--font-mono); font-weight: 800; font-size: 2rem; line-height: 1; background: linear-gradient(135deg, #00F0FF, #A78BFA); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    @media (min-width: 768px) { .stat-number { font-size: 2.25rem; } }

    .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: var(--radius-full); font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
    .status-badge-live { background: rgba(52,211,153,0.15); color: #34D399; border: 1px solid rgba(52,211,153,0.25); }
    .status-badge-beta { background: rgba(0,240,255,0.15); color: #00F0FF; border: 1px solid rgba(0,240,255,0.25); }
    .status-badge-research { background: rgba(167,139,250,0.15); color: #A78BFA; border: 1px solid rgba(167,139,250,0.25); }

    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 2rem; border-radius: var(--radius-full); background: var(--accent); color: #0A0A0F; font-weight: 600; font-size: 0.875rem; text-decoration: none; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.2s; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); text-decoration: none; }
    .btn-secondary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 2rem; border-radius: var(--radius-full); background: var(--accent-violet); color: #fff; font-weight: 600; font-size: 0.875rem; text-decoration: none; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.2s; }
    .btn-secondary:hover { opacity: 0.9; transform: translateY(-1px); text-decoration: none; }
    .btn-ghost { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 2rem; border-radius: var(--radius-full); background: transparent; color: var(--text-secondary); font-weight: 600; font-size: 0.875rem; text-decoration: none; border: 1px solid var(--glass-border); cursor: pointer; transition: border-color 0.2s, color 0.2s; }
    .btn-ghost:hover { border-color: var(--glass-border-hover); color: var(--text); text-decoration: none; }

    @keyframes textShimmer { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes edgePulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
    @keyframes vertexGlow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.5); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .animate-pulse { animation: pulse 2s ease-in-out infinite; }

    .site-footer { position: relative; z-index: 10; margin-top: 6rem; padding: 4rem 1.5rem; background: var(--glass-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 2px solid var(--accent-violet); }
    .footer-grid { display: grid; gap: 3rem; max-width: 72rem; margin: 0 auto; }
    @media (min-width: 768px) { .footer-grid { grid-template-columns: 2fr 1fr 1fr; } }

    .spoon-meter { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; background: var(--glass-bg); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-top: 1px solid var(--glass-border); padding: 4px 1rem; display: flex; align-items: center; gap: 0.5rem; font-size: 10px; font-family: var(--font-mono); color: var(--text-tertiary); }
    .spoon-track { display: flex; gap: 3px; flex: 1; max-width: 200px; }
    .spoon-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-tertiary); cursor: pointer; transition: background 0.2s; }
    .spoon-dot.filled { background: var(--accent-violet); }
    .spoon-dot:hover { background: var(--accent); }

    .honest-label { font-size: 10px; font-family: var(--font-mono); color: var(--text-tertiary); border: 1px solid rgba(255,255,255,0.04); border-radius: var(--radius-lg); padding: 0.75rem 1rem; line-height: 1.5; text-align: center; }

    .text-center { text-align: center; }
    .accent-cyan { color: var(--accent); }
    .accent-violet { color: var(--accent-violet); }
    .accent-gold { color: var(--accent-gold); }
    .accent-green { color: var(--accent-green); }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .space-y-6 > * + * { margin-top: 1.5rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-5 { padding: 1.25rem; }
    .p-6 { padding: 1.5rem; }
    .p-8 { padding: 2rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
    .px-8 { padding-left: 2rem; padding-right: 2rem; }
    .py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mb-10 { margin-bottom: 2.5rem; }
    .mb-12 { margin-bottom: 3rem; }
    .mb-16 { margin-bottom: 4rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-8 { margin-top: 2rem; }
    .mt-12 { margin-top: 3rem; }
    .max-w-2xl { max-width: 42rem; }
    .max-w-3xl { max-width: 48rem; }
    .max-w-5xl { max-width: 64rem; }
    .max-w-6xl { max-width: 72rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .relative { position: relative; }
    .z-10 { z-index: 10; }
    .flex-1 { flex: 1; }
    .flex-shrink-0 { flex-shrink: 0; }
    .rounded-full { border-radius: var(--radius-full); }
    .rounded-xl { border-radius: var(--radius-lg); }
    .rounded-2xl { border-radius: var(--radius-xl); }
    .inline-block { display: inline-block; }
    .inline-flex { display: inline-flex; }
    .hidden { display: none; }
    @media (min-width: 768px) { .md\:flex { display: flex; } }
    .overflow-hidden { overflow: hidden; }
    .overflow-x-auto { overflow-x: auto; }
    .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .step-circle { width: 40px; height: 40px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; }

    @media (max-width: 767px) { .nav-links a { font-size: 0.65rem; padding: 0.15rem 0.4rem; } .tetra-nav { overflow-x: auto; justify-content: flex-start; } .top-nav { padding: 0 0.75rem; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
    html[data-spoons="0"] *, html[data-spoons="1"] *, html[data-spoons="0"] *::before, html[data-spoons="1"] *::before, html[data-spoons="0"] *::after, html[data-spoons="1"] *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <canvas id="starfield" aria-hidden="true"></canvas>

  <nav class="top-nav glass-strong" role="navigation" aria-label="Main navigation">
    <a href="/" class="logo">P31 Labs</a>
    <div class="nav-links">
      <a data-route="/">Home</a>
      <a data-route="/about">About</a>
      <a data-route="/impact">Impact</a>
      <a data-route="/products">Products</a>
      <a data-route="/research">Research</a>
      <a data-route="/blog">Blog</a>
      <a data-route="/get-involved">Get Involved</a>
    </div>
    <button id="theme-toggle" aria-label="Toggle theme" title="Toggle theme">🌙</button>
  </nav>

  <nav class="tetra-nav" role="navigation" aria-label="Tetrahedral navigation">
    <a data-route="/quantum">◈ Quantum</a>
    <a data-route="/care">◈ Care</a>
    <a data-route="/research">◈ Research</a>
    <a data-route="/impact">◈ Impact</a>
  </nav>
'''

# We'll build this file in parts for efficiency
with open('/home/p31/P31-local-workspace/apps/phosphorus31/index.html', 'w') as f:
    f.write(html)

print("Part 1 written OK")
