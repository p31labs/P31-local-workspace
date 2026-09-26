/**
 * @file GlassPanel.wc.js — Web Component (Shadow DOM) version of GlassPanel.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./GlassPanel.wc.js"></script>
 *   <p31-glass-panel></p31-glass-panel>
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
    --p31-primitive-color-surface2: oklch(22% 0.02 240);
    --p31-primitive-color-void_deep: oklch(8% 0.01 240);
    --p31-primitive-radius-xl: calc(var(--p31-scale-xl) / 2);
    --p31-primitive-radius-sm: calc(var(--p31-scale-sm) / 2);
    --p31-primitive-radius-lg: calc(var(--p31-scale-lg) / 2);
    --p31-primitive-shadow-glass: 0 8px 32px oklch(NaN NaN NaN);
    --p31-primitive-spacing-xl: clamp(var(--p31-scale-xl), 5vw, var(--p31-scale-2xl));
    --p31-primitive-spacing-xxl: {spacing.2xl};
  border-radius: var(--p31-primitive-radius-xl);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid oklch(100% 0.01 240 / 0.08);
  box-shadow: var(--p31-primitive-shadow-glass);
}
:host([padding="sm"]) { padding: var(--p31-primitive-spacing-sm); }
:host([padding="lg"]) { padding: var(--p31-primitive-spacing-lg); }

::slotted(*) { color: var(--p31-semantic-color-text-primary); }

  </style>
      <slot></slot>
`;

class P31GlassPanel extends HTMLElement {
  static get observedAttributes() { return ['padding']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-glass-panel', P31GlassPanel);
