/**
 * @file TetraGrid.test.tsx
 * Auto-generated smoke test for TetraGrid.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TetraGrid } from './TetraGrid.js';

describe('TetraGrid', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<TetraGrid>Test content</TetraGrid>);
    expect(html).toContain('Test content');
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<TetraGrid className="custom-class">Test</TetraGrid>);
    expect(html).toContain('custom-class');
  });
});
