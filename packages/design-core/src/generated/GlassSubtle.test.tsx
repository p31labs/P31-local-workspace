/**
 * @file GlassSubtle.test.tsx
 * Auto-generated smoke test for GlassSubtle.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GlassSubtle } from './GlassSubtle.js';

describe('GlassSubtle', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<GlassSubtle>Test content</GlassSubtle>);
    expect(html).toContain('Test content');
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<GlassSubtle className="custom-class">Test</GlassSubtle>);
    expect(html).toContain('custom-class');
  });
});
