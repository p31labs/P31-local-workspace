# P31 Deployment & Sea Trials Procedure

## 1. Overview

This procedure defines the steps to deploy the P31 Shipyard Protocol system into a target environment (production or trial) and execute a formal "sea trials" validation to confirm that all subsystems are operational, hardened, and ready for continuous use.

---

## 2. Pre-Deployment Verification

Before any deployment activity, run the core audit to ensure the system is in a known good state.

```bash
cd /home/p31/P31-local-workspace
/home/p31/meatspace/.venv/bin/python p31-core-audit.py
```

**Acceptance Criteria:**
- **GROUND_TRUTH**: GREEN
- **BUSBAR**: GREEN
- **COGNITIVE_PASSPORT**: GREEN
- **IDENTITY**: GREEN
- **SEMANTIC**: GREEN
- `BUS_SAFETY_WARNINGS` and `SUSPICIOUS_ROUTES` may be YELLOW (non-blocking).

If any critical system is RED, remediate before proceeding.

---

## 3. Deployment Steps

### 3.1 Install Core Scripts

Ensure the Yardmaster daemon and all supporting scripts are in place and executable.

```bash
cd /home/p31/P31-local-workspace
chmod +x scripts/*.sh scripts/lib/*.sh
```

### 3.2 Set Up Directory Structure

Create required directories if they do not exist:

```bash
mkdir -p /home/p31/.p31/{audit,identity,cognitive-passport,task-logs,rca}
mkdir -p /home/p31/P31-local-workspace/software/p31-cortex
```

### 3.3 Link BUSBAR Components

Symlink the BUSBAR safety and routing components into the workspace:

```bash
ln -sf /home/p31/p31-cortex /home/p31/P31-local-workspace/p31-cortex
ln -sf /home/p31/P31-local-workspace/scripts/emergency-halt.sh /home/p31/.p31/emergency-halt.sh
ln -sf /home/p31/P31-local-workspace/scripts/P31-CANARY.sh /home/p31/.p31/P31-CANARY.sh
```

### 3.4 Secure Control Plane Files

Apply strict permissions to prevent unauthorised modification:

```bash
chmod 600 /home/p31/meatspace/GROUND_TRUTH.yaml
chmod 600 /home/p31/.p31/cognitive-passport.json
chmod 600 /home/p31/P31-local-workspace/P31-FUEL-BUDGET.yaml
chmod 600 /home/p31/P31-local-workspace/P31_SHELF_MANIFEST.yaml
chmod 600 /home/p31/P31-local-workspace/P31_SHELF_MANIFEST.yaml.bak
```

### 3.5 Initialise Identity System

If not already present, create the identity directory and base files:

```bash
mkdir -p /home/p31/.p31/identity
cat > /home/p31/.p31/identity/roles.yaml <<EOF
roles:
  operator:
    description: "Human operator with full system access"
    permissions:
      - "inspect"
      - "refurbish"
      - "shelf:deploy"
      - "audit:read"
      - "fuel:override"
  auditor:
    description: "Read-only audit access"
    permissions:
      - "audit:read"
      - "inspect"
      - "shelf:read"
  system:
    description: "Automated daemon identity (Yardmaster, cron)"
    permissions:
      - "fuel:check"
      - "inspect"
      - "shelf:read"
      - "log:write"
EOF
echo "p31" > /home/p31/.p31/identity/admins.txt
touch /home/p31/.p31/identity/access.log
chmod 600 /home/p31/.p31/identity/*
```

### 3.6 Regenerate Ground Truth Expectations

This step ensures the audit system can detect drift.

```bash
/home/p31/P31-local-workspace/scripts/regenerate_expectations.sh
```

### 3.7 Install Cron Schedule (Optional; recommended after sea trials)

If sea trials are successful, install the automated schedule:

```bash
./scripts/p31-yardmaster.sh schedule --apply
```

This installs:
- Inspection every 6 hours
- Full maintenance cycle every Friday at 02:00 UTC

---

## 4. Sea Trials Test Plan

The sea trials validate that every major Yardmaster function operates correctly in the target environment.

### 4.1 Pre-Test: System State Check

```bash
yardmaster fuel-check
yardmaster shelf-list
```

**Expected:**
- `fuel-check` returns `OPEN` or `DEFERRED` (depending on current budget).
- `shelf-list` displays the manifest without errors.

### 4.2 Test 1: Health Inspection

```bash
yardmaster inspect bonding
yardmaster cycle
```

**Expected:**
- No errors.
- All services report a status (GREEN/YELLOW/RED) with valid voltage, error rate, and OQE alignment.
- Telemetry logs (`/home/p31/.p31/yardmaster.jsonl`) show `inspect_start` and `inspect_complete` events.

### 4.3 Test 2: Refurbishment Dry-Run

```bash
yardmaster refurbish bonding dry-run
```

**Expected:**
- Exit code `0`.
- All 7 pipeline steps execute without production changes.
- `retire_task` event appears in `health.jsonl`.

### 4.4 Test 3: Shelf Add

```bash
yardmaster shelf-add bonding vtest-$(date +%s) 0.95 0.35 READY_DEPLOY
```

**Expected:**
- Exit code `0`.
- New entry appears in `P31_SHELF_MANIFEST.yaml`.
- `shelf_add` event in yardmaster log.

### 4.5 Test 4: Shelf Deploy (Blue-Green Swap)

```bash
yardmaster shelf-deploy bonding
```

**Expected:**
- Exit code `0`.
- The target version is promoted to `CURRENT_PROD`.
- `swap_complete` event logged.
- Health endpoint returns `200`.

### 4.6 Test 5: Audit Scanner

```bash
yardmaster audit-scan
cat /home/p31/.p31/audit/P31_AUDIT_MANIFEST.yaml
```

**Expected:**
- Audit completes without fatal errors.
- Findings are consistent with known state.

### 4.7 Test 6: CANARY Gate

```bash
# Simulate a System Hold (emergency halt)
bash /home/p31/.p31/emergency-halt.sh check   # Should show CLEAR
# Reset the CANARY
bash /home/p31/.p31/P31-CANARY.sh --reset
bash /home/p31/.p31/P31-CANARY.sh --status   # Should show PENDING
# Attempt a Track B command (should be blocked)
yardmaster fuel-check   # Should still work (Track A)
# Complete the grounding task
touch /home/p31/.p31/task-logs/check.done
yardmaster fuel-check   # Now works
```

**Expected:**
- CANARY gate blocks Track B operations until `check.done` exists.
- Logs show `CANARY` events.

### 4.8 Test 7: Telemetry Consistency

```bash
tail -10 /home/p31/.p31/yardmaster.jsonl
tail -5 /home/p31/.p31/health.jsonl
```

**Expected:**
- All events are valid JSONL.
- No legacy terminology remains.

---

## 5. Rollback Procedure

If sea trials reveal critical failures, rollback to the previous stable state:

1. **Restore shelf manifest from backup:**
   ```bash
   cp /home/p31/P31-local-workspace/P31_SHELF_MANIFEST.yaml.bak /home/p31/P31-local-workspace/P31_SHELF_MANIFEST.yaml
   ```

2. **Restore control plane files** from backups if corrupted.

3. **Revert symlinks** if BUSBAR components were updated.

4. **Disable cron** (if installed):
   ```bash
   crontab -l | grep -v "p31-yardmaster" | crontab -
   ```

5. **Re-run the audit** to verify rollback restored integrity.

---

## 6. Sea Trials Sign-Off Criteria

The system passes sea trials if:

| Test | Result |
| :--- | :--- |
| All pre-deployment checks pass | ✅ |
| `yardmaster inspect` and `cycle` run without errors | ✅ |
| `refurbish dry-run` completes with exit 0 | ✅ |
| `shelf-add` and `shelf-deploy` succeed | ✅ |
| Audit scanner runs and produces valid manifest | ✅ |
| CANARY gate correctly blocks and unblocks Track B | ✅ |
| Telemetry logs are valid and contain expected events | ✅ |
| No legacy terminology remains in active code or config | ✅ |

If all tests pass, the system is declared **operationally ready**.

---

## 7. Handover

After successful sea trials:

1. **Activate cron** (if not already done):
   ```bash
   ./scripts/p31-yardmaster.sh schedule --apply
   ```

2. **Document the deployment**:
   - Record the audit ID and sea trials results.
   - Note any deviations.

3. **Provide operator handover**:
   - Share the `P31_SHIPYARD_PROTOCOL.md` document.
   - Explain key commands, telemetry locations, and escalation paths.

4. **Set up monitoring** (optional):
   - Consider integrating with existing dashboards or alerting systems.

---

## 8. Appendix: Quick Reference Commands

| Action | Command |
| :--- | :--- |
| Full audit | `python3 p31-core-audit.py` |
| Inspection | `yardmaster cycle` |
| Refurbishment (dry-run) | `yardmaster refurbish SERVICE dry-run` |
| Shelf list | `yardmaster shelf-list` |
| Shelf add | `yardmaster shelf-add SERVICE VERSION [score] [voltage] [status]` |
| Shelf deploy | `yardmaster shelf-deploy SERVICE [VERSION]` |
| Fuel check | `yardmaster fuel-check` |
| Schedule install | `yardmaster schedule --apply` |
| CANARY status | `bash /home/p31/.p31/P31-CANARY.sh --status` |

---

**This document must be followed for every deployment of the P31 Shipyard Protocol. The system is now fully documented and ready for operational use.**
