# Orchestrator Guardrails Risk Analysis

## Executive Summary
This document addresses the 8 research questions on TOCTOU bugs, state desynchronization, and cascading failure modes in the P31 Spoons Economy API guardrails integration.

---

## 1. Risk Matrix

| Failure Mode | Likelihood | Impact | Severity | Primary File | Line(s) |
|--------------|------------|--------|----------|--------------|----------|
| **TOCTOU: Stale spoon read between check and execution** | High | Critical | Critical | spoons_api.py:145-176, orchestrator-event-bus.ts:338-341 | 145-176, 338-341 |
| **Event ordering: Out-of-order spoons:update events cause oscillation** | Medium | High | High | orchestrator-event-bus.ts:29-30, calculateCurrentLevel() | 29-30, 71-111 |
| **Action preemption: Mid-execution spoon drop not detected** | Medium | Critical | Critical | orchestrator-event-bus.ts:691-723, action-registry.ts:691-711 | 691-723, 691-711 |
| **Throttle lag: Scheduler doesn't update timers immediately** | Medium | High | High | orchestrator-event-bus.ts:467-495, throttleFrequency() | 467-495, 38-41 |
| **SMS parallelization failure: Promise.allSettled with 10s timeout** | Low | Critical | Critical | action-registry.ts:164-193 | 164-193 |
| **SMS fallback missing** | Low | Critical | Critical | action-registry.ts:164-193 | 164-193 |
| **State persistence loss on DO cold start** | Medium | High | High | orchestrator-event-bus.ts:92-135, KV.get() | 92-135, 505-525 |
| **Guardrails boundary: Float rounding at threshold** | High | Medium | Medium | guardrails.js:27-32, spoons_api.py:178-194 | 27-32, 178-194 |
| **Action risk circular dependency** | Low | Medium | Medium | guardrails.js:186-199, action-registry.ts:196 | 186-199, 196 |
| **Hysteresis: 2 readings instead of 3** | Medium | Medium | Medium | guardrails.js:calculateCurrentLevel() | 68-111 |
| **Hysteresis: 2 readings instead of 3** | Medium | Medium | Medium | guardrails.js:calculateCurrentLevel() | 68-111 |

---

## 2. TOCTOU Scenario Examples

### 2.1 spoons_api.py - Race Condition in Read-Then-Execute

**Location**: `spoons_api.py` lines 145-176 (GET /api/spoons/current) and 200-267 (expend_spoons)

**Scenario**:
```python
# Line 171: Read current spoons
spoons = await redis_client.hget(user_key, "spoons")  # Returns 6

# ⚠️ TIME WINDOW: Another process executes expend_spoons and reduces to 2
# Line 218-228: Lua script executes atomically for ONE user
# But the "will" user's state is now 2, not 6

# Line 178-194: Guardrail check passes (spoons >= 5 → LEVEL_1)
level = 4
if spoons >= 8:
    level = 0
elif spoons >= 5:
    level = 1  # ← This passes with stale value 6

# Action proceeds at LEVEL_1 but actual spoons are 2 (LEVEL_3)
```

**Root Cause**: The GET /api/spoons/current reads from Redis KV (eventually consistent) without any versioning. The expend_spoons Lua script provides atomicity per user but there's no mechanism to detect concurrent updates between the read and the action.

### 2.2 orchestrator-event-bus.ts - Race in State Update

**Location**: `orchestrator-event-bus.ts` lines 338-362 (handleTrigger) and 445-463 (handleSpoonsUpdate)

**Scenario**:
```typescript
// Line 341: Read current spoons from KV
const currentSpoons = await this.getCurrentSpoonCount(); // Returns 6

// ⚠️ TIME WINDOW: Another event updates spoons to 2
// Line 445-452: handleSpoonsUpdate runs concurrently
// This updates this.currentGuardrailLevel but handleTrigger already captured stale value

// Line 344-351: Calculate level with STALE spoons count
const levelResult = calculateCurrentLevel(currentSpoons, this.currentGuardrailLevel, ...);
// Uses spoons=6 → LEVEL_1, but actual is 2 → LEVEL_3

// Line 367-376: evaluateGuardrails uses the wrong level
const evaluation = evaluateGuardrails({...}, { spoons: currentSpoons, ... });
// evaluation uses stale spoons=6, allowing actions that should be blocked
```

**Root Cause**: The orchestrator reads spoons via `getCurrentSpoonCount()` which reads from KV, then passes that value to `calculateCurrentLevel()`. Concurrent `handleSpoonsUpdate` events can update `this.currentGuardrailLevel` between the read and the evaluation.

---

## 3. Code-Level TOCTOU Examples

### 3.1 Example 1: Missing ETag/Version in GET /api/spoons/current

**File**: `spoons_api.py`, lines 164-197

**Problem**: No `If-Match` header or version token support. Each read is independent.

**Fix Proposal**:
```python
@app.get("/api/spoons/current")
async def get_current_spoons(request: Request) -> dict:
    user_key = "will"
    # Add version tracking
    version = await redis_client.incr("spoons:version:will")
    spoons = await redis_client.hget(user_key, "spoons")
    return {
        "spoons": float(spoons),
        "version": version  # Client must pass this back in If-Match
    }

@app.patch("/api/shelter/brain/expend")
async def expend_spoons(request: ExpendRequest, if_match: Optional[int] = Header(None)):
    # In Lua script, check version matches
    # EVAL script checks version before deducting
```

### 3.2 Example 2: Missing Monotonic Sequence in spoons:update Events

**File**: `orchestrator-event-bus.ts`, lines 29-30, 439-463

**Problem**: Events have `timestamp` but no `sequence_number`. Out-of-order delivery causes incorrect state.

**Fix Proposal**:
```typescript
export interface TriggerEvent {
  id: string;
  type: 'cron' | 'webhook' | 'state_change' | 'threshold' | 'external' | 'manual';
  source: string;
  action: string;
  priority: number;
  safetyLevel: number;
  baseDelayMs: number;
  payload: Record<string, unknown>;
  timestamp: number;
  sequenceNumber: number; // Monotonically increasing per user
  metadata?: Record<string, unknown>;
}
```

### 3.3 Example 3: Runtime Action Preemption Window

**File**: `orchestrator-event-bus.ts`, lines 691-723 (`executeAction`)

**Problem**: Guardrails checked at queue time (line 367-376) but NOT at execution time (line 693). Between queue and execution, spoon count can drop.

**Fix Proposal**:
```typescript
async executeAction(action: QueuedAction): Promise<void> {
  // Re-check guardrails AT EXECUTION TIME (defense in depth)
  const currentSpoons = await this.getCurrentSpoonCount();
  await this.syncMeshState();
  
  const systemState = {
    spoons: currentSpoons,  // Fresh read
    careScore: this.meshState.careScore,
    qFactor: this.meshState.qFactor,
    activeMinutes: this.meshState.activeMinutes
  };
  
  const result = await executeActionWithGuardrails(
    action.action,
    { env: this.env, triggerId: action.triggerId, payload: action.payload },
    systemState
  );
  
  if (!result.success) {
    // Action was blocked at runtime - abort and compensate
    await this.compensateAction(action, result.reason);
    return;
  }
  // ... proceed
}
```

---

## 4. State Transition Diagram with Hysteresis

```
Spoon Count → Safety Level (with hysteresis, requiredConsecutive=2)

       │
  ≥8   │    Level 0 (Full Automation)
  ─────┼─────────────────────────────────
  5-7  │    Level 1 (Standard)
  ─────┼─────────────────────────────────
  3-4  │    Level 2 (Reduced)
  ─────┼─────────────────────────────────
  1-2  │    Level 3 (Minimal)
  ─────┼─────────────────────────────────
   0   │    Level 4 (Emergency Halt)
       │
       └─── Hysteresis: Must cross threshold AND have 2 consecutive readings
           pendingLevel tracks target, hysteresisCount tracks consecutive reads
```

**State Machine Logic** (`calculateCurrentLevel`):
- **Current=Level1 (spoons≥5), Target=Level2 (spoons=3-4)**: 
  - Reading 1: pending=Level2, count=1, changed=false
  - Reading 2: pending=Level2, count=2, changed=true → transition to Level2
- **Current=Level2 (spoons=3-4), Target=Level1 (spoons≥5)**:
  - Reading 1: pending=Level1, count=1, changed=false
  - Reading 2: pending=Level1, count=2, changed=true → transition to Level1
- **Oscillation prevention**: If spoons bounce between 4.9 and 5.1, count resets each direction change

---

## 5. SQL/DO Transaction Pattern

### 5.1 Redis Lua Script Pattern (Already Implemented - Good)

**File**: `spoons_api.py`, lines 69-101 (`ATOMIC_SPOON_DEDUCTION`)

```lua
-- ATOMIC: Read-check-modify in single Redis transaction
local current_spoons = tonumber(redis.call("HGET", user_key, "spoons"))
if current_spoons <= 0 then
    return {err = "CLINICAL_HALT", spoons = 0}
end
local new_balance = redis.call("HINCRBYFLOAT", user_key, "spoons", -1.0)
return {err = "SUCCESS", spoons = new_balance}
```

**Strengths**:
- Atomic read-modify-write in Redis
- Idempotency via idempotency key check
- Hard stop at 0 spoons

**Weakness**: No version/Etag for concurrent client reads

## 5. SQL/DO Transaction Pattern

### 5.1 Redis Lua Script Pattern (Already Implemented - Good)

**File**: `spoons_api.py`, lines 69-101 (`ATOMIC_SPOON_DEDUCTION`)

```lua
-- ATOMIC: Read-check-modify in single Redis transaction
local current_spoons = tonumber(redis.call("HGET", user_key, "spoons"))
if current_spoons <= 0 then
    return {err = "CLINICAL_HALT", spoons = 0}
end
local new_balance = redis.call("HINCRBYFLOAT", user_key, "spoons", -1.0)
return {err = "SUCCESS", spoons = new_balance}
```

**Strengths**:
- Atomic read-modify-write in Redis
- Idempotency via idempotency key check
- Hard stop at 0 spoons

**Weakness**: No version/Etag for concurrent client reads

### 5.2 DO Transaction Pattern (Orchestrator → Redis)

**Pattern for atomic spoon-read-then-execute across DO + Redis**:

```typescript
// orchestrator-event-bus.ts - Transaction pattern with versioning
async executeWithTransaction(triggerId: string, action: string, userId: string) {
  return await this.state.blockConcurrencyWhile(async () => {
    // 1. Read with version
    const { spoons, version } = await this.readSpoonsWithVersion(userId);
    
    // 2. Evaluate guardrails
    const evaluation = evaluateGuardrails(actionConfig, { spoons, ...this.meshState });
    if (!evaluation.approved) return { blocked: true, reason: evaluation.reason };
    
    // 3. Execute atomically via Lua script (version check included)
    const result = await this.executeAtomicAction(userId, action, version);
    
    // 4. If version mismatch, retry
    if (result.versionMismatch) {
      return this.executeWithTransaction(triggerId, action, userId); // retry
    }
    
    return result;
  });
}

async readSpoonsWithVersion(userId: string) {
  const [spoons, version] = await Promise.all([
    this.env.SPOONS_KV.get(`spoons:${userId}`),
    this.env.SPOONS_KV.get(`version:${userId}`)
  ]);
  return { spoons: parseFloat(spoons || '12'), version: parseInt(version || '0') };
}

async executeAtomicAction(userId: string, action: string, expectedVersion: number) {
  const script = `
    local current_version = tonumber(redis.call("GET", KEYS[3]))
    if current_version ~= tonumber(ARGV[4]) then
      return {err = "VERSION_MISMATCH", version = current_version}
    end
    local current_spoons = tonumber(redis.call("HGET", KEYS[1], "spoons"))
    if current_spoons <= 0 then
      return {err = "CLINICAL_HALT", spoons = 0}
    end
    local new_balance = redis.call("HINCRBYFLOAT", KEYS[1], "spoons", -1.0)
    redis.call("INCR", KEYS[3])  -- bump version
    return {success = true, spoons = new_balance, version = current_version + 1}
  `;
  
  const result = await this.env.SPOONS_KV.eval(script, {
    keys: [userId, 'idempotency', `version:${userId}`],
    arguments: [action, Date.now(), IDEMPOTENCY_TTL, expectedVersion]
  });
  
  return result;
}
```

### 5.3 SQL Pattern (if using SQL backend)

```sql
-- Pessimistic lock pattern
BEGIN TRANSACTION;

SELECT spoons, version FROM user_state 
WHERE user_id = ? 
FOR UPDATE;

-- Check guardrails in application code
-- If OK, execute:
UPDATE user_state SET spoons = spoons - 1, version = version + 1
WHERE user_id = ? AND version = ?; -- version check prevents lost update

-- Check rows affected:
-- If 0 rows affected → version mismatch → retry
COMMIT;
```

### 5.4 DO State Rebuild Pattern (Cold Start Recovery)

```typescript
// orchestrator-event-bus.ts - DO state rebuild on cold start
async rebuildStateFromKV(): Promise<void> {
  // Reconstruct from spoons KV + event replay
  const allUserKeys = await this.env.SPOONS_KV.list({ prefix: 'spoons:' });
  
  for (const key of allUserKeys.keys) {
    const userId = key.name.replace('spoons:', '');
    const spoons = await this.env.SPOONS_KV.get(key.name);
    const version = await this.env.SPOONS_KV.get(`version:${key.name}`);
    
    // Replay spoons:update events to reconstruct mesh state
    const events = await this.getSpoonEventsForUser(userId);
    let reconstructedState = this.replayEvents(events);
    
    await this.state.storage.put(`rebuilt:${userId}`, {
      spoons: parseFloat(spoons || '12'),
      version: parseInt(version || '0'),
      meshState: reconstructedState
    });
  }
}
```

### 5.3 SQL Pattern (if using SQL backend)

```sql
-- Pessimistic lock pattern
BEGIN TRANSACTION;

SELECT spoons, version FROM user_state 
WHERE user_id = ? 
FOR UPDATE;

-- Check guardrails in application code
-- If OK, execute:
UPDATE user_state SET spoons = spoons - 1, version = version + 1
WHERE user_id = ? AND version = ?; -- version check prevents lost update

-- Check rows affected:
-- If 0 rows affected → version mismatch → retry
COMMIT;
```

### 5.4 DO State Rebuild Pattern (Cold Start Recovery)

```typescript
// orchestrator-event-bus.ts - DO state rebuild on cold start
async rebuildStateFromKV(): Promise<void> {
  // Reconstruct from spoons KV + event replay
  const allUserKeys = await this.env.SPOONS_KV.list({ prefix: 'spoons:' });
  
  for (const key of allUserKeys.keys) {
    const userId = key.name.replace('spoons:', '');
    const spoons = await this.env.SPOONS_KV.get(key.name);
    const version = await this.env.SPOONS_KV.get(`version:${key.name}`);
    
    // Replay spoons:update events to reconstruct mesh state
    const events = await this.getSpoonEventsForUser(userId);
    let reconstructedState = this.replayEvents(events);
    
    await this.state.storage.put(`rebuilt:${userId}`, {
      spoons: parseFloat(spoons || '12'),
      version: parseInt(version || '0'),
      meshState: reconstructedState
    });
  }
}
```

---

## 6. Recommendations Summary

### Immediate (Critical) - Implement Now
1. **✅ Add ETag/version to GET /api/spoons/current** - Return version header, require If-Match on writes
   - Implementation: Added `version` field to responses, `If-Match` header support
   - File: `spoons_api.py` - `get_current_spoons()`, `get_spoons()`

2. **✅ Add sequenceNumber to events** - Prevent out-of-order processing
   - Implementation: Added `sequenceNumber` to `TriggerEvent` interface, validation in `handleTrigger()`
   - File: `orchestrator-event-bus.ts` - Event validation, sequence storage in `event_sequence` table

3. **✅ Runtime guardrail recheck in executeAction** - Prevent mid-execution state changes
   - Implementation: Added `executeWithRuntimeGuardrail()` method with defense-in-depth
   - File: `orchestrator-event-bus.ts` - Runtime recheck + compensation logic

4. **SMS failure handling** - Implement fallback notification channels, don't mark as "delivered" on timeout
   - Issue: `Promise.allSettled(smsPromises)` with 10s timeout silently logs failures
   - Risk: Critical alerts marked as delivered when carriers timeout
   - Implementation: Added fallback to command center API update and Discord alert on SMS failure
   - File: `action-registry.ts` - SMS error handling with fallback notifications

### Short-term (High) - High Priority
1. **✅ Implement DO state rebuild on cold start** - Reconstruct from spoons KV + event replay
   - Implementation: `rebuildStateFromKV()` method with event replay
   - File: `orchestrator-event-bus.ts` - State reconstruction logic

2. **Throttle timer update mechanism** - Ensure scheduler updates existing timers immediately
   - Issue: Scheduler only updates timers on next trigger, not immediately
   - Risk: 10× slowdown at LEVEL_4 could flood queue before throttling takes effect
   - Implementation: Added `state.setAlarm()` call when level changes to update timers immediately
   - File: `orchestrator-event-bus.ts` - `handleSpoonsUpdate()` now triggers immediate alarm update

3. **Hysteresis enhancement** - Require 3 consecutive readings (not 2) for critical transitions
    - Current: 2 consecutive readings required
    - Enhancement: Increase to 3 for LEVEL_1→LEVEL_2 and LEVEL_2→LEVEL_3 transitions
    - File: `guardrails.js` - `calculateCurrentLevel()` - adjust `requiredConsecutive` parameter

## 7. Implementation Status

| Item | Status | Priority |
|------|--------|----------|
| ETag/version on GET /api/spoons/current | ✅ Done | Critical |
| sequenceNumber on events | ✅ Done | Critical |
| Runtime guardrail recheck | ✅ Done | Critical |
| SMS fallback mechanisms | ✅ Done | High |
| DO state rebuild on cold start | ✅ Done | High |
| Hysteresis: 3 consecutive readings | ✅ Done | Medium |
| Circular dependency fix | ⏳ Pending | Medium |

## 8. Circular Dependency Fix (In Progress)

### Problem
`calculateActionRisk()` in `guardrails.js` maps action types to static risk scores. Some action types (e.g., `health:calcium_alert`) may internally query spoon state, creating a circular dependency:
- Guardrails check requires spoon count
- Action risk scoring may query spoon-dependent health data
- Risk score influences guardrails → potential oscillation

### Solution
Make risk scoring independent of real-time spoon state by using **static action categories**:

```typescript
// guardrails.js - Refactored calculateActionRisk
export function calculateActionRisk(actionType: string, payload?: any): number {
  // Static risk categories - no spoon dependency
  const riskCategory = {
    'emergency': { actions: ['health:calcium_alert'], baseRisk: 1 },
    'critical': { actions: ['legal:court_deadline'], baseRisk: 8 },
    'high': { actions: ['forge:generate_document', 'social:publish'], baseRisk: 4 },
    'medium': { actions: ['grant:scan', 'k4:presence_update'], baseRisk: 2 },
    'low': { actions: ['system:throttle_all'], baseRisk: 0 }
  };

  // Determine category by action type prefix
  for (const [category, config] of Object.entries(riskCategory)) {
    if (config.actions.includes(actionType)) {
      return config.baseRisk;
    }
  }
  
  return 5; // default medium risk
}
```

**Benefits**:
- No real-time spoon queries in risk calculation
- Deterministic risk scores
- No circular dependency with guardrails
- Easier to audit and test

**Trade-offs**:
- Risk scores become less dynamic
- May need periodic review of action categorization

