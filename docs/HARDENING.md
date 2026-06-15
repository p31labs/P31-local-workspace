# P31 Hardening Guide – Security Posture & Zero‑Trust Defaults

**Version:** 1.0.0  
**Last Updated:** June 14, 2026

This document describes the security model, access controls, secrets management, and hardening procedures for all P31 ecosystem components.

---

## 1. Security Principles

| Principle | Implementation |
|-----------|----------------|
| **Zero‑trust network** | Every API call requires authentication (tokens, not network trust). |
| **Local‑first** | Primary data never leaves the device. Cloud is for optional sync only. |
| **Minimum privilege** | Each service has the minimal set of permissions needed. |
| **Defence in depth** | Multiple layers: network isolation, authentication, rate limiting, OQE validation. |
| **Auditability** | All sensitive actions are logged (ledger, telemetry DB, command logs). |

---

## 2. Authentication & Authorization

### 2.1 API Tokens

| Service | Auth Mechanism | Token Source |
|---------|----------------|--------------|
| CashPilot API | `X-P31-Node-Token` header | `SOLVER_API_TOKEN` in `.env` |
| Cloudflare Workers | `Authorization: Bearer <token>` | `wrangler secret put` |
| Discord Bot | Bot token + Upstash Redis ACL | Discord Developer Portal |
| PHOS Tauri IPC | None (local only) | – |
| p31‑cortex | None (bound to localhost) | – |

**Rotation:** Tokens should be rotated every 90 days. Use `openssl rand -hex 32` to generate new tokens.

### 2.2 API Key Hierarchy

- `ADMIN_TOKEN` – Full access to K₄ Cage administrative endpoints.
- `INTERNAL_FANOUT_TOKEN` – Used for service‑to‑service communication.
- `SOLVER_API_TOKEN` – Protects CashPilot auto-solver endpoints.
- `SYNC_TOKEN` – Cloudflare D1 push endpoint.
- `IBM_QUANTUM_TOKEN` – IBM Quantum bridge worker.

**Never commit tokens to git.** Use `.env` files (ignored) or `wrangler secret`.

---

## 3. Network Isolation

### 3.1 Docker Networks

| Network | Purpose | Access |
|---------|---------|--------|
| `phos-mesh` | Shared between p31‑cortex and PHOS | Internal (bridged) |
| `cashpilot-mesh` | CashPilot services | Internal (bridged) |
| `proxy-net` | Bandwidth harvesters | macvlan (isolated) |
| `gpu-net` | GPU compute containers | Internal |
| `storj-net` | Storage node | Internal |
| `monitoring-net` | Prometheus, Grafana | Internal (no external route) |

All external‑facing containers (e.g., honeygain, earnapp) are on `proxy-net`, which has no route to other internal networks except via explicit NAT rules.

### 3.2 Firewall Rules (UFW)

```bash
# Allow SSH, PHOS webview, CashPilot dashboard, Grafana
sudo ufw allow 22/tcp
sudo ufw allow 4321/tcp
sudo ufw allow 9100/tcp
sudo ufw allow 3000/tcp

# Deny everything else by default
sudo ufw default deny incoming
sudo ufw enable
```

### 3.3 QoS & Traffic Shaping

`network/isolation.sh` applies `tc` rules to prioritise storage egress (60%) over GPU compute (25%) and bandwidth harvesters (15%). This ensures critical operations are not starved.

---

## 4. Secrets Management

- **Local secrets:** `~/.p31/config.yaml` (600 perms), `~/.secrets/` directory (700 perms).
- **Docker secrets:** Use Docker secrets (Swarm) or bind‑mount `.env` files.
- **Cloudflare secrets:** `wrangler secret put <name>` – encrypted at rest.
- **Zenodo token:** `~/.secrets/zenodo_token.txt` (600 perms). Never commit.

**Audit:** Run `git grep -i "token\|secret\|password"` before each release to catch accidental commits.

> **Grafana:** The default password `cashpilot` is hardcoded in the CashPilot `docker-compose.yml`. Always override with `GRAFANA_PASSWORD` env var in production.

---

## 5. Hardening Checklists

### 5.1 Linux Host

```bash
# Disable unnecessary services
sudo systemctl disable bluetooth cups avahi-daemon

# Install security tools
sudo apt install -y fail2ban rkhunter lynis

# Harden SSH (disable root login, password auth)
sudo sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 5.2 Docker

```bash
# Use rootless Docker (if possible)
dockerd-rootless-setuptool.sh install

# Enable user namespace remapping
echo '{"userns-remap": "default"}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker

# Scan images for vulnerabilities
docker scan cashpilot-auto-solver:latest
```

### 5.3 PHOS (Tauri)

- The Tauri app uses **local IPC only** – no external network listeners.
- WebView CSP restricts `connect-src` to `'self'` and `localhost`.
- Update checker uses the `tauri-plugin-updater` with signed binaries (Ed25519).

---

## 6. Auditing & Logging

| Log Source | Location | Retention |
|------------|----------|-----------|
| CashPilot earnings | `/data/tasks/earnings.jsonl` | Indefinite |
| Command telemetry | `~/.p31/telemetry.db` | 30 days |
| Docker container logs | `journalctl -u docker` | 7 days |
| Discord bot audit | Upstash Redis logs | 90 days |

**Centralised logging:** Use `p31 logs tail` to aggregate logs from all containers.

---

## 7. Incident Response

### 7.1 Detecting a Breach

- Unexpected API calls (check `p31 logs tail | grep 401`).
- Unauthorised ledger entries (check `p31 cashpilot ledger`).
- Unknown SSH logins (`last`).

### 7.2 Immediate Actions

1. Revoke all tokens: `wrangler secret delete <name>` for each worker.
2. Change `SOLVER_API_TOKEN` and restart CashPilot.
3. Rotate `ADMIN_TOKEN` and `INTERNAL_FANOUT_TOKEN`.
4. Inspect `~/.p31/telemetry.db` for unusual command patterns.

### 7.3 Long‑term Hardening

- Enable auditd: `sudo apt install auditd && sudo auditctl -e 1`.
- Use `fail2ban` to block brute‑force SSH attempts.
- Schedule `lynis` scans monthly.

---

## 8. Compliance

| Standard | Status | Notes |
|----------|--------|-------|
| 501(c)(3) nonprofit | ✅ Determined | EIN 42‑1888158 |
| GDPR (data privacy) | ✅ Compliant | No telemetry, local‑first, no third‑party data sharing |
| ADA Title II | 🟡 In progress | PHOS accessibility features (A11y facet, screen‑reader support) |
| SOC 2 | ❌ Not required | Internal use only; no customer data |

---

## 9. Security Contacts

- **Security issues:** will@p31ca.org (PGP key available)
- **GitHub security advisories:** https://github.com/p31labs/andromeda/security

---

## 10. Post-Quantum Cryptography Status

| Algorithm | Standard | Status | Where Used |
|-----------|----------|--------|-------------|
| ML-DSA-65 | FIPS 204 | ✅ Implemented | WebAuthn passkey (`@noble/post-quantum`) |
| ML-KEM-768 | FIPS 203 | 🔄 Planned | Future sovereign data layer exchange |

> **Note:** ML-KEM-768 is planned but not yet implemented in the current codebase. The WebAuthn passkey path uses ML-DSA-65 (FIPS 204) due to hardware protocol limitations.

---

## 11. References

- [NIST SP 800‑53](https://csrc.nist.gov/pubs/sp/800/53) (selected controls)
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Tauri Security Guidelines](https://tauri.app/v1/guides/security/)

**Next:** [GRANTS.md](./GRANTS.md) – Active grants, pipeline, submission status.
