/**
 * @file SpoonMeter.wc.js — Web Component (Shadow DOM) version of SpoonMeter.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./SpoonMeter.wc.js"></script>
 *   <p31-spoon-meter></p31-spoon-meter>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: inline-flex;
  align-items: center;
  gap: 6px;
    --p31-semantic-color-accent-default: #00F0FF;
    --p31-semantic-color-accent-gold: #FBBF24;
    --p31-semantic-color-accent-red: #FB7185;
    --p31-semantic-color-accent-iris: #818CF8;
    --p31-semantic-color-text-tertiary: rgba(245,245,247,0.3);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  transition: all 0.3s ease;
}
.dot.filled {
  background: var(--p31-semantic-color-accent-default);
  box-shadow: 0 0 6px var(--p31-semantic-color-accent-default);
}

  </style>

`;

class P31SpoonMeter extends HTMLElement {
  static get observedAttributes() { return ['current']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'current') {
      const n = parseInt(newVal || '3', 10);
      const dots = this.shadowRoot.querySelectorAll('.dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('filled', i < n);
      });
    }
  }

  connectedCallback() {
    
    this.setAttribute('role', 'img');
    this.setAttribute('aria-label', 'Spoon level ' + (this.getAttribute('current') || '3') + ' of 5');
  }
}

customElements.define('p31-spoon-meter', P31SpoonMeter);
