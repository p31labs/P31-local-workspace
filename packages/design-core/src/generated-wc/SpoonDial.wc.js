/**
 * @file SpoonDial.wc.js — Web Component (Shadow DOM) version of SpoonDial.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./SpoonDial.wc.js"></script>
 *   <p31-spoon-dial></p31-spoon-dial>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-component-spoon_icon: [object Object];
    --p31-semantic-color-accent-default: #00F0FF;
    --p31-primitive-color-text-tertiary: var(--p31-primitive-color-text-tertiary);
}

  </style>
      <slot></slot>
`;

class P31SpoonDial extends HTMLElement {
  static get observedAttributes() { return ['spoons']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-spoon-dial', P31SpoonDial);
