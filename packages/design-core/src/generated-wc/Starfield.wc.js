/**
 * @file Starfield.wc.js — Web Component (Shadow DOM) version of Starfield.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./Starfield.wc.js"></script>
 *   <p31-starfield></p31-starfield>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  position: fixed;
  inset: 0;
  pointer-events: none;
  display: block;
}

  </style>

`;

class P31Starfield extends HTMLElement {
  static get observedAttributes() { return ['count', 'speed']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-starfield', P31Starfield);
