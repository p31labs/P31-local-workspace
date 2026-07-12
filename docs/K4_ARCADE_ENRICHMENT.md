# K4 → Arcade Enrichment

**Version:** 1.0 (draft)
**Date:** 2026-07-11

## 1. Overview

The K4 family mesh (`k4-cage`, `k4-personal`, `k4-hubs`) tracks family topology and per-user state in Durable Objects. The Arcade dashboard can enrich its pilot cards with real-time mesh health data from K4.

## 2. Design

- The Arcade Worker adds a service binding to `k4-cage`.
- `k4-cage` exposes a new route: `GET /api/topology` that returns the current K4 topology for the hardcoded family.
- The Arcade reads this data and adds it to the pilot card for that family (if matched by DID).
- For other families (not in K4), the Arcade still shows D1 data.

## 3. Implementation

### `k4-cage/src/index.js`

Add route:
```javascript
if (url.pathname === '/api/topology' && request.method === 'GET') {
  const topology = await this.env.K4Topology.get(this.env.K4Topology.idFromName('default'));
  const state = await topology.getState();
  return new Response(JSON.stringify(state), { headers: { 'Content-Type': 'application/json' } });
}
```

### `apps/arcade/src/index.ts`

Add service binding in `wrangler.toml`:
```toml
services = [
  { binding = "K4_CAGE", service = "k4-cage" }
]
```

In `/api/pilots`, after fetching D1 data, call `K4_CAGE.fetch('/api/topology')` and merge the mesh health and edge love counts into the matching pilot card.

**Pseudo:**
```typescript
const topologyRes = await env.K4_CAGE.fetch('/api/topology');
const topology = await topologyRes.json();
const enhancedPilots = pilots.map(p => {
  if (p.did === topology.familyDid) {
    return { ...p, mesh_health: topology.health, edge_love: topology.edgeLove };
  }
  return p;
});
```

## 4. Rollout

1. Add the route to `k4-cage`.
2. Update the Arcade Worker with the service binding and merging logic.
3. Deploy both workers.
