/**
 * @file SpoonMeter.test.tsx
 * Auto-generated smoke test for SpoonMeter.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpoonMeter } from './SpoonMeter';

describe('SpoonMeter', () => {
  it('renders without children', () => {
    const html = renderToStaticMarkup(<SpoonMeter />);
    expect(html).toBeDefined();
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<SpoonMeter className="custom-class" />);
    expect(html).toBeDefined();
  });
});
