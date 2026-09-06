/**
 * @file StatusBadge.wc.js — Web Component (Shadow DOM) version of StatusBadge.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./StatusBadge.wc.js"></script>
 *   <p31-status-badge></p31-status-badge>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: inline-flex;
  align-items: center;
    --p31-semantic-color-accent-green: #34D399;
    --p31-semantic-color-accent-default: #00F0FF;
    --p31-semantic-color-accent-variant: #A78BFA;
    --p31-semantic-color-accent-gold: #FBBF24;
    --p31-semantic-color-accent-red: #FB7185;
    --p31-semantic-color-accent-iris: #818CF8;
    --p31-primitive-radius-sm: 8px;
    --p31-primitive-spacing-xs: 4px;
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}
:host([status="live"]) {
  background: rgba(52,211,153,0.2);
  color: #34D399;
  border-color: rgba(52,211,153,0.3);
}
:host([status="beta"]) {
  background: rgba(251,191,36,0.2);
  color: #FBBF24;
  border-color: rgba(251,191,36,0.3);
}
:host([status="research"]) {
  background: rgba(167,139,250,0.2);
  color: #A78BFA;
  border-color: rgba(167,139,250,0.3);
}

  </style>
      <slot>Live</slot>
`;

class P31StatusBadge extends HTMLElement {
  static get observedAttributes() { return ['status']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'status') {
      this.textContent = this.getAttribute('label') || STATUS_CONFIG[newVal]?.label || newVal;
    }
  }

  connectedCallback() {
    
    
  }
}

customElements.define('p31-status-badge', P31StatusBadge);
