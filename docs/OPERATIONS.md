# P31 Operations – Monitoring, Backup, Disaster Recovery & SLAs

**Version:** 1.0.0  
**Last Updated:** June 14, 2026

This document covers day‑to‑day operations: health monitoring, backup procedures, disaster recovery, service‑level agreements (SLAs), and on‑call responsibilities.

---

## 1. Monitoring Stack

| Tool | Port | Purpose | Access |
|------|------|---------|--------|
| **Netdata** | 19999 | Real‑time system metrics (CPU, RAM, disk, network) | Local only |
| **Prometheus** | 9090 | Metrics aggregation (scrapes auto‑solver, storj, node) | Local only |
| **Grafana** | 3000 | Dashboards (ROI, task completion, LLM latency) | Local only (admin/change-default-password) |
| **p31 doctor** | CLI | Health checks (8 parallel probes) | Terminal |
| **CashPilot health** | 9100/health | Auto‑solver liveness | curl |

**Enable monitoring (Tier 3 only):**
```bash
cd ~/cashpilot && docker compose --profile tier3 up -d prometheus grafana netdata
```

---

## 2. Health Checks

### 2.1 Automatic (Docker)

All services define `healthcheck` in their `docker-compose.yml`:

- **Ollama (cortex):** `ollama list` on port 11440
- **LiteLLM:** `curl -f http://localhost:4000/models`
- **Affective Chemistry:** `/health` endpoint (200 OK)
- **CashPilot auto‑solver:** `/health` endpoint

Unhealthy containers are automatically restarted by Docker (restart policy: `unless-stopped`).

### 2.2 Manual (CLI)

```bash
# Full ecosystem health (parallel, 8 probes)
p31 doctor --mesh --fun

# Quick check (only critical services)
p31 doctor

# Export JSON for automation
p31 doctor --json | jq .
```

**Exit codes:** `0` = all checks pass; `1` = at least one failure.

> **Note:** The Ollama probe in `p31 doctor` now checks ports `11440` (cortex), `11435` (CashPilot), and `11434` (fallback). If all fail, the doctor reports Ollama as unreachable.

---

## 3. Backup Procedures

### 3.1 What to Back Up

| Component | Path | Frequency |
|-----------|------|-----------|
| PHOS SQLite vault | `~/.p31/phos.db` | Daily |
| CashPilot earnings | `/data/tasks/earnings.jsonl` | Daily |
| CLI telemetry DB | `~/.p31/telemetry.db` | Weekly |
| Cortex configs | `/home/p31/p31-cortex/*.yaml` | After changes |
| CashPilot env | `/home/p31/cashpilot/.env` | After changes |
| Cloudflare Workers source | GitHub (repo) | Continuous |
| Ground truth YAML | `/home/p31/meatspace/GROUND_TRUTH.yaml` | After changes |

### 3.2 Backup Script

Save as `~/backup-p31.sh`:

```bash
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/mnt/backup/p31/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# PHOS DB
cp ~/.p31/phos.db "$BACKUP_DIR/" 2>/dev/null || true

# Earnings
cp /data/tasks/earnings.jsonl "$BACKUP_DIR/" 2>/dev/null || true

# Telemetry DB (omit if privacy‑sensitive)
cp ~/.p31/telemetry.db "$BACKUP_DIR/" 2>/dev/null || true

# Configs
cp /home/p31/cashpilot/.env "$BACKUP_DIR/"
cp /home/p31/p31-cortex/*.yaml "$BACKUP_DIR/"
cp /home/p31/meatspace/GROUND_TRUTH.yaml "$BACKUP_DIR/"

echo "Backup completed: $BACKUP_DIR"
```

Run daily via cron:
```bash
0 2 * * * /home/p31/backup-p31.sh
```

### 3.3 Offsite Backup

- **Critical configs and earnings:** Sync to encrypted cloud storage (rclone, Borg, or rsync to remote server).
- **No personal health data** should be stored offsite without explicit consent and encryption.

---

## 4. Disaster Recovery

### 4.1 Restore from Backup

```bash
# Stop all services
cd ~/cashpilot && ./deploy.sh down
cd ~/p31-cortex && docker compose down

# Restore files
cp /mnt/backup/p31/20260614_020000/phos.db ~/.p31/
cp /mnt/backup/p31/20260614_020000/earnings.jsonl /data/tasks/
cp /mnt/backup/p31/20260614_020000/.env ~/cashpilot/

# Restart services
cd ~/cashpilot && ./deploy.sh up
cd ~/p31-cortex && docker compose up -d
```

### 4.2 Complete Rebuild (from scratch)

```bash
# 1. Clone repositories
git clone https://github.com/p31labs/andromeda.git ~/P31-local-workspace
git clone https://github.com/p31labs/cashpilot.git ~/cashpilot
git clone https://github.com/p31labs/p31-cortex.git ~/p31-cortex
git clone https://github.com/p31labs/p31-cli.git ~/go/p31-cli

# 2. Install dependencies (Docker, Go, Node.js)
# See DEPLOYMENT.md for prerequisites

# 3. Deploy stack
cd ~/go/p31-cli && make install
cd ~/cashpilot && ./deploy.sh up
cd ~/p31-cortex && docker compose up -d

# 4. Restore data (from backup)
```

---

## 5. Service‑Level Agreements (SLAs)

| Service | Uptime Target | Recovery Time Objective (RTO) | Recovery Point Objective (RPO) |
|---------|---------------|-------------------------------|--------------------------------|
| PHOS desktop | Not applicable (local app) | – | – |
| CashPilot auto‑solver | 99.5% | 5 min | 15 min |
| p31‑cortex (Ollama) | 99.0% | 10 min | 1 hour |
| CashPilot ledger sync | 99.9% (cloud D1) | 30 min | 1 hour |
| Discord bot | 99.0% | 30 min | 1 hour |

**Note:** These are internal targets, not contractual. No external customers depend on these services.

---

## 6. On‑Call & Incident Response

- **Primary contact:** Will Johnson (will@p31ca.org)
- **Secondary:** (none – single operator)
- **Escalation:** If unreachable for >24 hours, community Discord moderators can restart services via `p31 cashpilot restart`.

### 6.1 Incident Severity Levels

| Severity | Description | Response |
|----------|-------------|----------|
| **P1** | Critical data loss / security breach | Immediate (within 1 hour) |
| **P2** | Service unavailable (cashpilot down) | Same day (within 4 hours) |
| **P3** | Degraded performance (LLM slow, mesh lag) | Next business day |
| **P4** | Cosmetic / documentation issue | Next sprint |

### 6.2 Incident Response Steps

1. **Identify** – `p31 doctor` detects failure; Discord bot sends alert if configured.
2. **Contain** – Isolate affected service (`docker stop <container>`).
3. **Restore** – Restart service, roll back to last backup if needed.
4. **Post‑mortem** – Update this document and the incident log.

---

## 7. Log Management

- **Docker logs:** `docker logs <container>` or `p31 logs tail`.
- **CashPilot earnings log:** `/data/tasks/earnings.jsonl` – append‑only, never deleted.
- **CLI telemetry:** `~/.p31/telemetry.db` – auto‑pruned after 30 days.
- **System logs:** `journalctl -u docker`

**Log rotation (Docker):**
```yaml
# In docker-compose.yml, each service has:
logging:
  driver: "local"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 8. Maintenance Windows

- **Weekly:** Run `p31 doctor --mesh` and review logs.
- **Monthly:** Apply OS and Docker updates; restart stack if needed.
- **Quarterly:** Rotate API tokens; review backup integrity.

**Announcements:** Use Discord `#ops` channel for planned downtime.

---

## 9. Troubleshooting Quick Reference

| Symptom | Action |
|---------|--------|
| `p31 doctor` shows ollama fail at :11434 | Check which stack is running; if p31-cortex, set `ollama_url: http://127.0.0.1:11440` in `~/.p31/config.yaml`. If CashPilot standalone, use `11435`. |
| `p31 doctor` shows ollama fail at all ports | Start Ollama: `docker start ollama-backend` or `ollama serve &` |
| CashPilot auto‑solver returns 401 | Check `SOLVER_API_TOKEN` in `.env` |
| Grafana no data | Restart Prometheus: `docker restart prometheus` |
| Disk full | `docker system prune -af`, clean `~/.cache` |
| CLI rate limit warning | Use `--rate-limit=false` or wait 15 min |

---

**Next:** [CONTRIBUTING.md](./CONTRIBUTING.md) – Code style, PR process, testing requirements.
