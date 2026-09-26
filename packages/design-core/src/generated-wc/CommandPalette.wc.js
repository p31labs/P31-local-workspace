/**
 * @file CommandPalette.wc.js — Web Component (Shadow DOM) version of CommandPalette.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./CommandPalette.wc.js"></script>
 *   <p31-cmdk></p31-cmdk>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
:host {
  display: block;
    --p31-primitive-color-glass_surface: oklch(100% 0.01 240 / 0.04);
    --p31-primitive-color-glass_border_strong: var(--p31-primitive-color-glass_border_strong);
    --p31-primitive-color-void_deep: oklch(8% 0.01 240);
    --p31-primitive-radius-md: calc(var(--p31-scale-md) / 2);
    --p31-primitive-spacing-sm: clamp(var(--p31-scale-sm), 1.5vw, var(--p31-scale-md));
    --p31-primitive-spacing-md: clamp(var(--p31-scale-md), 2.5vw, var(--p31-scale-lg));
    --p31-primitive-typography-font_sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --p31-primitive-typography-font_mono: ui-monospace, SFMono-Regular, 'Fira Code', 'Fira Mono', 'Roboto Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
}
.overlay {
  position: fixed;
  inset: 0;
  background: oklch(NaN NaN NaN);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 999;
}
.panel {
  width: min(480px, 90vw);
  background: var(--p31-primitive-color-glass-surface);
  border: 1px solid var(--p31-primitive-color-glass-border);
  border-radius: 12px;
  box-shadow: 0 24px 64px oklch(NaN NaN NaN);
  overflow: hidden;
}
.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid oklch(NaN NaN NaN);
}
input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--p31-primitive-color-text-primary);
  font-size: 14px;
}
.list {
  padding: 6px;
  max-height: 40vh;
  overflow-y: auto;
}
.item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--p31-primitive-color-text-secondary);
  font-size: 14px;
  cursor: pointer;
}
.item.active {
  background: var(--p31-semantic-color-accent-default);
  color: var(--p31-primitive-color-void);
}

  </style>
      <div class="overlay">
        <div class="panel">
          <div class="input-row">
            <input placeholder="Search…" aria-label="Search" />
          </div>
          <div class="list">
            <button class="item active">Result</button>
            <button class="item">Result</button>
          </div>
        </div>
      </div>
`;

class P31CommandPalette extends HTMLElement {
  static get observedAttributes() { return ['placeholder']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


  connectedCallback() {
    
    
  }
}

customElements.define('p31-cmdk', P31CommandPalette);
