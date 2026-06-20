# P31 Shipyard Protocol — Complete Documentation

**Version:** 1.0  
**Date:** 2026-06-18  
**Status:** Production‑Ready  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Installation & Setup](#3-installation--setup)
4. [User Guide – Commands](#4-user-guide--commands)
5. [Developer Guide](#5-developer-guide)
6. [Operational Procedures](#6-operational-procedures)
7. [Audit Subsystem](#7-audit-subsystem)
8. [Vocabulary Guide](#8-vocabulary-guide)
9. [Telemetry & Observability](#9-telemetry--observability)
10. [Troubleshooting](#10-troubleshooting)
11. [Security & Hardening](#11-security--hardening)
12. [Architecture Decisions](#12-architecture-decisions)
 13. [Addendums](#13-addendums)
 14. [Frontend Hardening – PHOS](#14-frontend-hardening-phos)
 15. [Appendices](#15-appendices)

---

## 1. Executive Summary

**P31** is a continuous maintenance and refurbishment system for software services, AI agents, and human cognitive workloads. It operationalises the *continuous shipyard* concept: a scheduled, automated inspection, repair, and blue‑green deployment pipeline that respects fuel budgets, enforces quality gates, and maintains a shelf of ready replacements.

The system is designed for **zero‑fail, high‑pressure environments** where human cognitive load, software reliability, and safety alignment must be managed holistically. It draws inspiration from nuclear submarine maintenance procedures but has been re‑implemented in plain operational language without military metaphor.

### 1.1 Core Philosophy

- **Vessel** – the entire human‑synthetic system (operator + software stack).
- **Fuel Budget** – finite cognitive and operational resources, split into:
  - **Track A (Auxiliary):** Somatic baseline, sleep, hydration, bills – never deprioritised.
  - **Track B (Refit):** Code, grants, therapy, rewiring – runs only when Track A is green.
  - **Track C (Mission):** Hard external deadlines, litigation, emergencies – unlimited override, but every spoon spent is logged with an RCA.
- **Yardmaster** – the daemon that orchestrates inspection, refurbishment, and shelf management.
- **Shelf** – inventory of pre‑validated, ready‑to‑deploy service versions.
- **Quality Gate** – enforces code quality, WD‑06 signoff, and invariant checks.
- **System Hold** – a safety interlock that blocks Track B work until a grounding task is completed.

---

## 2. Architecture Overview

### 2.1 High‑Level Components

| Component | Purpose | Implementation |
| :--- | :--- | :--- |
| **Yardmaster** | Orchestration daemon: inspect, refurbish, shelf‑add, shelf‑deploy, fuel‑check, schedule | `scripts/p31-yardmaster.sh` (pure Bash) |
| **Fuel Budget** | Runtime lockfile – enforces Track A/B/C boundaries | `P31-FUEL-BUDGET.yaml` |
| **Shelf Manifest** | Inventory of ready‑to‑deploy service versions | `P31_SHELF_MANIFEST.yaml` |
| **Quality Gate** | Pre‑commit check: WD‑06 signoff, risk patterns, invariant violations | `quality-gate.sh` + `oqe-verifier.py` |
| **Post‑Event Check** | Re‑entry gate after System Hold – grounding task | `P31-CANARY.sh` |
| **Retirement Protocol** | Logs retirement of tasks/process units | `abdicate.sh` (→ `retire-task.sh`) |
| **Emergency Halt** | Triggers System Hold, blocks Track B/C, resets CANARY | `emergency-halt.sh` |
| **Audit Scanner** | Finds code, config, and permission issues | `p31-audit-scan.sh` |
| **Telemetry** | Rolling logs of events, voltages, and errors | `~/.p31/health.jsonl`, `~/.p31/yardmaster.jsonl` |

### 2.2 Data Flow

```
Operator -> Yardmaster -> Inspect -> (healthy -> Shelf-List) OR (degraded -> Refurbish)
  Refurbish -> OQE Hard Gate -> Abdicate/Retire -> Re-apply Guardrails -> Integration Tests ->
  Shadow Validation -> Package & Shelf-Add -> Shelf-Deploy -> Blue-Green Swap ->
  Health Check -> (OK -> Update Manifest) OR (fail -> Rollback)
```

### 2.3 Directory Structure

```
/home/p31/P31-local-workspace/
├── P31-FUEL-BUDGET.yaml          # Fuel budget control plane
├── P31_SHELF_MANIFEST.yaml       # Shelf inventory
├── scripts/
│   ├── p31-yardmaster.sh          # Main daemon
│   ├── p31-audit-scan.sh          # Audit scanner
│   ├── abdicate.sh                 # Task retirement
│   ├── P31-CANARY.sh               # Post-event re-entry gate
│   ├── emergency-halt.sh           # System Hold trigger
│   ├── quality-gate.sh             # Pre-commit quality check
│   ├── oqe-verifier.py             # Quality checker (Python)
│   ├── lib/
│   │   └── yaml-parser.sh          # Pure-Bash YAML parser
│   └── archive/                    # Backups of legacy scripts
├── software/                       # Service source code
├── .p31/
│   ├── health.jsonl                # Telemetry log
│   ├── yardmaster.jsonl            # Yardmaster events
│   ├── task-logs/                  # Retirement records
│   └── audit/
│       └── P31_AUDIT_MANIFEST.yaml # Audit findings
└── docs/                           # Additional documentation
```

---

## 3. Installation & Setup

### 3.1 Prerequisites

- **Bash 4+**
- **POSIX tools**: `awk`, `sed`, `grep`, `date`, `curl`, `crontab`
- **Optional**: `wrangler` (for Cloudflare Worker deployments), `docker` / `docker-compose` (for local containers)
- **Python 3** (only for the OQE verifier, audit scanner, and peripheral daemons; not required for core Yardmaster)

**Cross‑Platform Note:** The `fuel_check_track_b()` parser is hardened to support both GNU `date` (Linux/Alpine) and BSD `date` (macOS). Do not simplify the conditional branching; it ensures portability.

### 3.2 Clone the Repository

```bash
cd /home/p31/P31-local-workspace
```

### 3.3 Install the Yardmaster Daemon

All scripts are already in place. Ensure executable permissions:

```bash
chmod +x scripts/*.sh scripts/lib/*.sh
```

### 3.4 Configure Cron Schedule

```bash
./scripts/p31-yardmaster.sh schedule --apply
```

This installs two cron jobs:
- **Inspection** every 6 hours: `0 */6 * * * ... inspect ...`
- **Maintenance window** every Friday at 02:00 UTC: `0 2 * * 5 ... cycle ...`

### 3.5 Verify Installation

```bash
./scripts/p31-yardmaster.sh fuel-check
./scripts/p31-yardmaster.sh shelf-list
./scripts/p31-yardmaster.sh cycle
```

### 3.6 Security Hardening – Control Plane Files

The `P31-FUEL-BUDGET.yaml` and `P31_SHELF_MANIFEST.yaml` files function as the literal control planes of the Yardmaster daemon. They dictate allowed system states and determine which code versions are allowed to reach production.

**Mitigation:**
Apply strict POSIX permissions to restrict these files to the dedicated `p31` user/group.

```bash
chmod 600 /home/p31/P31-local-workspace/P31-FUEL-BUDGET.yaml
chmod 600 /home/p31/P31-local-workspace/P31_SHELF_MANIFEST.yaml
chmod 600 /home/p31/P31-local-workspace/P31_SHELF_MANIFEST.yaml.bak
```

These settings ensure that only the Yardmaster daemon (running as the `p31` user) and the operator (via explicit `sudo` or login) can modify the system's operational boundaries.

---

## 4. User Guide – Commands

All commands are invoked via the Yardmaster daemon:

```bash
./scripts/p31-yardmaster.sh <command> [options]
```

### 4.1 Command Reference

| Command | Description |
| :--- | :--- |
| `inspect [SERVICE]` | Inspect all registered services, or a specific one. Outputs health per axis (voltage, synthetic, health endpoint, alignment). |
| `cycle` | Full inspection of all services; flags degraded services for refurbishment. |
| `refurbish SERVICE [mode]` | Execute refurbishment pipeline. Modes: `full` (production), `dry-run` (no changes), `oqe-only` (only OQE check). |
| `shelf-list` | Display the current shelf manifest (all ready‑to‑deploy and production versions). |
| `shelf-add SERVICE VERSION [score] [voltage] [status]` | Add a new version to the shelf. Defaults: score=0.95, voltage=0.35, status=READY_DEPLOY. |
| `shelf-deploy SERVICE [VERSION]` | Blue‑green swap: deploy the specified version (or the latest READY_DEPLOY) to production. |
| `voltage SERVICE` | Query the affective chemistry voltage score for a service. |
| `fuel-check` | Show current Track B fuel budget status. |
| `guardrail-check` | Display current guardrail levels from `guardrails.ts`. |
| `schedule` | Show or apply cron schedule (`--apply` to install). |
| `audit-scan` | Run the audit scanner; writes findings to `P31_AUDIT_MANIFEST.yaml`. |

### 4.2 Examples

```bash
# Full inspection
./p31-yardmaster.sh cycle

# Inspect only phos
./p31-yardmaster.sh inspect phos

# Dry‑run refurbishment of bonding
./p31-yardmaster.sh refurbish bonding dry-run

# Add a new version to the shelf
./p31-yardmaster.sh shelf-add bonding v20260618-143022-refurbished

# Deploy it
./p31-yardmaster.sh shelf-deploy bonding v20260618-143022-refurbished

# Run an audit scan
./p31-yardmaster.sh audit-scan
```

---

## 5. Developer Guide

### 5.1 Adding a New Service

1. **Register the service** in `p31-yardmaster.sh`:
   - Add its name to `REGISTERED_SERVICES` array.
   - Define its health endpoint, log source, deploy unit, and voltage context in the associative arrays:
     ```bash
     declare -A SVC_HEALTH_URL=(
       ["myservice"]="https://myservice.p31ca.org/health"
     )
     declare -A SVC_LOG_SOURCE=(
       ["myservice"]="wrangler"
     )
     declare -A SVC_DEPLOY_UNIT=(
       ["myservice"]="wrangler:myservice-worker"
     )
     declare -A SVC_VOLTAGE_CONTEXT=(
       ["myservice"]="myservice:api"
     )
     ```
2. **Ensure the source code path** is correctly mapped in `check_oqe()` (case statement).
3. **Add a health check endpoint** that returns HTTP 200 when the service is healthy.
4. **Create a shelf entry** (optional) – the shelf can be pre‑populated with a gold master.

### 5.2 Extending the Fuel Budget

Edit `P31-FUEL-BUDGET.yaml` to adjust:
- `track_a.budget_pct`, `track_b.budget_pct`, `track_c.budget_pct`
- `track_b.defer_until` (future timestamp to defer refit work)
- Manual trim annotations in the `manual_trims` list

### 5.3 Modifying the Shelf Parser

The shelf is read and written using pure Bash/AWK. The functions reside in `p31-yardmaster.sh`:
- `shelf_list()` – reads the manifest using `yaml_get_section` from `lib/yaml-parser.sh`.
- `shelf_add()` – appends a new item using `awk`.
- `blue_green_swap()` – updates statuses using `awk`.

To change the manifest structure, update both the parser and the writer logic.

### 5.4 Debugging

- View telemetry:
  ```bash
  tail -f ~/.p31/yardmaster.jsonl
  tail -f ~/.p31/health.jsonl
  ```
- Run a single inspection with verbose output:
  ```bash
  bash -x ./scripts/p31-yardmaster.sh inspect bonding
  ```
- Check cron logs:
  ```bash
  tail -f ~/.p31/yardmaster-cron.log
  ```

---

## 6. Operational Procedures

### 6.1 Standard Maintenance Cycle

1. **Pre‑flight** – Ensure Track A is green (sleep, hydration, somatic check). Update `P31-FUEL-BUDGET.yaml` with `today.track_a_status: "GREEN"`.
2. **Inspection** – Run `yardmaster cycle` to see degraded services.
3. **Refurbishment** – For each degraded service, run `yardmaster refurbish <service> dry-run` first, then `full` if satisfied.
4. **Shelf Add** – After refurbishment, add the new version to the shelf.
5. **Shelf Deploy** – Blue‑green swap into production.
6. **Post‑Swap Validation** – Confirm health endpoint returns 200 and telemetry logs show successful swap.

### 6.2 Emergency Overrides

- To bypass a fuel budget deferral, add a manual trim annotation in `P31-FUEL-BUDGET.yaml`:
  ```yaml
  manual_trims:
    - "2026-06-18T00:00:00Z [B] override -> cleared defer_until | reason"
  ```
- To bypass the OQE gate for a commit, set the environment variable:
  ```bash
  COMMIT_QUALITY_RCA="<reason>" git commit ...
  ```

### 6.3 System Hold / Re‑entry

- If the system enters a Hold state (Track B blocked), the post‑event check (`P31-CANARY.sh`) blocks further Track B work until the grounding task (fold 3 physical items) is completed.
- To force re‑entry in an emergency:
  ```bash
  ./scripts/P31-CANARY.sh --force
  ```
  This logs an RCA override.

### 6.4 Rollback & Disaster Recovery (DR) Protocol

Despite comprehensive blue‑green validation, a service may pass its health check but introduce silent logical failures (e.g., data corruption, UI regressions, or degraded AI output quality). The Yardmaster relies on semantic versioning to enable immediate, deterministic rollbacks.

**Procedure:**

1. **Identify the previous stable version:**
   ```bash
   yardmaster shelf-list | grep -A 5 "<service>"
   ```
   Locate the version immediately preceding the current `CURRENT_PROD`, typically tagged with `ARCHIVED` status (e.g., `v20260617-120000-gold`).

2. **Execute the rollback swap:**
   ```bash
   yardmaster shelf-deploy <service> <previous_version>
   ```
   This triggers a reverse blue‑green swap, moving the specified `ARCHIVED` version back to `CURRENT_PROD` and demoting the problematic version to `ARCHIVED` with a `deprecated_at` timestamp.

3. **Post‑Rollback Validation:**
   - Confirm the service health endpoint returns `200`.
   - Review `yardmaster.jsonl` for the `swap_complete` event.
   - Trigger a manual inspection: `yardmaster inspect <service>`.

**Emergency DR (Manifest Corruption):**
If the `P31_SHELF_MANIFEST.yaml` becomes corrupted during a swap (rare, but possible due to disk failures), the system maintains an automatic backup in the same directory (e.g., `P31_SHELF_MANIFEST.yaml.bak`). Restore it immediately:
```bash
cp /home/p31/P31-local-workspace/P31_SHELF_MANIFEST.yaml.bak /home/p31/P31-local-workspace/P31_SHELF_MANIFEST.yaml
```
Then re‑run the deploy or rollback command.

---

## 7. Audit Subsystem

The audit subsystem provides continuous codebase hygiene and security scanning. It is a lightweight, modular scanner that writes findings to a structured manifest.

### 7.1 Audit Scanner

**Command:** `yardmaster audit-scan`

**Checks Performed:**

| Check | Description |
| :--- | :--- |
| Control plane permissions | Ensures `P31-FUEL-BUDGET.yaml` and `P31_SHELF_MANIFEST.yaml` are `600`. |
| Legacy terminology | Scans for military/naval terms (`scram`, `RedBoard`, `submarine`, etc.) in operational code. |
| Orphaned temp files | Finds stray `.tmp*` and `.bak` files in the repo root. |
| Hardcoded paths | Detects `Path("/home/p31/andromeda")` in Python scripts. |
| Command injection | Detects shell variable interpolation into `python3 -c` strings. |
| Shelf manifest integrity | Checks for orphaned version values missing the `version:` prefix. |

### 7.2 Audit Manifest

Findings are written to `.p31/audit/P31_AUDIT_MANIFEST.yaml` with the following schema:

```yaml
findings:
  - id: AUDIT-001
    severity: critical          # critical | high | medium | low
    category: security           # security | vocabulary | paths | hygiene | atomicity | data-quality
    title: "Description of the issue"
    description: "Detailed explanation"
    location: "file:line"
    fix: "Recommended remediation"
    status: open                 # open | in-progress | fixed | verified | closed
    assigned_to: null
    fix_commit: null
    verification_evidence: null
    created_at: "2026-06-18T17:30:00Z"
    updated_at: "2026-06-18T17:30:00Z"
```

### 7.3 Manual Audit Seeding

To manually seed findings (e.g., from a manual audit report), edit the manifest directly. The scanner will not overwrite manually seeded findings if they match by `id`.

### 7.4 Future Extensions

- **Planner/Executor** – currently out of scope; the manifest serves as a tracking artifact. In future iterations, a `audit-plan` and `audit-execute` can be added to automate remediation.
- **Integration with Yardmaster** – `yardmaster cycle` can optionally trigger `audit-scan` as part of the maintenance cycle.

---

## 8. Vocabulary Guide – Plain‑Language Mapping

| Legacy Term | Plain‑Language Term |
| :--- | :--- |
| SCRAM valve, redboard | emergency‑halt, System Hold |
| Dead‑stick test | post‑event check, re‑entry gate |
| Abdicate, kenosis | retire task |
| OQE (Objective Quality Evidence) | quality check, alignment gate |
| WCD-06 | WD-06 (Work Document) |
| Track B fuel | refit budget |
| Gold master | ready replacement |
| Blue‑green swap | production swap |

All scripts, comments, and log messages use the plain‑language terms.

---

## 9. Telemetry & Observability

### 9.1 Log Files

| File | Content |
| :--- | :--- |
| `~/.p31/health.jsonl` | Event log: `retire_task`, `abdicate`, voltage updates, CANARY events. |
| `~/.p31/yardmaster.jsonl` | Yardmaster‑specific events: `inspect_start/complete`, `refurbish_start/complete`, `shelf_add`, `swap_start/complete`. |
| `~/.p31/yardmaster-cron.log` | Cron job output (inspection and maintenance cycles). |
| `~/.p31/audit/P31_AUDIT_MANIFEST.yaml` | Audit findings |

### 9.2 Health Endpoints

Each service should expose a `/health` endpoint returning HTTP 200 when healthy. The Yardmaster checks these during inspection.

### 9.3 Error Rate Monitoring

The Yardmaster samples logs from each service (via `docker logs` or `wrangler tail`) over the last hour and computes the percentage of lines containing `error`, `exception`, `failed`, etc.

### 9.4 Telemetry Event Schema

```json
{
  "ts": "2026-06-18T17:30:00Z",
  "event": "retire_task",
  "task_id": "bonding-refurbish-1712345678",
  "reason": "Scheduled refurbishment",
  "session": "p31-penguin-1712345678"
}
```

---

## 10. Troubleshooting

### 10.1 Inspection Reports All Services as CRITICAL

- **Cause:** OQE path mapping may be incorrect.
- **Fix:** Update `check_oqe()` case statement to point to the correct source directory for each service.

### 10.2 `shelf-add` Appears to Succeed but No Entry Appears

- **Cause:** The `awk` append logic may have failed silently (e.g., due to missing indentation).
- **Fix:** Manually add the entry using `echo` or `sed`, or run `shelf-list` to verify and debug.

### 10.3 CANARY Gate Blocks Commits Indefinitely

- **Cause:** The `check.done` file is missing.
- **Fix:** Complete the grounding task (fold 3 items) and `touch ~/.p31/task-logs/check.done`, or use `--force` in an emergency.

### 10.4 Fuel Check Returns `DEFERRED` but You Need to Refurbish

- **Fix:** Edit `P31-FUEL-BUDGET.yaml` and change `defer_until` to a past date, or add a manual trim annotation. Then re‑run `yardmaster fuel-check` to confirm.

### 10.5 Audit Scanner Finds Too Many False Positives

- **Cause:** Scanner scope includes historical or documentation files.
- **Fix:** Edit `p31-audit-scan.sh` and adjust the `SCAN_PATHS` and `EXCLUDE_PATHS` variables to focus on operational code only.

---

## 11. Security & Hardening

### 11.1 Control Plane Files

- **File:** `P31-FUEL-BUDGET.yaml`, `P31_SHELF_MANIFEST.yaml`
- **Permissions:** `600`
- **Owner:** `p31` user
- **Rationale:** Prevents unprivileged processes from modifying fuel gates or faking health scores.

### 11.2 Log Telemetry

- **File:** `~/.p31/health.jsonl`, `~/.p31/yardmaster.jsonl`
- **Permissions:** `644` (readable by the operator, writable by the Yardmaster)
- **Log Rotation:** Not yet automated; monitor file size and rotate manually if needed.

### 11.3 Command Injection Mitigation

- The `yardmaster_log()` function now passes variables via `sys.argv` in Python, rather than interpolating them into a `-c` string.
- This eliminates the risk of arbitrary code execution through unsanitised log values.

### 11.4 Peripheral Daemons

- `jitterbug-dashboard.py`, `macrophage.py`, `nexus-daemon.py` remain in Python because they are:
  - Not privileged (read‑only JSON viewers, user‑space LLM clients, state computation).
  - Not a security boundary.
- Future work: add authentication/TLS to the Ollama endpoint in `macrophage.py`.

---

## 12. Architecture Decisions

### 12.1 Why Keep Python for Some Daemons?

The three peripheral daemons (`jitterbug-dashboard.py`, `macrophage.py`, `nexus-daemon.py`) are **not privileged** and do not execute system‑level operations. Rewriting them to pure Bash would:
- Introduce complexity without security gains.
- Break interactive TUI functionality (curses).
- Require re‑implementing an LLM HTTP client and graph analysis engine.
- Increase maintenance burden for negligible operational benefit.

**Decision:** Keep these as Python scripts; they are application‑level and isolated from the core orchestration path.

### 12.2 Why Pure Bash for Yardmaster?

The Yardmaster orchestrates privileged operations:
- Reading/writing fuel budget and shelf manifest.
- Executing deploys and triggering services.
- Managing cron jobs and system holds.

A pure‑Bash implementation reduces attack surface, removes Python dependency cold‑start latency, and ensures the daemon is self‑contained and portable.

### 12.3 Vocabulary Normalisation

All military and naval terminology has been removed from operational code and logs. This reduces cognitive friction, improves accessibility, and aligns with the project's legal sensitivity requirements.

### 12.4 Atomicity & Rollback

The `blue_green_swap()` function currently uses two separate `awk` passes with temporary files. This is **not atomic**; a crash between passes could leave the manifest in a partial state. A future enhancement should combine both operations into a single atomic `awk` pass.

---

## 13. Addendums

### 13.1 Rollback & Disaster Recovery (DR) Protocol

*(See Section 6.4)*

### 13.2 Security Hardening – Control Plane Files

*(See Section 11.1)*

### 13.3 Cross‑Platform Nuance (GNU/BSD `date`)

The `fuel_check_track_b()` parser is hardened to support both GNU `date` (Linux/Alpine) and BSD `date` (macOS). The daemon automatically detects the available binary and applies the appropriate formatting. Do not simplify or remove the conditional branching during future refactors.

```bash
if date --version >/dev/null 2>&1; then
    defer_epoch=$(date -d "$defer_until" +%s 2>/dev/null || echo "0")
else
    defer_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$defer_until" +%s 2>/dev/null || echo "0")
fi
```

---

## 14. Frontend Hardening – PHOS

### 14.1 Scope

| Tree | Role | Notes |
| :--- | :--- | :--- |
| `P31-local-workspace/phos/` | Primary operator surface (Astro + React + PGlite + Tauri) | Production: `phos.p31ca.org` |
| `andromeda/phos/` | Legacy/sibling Astro build | Same stack, separate working tree |

### 14.2 Frontend Audit Scanner

**Script:** `frontend-audit.sh`

```bash
bash frontend-audit.sh /home/p31/P31-local-workspace/phos standard
bash frontend-audit.sh /home/p31/P31-local-workspace/phos strict
bash frontend-audit.sh /home/p31/andromeda/phos strict
```

| Check | Notes |
| :--- | :--- |
| Legacy terminology | `SCRAM`, `scram`, `RedBoard`, `redboard`, `reactor`, `submarine` |
| Hardcoded absolute paths | `/home/p31` in `.js/.ts/.tsx/.astro/.css/.html` |
| Hardcoded API keys/secrets | `API_KEY=`, `SECRET=`, `TOKEN=`, `PASSWORD=` |
| `.env` leaks in source | `.env` reference outside `src/config/` |
| `.gitignore` coverage | Missing `.gitignore`, `dist/`, `.env*` ignores |
| `.env.example` | Present and contains only placeholders |
| Dependency audit | `npm audit --omit=dev` (strict mode) |
| Type-check | `npm run typecheck` (strict mode) |

### 14.3 Environment Strategy

All configurable values must come from `import.meta.env` via Vite.

**.env.example (both `phos/` trees):**
```bash
VITE_VECTOR_PROXY=http://localhost:4000/v1/embeddings
VITE_RAG_PROXY=http://localhost:4001
VITE_DB_CONNECTION=
```

Rules:
1. `http://localhost:...` defaults are acceptable in `src/config/endpoints.ts` because `import.meta.env` overrides them at build time.
2. Tests may assert against `http://localhost:4000/v1/embeddings`; this is a test artifact, not a production leak.
3. No backend URL, path prefix, or token may be hardcoded in component code outside `src/config/`.

### 14.4 Vocabulary Mapping

| Legacy Term | PHOS Term |
| :--- | :--- |
| Reactor / Red Board | Replace with plain-language equivalents (`Component X`) |
| Submarine / SCRAM | ❌ Prohibited (see `CLAUDE.md` legal sensitivity) |

PHOS uses domain-appropriate naming (`Hearth`, `ChaosVault`, `Embedder`, `Surface`). No legacy terms were found in source.

### 14.5 Security Headers

`public/_headers` enforces:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` restricting `connect-src` to `'self'`, `ws:`, `wss:`, `idb:`, `memory:`, and allowed localhost proxies
- `Strict-Transport-Security` with `preload`
- Asset caching: `max-age=31536000, immutable`

### 14.6 Build Artifacts & Permissions

| Path | Recommended mode | Rationale |
| :--- | :--- | :--- |
| `dist/` | `755` | Static assets served by Cloudflare Pages; no secrets |
| `src-tauri/target/` | `700` | Rust build artifacts; contains compiler cache |
| `.env` | `600` | Secrets; must never be committed |
| `.env.example` | `644` | Public template |

### 14.7 Remediation Workflow

1. Run `bash frontend-audit.sh <path> strict` to generate findings.
2. Triage each finding by category (vocabulary | paths | secrets | hygiene).
3. Fix source code first, then update `frontend-audit.sh` exclusions if the match is a false positive.
4. Re-run until exit code `0`.
5. Commit `.gitignore` and `.env.example` additions immediately; do not commit `.env`.

### 14.8 Known Issues & TODOs

| ID | Severity | Description | Status |
| :--- | :--- | :--- | :--- |
| PHOS-001 | high | `andromeda/phos/src/lib/Embedder.ts` used hardcoded `http://localhost:4000/v1/embeddings` instead of `VECTOR_PROXY` | fixed |
| PHOS-002 | medium | No `.gitignore` in either `phos/` tree | fixed |
| PHOS-003 | medium | No `.env.example` in either `phos/` tree | fixed |

---

## 15. Appendices

### Appendix A – Audit Manifest Example

```yaml
findings:
  - id: AUDIT-001
    severity: critical          # critical | high | medium | low
    category: security           # security | vocabulary | paths | hygiene | atomicity | data-quality
    title: "Description of the issue"
    description: "Detailed explanation"
    location: "file:line"
    fix: "Recommended remediation"
    status: open                 # open | in-progress | fixed | verified | closed
    assigned_to: null
    fix_commit: null
    verification_evidence: null
    created_at: "2026-06-18T17:30:00Z"
    updated_at: "2026-06-18T17:30:00Z"
```

### Appendix B – Frontend Audit Manifest Example

```yaml
findings:
  - id: AUDIT-FE-001
    severity: high
    category: vocabulary
    title: "Hardcoded API endpoint URL"
    description: "Direct fetch to localhost bypasses env-var configuration in production"
    location: "src/lib/Embedder.ts:8"
    fix: "Use VECTOR_PROXY from endpoints.ts"
    status: fixed
    assigned_to: null
    fix_commit: "fix(phos): use endpoints.vectorProxy"
    verification_evidence: "frontend-audit.sh strict exits 0"
    created_at: "2026-06-18T18:00:00Z"
    updated_at: "2026-06-18T18:30:00Z"
```

### Appendix C – Fuel Budget Example

```yaml
track_a:
  name: Auxiliary
  budget_pct: 30
  hard_floor_spoons: 2
  time_gate:
    before: "09:00"
    after: "20:00"

track_b:
  name: Refit
  budget_pct: 50
  defer_until: ""
  trigger: "A_green AND reactor_temp < 0.7"

track_c:
  name: Mission
  budget_pct: 20
  override: UNLIMITED
  rca_required: true

manual_trims:
  - "2026-06-18T00:00:00Z [B] override -> cleared defer_until | yardmaster refurbish bonding dry-run"

today:
  date: "2026-06-18"
  track_a_status: "GREEN"
  track_b_green: true
  track_c_active_items: []
```

### Appendix D – Shelf Manifest Example

```yaml
shelf:
  bonding:
    - version: "v20260618-131437-refurbished"
      built: "2026-06-18T17:14:44Z"
      health_score: 0.95
      voltage_report: "0.35 (calm)"
      oqe_pass: true
      wcd06_signed: true
      alignment_gate: pass
      status: "CURRENT_PROD"
      description: "Live refurbished deployment"
      metadata:
        yardmaster_version: "0.1.0"
        deployed_at: "2026-06-18T17:30:00Z"

meta:
  last_audit: "2026-06-18T17:30:00Z"
  yardmaster_version: "0.1.0"
  inventory_scheme: "semver-refurbish"
```

### Appendix E – List of Rewritten Scripts

| Original Name | New / Current Name | Status |
| :--- | :--- | :--- |
| `abdicate.sh` | `abdicate.sh` (internal language changed to `retire-task`) | ✅ Rewritten |
| `P31-CANARY.sh` | `P31-CANARY.sh` (internal language changed to `post-event-check`) | ✅ Rewritten |
| `health-check.sh` | `health-check.sh` (internal language changed to `service-health-check`) | ✅ Rewritten |
| `oqe-hard-gate.sh` | `quality-gate.sh` | ✅ Renamed & Rewritten |
| `oqe-verifier.py` | `oqe-verifier.py` (plain-language comments) | ✅ Rewritten |
| `redboard-scram.sh` | `emergency-halt.sh` | ✅ Renamed & Rewritten |

### Appendix F – Version History

- **v1.0 (2026-06-18):** Initial production release. Core Yardmaster, pure-Bash fuel parser, shelf management, audit scanner, vocabulary normalisation, cron scheduling, and full documentation.
- **v1.1 (2026-06-18):** Added frontend hardening framework for `phos/` (Astro + React). New section 14 covering environment strategy, vocabulary, security headers, audit scanning, and remediation workflow.

---

**This document reflects the state of the system as of 2026-06-18. The Yardmaster is fully operational and ready for continuous use.**
