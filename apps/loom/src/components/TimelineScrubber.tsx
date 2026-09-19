import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  logLength: number;
  currentSeq: number;
  onSeqChange: (seq: number) => void;
}

export function TimelineScrubber({ logLength, currentSeq, onSeqChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);
  const last = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const tick = (t: number) => {
      if (t - last.current >= 1000) {
        last.current = t;
        if (currentSeq >= logLength - 1) {
          setPlaying(false);
          return;
        }
        onSeqChange(currentSeq + 1);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, currentSeq, logLength, onSeqChange]);

  const max = Math.max(0, logLength - 1);

  return (
    <div className="scrub">
      <button className="loom-btn" onClick={() => setPlaying((p) => !p)}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        min={0}
        max={max}
        value={Math.min(currentSeq, max)}
        onChange={(e) => onSeqChange(Number(e.target.value))}
        className="scrub-range"
      />
      <span className="scrub-pos">
        seq {currentSeq} / {max}
      </span>
    </div>
  );
}
