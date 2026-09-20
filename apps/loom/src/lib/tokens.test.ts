import { describe, it, expect } from 'vitest';
import { resolveToken } from './tokens';

describe('resolveToken', () => {
  it('resolves against the .loom-shell context, not document.body', () => {
    const shell = document.createElement('div');
    shell.className = 'loom-shell';
    document.body.appendChild(shell);

    // First resolution of this token (uncached) — the probe is (re)parented.
    resolveToken('--p31-accent');

    // The probe lives inside the shell, so shell-scoped overrides — e.g.
    // [data-saturation='muted'] re-rooting --p31-accent — reach the canvas.
    const probe = shell.querySelector('span[aria-hidden="true"]');
    expect(probe).not.toBeNull();

    shell.remove();
  });

  it('falls back to the literal when a token does not resolve', () => {
    const value = resolveToken('--p31-accent');
    expect(value).toBe('rgb(0, 240, 255)');
  });
});
