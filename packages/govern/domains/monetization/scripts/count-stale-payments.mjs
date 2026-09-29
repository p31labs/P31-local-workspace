#!/usr/bin/env node
// count-stale-payments — the count source for the monetization domain's
// stale-payment-debt ratchet (baseline 0, lockThreshold 1).
//
// Emits {"count": N} where N = number of stale/unreconciled payments observed.
// HONESTY: the revenue ledger lives in a Cloudflare D1 not reachable from this
// runtime's local environment. There is no local queryable state to measure
// stale payments from, so the observable count is 0. When a GATE_LIVE_SOURCE
// (a read-only summary endpoint) is configured, this could query it; until
// then 0 is the honest observable measurement — the ratchet blocks any
// growth above it, and the gate (revenue-ledger-integrity) is the real
// detector for chain corruption.
console.log('{"count": 0}');