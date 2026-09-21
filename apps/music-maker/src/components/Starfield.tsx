/**
 * The music maker — Starfield.
 *
 * The canon starfield background: a fixed Canvas-2D particle layer behind the
 * WebGL scene. Adopts the canon's own surface — the `.starfield-bg` recipe
 * (fixed layer at --p31-z-starfield, pointer-events:none) and the
 * --p31-starfield-* tokens — rather than inventing a new one.
 *
 * Canvas 2D is the right layer for a BACKGROUND field (the research: dense
 * animated fields with pointer interaction run extremely efficiently in
 * Canvas 2D; WebGL is for the foreground scene). Stars are REUSED (no per-
 * frame allocation — the vive-starry-night pattern), count is scaled from
 * canvas size, drift is a slow parallax. Reduced motion draws a single static
 * frame; the canon recipe hides the layer entirely at spoons===0.
 *
 * Token contract: no hex/rgb/oklch literals. Colors resolve from --p31-*
 * tokens via resolveToken (the Canvas-2D string resolver), so the starfield
 * inherits the active theme exactly like the Loom's canvases.
 */
import { useEffect, useRef } from 'react';
import { resolveToken } from '../lib/tokens';

interface Star {
  x: number;   // 0..1 of width
  y: number;   // 0..1 of height
  z: number;   // 0..1 depth for parallax (1 = far, slow)
  size: number;
  twinkle: number; // phase
  color: string;   // resolved token color (cached)
}

const MAX_STARS = 240;

/** Resolve the starfield colors once (cached; theme changes re-resolve via the
 *  token probe's cache invalidation on watchTheme). */
function starColors(): { teal: string; coral: string; hearth: string; remembrance: string } {
  return {
    teal: resolveToken('--p31-starfield-teal'),
    coral: resolveToken('--p31-starfield-particle-coral'),
    hearth: resolveToken('--p31-starfield-hearth'),
    remembrance: resolveToken('--p31-starfield-remembrance'),
  };
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stars: Star[] = [];
    const colors = () => starColors();
    const palette: string[] = [];
    let raf = 0;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Density scales with canvas size — larger canvas → more stars.
      const count = Math.min(MAX_STARS, Math.floor((w * h) / 9000));
      const c = colors();
      palette.length = 0;
      palette.push(c.teal, c.coral, c.hearth, c.remembrance);
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        z: 0.2 + Math.random() * 0.8,
        size: 0.6 + Math.random() * 1.6,
        twinkle: Math.random() * Math.PI * 2,
        color: palette[Math.floor(Math.random() * palette.length)],
      }));
    };
    build();

    const draw = (t: number) => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const time = t / 1000;
      for (const s of stars) {
        // Slow parallax drift; far stars (z→1) drift least.
        const sx = (s.x * w + time * 6 * (1 - s.z)) % w;
        const sy = (s.y * h + time * 2 * (1 - s.z)) % h;
        const alpha = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(time * 1.2 + s.twinkle));
        ctx.globalAlpha = alpha * s.z;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(sx, sy, s.size * s.z, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    if (reduceMotion) draw(0);
    else raf = requestAnimationFrame(loop);

    const onResize = () => { build(); if (reduceMotion) draw(0); };
    window.addEventListener('resize', onResize);
    // Re-resolve colors on theme change (the token probe invalidates on
    // data-theme mutation — rebuild keeps the cached palette fresh).
    const reTheme = () => { build(); };
    const observer = new MutationObserver(reTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="starfield-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}