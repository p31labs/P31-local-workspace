export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
  gravity?: number;
}

export class ParticleSystem {
  particles: Particle[] = [];
  ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  emit(x: number, y: number, count: number, config: Partial<Particle> = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 4,
        color: config.color || '#00F0FF',
        gravity: config.gravity ?? 0.04,
      });
    }
    if (this.particles.length > 1500) this.particles = this.particles.slice(-1000);
    return this;
  }

  update(dt = 0.016) {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.vx *= 0.99;
      p.life -= dt * 0.6;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw() {
    for (const p of this.particles) {
      const radius = p.size * p.life;
      if (radius < 0.5) continue;
      const alpha = Math.round(Math.min(1, p.life) * 200)
        .toString(16).padStart(2, '0');
      const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, p.color + 'ff');
      grad.addColorStop(0.3, p.color + alpha);
      grad.addColorStop(1, p.color + '00');
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();
    }
  }

  clear() { this.particles = []; }
}
