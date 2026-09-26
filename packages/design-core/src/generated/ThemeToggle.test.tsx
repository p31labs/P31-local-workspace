/**
 * @file ThemeToggle.test.tsx
 * Auto-generated smoke test for ThemeToggle.
 * Uses client-side rendering (jsdom) because ThemeToggle accesses
 * localStorage/document inside useEffect — it cannot be server-rendered.
 * @vitest-environment jsdom
 */

import { describe, it, expect, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { ThemeToggle } from './ThemeToggle.js';

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
});

describe('ThemeToggle', () => {
  it('renders without children', () => {
    const { container } = renderIntoContainer(<ThemeToggle />);
    expect(container.querySelector('button')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = renderIntoContainer(<ThemeToggle className="custom-class" />);
    expect(container.querySelector('button.custom-class')).toBeTruthy();
  });
});