import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Starfield } from './Starfield';

/**
 * The canon starfield background — pins the recipe surface: a fixed layer
 * (`.starfield-bg`) containing a canvas, so it sits behind the scene at
 * --p31-z-starfield with pointer-events none (the canon's own recipe).
 */

describe('Starfield', () => {
  it('renders the canon starfield-bg layer with a canvas', () => {
    const { container } = render(<Starfield />);
    const layer = container.querySelector('.starfield-bg');
    expect(layer).not.toBeNull();
    expect(layer?.querySelector('canvas')).not.toBeNull();
  });

  it('is aria-hidden (a pure background, never in the a11y tree)', () => {
    const { container } = render(<Starfield />);
    expect(container.querySelector('.starfield-bg')?.getAttribute('aria-hidden')).toBe('true');
  });
});