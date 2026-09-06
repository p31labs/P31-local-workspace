// src/engine/confetti.ts
// Lightweight CSS confetti — no canvas, no dependencies.
// Enhanced: 3D rotation, shape variety, gravity curve.

import { CONFETTI } from '../config/easterEggs';

let styleInjected = false;

function injectStyle(): void {
  if (styleInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes confetti-fall {
      0%   { transform: translateY(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg); opacity: 1; }
      25%  { opacity: 1; }
      100% { transform: translateY(100vh) rotateX(var(--rx)) rotateY(var(--ry)) rotateZ(var(--rz)); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  styleInjected = true;
}

// Shape variants: rectangle, circle, diamond
const SHAPES = [
  'border-radius:1px;',                           // rectangle
  'border-radius:50%;',                            // circle
  'border-radius:2px;transform:rotate(45deg);',    // diamond
];

export function spawnConfetti(count: number = CONFETTI.normalCount): void {
  injectStyle();

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const color = CONFETTI.colors[Math.floor(Math.random() * CONFETTI.colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const size = 4 + Math.random() * 8;
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    // 3D rotation end values (randomized per piece)
    const rx = 360 + Math.random() * 720;
    const ry = 360 + Math.random() * 540;
    const rz = 180 + Math.random() * 720;
    const duration = 1.5 + Math.random() * 1.0;
    // Aspect ratio varies — some squat, some tall
    const aspect = 0.8 + Math.random() * 1.4;

    piece.style.cssText = `
      position:absolute;top:-20px;left:${left}%;
      width:${size}px;height:${size * aspect}px;
      background:${color};${shape}
      --rx:${rx}deg;--ry:${ry}deg;--rz:${rz}deg;
      animation:confetti-fall ${duration}s cubic-bezier(0.25,0.1,0.25,1) ${delay}s forwards;
    `;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), CONFETTI.duration + 500);
}
