/**
 * Posner Molecule (Ca₉(PO₄)₆) — 2D spring-physics navigator.
 *
 * 15 nodes: 3 inner Ca + 6 PO₄ + 6 outer Ca.
 * Verlet integration · Hooke springs · centre restoring force.
 * Zero CPU cost when unmounted (no rAF loop running).
 *
 * 9 Ca²⁺ nodes (3 inner LIVE + 6 outer ALPHA) map to MVP apps.
 * Tap a Ca node to navigate; drag to perturb physics.
 * Center: PHOS K₄ tetrahedron glyph with fire animation.
 *
 * Usage:
 *   const nav = createSpatialNavigator();
 *   nav.mount(svgElement);  // start
 *   nav.unmount();           // stop + clear DOM
 */

const VW = 600, VH = 600, CX = 300, CY = 300;
const R1 = 78;   // inner Ca ring
const R2 = 152;  // PO₄ ring
const R3 = 232;  // outer Ca ring

/** 9 Ca²⁺ nodes → MVP app destinations */
const NAV: Partial<Record<number, { label: string; href: string; live: boolean }>> = {
  // Inner Ca (3) — LIVE apps at the core
  0:  { label: 'BONDING',  href: '/bonding-about.html',           live: true  },
  1:  { label: 'SOC·MOL',  href: '/social-molecules-about.html',  live: true  },
  2:  { label: 'INTEGR.',  href: '/integrations-about.html',      live: true  },
  // Outer Ca (6) — ALPHA apps in orbit
  9:  { label: 'S·EARTH',  href: '/spaceship-earth-about.html',   live: false },
  10: { label: 'Spaceship Earth',      href: '/dome',               live: false },
  11: { label: 'BUFFER',   href: '/buffer-about.html',            live: false },
  12: { label: 'CORTEX',   href: '/cortex-about.html',            live: false },
  13: { label: 'POETS',    href: '/poets-about.html',             live: false },
  14: { label: 'SOVRN',    href: '/sovereign-about.html',         live: false },
};

interface N {
  x: number; y: number;
  px: number; py: number;
  ex: number; ey: number;
  type: 'ca-inner' | 'ca-outer' | 'po4';
}

interface B { a: number; b: number; rest: number; k: number; }

export interface SpatialHandle {
  mount(svg: SVGSVGElement): void;
  unmount(): void;
}

export function createSpatialNavigator(): SpatialHandle {
  let ns: N[] = [];
  let bs: B[] = [];
  let raf = 0;
  let drag = -1;
  let svgEl: SVGSVGElement | null = null;
  let nodeEls: SVGCircleElement[] = [];
  let bondEls: SVGLineElement[] = [];
  let labelEls: (SVGTextElement | null)[] = [];

  function rad(deg: number) { return deg * Math.PI / 180; }
  function pt(deg: number, r: number): [number, number] {
    return [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];
  }
  function mk(deg: number, r: number, type: N['type']): N {
    const [x, y] = pt(deg, r);
    return { x, y, px: x, py: y, ex: x, ey: y, type };
  }
  function len(a: N, b: N) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function init() {
    ns = [
      mk(-90, R1, 'ca-inner'), mk(30, R1, 'ca-inner'), mk(150, R1, 'ca-inner'),
      mk(-30, R2, 'po4'), mk(30, R2, 'po4'), mk(90, R2, 'po4'),
      mk(150, R2, 'po4'), mk(210, R2, 'po4'), mk(270, R2, 'po4'),
      mk(0,   R3, 'ca-outer'), mk(60,  R3, 'ca-outer'), mk(120, R3, 'ca-outer'),
      mk(180, R3, 'ca-outer'), mk(240, R3, 'ca-outer'), mk(300, R3, 'ca-outer'),
    ];

    bs = [];
    const b = (a: number, bb: number, k: number) =>
      bs.push({ a, b: bb, rest: len(ns[a], ns[bb]), k });

    b(0, 1, 0.40); b(1, 2, 0.40); b(0, 2, 0.40);
    b(0, 7, 0.30); b(0, 3, 0.30);
    b(1, 3, 0.30); b(1, 5, 0.30);
    b(2, 5, 0.30); b(2, 7, 0.30);
    b(3, 14, 0.22); b(3, 9,  0.22);
    b(4, 9,  0.22); b(4, 10, 0.22);
    b(5, 10, 0.22); b(5, 11, 0.22);
    b(6, 11, 0.22); b(6, 12, 0.22);
    b(7, 12, 0.22); b(7, 13, 0.22);
    b(8, 13, 0.22); b(8, 14, 0.22);
    for (let i = 0; i < 6; i++) b(9 + i, 9 + (i + 1) % 6, 0.18);
  }

  function step() {
    const ax = new Float64Array(ns.length);
    const ay = new Float64Array(ns.length);
    for (const { a, b: bb, rest, k } of bs) {
      const dx = ns[bb].x - ns[a].x, dy = ns[bb].y - ns[a].y;
      const d = Math.hypot(dx, dy) || 1e-5;
      const f = (d - rest) * k / d;
      ax[a] += f * dx; ay[a] += f * dy;
      ax[bb] -= f * dx; ay[bb] -= f * dy;
    }
    const DAMP = 0.91, CK = 0.007;
    for (let i = 0; i < ns.length; i++) {
      if (i === drag) continue;
      const n = ns[i];
      ax[i] += (n.ex - n.x) * CK;
      ay[i] += (n.ey - n.y) * CK;
      const vx = (n.x - n.px) * DAMP, vy = (n.y - n.py) * DAMP;
      n.px = n.x; n.py = n.y;
      n.x += vx + ax[i];
      n.y += vy + ay[i];
    }
  }

  function draw() {
    for (let i = 0; i < ns.length; i++) {
      const c = nodeEls[i]; if (!c) continue;
      c.setAttribute('cx', String(ns[i].x.toFixed(2)));
      c.setAttribute('cy', String(ns[i].y.toFixed(2)));
    }
    for (let i = 0; i < bs.length; i++) {
      const l = bondEls[i]; if (!l) continue;
      l.setAttribute('x1', String(ns[bs[i].a].x.toFixed(2)));
      l.setAttribute('y1', String(ns[bs[i].a].y.toFixed(2)));
      l.setAttribute('x2', String(ns[bs[i].b].x.toFixed(2)));
      l.setAttribute('y2', String(ns[bs[i].b].y.toFixed(2)));
    }
    // Update label positions
    for (let i = 0; i < ns.length; i++) {
      const lbl = labelEls[i]; if (!lbl) continue;
      const n = ns[i];
      // Place label outside the node, offset toward edge of cluster
      const dx = n.ex - CX, dy = n.ey - CY;
      const dist = Math.hypot(dx, dy) || 1;
      const off = n.type === 'ca-inner' ? 20 : 17;
      lbl.setAttribute('x', String((n.x + (dx / dist) * off).toFixed(1)));
      lbl.setAttribute('y', String((n.y + (dy / dist) * off).toFixed(1)));
    }
  }

  function loop() { step(); draw(); raf = requestAnimationFrame(loop); }

  function ns_<T extends SVGElement>(tag: string, attrs: Record<string, string | number>): T {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag) as T;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    return el;
  }

  function buildDOM(s: SVGSVGElement) {
    s.innerHTML = '';

    // ── Defs: glow filters + fire animation keyframes ─────────────────────────
    const defs = ns_<SVGDefsElement>('defs', {});

    // Node glow
    const nodeGlow = ns_<SVGFilterElement>('filter', {
      id: 'sg-glow', x: '-40%', y: '-40%', width: '180%', height: '180%',
    });
    const blur1 = ns_('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '4', result: 'b' });
    const merge1 = ns_<SVGFEMergeElement>('feMerge', {});
    merge1.appendChild(ns_('feMergeNode', { in: 'b' }));
    merge1.appendChild(ns_('feMergeNode', { in: 'SourceGraphic' }));
    nodeGlow.appendChild(blur1); nodeGlow.appendChild(merge1);

    // K₄ fire glow (heavier)
    const fireGlow = ns_<SVGFilterElement>('filter', {
      id: 'k4-fire', x: '-60%', y: '-60%', width: '220%', height: '220%',
    });
    const blur2 = ns_('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '6', result: 'fb' });
    const merge2 = ns_<SVGFEMergeElement>('feMerge', {});
    merge2.appendChild(ns_('feMergeNode', { in: 'fb' }));
    merge2.appendChild(ns_('feMergeNode', { in: 'SourceGraphic' }));
    fireGlow.appendChild(blur2); fireGlow.appendChild(merge2);

    // Fire animation keyframes + cursor styles
    const style = ns_('style', {});
    style.textContent = `
      @keyframes k4-spin { to { transform: rotate(360deg); } }
      @keyframes k4-pulse {
        0%,100% { opacity: 0.9; }
        50%      { opacity: 0.55; }
      }
      @keyframes k4-flare {
        0%,100% { transform: rotate(0deg) scale(1);   }
        33%     { transform: rotate(120deg) scale(1.08); }
        66%     { transform: rotate(240deg) scale(0.94); }
      }
      .sn-ca { cursor: pointer; }
      .sn-ca:hover circle { stroke-width: 2.5; }
    `;
    defs.appendChild(nodeGlow);
    defs.appendChild(fireGlow);
    defs.appendChild(style);
    s.appendChild(defs);

    // ── Bond layer ────────────────────────────────────────────────────────────
    const gBonds = ns_('g', { id: 'spatial-bonds', opacity: '0.45' });
    bondEls = bs.map(({ a, b: bb }) => {
      const line = ns_<SVGLineElement>('line', {
        x1: ns[a].x, y1: ns[a].y,
        x2: ns[bb].x, y2: ns[bb].y,
        stroke: '#3ba89a', 'stroke-width': '1.4', 'stroke-linecap': 'round',
      });
      gBonds.appendChild(line);
      return line;
    });
    s.appendChild(gBonds);

    // ── PHOS K₄ center glyph — fiery tetrahedron ─────────────────────────────
    const k4 = ns_('g', {
      id: 'phos-k4',
      style: 'transform-origin:300px 300px;animation:k4-flare 8s ease-in-out infinite',
      filter: 'url(#k4-fire)',
    });

    // K₄ = 4 vertices, 6 edges (complete graph). 2D tetrahedron projection at center.
    const S = 38; // scale radius
    const v: [number, number][] = [
      [CX,       CY - S],          // top
      [CX - S*0.87, CY + S*0.5],   // bottom-left
      [CX + S*0.87, CY + S*0.5],   // bottom-right
      [CX,       CY],              // center/back vertex (slightly inward)
    ];
    const edges: [number, number][] = [
      [0,1],[0,2],[0,3],[1,2],[1,3],[2,3],
    ];
    const edgeColors = ['#f43f5e','#f43f5e','#fb923c','#f43f5e','#fb923c','#fb923c'];

    edges.forEach(([a, b], i) => {
      k4.appendChild(ns_('line', {
        x1: v[a][0], y1: v[a][1], x2: v[b][0], y2: v[b][1],
        stroke: edgeColors[i],
        'stroke-width': (i < 3 ? 2.2 : 1.4).toString(),
        'stroke-linecap': 'round',
        opacity: (i < 3 ? 0.95 : 0.6).toString(),
        style: `animation:k4-pulse ${3 + i * 0.4}s ease-in-out infinite`,
      }));
    });

    // Vertices: coral outer nodes
    v.forEach(([x, y], i) => {
      const r = i === 3 ? 3.5 : 4.5;
      const fill = i === 3 ? '#fb923c' : '#f43f5e';
      k4.appendChild(ns_('circle', { cx: x, cy: y, r, fill, opacity: '0.95' }));
    });

    // Tiny "P31" label at center
    const lbl = ns_<SVGTextElement>('text', {
      x: CX, y: CY + 2,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: '#fb923c',
      'font-family': 'monospace',
      'font-size': '8',
      'font-weight': '700',
      'letter-spacing': '0.15em',
      opacity: '0.85',
    });
    lbl.textContent = 'P31';
    k4.appendChild(lbl);
    s.appendChild(k4);

    // ── Node layer ────────────────────────────────────────────────────────────
    const NODE_STYLE: Record<N['type'], { r: number; fill: string; stroke: string; glow: boolean }> = {
      'ca-inner': { r: 10, fill: '#0ea5e9', stroke: '#0284c7', glow: true  },
      'ca-outer': { r: 7,  fill: '#64d4c8', stroke: '#3ba89a', glow: false },
      'po4':      { r: 5,  fill: '#a78bfa', stroke: '#7c3aed', glow: false },
    };

    const gNodes = ns_('g', { id: 'spatial-nodes' });
    labelEls = ns.map(() => null);

    nodeEls = ns.map((n, i) => {
      const st = NODE_STYLE[n.type];
      const nav = NAV[i];
      const isNav = !!nav;

      // Wrapper group for nav nodes (enables pointer + label)
      const wrap = ns_('g', {
        ...(isNav ? { class: 'sn-ca', role: 'button', tabindex: '0',
          'aria-label': nav!.label + (nav!.live ? ' (LIVE)' : ' (ALPHA)') } : {}),
      });

      const c = ns_<SVGCircleElement>('circle', {
        cx: n.x, cy: n.y, r: st.r,
        fill: isNav && nav!.live ? 'var(--p31-teal)' : st.fill,
        stroke: isNav && nav!.live ? '#059669' : st.stroke,
        'stroke-width': '1.8',
        ...(st.glow || (isNav && nav!.live) ? { filter: 'url(#sg-glow)' } : {}),
        style: isNav ? 'cursor:pointer' : 'cursor:grab',
      });
      wrap.appendChild(c);

      // Label text for Ca nav nodes
      if (isNav) {
        const txt = ns_<SVGTextElement>('text', {
          x: n.x, y: n.y,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          fill: nav!.live ? '#6ee7b7' : '#94a3b8',
          'font-family': 'monospace',
          'font-size': n.type === 'ca-inner' ? '10' : '8',
          'font-weight': '600',
          'letter-spacing': '0.06em',
          'pointer-events': 'none',
        });
        txt.textContent = nav!.label;
        wrap.appendChild(txt);
        labelEls[i] = txt;
      }

      gNodes.appendChild(wrap);
      return c;
    });
    s.appendChild(gNodes);

    // ── Pointer interaction: drag + tap-to-navigate ───────────────────────────
    let captureId = -1;
    let downX = 0, downY = 0, hasMoved = false;

    function toSVG(e: PointerEvent): [number, number] {
      const r = s.getBoundingClientRect();
      return [
        (e.clientX - r.left) * (VW / r.width),
        (e.clientY - r.top)  * (VH / r.height),
      ];
    }

    function nearest(x: number, y: number): number {
      let best = -1, bestD = 36;
      ns.forEach((n, i) => {
        const d = Math.hypot(n.x - x, n.y - y);
        if (d < bestD) { best = i; bestD = d; }
      });
      return best;
    }

    s.addEventListener('pointerdown', (e) => {
      const [x, y] = toSVG(e);
      const idx = nearest(x, y);
      if (idx === -1) return;
      drag = idx; captureId = e.pointerId;
      downX = x; downY = y; hasMoved = false;
      s.setPointerCapture(e.pointerId);
      nodeEls[idx].style.cursor = 'grabbing';
      e.preventDefault();
    });

    s.addEventListener('pointermove', (e) => {
      if (drag === -1 || e.pointerId !== captureId) return;
      const [x, y] = toSVG(e);
      if (Math.hypot(x - downX, y - downY) > 8) hasMoved = true;
      ns[drag].x = x; ns[drag].y = y;
      ns[drag].px = x; ns[drag].py = y;
    });

    function endDrag(e: PointerEvent) {
      if (drag === -1 || e.pointerId !== captureId) return;
      nodeEls[drag].style.cursor = NAV[drag] ? 'pointer' : 'grab';
      // Tap (no significant drag): navigate
      if (!hasMoved && NAV[drag]) {
        const dest = NAV[drag]!.href;
        if (dest.startsWith('http')) window.open(dest, '_blank', 'noopener');
        else window.location.href = dest;
      }
      drag = -1; captureId = -1;
    }
    s.addEventListener('pointerup', endDrag);
    s.addEventListener('pointercancel', endDrag);

    // Keyboard navigation for Ca nodes
    s.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target as SVGElement;
      const wrap = el.closest('.sn-ca');
      if (!wrap) return;
      const idx = Array.from(s.querySelectorAll('.sn-ca')).indexOf(wrap);
      const navKeys = Object.keys(NAV).map(Number);
      const nodeIdx = navKeys[idx];
      if (nodeIdx !== undefined && NAV[nodeIdx]) {
        window.location.href = NAV[nodeIdx]!.href;
        e.preventDefault();
      }
    });
  }

  return {
    mount(s: SVGSVGElement) {
      if (raf) return;
      svgEl = s;
      init();
      buildDOM(s);
      raf = requestAnimationFrame(loop);
    },
    unmount() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      drag = -1;
      if (svgEl) { svgEl.innerHTML = ''; svgEl = null; }
      nodeEls = []; bondEls = []; labelEls = [];
    },
  };
}
