/**
 * @file SpoonDial.test.tsx
 * Auto-generated smoke test for SpoonDial.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpoonDial } from './SpoonDial.js';

describe('SpoonDial', () => {
  it('renders without children', () => {
    const html = renderToStaticMarkup(<SpoonDial />);
    expect(html).toBeDefined();
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<SpoonDial className="custom-class" />);
    expect(html).toBeDefined();
  });
});
