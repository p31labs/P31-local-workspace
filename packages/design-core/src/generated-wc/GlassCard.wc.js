/**
 * @file GlassCard.wc.js — Web Component (Shadow DOM) version of GlassCard.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./GlassCard.wc.js"></script>
 *   <p31-glass-card></p31-glass-card>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-color-glass_surface: rgba(255,255,255,0.04);
    --p31-primitive-color-glass_border: rgba(255,255,255,0.08);
    --p31-primitive-color-glass_border_hover: rgba(255,255,255,0.15);
    --p31-primitive-color-surface2: #1C1C2A;
    --p31-primitive-color-void_deep: #050508;
    --p31-primitive-radius-xl: 24px;
    --p31-primitive-radius-sm: 8px;
    --p31-primitive-radius-lg: 16px;
    --p31-primitive-radius-full: 9999px;
    --p31-primitive-shadow-glass: 0 8px 32px rgba(0,0,0,0.15);
    --p31-primitive-shadow-glow_cyan_hover: 0 0 30px rgba(0,240,255,0.4);
    --p31-primitive-spacing-xs: 4px;
    --p31-primitive-spacing-md: 16px;
    --p31-primitive-spacing-xl: 32px;
    --p31-primitive-spacing-xxl: 64px;
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --p31-semantic-color-background-alt: #12121A;
    --p31-semantic-color-accent-gold: #FBBF24;
    --p31-semantic-color-accent-red: #FB7185;
    --p31-semantic-color-accent-iris: #818CF8;
  border-radius: var(--p31-primitive-radius-xl);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: var(--p31-primitive-shadow-glass);
  transition: border-color 0.2s ease;
}
:host(:hover) {
  border-color: rgba(255,255,255,0.15);
}
:host([padding="sm"]) { padding: var(--p31-primitive-spacing-sm); }
:host([padding="lg"]) { padding: var(--p31-primitive-spacing-lg); }
:host([color="violet"]) {
  --p31-accent: #A78BFA;
}
:host([color="gold"]) {
  --p31-accent: #FBBF24;
}
:host([color="green"]) {
  --p31-accent: #34D399;
}
:host([color="red"]) {
  --p31-accent: #FB7185;
}
::slotted(*) { color: var(--p31-semantic-color-text-primary); }

  </style>
      <slot></slot>
`;

class P31GlassCard extends HTMLElement {
  static get observedAttributes() { return ['color', 'padding']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'color') {
      this.shadowRoot.host.style.setProperty('--p31-accent', newVal || '');
    }
  }

  connectedCallback() {
    
    
  }
}

customElements.define('p31-glass-card', P31GlassCard);
