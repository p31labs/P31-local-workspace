// ═══════════════════════════════════════════════════════
// ShootingStars — Ambient wonder
// Rare white streaks across the void. Tap to catch.
// Blood Moon (March 3): red-orange meteor shower.
// ═══════════════════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react';
import { SHOOTING_STARS, isBloodMoon } from '../config/bloodMoon';
import { useGameStore } from '../store/gameStore';
import { playLoveChime } from '../engine/sound';

interface Star {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  age: number;
  caught: boolean;
}

let nextStarId = 0;

export function ShootingStars() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const pushToast = useGameStore((s) => s.pushToast);
  const addLove = useGameStore((s) => s.addLove);

  const spawnStar = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Start from a random edge
    const edge = Math.floor(Math.random() * 3); // top, left, right
    let x: number, y: number;
    if (edge === 0) { x = Math.random() * w; y = -10; }
    else if (edge === 1) { x = -10; y = Math.random() * h * 0.5; }
    else { x = w + 10; y = Math.random() * h * 0.5; }

    // Direction: streak across 30-60% of viewport
    const angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.3; // 36–90 degrees
    const speed = (w * 0.4 + Math.random() * w * 0.2) / (SHOOTING_STARS.duration / 16);
    const dx = (edge === 2 ? -1 : 1) * Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;

    starsRef.current.push({
      id: nextStarId++,
      x, y, dx, dy,
      age: 0,
      caught: false,
    });
  }, []);

  const checkCatch = useCallback((clientX: number, clientY: number) => {
    const hitbox = SHOOTING_STARS.tapHitbox;
    for (const star of starsRef.current) {
      if (star.caught) continue;
      const dist = Math.hypot(star.x - clientX, star.y - clientY);
      if (dist < hitbox) {
        star.caught = true;

        // Award LOVE
        addLove(SHOOTING_STARS.tapReward);
        playLoveChime(SHOOTING_STARS.tapReward);

        // Tap toast
        pushToast({
          icon: '\u{2728}',
          text: SHOOTING_STARS.tapToast,
          duration: 2500,
        });

        // Increment counter + check milestones
        const count = parseInt(localStorage.getItem(SHOOTING_STARS.storageKey) ?? '0', 10) + 1;
        localStorage.setItem(SHOOTING_STARS.storageKey, String(count));

        for (const milestone of SHOOTING_STARS.achievements) {
          if (count === milestone.count) {
            const achieveKey = `bonding_achieve_${milestone.id}`;
            if (!localStorage.getItem(achieveKey)) {
              localStorage.setItem(achieveKey, '1');
              pushToast({
                icon: milestone.toast.charAt(0),
                text: milestone.toast,
                duration: 4000,
              });
            }
          }
        }
        return;
      }
    }
  }, [addLove, pushToast]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn loop
    const scheduleNext = () => {
      const interval = isBloodMoon()
        ? SHOOTING_STARS.bloodMoonIntervalMs
        : SHOOTING_STARS.normalIntervalMs;
      // Randomize ±50%
      const delay = interval * (0.5 + Math.random());
      timerRef.current = setTimeout(() => {
        spawnStar();
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    // Render loop
    const bloodMoon = isBloodMoon();
    const color = bloodMoon ? SHOOTING_STARS.colors.bloodMoon : SHOOTING_STARS.colors.normal;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const alive: Star[] = [];
      for (const star of starsRef.current) {
        star.x += star.dx;
        star.y += star.dy;
        star.age += 16;

        if (star.age > SHOOTING_STARS.duration || star.caught) continue;

        const progress = star.age / SHOOTING_STARS.duration;
        const headOpacity = SHOOTING_STARS.headOpacity * (1 - progress * 0.5);

        // Trail
        const trail = SHOOTING_STARS.trailLength;
        const gradient = ctx.createLinearGradient(
          star.x - star.dx * (trail / Math.hypot(star.dx, star.dy)),
          star.y - star.dy * (trail / Math.hypot(star.dx, star.dy)),
          star.x, star.y,
        );
        gradient.addColorStop(0, `${color}00`);
        gradient.addColorStop(0.7, `${color}${Math.round(SHOOTING_STARS.tailOpacity * 255 * (1 - progress)).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${color}${Math.round(headOpacity * 255).toString(16).padStart(2, '0')}`);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = SHOOTING_STARS.width;
        ctx.lineCap = 'round';
        const len = trail / Math.hypot(star.dx, star.dy);
        ctx.moveTo(star.x - star.dx * len, star.y - star.dy * len);
        ctx.lineTo(star.x, star.y);
        ctx.stroke();

        // Head glow
        ctx.beginPath();
        ctx.fillStyle = `${color}${Math.round(headOpacity * 200).toString(16).padStart(2, '0')}`;
        ctx.arc(star.x, star.y, 3, 0, Math.PI * 2);
        ctx.fill();

        alive.push(star);
      }
      starsRef.current = alive;

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    // Touch/click handler — on document so it doesn't block game input
    const handleTap = (e: PointerEvent) => {
      checkCatch(e.clientX, e.clientY);
    };
    document.addEventListener('pointerdown', handleTap);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('pointerdown', handleTap);
    };
  }, [spawnStar, checkCatch]);

  return (
    <div ref={containerRef} className="fixed inset-0" style={{ zIndex: 1, pointerEvents: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      />
    </div>
  );
}
