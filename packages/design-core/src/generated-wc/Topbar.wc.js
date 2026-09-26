/**
 * @file Topbar.wc.js — Web Component (Shadow DOM) version of Topbar.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./Topbar.wc.js"></script>
 *   <p31-topbar></p31-topbar>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-color-glass_surface: oklch(100% 0.01 240 / 0.04);
    --p31-primitive-color-void: oklch(10% 0.01 240);
    --p31-primitive-spacing-lg: clamp(var(--p31-scale-lg), 3.5vw, var(--p31-scale-xl));
    --p31-primitive-spacing-md: clamp(var(--p31-scale-md), 2.5vw, var(--p31-scale-lg));
    --p31-primitive-radius-md: calc(var(--p31-scale-md) / 2);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

  </style>
      <slot></slot>
`;

class P31Topbar extends HTMLElement {
  static get observedAttributes() { return ['brand']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-topbar', P31Topbar);
