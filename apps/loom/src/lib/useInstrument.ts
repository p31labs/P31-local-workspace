/**
 * The Loom — Instrument projection hook.
 *
 * The seam between the log and the Instrument. Pure Field functions turn the
 * registry (zones), the warp (traces), and the weft (reads) into a Reading, a
 * constellation selection, and a layout Scene. Nothing here touches the
 * canvas; that is Instrument.tsx's job. The hook owns the clock: `atMs`
 * advances once a second, so the reading cools as the field cools.
 *
 * The "reading is writing" loop lives here: a focused read emits a `view.read`
 * weft event, which `tracesFromWeft` turns into a connection trace, which
 * feeds the field, which changes the next reading.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  zonesFromRegistry,
  tracesFromWarp,
  tracesFromWeft,
  projectInstrument,
  selectConstellation,
  layout,
  type Scene,
  type Reading,
  type ZoneReading,
  type WeftEventLike,
} from '@p31/field';
import registry from '@p31/canon/registry.json';
import type { LoomEvent } from '@p31/canon/loom/events';

const HALF_LIFE = 7 * 24 * 3600 * 1000;

export interface InstrumentState {
  reading: Reading;
  scene: Scene;
  visible: ZoneReading[];
  hidden: number;
  /** Deposit the current reading as a `view.read` weft event. Stable. */
  emitRead: (humanId: string | null) => void;
}

export function useInstrument(events: LoomEvent[], focus: string | null): InstrumentState {
  const zones = useMemo(() => zonesFromRegistry(registry), []);

  const [weftEvents, setWeftEvents] = useState<WeftEventLike[]>([]);
  useEffect(() => {
    let alive = true;
    fetch('/api/loom/weft')
      .then((r) => r.json())
      .then((es: WeftEventLike[]) => {
        if (alive && Array.isArray(es)) setWeftEvents(es);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // The field: warp traces + weft reads, together.
  const traces = useMemo(
    () => [...tracesFromWarp(events), ...tracesFromWeft(weftEvents)],
    [events, weftEvents],
  );

  // The clock. Advancing atMs makes decay visible without new traces.
  const [atMs, setAtMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAtMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const reading = useMemo(
    () => projectInstrument(zones, traces, atMs, focus, HALF_LIFE),
    [zones, traces, atMs, focus],
  );

  const { visible, hidden } = useMemo(
    () => selectConstellation(reading.zones),
    [reading.zones],
  );

  // At zone scale, layoutZone reports the focused zone's traces, not all.
  const focusedTraces = useMemo(
    () => (focus === null ? traces : traces.filter((t) => t.zone === focus)),
    [traces, focus],
  );

  const scene = useMemo(
    () => layout(reading, focusedTraces, visible, hidden, 0),
    [reading, focusedTraces, visible, hidden],
  );

  const warpSeq = useMemo(() => (events.length ? Math.max(...events.map((e) => e.seq)) : 0), [events]);

  const readingRef = useRef(reading);
  readingRef.current = reading;

  // Dedupe by reading signature so a material change emits once — this also
  // absorbs React StrictMode's double effect-invocation in dev. Log discrete
  // intent, not telemetry: re-reading the same zone without leaving it is not
  // a new act.
  const lastEmitRef = useRef<string | null>(null);

  const emitRead = useCallback(
    (humanId: string | null) => {
      const r = readingRef.current;
      const sig = `${r.scale}:${r.focus}`;
      if (lastEmitRef.current === sig) return;
      lastEmitRef.current = sig;

      const input = {
        kind: 'view.read' as const,
        scale: r.scale,
        focus: r.focus,
        entropy: r.complexity.entropy,
        whiteSpace: r.complexity.whiteSpace,
        warpSeq,
        ...(humanId ? { humanId } : {}),
      };
      fetch('/api/loom/weft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
        .then((res) => res.json())
        .then((data: { valid?: boolean; event?: WeftEventLike }) => {
          if (data.valid && data.event) {
            setWeftEvents((prev) => [...prev, data.event!]);
          }
        })
        .catch(() => {
          // middleware absent (production build) — no-op
        });
    },
    [warpSeq],
  );

  return { reading, scene, visible, hidden, emitRead };
}
