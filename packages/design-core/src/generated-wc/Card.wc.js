/**
 * @file Card.wc.js — Web Component (Shadow DOM) version of Card.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./Card.wc.js"></script>
 *   <p31-card></p31-card>
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
    --p31-primitive-color-glass_border_hover: oklch(100% 0.01 240 / 0.15);
    --p31-primitive-radius-lg: calc(var(--p31-scale-lg) / 2);
    --p31-primitive-radius-md: calc(var(--p31-scale-md) / 2);
    --p31-primitive-shadow-glass: 0 8px 32px oklch(NaN NaN NaN);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

  </style>
      <slot></slot>
`;

class P31Card extends HTMLElement {
  static get observedAttributes() { return ['padding']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-card', P31Card);
