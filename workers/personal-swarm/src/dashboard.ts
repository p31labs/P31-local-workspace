import type { FractalDB, UnifiedFractalView, Scale } from "./types";

export interface UnifiedViewOptions {
  // Sovereign Self core (PGLite) lives in the client. When supplied, its
  // "self" nodes are merged into the Family/Career view from the shared D1.
  selfPglite?: FractalDB | null;
  // Restrict to a single scale (e.g. only "family").
  filterScale?: Scale;
}

// CWP-2026-040H — build the graph payload the spatial dashboard renders.
// Self nodes are layered client-side (selfPglite); Family/Career come from the
// shared D1 database `db`. Links are derived from parentId (child -> parent),
// which avoids an extra "list all links" query and stays within one round-trip
// per source database.
export async function getUnifiedView(
  db: FractalDB,
  opts: UnifiedViewOptions = {},
): Promise<UnifiedFractalView> {
  const familyCareer = await db.listNodes(opts.filterScale);
  const self = opts.selfPglite ? await opts.selfPglite.listNodes("self") : [];

  const nodes = [
    ...familyCareer.map((n) => ({
      id: n.id,
      label: n.label,
      scale: n.scale,
      importance: 1,
      source: (n.scale === "self" ? "self" : n.scale === "family" ? "family" : "career") as
        | "self"
        | "family"
        | "career",
    })),
    ...self.map((n) => ({
      id: n.id,
      label: n.label,
      scale: "self" as Scale,
      importance: 1,
      source: "self" as const,
    })),
  ];

  const ids = new Set(nodes.map((n) => n.id));
  const links: Array<{ source: string; target: string }> = [];
  for (const n of [...familyCareer, ...self]) {
    if (n.parentId && ids.has(n.parentId)) {
      links.push({ source: n.parentId, target: n.id });
    }
  }

  const events = await db.listSwarmEvents(undefined, 100);

  return { nodes, links, events };
}
