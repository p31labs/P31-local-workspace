/**
 * Browser/runtime: resolve surface → ramp + starfield preset caps (synced from docs + canon).
 * @see docs/p31-atmosphere-ramp.json docs/p31-atmosphere-routes.json
 * JSON siblings must live in the same directory as this module (sync-p31-atmosphere.mjs).
 */

let _cache = null;
/** @type {URL | null} */
let forcedAssetBase = null;

/**
 * When this module is bundled (e.g. p31ca landing), JSON is not adjacent to the chunk.
 * Call with `new URL(import.meta.env.BASE_URL + 'lib/atmosphere/', window.location.href)` before resolve.
 * @param {string | URL} base
 */
export function configureAtmosphereAssetsBase(base) {
  _cache = null;
  if (base instanceof URL) {
    forcedAssetBase = base;
    return;
  }
  if (typeof base === "string" && typeof window !== "undefined" && window.location?.href) {
    const u = base.endsWith("/") ? base : base + "/";
    forcedAssetBase = new URL(u, window.location.href);
    return;
  }
  forcedAssetBase = null;
}

/**
 * @returns {Promise<{ ramps: object[]; routes: object[]; presetCaps: Record<string, object> }>}
 */
export async function loadAtmosphereRegistry() {
  if (_cache) return _cache;
  const base = forcedAssetBase || new URL("./", import.meta.url);
  const [rampRes, routeRes, capRes] = await Promise.all([
    fetch(new URL("p31-atmosphere-ramp.json", base), { cache: "no-store" }),
    fetch(new URL("p31-atmosphere-routes.json", base), { cache: "no-store" }),
    fetch(new URL("p31-canon-starfield-presets.json", base), { cache: "no-store" }),
  ]);
  if (!rampRes.ok) throw new Error("atmosphere: ramp json " + rampRes.status);
  if (!routeRes.ok) throw new Error("atmosphere: routes json " + routeRes.status);
  if (!capRes.ok) throw new Error("atmosphere: preset caps json " + capRes.status);
  const rampDoc = await rampRes.json();
  const routeDoc = await routeRes.json();
  const capDoc = await capRes.json();
  const ramps = Array.isArray(rampDoc.ramps) ? rampDoc.ramps : [];
  const routes = Array.isArray(routeDoc.routes) ? routeDoc.routes : [];
  const presetCaps =
    capDoc.presets && typeof capDoc.presets === "object" ? capDoc.presets : {};
  _cache = { ramps, routes, presetCaps };
  return _cache;
}

/**
 * @param {string} surfaceId
 * @returns {Promise<{ ramp: object; route: object; presetCaps: object | null } | null>}
 */
export async function resolveAtmosphere(surfaceId) {
  const id = surfaceId;
  const { ramps, routes, presetCaps } = await loadAtmosphereRegistry();
  const route = routes.find((r) => r.surfaceId === id);
  if (!route) return null;
  const ramp = ramps.find((x) => x.id === route.rampId);
  if (!ramp) return null;
  const key = ramp.starfieldPreset;
  const caps = key && presetCaps[key] ? presetCaps[key] : null;
  return { ramp, route, presetCaps: caps };
}

/**
 * @param {{ route: { starfieldAOD: string }; ramp: { starfieldPreset?: string | null } }} resolved
 * @returns {'none'|'animated'|'static'}
 */
export function starfieldMountMode(resolved) {
  if (!resolved) return "none";
  const aod = resolved.route?.starfieldAOD;
  if (aod === "off") return "none";
  if (aod === "degraded") return "static";
  return "animated";
}

/**
 * @param {Record<string, number>} config starfield config
 * @param {{ ramp: { motionBudget: number }; presetCaps: object | null }} resolved
 */
export function mergeResolvedIntoStarfieldConfig(config, resolved) {
  const out = { ...config };
  if (!resolved || !resolved.ramp) return out;
  const mb = Math.max(0, Math.min(12, Number(resolved.ramp.motionBudget) || 0));
  const t = mb / 12;
  const caps = resolved.presetCaps;
  if (caps && typeof caps.baseAlphaCap === "number") {
    const headroom = 0.45 + 0.55 * t;
    out.baseAlpha = Math.min(out.baseAlpha, caps.baseAlphaCap * headroom);
  }
  out.speed = Number(out.speed) * (0.2 + 0.8 * Math.max(0.2, t));
  return out;
}

/**
 * Static plate preset key (camelCase) from ramp.
 * @param {{ ramp: { starfieldPreset?: string | null } }} resolved
 */
export function staticPlatePreset(resolved) {
  const p = resolved?.ramp?.starfieldPreset;
  if (!p) return "commandCenter";
  return p;
}

/**
 * Sets CSS tokens from ramp (radius + type scale rem) on :root when present in universal style.
 * @param {HTMLElement} root document.documentElement
 * @param {object | null} resolved
 */
export function applyRampCssHints(root, resolved) {
  if (!root || !resolved?.ramp) return;
  const r = resolved.ramp;
  if (r.radiusToken) {
    try {
      root.style.setProperty("--p31-atmosphere-radius-token", String(r.radiusToken));
    } catch {
      /* ignore */
    }
  }
  if (r.typeScaleRem) {
    try {
      root.style.setProperty("--p31-atmosphere-type-step", String(r.typeScaleRem));
    } catch {
      /* ignore */
    }
  }
  try {
    root.dataset.p31AtmosphereRamp = String(r.id || "");
    root.dataset.p31SoundProfile = String(r.soundProfile || "");
  } catch {
    /* ignore */
  }
}
