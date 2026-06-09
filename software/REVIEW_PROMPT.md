# Worker Review Prompt for Claude Code

## Context
April 21-22, 2026 session - P31 Labs infrastructure recovery after system crash. Both repos cloned, mesh verified, workers deployed, code pushed to `workers-april22` branch.

## What Was Done

### 1. Recovery Verified (R1-R4)
- **R1**: Both repos recloned and verified
  - `phosphorus31.org`: PR #1 merged (mesh-bridge)
  - `andromeda`: PR #22 merged (unified k4-cage)
- **R2**: pnpm install + build succeeded (57s install, 73s build)
- **R3**: verify-mesh.sh: 29 passed, 1 expected failure (energy 1101), 6 warnings
- **R4**: k4-cage deployed with fallback for KV-only (no DO required)

### 2. Workers Deployed
- **k4-cage** (`https://k4-cage.trimtab-signal.workers.dev`):
  - `/api/mesh` returns 4 vertices (will, sj, wj, christyn), 6 edges
  - `/api/ping/will/sj` increments love in KV
  - Fallback handlers when DO not available

- **p31-agent-hub** (`https://p31-agent-hub.trimtab-signal.workers.dev`):
  - Workers AI with tool bindings to k4-cage, k4-personal, k4-hubs
  - Read tools: get_family_mesh, get_personal_mesh, list_hubs
  - Write tools (internal only): hubs_create, hub_dock_bind/unbind, hub_presence, hub_ping

### 3. Code Added to Repo (`workers-april22` branch)

#### k4-personal/ (NEW - 463 lines)
- `src/index.js`: PersonalAgent DO with SQLite
  - `/agent/:userId/chat` - AI chat with energy-aware system prompt
  - `/agent/:userId/history` - Message history
  - `/agent/:userId/state` - PUT/GET state (profile, scrub_rules, energy)
  - `/agent/:userId/energy` - Spoon theory tracking
  - `/agent/:userId/bio` - Biometric telemetry ingest (calcium, HR, hrv, etc.)
  - `/agent/:userId/reminders` - Scheduled reminders
  - Alarm-based flush to D1
- `wrangler.toml`: DO binding, AI, optional D1

#### k4-hubs/ (NEW - 89 lines)
- `src/index.js`: Hub router
  - `/route` - Cross-agent message routing
  - `/mesh-state/:scope` - Room stats
  - Worker-to-Worker bindings to k4-cage, k4-personal
- `wrangler.toml`: Service bindings, KV namespace

#### p31-agent-hub/ (UPDATED - 638 lines)
- `src/index.js`: Full agent with:
  - Tool definitions (READ_TOOLS, WRITE_TOOLS)
  - Mesh pack fetching
  - AgentSession DO for history
  - Auth + PII scrubbing

#### k4-cage/ (UPDATED - 749 lines)
- `src/index.js`: Added fallbacks when DO unavailable:
  - `topologyFetch()` returns 503 if no DO
  - `/api/mesh` returns static K4 if no DO
  - `/api/ping/:from/:to` increments in KV without DO

## Issues to Review

1. **Energy 1101** - Pre-existing bug, not crash-related
   - k4-personal returns error code 1101 on `/agent/will/energy`
   - Root cause: D1 query expecting data that doesn't exist
   - Trace: "Expected exactly one result from SQL query, but got no results"

2. **DO Migration Conflicts** - k4-cage had old DO migration tag (`v2-hibernation`)
   - Worked around by removing DO bindings and using KV-only fallback
   - Deployment works but doesn't use Durable Objects

3. **Protected Branch** - Can't push directly to main
   - Pushed to `workers-april22` branch instead

4. **Missing k4-hubs in磷**31.org** - The worker isn't in the Super Centaur repo

## Review Tasks

1. **Verify mesh still alive**:
   ```bash
   curl -s https://k4-cage.trimtab-signal.workers.dev/api/mesh | python3 -m json.tool
   ```

2. **Test ping edge**:
   ```bash
   curl -s -X POST https://k4-cage.trimtab-signal.workers.dev/api/ping/will/sj | python3 -m json.tool
   ```

3. **Review k4-personal energy bug**:
   - Check the `/agent/will/energy` endpoint
   - The DO is trying to query SQLite but tables may not exist
   - PersonalAgent constructor creates tables on init - verify that's working

4. **Recommend fix for energy 1101**:
   - Either add fallback when query returns empty
   - Or ensure D1 tables exist on first run

5. **Review wrangler.toml configurations**:
   - k4-personal needs D1 bound for telemetry flush
   - k4-hubs needs KV namespace bound
   - Verify all required bindings exist in Cloudflare

6. **Consider merging workers-april22**:
   - Or keep as feature branch for further testing

## Non-Technical CWPs Still Pending
- Schedule psych evaluation (THE GATE)
- Print + send medical letters (May 7)
- File Motion for Reconsideration (May 14)

---

*Ca₉(PO₄)₆*