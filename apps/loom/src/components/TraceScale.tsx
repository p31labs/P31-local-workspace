import { useMemo, useRef, useState } from 'react';
import type { Trace } from '@p31/field';
import { FRAME_TOKEN } from '@p31/field';

interface Props {
  traces: Trace[];
  zoneId: string;
  onBack: () => void;
}

const ROW_H = 28;
const OVERSCAN = 6;
const VIRTUALIZE_ABOVE = 200;
const GAP_MS = 60 * 60 * 1000; // 1 hour — gaps larger than this render explicitly

function dayLabel(ts: number, now: number): string {
  const d = new Date(ts);
  const today = new Date(now);
  const yesterday = new Date(now - 24 * 3600 * 1000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString();
}

function formatGap(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function sameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** Pure windowing: which fixed-row-height rows to render for a scroll offset.
 *  Exported for direct unit testing — jsdom has no layout engine, so the
 *  component's `clientHeight` is always 0 there and the slice can only be
 *  exercised as a function, not through the DOM. */
export function windowSlice(
  total: number,
  rowH: number,
  scrollTop: number,
  viewportH: number,
  overscan: number,
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / rowH) - overscan);
  const end = Math.min(total, Math.ceil((scrollTop + viewportH) / rowH) + overscan);
  return { start, end };
}

/**
 * The trace scale — the atomic end of the field's zoom. A DOM waterfall: one
 * row per trace at the focused zone, time-ordered (not ordinal), grouped by
 * day, with explicit gap markers so a multi-hour wait renders as space, not
 * adjacency. Virtualized by a hand-rolled window (fixed row height). Read-only.
 */
export function TraceScale({ traces, zoneId, onBack }: Props) {
  const sorted = useMemo(() => [...traces].sort((a, b) => a.ts - b.ts), [traces]);

  const [scrollTop, setScrollTop] = useState(0);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const virtualize = sorted.length > VIRTUALIZE_ABOVE;
  const viewportH = bodyRef.current?.clientHeight ?? 400;
  const { start, end } = virtualize
    ? windowSlice(sorted.length, ROW_H, scrollTop, viewportH, OVERSCAN)
    : { start: 0, end: sorted.length };

  const slice = sorted.slice(start, end);
  const totalH = sorted.length * ROW_H;

  // Time normalization for the marker track (0..1 across the zone's span).
  const minTs = sorted.length ? sorted[0].ts : 0;
  const maxTs = sorted.length ? sorted[sorted.length - 1].ts : 0;
  const span = Math.max(1, maxTs - minTs);

  const now = Date.now();

  return (
    <div className="ts" role="region" aria-label={`${zoneId} traces`}>
      <div className="ts-head">
        <button className="ts-back" onClick={onBack}>
          ← {zoneId}
        </button>
        <span className="ts-count">{sorted.length} traces</span>
      </div>
      <div
        className="ts-body"
        ref={bodyRef}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
      >
        <div style={{ height: totalH, position: 'relative' }}>
          <div style={{ position: 'absolute', top: start * ROW_H, left: 0, right: 0 }}>
            {slice.map((tr, i) => {
              const idx = start + i;
              const prev = idx > 0 ? sorted[idx - 1] : null;
              const gap = prev ? tr.ts - prev.ts : 0;
              const newDay = prev ? !sameDay(tr.ts, prev.ts) : true;
              const pct = ((tr.ts - minTs) / span) * 100;
              return (
                <div key={`${tr.ts}:${tr.actor}:${idx}`} className="ts-row" style={{ height: ROW_H }}>
                  {newDay && (
                    <span className="ts-day">{dayLabel(tr.ts, now)}</span>
                  )}
                  {gap > GAP_MS && prev && (
                    <span className="ts-gap">+{formatGap(gap)}</span>
                  )}
                  <span className="ts-track" aria-hidden="true">
                    <span
                      className="ts-mark"
                      style={{ left: `${pct.toFixed(2)}%`, background: `var(${FRAME_TOKEN[tr.frame]})` }}
                    />
                  </span>
                  <span className="ts-pill" style={{ background: `var(${FRAME_TOKEN[tr.frame]})` }} />
                  <span className="ts-actor">{tr.actor}</span>
                  <span className="ts-coherence">{tr.coherence}</span>
                  <span className="ts-outcome">{tr.outcome ?? '—'}</span>
                  <span className="ts-ts">{new Date(tr.ts).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
