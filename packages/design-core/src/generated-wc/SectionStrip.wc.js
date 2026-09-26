/**
 * @file SectionStrip.wc.js — Web Component (Shadow DOM) version of SectionStrip.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./SectionStrip.wc.js"></script>
 *   <p31-section-strip></p31-section-strip>
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
    --p31-primitive-radius-full: 9999px;
    --p31-primitive-radius-md: calc(var(--p31-scale-md) / 2);
    --p31-primitive-spacing-sm: clamp(var(--p31-scale-sm), 1.5vw, var(--p31-scale-md));
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --p31-semantic-color-accent-iris: oklch(65% 0.18 270);
}
.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: var(--p31-primitive-color-glass-surface);
  border: 1px solid var(--p31-primitive-color-glass-border);
  width: fit-content;
}
.tab {
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--p31-primitive-color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  min-height: 40px;
}
.tab.active {
  background: var(--p31-semantic-color-accent-default);
  color: var(--p31-primitive-color-void);
  font-weight: 600;
}
::slotted(p31-section-tab) {
  padding: 8px 18px;
  border-radius: 999px;
}
  </style>
      <div class="tabs">
        <button class="tab active">Section</button>
        <button class="tab">Section</button>
        <button class="tab">Section</button>
      </div>
`;

class P31SectionStrip extends HTMLElement {
  static get observedAttributes() { return ['items', 'on-select']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'on-select') {
      this.dispatchEvent(new CustomEvent('on-select', { bubbles: true, detail: { value: newVal } }));
    }
  }

  connectedCallback() {
    
    
  }
}

customElements.define('p31-section-strip', P31SectionStrip);
