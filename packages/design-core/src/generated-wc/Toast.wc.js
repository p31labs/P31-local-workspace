/**
 * @file Toast.wc.js — Web Component (Shadow DOM) version of Toast.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./Toast.wc.js"></script>
 *   <p31-toast></p31-toast>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-color-glass_surface: oklch(100% 0.01 240 / 0.04);
    --p31-primitive-color-glass_border_strong: var(--p31-primitive-color-glass_border_strong);
    --p31-primitive-radius-md: calc(var(--p31-scale-md) / 2);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --p31-semantic-color-accent-green: oklch(65% 0.18 105);
    --p31-semantic-color-accent-red: oklch(65% 0.18 20);
}

  </style>
      <slot></slot>
`;

class P31Toast extends HTMLElement {
  static get observedAttributes() { return ['type', 'duration']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-toast', P31Toast);
