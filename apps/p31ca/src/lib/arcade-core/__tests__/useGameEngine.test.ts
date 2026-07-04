import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameEngine } from '../useGameEngine';

const saveScoreMock = vi.fn();
const saveSessionMock = vi.fn().mockResolvedValue('session-1');

vi.mock('../useGameSave', () => ({
  useGameSave: () => ({
    highScore: 0,
    recentScores: [] as Array<{ score: number; date: string }>,
    loading: false,
    saveScore: saveScoreMock,
    refresh: vi.fn(),
    getSaveState: () => ({ highScore: 0, recentScores: [] }),
    saveSession: saveSessionMock,
  }),
}));

describe('useGameEngine', () => {
  it('starts idle with initial state', () => {
    const { result } = renderHook(() => useGameEngine({ slug: 'test', title: 'Test' }));
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.spoons).toBe(4);
  });

  it('transitions idle -> running -> complete', async () => {
    const { result } = renderHook(() => useGameEngine({ slug: 'test', title: 'Test' }));
    expect(result.current.state.status).toBe('idle');

    await act(async () => result.current.start());
    expect(result.current.state.status).toBe('running');

    await act(async () => result.current.complete());
    expect(result.current.state.status).toBe('complete');
  });

  it('adds and reads score', async () => {
    const { result } = renderHook(() => useGameEngine({ slug: 'test', title: 'Test' }));
    await act(async () => result.current.start());
    await act(async () => result.current.addScore(10));
    await act(async () => result.current.addScore(5));
    expect(result.current.state.score).toBe(15);
  });

  it('pauses and resumes', async () => {
    const { result } = renderHook(() => useGameEngine({ slug: 'test', title: 'Test' }));
    await act(async () => result.current.start());
    await act(async () => result.current.pause());
    expect(result.current.state.status).toBe('paused');
    await act(async () => result.current.resume());
    expect(result.current.state.status).toBe('running');
  });

  it('resets to idle', async () => {
    const { result } = renderHook(() => useGameEngine({ slug: 'test', title: 'Test' }));
    await act(async () => result.current.start());
    await act(async () => result.current.addScore(25));
    await act(async () => result.current.reset());
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.score).toBe(0);
  });
});
