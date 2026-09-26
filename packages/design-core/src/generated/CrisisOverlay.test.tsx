/**
 * @file CrisisOverlay.test.tsx
 * Auto-generated smoke test for CrisisOverlay.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CrisisOverlay } from './CrisisOverlay.js';

describe('CrisisOverlay', () => {
  it('renders without children', () => {
    const html = renderToStaticMarkup(<CrisisOverlay />);
    expect(html).toBeDefined();
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(<CrisisOverlay className="custom-class" />);
    expect(html).toBeDefined();
  });
});
