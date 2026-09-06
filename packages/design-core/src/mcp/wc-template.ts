/**
 * @file Pure Web Component template generator — Worker-safe.
 *
 * Generates self-registering Shadow DOM custom elements from ComponentDef
 * metadata. Unlike generator/adapters/webcomponent.ts (which reads YAML from
 * disk), this module has zero Node.js dependencies and can be imported into
 * Cloudflare Workers.
 *
 * Generated elements reference --p31-* CSS variables at runtime, so they stay
 * themeable and require p31 design-system.css (or tokens) on the page.
 */

import type { ComponentDef } from '../componentDefs.js';

export function wcTagName(cssClass: string): string {
  return 'p31-' + cssClass.replace(/_/g, '-');
}

function observedAttrs(def: ComponentDef): string[] {
  const attrs: string[] = [];
  if (def.props) {
    for (const [name, pdef] of Object.entries(def.props)) {
      if (pdef.type === 'boolean' || pdef.type.includes('=>') || pdef.type.startsWith('(')) continue;
      if (['children', 'className', 'style', 'icon'].includes(name)) continue;
      attrs.push(name);
    }
  }
  return attrs;
}

function eventProps(def: ComponentDef): { prop: string; event: string }[] {
  const events: { prop: string; event: string }[] = [];
  if (def.props) {
    for (const [name, pdef] of Object.entries(def.props)) {
      if (pdef.type.includes('=>') || pdef.type.startsWith('(')) {
        events.push({ prop: name, event: name });
      }
    }
  }
  return events;
}

const GLASS_BASE = `
  background: var(--p31-glass-surface);
  backdrop-filter: var(--p31-glass-blur);
  -webkit-backdrop-filter: var(--p31-glass-blur);
  border: 1px solid var(--p31-glass-border);
  border-radius: var(--p31-glass-radius);
  box-shadow: var(--p31-glass-shadow);
  color: var(--p31-text-primary);
`;

function componentStyles(name: string): string {
  switch (name) {
    case 'GlassPanel':
      return `:host {
  display: block;
${GLASS_BASE}
}
:host([padding="sm"]) { padding: var(--p31-spacing-sm); }
:host([padding="lg"]) { padding: var(--p31-spacing-lg); }
:host(:not([padding])) { padding: var(--p31-spacing-md); }`;
    case 'GlassCard':
      return `:host {
  display: block;
${GLASS_BASE}
  padding: var(--p31-spacing-lg);
  transition: border-color var(--p31-duration-standard) var(--p31-easing-standard);
}
:host([strong]) {
  background: var(--p31-glass-surface-hover);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
:host(:hover) {
  border-color: var(--p31-glass-border-hover);
}`;
    case 'Topbar':
      return `:host {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--p31-z-floating, 60);
  height: var(--p31-topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--p31-spacing-lg);
${GLASS_BASE}
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
}
.topbar-left, .topbar-center, .topbar-right {
  display: flex;
  align-items: center;
  gap: var(--p31-spacing-sm);
}`;
    case 'BottomNav':
      return `:host {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--p31-z-floating, 60);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: var(--p31-spacing-sm);
${GLASS_BASE}
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
}
::slotted(a), ::slotted(button) {
  min-height: 48px;
  min-width: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--p31-text-secondary);
  text-decoration: none;
}
::slotted(a[active]), ::slotted(a[aria-current="page"]) {
  color: var(--p31-accent);
}`;
    case 'SpoonDial':
      return `:host {
  display: inline-flex;
  gap: var(--p31-space-tiny);
  padding: 4px;
  border-radius: var(--p31-radius-full);
  background: var(--p31-glass-surface);
  border: 1px solid var(--p31-glass-border);
}
button {
  width: 28px;
  height: 28px;
  border-radius: var(--p31-radius-full);
  border: 1px solid var(--p31-glass-border);
  background: transparent;
  color: var(--p31-text-tertiary);
  cursor: pointer;
  font-size: 12px;
  transition: all var(--p31-duration-fast) var(--p31-easing-standard);
}
button:hover { border-color: var(--p31-accent); }
button[aria-checked="true"] {
  background: var(--p31-accent);
  color: var(--p31-void);
  border-color: var(--p31-accent);
}
@media (prefers-reduced-motion: reduce) {
  button { transition: none; }
}`;
    case 'Button':
      return `:host {
  display: inline-flex;
}
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--p31-spacing-xs);
  min-height: 48px;
  min-width: 48px;
  padding: var(--p31-spacing-sm) var(--p31-spacing-lg);
  font-family: var(--p31-font-sans);
  font-size: 14px;
  font-weight: 700;
  border-radius: var(--p31-radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--p31-duration-fast) var(--p31-easing-standard);
}
button[variant="primary"] {
  background: var(--p31-accent);
  color: var(--p31-void);
  box-shadow: 0 0 12px oklch(65% 0.18 195 / 0.4);
}
button[variant="primary"]:hover { filter: brightness(1.1); }
button[variant="secondary"] {
  background: var(--p31-glass-surface);
  border: 1px solid var(--p31-glass-border);
  color: var(--p31-text-primary);
}
button[variant="secondary"]:hover { border-color: var(--p31-glass-border-hover); }
button[variant="ghost"] {
  background: transparent;
  color: var(--p31-text-secondary);
}
button[variant="ghost"]:hover { background: rgba(255, 255, 255, 0.05); color: var(--p31-text-primary); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
button:focus-visible { outline: 2px solid var(--p31-accent); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  button { transition: none; }
}`;
    case 'StatusBadge':
      return `:host {
  display: inline-flex;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: var(--p31-radius-full);
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: var(--p31-radius-full);
  background: currentColor;
}
.badge[data-status="online"] { background: oklch(65% 0.18 105 / 0.15); color: var(--p31-accent-green); border-color: oklch(65% 0.18 105 / 0.3); }
.badge[data-status="offline"] { background: oklch(65% 0.18 20 / 0.15); color: var(--p31-accent-red); border-color: oklch(65% 0.18 20 / 0.3); }
.badge[data-status="busy"] { background: oklch(65% 0.18 15 / 0.15); color: var(--p31-accent-gold); border-color: oklch(65% 0.18 15 / 0.3); }
.badge[data-status="away"] { background: oklch(65% 0.18 270 / 0.15); color: var(--p31-accent-violet); border-color: oklch(65% 0.18 270 / 0.3); }`;
    case 'MetricBadge':
      return `:host {
  display: inline-flex;
}
.metric {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--p31-radius-sm);
  background: var(--p31-glass-surface);
  border: 1px solid var(--p31-glass-border);
  font-size: 12px;
  color: var(--p31-text-secondary);
}
.metric .value { color: var(--p31-text-primary); font-weight: 600; }
:host([clickable]) .metric { cursor: pointer; transition: border-color var(--p31-duration-fast); }
:host([clickable]) .metric:hover { border-color: var(--p31-glass-border-hover); }`;
    case 'Starfield':
      return `:host {
  position: fixed;
  inset: 0;
  z-index: var(--p31-z-content, 1);
  pointer-events: none;
  display: block;
}
canvas { width: 100%; height: 100%; display: block; }`;
    case 'CrisisOverlay':
      return `:host {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--p31-spacing-lg);
  background: var(--p31-void);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.message {
  font-size: 24px;
  font-weight: 300;
  color: var(--p31-text-primary);
  text-align: center;
  max-width: 32rem;
  line-height: 1.5;
}
button {
  padding: var(--p31-spacing-md) var(--p31-spacing-xl);
  border-radius: var(--p31-radius-md);
  background: var(--p31-accent);
  color: var(--p31-void);
  font-weight: 600;
  border: none;
  cursor: pointer;
  min-height: 48px;
  font-size: 16px;
}
button:focus-visible { outline: 2px solid var(--p31-text-primary); outline-offset: 2px; }`;
    default:
      return `:host { display: block; }`;
  }
}

function templateInner(name: string): string {
  switch (name) {
    case 'Topbar':
      return `<div class="topbar-left"><slot name="left"></slot></div>
  <div class="topbar-center"><slot name="center"></slot></div>
  <div class="topbar-right"><slot name="right"></slot></div>`;
    case 'SpoonDial':
      return `<div role="radiogroup" aria-label="Cognitive load"></div>`;
    case 'Button':
      return `<button part="button" type="button"><slot></slot></button>`;
    case 'StatusBadge':
      return `<span class="badge" part="badge"><span class="dot" aria-hidden="true"></span><slot>Live</slot></span>`;
    case 'MetricBadge':
      return `<div class="metric" part="metric"><slot name="icon"></slot><span class="value"><slot></slot></span><slot name="label"></slot></div>`;
    case 'Starfield':
      return `<canvas aria-hidden="true"></canvas>`;
    case 'CrisisOverlay':
      return `<p class="message"></p>
  <button type="button" part="ready">I'm Ready</button>`;
    default:
      return `<slot></slot>`;
  }
}

export function generateWcTemplate(name: string, def: ComponentDef): string {
  const tag = wcTagName(def.css_class || name.toLowerCase());
  const attrs = observedAttrs(def);
  const events = eventProps(def);
  const attrsList = attrs.map(a => `'${a}'`).join(', ');

  const attrLogic: string[] = [];

  if (name === 'GlassPanel') {
    attrLogic.push(`    if (name === 'padding') {
      // Reflected automatically via :host([padding]) selectors
    }`);
  }
  if (name === 'SpoonDial') {
    attrLogic.push(`    if (name === 'level') {
      const n = Math.max(0, Math.min(5, parseInt(newVal || '3', 10)));
      this.shadowRoot.querySelectorAll('button').forEach((btn, i) => {
        btn.setAttribute('aria-checked', i === n ? 'true' : 'false');
      });
    }`);
  }
  if (name === 'StatusBadge') {
    attrLogic.push(`    if (name === 'status') {
      const badge = this.shadowRoot.querySelector('.badge');
      if (badge) badge.dataset.status = newVal || 'online';
    }`);
  }
  if (name === 'CrisisOverlay') {
    attrLogic.push(`    if (name === 'message') {
      const msg = this.shadowRoot.querySelector('.message');
      if (msg) msg.textContent = newVal || 'Rest. Breathe. The mesh holds.';
    }`);
  }

  for (const { prop, event } of events) {
    attrLogic.push(`    if (name === '${prop}') {
      this.dispatchEvent(new CustomEvent('${event}', { bubbles: true, composed: true, detail: { value: newVal } }));
    }`);
  }

  const attrBlock = attrLogic.length > 0
    ? `  attributeChangedCallback(name, oldVal, newVal) {
${attrLogic.join('\n')}
  }`
    : '';

  const connectedExtras: string[] = [];
  if (name === 'Button') {
    connectedExtras.push(`const btn = this.shadowRoot.querySelector('button');
    if (btn) {
      btn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('onclick', { bubbles: true, composed: true }));
      });
    }`);
  }
  if (name === 'CrisisOverlay') {
    connectedExtras.push(`this.setAttribute('role', 'dialog');
    this.setAttribute('aria-modal', 'true');
    const btn = this.shadowRoot.querySelector('button');
    btn?.addEventListener('click', () => this.dispatchEvent(new CustomEvent('ready', { bubbles: true, composed: true })));
    btn?.focus();`);
  }
  if (name === 'SpoonDial') {
    connectedExtras.push(`const group = this.shadowRoot.querySelector('[role="radiogroup"]');
    for (let i = 0; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = String(i);
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-label', \`Spoons = \${i}\`);
      btn.addEventListener('click', () => {
        this.setAttribute('level', String(i));
        this.dispatchEvent(new CustomEvent('levelChange', { bubbles: true, composed: true, detail: { level: i } }));
      });
      group.appendChild(btn);
    }
    const initial = Math.max(0, Math.min(5, parseInt(this.getAttribute('level') || '3', 10)));
    group.querySelectorAll('button').forEach((btn, i) => btn.setAttribute('aria-checked', i === initial ? 'true' : 'false'));`);
  }
  if (name === 'Starfield') {
    connectedExtras.push(`// Static starfield: animation handled by page-level starfield scripts.
    // This element provides the positioned, pointer-events-none layer only.`);
  }

  const connectedBlock = connectedExtras.length > 0
    ? `  connectedCallback() {
    ${connectedExtras.join('\n    ')}
  }`
    : '';

  return `/**
 * @file ${name}.wc.js — Web Component (Shadow DOM) version of ${name}.
 * Generated by the P31 Design System MCP server.
 *
 * Usage:
 *   <script type="module" src="./${name}.wc.js"></script>
 *   <${tag}></${tag}>
 *
 * Requires the P31 design-system stylesheet (--p31-* variables) on the page.
 */

const template = document.createElement('template');
template.innerHTML = \`
  <style>
${componentStyles(name)}
  </style>
  ${templateInner(name).replace(/\n/g, '\n  ')}
\`;

class P31${name} extends HTMLElement {
  static get observedAttributes() { return [${attrsList}]; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
${attrBlock ? '\n' + attrBlock : ''}
${connectedBlock}
}

if (!customElements.get('${tag}')) {
  customElements.define('${tag}', P31${name});
}

export default P31${name};
`;
}
