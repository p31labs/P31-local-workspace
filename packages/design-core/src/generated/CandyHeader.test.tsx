/**
 * @file CandyHeader.test.tsx
 * Auto-generated smoke test for CandyHeader.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CandyHeader } from './CandyHeader.js';

describe('CandyHeader', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<CandyHeader>Test content</CandyHeader>);
    expect(html).toContain('Test content');
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<CandyHeader className="custom-class">Test</CandyHeader>);
    expect(html).toContain('custom-class');
  });
});
