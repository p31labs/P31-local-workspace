/**
 * @file CompanionCard.wc.js — Web Component (Shadow DOM) version of CompanionCard.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./CompanionCard.wc.js"></script>
 *   <p31-companion-card></p31-companion-card>
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
    --p31-primitive-radius-xl: calc(var(--p31-scale-xl) / 2);
    --p31-primitive-radius-lg: calc(var(--p31-scale-lg) / 2);
    --p31-primitive-radius-full: 9999px;
    --p31-primitive-shadow-glass: 0 8px 32px oklch(NaN NaN NaN);
    --p31-primitive-typography-font_display: var(--p31-primitive-typography-font_display);
}

  </style>
      <slot></slot>
`;

class P31CompanionCard extends HTMLElement {
  static get observedAttributes() { return ['color']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-companion-card', P31CompanionCard);
