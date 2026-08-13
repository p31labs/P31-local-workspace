import { describe, it, expect } from 'vitest';
import { advancePlayback, PLAYBACK_SPEEDS } from '../hud/TimeControls';

describe('advancePlayback', () => {
  it('advances forward within a timeline', () => {
    expect(advancePlayback(0, 10)).toBe(1);
    expect(advancePlayback(4, 10)).toBe(5);
    expect(advancePlayback(8, 10)).toBe(9);
  });

  it('loops from the last frame back to 0', () => {
    expect(advancePlayback(9, 10)).toBe(0);
    expect(advancePlayback(239, 240)).toBe(0);
  });

  it('loops 0 -> frameCount - 1 -> 0 across repeated calls', () => {
    const frameCount = 5;
    let index = 0;
    const seen = [index];
    for (let i = 0; i < frameCount * 2; i++) {
      index = advancePlayback(index, frameCount);
      seen.push(index);
    }
    expect(seen.slice(0, frameCount)).toEqual([0, 1, 2, 3, 4]);
    expect(seen.slice(frameCount, frameCount + 2)).toEqual([0, 1]);
  });

  it('handles degenerate frame counts', () => {
    expect(advancePlayback(0, 0)).toBe(0);
    expect(advancePlayback(0, 1)).toBe(0);
    expect(advancePlayback(7, 1)).toBe(0);
  });
});

describe('PLAYBACK_SPEEDS', () => {
  it('offers the documented speeds including 1x', () => {
    expect([...PLAYBACK_SPEEDS]).toEqual([0.5, 1, 2, 4]);
  });
});
