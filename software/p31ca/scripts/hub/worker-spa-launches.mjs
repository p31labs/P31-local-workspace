/**
 * Single source for hub Worker SPAs exposed as https://p31ca.org/<path> (302 → *.workers.dev).
 * Registry Launch URLs: appUrlForWorkerSpa("<id>"). Edge + _redirects: npm run sync:worker-spa-launch.
 * Glass: p31-ecosystem.json glassProbes id worker-spa-* (workers.dev roots). Hub grid badges for these
 * products follow PRS tiers via scripts/hub/prs-production-posture.mjs when p31-production-readiness.json is present.
 */

export const CANONICAL_LAUNCH_ORIGIN = "https://p31ca.org";

/** @typedef {{ id: string; pathname: string; workersDevUrl: string }} WorkerSpaLaunch */

/** Stable order: matches _redirects worker block after /education. */
export const WORKER_SPA_LAUNCHES = [
  {
    id: "appointment-tracker",
    pathname: "/appointment-tracker",
    workersDevUrl: "https://p31-appointment-tracker.trimtab-signal.workers.dev",
  },
  {
    id: "love-ledger",
    pathname: "/love-ledger",
    workersDevUrl: "https://p31-love-ledger.trimtab-signal.workers.dev",
  },
  {
    id: "medical-tracker",
    pathname: "/medical-tracker",
    workersDevUrl: "https://p31-medical-tracker.trimtab-signal.workers.dev",
  },
  {
    id: "somatic-anchor",
    pathname: "/somatic-anchor",
    workersDevUrl: "https://p31-somatic-anchor.trimtab-signal.workers.dev",
  },
  {
    id: "legal-evidence",
    pathname: "/legal-evidence",
    workersDevUrl: "https://p31-legal-evidence.trimtab-signal.workers.dev",
  },
  {
    id: "contact-locker",
    pathname: "/contact-locker",
    workersDevUrl: "https://p31-contact-locker.trimtab-signal.workers.dev",
  },
  {
    id: "sleep-tracker",
    pathname: "/sleep-tracker",
    workersDevUrl: "https://p31-sleep-tracker.trimtab-signal.workers.dev",
  },
  {
    id: "budget-tracker",
    pathname: "/budget-tracker",
    workersDevUrl: "https://p31-budget-tracker.trimtab-signal.workers.dev",
  },
  {
    id: "genesis-gate",
    pathname: "/genesis-gate",
    workersDevUrl: "https://genesis-gate.trimtab-signal.workers.dev",
  },
];

const SPA_PATHS = new Set(WORKER_SPA_LAUNCHES.map((e) => e.pathname));

/** @param {string} id registry id */
export function appUrlForWorkerSpa(id) {
  const e = WORKER_SPA_LAUNCHES.find((x) => x.id === id);
  if (!e) {
    throw new Error(`worker-spa-launches: unknown id "${id}"`);
  }
  return CANONICAL_LAUNCH_ORIGIN + e.pathname;
}

/** Used by sync/verify — paths owned by Worker SPA launcher (exclusive). */
export function isWorkerSpaPathname(from) {
  return SPA_PATHS.has(from);
}
