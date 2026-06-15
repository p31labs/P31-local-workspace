# P31 CLI – Unified Command Reference

**Binary:** `p31` (Go, ~12 MB, stripped)  
**Location:** `~/.local/bin/p31`  
**Config:** `~/.p31/config.yaml`  
**Telemetry DB:** `~/.p31/telemetry.db` (SQLite, somatic rate limiting)

---

## Quick Start

```bash
p31 --help                 # Show all commands
p31 doctor --mesh --fun    # Full health check
p31 chat                   # Start AI chat (local Ollama)
p31 connect                # Display CONNECTION spine
p31 verify                 # Run verification spinner
```

---

## Command Groups

### 🚀 Boot & Environment

| Command | Description | Flags |
|---------|-------------|-------|
| `p31 boot` | ANSI boot banner (tetrahedron + wordmark) | `P31_CLI_MINIMAL=1` / `CI=true` for short output |
| `p31 doctor` | Parallel health checks (8 probes) | `--mesh`, `--verify`, `--fun`, `--json` |
| `p31 connect` | Show CONNECTION spine (paths, quick commands) | – |
| `p31 verify` | Verification suite with Bubble Tea spinner | `--full` (all checks), `--mesh` (include probe) |

### 🧠 Cognitive & Spoon Economy (Read‑only)

| Command | Description | Flags |
|---------|-------------|-------|
| `p31 spoon` | Display current spoon level (read‑only; fetched from PHOS Core API) | – |
| `p31 energy` | Query current energy via Ollama (novelty) or mock fallback | – |

> **Note:** Somatic rate limiting is controlled via the global flag `--rate-limit`. Use `p31 --rate-limit=false <command>` to disable for a single invocation. There is **no standalone** `p31 rate-limit` command.

### 🌐 Mesh & Networking

| Command | Description | Flags |
|---------|-------------|-------|
| `p31 mesh status` | Show K₄ Cage mesh node table | – |
| `p31 mesh watch` | Live WebSocket mesh watcher | – |
| `p31 ping <to> <emoji>` | Send a family ping with emoji | – |

> **Note:** `p31 mesh probe` is **not implemented**. Use `p31 mesh status` and `p31 mesh watch` instead.

### 🔐 Identity & Passport

| Command | Description | Flags |
|---------|-------------|-------|
| `p31 passport generate` | Create Ed25519 keypair | – |
| `p31 passport show` | Show public key fingerprint | – |
| `p31 passport export` | Export identity (P31‑CPv2 format) | – |

### 🖥️ Surfaces (OS Metaphor)

| Command | Description |
|---------|-------------|
| `p31 surface launch <arcade\|vault\|hearth\|grid\|buffer\|archive\|node-zero>` | Open browser‑based cognitive surface |
| `p31 surface list` | List available surfaces |

### 💬 Chat & AI

| Command | Description |
|---------|-------------|
| `p31 chat` | Start interactive TUI chat with local Ollama |
| `p31 chat --model <name>` | Use specific model (default: `qwen2.5:1.5b`) |

**Stdin piping:** `p31 doctor --json | p31 chat "Analyse this state"` – pipes context into the chat session.

> **Port note:** The CLI expects Ollama at `http://127.0.0.1:11434`. However, when `p31-cortex` is running, Ollama is at `11440`. To use the CLI chat, either run `p31-cortex` and change config to `ollama_url: http://127.0.0.1:11440`, or use CashPilot's Ollama at `11435` with the same adjustment.

### 📊 Dashboard & Logs

| Command | Description |
|---------|-------------|
| `p31 dashboard` | Live TUI mesh dashboard (updates every 5s) |
| `p31 logs tail` | Tail command‑center logs (real‑time) |

### 🏭 DePIN & CashPilot

| Command | Description |
|---------|-------------|
| `p31 cashpilot up` | Deploy CashPilot stack (Docker) |
| `p31 cashpilot down` | Tear down CashPilot stack |
| `p31 cashpilot status` | Show service health |

*All cashpilot commands support `--skip-build` to avoid rebuilding images.*

> **Note:** `p31 cashpilot roi` is **not directly supported** as a CLI subcommand. ROI is calculated by `ledger-sync` and shown in the CashPilot dashboard.

### 📄 Document Generation (Forge)

| Command | Description |
|---------|-------------|
| `p31 forge court <case-id>` | Generate court document |
| `p31 forge grant <grant-id>` | Generate grant narrative |
| `p31 forge paper <paper-id>` | Generate research paper |

### 🐍 Wrapped Tools (Python/Node.js)

| Command | Description | Backend |
|---------|-------------|---------|
| `p31 triper` | TRIPER MVP certification system | Node.js (bonding-soup) |
| `p31 hub-diff` | Diff p31ca hub against ground truth | Node.js (bonding-soup) |
| `p31 command-center` | Start local operator UI (:3131) | Node.js (bonding-soup) |
| `p31 open <target>` | Open dev surfaces in browser | Node.js (bonding-soup) |
| `p31 launch` | Market launch pipeline | Node.js (bonding-soup) |
| `p31 ci` | Run CI equivalent locally | Node.js (bonding-soup) |

> **Note:** `p31 office` and `p31 foundry` are **not implemented** in the Go CLI. Use the underlying bonding-soup scripts directly if needed.

---

## Global Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--config <file>` | `$HOME/.p31/config.yaml` | Custom config path |
| `--verbose` / `-v` | false | Enable verbose output |
| `--rate-limit` | true | Enable somatic rate limiting (30 commands/15 min). Use `--rate-limit=false` to disable. |
| `--json` | false | Output machine‑readable JSON (doctor only) |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `CI=true` | Disables ANSI boot banner, uses short output |
| `P31_CLI_MINIMAL=1` | Minimal output (no ANSI boot) |
| `P31_CLI_PLAIN=1` | Plain text output (no colors) |
| `NO_COLOR` | Disables all ANSI colour codes |
| `P31_ROOT` | Override root directory for scanning (used by hidden gems script) |

---

## Configuration (`~/.p31/config.yaml`)

```yaml
k4_cage_url: https://k4-cage.trimtab-signal.workers.dev
phos_url: https://phos.p31ca.org
ollama_url: http://127.0.0.1:11434   # Change to 11440 if p31-cortex is running
default_model: qwen2.5:1.5b
```

---

## Autocompletion

Enable bash autocompletion (one‑time):

```bash
p31 completion bash > ~/.local/share/p31-completion.bash
echo "source ~/.local/share/p31-completion.bash" >> ~/.bashrc
source ~/.bashrc
```

Then `p31 d<TAB>` expands to `p31 doctor`, `p31 doctor --<TAB>` lists flags.

---

## Examples

```bash
# Daily health check
p31 doctor --mesh --fun

# Quick AI chat
echo "Explain K₄ topology" | p31 chat

# Start desktop surfaces
p31 surface launch arcade

# Monitor mesh live
p31 mesh watch

# View system logs
p31 logs tail -f

# Disable rate limiting for debugging
p31 --rate-limit=false doctor --mesh
```

---

## Somatic Rate Limiting

The CLI tracks command frequency in `~/.p31/telemetry.db`. After **30 commands in 15 minutes**, a warning is printed and a terminal beep sounds – a cognitive check to prevent hyperfocus burnout.

Disable with the global flag `--rate-limit=false`. Increase the limit by modifying `cmd/rate_limit.go` (threshold at line 55) and rebuilding.

---

## Adding New Commands

Commands are implemented in `cmd/*.go`. To add a new subcommand:

1. Create a new file in `cmd/` (e.g., `cmd/mycmd.go`).
2. Define a Cobra command and its flags.
3. Register it in `init()` with `rootCmd.AddCommand(myCmd)`.
4. Rebuild with `make install`.

See `cmd/doctor.go` or `cmd/verify.go` for patterns.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `unknown command "probe"` | `p31 mesh probe` does not exist. Use `p31 mesh status` or `p31 mesh watch` |
| `unknown command "rate-limit"` | Rate limiting is a global flag, not a subcommand. Use `--rate-limit=false` |
| `p31: command not found` | Ensure `~/.local/bin` is on `PATH` |
| `database locked` | Delete `~/.p31/telemetry.db` (rate‑limiting resets) |
| `Ollama not reachable` | Start Ollama or adjust `ollama_url` in config (see port note above) |

---

**Next:** [API.md](./API.md) – HTTP endpoints, WebSocket protocols, authentication.
