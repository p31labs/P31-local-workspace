/**
 * @file CandyHeader.wc.js — Web Component (Shadow DOM) version of CandyHeader.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./CandyHeader.wc.js"></script>
 *   <p31-candy-header></p31-candy-header>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-component-header_candy: [object Object];
    --p31-component-crown_xs: [object Object];
    --p31-component-spoon_icon: [object Object];
    --p31-primitive-color-cyan: #00F0FF;
    --p31-primitive-color-void: #0A0A0F;
}

  </style>
      <slot></slot>
`;

class P31CandyHeader extends HTMLElement {
  static get observedAttributes() { return ['brand']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-candy-header', P31CandyHeader);
