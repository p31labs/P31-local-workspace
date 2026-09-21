import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInstrumentSound } from './useInstrumentSound';

/**
 * A2 regression guard: the hook owns NO AudioContext. The engine is the single
 * context owner (created inside enable(), the user gesture). Previously the
 * hook created its own context, so a session had two — one dead, never closed.
 * This test pins that the hook alone constructs no context and never resumes.
 */

describe('useInstrumentSound', () => {
  it('never creates an AudioContext — the engine is the sole owner', () => {
    const Ctor = vi.fn(() => ({}));
    // Stub the constructor on the EXISTING window (do not replace window —
    // react-dom needs the real jsdom window during render).
    vi.stubGlobal('AudioContext', Ctor);
    const { result } = renderHook(() => useInstrumentSound());
    // Toggle on + off twice: the hook only flips localStorage state.
    act(() => result.current.toggle());
    act(() => result.current.toggle());
    act(() => result.current.toggle());
    expect(Ctor).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('persists the opt-in state per device (localStorage)', () => {
    localStorage.clear();
    const { result } = renderHook(() => useInstrumentSound());
    expect(result.current.enabled).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem('music-maker:sound')).toBe('on');
  });
});