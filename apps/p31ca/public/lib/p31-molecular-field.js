/**
 * P31 S.M.A.R.T. Molecular Notification Field — v2.0 (QMU)
 * Spatial · Molecular · Actionable · Reactive · Transient
 *
 * No WebGL. No external deps. DOM divs + SVG bonds + rAF spring physics.
 * Full-viewport field; atoms anchor to bottom-right corner; circle→card morph.
 *
 * Usage:
 *   import { getMolecularField } from '/lib/p31-molecular-field.js';
 *   getMolecularField().notify({ severity: 'info', title: 'Mesh connected', groupId: 'mesh' });
 * Or globally:
 *   window.p31Notify({ severity: 'info', title: 'Build passed' });
 */

// QMU Palette
const QMU_COLOR = {
  info:     { hex: '#0ea5e9', shadow: 'rgba(14,165,233,0.45)'  },
  success:  { hex: '#10b981', shadow: 'rgba(16,185,129,0.45)'  },
  warning:  { hex: '#f59e0b', shadow: 'rgba(245,158,11,0.45)'  },
  critical: { hex: '#f43f5e', shadow: 'rgba(244,63,94,0.45)'   },
  mesh:     { hex: '#8b5cf6', shadow: 'rgba(139,92,246,0.45)'  },
};

// Physics profiles — SOLID / LIQUID / GAS / PLASMA
const PHYSICS = {
  SOLID:  { speed: 0.025, repel: 48,  bond: 0.08, wander: 0,    damp: 0.78 },
  LIQUID: { speed: 0.050, repel: 68,  bond: 0.04, wander: 0.30, damp: 0.86 },
  GAS:    { speed: 0.080, repel: 88,  bond: 0.01, wander: 0.80, damp: 0.92 },
  PLASMA: { speed: 0.150, repel: 110, bond: 0.05, wander: 2.40, damp: 0.96 },
};

const MAX_ATOMS    = 15;
const DEFAULT_LIFE = 8000;
const BOND_DIST    = 80;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// Inline SVG icons — no external deps
const ICON = {
  info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  critical:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  mesh:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
};

export class MolecularField {
  constructor() {
    this._atoms = new Map();  // id → atom state
    this._nodes = new Map();  // id → DOM element
    this._links = [];         // [{source, target}]
    this._qs    = 'LIQUID';
    this._raf   = null;
    this._wrap  = null;
    this._svg   = null;
    this._t     = 0;
    if (typeof document !== 'undefined') this._mount();
  }

  _mount() {
    const wrap = document.createElement('div');
    wrap.id = 'p31-mol-field';
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('aria-label', 'System notifications');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.className = 'p31-mol-bonds';
    svg.setAttribute('aria-hidden', 'true');
    wrap.appendChild(svg);

    document.body.appendChild(wrap);
    this._wrap = wrap;
    this._svg  = svg;
    this._loop();
  }

  /** @param {{ id?, groupId?, severity?, type?, title, message?, data?, lifespan? }} opts */
  notify(opts = {}) {
    const id       = opts.id       || Math.random().toString(36).slice(2, 10);
    const groupId  = opts.groupId  || null;
    const severity = opts.severity || opts.type || 'info';
    const title    = opts.title    || '';
    const msg      = opts.message  || (opts.data && typeof opts.data === 'object'
                       ? JSON.stringify(opts.data, null, 2) : opts.data) || '';
    const lifespan = opts.lifespan ?? DEFAULT_LIFE;

    if (this._atoms.size >= MAX_ATOMS) {
      const oldest = [...this._atoms.values()]
        .filter(a => !a.pinned)
        .sort((a, b) => a.born - b.born)[0];
      if (oldest) this._evict(oldest.id, true);
    }

    const W   = window.innerWidth, H = window.innerHeight;
    const spX = W - 70 + (Math.random() - 0.5) * 50;
    const spY = H - 70 + (Math.random() - 0.5) * 40;
    const qmu = QMU_COLOR[severity] || QMU_COLOR.info;
    const icn = ICON[severity]      || ICON.info;

    const el = document.createElement('div');
    el.className = 'p31-mol-atom';
    el.setAttribute('data-severity', severity);
    el.setAttribute('role', 'status');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', title);
    el.style.setProperty('--qmu-hex',    qmu.hex);
    el.style.setProperty('--qmu-shadow', qmu.shadow);

    const msgHtml  = msg ? `<p class="p31-mol-atom__msg">${esc(String(msg))}</p>` : '';
    const bondSpan = groupId
      ? `<span>BOND:${esc(String(groupId).split('_')[0])}</span><span aria-hidden="true">·</span>`
      : '';

    el.innerHTML = `
      <div class="p31-mol-atom__shell" aria-hidden="true">
        <div class="p31-mol-atom__glow"></div>
        <div class="p31-mol-atom__icon" style="color:${qmu.hex}">${icn}</div>
        <div class="p31-mol-atom__ping"></div>
      </div>
      <div class="p31-mol-atom__card">
        <div class="p31-mol-atom__card-icon" style="color:${qmu.hex}">${icn}</div>
        <div class="p31-mol-atom__card-body">
          <span class="p31-mol-atom__card-title">${esc(title)}</span>
          ${msgHtml}
          <div class="p31-mol-atom__card-meta">${bondSpan}<span>T-${(lifespan/1000).toFixed(0)}s</span></div>
        </div>
        <button class="p31-mol-atom__dismiss" aria-label="Dismiss">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;

    const a = {
      id, groupId, severity, title, lifespan, el,
      x: spX, y: spY,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      born:     Date.now(),
      pinned:   false,
      expanded: false,
      dead:     false,
    };
    this._atoms.set(id, a);
    this._nodes.set(id, el);

    el.addEventListener('pointerenter', () => { a.pinned = true; this._expand(id); });
    el.addEventListener('pointerleave', () => {
      if (!a.expanded) { a.pinned = false; this._scheduleDecay(id, 3000); }
    });
    el.addEventListener('click', e => {
      if (!e.target.closest('.p31-mol-atom__dismiss')) this._toggle(id);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._toggle(id); }
    });
    el.querySelector('.p31-mol-atom__dismiss')
      .addEventListener('click', e => { e.stopPropagation(); this._evict(id); });

    this._wrap.appendChild(el);

    if (groupId) {
      for (const other of this._atoms.values()) {
        if (other.id !== id && other.groupId === groupId) {
          this._links.push({ source: id, target: other.id });
        }
      }
    }

    this._scheduleDecay(id, lifespan);
    setTimeout(() => el.querySelector('.p31-mol-atom__ping')
      ?.classList.add('p31-mol-atom__ping--done'), 2000);
    return id;
  }

  _expand(id) {
    const a = this._atoms.get(id);
    if (!a || a.expanded || a.dead) return;
    a.expanded = true;
    a.el.classList.add('p31-mol-atom--expanded');
  }

  _collapse(id) {
    const a = this._atoms.get(id);
    if (!a || !a.expanded) return;
    a.expanded = false;
    a.el.classList.remove('p31-mol-atom--expanded');
  }

  _toggle(id) {
    const a = this._atoms.get(id);
    if (!a || a.dead) return;
    if (a.expanded) { this._collapse(id); a.pinned = false; this._scheduleDecay(id, 3000); }
    else            { this._expand(id);   a.pinned = true; }
  }

  setQuantumState(state) {
    const k = String(state).toUpperCase();
    if (PHYSICS[k]) {
      this._qs = k;
      if (this._wrap) this._wrap.dataset.quantum = k;
    }
  }

  _scheduleDecay(id, ms) {
    setTimeout(() => {
      const a = this._atoms.get(id);
      if (!a || a.pinned || a.dead) return;
      this._evict(id);
    }, ms);
  }

  _evict(id, immediate = false) {
    const a = this._atoms.get(id);
    if (!a || a.dead) return;
    a.dead = true; a.pinned = false;

    if (immediate) {
      a.el.remove();
      this._atoms.delete(id);
      this._nodes.delete(id);
      this._links = this._links.filter(l => l.source !== id && l.target !== id);
      return;
    }

    // CSS `scale` property (separate from translate3d, no conflict)
    a.el.classList.add('p31-mol-atom--evaporating');
    a.el.addEventListener('animationend', () => {
      a.el.remove();
      this._atoms.delete(id);
      this._nodes.delete(id);
      this._links = this._links.filter(l => l.source !== id && l.target !== id);
    }, { once: true });
  }

  _loop() {
    this._raf = requestAnimationFrame(ts => { this._t = ts; this._loop(); });
    if (document.hidden || this._atoms.size === 0) return;
    this._tick();
  }

  _tick() {
    const p     = PHYSICS[this._qs] || PHYSICS.LIQUID;
    const t     = this._t;
    const W     = window.innerWidth, H = window.innerHeight;
    const AX    = W - 100, AY = H - 100;
    const atoms = [...this._atoms.values()];

    // Bond springs
    for (const lk of this._links) {
      const a = this._atoms.get(lk.source), b = this._atoms.get(lk.target);
      if (!a || !b || a.dead || b.dead) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (dist - BOND_DIST) * p.bond;
      const nx = dx / dist, ny = dy / dist;
      if (!a.pinned && !a.expanded) { a.vx += nx * f; a.vy += ny * f; }
      if (!b.pinned && !b.expanded) { b.vx -= nx * f; b.vy -= ny * f; }
    }

    // Repulsion
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const a = atoms[i], b = atoms[j];
        if (a.dead || b.dead) continue;
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy || 1;
        if (d2 > p.repel * p.repel) continue;
        const d = Math.sqrt(d2);
        const f = (p.repel - d) / p.repel * 2;
        if (!a.pinned && !a.expanded) { a.vx += (dx / d) * f; a.vy += (dy / d) * f; }
        if (!b.pinned && !b.expanded) { b.vx -= (dx / d) * f; b.vy -= (dy / d) * f; }
      }
    }

    // Integrate & sync DOM
    for (const a of atoms) {
      if (a.dead) continue;
      const domEl = this._nodes.get(a.id);

      if (a.pinned || a.expanded) {
        if (domEl) domEl.style.transform = `translate3d(${a.x}px,${a.y}px,0) translate(-50%,-50%)`;
        continue;
      }

      a.vx += (AX - a.x) * p.speed * 0.1;
      a.vy += (AY - a.y) * p.speed * 0.1;

      if (this._qs !== 'SOLID') {
        a.vx += Math.sin(t * 0.002 + a.x * 0.01) * p.wander;
        a.vy += Math.cos(t * 0.002 + a.y * 0.01) * p.wander;
      }

      a.vx *= p.damp;
      a.vy *= p.damp;
      a.x  += a.vx;
      a.y  += a.vy;

      a.x = Math.max(28, Math.min(W - 28, a.x));
      a.y = Math.max(28, Math.min(H - 56, a.y));

      if (domEl) domEl.style.transform = `translate3d(${a.x}px,${a.y}px,0) translate(-50%,-50%)`;
    }

    // SVG bonds
    while (this._svg.firstChild) this._svg.removeChild(this._svg.firstChild);
    for (const lk of this._links) {
      const a = this._atoms.get(lk.source), b = this._atoms.get(lk.target);
      if (!a || !b || a.dead || b.dead) continue;
      const qmu = QMU_COLOR[a.severity] || QMU_COLOR.info;
      const ln  = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', a.x); ln.setAttribute('y1', a.y);
      ln.setAttribute('x2', b.x); ln.setAttribute('y2', b.y);
      ln.setAttribute('stroke', qmu.hex);
      ln.setAttribute('stroke-width', '1.5');
      ln.setAttribute('stroke-dasharray', this._qs === 'GAS' ? '2,6' : '4,5');
      ln.setAttribute('opacity', '0.38');
      this._svg.appendChild(ln);
    }
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._wrap?.remove();
    _field = null;
  }
}

let _field = null;
export function getMolecularField() {
  if (!_field && typeof document !== 'undefined') _field = new MolecularField();
  return _field;
}

if (typeof window !== 'undefined') {
  window.p31Notify   = opts => getMolecularField().notify(opts);
  window.p31MolField = {
    get:             getMolecularField,
    setQuantumState: s => getMolecularField().setQuantumState(s),
  };
}
