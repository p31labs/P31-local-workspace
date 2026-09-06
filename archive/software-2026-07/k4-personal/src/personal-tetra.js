/**
 * p31.personalTetra/1.0.0 — four docks (personal tetrahedron vertices).
 * Keys: structure, connection, rhythm, creation (aligned with planetary onboard spheres).
 */

export const PERSONAL_TETRA_SCHEMA = "p31.personalTetra/1.0.0";

const DOCK_KEYS = ["structure", "connection", "rhythm", "creation"];

export function defaultPersonalTetra() {
  return {
    schema: PERSONAL_TETRA_SCHEMA,
    version: "1.0.0",
    docks: {
      structure: {
        label: "Structure",
        href: "/geodesic.html",
        kind: "link",
        hint: "Build & scaffold",
      },
      connection: {
        label: "Connection",
        href: "/connect.html",
        kind: "link",
        hint: "K₄ mesh",
      },
      rhythm: {
        label: "Rhythm",
        href: "/planetary-onboard.html",
        kind: "link",
        hint: "Dial & pace",
      },
      creation: {
        label: "Creation",
        href: "/ede.html",
        kind: "link",
        hint: "EDE",
      },
    },
  };
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, value: ReturnType<typeof defaultPersonalTetra> } | { ok: false, error: string }}
 */
export function validatePersonalTetra(raw) {
  if (raw == null || typeof raw !== "object") {
    return { ok: false, error: "personalTetra must be an object" };
  }
  const o = /** @type {Record<string, unknown>} */ (raw);
  const docksIn = o.docks;
  if (docksIn == null || typeof docksIn !== "object") {
    return { ok: false, error: "personalTetra.docks must be an object" };
  }
  const docks = /** @type {Record<string, unknown>} */ (docksIn);
  const out = {};
  for (const key of DOCK_KEYS) {
    const d = docks[key];
    if (d == null || typeof d !== "object") {
      return { ok: false, error: `docks.${key} must be an object` };
    }
    const dd = /** @type {Record<string, unknown>} */ (d);
    const label = dd.label;
    const href = dd.href;
    if (typeof label !== "string" || label.length === 0 || label.length > 80) {
      return { ok: false, error: `docks.${key}.label invalid` };
    }
    if (typeof href !== "string" || href.length === 0 || href.length > 2048) {
      return { ok: false, error: `docks.${key}.href invalid` };
    }
    const kind = dd.kind === "worker" || dd.kind === "passport" ? dd.kind : "link";
    const hint = typeof dd.hint === "string" && dd.hint.length <= 200 ? dd.hint : undefined;
    out[key] = { label, href, kind, ...(hint ? { hint } : {}) };
  }
  return {
    ok: true,
    value: {
      schema: PERSONAL_TETRA_SCHEMA,
      version: typeof o.version === "string" ? o.version : "1.0.0",
      docks: out,
    },
  };
}

/** Merge stored tetra with defaults for any missing dock fields (read path). */
export function normalizePersonalTetra(stored) {
  const base = defaultPersonalTetra();
  if (!stored || typeof stored !== "object") return base;
  const v = validatePersonalTetra(stored);
  if (v.ok) return v.value;
  return base;
}
