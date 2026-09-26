/**
 * @file Footer.wc.js — Web Component (Shadow DOM) version of Footer.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./Footer.wc.js"></script>
 *   <p31-site-footer></p31-site-footer>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-color-surface: oklch(15% 0.015 240);
    --p31-primitive-color-text: var(--p31-primitive-color-text);
    --p31-primitive-color-text_secondary: oklch(80% 0.01 240);
    --p31-primitive-color-border: var(--p31-primitive-color-border);
    --p31-primitive-spacing-lg: clamp(var(--p31-scale-lg), 3.5vw, var(--p31-scale-xl));
}

  </style>
      <slot></slot>
`;

class P31Footer extends HTMLElement {
  static get observedAttributes() { return ['columns', 'brand-label', 'brand-icon', 'tagline', 'copyright', 'legal-text']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-site-footer', P31Footer);
