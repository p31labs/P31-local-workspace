/**
 * The Loom — graph builder.
 *
 * Reads the canonical @p31/canon/registry.json and turns it into a fixed
 * semantic layout: the component at the centre, CSS classes on inner rings,
 * tokens on outer rings, themes on the rim. No force simulation — a deterministic
 * layout so the graph doesn't reflow when the agent moves.
 *
 * Node ids are namespaced (`token:--p31-accent`, `class:.glass-card`,
 * `component:Button`, `theme:ocean`). The event log uses BARE names
 * (`--p31-accent`, `.glass-card`, `Button`, `ocean`); `buildIdIndex()` is the
 * reverse map the overlay uses to reconcile the two.
 */
import registry from '@p31/canon/registry.json';

export type Kind = 'token' | 'class' | 'component' | 'theme';

export interface LoomNodeData extends Record<string, unknown> {
  label: string;
  /** The bare name the log uses to reference this node. */
  bare: string;
  kind: Kind;
  detail?: string;
}

export interface LoomNode {
  id: string;
  position: { x: number; y: number };
  data: LoomNodeData;
}

export interface LoomEdge {
  id: string;
  source: string;
  target: string;
}

function ringPoints(count: number, radius: number, offset: number) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const a = offset + (i / count) * Math.PI * 2;
    pts.push({ x: Math.round(Math.cos(a) * radius), y: Math.round(Math.sin(a) * radius) });
  }
  return pts;
}

function multiRing(count: number, radii: number[], offset: number) {
  const out: { x: number; y: number }[] = [];
  let placed = 0;
  const per = Math.ceil(count / radii.length);
  for (const r of radii) {
    const n = Math.min(per, count - placed);
    if (n <= 0) break;
    out.push(...ringPoints(n, r, offset));
    placed += n;
  }
  return out;
}

/** 'p31.color.action.primary' -> '--p31-color-action-primary'; '--p31-x' passes through. */
export function tokenIdFromContract(path: string): string {
  return path.startsWith('--') ? path : '--' + path.replace(/\./g, '-');
}

export function buildGraph() {
  const nodes: LoomNode[] = [];
  const edges: LoomEdge[] = [];

  for (const c of registry.components) {
    nodes.push({
      id: `component:${c.name}`,
      position: { x: 0, y: 0 },
      data: { label: c.name, bare: c.name, kind: 'component', detail: c.intent },
    });
  }

  const themePos = ringPoints(registry.themes.length, 1150, -Math.PI / 2);
  registry.themes.forEach((t, i) => {
    nodes.push({
      id: `theme:${t.id}`,
      position: themePos[i],
      data: { label: t.name, bare: t.id, kind: 'theme', detail: t.description },
    });
  });

  const tokenPos = multiRing(registry.tokens.length, [620, 700, 780, 860], -Math.PI / 2);
  registry.tokens.forEach((t, i) => {
    nodes.push({
      id: `token:${t.name}`,
      position: tokenPos[i],
      data: { label: t.name.replace(/^--p31-/, ''), bare: t.name, kind: 'token', detail: `${t.category} · ${t.value}` },
    });
  });

  const classPos = multiRing(registry.cssClasses.length, [280, 360, 440, 520], -Math.PI / 2 + 0.4);
  registry.cssClasses.forEach((c, i) => {
    nodes.push({
      id: `class:${c.name}`,
      position: classPos[i],
      data: { label: c.name, bare: c.name, kind: 'class', detail: c.files.join(', ') },
    });
  });

  const tokenIds = new Set(registry.tokens.map((t) => t.name));
  const seen = new Set<string>();
  const addEdge = (source: string, target: string) => {
    const id = `${source}=>${target}`;
    if (seen.has(id)) return;
    seen.add(id);
    edges.push({ id, source, target });
  };

  for (const c of registry.components) {
    for (const ref of c.tokens) {
      const id = tokenIdFromContract(ref);
      if (tokenIds.has(id)) addEdge(`component:${c.name}`, `token:${id}`);
    }
  }
  for (const c of registry.cssClasses) {
    for (const id of c.tokens) {
      if (tokenIds.has(id)) addEdge(`class:${c.name}`, `token:${id}`);
    }
  }

  return { nodes, edges, counts: registry.counts };
}

/** Reverse index: bare name -> namespaced id. Collisions fail loudly. */
export function buildIdIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const n of buildGraph().nodes) {
    if (index.has(n.data.bare)) {
      throw new Error(`id index collision: "${n.data.bare}" maps to both ${index.get(n.data.bare)} and ${n.id}`);
    }
    index.set(n.data.bare, n.id);
  }
  return index;
}
