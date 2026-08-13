import { useEffect, useRef } from 'react';
import { useActiveTimeline } from '../store/datasetStore';
import { formatTimestampShort } from '../engine/timeSeries';

export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4] as const;

export function advancePlayback(currentIndex: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  const next = currentIndex + 1;
  return next >= frameCount ? 0 : next;
}

export default function TimeControls() {
  const timeline = useActiveTimeline();
  const currentTimeIndexRef = useRef(timeline?.currentTimeIndex ?? 0);

  useEffect(() => {
    if (timeline) currentTimeIndexRef.current = timeline.currentTimeIndex;
  }, [timeline?.currentTimeIndex]);

  useEffect(() => {
    if (!timeline || !timeline.isPlaying) return;
    const id = window.setInterval(() => {
      timeline.setCurrentTimeIndex(advancePlayback(currentTimeIndexRef.current, timeline.frameCount));
    }, 1000 / timeline.playbackSpeed);
    return () => window.clearInterval(id);
  }, [timeline?.isPlaying, timeline?.playbackSpeed, timeline?.frameCount, timeline?.setCurrentTimeIndex]);

  if (!timeline) return null;

  const { timestamps, frameCount, currentTimeIndex, isPlaying, playbackSpeed } = timeline;

  return (
    <div style={{
      background: 'rgba(6,10,18,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '8px 14px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: '#e0e4ec',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <button
        onClick={() => timeline.setIsPlaying(!isPlaying)}
        style={{
          background: 'rgba(34,211,238,0.15)',
          color: '#22d3ee',
          border: '1px solid rgba(34,211,238,0.3)',
          borderRadius: 6,
          width: 28,
          height: 24,
          cursor: 'pointer',
          fontSize: 10,
          lineHeight: '24px',
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <input
        type="range"
        min={0}
        max={frameCount - 1}
        step={1}
        value={currentTimeIndex}
        onChange={(e) => timeline.setCurrentTimeIndex(Number(e.target.value))}
        aria-label="Timeline scrubber"
        style={{
          width: 240,
          accentColor: '#22d3ee',
          cursor: 'pointer',
        }}
      />

      <span style={{ color: '#6a7a8a', whiteSpace: 'nowrap', minWidth: 180 }}>
        {currentTimeIndex + 1} / {frameCount} · {formatTimestampShort(timestamps[currentTimeIndex])}
      </span>

      <div style={{ display: 'flex', gap: 4 }}>
        {PLAYBACK_SPEEDS.map((speed) => {
          const active = playbackSpeed === speed;
          return (
            <button
              key={speed}
              onClick={() => timeline.setPlaybackSpeed(speed)}
              style={{
                background: active ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.05)',
                color: active ? '#22d3ee' : '#8899aa',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 5,
                padding: '3px 7px',
                cursor: 'pointer',
                fontSize: 9,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {speed}×
            </button>
          );
        })}
      </div>
    </div>
  );
}
