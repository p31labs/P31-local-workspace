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
    --p31-primitive-color-glass_surface: oklch(100% 0.01 240 / 0.04);
    --p31-primitive-color-glass_border: oklch(100% 0.01 240 / 0.08);
    --p31-primitive-color-glass_border_hover: oklch(100% 0.01 240 / 0.15);
    --p31-primitive-color-surface2: oklch(22% 0.02 240);
    --p31-primitive-color-void_deep: oklch(8% 0.01 240);
    --p31-primitive-radius-xl: calc(var(--p31-scale-xl) / 2);
    --p31-primitive-radius-sm: calc(var(--p31-scale-sm) / 2);
    --p31-primitive-radius-lg: calc(var(--p31-scale-lg) / 2);
    --p31-primitive-radius-full: 9999px;
    --p31-primitive-shadow-glass: 0 8px 32px oklch(NaN NaN NaN);
    --p31-primitive-shadow-glow_cyan_hover: 0 0 30px oklch(NaN NaN NaN);
    --p31-primitive-spacing-xs: clamp(var(--p31-scale-xs), 1vw, var(--p31-scale-sm));
    --p31-primitive-spacing-md: clamp(var(--p31-scale-md), 2.5vw, var(--p31-scale-lg));
    --p31-primitive-spacing-xl: clamp(var(--p31-scale-xl), 5vw, var(--p31-scale-2xl));
    --p31-primitive-spacing-xxl: {spacing.2xl};
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --p31-semantic-color-background-alt: oklch(15% 0.015 240);
    --p31-semantic-color-accent-gold: oklch(65% 0.18 15);
    --p31-semantic-color-accent-red: oklch(65% 0.18 20);
    --p31-semantic-color-accent-iris: oklch(65% 0.18 270);
  border-radius: var(--p31-primitive-radius-xl);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid oklch(100% 0.01 240 / 0.08);
  box-shadow: var(--p31-primitive-shadow-glass);
  transition: border-color 0.2s ease;
}
:host(:hover) {
  border-color: oklch(100% 0.01 240 / 0.15);
}
:host([padding="sm"]) { padding: var(--p31-primitive-spacing-sm); }
:host([padding="lg"]) { padding: var(--p31-primitive-spacing-lg); }
:host([color="violet"]) {
  --p31-accent: oklch(65% 0.18 285);
}
:host([color="gold"]) {
  --p31-accent: oklch(65% 0.18 15);
}
:host([color="green"]) {
  --p31-accent: oklch(65% 0.18 105);
}
:host([color="red"]) {
  --p31-accent: oklch(65% 0.18 20);
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
