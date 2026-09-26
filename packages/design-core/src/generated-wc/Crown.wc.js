/**
 * @file Crown.wc.js — Web Component (Shadow DOM) version of Crown.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./Crown.wc.js"></script>
 *   <p31-crown></p31-crown>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-component-crown_xs: [object Object];
    --p31-primitive-color-cyan: oklch(65% 0.18 195);
    --p31-primitive-color-violet: oklch(65% 0.18 285);
    --p31-primitive-color-gold: oklch(65% 0.18 15);
    --p31-primitive-color-green: oklch(65% 0.18 105);
    --p31-primitive-color-iris: oklch(65% 0.18 270);
}

  </style>
      <slot></slot>
`;

class P31Crown extends HTMLElement {
  static get observedAttributes() { return ['size', 'brand']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-crown', P31Crown);
