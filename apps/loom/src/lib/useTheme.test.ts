import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to the warm family theme', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('family');
    expect(result.current.current.label).toBe('Family');
  });

  it('cycles through the canon themes and persists the choice', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.cycleTheme());
    expect(result.current.theme).not.toBe('family');
    expect(localStorage.getItem('loom:theme')).toBe(result.current.theme);
  });

  it('restores a saved theme on mount', () => {
    localStorage.setItem('loom:theme', 'cipher');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('cipher');
  });
});
