/**
 * Same-origin atmosphere registry for bonding.p31ca.org (no cross-site fetch).
 * Assets: public/p31-atmosphere/*.json (synced from home design-assets/atmosphere).
 */

const BASE = `${import.meta.env.BASE_URL || "/"}p31-atmosphere/`;

export type BondingAtmosphereRoute = {
  surfaceId: string;
  rampId: string;
  starfieldAOD: string;
  notes?: string;
};

export type BondingAtmosphereRamp = {
  id: string;
  starfieldPreset: string | null;
  radiusToken?: string;
  typeScaleRem?: string;
  motionBudget: number;
  soundProfile?: string;
  paletteEmphasis?: string;
};

export type ResolvedBondingAtmosphere = {
  ramp: BondingAtmosphereRamp;
  route: BondingAtmosphereRoute;
  presetCaps: Record<string, unknown> | null;
};

let cache: ResolvedBondingAtmosphere | null | undefined;

async function loadJson<T>(path: string): Promise<T> {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json() as Promise<T>;
}

/** Resolve registry row for surface `bonding` (C.A.R.S. cockpit). */
export async function resolveBondingAtmosphere(): Promise<ResolvedBondingAtmosphere | null> {
  if (cache !== undefined) return cache;
  try {
    const [rampDoc, routeDoc, capDoc] = await Promise.all([
      loadJson<{ ramps: BondingAtmosphereRamp[] }>(`${BASE}p31-atmosphere-ramp.json`),
      loadJson<{ routes: BondingAtmosphereRoute[] }>(`${BASE}p31-atmosphere-routes.json`),
      loadJson<{ presets: Record<string, Record<string, unknown>> }>(
        `${BASE}p31-canon-starfield-presets.json`,
      ),
    ]);
    const routes = routeDoc.routes || [];
    const ramps = rampDoc.ramps || [];
    const row = routes.find((x) => x.surfaceId === "bonding");
    if (!row) {
      cache = null;
      return null;
    }
    const ramp = ramps.find((x) => x.id === row.rampId);
    if (!ramp) {
      cache = null;
      return null;
    }
    const key = ramp.starfieldPreset;
    const presets = capDoc.presets || {};
    const presetCaps =
      key && typeof presets[key] === "object" ? (presets[key] as Record<string, unknown>) : null;
    cache = { ramp, route: row, presetCaps };
    return cache;
  } catch {
    cache = null;
    return null;
  }
}

/** 0–1 multiplier for 3D field + motion (from motionBudget + AOD). */
export function coherenceFromBondingAtmosphere(resolved: ResolvedBondingAtmosphere | null): number {
  const fallback = 6.5 / 12;
  if (!resolved) return fallback;
  const aod = resolved.route.starfieldAOD;
  if (aod === "off") return 0.12;
  let mb = typeof resolved.ramp.motionBudget === "number" ? resolved.ramp.motionBudget : 6;
  mb = Math.max(0, Math.min(12, mb));
  let t = mb / 12;
  if (aod === "degraded") t *= 0.72;
  return Math.max(0.08, Math.min(1, t));
}

export function applyBondingRampDom(resolved: ResolvedBondingAtmosphere | null): void {
  const root = document.documentElement;
  if (!resolved?.ramp) return;
  const r = resolved.ramp;
  try {
    if (r.radiusToken) root.style.setProperty("--p31-atmosphere-radius-token", String(r.radiusToken));
    if (r.typeScaleRem) root.style.setProperty("--p31-atmosphere-type-step", String(r.typeScaleRem));
    root.dataset.p31AtmosphereRamp = String(r.id || "");
    if (r.soundProfile) root.dataset.p31SoundProfile = String(r.soundProfile);
  } catch {
    /* ignore */
  }
}
