import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useOverworkPrompt } from '../hooks/useOverworkPrompt';
import { domeConfig } from '../config/domeConfig';

const ORIGINAL_MINUTES = domeConfig.data.focusReminderMinutes;

function mountHarness(initialSpoons: number) {
  let state: ReturnType<typeof useOverworkPrompt>;
  let spoons = initialSpoons;
  const Harness = () => {
    state = useOverworkPrompt(spoons);
    return null;
  };
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => {
    root.render(<Harness />);
  });
  return {
    getState: () => state,
    setSpoons: (s: number) => {
      spoons = s;
      act(() => {
        root.render(<Harness />);
      });
    },
    unmount: () => act(() => root.unmount()),
  };
}

describe('useOverworkPrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    domeConfig.data.focusReminderMinutes = 1;
  });

  afterEach(() => {
    domeConfig.data.focusReminderMinutes = ORIGINAL_MINUTES;
    vi.useRealTimers();
  });

  it('stays hidden before the focus threshold', () => {
    const h = mountHarness(4);
    act(() => vi.advanceTimersByTime(30_000));
    expect(h.getState().showPrompt).toBe(false);
    h.unmount();
  });

  it('shows the prompt after the threshold elapses', () => {
    const h = mountHarness(4);
    act(() => vi.advanceTimersByTime(65_000));
    expect(h.getState().showPrompt).toBe(true);
    expect(h.getState().elapsedMinutes).toBeGreaterThanOrEqual(1);
    h.unmount();
  });

  it('resets the focus clock when the user rests (spoons <= 1)', () => {
    const h = mountHarness(4);
    act(() => vi.advanceTimersByTime(65_000));
    expect(h.getState().showPrompt).toBe(true);

    h.setSpoons(0);
    expect(h.getState().showPrompt).toBe(false);

    act(() => vi.advanceTimersByTime(65_000));
    expect(h.getState().showPrompt).toBe(false);
    h.unmount();
  });

  it('dismiss resets the focus clock so it does not nag', () => {
    const h = mountHarness(4);
    act(() => vi.advanceTimersByTime(65_000));
    expect(h.getState().showPrompt).toBe(true);

    act(() => h.getState().onDismiss());
    expect(h.getState().showPrompt).toBe(false);

    act(() => vi.advanceTimersByTime(65_000));
    expect(h.getState().showPrompt).toBe(false);
    h.unmount();
  });

  it('is a no-op when the reminder is disabled (threshold 0)', () => {
    domeConfig.data.focusReminderMinutes = 0;
    const h = mountHarness(4);
    act(() => vi.advanceTimersByTime(120_000));
    expect(h.getState().showPrompt).toBe(false);
    h.unmount();
  });
});
