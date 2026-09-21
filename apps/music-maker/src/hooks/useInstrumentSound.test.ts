import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInstrumentSound } from './useInstrumentSound';

/**
 * A2 regression guard: the hook owns NO AudioContext. The engine is the single
 * context owner (created inside enable(), the user gesture). Previously the
 * hook created its own context, so a session had two — one dead, never closed.
 *
 * Also pins the master-prompt rule: sound starts OFF every session, with NO
 * localStorage persistence. A fresh session is always silent until a tap.
 */

describe('useInstrumentSound', () => {
  it('never creates an AudioContext — the engine is the sole owner', () => {
    const Ctor = vi.fn(() => ({}));
    // Stub the constructor on the EXISTING window (do not replace window —
    // react-dom needs the real jsdom window during render).
    vi.stubGlobal('AudioContext', Ctor);
    const { result } = renderHook(() => useInstrumentSound());
    // Toggle on + off twice: the hook only flips the session flag.
    act(() => result.current.toggle());
    act(() => result.current.toggle());
    act(() => result.current.toggle());
    expect(Ctor).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('starts OFF every session — no localStorage persistence', () => {
    localStorage.setItem('music-maker:sound', 'on');
    const { result } = renderHook(() => useInstrumentSound());
    // Even with a stale stored preference, a fresh session is silent.
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem('music-maker:sound')).toBe('on'); // never read/written
  });

  it('flips the session flag on toggle', () => {
    const { result } = renderHook(() => useInstrumentSound());
    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(false);
  });
});