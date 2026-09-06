import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrainDump } from './useBrainDump';

describe('useBrainDump', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete (globalThis as any).fetch;
  });

  it('saves and loads drafts to localStorage', () => {
    const { result } = renderHook(() => useBrainDump());
    const draft = { title: 'Test', content: 'Draft content' } as any;
    act(() => {
      result.current.saveDraft(draft);
    });
    let loaded: any;
    act(() => {
      loaded = result.current.loadDraft();
    });
    expect(loaded).toEqual(draft);
  });

  it('clears drafts from localStorage', () => {
    const { result } = renderHook(() => useBrainDump());
    act(() => {
      result.current.saveDraft({ title: 'Test' } as any);
    });
    act(() => {
      result.current.clearDraft();
    });
    let loaded: any;
    act(() => {
      loaded = result.current.loadDraft();
    });
    expect(loaded).toBeNull();
  });

  it('returns null when localStorage has no draft', () => {
    const { result } = renderHook(() => useBrainDump());
    expect(result.current.loadDraft()).toBeNull();
  });

  it('handles JSON parse errors gracefully when loading corrupted draft', () => {
    const { result } = renderHook(() => useBrainDump());
    localStorage.setItem('jitterbug-draft', 'not-json');
    expect(result.current.loadDraft()).toBeNull();
  });

  it('handles localStorage quota errors silently when saving', () => {
    const { result } = renderHook(() => useBrainDump());
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    act(() => {
      result.current.saveDraft({ title: 'Test' } as any);
    });
    setItemSpy.mockRestore();
  });
});
