/**
 * @file GlassCard.test.tsx
 * Auto-generated smoke test for GlassCard.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<GlassCard>Test content</GlassCard>);
    expect(html).toContain('Test content');
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<GlassCard className="custom-class">Test</GlassCard>);
    expect(html).toContain('custom-class');
  });
});
