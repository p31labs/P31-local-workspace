/**
 * @file Starfield.test.tsx
 * Auto-generated smoke test for Starfield.
 * Uses client-side rendering (jsdom) because Starfield accesses window/canvas
 * inside useEffect — it cannot be server-rendered.
 * @vitest-environment jsdom
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Starfield } from './Starfield.js';

// The component resolves `react` from a different pnpm store than the test's
// react-dom in this monorepo layout, which trips React's "invalid hook call"
// guard. The smoke test only needs to prove the component mounts without
// throwing, so stub the DOM-dependent parts and unmock-react hooks.
let rafId = 0
const rafCallbacks = new Map<number, FrameRequestCallback>()
beforeEach(() => {
  rafId = 0
  rafCallbacks.clear()
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), fillStyle: '' })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
    const id = ++rafId
    rafCallbacks.set(id, cb)
    return id as unknown as number
  }) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = vi.fn((id: number) => {
    rafCallbacks.delete(id)
  }) as unknown as typeof cancelAnimationFrame;
});

function renderIntoContainer(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('Starfield', () => {
  it('renders without children', () => {
    const { container } = renderIntoContainer(<Starfield />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = renderIntoContainer(<Starfield className="custom-class" />);
    expect(container.querySelector('canvas.custom-class')).toBeTruthy();
  });
});