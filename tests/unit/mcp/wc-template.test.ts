import { describe, it, expect } from 'vitest';
import { generateWcTemplate, wcTagName } from '../../../packages/design-core/src/mcp/wc-template.js';
import { COMPONENT_DEFS } from '../../../packages/design-core/src/componentDefs.js';

describe('wcTagName', () => {
  it('kebab-cases css_class', () => {
    expect(wcTagName('glass-panel')).toBe('p31-glass-panel');
  });

  it('converts underscore to hyphen', () => {
    expect(wcTagName('some_class')).toBe('p31-some-class');
  });
});

describe('generateWcTemplate', () => {
  it('emits a self-registering custom element', () => {
    const def = COMPONENT_DEFS.GlassPanel;
    const out = generateWcTemplate('GlassPanel', def);
    expect(out).toContain('class P31GlassPanel extends HTMLElement');
    expect(out).toContain('customElements.define(');
    expect(out).toContain("if (!customElements.get('p31-glass-panel'))");
  });

  it('includes observedAttributes for GlassPanel', () => {
    const out = generateWcTemplate('GlassPanel', COMPONENT_DEFS.GlassPanel);
    expect(out).toContain('static get observedAttributes()');
  });

  it('SpoonDial builds dynamic buttons in connectedCallback', () => {
    const out = generateWcTemplate('SpoonDial', COMPONENT_DEFS.SpoonDial);
    expect(out).toContain('role="radiogroup"');
    expect(out).toContain("addEventListener('click'");
    expect(out).toContain("dispatchEvent(new CustomEvent('levelChange'");
  });

  it('StatusBadge wires status attribute to data-status', () => {
    const out = generateWcTemplate('StatusBadge', COMPONENT_DEFS.StatusBadge);
    expect(out).toContain('data-status');
    expect(out).toContain("badge.dataset.status");
  });

  it('CrisisOverlay sets role=dialog and dispatches ready event', () => {
    const out = generateWcTemplate('CrisisOverlay', COMPONENT_DEFS.CrisisOverlay);
    expect(out).toContain("setAttribute('role', 'dialog')");
    expect(out).toContain("setAttribute('aria-modal', 'true')");
    expect(out).toContain("dispatchEvent(new CustomEvent('ready'");
  });

  it('Button dispatches click events', () => {
    const out = generateWcTemplate('Button', COMPONENT_DEFS.Button);
    expect(out).toContain("addEventListener('click'");
  });

  it('Starfield renders static canvas layer', () => {
    const out = generateWcTemplate('Starfield', COMPONENT_DEFS.Starfield);
    expect(out).toContain('<canvas');
    expect(out).toContain('pointer-events: none');
  });

  it('MetricBadge renders slot structure', () => {
    const out = generateWcTemplate('MetricBadge', COMPONENT_DEFS.MetricBadge);
    expect(out).toContain('class="metric"');
    expect(out).toContain('slot name="icon"');
  });

  it('all 10 components generate without error', () => {
    for (const name of Object.keys(COMPONENT_DEFS)) {
      const def = COMPONENT_DEFS[name];
      expect(() => generateWcTemplate(name, def)).not.toThrow();
    }
  });
});
