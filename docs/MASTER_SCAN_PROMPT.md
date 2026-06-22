# Jitterbug Full System Scan — Master Execution Prompt

**Version:** 1.0  
**Date:** June 22, 2026  
**Workspace:** `/home/p31/P31-local-workspace`  
**Stack:** Cloudflare Workers + Durable Objects + D1 + R2 + KV + React PWA  
**Philosophy:** Ghost Factory / Ephemeralization / Cognitive Accessibility  

---

## ROLE & IDENTITY

You are the **P31 Architect agent (Opus lane)** executing a complete, autonomous audit and deployment cycle of the Jitterbug Sierpinski Orchestrator ecosystem.

**Your mandate:**
- Review the entire codebase for architecture compliance, code quality, and maturity
- Analyze gaps against the Ghost Factory ephemeralization architecture
- Research local issues (no web access)
- Build missing components or fixes
- Test everything (unit, integration, DO, fault)
- Deploy to production after successful verification
- Verify end-to-end with a live brain dump
- Produce a final comprehensive report

**Tag-out protocol (SOULSAFE):**
- You MAY touch: QA, architecture, gate-checks, risk audits, strategic builds, docs, tests, CI configs
- You MUST NOT touch: firmware, hardware-coupled code, legal documents, operator personal data

---

## INPUTS

Load these before starting:

| Input | Path | Purpose |
|-------|------|---------|
| **Verified Facts** | `CLAUDE.md` "VERIFIED FACTS" table | Canonical values (EIN, test counts, versions) — never hallucinate |
| **Architecture** | `docs/ARCHITECTURE.md` | 5-layer pattern, stack, recursive extension |
| **Ephemeralization** | `docs/EPHEMERALIZATION*.md` | Ghost Factory philosophy, isolation fields, bubble lifecycle |
| **Repository Map** | `docs/REPOSITORY_LAYOUT.md` | Canonical file locations |
| **Maturity Model** | `admin/P31_MATURITY_MODEL.md` | PMM v1.1 stages and dimensions |
| **Grading Report** | `GRADING_REPORT.md` | Current artifact scores |
| **Env Config** | `software/.env.jitterbug` | PSK, API URL, OC credentials (NEVER commit secrets) |
| **Wrangler Config** | `software/packages/jitterbug-api/wrangler.toml` | Bindings, triggers, compatibility flags |

---

## PHASE 0 — CONTEXT LOAD

Before any execution, read these files and confirm understanding:

```bash
# Load canonical context
cat CLAUDE.md | grep -A 50 "VERIFIED FACTS"
cat docs/ARCHITECTURE.md
cat docs/EPHEMERALIZATION.md
cat admin/P31_MATURITY_MODEL.md
cat GRADING_REPORT.md
```

**Emit:** Context loaded confirmation with key facts (EIN, API URL, PMM stage targets).

---

## PHASE 1 — REVIEW

### 1.1 Architecture Compliance

Read and verify:
- `docs/ARCHITECTURE.md` — 5-layer pattern (Capture → Decompose → Agent Runtime → Parallel Orchestration → Convergence Gate)
- `docs/EPHEMERALIZATION_TECHNICAL.md` — isolation field, bubble lifecycle, Worker spawning
- `software/packages/brain-dump-orchestrator/src/` — classifyAxis, axisToBrainDump, K4GateChecker, RecursiveBrainDumpOrchestrator

**Checklist:**
- [ ] 5-layer pattern implemented in code
- [ ] Recursive extension present with classifyAxis and K4GateChecker
- [ ] `isolation` field exists on AxisConfig (`shared` | `isolated` | `sandboxed`)
- [ ] Bubble lifecycle (write → TTL → cleanup) implemented
- [ ] Ghost Factory principles: no persistent state debt, ephemeral storage, disposable workspaces

### 1.2 Code Quality

```bash
cd /home/p31/P31-local-workspace/software

# Typecheck ALL packages
pnpm run typecheck --recursive --filter "./packages/*" --filter "./bonding"

# Lint (if configured)
pnpm run lint --recursive 2>/dev/null || echo "No lint script found"

# Check for debugging artifacts
rg -n "console\.log|TODO|FIXME|HACK|XXX" software/packages/jitterbug-api/src/ || true
rg -n "any\b" software/packages/jitterbug-api/src/*.ts || true
```

**Checklist:**
- [ ] Zero TypeScript errors on all core packages
- [ ] Zero `any` types in production code
- [ ] Zero `console.log` debugging artifacts (or none in production paths)
- [ ] No `as unknown as` type escapes
- [ ] Workers anti-patterns eliminated: no `Math.random()`, no `passThroughOnException`, no floating promises

### 1.3 Test Coverage

```bash
cd /home/p31/P31-local-workspace/software/packages/brain-dump-orchestrator
pnpm run test:run

cd ../jitterbug-api
pnpm run test:run

cd ../../bonding
pnpm run test:run
```

**Checklist:**
- [ ] brain-dump-orchestrator: 23/23 tests passing
- [ ] jitterbug-api: all tests passing (unit + integration + DO + fault)
- [ ] bonding: 424 tests / 32 suites passing
- [ ] No skipped tests without documented reason
- [ ] Test files exist for every changed source file

### 1.4 Quality Gates

```bash
cd /home/p31/P31-local-workspace

# Maturity scoring
python3 scripts/grade-repo.py

# Maturity gate enforcement
python3 scripts/check-maturity-gate.py

# Verify STYLE dimension (CSS pipeline)
python3 scripts/grade-repo.py --check-style jitterbug-pwa --require-css
```

**Checklist:**
- [ ] `grade-repo.py` produces valid JSON grading report
- [ ] `check-maturity-gate.py` exits with code 0 (all CORE_PACKAGES ≥ SPROUT)
- [ ] CSS pipeline validated: deps → entry file → import chain → dist CSS
- [ ] No maturity regressions from baseline

### 1.5 Documentation Audit

Verify existence and completeness of:
- [ ] `docs/ARCHITECTURE.md`
- [ ] `docs/DEPLOYMENT.md`
- [ ] `docs/API.md`
- [ ] `docs/USER_GUIDE.md`
- [ ] `docs/CHANGELOG.md`
- [ ] `docs/CONTRIBUTING.md`
- [ ] `docs/BRIDGE.md`
- [ ] `docs/OPEN_COLLECTIVE.md`
- [ ] `docs/EMERGENCY_SCRIPTS.md`
- [ ] `docs/IMMEDIATE_ACTIONS.md`
- [ ] `docs/REPOSITORY_LAYOUT.md`
- [ ] `docs/EPHEMERALIZATION.md`
- [ ] `docs/EPHEMERALIZATION_TECHNICAL.md`
- [ ] `docs/EPHEMERALIZATION_ROADMAP.md`

**Deliverable:** `docs/REVIEW_AUDIT.md`

---

## PHASE 2 — ANALYZE

### 2.1 Current State Report

Generate a comprehensive status report:

```bash
# Current git state
git log --oneline -10

# Uncommitted changes
git status --short

# Branch info
git branch -v
```

**Deliverable:** `docs/CURRENT_STATE.md` containing:
- Maturity scores per package (from grading-index.json)
- Build status (last successful build artifacts)
- Deployment status (live endpoints, last deploy time)
- Open external deadlines (GA registration, mortgage, ASAN, CS&S)
- Open Collective integration status
- Gumroad product readiness

### 2.2 Gap Analysis

Compare current implementation against Ghost Factory architecture:

| Component | Required (EPHEMERALIZATION.md) | Current Status | Gap |
|-----------|-------------------------------|----------------|-----|
| Axis isolation field | `shared`/`isolated`/`sandboxed` | Missing | Must add |
| Isolated Worker execution | Spawn per-isolated axis | Missing | Must implement |
| Bubble cleanup cron | Auto-delete bubbles > 1h | Missing | Must add |
| Preview environments | PR-based ephemeral deploy | Missing | Must add |
| Ephemeral skill trees | Session-specific personalities | Missing | Future |
| R2 30-day TTL | Auto-expire deliverables | ✅ Done | None |
| D1 90-day purge | Auto-purge old records | ✅ Done | None |

### 2.3 Risk Assessment

Evaluate risks:
- **Unstyled deployments:** CSS pipeline gate hardening — is it functional?
- **Runtime errors:** Any `passThroughOnException`, unhandled promise rejections?
- **DB schema mismatches:** Are all migrations applied? Check D1 version.
- **R2 lifecycle:** Verify 30-day rule is active via `wrangler r2 bucket lifecycle list`
- **Cron integrity:** Verify triggers not stripped by sed in deploy script

**Deliverable:** `docs/GAP_ANALYSIS.md` + `docs/RISK_ASSESSMENT.md`

---

## PHASE 3 — RESEARCH (Local)

No web access. Investigate using only local filesystem.

### 3.1 Open Issues

```bash
# Search for unresolved TODO/FIXME/HACK
rg -n "TODO|FIXME|HACK|XXX|DEPRECATED" software/packages/jitterbug-* --type ts

# Check for orphaned files
find software/packages/jitterbug-* -name "*.ts" | while read f; do
  base=$(basename "$f" .ts)
  # Check if imported anywhere
  rg -l "$base" software/packages/jitterbug-*/src/ 2>/dev/null || echo "ORPHAN: $f"
done
```

### 3.2 Config Consistency

```bash
# Compare wrangler.toml bindings vs actual Env interface
diff <(grep -E "^\\s*(DB|R2|KV|DO)\\b" software/packages/jitterbug-api/wrangler.toml) \
     <(grep -E "^\s*(DB|R2|KV|ORCHESTRATOR_DO)" software/packages/jitterbug-api/src/index.ts)

# Check OC credentials consistency
diff software/.env.jitterbug <(cat <<EOF
JITTERBUG_PSK=***REDACTED***
OC_CLIENT_ID=
OC_CLIENT_SECRET=
OC_REDIRECT_URI=
OC_API_BASE=
OC_PERSONAL_TOKEN=
EOF
)
```

**Deliverable:** `docs/RESEARCH_NOTES.md`

---

## PHASE 4 — BUILD

### 4.1 Add Isolation Field to Axis Config

Edit `software/packages/brain-dump-orchestrator/src/types/recursive.ts`:

```typescript
// Add to AxisConfig interface:
isolation?: 'shared' | 'isolated' | 'sandboxed';
```

### 4.2 Add Bubble Cleanup Cron

Edit `software/packages/jitterbug-api/src/index.ts` — add a cron handler:

```typescript
async scheduled(event: ScheduledEvent, env: Env): Promise<Response> {
  // ... existing daily purge ...
  
  if (event.cron === '*/30 * * * *') {
    // Bubble cleanup every 30 minutes
    const bucket = env.R2_BUCKET;
    const list = await bucket.list({ prefix: 'bubbles/' });
    const cutoff = Date.now() - (1 * 60 * 60 * 1000); // 1 hour TTL
    let deleted = 0;
    for (const obj of list.objects) {
      if (obj.uploaded < cutoff) {
        await bucket.delete(obj.key);
        deleted++;
      }
    }
    console.log(`[bubble-cleanup] Deleted ${deleted} expired bubbles`);
  }
  
  return new Response('OK');
}
```

### 4.3 Fix Any Issues Found

Apply minimal, surgical fixes for any issues found in Phases 1-3. Do NOT refactor beyond the finding.

**Deliverable:** Git diff summary of all changes made.

---

## PHASE 5 — TEST

### 5.1 Full Test Suite

```bash
cd /home/p31/P31-local-workspace/software

# Core packages
pnpm run typecheck --recursive --filter "./packages/*"

# jitterbug-api tests
cd packages/jitterbug-api
pnpm run test:run

# jitterbug-pwa tests
cd ../jitterbug-pwa
pnpm run test:run

# bonding tests
cd ../../bonding
pnpm run test:run
```

**Success Criteria:**
- All typechecks pass (exit code 0)
- All tests pass (exit code 0)
- No new warnings introduced

### 5.2 Build Validation

```bash
cd /home/p31/P31-local-workspace/software/packages/jitterbug-pwa
pnpm run build

# Verify build output
test -f dist/index.html || echo "FAIL: Missing index.html"
test -f dist/manifest.webmanifest || echo "FAIL: Missing manifest"
CSS_COUNT=$(find dist -name "*.css" 2>/dev/null | wc -l)
test "$CSS_COUNT" -gt 0 || echo "FAIL: No CSS output"
echo "✓ Build validated: $CSS_COUNT CSS files"
```

### 5.3 Maturity Gate Recheck

```bash
cd /home/p31/P31-local-workspace
python3 scripts/check-maturity-gate.py
```

---

## PHASE 6 — DEPLOY

### 6.1 Production Deploy

```bash
cd /home/p31/P31-local-workspace
bash software/scripts/deploy-jitterbug.sh 2>&1 | tee /tmp/jitterbug-deploy.log
```

**Success Criteria:**
- `deploy-jitterbug.sh` exits with code 0
- All builds succeed
- D1 migrations applied (no errors)
- PSK secret configured
- PWA deployed to Cloudflare Pages
- Worker deployed to production URL

### 6.2 Post-Deploy Health Check

```bash
PSK=$(grep JITTERBUG_PSK software/.env.jitterbug | cut -d= -f2)
API_URL=$(grep JITTERBUG_API_URL software/.env.jitterbug | cut -d= -f2)

# Wait for propagation
sleep 15

# Health check
HEALTH=$(curl -s -H "Authorization: Bearer $PSK" "$API_URL/health")
echo "Health: $HEALTH"

# Smoke test endpoints
for endpoint in /health /brain-dumps; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $PSK" "$API_URL$endpoint")
  echo "$endpoint: HTTP $STATUS"
done

# PWA check
PWA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://jitterbug-pwa.pages.dev/)
echo "PWA: HTTP $PWA_STATUS"
```

**Success Criteria:**
- `/health` returns 200 with `status: "ok"`
- All smoke endpoints return 200
- PWA returns 200
- No errors in deploy log

---

## PHASE 7 — VERIFY (E2E)

### 7.1 Submit Test Brain Dump

```bash
PSK=$(grep JITTERBUG_PSK software/.env.jitterbug | cut -d= -f2)
API_URL=$(grep JITTERBUG_API_URL software/.env.jitterbug | cut -d= -f2)

# Submit brain dump
RESPONSE=$(curl -s -X POST "$API_URL/brain-dump" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PSK" \
  -d '{
    "projectName": "E2E Verification Test",
    "coreProblem": "Verify full orchestration pipeline",
    "constraints": [],
    "desiredEndState": {
      "description": "E2E test success",
      "targetStage": "fruit",
      "measurableCriteria": [],
      "convergenceTarget": "E2E"
    },
    "knownAssets": [],
    "openQuestions": []
  }')

echo "Response: $RESPONSE"
ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "$RESPONSE" | grep -oP '"id":"\K[^"]+')
echo "Brain Dump ID: $ID"
```

### 7.2 Poll for Completion

```bash
# Poll status every 5 seconds, max 60 attempts (5 minutes)
for i in $(seq 1 60); do
  STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $PSK" "$API_URL/brain-dump/$ID/status")
  STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
  echo "[$i] Status: $STATUS"
  
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo "Final state reached: $STATUS"
    echo "Full response: $STATUS_RESPONSE"
    break
  fi
  
  sleep 5
done
```

**Success Criteria:**
- Brain dump reaches `completed` status
- Convergence result is present and valid JSON
- Axes parsed successfully

### 7.3 Webhook Verification

```bash
# Test fiscal-host webhook (mock)
curl -s -X POST "$API_URL/webhook/fiscal-host" \
  -H "Content-Type: application/json" \
  -d '{"activity":{"type":"fiscal-host-change","data":{"status":"granted"}}}' | jq .

# Test gumroad webhook (mock - if implemented)
curl -s -X POST "$API_URL/webhook/gumroad" \
  -H "Content-Type: application/json" \
  -H "X-Gumroad-Signature: test" \
  -d '{"type":"sale","sale_id":"test-123","product_permalink":"bros-worker-template","price":9900}' | jq .
```

### 7.4 Visual Verification

Open in browser (or use curl):
- [ ] `https://jitterbug-pwa.pages.dev/` — PWA loads
- [ ] `https://jitterbug-pwa.pages.dev/visual-translator.html` — Visual Translator loads
- [ ] `https://jitterbug-pwa.pages.dev/kill.html` — Kill Switch loads
- [ ] `https://main.jitterbug-pwa.pages.dev/` — Main branch PWA loads

---

## PHASE 8 — REPORT

### 8.1 Generate Final Report

Create `docs/LATEST_SCAN_REPORT.md` with this structure:

```markdown
# Jitterbug System Scan Report
**Date:** <timestamp>
**Commit:** <git rev-parse HEAD>
**Agent:** P31 Architect (Opus lane)

## Executive Summary
| Metric | Result |
|--------|--------|
| Architecture Compliance | PASS / FAIL |
| TypeScript Compilation | PASS / FAIL |
| Tests | X/Y passed |
| Maturity Gate | PASS / FAIL |
| Deploy | SUCCESS / FAILED |
| E2E Verification | PASS / FAIL |

## Phase Results
### Phase 1: Review
- Architecture: ...
- Code Quality: ...
- Tests: ...
- Gates: ...
- Docs: ...

### Phase 2: Analysis
- Gaps found: ...
- Risks identified: ...

### Phase 3: Research
- Issues found: ...
- Config inconsistencies: ...

### Phase 4: Build
- Changes applied: ...
- Files modified: ...

### Phase 5: Test
- Typecheck: ...
- Unit tests: ...
- Build: ...

### Phase 6: Deploy
- Worker URL: ...
- PWA URL: ...
- Health check: ...

### Phase 7: E2E
- Brain dump ID: ...
- Status: ...
- Convergence: ...

## Blocker Items
[List any blockers requiring manual intervention]

## Actions Required
[Any manual steps for the operator]
```

### 8.2 Save and Commit Report

```bash
git add docs/LATEST_SCAN_REPORT.md docs/REVIEW_AUDIT.md docs/CURRENT_STATE.md \
       docs/GAP_ANALYSIS.md docs/RISK_ASSESSMENT.md docs/RESEARCH_NOTES.md

git commit -m "chore: Jitterbug full system scan report $(date -Iseconds)"
```

---

## SUCCESS CRITERIA

The scan is **PASSED** when ALL of these are true:

- [ ] All typechecks pass (0 errors)
- [ ] All tests pass (0 failures)
- [ ] `check-maturity-gate.py` exits with code 0
- [ ] `deploy-jitterbug.sh` completes with no errors
- [ ] Health endpoint returns 200 with all checks `ok`
- [ ] Test brain dump reaches `completed` with convergence PASS
- [ ] PWA loads at both URLs with styling intact
- [ ] No secrets found in source code
- [ ] Documentation audit shows no missing core docs

The scan is **BLOCKED** if:
- TypeScript compilation fails
- Any core package tests fail
- Deploy fails with binding or migration errors
- Health check fails after deploy
- Brain dump does not converge within 5 minutes

---

## CONSTRAINTS

1. **NEVER commit secrets** — `.env.jitterbug`, `.env.master`, `wrangler.toml` secrets
2. **NEVER modify code outside your lane** — architecture/QA only, no firmware, no docs for legal cases
3. **NEVER output free-form prose** — use structured YAML/JSON for all phase outputs
4. **ALWAYS verify before reporting** — every "PASS" must be backed by actual command output
5. **ALWAYS check PMM regression** — no changes that drop a package's stage below SPROUT
6. **HALT on BLOCKING** — do not proceed to next phase if any gate fails

---

## OUTPUT ARTIFACTS

| Artifact | Path | Required |
|----------|------|----------|
| Context confirmation | stdout | Yes |
| Review audit | `docs/REVIEW_AUDIT.md` | Yes |
| Current state | `docs/CURRENT_STATE.md` | Yes |
| Gap analysis | `docs/GAP_ANALYSIS.md` | Yes |
| Risk assessment | `docs/RISK_ASSESSMENT.md` | Yes |
| Research notes | `docs/RESEARCH_NOTES.md` | Yes |
| Build changes summary | stdout | Yes |
| Test results | stdout + `docs/LATEST_SCAN_REPORT.md` | Yes |
| Deploy log | `/tmp/jitterbug-deploy.log` | Yes |
| Final report | `docs/LATEST_SCAN_REPORT.md` | Yes |

---

## START COMMAND

When ready to execute, run:

```bash
cd /home/p31/P31-local-workspace
echo "=== JITTERBUG FULL SYSTEM SCAN ==="
echo "Phase 0: Context load..."
# (continue through all phases)
```

Execute each phase sequentially. If any phase BLOCKS, stop and report.

**Begin.**
