/**
 * @file Chameleon.wc.js — Web Component (Shadow DOM) version of Chameleon.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./Chameleon.wc.js"></script>
 *   <p31-chameleon></p31-chameleon>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: inline-block;
    --p31-primitive-color-accent: var(--p31-primitive-color-accent);
    --p31-primitive-color-glass_surface: oklch(100% 0.01 240 / 0.04);
    --p31-primitive-color-glass_border: oklch(100% 0.01 240 / 0.08);
    --p31-primitive-radius-full: 9999px;
    --p31-primitive-radius-md: calc(var(--p31-scale-md) / 2);
    --p31-primitive-spacing-xs: clamp(var(--p31-scale-xs), 1vw, var(--p31-scale-sm));
    --p31-primitive-typography-font_mono: ui-monospace, SFMono-Regular, 'Fira Code', 'Fira Mono', 'Roboto Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
}
.trigger {
  width: 38px;
  height: 38px;
  border-radius: 9999px;
  background: var(--p31-primitive-color-glass-surface);
  border: 1px solid var(--p31-primitive-color-glass-border);
  cursor: pointer;
  color: var(--p31-primitive-color-text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

  </style>
      <button class="trigger" title="Adaptive theme controls">◐</button>
`;

class P31Chameleon extends HTMLElement {
  static get observedAttributes() { return ['class-name']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-chameleon', P31Chameleon);
