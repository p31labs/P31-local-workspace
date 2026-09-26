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
    --p31-semantic-color-background-default: oklch(10% 0.01 240);
    --p31-theme-light-background-default: oklch(0.984 0.003 248);
    --p31-theme-light-background-alt: oklch(1.000 0.000 90);
    --p31-theme-light-text-primary: oklch(0.208 0.040 266);
    --p31-theme-light-text-secondary: oklch(NaN NaN NaN);
    --p31-theme-light-text-tertiary: oklch(NaN NaN NaN);
    --p31-theme-light-glass_surface: oklch(NaN NaN NaN);
    --p31-theme-light-glass_border: oklch(NaN NaN NaN);
    --p31-theme-light-glass_border_hover: oklch(NaN NaN NaN);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  padding: 8px;
  border-radius: 9999px;
  background: oklch(NaN NaN NaN);
  border: 1px solid oklch(NaN NaN NaN);
  cursor: pointer;
  transition: border-color 0.2s ease;
}
:host(:hover) {
  border-color: oklch(NaN NaN NaN);
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
