/**
 * The Loom — Instrument canvas.
 *
 * React's only job is to render the <canvas> once; after that JavaScript
 * draws directly on the 2D context. The scene (dots, lines, text, readouts)
 * comes from `layout()`; this component resolves token names to colors and
 * animates the pulse (the clock made visible).
 *
 * Reduced motion: under `prefers-reduced-motion` the pulse is drawn once and
 * the animation loop does not run — the instrument is a static reading.
 */
import { useEffect, useRef } from 'react';
import { TICK_BAND_Y, type Scene, type Reading } from '@p31/field';
import { resolveToken, watchTheme } from '../lib/tokens';

const PULSE_MS = 4000;
/** How far above the tick band a click still counts as "enter the trace scale". */
const TICK_BAND_HIT_PAD = 0.06;

interface Props {
  scene: Scene;
  reading: Reading;
  /** Zoom to a zone (constellation → zone); null returns to the field. */
  onFocus?: (id: string | null) => void;
  /** Enter the trace scale for the focused zone (from the zone's tick band). */
  onTrace?: () => void;
}

export function Instrument({ scene, reading, onFocus, onTrace }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const readingRef = useRef(reading);
  readingRef.current = reading;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const onTraceRef = useRef(onTrace);
  onTraceRef.current = onTrace;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (phase: number) => {
      const s = sceneRef.current;
      ctx.clearRect(0, 0, width, height);
      const unit = Math.min(width, height);

      // Lines (K₄ edges).
      ctx.lineCap = 'round';
      for (const l of s.lines) {
        ctx.strokeStyle = resolveToken(l.strokeToken);
        ctx.lineWidth = l.strokeWidth;
        ctx.beginPath();
        ctx.moveTo(l.x1 * width, l.y1 * height);
        ctx.lineTo(l.x2 * width, l.y2 * height);
        ctx.stroke();
      }

      // Dots. Fill opacity = pressure; stroke hue = hazard; width = pressure.
      for (const d of s.dots) {
        ctx.globalAlpha = d.fillOpacity;
        ctx.fillStyle = resolveToken(d.fillToken);
        ctx.strokeStyle = resolveToken(d.strokeToken);
        ctx.lineWidth = d.strokeWidth;
        ctx.beginPath();
        ctx.arc(d.x * width, d.y * height, d.r * unit, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Text.
      for (const t of s.text) {
        ctx.fillStyle = resolveToken(t.colorToken);
        ctx.font = `${t.weight} ${Math.max(10, t.size * height)}px ${
          t.mono ? 'var(--p31-font-mono, monospace)' : 'var(--p31-font-sans, sans-serif)'
        }`;
        ctx.textAlign = t.align ?? 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.text, t.x * width, t.y * height);
      }

      // Readouts — label, value, and a horizontal bar.
      for (const r of s.readouts) {
        const x = r.x * width;
        const y = r.y * height;
        const fontSize = Math.max(10, 0.014 * height);
        ctx.font = `500 ${fontSize}px var(--p31-font-mono, monospace)`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = resolveToken('--p31-text-tertiary');
        ctx.fillText(r.label, x, y);
        ctx.fillStyle = resolveToken('--p31-text');
        ctx.fillText(r.value, x + width * 0.10, y);
        if (r.bar !== undefined) {
          const bx = x + width * 0.20;
          const bw = width * 0.14;
          const bh = Math.max(2, 0.005 * height);
          const by = y - bh / 2;
          ctx.fillStyle = resolveToken('--p31-glass-border');
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = resolveToken(r.barToken ?? '--p31-accent');
          ctx.fillRect(bx, by, bw * Math.max(0, Math.min(1, r.bar)), bh);
        }
      }

      // Trace ticks — the time-axis sparkline (zone scale). One marker per
      // trace, positioned by ts along [0,1], sized by decay, colored by frame.
      for (const k of s.ticks) {
        ctx.fillStyle = resolveToken(k.frameToken);
        const x = k.t * width;
        const y = TICK_BAND_Y * height;
        const r = (0.004 + 0.006 * k.size) * unit;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // The pulse — a ring at the top that expands and fades with the clock.
      if (!reduceMotion) {
        const px = 0.5 * width;
        const py = 0.08 * height;
        const maxR = 0.05 * unit;
        ctx.strokeStyle = resolveToken('--p31-accent');
        ctx.globalAlpha = 1 - phase;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 0.008 * unit + phase * maxR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = resolveToken('--p31-accent');
        ctx.beginPath();
        ctx.arc(px, py, 0.006 * unit, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      draw((t % PULSE_MS) / PULSE_MS);
      raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onResize = () => {
      resize();
      draw(0);
    };
    window.addEventListener('resize', onResize);

    // Hit testing — manual, because Canvas 2D has no built-in hit regions
    // (AddHitRegion is deprecated and unimplemented). A linear scan of ≤64
    // dots is sub-millisecond. Click a dot to zoom to its zone; click empty
    // space to return to the field.
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const s = sceneRef.current;

      // The tick band (zone scale, below the K₄ and readouts) is the entry
      // gesture into the trace scale. Clicking there drills into the traces
      // rather than de-focusing.
      if (readingRef.current.scale === 'zone' && y >= TICK_BAND_Y - TICK_BAND_HIT_PAD) {
        onTraceRef.current?.();
        return;
      }

      let hit: string | null = null;
      for (const d of s.dots) {
        const dx = d.x - x;
        const dy = d.y - y;
        const target = Math.max(d.r, 0.014); // comfortable target, not just the dot
        if (Math.sqrt(dx * dx + dy * dy) <= target * 2) {
          hit = d.id;
          break;
        }
      }
      onFocusRef.current?.(hit);
    };
    canvas.addEventListener('click', onClick);

    const stopWatch = watchTheme(() => {
      if (reduceMotion) draw(0);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('click', onClick);
      stopWatch();
    };
  }, []);

  const summary =
    `Instrument, ${reading.scale} scale` +
    (reading.focus ? `, focused on ${reading.focus}` : '') +
    `. ${reading.zones.length} zones visible. ` +
    `entropy ${reading.complexity.entropy.toFixed(2)}, ` +
    `edge density ${reading.complexity.edgeDensity.toFixed(2)}, ` +
    `white space ${reading.complexity.whiteSpace.toFixed(2)}.`;

  return (
    <div className="instrument" role="img" aria-label={summary}>
      <canvas ref={canvasRef} className="instrument-canvas" />
      {reading.scale === 'zone' && (
        <span className="instrument-hint">click empty space to return to the field</span>
      )}
      <span className="instrument-sr" aria-hidden="false">
        {summary}
      </span>
    </div>
  );
}
