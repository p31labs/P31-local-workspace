/**
 * @file PageHeader.wc.js — Web Component (Shadow DOM) version of PageHeader.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./PageHeader.wc.js"></script>
 *   <p31-page-header-route></p31-page-header-route>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-color-text: var(--p31-primitive-color-text);
    --p31-primitive-color-text_secondary: oklch(80% 0.01 240);
    --p31-primitive-color-accent: var(--p31-primitive-color-accent);
    --p31-primitive-spacing-md: clamp(var(--p31-scale-md), 2.5vw, var(--p31-scale-lg));
    --p31-primitive-spacing-lg: clamp(var(--p31-scale-lg), 3.5vw, var(--p31-scale-xl));
    --p31-primitive-typography-font_mono: ui-monospace, SFMono-Regular, 'Fira Code', 'Fira Mono', 'Roboto Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
    --p31-semantic-color-accent-iris: oklch(65% 0.18 270);
  text-align: center;
  padding: 48px 0 24px 0;
}
.eyebrow {
  font-family: var(--p31-primitive-typography-font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--p31-primitive-color-text-tertiary);
}
h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 8px 0;
  color: var(--p31-semantic-color-accent-default);
}
.lede {
  font-size: 16px;
  color: var(--p31-primitive-color-text-secondary);
  margin: 0;
}
::slotted(*) {
  color: var(--p31-semantic-color-text-primary);
}
  </style>
      <span class="eyebrow">System</span>
      <h1>Design System</h1>
      <p class="lede">Live primitives from design-core</p>
`;

class P31PageHeader extends HTMLElement {
  static get observedAttributes() { return ['eyebrow', 'title', 'lede']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-page-header-route', P31PageHeader);
