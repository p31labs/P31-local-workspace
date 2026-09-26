/**
 * @file BottomNav.wc.js — Web Component (Shadow DOM) version of BottomNav.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./BottomNav.wc.js"></script>
 *   <p31-bottom-nav></p31-bottom-nav>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-color-glass_surface: oklch(100% 0.01 240 / 0.04);
    --p31-primitive-color-void: oklch(10% 0.01 240);
    --p31-primitive-spacing-sm: clamp(var(--p31-scale-sm), 1.5vw, var(--p31-scale-md));
    --p31-primitive-radius-md: calc(var(--p31-scale-md) / 2);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

  </style>
      <slot></slot>
`;

class P31BottomNav extends HTMLElement {
  static get observedAttributes() { return ['items']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-bottom-nav', P31BottomNav);
