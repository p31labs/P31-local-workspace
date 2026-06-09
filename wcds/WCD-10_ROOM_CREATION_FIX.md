# WCD-10: MULTIPLAYER ROOM CREATION FAILURE

**Status:** 🟡 HIGH — blocks multiplayer testing, does not block solo play
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-09 (viewport fix). Multiplayer is Track 2 on ship timeline.
**QA Source:** Carrie Johnson (sister), Android device, bonding.p31ca.org

---

## 1. DEFECT DESCRIPTION

User enters name ("Carrie"), selects color (green), taps "Create Room." Immediately receives red error text: "Could not create room. Try again."

The multiplayer lobby UI is rendering correctly (name input, color selector, Create Room button, Back link). The failure is in the network request to the Cloudflare Worker relay.

**Impact:** Multiplayer cannot be tested. Solo play is unaffected. This is expected given the build timeline (multiplayer wiring scoped for Mar 3-5), but the lobby UI is already deployed and visible to testers, which means testers are hitting a dead end.

---

## 2. DIAGNOSTIC SEQUENCE

Run these in order. Stop when you find the failure point.

### Check 1: Is the Worker deployed?

```bash
curl -v https://bonding-relay.trimtab-signal.workers.dev
```

- If **404 or DNS failure:** Worker is not deployed. Run `wrangler deploy` from the worker directory.
- If **200 with response:** Worker is live. Proceed to Check 2.
- If **403:** Cloudflare is blocking. Check Worker route configuration.

### Check 2: Is the KV namespace bound?

Open `wrangler.toml` for the relay worker. Verify:

```toml
[[kv_namespaces]]
binding = "BONDING_KV"       # or whatever the code references
id = "<actual-kv-namespace-id>"
```

If the binding name in `wrangler.toml` doesn't match what the Worker code references (e.g., code says `env.ROOMS` but toml says `binding = "BONDING_KV"`), the Worker will crash on room creation.

### Check 3: Is there a CORS issue?

In the Worker code, verify the response headers include:

```javascript
headers: {
  'Access-Control-Allow-Origin': '*',  // or specifically 'https://bonding.p31ca.org'
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

Also verify there is an OPTIONS preflight handler:

```javascript
if (request.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: corsHeaders });
}
```

Without this, the browser blocks the POST to create a room before it ever reaches the Worker logic.

### Check 4: What is the client sending?

In the BONDING client code, find the room creation fetch call. Verify:

- URL matches the deployed Worker URL exactly (no trailing slash mismatch)
- Method is POST (not GET)
- Body is valid JSON with expected fields (player name, color)
- Content-Type header is set to `application/json`

### Check 5: What is the Worker returning?

Add temporary logging to the Worker:

```javascript
console.log('Room creation request:', JSON.stringify(request));
```

Then check `wrangler tail` for the error output.

---

## 3. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `worker-telemetry.ts` or `worker-relay.ts` | Diagnose/fix Worker-side room creation |
| `wrangler.toml` | Verify KV namespace binding |
| `src/multiplayer/` (or equivalent) | Fix client-side fetch URL, CORS, error handling |
| `src/components/Lobby.tsx` (or equivalent) | Improve error messaging if possible |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/telemetry/*` | Genesis Block telemetry is separate from multiplayer relay |
| `src/chemistry/*` | Chemistry engine is unrelated |
| `src/economy/*` | L.O.V.E. ledger is unrelated |
| Any file modified in WCD-09 | Viewport fix is a separate concern |

---

## 4. FIX CATEGORIES

Based on diagnostic results, apply the appropriate fix:

### If Worker not deployed:

```bash
cd <worker-directory>
wrangler deploy
```

Verify with `curl` after deploy.

### If KV binding mismatch:

Update `wrangler.toml` to match the variable name used in Worker code, then redeploy.

### If CORS missing:

Add CORS headers to all Worker responses and add OPTIONS handler. Redeploy.

### If client URL mismatch:

Update the fetch URL in the client to match the deployed Worker URL exactly. Rebuild and redeploy client.

### If multiplayer code is incomplete / stub:

If the room creation endpoint doesn't exist yet in the Worker (i.e., this feature is genuinely not built yet), then the fix is:

1. **Hide the multiplayer lobby UI** behind a feature flag or remove the "Play Together" button from the main menu until multiplayer is wired.
2. Do NOT leave a broken path visible to testers. Either it works or it's not there.

This is the most likely scenario given the build timeline. If so, the WCD reduces to: **gate the lobby UI behind a `MULTIPLAYER_ENABLED` flag, default false, deploy.**

---

## 5. VERIFICATION CHECKLIST

- [ ] **Room creation succeeds:** Tap Create Room → get a 6-char room code, enter game
- [ ] **OR: Lobby hidden:** If multiplayer is not yet wired, "Play Together" is not visible to users
- [ ] **Solo play unaffected:** "Play" (solo) still works exactly as before
- [ ] **CORS clean:** No CORS errors in browser DevTools console on room creation
- [ ] **Worker responding:** `curl https://bonding-relay.trimtab-signal.workers.dev` returns valid response
- [ ] **Existing Vitest suite:** `npm run test` — all 484 tests still green
- [ ] **Build clean:** `npm run build` — zero errors
- [ ] **TypeScript clean:** `tsc --noEmit` — zero errors

---

## 6. ARCHITECTURAL NOTE

Per Passport §4 architecture decisions: "Multiplayer is NOT co-editing. Each player builds independently in a shared room. The relay is a bulletin board."

The room creation flow should be:

1. Player taps "Create Room"
2. Client POSTs to Worker with `{ name, color }`
3. Worker generates 6-char room code, stores in KV: `room:{code}` → `{ players: [{ name, color }], created: timestamp }`
4. Worker returns `{ code }` to client
5. Client displays room code for sharing
6. Second player enters code to join

Keep it simple. No WebSocket. KV polling on an interval (every 2-3 seconds) is the correct approach for this scale. The relay is a bulletin board.

---

*WCD-10 — Opus — March 2, 2026*
*"If it's not ready, hide it. Don't show testers a door that opens to a wall."*
