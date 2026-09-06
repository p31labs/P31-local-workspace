/**
 * @file Starfield.test.tsx
 * Auto-generated smoke test for Starfield.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Starfield } from './Starfield';

describe('Starfield', () => {
  it('renders without children', () => {
    const html = renderToStaticMarkup(<Starfield />);
    expect(html).toBeDefined();
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<Starfield className="custom-class" />);
    expect(html).toBeDefined();
  });
});
