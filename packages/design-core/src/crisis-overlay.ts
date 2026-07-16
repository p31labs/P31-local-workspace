/**
 * P31 Crisis Overlay — Web Component.
 * Full-screen breathing exercise for spoons === 0.
 * Works in ANY framework (React, Astro, Vite, vanilla HTML).
 * Usage: <p31-crisis-overlay onready="..."></p31-crisis-overlay>
 *
 * Import this file to auto-register the custom element.
 * Or call registerP31CrisisOverlay() for manual registration.
 */

import { COLORS } from './math/colors';
import { FONT_FAMILY } from './math/typography';

const isBrowser = typeof window !== 'undefined' && typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined';

const STYLES = `
  :host {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--p31-void, ${COLORS.void});
    font-family: var(--p31-font-sans, ${FONT_FAMILY.sans});
  }
  .breath-circle {
    width: 160px;
    height: 160px;
    border-radius: 9999px;
    border: 2px solid var(--p31-accent, ${COLORS.accent});
    animation: p31-breathe 4s ease-in-out infinite;
  }
  .message {
    margin-top: 32px;
    color: var(--p31-cloud, ${typeof COLORS.cloud === 'string' ? COLORS.cloud : '#A1A1AA'});
    font-size: 14px;
    text-align: center;
  }
  .exit-btn {
    margin-top: 32px;
    padding: 16px 32px;
    background: var(--p31-accent, ${COLORS.accent});
    color: var(--p31-void, ${COLORS.void});
    font-weight: 700;
    font-size: 18px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: opacity 0.2s;
    font-family: var(--p31-font-sans, ${FONT_FAMILY.sans});
  }
  .exit-btn:hover { opacity: 0.8; }
  @keyframes p31-breathe {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.18); opacity: 1; }
  }
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

let P31CrisisOverlay: any;

if (isBrowser) {
  P31CrisisOverlay = class P31CrisisOverlay extends HTMLElement {
    static get observedAttributes() { return ['message', 'button-label']; }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.render();
      this.addEventListener('keydown', this._onKey as EventListener);
      window.addEventListener('keydown', this._onKey as EventListener);
    }

    disconnectedCallback() {
      window.removeEventListener('keydown', this._onKey as EventListener);
    }

    attributeChangedCallback() {
      if (this.shadowRoot) this.render();
    }

    private _onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this._fireReady();
    };

    private _fireReady() {
      this.dispatchEvent(new CustomEvent('p31-ready', { bubbles: true, composed: true }));
      const fn = (this as any).onready;
      if (typeof fn === 'function') fn();
    }

    private render() {
      const msg = this.getAttribute('message') || 'Rest. Breathe. You can exit when ready.';
      const btn = this.getAttribute('button-label') || "I'm Ready";

      this.shadowRoot!.innerHTML = `
        <style>${STYLES}</style>
        <div class="container" role="alert" aria-live="assertive">
          <div class="breath-circle" aria-hidden="true"></div>
          <p class="message">${msg}</p>
          <button class="exit-btn">${btn}</button>
        </div>
      `;

      this.shadowRoot!.querySelector('.exit-btn')!
        .addEventListener('click', () => this._fireReady());
    }
  };
}

let registered = false;

export function registerP31CrisisOverlay(tagName = 'p31-crisis-overlay'): void {
  if (!isBrowser || registered) return;
  if (!customElements.get(tagName) && P31CrisisOverlay) {
    customElements.define(tagName, P31CrisisOverlay);
  }
  registered = true;
}

if (isBrowser) {
  registerP31CrisisOverlay();
}
