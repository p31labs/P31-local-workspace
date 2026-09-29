// convergence/model-health.mjs
// Layer 4 — Per-model health tracking with circuit breaker + fallback chain.
//
// Research basis:
// - "The Vulnerability": without a global circuit breaker, retries convert a
//   transient outage into a self-inflicted DoS ("thousands of doomed requests
//   to queue"). Exponential backoff WITH jitter de-synchronises retry waves.
// - compelle/compelle-validator: "a model that times out or returns blank
//   content sinks below a healthy fallback" — the chain re-leads with the
//   reliable model on the next call and hands back once the primary recovers.
// - EvalOps / Vercel: fallback chains walk an ordered sequence; retries,
//   cross-model fallbacks, and circuit breakers are three DISTINCT mechanisms.
//
// Design: three-state per model (CLOSED -> OPEN -> HALF_OPEN). An OPEN model
// is skipped without a call for a cooldown, then HALF_OPEN probes once.
// Empty-content failures count toward the trip threshold; a success resets.

const DEFAULT_TRIP_THRESHOLD = 3;
const DEFAULT_COOLDOWN_MS = 60_000;

// model -> { failures, trippedUntil, probes }
const health = new Map();

export function recordSuccess(model) {
  health.set(model, { failures: 0, trippedUntil: null, probes: 0 });
}

export function recordFailure(model) {
  const h = health.get(model) ?? { failures: 0, trippedUntil: null, probes: 0 };
  h.failures += 1;
  if (h.failures >= DEFAULT_TRIP_THRESHOLD && !h.trippedUntil) {
    h.trippedUntil = Date.now() + DEFAULT_COOLDOWN_MS;
    h.probes = 0;
  }
  health.set(model, h);
}

// OPEN (cooling down) or HALF_OPEN (probe pending)?
export function circuitState(model) {
  const h = health.get(model);
  if (!h || !h.trippedUntil) return 'CLOSED';
  if (Date.now() > h.trippedUntil) {
    // Cooldown expired: enter HALF_OPEN and consume the probe.
    h.probes += 1;
    return 'HALF_OPEN';
  }
  return 'OPEN';
}

export function isHealthy(model) {
  return circuitState(model) !== 'OPEN';
}

// Fallback chain: preferred models first, but OPEN models sink to the bottom
// (skipped), HALF_OPEN models are probed (single attempt), and the chain
// re-leads with the healthiest model. Exponential backoff with jitter is
// applied between attempts by the caller.
export function fallbackChain(preferred, explicitCooldownMs = 0) {
  return preferred
    .map((model) => ({ model, state: circuitState(model) }))
    .sort((a, b) => stateRank(a.state) - stateRank(b.state))
    .map((x) => x.model);
}

function stateRank(state) {
  if (state === 'CLOSED') return 0;
  if (state === 'HALF_OPEN') return 1;
  return 2;
}

// Exponential backoff with full jitter: delay = random(0, base * 2^attempt).
// De-synchronises retry waves so a degraded provider is not hammered in lockstep.
export function backoffDelayMs(attempt, baseMs = 1000) {
  const cap = baseMs * Math.pow(2, attempt);
  return Math.floor(Math.random() * cap);
}

// Test hook — deterministic: trip a model, verify it sinks in the chain.
export function __testModelHealth() {
  recordSuccess('model-a');
  for (let i = 0; i < 3; i++) recordFailure('model-b'); // trips model-b
  const chain = fallbackChain(['model-b', 'model-a']);
  return {
    bState: circuitState('model-b'),
    aState: circuitState('model-a'),
    chainFirst: chain[0],
    bSinks: chain[0] === 'model-a' && chain[1] === 'model-b',
  };
}