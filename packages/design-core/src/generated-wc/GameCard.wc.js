/**
 * @file GameCard.wc.js — Web Component (Shadow DOM) version of GameCard.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./GameCard.wc.js"></script>
 *   <p31-game-card></p31-game-card>
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
    --p31-primitive-radius-lg: calc(var(--p31-scale-lg) / 2);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

  </style>
      <slot></slot>
`;

class P31GameCard extends HTMLElement {
  static get observedAttributes() { return ['spoons']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-game-card', P31GameCard);
