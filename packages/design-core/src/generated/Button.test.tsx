/**
 * @file Button.test.tsx
 * Auto-generated smoke test for Button.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from './Button.js';

describe('Button', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<Button>Test content</Button>);
    expect(html).toContain('Test content');
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<Button className="custom-class">Test</Button>);
    expect(html).toContain('custom-class');
  });
});
