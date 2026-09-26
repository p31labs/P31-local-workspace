/**
 * @file CrisisOverlay.wc.js — Web Component (Shadow DOM) version of CrisisOverlay.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./CrisisOverlay.wc.js"></script>
 *   <p31-crisis-overlay></p31-crisis-overlay>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
    --p31-semantic-color-background-default: oklch(10% 0.01 240);
    --p31-primitive-color-void_deep: oklch(8% 0.01 240);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
::slotted(.p31-crisis-message) {
  font-size: 24px;
  font-weight: 300;
  color: var(--p31-semantic-color-text-primary);
  margin-bottom: 8px;
  text-align: center;
}
::slotted(.p31-crisis-button) {
  padding: 12px 24px;
  border-radius: 8px;
  background: var(--p31-semantic-color-accent-default);
  color: var(--p31-primitive-color-void);
  font-weight: 600;
  border: none;
  cursor: pointer;
  min-height: 44px;
}
  </style>
      <slot class="p31-crisis-message">Rest. Breathe. The mesh holds.</slot>
      <slot class="p31-crisis-button">I'm Ready</slot>
`;

class P31CrisisOverlay extends HTMLElement {
  static get observedAttributes() { return ['message', 'button-label']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'message') {
      const msg = this.shadowRoot.querySelector('.p31-crisis-message');
      if (msg) msg.textContent = newVal;
    }
    if (name === 'buttonlabel') {
      const btn = this.shadowRoot.querySelector('.p31-crisis-button');
      if (btn) btn.textContent = newVal;
    }
  }

  connectedCallback() {
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-modal', 'true');
    
  }
}

customElements.define('p31-crisis-overlay', P31CrisisOverlay);
