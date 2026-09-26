/**
 * @file Button.wc.js — Web Component (Shadow DOM) version of Button.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./Button.wc.js"></script>
 *   <p31-btn-primary></p31-btn-primary>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: inline-flex;
    --p31-semantic-color-accent-default: oklch(65% 0.18 195);
    --p31-primitive-color-void: oklch(10% 0.01 240);
    --p31-primitive-color-void_deep: oklch(8% 0.01 240);
    --p31-primitive-color-surface2: oklch(22% 0.02 240);
    --p31-primitive-spacing-sm: clamp(var(--p31-scale-sm), 1.5vw, var(--p31-scale-md));
    --p31-primitive-spacing-lg: clamp(var(--p31-scale-lg), 3.5vw, var(--p31-scale-xl));
    --p31-primitive-spacing-xl: clamp(var(--p31-scale-xl), 5vw, var(--p31-scale-2xl));
    --p31-primitive-radius-md: calc(var(--p31-scale-md) / 2);
    --p31-primitive-radius-sm: calc(var(--p31-scale-sm) / 2);
    --p31-primitive-radius-full: 9999px;
    --p31-primitive-shadow-glow_cyan: 0 0 20px oklch(NaN NaN NaN);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border-radius: var(--p31-primitive-radius-md);
  font-size: 14px;
  padding: var(--p31-primitive-spacing-sm) var(--p31-primitive-spacing-lg);
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 44px;
  min-width: 44px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
:host([variant="primary"]) {
  background: var(--p31-semantic-color-accent-default);
  color: var(--p31-primitive-color-void);
  box-shadow: var(--p31-primitive-shadow-glow_cyan);
}
:host([variant="primary"]:hover) {
  filter: brightness(1.1);
}
:host([variant="secondary"]) {
  background: oklch(NaN NaN NaN);
  color: var(--p31-semantic-color-text-primary);
  border: 1px solid oklch(NaN NaN NaN);
}
:host([variant="ghost"]) {
  background: transparent;
  color: var(--p31-semantic-color-text-secondary);
}
:host([size="sm"]) {
  font-size: 12px;
  padding: var(--p31-primitive-spacing-xs) var(--p31-primitive-spacing-sm);
}
:host([size="lg"]) {
  font-size: 16px;
  padding: var(--p31-primitive-spacing-md) var(--p31-primitive-spacing-xl);
}
::slotted(*) { display: inline; }

  </style>
      <slot></slot>
`;

class P31Button extends HTMLElement {
  static get observedAttributes() { return ['variant', 'size']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-btn-primary', P31Button);
