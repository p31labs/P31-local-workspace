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
    --p31-semantic-color-accent-green: oklch(65% 0.18 105);
    --p31-semantic-color-accent-default: oklch(65% 0.18 195);
    --p31-semantic-color-accent-variant: oklch(65% 0.18 285);
    --p31-semantic-color-accent-gold: oklch(65% 0.18 15);
    --p31-semantic-color-accent-red: oklch(65% 0.18 20);
    --p31-semantic-color-accent-iris: oklch(65% 0.18 270);
    --p31-primitive-radius-sm: calc(var(--p31-scale-sm) / 2);
    --p31-primitive-spacing-xs: clamp(var(--p31-scale-xs), 1vw, var(--p31-scale-sm));
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}
:host([status="live"]) {
  background: oklch(NaN NaN NaN);
  color: oklch(0.773 0.153 163);
  border-color: oklch(NaN NaN NaN);
}
:host([status="beta"]) {
  background: oklch(NaN NaN NaN);
  color: oklch(0.837 0.164 84);
  border-color: oklch(NaN NaN NaN);
}
:host([status="research"]) {
  background: oklch(NaN NaN NaN);
  color: oklch(0.709 0.159 294);
  border-color: oklch(NaN NaN NaN);
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
