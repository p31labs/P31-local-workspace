/**
 * @file GlassSubtle.wc.js — Web Component (Shadow DOM) version of GlassSubtle.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./GlassSubtle.wc.js"></script>
 *   <p31-glass-subtle></p31-glass-subtle>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-color-glass_surface_subtle: rgba(255,255,255,0.03);
    --p31-primitive-color-surface2: #1C1C2A;
    --p31-primitive-blur-subtle: 8px;
    --p31-primitive-radius-xl: 24px;
  border-radius: var(--p31-primitive-radius-xl);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
::slotted(*) { color: var(--p31-semantic-color-text-primary); }

  </style>
      <slot></slot>
`;

class P31GlassSubtle extends HTMLElement {
  static get observedAttributes() { return ['0', '1']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-glass-subtle', P31GlassSubtle);
