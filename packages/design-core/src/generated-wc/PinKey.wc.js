/**
 * @file PinKey.wc.js — Web Component (Shadow DOM) version of PinKey.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./PinKey.wc.js"></script>
 *   <p31-pin-key></p31-pin-key>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-radius-full: 9999px;
    --p31-primitive-typography-font_display: var(--p31-primitive-typography-font_display);
    --p31-primitive-spacing-md: clamp(var(--p31-scale-md), 2.5vw, var(--p31-scale-lg));
}

  </style>
      <slot></slot>
`;

class P31PinKey extends HTMLElement {
  static get observedAttributes() { return ['value']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-pin-key', P31PinKey);
