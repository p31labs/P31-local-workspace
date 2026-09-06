import { describe, it, expect } from 'vitest';
import { validateUI, validateComponentNames, getManifest, getAllowedComponents } from './index';

describe('validateUI', () => {
  it('passes on valid HTML with all required attributes', () => {
    const html = `<div data-spoons="3" data-size-class="regular" class="glass-card">Hello</div>`;
    const result = validateUI(html);
    expect(result.valid).toBe(true);
  });

  it('rejects dynamic className template literals', () => {
    const html = `<div class={\`glass-card text-\${color}\`}>Hello</div>`;
    const result = validateUI(html);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Dynamic className'))).toBe(true);
  });

  it('rejects missing data-spoons', () => {
    const html = `<div data-size-class="regular">Hello</div>`;
    const result = validateUI(html);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('data-spoons'))).toBe(true);
  });

  it('rejects missing data-size-class', () => {
    const html = `<div data-spoons="3">Hello</div>`;
    const result = validateUI(html);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('data-size-class'))).toBe(true);
  });

  it('warns on cards without glass-card', () => {
    const html = `<div data-spoons="3" data-size-class="regular" class="card">Hello</div>`;
    const result = validateUI(html);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('glass-card'))).toBe(true);
  });

  it('warns on links without link-glow', () => {
    const html = `<div data-spoons="3" data-size-class="regular"><a href="/">Home</a></div>`;
    const result = validateUI(html);
    expect(result.warnings.some((w) => w.includes('link-glow'))).toBe(true);
  });

  it('rejects inline hex colors', () => {
    const html = `<div data-spoons="3" data-size-class="regular" style="color: #FF0000">Hello</div>`;
    const result = validateUI(html);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Inline hex colors'))).toBe(true);
  });

  it('warns on pure white text', () => {
    const html = `<div data-spoons="3" data-size-class="regular" style="color: #FFFFFF">Hello</div>`;
    const result = validateUI(html);
    expect(result.warnings.some((w) => w.includes('Pure white'))).toBe(true);
  });

  it('warns on pure black background', () => {
    const html = `<div data-spoons="3" data-size-class="regular" style="background: #000000">Hello</div>`;
    const result = validateUI(html);
    expect(result.warnings.some((w) => w.includes('Pure black'))).toBe(true);
  });

  it('allows fragments without spoons/size-class when flag is set', () => {
    const html = `<span class="glass-card">Fragment</span>`;
    const result = validateUI(html, { allowMissingSpoons: true, allowMissingSizeClass: true });
    expect(result.valid).toBe(true);
  });
});

describe('validateComponentNames', () => {
  it('passes for allowed components', () => {
    const result = validateComponentNames(['GlassCard', 'GlowButton', 'Section']);
    expect(result.valid).toBe(true);
  });

  it('rejects unknown components', () => {
    const result = validateComponentNames(['UnknownComponent']);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('not in the allowed component list'))).toBe(true);
  });
});

describe('manifest accessors', () => {
  it('getManifest returns the manifest', () => {
    const manifest = getManifest();
    expect(manifest.version).toBe('2025.10');
    expect(manifest.invariants.tetra.vertices).toBe(4);
  });

  it('getAllowedComponents returns the full list', () => {
    const components = getAllowedComponents();
    expect(components).toContain('GlassCard');
    expect(components).toContain('GreyRock');
    expect(components.length).toBeGreaterThan(10);
  });
});
