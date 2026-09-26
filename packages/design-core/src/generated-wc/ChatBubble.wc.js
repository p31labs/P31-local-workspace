/**
 * @file ChatBubble.wc.js — Web Component (Shadow DOM) version of ChatBubble.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./ChatBubble.wc.js"></script>
 *   <p31-chat-bubble></p31-chat-bubble>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-radius-lg: calc(var(--p31-scale-lg) / 2);
    --p31-primitive-radius-md: calc(var(--p31-scale-md) / 2);
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --p31-primitive-color-surface2: oklch(22% 0.02 240);
    --p31-primitive-color-void_deep: oklch(8% 0.01 240);
}

  </style>
      <slot></slot>
`;

class P31ChatBubble extends HTMLElement {
  static get observedAttributes() { return ['role']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-chat-bubble', P31ChatBubble);
