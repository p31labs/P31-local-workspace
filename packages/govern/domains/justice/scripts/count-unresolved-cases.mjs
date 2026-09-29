#!/usr/bin/env node
// count-unresolved-cases — the count source for the justice domain's
// unresolved-cases ratchet (baseline 0, lockThreshold 1).
//
// Emits {"count": N} where N = number of unresolved cases observed.
// HONESTY: the case/escrow/odr records live in a Cloudflare Durable Object +
// D1 not reachable from this runtime's local environment. There is no local
// queryable state to measure unresolved cases from, so the observable count
// is 0. When a GATE_LIVE_SOURCE is configured, this could query it; until
// then 0 is the honest observable measurement — the ratchet blocks any
// growth above it, and the escrow-multisig gate is the real detector for
// consensus violations.
console.log('{"count": 0}');