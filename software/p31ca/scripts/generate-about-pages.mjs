#!/usr/bin/env node
/**
 * Generates all *-about.html files in public/ from hub/registry.mjs (single source).
 * Run: node scripts/generate-about-pages.mjs
 * Overwrites existing files — idempotent.
 * Alignment: P31 home p31-alignment.json — derivation "hub-landing-data" + verify pipeline (p31ca prebuild).
 * Machine doc: docs/P31-ALIGNMENT-SYSTEM.md
 * One about page per hub card: hub-app-ids.mjs HUB_ALL_CARD_ORDER (must match registry 1:1).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registry } from './hub/registry.mjs';
import { HUB_ALL_CARD_ORDER } from './hub/hub-app-ids.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');

// ─── URL map (about page → launch URL) ─────────────────────────────────────
function getAppUrl(item) {
  const u = item.appUrl;
  if (u.startsWith('http')) return u;
  return u.startsWith('/') ? u : `/${u}`;
}

// Status badges: token-only (see verify:style-alignment) — .badge--{live|research|hardware}
function badgeClass(status) {
  return (
    { live: 'live', research: 'research', hardware: 'hardware' }[status] || 'live'
  );
}

// Category color mapping (aligned with BentoGrid.astro)
const CATEGORY_MAP = {
  'arcade-hub': 'arcade', 'arcade-smallball': 'arcade', 'arcade-gridiron': 'arcade',
  'arcade-strategy': 'arcade', 'arcade-cards': 'arcade', 'arcade-liquid-sculptor': 'arcade',
  'bonding': 'social', 'social-molecules': 'social', 'discord-bot': 'social',
  'poets': 'social', 'book': 'social', 'forge': 'social',
  'ede': 'core', 'spaceship-earth': 'core', 'buffer': 'core', 'content-forge': 'core',
  'geodesic': 'core', 'signal': 'core', 'connect': 'core', 'planetary-onboard': 'core',
  'bridge': 'core', 'sovereign': 'core', 'tether': 'core',
  'cortex': 'infra', 'node-zero': 'infra', 'integrations': 'infra', 'super-centaur': 'infra',
  'alchemy': 'research', 'attractor': 'research', 'axiom': 'research', 'resonance': 'research',
  'tactile': 'utility', 'appointment-tracker': 'utility', 'budget-tracker': 'utility',
  'contact-locker': 'utility', 'echo': 'utility', 'legal-evidence': 'utility',
  'medical-tracker': 'utility', 'prism': 'utility', 'sleep-tracker': 'utility', 'somatic-anchor': 'utility',
};

const CATEGORY_CSS = {
  arcade:    { color: '#10b981', var: '--p31-phosphorus', iconClass: 'icon-arcade' },
  core:      { color: '#8b5cf6', var: '--p31-violet', iconClass: 'icon-core' },
  infra:     { color: '#f59e0b', var: '--p31-amber', iconClass: 'icon-infra' },
  social:    { color: '#3b82f6', var: '--p31-blue', iconClass: 'icon-social' },
  research:  { color: '#f43f5e', var: '--p31-rose', iconClass: 'icon-research' },
  utility:   { color: '#f97316', var: '--p31-orange', iconClass: 'icon-utility' },
};

function getCategory(id, item) {
  return item.category || CATEGORY_MAP[id] || 'core';
}

/** Escape text for double-quoted HTML attributes (meta / Open Graph). */
function escAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const EBC_FOOTER = `<!-- P31:mission-ebc:start -->
<footer id="ebc" class="p31-mission-trio p31-mission-trio--ebc" role="contentinfo" aria-label="Mission — build, create, connect">
  <a class="p31-mission-trio__link p31-mission-trio__link--build p31-mesh-tap" id="ebc-build" href="/build" title="Initial Build — intake, subject scope, verify-gated bake">
    <span class="p31-mission-trio__head">
      <span class="p31-mission-trio__dot" aria-hidden="true"></span>
      <span class="p31-mission-trio__verb">Build</span>
    </span>
    <span class="p31-mission-trio__desc">Intake and bake on the same verify chain—not a decoupled mock.</span>
  </a>
  <a class="p31-mission-trio__link p31-mission-trio__link--create p31-mesh-tap" id="ebc-create" href="/geodesic.html" title="GEODESIC — snap grid, Maxwell rigidity, scene export">
    <span class="p31-mission-trio__head">
      <span class="p31-mission-trio__dot" aria-hidden="true"></span>
      <span class="p31-mission-trio__verb">Create</span>
    </span>
    <span class="p31-mission-trio__desc">One lab surface, honest rigidity—generate or prove; don't fork the same truth twice (ephemeralization).</span>
  </a>
  <a class="p31-mission-trio__link p31-mission-trio__link--connect p31-mesh-tap" id="ebc-connect" href="/mesh" title="Mesh navigator — K₄ cage and product graph">
    <span class="p31-mission-trio__head">
      <span class="p31-mission-trio__dot" aria-hidden="true"></span>
      <span class="p31-mission-trio__verb">Connect</span>
    </span>
    <span class="p31-mission-trio__desc"><span class="p31-mission-trio__now">Now</span> — live cage and edges: mesh, hubs, and money follow the same published contracts (ethical monetization).</span>
  </a>
</footer>
<!-- P31:mission-ebc:end -->`;

// ─── HTML template (Category-colored — aligned with BentoGrid.astro) ─
function renderCertBadges(cert) {
  if (!cert) return '';
  const triper = cert.triper;
  const tetra = cert.tetra;
  if (!triper && !tetra) return '';

  let badges = [];

  // TRIPER letter badges
  if (triper) {
    if (triper.task) badges.push('<span class="cert-badge cert-badge--t" title="Task tests passing">T</span>');
    if (triper.resilience) badges.push('<span class="cert-badge cert-badge--r" title="Resilience tests passing">R</span>');
    if (triper.interface) badges.push('<span class="cert-badge cert-badge--i" title="Interface tests passing">I</span>');
    if (triper.purity) badges.push('<span class="cert-badge cert-badge--p" title="Purity tests passing">P</span>');
    if (triper.e2e) badges.push('<span class="cert-badge cert-badge--e" title="E2E tests passing">E</span>');
    if (triper.regression) badges.push('<span class="cert-badge cert-badge--reg" title="Regression tests passing">R</span>');
  }

  // Tetra level badge
  if (tetra && tetra.level) {
    badges.push(`<span class="cert-badge cert-badge--tetra" title="Tetra-Cert Level ${tetra.level}">L${tetra.level}</span>`);
  }

  return `<div class="cert-badges">${badges.join('')}</div>`;
}

function renderCertScore(cert) {
  if (!cert || !cert.score) return '';
  return `<div class="cert-score">Certification Score: ${cert.score}/100</div>`;
}

function renderAboutPage(item) {
  const appUrl = getAppUrl(item);
  const badgeStatusClass = badgeClass(item.status);
  const category = getCategory(item.id, item);
  const catStyle = CATEGORY_CSS[category] || CATEGORY_CSS.core;
  const nodeCycle = ['', ' coral', ' butter', ''];
  const certBadges = renderCertBadges(item.certification);
  const certScore = renderCertScore(item.certification);
  const featureMeshItems = item.features
    .map(
      (f, i) => `          <div class="mesh-item">
            <span class="mesh-node${nodeCycle[i % nodeCycle.length] || ''}"></span>
            <p class="mesh-item-body">${f}</p>
          </div>`
    )
    .join('\n');
  const howToItems = item.howTo
    .map(
      (s, i) =>
        `          <div class="step"><span class="step-num">${i + 1}</span><span>${s}</span></div>`
    )
    .join('\n');
  const techItems = item.tech.map((t) => `              <li>${t}</li>`).join('\n');
  const relatedItems = (item.related || [])
    .map((r) => {
      const rel = registry.find((x) => x.id === r);
      if (!rel) return '';
      if (rel.status === 'concept' || rel.status === 'draft') return '';
      const relCat = getCategory(r, rel);
      const relStyle = CATEGORY_CSS[relCat] || CATEGORY_CSS.core;
      return `            <a href="/${r}-about.html" class="related-link"><span style="color:${relStyle.color}">${rel.icon}</span> ${rel.title}</a>`;
    })
    .filter(Boolean)
    .join('\n');

  const isExternal = appUrl.startsWith('http');
  const targetAttr = isExternal ? ' target="_blank" rel="noopener"' : '';

  const canonAbout = `https://p31ca.org/${item.id}-about.html`;
  const docTitle = `${item.title} — ${item.tagline} | P31 Labs`;
  const ogHeadline = `${item.title} — ${item.tagline}`;
  const metaDesc = escAttr(item.features[0] ?? '');
  const escDocTitle = escAttr(docTitle);
  const escOgHeadline = escAttr(ogHeadline);

  return `<!DOCTYPE html>
<!-- p31.alignment/1.0.0 — generated by scripts/generate-about-pages.mjs; source registry.mjs; verify hub:ci -->
<html lang="en" data-p31-appearance="hub" style="color-scheme: dark;">
<head>
<meta charset="UTF-8">
<script>(function(){var r=document.documentElement;if(/[?&]alive=1(?:&|$)/.test(location.search))return;r.classList.add("p31-gray-rock");function wake(){r.classList.remove("p31-gray-rock")}document.addEventListener("pointerdown",wake,{once:true,capture:true});document.addEventListener("keydown",wake,{once:true,capture:true})})();</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0f1115">
<title>${escDocTitle}</title>
<meta name="description" content="${metaDesc}">
<link rel="canonical" href="${canonAbout}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escOgHeadline}">
<meta property="og:description" content="${metaDesc}">
<meta property="og:url" content="${canonAbout}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escOgHeadline}">
<meta name="twitter:description" content="${metaDesc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/p31-style.css">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --product-accent:${catStyle.color};
  --category-color:${catStyle.color};
  --font:var(--p31-font-sans);
  --mono:var(--p31-font-mono);
}
html,body{
  min-height:100%;
  background:var(--void);
  color:var(--cloud);
  font-family:var(--font);
  line-height:1.65;
  -webkit-font-smoothing:antialiased;
}
/*
 * Persistent canvas — fixed full-viewport, z=0, never captures pointer events.
 * Matches AppShell.astro exactly.
 */
canvas[data-p31-appshell-canvas] {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  z-index: 0;
  pointer-events: none;
}
/* Content sits above canvas */
.page-wrapper {
  position: relative;
  z-index: 1;
}
a{color:var(--p31-teal);text-decoration:none;transition:color .15s}
a:hover{color:var(--p31-cyan);text-decoration:underline}

.ambient-radial-fixed{
  pointer-events:none;position:fixed;inset:0;z-index:0;
  background:radial-gradient(circle at top left,color-mix(in srgb,var(--category-color) 15%,transparent),transparent 42%);
}

.nav,.hero,.page-body{position:relative;z-index:1}

.nav{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--surface) 92%,transparent);border-bottom:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(12px)}
.nav-inner{max-width:1100px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.nav-brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--cloud)}
.nav-brand:hover{text-decoration:none}
.nav-mark{
  width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:6px;border:1px solid color-mix(in srgb,var(--p31-teal) 40%,transparent);
  background:color-mix(in srgb,var(--p31-teal) 12%,transparent);
  font-family:var(--mono);font-size:11px;font-weight:700;color:var(--p31-cyan);
}
.nav-brand-label{font-family:var(--mono);font-weight:600;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:color-mix(in srgb,var(--cloud) 82%,transparent)}
.nav-links{display:flex;align-items:center;gap:1.35rem;flex-wrap:wrap}
.nav-prompt{font-family:var(--mono);font-size:11px;color:color-mix(in srgb,var(--p31-teal) 50%,transparent)}
.nav-link{font-family:var(--mono);font-size:11px;color:var(--muted);text-decoration:none;transition:color .15s}
.nav-link:hover{color:var(--cloud);text-decoration:none}
.nav-cta{
  font-family:var(--mono);font-size:11px;font-weight:700;
  background:transparent;color:var(--category-color);
  padding:8px 16px;border-radius:6px;
  border:1px solid var(--category-color);
  text-decoration:none;transition:background .18s,color .18s;
}
.nav-cta:hover{background:var(--category-color);color:var(--void);text-decoration:none}

.hero{border-bottom:1px solid var(--border);padding:48px 24px 40px}
.hero-inner{max-width:1100px;margin:0 auto}
.hero-eyebrow{font-family:var(--mono);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
.hero-top{display:flex;align-items:flex-start;gap:20px;margin-bottom:20px;flex-wrap:wrap}
.hero-icon{font-size:48px;line-height:1;flex-shrink:0;color:var(--category-color);text-shadow:0 0 20px color-mix(in srgb,var(--category-color) 40%,transparent)}
.hero-text h1{
  font-size:clamp(1.75rem,3vw + 0.5rem,2.5rem);
  font-weight:700;
  color:var(--cloud);
  font-family:var(--font);
  letter-spacing:-0.02em;
  text-transform:none;
  margin-bottom:8px;
  line-height:1.15;
}
.hero-text .tagline{font-size:1rem;color:color-mix(in srgb,var(--p31-cloud) 78%,transparent);margin-bottom:14px;line-height:1.55}
.hero-badges{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.badge{display:inline-flex;align-items:center;font-family:var(--mono);font-size:10px;font-weight:700;padding:4px 10px;border-radius:9999px;letter-spacing:0.08em;text-transform:uppercase}
.badge--live{background:color-mix(in srgb,var(--p31-phosphorus) 12%,transparent);color:var(--p31-phosphorus);border:1px solid color-mix(in srgb,var(--p31-phosphorus) 30%,transparent)}
.badge--research{background:color-mix(in srgb,var(--p31-cyan) 12%,transparent);color:var(--p31-cyan);border:1px solid color-mix(in srgb,var(--p31-cyan) 30%,transparent)}
.badge--hardware{background:color-mix(in srgb,var(--p31-butter) 12%,transparent);color:var(--p31-butter);border:1px solid color-mix(in srgb,var(--p31-butter) 30%,transparent)}
.badge--muted-tech{background:color-mix(in srgb,var(--p31-cloud) 4%,transparent);color:var(--p31-muted);border:1px solid var(--p31-border-subtle)}
.badge--category{background:color-mix(in srgb,var(--category-color) 15%,transparent);color:var(--category-color);border:1px solid color-mix(in srgb,var(--category-color) 35%,transparent)}
/* TRIPER/Tetra Certification Badges */
.badge--triper{background:color-mix(in srgb,#8b5cf6 15%,transparent);color:#a78bfa;border:1px solid color-mix(in srgb,#8b5cf6 35%,transparent)}
.badge--tetra{background:color-mix(in srgb,#f59e0b 15%,transparent);color:#fbbf24;border:1px solid color-mix(in srgb,#f59e0b 35%,transparent)}
.badge--certified{background:color-mix(in srgb,#10b981 15%,transparent);color:#34d399;border:1px solid color-mix(in srgb,#10b981 35%,transparent)}
.cert-badges{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.cert-badge{display:inline-flex;align-items:center;gap:4px;font-family:var(--mono);font-size:9px;font-weight:600;padding:3px 8px;border-radius:4px;letter-spacing:0.05em;text-transform:uppercase;background:rgba(15,17,21,0.8);border:1px solid rgba(139,92,246,0.3);color:#c4b5fd}
.cert-badge--t{border-color:rgba(59,130,246,0.4);color:#60a5fa}
.cert-badge--r{border-color:rgba(16,185,129,0.4);color:#34d399}
.cert-badge--i{border-color:rgba(245,158,11,0.4);color:#fbbf24}
.cert-badge--p{border-color:rgba(236,72,153,0.4);color:#f472b6}
.cert-badge--e{border-color:rgba(6,182,212,0.4);color:#22d3ee}
.cert-badge--reg{border-color:rgba(168,85,247,0.4);color:#c084fc}
.cert-score{font-family:var(--mono);font-size:11px;font-weight:700;color:#fbbf24;margin-top:8px;padding:6px 10px;background:rgba(245,158,11,0.1);border-radius:4px;border:1px solid rgba(245,158,11,0.2)}
.hero-cta{margin-top:24px;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.cta-btn{
  display:inline-block;background:var(--category-color);color:var(--void);border:1px solid var(--category-color);
  font-family:var(--mono);font-weight:700;font-size:13px;letter-spacing:0.05em;padding:13px 28px;border-radius:6px;text-decoration:none;
  transition:background .18s,color .18s,border-color .18s,box-shadow .18s;
}
.cta-btn:hover{background:transparent;color:var(--category-color);text-decoration:none;box-shadow:0 0 15px color-mix(in srgb,var(--category-color) 30%,transparent)}
.cta-secondary{font-family:var(--mono);font-size:12px;color:var(--muted);text-decoration:none;transition:color .15s;border-bottom:1px solid transparent;padding-bottom:2px}
.cta-secondary:hover{color:var(--cloud);border-bottom-color:color-mix(in srgb,var(--p31-teal) 40%,transparent);text-decoration:none}

.page-body{max-width:1100px;margin:0 auto;padding:44px 24px 64px;display:grid;grid-template-columns:1fr 320px;gap:40px;align-items:start}
@media(max-width:900px){.page-body{grid-template-columns:1fr;gap:32px;padding-bottom:48px}}

.main-col section{margin-bottom:36px}

.sec-head{display:flex;align-items:center;gap:14px;margin-bottom:16px}
.sec-rule{flex:1;height:1px;background:rgba(255,255,255,0.06)}
.sec-kicker{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:color-mix(in srgb,var(--muted) 95%,transparent);white-space:nowrap;margin:0}

p{font-size:15px;color:color-mix(in srgb,var(--p31-cloud) 88%,transparent);margin-bottom:14px;line-height:1.72}

.mesh-list{position:relative;padding-left:1.35rem}
.mesh-list::before{
  content:'';position:absolute;left:0.42rem;top:0.35rem;bottom:0.6rem;width:1px;
  background:linear-gradient(to bottom,var(--category-color),color-mix(in srgb,var(--category-color) 10%,transparent));
}
.mesh-item{position:relative;margin-bottom:1.35rem}
.mesh-item:last-child{margin-bottom:0}
.mesh-node{
  position:absolute;left:-1.35rem;top:0.25rem;width:11px;height:11px;background:var(--void);
  border:2px solid var(--category-color);border-radius:50%;transition:background .18s,box-shadow .18s;
}
.mesh-item:hover .mesh-node{background:var(--category-color);box-shadow:0 0 12px color-mix(in srgb,var(--category-color) 60%,transparent)}
.mesh-node.coral{border-color:color-mix(in srgb,var(--p31-coral) 70%,var(--category-color))}
.mesh-item:hover .mesh-node.coral{background:color-mix(in srgb,var(--p31-coral) 70%,var(--category-color));box-shadow:0 0 12px color-mix(in srgb,var(--p31-coral) 50%,transparent)}
.mesh-node.butter{border-color:color-mix(in srgb,var(--p31-butter) 70%,var(--category-color))}
.mesh-item:hover .mesh-node.butter{background:color-mix(in srgb,var(--p31-butter) 70%,var(--category-color));box-shadow:0 0 12px color-mix(in srgb,var(--p31-butter) 50%,transparent)}
.mesh-item-body{font-size:15px;color:color-mix(in srgb,var(--p31-cloud) 86%,transparent);line-height:1.72;margin:0}

.step{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px}
.step-num{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--category-color);border:1px solid color-mix(in srgb,var(--category-color) 35%,transparent);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;background:color-mix(in srgb,var(--category-color) 12%,transparent)}
.step span:last-child{font-size:15px;color:color-mix(in srgb,var(--p31-cloud) 86%,transparent);line-height:1.68}
.tech-note{font-size:13px;color:color-mix(in srgb,var(--p31-cloud) 65%,transparent);background:rgba(22,25,32,0.55);backdrop-filter:blur(8px);border:1px solid var(--border);border-left:3px solid var(--category-color);border-radius:0 10px 10px 0;padding:14px 16px;line-height:1.68}

.sidebar{position:sticky;top:88px;display:flex;flex-direction:column;gap:18px}
.sidebar-card{
  background:rgba(22,25,32,0.6);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,0.05);border-top:2px solid var(--category-color);
  border-radius:12px;padding:18px;
  box-shadow:0 8px 28px -8px rgba(0,0,0,0.45);
}
.sidebar-card-title{font-family:var(--mono);font-size:9px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:var(--muted);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06)}
.tech-stack{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
.tech-stack li{font-family:var(--mono);font-size:11px;color:var(--category-color);display:flex;align-items:center;gap:8px}
.tech-stack li::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--category-color);flex-shrink:0}
.sidebar-link{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:12px;color:var(--muted);text-decoration:none;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);transition:color .15s}
.sidebar-link:hover{color:var(--cloud);border-bottom-color:rgba(77,184,168,0.25);text-decoration:none}
.related-link{display:block;font-size:14px;color:color-mix(in srgb,var(--p31-cloud) 72%,transparent);text-decoration:none;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
.related-link:last-child{border-bottom:none}
.related-link:hover{color:var(--cloud);text-decoration:none}

.callout-p31{font-size:13px;color:color-mix(in srgb,var(--p31-cloud) 80%,transparent);border-left:3px solid var(--category-color);padding:14px 16px;margin:28px 0 0;background:color-mix(in srgb,var(--category-color) 12%,transparent);border-radius:0 12px 12px 0;line-height:1.68}
.callout-p31 a{color:var(--p31-teal)}

.mini-footer{margin-top:40px;padding-top:22px;border-top:1px solid var(--border);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:11px;font-family:var(--mono);color:var(--muted)}
.mini-footer a{color:var(--muted);text-decoration:none}
.mini-footer a:hover{color:var(--cloud)}
.footer-links{display:flex;gap:18px;flex-wrap:wrap}
</style>
</head>
<body>
<!-- Persistent starfield canvas (matches AppShell.astro exactly) -->
<canvas data-p31-appshell-canvas aria-hidden="true"></canvas>

<div class="page-wrapper">
<div class="ambient-radial-fixed" aria-hidden="true"></div>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-brand" title="P31 Labs hub">
      <span class="nav-mark" aria-hidden="true">P31</span>
      <span class="nav-brand-label">P31 Labs</span>
    </a>
    <div class="nav-links">
      <span class="nav-prompt" aria-hidden="true">..</span>
      <a href="/" class="nav-link">Hub</a>
      <a href="https://github.com/p31labs/andromeda" target="_blank" rel="noopener" class="nav-link">GitHub</a>
      <a href="${appUrl}" class="nav-cta"${targetAttr}>Launch &#8212; ${item.title}</a>
    </div>
  </div>
</nav>

<div class="hero">
  <div class="hero-inner">
    <div class="hero-eyebrow">${item.statusLabel} · Product</div>
    <div class="hero-top">
      <div class="hero-icon">${item.icon}</div>
      <div class="hero-text">
        <h1>${item.title}</h1>
        <div class="tagline">${item.tagline}</div>
        <div class="hero-badges">
          <span class="badge badge--${badgeStatusClass}">${item.statusLabel}</span>
          <span class="badge badge--category">${category}</span>
          ${item.tech.slice(0, 3).map((t) => `<span class="badge badge--muted-tech">${t}</span>`).join('')}
        </div>
        ${certBadges}
        ${certScore}
      </div>
    </div>
    <div class="hero-cta">
      <a href="${appUrl}" class="cta-btn"${targetAttr}>&#x2B21; Launch ${item.title}</a>
      <a href="/" class="cta-secondary">&larr; Back to Hub</a>
    </div>
  </div>
</div>

<div class="page-body">
  <div class="main-col">

    <section>
      <div class="sec-head">
        <span class="sec-rule" aria-hidden="true"></span>
        <h2 class="sec-kicker">What it is</h2>
        <span class="sec-rule" aria-hidden="true"></span>
      </div>
      <p>${item.features[0]}. ${item.tagline} is a core component of the P31 Labs sovereign cognitive infrastructure stack — built to run offline, deployed to the edge, and designed without dark patterns.</p>
      <p>${item.techNotes}</p>
    </section>

    <section>
      <div class="sec-head">
        <span class="sec-rule" aria-hidden="true"></span>
        <h2 class="sec-kicker">Core features</h2>
        <span class="sec-rule" aria-hidden="true"></span>
      </div>
      <div class="mesh-list">
${featureMeshItems}
      </div>
    </section>

    <section>
      <div class="sec-head">
        <span class="sec-rule" aria-hidden="true"></span>
        <h2 class="sec-kicker">How to use</h2>
        <span class="sec-rule" aria-hidden="true"></span>
      </div>
${howToItems}
    </section>

    <section>
      <div class="sec-head">
        <span class="sec-rule" aria-hidden="true"></span>
        <h2 class="sec-kicker">Architecture</h2>
        <span class="sec-rule" aria-hidden="true"></span>
      </div>
      <div class="tech-note">${item.techNotes}</div>
    </section>

    <div class="callout-p31">
      <strong>P31 Labs, Inc.</strong> (Georgia nonprofit, EIN 42-1888158) builds open tools for cognitive sovereignty, communication clarity, and family coordination. This page is technical documentation, not medical or legal advice. Mission and support: <a href="https://phosphorus31.org" target="_blank" rel="noopener">phosphorus31.org</a>.
    </div>

    <div style="margin-top:28px;display:flex;gap:14px;flex-wrap:wrap;align-items:center">
      <a href="${appUrl}" class="cta-btn"${targetAttr}>&#x2B21; Launch ${item.title}</a>
      <a href="/" class="cta-secondary">&larr; Back to Hub</a>
    </div>

    <div class="mini-footer">
      <span>P31 Labs · ${item.title}</span>
      <div class="footer-links">
        <a href="/">Hub</a>
        <a href="${appUrl}"${targetAttr}>${item.title}</a>
        <a href="https://phosphorus31.org/donate" target="_blank" rel="noopener">Support</a>
        <a href="https://github.com/p31labs/andromeda" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>
  </div>

  <aside class="sidebar">
    <div class="sidebar-card">
      <div class="sidebar-card-title">Status</div>
      <span class="badge badge--${badgeStatusClass}">${item.statusLabel}</span>
      <p style="margin-top:12px;font-size:13px;color:color-mix(in srgb,var(--muted) 95%,transparent);line-height:1.55">Deployed on P31 Labs infrastructure · EIN 42-1888158.</p>
    </div>

    ${item.certification ? `<div class="sidebar-card">
      <div class="sidebar-card-title">TRIPER Certification</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        ${item.certification.triper?.task ? '<span class="cert-badge cert-badge--t">T</span>' : ''}
        ${item.certification.triper?.resilience ? '<span class="cert-badge cert-badge--r">R</span>' : ''}
        ${item.certification.triper?.interface ? '<span class="cert-badge cert-badge--i">I</span>' : ''}
        ${item.certification.triper?.purity ? '<span class="cert-badge cert-badge--p">P</span>' : ''}
        ${item.certification.triper?.e2e ? '<span class="cert-badge cert-badge--e">E</span>' : ''}
        ${item.certification.triper?.regression ? '<span class="cert-badge cert-badge--reg">R</span>' : ''}
      </div>
      ${item.certification.tetra?.level ? `<div style="font-family:var(--mono);font-size:10px;color:#fbbf24;margin-bottom:6px">Tetra Level: ${item.certification.tetra.level}/4</div>` : ''}
      ${item.certification.score ? `<div style="font-family:var(--mono);font-size:11px;font-weight:700;color:var(--p31-cloud)">Score: ${item.certification.score}/100</div>` : ''}
    </div>` : ''}

    <div class="sidebar-card">
      <div class="sidebar-card-title">Tech stack</div>
      <ul class="tech-stack">
${techItems}
      </ul>
    </div>

    <div class="sidebar-card">
      <div class="sidebar-card-title">Links</div>
      <a href="${appUrl}" class="sidebar-link"${targetAttr}>&#x2B21; Launch application</a>
      <a href="https://github.com/p31labs/andromeda" target="_blank" rel="noopener" class="sidebar-link">Source code</a>
      <a href="https://phosphorus31.org" target="_blank" rel="noopener" class="sidebar-link">phosphorus31.org</a>
      <a href="https://phosphorus31.org/donate" target="_blank" rel="noopener" class="sidebar-link">Support P31 Labs</a>
    </div>

    ${(item.related || []).length ? `<div class="sidebar-card">
      <div class="sidebar-card-title">Related</div>
${relatedItems}
    </div>` : ''}
  </aside>
</div>

</div><!-- /page-wrapper -->

${EBC_FOOTER}

<!-- Starfield initialization (matches AppShell.astro) -->
<script type="module">
import { startStarfield, setStarfieldRoute } from '/lib/starfield-singleton.js';
const canvas = document.querySelector('canvas[data-p31-appshell-canvas]');
if (canvas) {
  startStarfield(canvas);
  setStarfieldRoute('${item.id}');
}
</script>
</body>
</html>`;
}

// ─── Main — one *-about.html per hub card id (same order as hub-landing + registry) ──
const byId = new Map(registry.map((r) => [r.id, r]));
const regIds = new Set(registry.map((r) => r.id));
const expected = new Set(HUB_ALL_CARD_ORDER);
for (const id of regIds) {
  if (!expected.has(id)) {
    throw new Error(
      `registry has "${id}" but not in hub-app-ids.mjs HUB_ALL_CARD_ORDER — add card or remove registry entry`
    );
  }
}
for (const id of expected) {
  if (!regIds.has(id)) {
    throw new Error(
      `hub-app-ids.mjs lists "${id}" but missing in registry.mjs — add registry entry or remove from hub-app-ids`
    );
  }
}

let written = 0, skipped = 0;
for (const id of HUB_ALL_CARD_ORDER) {
  const item = byId.get(id);
  // Skip concept/draft products — no about page for archived items
  if (item.status === 'concept' || item.status === 'draft') {
    console.log(`⏭️  ${id}-about.html (skipped — ${item.status})`);
    continue;
  }
  const outPath = path.join(PUBLIC, `${id}-about.html`);
  const html = renderAboutPage(item);
  fs.writeFileSync(outPath, html, 'utf8');
  written++;
  console.log(`✅ ${id}-about.html`);
}
console.log(`\nDone: ${written} written, ${skipped} skipped.`);
