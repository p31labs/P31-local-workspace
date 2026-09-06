/**
 * @file ThemeToggle.wc.js — Web Component (Shadow DOM) version of ThemeToggle.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./ThemeToggle.wc.js"></script>
 *   <p31-theme-toggle></p31-theme-toggle>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: inline-flex;
    --p31-semantic-color-background-default: #0A0A0F;
    --p31-theme-light-background-default: #F8FAFC;
    --p31-theme-light-background-alt: #FFFFFF;
    --p31-theme-light-text-primary: #0F172A;
    --p31-theme-light-text-secondary: rgba(15,23,42,0.6);
    --p31-theme-light-text-tertiary: rgba(15,23,42,0.3);
    --p31-theme-light-glass_surface: rgba(0,0,0,0.03);
    --p31-theme-light-glass_border: rgba(0,0,0,0.08);
    --p31-theme-light-glass_border_hover: rgba(0,0,0,0.15);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  padding: 8px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: border-color 0.2s ease;
}
:host(:hover) {
  border-color: rgba(255,255,255,0.2);
}

  </style>

`;

class P31ThemeToggle extends HTMLElement {
  static get observedAttributes() { return ['0', '1']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'dark' || name === 'light') {
      const isDark = this.getAttribute('dark') !== null;
      this.textContent = isDark ? '🌙' : '☀️';
    }
  }

  connectedCallback() {
    
    
  }
}

customElements.define('p31-theme-toggle', P31ThemeToggle);
