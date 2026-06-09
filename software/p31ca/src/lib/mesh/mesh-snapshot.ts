/**
 * Live personal K₄ reads (k4-personal) for hub + dome HUDs and Mesh Observatory.
 * Snapshot-first (one round-trip), in-flight dedupe, stale-while-revalidate cache.
 */

import meshConstants from "../../data/p31-mesh-constants.json";

export const MESH_BASE = {
  personal: meshConstants.k4PersonalWorkerUrl as string,
  cage: meshConstants.k4CageWorkerUrl as string,
} as const;

/** Tight for interactive HUD; fall back to cache + secondary fetch. */
const SNAPSHOT_TIMEOUT_MS = 5000;
const MESH_TIMEOUT_MS = 6000;

export type MeshLivePayload = {
  api?: { version?: string; schema?: string };
  totalLove?: number;
  vitality?: { score?: number; onlineRatio?: number; edgeActivity24hRatio?: number };
  love?: { vertices?: number; edges?: number; total?: number };
  registry?: { count?: number; scopes?: string[]; error?: string };
  onlineCount?: number;
  edgeActivity24h?: number;
};

export type P31MirrorEcho = {
  schema?: string;
  asAbove?: string;
  asBelow?: string;
  familyBelow?: string;
  tag?: string;
};

/** k4-personal /api/snapshot — Larmor + PQC boundary copy (classical vs quantum transport). */
export type MeshSnapshotPhysics = {
  schema?: string;
  larmorReferenceHz?: number;
  note?: string;
};

export type MeshSnapshotResponse = {
  schema?: string;
  at?: string;
  mesh?: MeshLivePayload;
  liveness?: { ok?: boolean };
  physics?: MeshSnapshotPhysics;
  mirror?: P31MirrorEcho;
};

export function personalMeshUrl(): string {
  return new URL("/api/mesh", MESH_BASE.personal).toString();
}

export function personalSnapshotUrl(): string {
  return new URL("/api/snapshot", MESH_BASE.personal).toString();
}

export function cageMeshUrl(): string {
  return new URL("/api/mesh", MESH_BASE.cage).toString();
}

const inflight = new Map<string, Promise<unknown>>();

function dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = run().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
}

export async function fetchCageMeshJson(): Promise<Record<string, unknown> | null> {
  return dedupe("cage:mesh", async () => {
    try {
      const response = await fetch(cageMeshUrl(), {
        signal: AbortSignal.timeout(MESH_TIMEOUT_MS),
      });
      if (!response.ok) return null;
      return (await response.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  });
}

/** Compact HUD line from GET /api/mesh (or nested snapshot.mesh). */
export function formatMeshHudLine(
  m: MeshLivePayload | null | undefined
): { vit: string; love: string; detail: string } {
  if (!m) return { vit: "—", love: "—", detail: "" };
  const v = m.vitality?.score;
  const vit = typeof v === "number" && Number.isFinite(v) ? String(v) : "—";
  const lv = m.love;
  let love = "—";
  if (lv && typeof lv.vertices === "number" && typeof lv.edges === "number") {
    love = `V${lv.vertices} E${lv.edges}`;
  } else if (typeof m.totalLove === "number") {
    love = `Σ${m.totalLove}`;
  }
  const parts: string[] = [];
  if (typeof m.onlineCount === "number" && Number.isFinite(m.onlineCount)) {
    parts.push(`on ${m.onlineCount}/4`);
  }
  if (typeof m.edgeActivity24h === "number" && Number.isFinite(m.edgeActivity24h)) {
    parts.push(`24h ${m.edgeActivity24h}/6`);
  }
  const reg = m.registry;
  if (reg && typeof reg.count === "number" && !reg.error) {
    parts.push(`sc ${reg.count}`);
  }
  return { vit, love, detail: parts.length ? parts.join(" · ") : "" };
}

const CACHE_MESH = "p31_cache_mesh_hud";
const CACHE_SNAPSHOT = "p31_cache_mesh_snapshot";

function cachePut(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function cacheGet<T>(key: string): T | null {
  try {
    const c = localStorage.getItem(key);
    return c ? (JSON.parse(c) as T) : null;
  } catch {
    return null;
  }
}

/**
 * One logical round-trip: prefer GET /api/snapshot (embeds full mesh);
 * on 404/5xx/body without mesh, fall back to GET /api/mesh.
 * In-flight dedupe when landing + dome mount together.
 */
export async function fetchPersonalMeshForHud(): Promise<MeshLivePayload | null> {
  return dedupe("hud:mesh", async () => {
    const snap = await trySnapshotFirst();
    if (snap) return snap;
    return tryMeshOnly();
  });
}

async function trySnapshotFirst(): Promise<MeshLivePayload | null> {
  try {
    const response = await fetch(personalSnapshotUrl(), {
      signal: AbortSignal.timeout(SNAPSHOT_TIMEOUT_MS),
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error("snapshot not ok");
    }
    const j = (await response.json()) as MeshSnapshotResponse;
    const body = j.mesh;
    if (
      body &&
      typeof body === "object" &&
      (body as Record<string, unknown>).topology === "K4"
    ) {
      cachePut(CACHE_SNAPSHOT, j);
      cachePut(CACHE_MESH, body);
      return body as MeshLivePayload;
    }
  } catch {
    /* try mesh */
  }
  return null;
}

async function tryMeshOnly(): Promise<MeshLivePayload | null> {
  try {
    const response = await fetch(personalMeshUrl(), {
      signal: AbortSignal.timeout(MESH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error("mesh http");
    const data = (await response.json()) as MeshLivePayload;
    cachePut(CACHE_MESH, data);
    return data;
  } catch {
    return cacheGet<MeshLivePayload>(CACHE_MESH);
  }
}

export async function fetchPersonalSnapshot(): Promise<MeshSnapshotResponse | null> {
  return dedupe("full:snapshot", async () => {
    try {
      const response = await fetch(personalSnapshotUrl(), {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("snapshot http");
      const data = (await response.json()) as MeshSnapshotResponse;
      cachePut(CACHE_SNAPSHOT, data);
      return data;
    } catch {
      return cacheGet<MeshSnapshotResponse>(CACHE_SNAPSHOT);
    }
  });
}
