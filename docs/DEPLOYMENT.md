# P31 Deployment Guide – From Zero to Sovereign Mesh

**Version:** 1.0.0  
**Last Updated:** June 14, 2026

This document covers **everything** you need to deploy the full P31 ecosystem on a fresh machine – from hardware selection to one‑command installation.

---

## 1. Hardware Tiers & ROI

| Tier | CPU | RAM | Storage | GPU | Hardware Cost | Est. Net MRR | Payback |
|------|-----|-----|---------|-----|----------------|--------------|---------|
| **Tier 1** | 2 cores | 4 GB | 20 GB + 2TB HDD (USB) | None | $155 | $42 | 3.7 mo |
| **Tier 2** | 4 cores | 8 GB | 40 GB + 4TB HDD | GTX 1060 (used) | $430 | $93 | 4.6 mo |
| **Tier 3** | 6+ cores | 16 GB+ | 60 GB + 4TB HDD | RTX 3060+ | $770 | $140 | 5.5 mo |

*ROI calculations assume mid‑2026 DePIN earnings, auto‑solver at $15–25/mo, and electricity at $0.12/kWh.*

**Recommended refurbished models:**
- Tier 1: Dell OptiPlex 3060 Tower, Lenovo ThinkCentre M720q
- Tier 2/3: Dell Precision T3430, Lenovo ThinkStation P330

---

## 2. One‑Command Installation (Any Linux)

### 2.1 Prerequisites (one‑time)

```bash
# Install Docker, Go, Node.js, pnpm
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
npm install -g pnpm
sudo apt install -y golang-go
```

### 2.2 Clone & Deploy Everything

```bash
# Clone all repositories
git clone https://github.com/p31labs/andromeda.git ~/P31-local-workspace
git clone https://github.com/p31labs/cashpilot.git ~/cashpilot
git clone https://github.com/p31labs/p31-cortex.git ~/p31-cortex

# Build and install unified CLI
cd ~/go/p31-cli
make install

# Deploy CashPilot (DePIN stack)
cd ~/cashpilot
cp .env.example .env
# Edit .env with your API keys (Honeygain, EarnApp, Storj, etc.)
./deploy.sh --skip-build

# Deploy p31-cortex (LLM + safety)
cd ~/p31-cortex
docker compose up -d

# Build PHOS (optional – requires Rust)
cd ~/P31-local-workspace/phos
pnpm install
pnpm tauri build

# Run health check
p31 doctor --mesh --fun
```

---

## 3. Mobile & Chromebook Deployment

### 3.1 Chromebook (Crostini)

```bash
# Enable Linux, then:
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
# Log out / back in

# Clone and deploy (same as above)
# Use software rendering for Tauri:
export GDK_BACKEND=x11
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export LIBGL_ALWAYS_SOFTWARE=1
pnpm tauri dev
```

### 3.2 Android (Termux)

```bash
pkg update && pkg upgrade -y
pkg install -y nodejs git openssh golang
git clone https://github.com/p31labs/p31-cli.git ~/p31-cli
cd ~/p31-cli && make install
# For earnings sync: use the termux-setup.sh script
```

### 3.3 iPhone (iOS)

- Use GitHub Actions workflow: `.github/workflows/phos-ios.yml`
- Tag a release: `git tag phos-v0.2.0-ios && git push --tags`
- Download the `.ipa` artifact and sideload (Diawi, AltStore, or TestFlight)

---

## 4. Cloudflare Deployment (Edge Workers)

```bash
# Install Wrangler
npm install -g wrangler

# Deploy all workers
cd ~/P31-local-workspace/workers/discord-alerter
wrangler deploy

cd ~/P31-local-workspace/software/k4-cage
wrangler deploy

# Set secrets (run once)
wrangler secret put DISCORD_WEBHOOK_URL --env production
wrangler secret put IBM_QUANTUM_TOKEN --env production
```

---

## 5. Monitoring & Auto‑Start

### 5.1 Systemd Service

```bash
sudo cp /home/p31/cashpilot/systemd/cashpilot.service /etc/systemd/system/
sudo systemctl enable cashpilot.service
sudo systemctl start cashpilot.service
```

### 5.2 Prometheus + Grafana (Tier 3 only)

Access:
- Grafana: http://localhost:3000 (default: admin/cashpilot — change immediately)
- Prometheus: http://localhost:9090
- Netdata: http://localhost:19999

---

## 6. Upgrade Procedure

```bash
# Update all repositories
cd ~/cashpilot && git pull && ./deploy.sh down && ./deploy.sh up --skip-build
cd ~/p31-cortex && git pull && docker compose down && docker compose up -d
cd ~/go/p31-cli && git pull && make install
```

---

## 7. Troubleshooting

| Symptom | Likely Fix |
|---------|------------|
| `Permission denied` on `/dev/dri/renderD128` | Add user to `render` group: `sudo usermod -aG render $USER` |
| Port 11434 already in use | p31-cortex Ollama runs on `11440`; CashPilot Ollama runs on `11435`. Adjust config accordingly. |
| `p31` command not found | Ensure `~/.local/bin` is on PATH |
| Tauri window doesn't open (Chromebook) | Use software rendering env vars above |
| CashPilot auto-solver returns 401 | Set `SOLVER_API_TOKEN` in `.env` and restart |

---

## 8. Next Steps

- After deployment, run `p31 doctor --mesh` to verify all services.
- Set up API keys in `~/cashpilot/.env` to start earning.
- For production, configure the auto‑updater in `tauri.conf.json`.
- See [OPERATIONS.md](./OPERATIONS.md) for backup and monitoring.

**Next:** [CLI.md](./CLI.md) – Full `p31` command reference.
