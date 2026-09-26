/**
 * @file BreakOverlay.wc.js — Web Component (Shadow DOM) version of BreakOverlay.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./BreakOverlay.wc.js"></script>
 *   <p31-break-overlay></p31-break-overlay>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-color-void_deep: oklch(8% 0.01 240);
    --p31-primitive-color-surface2: oklch(22% 0.02 240);
    --p31-primitive-typography-font_display: var(--p31-primitive-typography-font_display);
    --p31-primitive-radius-xl: calc(var(--p31-scale-xl) / 2);
}

  </style>
      <slot></slot>
`;

class P31BreakOverlay extends HTMLElement {
  static get observedAttributes() { return ['duration']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-break-overlay', P31BreakOverlay);
