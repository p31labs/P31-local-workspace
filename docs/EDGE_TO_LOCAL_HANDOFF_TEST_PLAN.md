# Edge‑to‑Local Handoff Test Plan

## Objective

Verify that PHOS gracefully falls back from edge inference to local WebLLM when the network is disrupted, while maintaining the spoon‑aware system prompt and design token context.

## Pre‑requisites

- A WebGPU‑capable device (Chrome 120+ with GPU enabled, or Edge 120+)
- PHOS running locally or deployed (https://phos.p31ca.org)
- Browser DevTools open (Network tab)

## Test Scenarios

### Scenario 1: Simulate Network Blackout (Edge Unreachable)

**Steps:**

1. Open PHOS in the browser.
2. Verify that the default routing decision is `'edge'` (or `'auto'`).
3. In DevTools → Network tab, throttle the network to "Offline" (or block `gateway.p31ca.org` via host file / browser extension).
4. Send a message (e.g., "What's my current spoon level?").
5. Observe the response.

**Expected Behavior:**

- The system should detect WebGPU capability and fall back to local WebLLM.
- The response should be generated locally (check `useSovereignBrain` state: `decision === 'local'`).
- The response should reflect the spoon‑aware prompt (e.g., if spoons=3, response should be balanced; if spoons=0, response should be grounding).
- The UI should show a status indicator (e.g., "Local model active" or "Offline mode").

**Pass Criteria:**

- No network errors displayed to user.
- Response is generated within a reasonable time (local model is slower, but should not hang).
- Spoon‑aware behavior is preserved.

### Scenario 2: WebGPU Unsupported (Fallback to WASM or Edge)

**Steps:**

1. Use a browser that does not support WebGPU (e.g., Firefox, or Chrome with GPU disabled).
2. Open PHOS.
3. Send a message.
4. Observe the routing decision.

**Expected Behavior:**

- `detectCapability()` returns `false`.
- The system should attempt WASM inference (Transformers.js) if available, otherwise fall back to edge.
- If edge is reachable, it should use edge; if not, gracefully degrade to a fallback message.

**Pass Criteria:**

- Graceful degradation: no crashes, clear status message.

### Scenario 3: Rapid Network Flapping (Edge ↔ Local Handoff)

**Steps:**

1. Start with edge available.
2. Send a message → edge response.
3. Disconnect network.
4. Send a message → local response.
5. Reconnect network.
6. Send a message → edge response (or local if WebGPU is preferred).

**Expected Behavior:**

- Transitions are seamless; no duplication or lost state.
- The system does not switch mid‑response.

**Pass Criteria:**

- All messages complete successfully.
- The routing decision is consistent per request.

### Verification Commands

```bash
# Check WebGPU availability in the browser console
!!navigator.gpu

# Force local mode in PHOS (override)
localStorage.setItem('phos:routingOverride', 'local')

# Force edge mode
localStorage.setItem('phos:routingOverride', 'edge')
```

### Test Report Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| Scenario 1: Network blackout | ⬜ | |
| Scenario 2: WebGPU unsupported | ⬜ | |
| Scenario 3: Network flapping | ⬜ | |
