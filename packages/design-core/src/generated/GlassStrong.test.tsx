/**
 * @file GlassStrong.test.tsx
 * Auto-generated smoke test for GlassStrong.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GlassStrong } from './GlassStrong';

describe('GlassStrong', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<GlassStrong>Test content</GlassStrong>);
    expect(html).toContain('Test content');
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<GlassStrong className="custom-class">Test</GlassStrong>);
    expect(html).toContain('custom-class');
  });
});
