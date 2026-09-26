/**
 * @file HonestLabel.test.tsx
 * Auto-generated smoke test for HonestLabel.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HonestLabel } from './HonestLabel.js';

describe('HonestLabel', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<HonestLabel>Test content</HonestLabel>);
    expect(html).toContain('Test content');
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<HonestLabel className="custom-class">Test</HonestLabel>);
    expect(html).toContain('custom-class');
  });
});
