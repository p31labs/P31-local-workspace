import { describe, it, expect, vi } from 'vitest';
import { drawTrackedText } from './canvas-text';

/** A minimal Canvas 2D context double — jsdom has no real canvas rasterizer. */
function mockCtx() {
  const ctx = {
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    fillStyle: '',
    letterSpacing: '0px',
    fillText: vi.fn(),
    measureText: vi.fn((t: string) => ({ width: t.length * 8 })),
  } as unknown as CanvasRenderingContext2D;
  return ctx;
}

describe('drawTrackedText', () => {
  it('enforces the 12px minimum size (the canvas floor the CSS gate cannot see)', () => {
    const ctx = mockCtx();
    drawTrackedText(ctx, 'hi', 0, 0, { sizePx: 5, fillStyle: '#fff', fontFallback: 'monospace' });
    expect(ctx.font).toContain('12px');
  });

  it('leaves sizes above the floor unchanged', () => {
    const ctx = mockCtx();
    drawTrackedText(ctx, 'hi', 0, 0, { sizePx: 16, fillStyle: '#fff', fontFallback: 'monospace' });
    expect(ctx.font).toContain('16px');
  });

  it('applies letter spacing for multi-character text and resets it after', () => {
    const ctx = mockCtx();
    drawTrackedText(ctx, 'hello', 0, 0, { sizePx: 12, fillStyle: '#fff', fontFallback: 'monospace' });
    expect(ctx.letterSpacing).toBe('0px');
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('skips letter spacing for single characters', () => {
    const ctx = mockCtx();
    drawTrackedText(ctx, 'a', 0, 0, { sizePx: 12, fillStyle: '#fff', fontFallback: 'monospace' });
    expect(ctx.letterSpacing).toBe('0px');
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('scales the type by the density factor read from .loom-shell', () => {
    const shell = document.createElement('div');
    shell.className = 'loom-shell';
    shell.style.setProperty('--p31-layout-density-factor', '1.25');
    document.body.appendChild(shell);

    const ctx = mockCtx();
    drawTrackedText(ctx, 'hi', 0, 0, { sizePx: 20, fillStyle: '#fff', fontFallback: 'monospace' });
    expect(ctx.font).toContain('25px'); // 20 * 1.25

    shell.remove();
  });
});
