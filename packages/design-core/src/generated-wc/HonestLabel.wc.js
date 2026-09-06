/**
 * @file HonestLabel.wc.js — Web Component (Shadow DOM) version of HonestLabel.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./HonestLabel.wc.js"></script>
 *   <p31-honest-label></p31-honest-label>
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
    --p31-primitive-typography-font_mono: ui-monospace, SFMono-Regular, 'Fira Code', 'Fira Mono', 'Roboto Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --p31-semantic-color-text-tertiary: rgba(245,245,247,0.3);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  font-family: ui-monospace, SFMono-Regular, 'Fira Code', 'Fira Mono', 'Roboto Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
}

  </style>
      <slot></slot>
`;

class P31HonestLabel extends HTMLElement {
  static get observedAttributes() { return ['0', '1']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-honest-label', P31HonestLabel);
