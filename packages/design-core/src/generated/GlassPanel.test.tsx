/**
 * @file GlassPanel.test.tsx
 * Auto-generated smoke test for GlassPanel.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GlassPanel } from './GlassPanel.js';

describe('GlassPanel', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<GlassPanel>Test content</GlassPanel>);
    expect(html).toContain('Test content');
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<GlassPanel className="custom-class">Test</GlassPanel>);
    expect(html).toContain('custom-class');
  });
});
