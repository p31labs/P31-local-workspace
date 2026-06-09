/**
 * Shared entry: resolve atmosphere JSON + apply CSS hints (and optional 2D starfield init).
 * Hub: `/lib/atmosphere/` + `/lib/p31-starfield*.js` — home demo: `/design-assets/…`
 */
import * as atm from "./p31-atmosphere-client.js";

export function isP31HubHost() {
  if (typeof location === "undefined") return false;
  const h = String(location.hostname || "");
  return (
    h === "p31ca.org" ||
    h === "www.p31ca.org" ||
    /\.pages\.dev$/i.test(h)
  );
}

/** Base URL for atmosphere JSON + this folder’s modules. */
export function atmosphereAssetBase() {
  const o = typeof location !== "undefined" && location.origin ? location.origin : "http://127.0.0.1";
  if (isP31HubHost()) return new URL("/lib/atmosphere/", o);
  return new URL("/design-assets/atmosphere/", o);
}

export function starfieldModuleUrls() {
  if (isP31HubHost()) {
    return {
      starfield: "/lib/p31-starfield.js",
      plate: "/lib/p31-starfield-static-plate.js",
    };
  }
  return {
    starfield: "/design-assets/starfield/p31-starfield.js",
    plate: "/design-assets/starfield/p31-starfield-static-plate.js",
  };
}

/**
 * @param {string} surfaceId
 * @returns {Promise<{ resolved: Awaited<ReturnType<typeof atm.resolveAtmosphere>> }>}
 */
export async function bootAtmosphereHints(surfaceId) {
  const base = atmosphereAssetBase();
  atm.configureAtmosphereAssetsBase(base);
  const resolved = await atm.resolveAtmosphere(surfaceId);
  atm.applyRampCssHints(document.documentElement, resolved);
  return { resolved };
}

/**
 * @param {string} surfaceId
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<{ kind: 'none'|'static'|'animated'; api?: unknown }>}
 */
export async function bootAtmosphereStarfieldCanvas(surfaceId, canvas) {
  const { resolved } = await bootAtmosphereHints(surfaceId);
  const mode = atm.starfieldMountMode(resolved);
  if (mode === "none") {
    canvas.style.display = "none";
    return { kind: "none" };
  }
  const urls = starfieldModuleUrls();
  if (mode === "static") {
    const plate = await import(/* @vite-ignore */ urls.plate);
    const preset = resolved ? atm.staticPlatePreset(resolved) : "hub";
    plate.initStaticStarPlate(canvas, { preset });
    return { kind: "static" };
  }
  const mod = await import(/* @vite-ignore */ urls.starfield);
  const { config, hints } = await mod.resolveStarfieldConfig();
  const cfg = atm.mergeResolvedIntoStarfieldConfig(config, resolved);
  const meshSurface =
    surfaceId === "cognitive-passport"
      ? "passport"
      : surfaceId === "mesh-start" || surfaceId === "connect"
        ? "hub"
        : surfaceId === "physics-learn"
          ? "physics-learn"
          : surfaceId === "soup"
            ? "soup"
            : surfaceId === "poets"
              ? "poets"
              : surfaceId === "bonding"
                ? "bonding"
                : surfaceId === "dome" || surfaceId === "observatory"
                  ? "dome"
                  : "hub";
  const api = mod.initStarfield(canvas, cfg, {
    surface: meshSurface,
    touchRipple: true,
  });
  api.ingestTouchHints(hints);
  return { kind: "animated", api };
}
