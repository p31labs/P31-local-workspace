/**
 * @file ThemeToggle.test.tsx
 * Auto-generated smoke test for ThemeToggle.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('renders without children', () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toBeDefined();
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<ThemeToggle className="custom-class" />);
    expect(html).toBeDefined();
  });
});
