/**
 * @file Badge.wc.js — Web Component (Shadow DOM) version of Badge.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./Badge.wc.js"></script>
 *   <p31-badge></p31-badge>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-color-glass_surface: oklch(100% 0.01 240 / 0.04);
    --p31-primitive-color-glass_border: oklch(100% 0.01 240 / 0.08);
    --p31-primitive-radius-full: 9999px;
    --p31-primitive-spacing-xs: clamp(var(--p31-scale-xs), 1vw, var(--p31-scale-sm));
    --p31-primitive-spacing-md: clamp(var(--p31-scale-md), 2.5vw, var(--p31-scale-lg));
    --p31-primitive-typography-font_mono: ui-monospace, SFMono-Regular, 'Fira Code', 'Fira Mono', 'Roboto Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
}

  </style>
      <slot></slot>
`;

class P31Badge extends HTMLElement {
  static get observedAttributes() { return ['variant']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-badge', P31Badge);
