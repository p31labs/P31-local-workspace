/**
 * Maps P31 Production Readiness (PRS) hubCard tiers → honest hub grid + about badges.
 * PRS file: bonding-soup root p31-production-readiness.json (optional — p31ca-only clones skip).
 */
import fs from "node:fs";
import path from "node:path";

/** @param {string} p31caRoot p31ca package root */
export function resolvePrsPath(p31caRoot) {
  const candidates = [
    path.join(p31caRoot, "..", "..", "..", "p31-production-readiness.json"),
    path.join(p31caRoot, "..", "..", "..", "..", "p31-production-readiness.json"),
    path.join(process.cwd(), "p31-production-readiness.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** @param {string} prsPath */
export function loadHubCardTierMap(prsPath) {
  const prs = JSON.parse(fs.readFileSync(prsPath, "utf8"));
  const dims = prs.scoringSystem.dimensions.map((d) => d.id);
  const map = new Map();
  for (const it of prs.items) {
    if (it.kind !== "hubCard") continue;
    const total = dims.reduce((s, k) => s + it.score[k], 0);
    map.set(it.id, tierFromTotal(total));
  }
  return map;
}

/** @param {number} total */
function tierFromTotal(total) {
  if (total >= 85) return "P0";
  if (total >= 70) return "P1";
  if (total >= 50) return "P2";
  if (total >= 25) return "P3";
  return "P4";
}

/**
 * @param {{ id: string, status?: string, statusLabel?: string }} item
 * @param {Map<string,string>|null} tierMap
 * @returns {{ landingStatus: string, statusLabel: string } | null}
 */
export function prsGridStatus(item, tierMap) {
  const sl = (item.statusLabel || "").toUpperCase();
  if (sl === "HARDWARE") {
    return { landingStatus: "HARDWARE", statusLabel: "HARDWARE" };
  }
  if (!tierMap || !tierMap.has(item.id)) return null;
  const tier = tierMap.get(item.id);
  if (tier === "P0" || tier === "P1") {
    return { landingStatus: "LIVE", statusLabel: "LIVE" };
  }
  if (tier === "P2") return { landingStatus: "BETA", statusLabel: "BETA" };
  if (tier === "P3") return { landingStatus: "ALPHA", statusLabel: "ALPHA" };
  return { landingStatus: "CONCEPT", statusLabel: "CONCEPT" };
}

/**
 * @param {{ status?: string, statusLabel?: string }} item
 * @param {Map<string,string>|null} tierMap
 */
export function resolveAboutPosture(item, tierMap) {
  const pg = prsGridStatus(item, tierMap);
  if (pg) {
    return {
      landingStatus: pg.landingStatus,
      label: pg.statusLabel,
      badgeClass: badgeClassForLanding(pg.landingStatus, item),
    };
  }
  if ((item.statusLabel || "").toUpperCase() === "HARDWARE") {
    return { landingStatus: "HARDWARE", label: "HARDWARE", badgeClass: "hardware" };
  }
  if (item.status === "research") {
    return { landingStatus: "RESEARCH", label: item.statusLabel || "RESEARCH", badgeClass: "research" };
  }
  return {
    landingStatus: "LIVE",
    label: item.statusLabel || "LIVE",
    badgeClass: legacyBadgeClass(item.status),
  };
}

/** @param {string} landingStatus */
function badgeClassForLanding(landingStatus, item) {
  const m = {
    LIVE: "live",
    HARDWARE: "hardware",
    BETA: "beta",
    ALPHA: "alpha",
    CONCEPT: "concept",
    RESEARCH: "research",
  };
  return m[landingStatus] || legacyBadgeClass(item.status);
}

/** @param {string|undefined} status */
function legacyBadgeClass(status) {
  return (
    { live: "live", research: "research", hardware: "hardware", building: "live", tool: "research" }[
      status || "live"
    ] || "live"
  );
}

/**
 * @param {string} landingStatus
 * @param {{ tagline: string, title?: string }} item
 */
export function stackNarrativeLine(item, landingStatus) {
  const t = item.tagline || item.title || "";
  if (landingStatus === "HARDWARE") {
    return `${t} — hardware program; documentation and firmware live in-repo.`;
  }
  if (landingStatus === "LIVE") {
    return `${t} — production-capable hub surface (P31 PRS P0–P1); offline-first where stated, verify-gated in CI.`;
  }
  if (landingStatus === "BETA") {
    return `${t} — PRS beta (P2): usable day-to-day; not every integration is certified.`;
  }
  if (landingStatus === "ALPHA") {
    return `${t} — PRS alpha (P3): expect rough edges, incomplete verify coverage, and shifting contracts.`;
  }
  if (landingStatus === "CONCEPT") {
    return `${t} — PRS concept (P4): demo / experiment; not for safety-critical, medical, or legal reliance without separate review.`;
  }
  if (landingStatus === "RESEARCH") {
    return `${t} — research / published framing; still a static hub artifact, not a clinical or legal service.`;
  }
  return `${t}.`;
}

/**
 * @param {string} landingStatus
 */
export function sidebarPostureBlurb(landingStatus) {
  if (landingStatus === "LIVE") {
    return "Deployed on P31 Labs infrastructure · EIN 42-1888158. Posture label follows PRS when the readiness file is present at publish time.";
  }
  if (landingStatus === "HARDWARE") {
    return "Hardware roadmap — not a consumer product warranty statement. See firmware docs for BOM and bring-up.";
  }
  if (landingStatus === "BETA") {
    return "Beta (PRS P2): ship bar is partial — treat as early production with monitoring.";
  }
  if (landingStatus === "ALPHA") {
    return "Alpha (PRS P3): experimental — APIs and copy may change between deploys.";
  }
  if (landingStatus === "CONCEPT") {
    return "Concept (PRS P4): experimental demo — Worker SPA short URLs redirect to edge bundles without full production probes.";
  }
  if (landingStatus === "RESEARCH") {
    return "Research artifact — peer-reviewed or Zenodo-linked where noted; still not medical or legal advice.";
  }
  return "P31 Labs · EIN 42-1888158.";
}
