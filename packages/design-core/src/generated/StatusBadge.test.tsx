/**
 * @file StatusBadge.test.tsx
 * Auto-generated smoke test for StatusBadge.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<StatusBadge>Test content</StatusBadge>);
    expect(html).toContain('Test content');
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<StatusBadge className="custom-class">Test</StatusBadge>);
    expect(html).toContain('custom-class');
  });
});
