# Vinegar Studio Setup — P31 Roblox Bridge

How to set up Roblox Studio on Linux using Vinegar and configure the P31 Lua transmitter scripts.

---

## 1. Prerequisites

- Linux (Ubuntu/Debian recommended, tested on Ubuntu 24.04)
- Node.js 20+ (for testing Shadow Bridge locally)
- Git (for cloning the P31 repository)
- An active Roblox account with Studio access

---

## 2. Install Vinegar

Vinegar is a community-maintained Roblox Studio launcher for Linux. It handles Wine/Proton
configuration, dependencies, and the Roblox bootstrapper.

```bash
# Install from Flathub (recommended)
flatpak install flathub io.github.vinegarhq.Vinegar
flatpak run io.github.vinegarhq.Vinegar studio

# Or from source
git clone https://github.com/vinegarhq/vinegar.git
cd vinegar
go build
./vinegar studio
```

On first launch, Vinegar will download Roblox Studio (~2 GB) and set up the Wine prefix.
This may take 10-15 minutes.

---

## 3. Clone the P31 Repository

```bash
git clone https://github.com/p31labs/P31-local-workspace.git
cd P31-local-workspace/software/roblox-bridge
```

---

## 4. Configure Environment

### Enable HTTP Requests in Roblox Studio

1. Open Roblox Studio via Vinegar
2. Load or create a new game
3. Go to **Game Settings** → **Security**
4. Enable **Allow HTTP Requests** (`HttpService.HttpEnabled = true`)
5. Add `https://shadow-bridge.trimtab-signal.workers.dev` to **HTTP Service Allow List**

### Set Environment Variables

The Lua scripts read `SHADOW_BRIDGE` directly. To change the endpoint, edit `Portal.lua`,
`ChatMirror.lua`, and `BuildingSystem.lua` and update:

```lua
local SHADOW_BRIDGE = "https://shadow-bridge.trimtab-signal.workers.dev"
```

---

## 5. Install Scripts

### 5.1 Portal.lua — Exit Door Cognitive Passport Binding

Place in `ServerScriptService`:

1. In Roblox Studio Explorer, right-click **ServerScriptService**
2. Click **Insert Object** → **Script**
3. Name it `Portal`
4. Paste the contents of `Portal.lua`
5. The portal part will be auto-created in Workspace

**What it does**: Detects players approaching the exit portal and sends join + spawn
events to Shadow Bridge. Triggers Cognitive Passport DID binding.

### 5.2 ChatMirror.lua — OQE Evidence Logging

Place in `ServerScriptService`:

1. Right-click **ServerScriptService** → **Insert Object** → **Script**
2. Name it `ChatMirror`
3. Paste the contents of `ChatMirror.lua`

**What it does**: Intercepts all chat messages and routes them through Shadow Bridge
to Genesis Gate as court-admissible OQE (Observational Quality Evidence). Runs
sentiment analysis and generates SHA-256 hash chain entries.

### 5.3 BuildingSystem.lua — Sandbox Building + LOVE Milestones

Place in `ServerScriptService`:

1. Right-click **ServerScriptService** → **Insert Object** → **Script**
2. Name it `BuildingSystem`
3. Paste the contents of `BuildingSystem.lua`

**What it does**: Tracks block placements with R15 avatar spatial math
(`GetBoundingBox()`). Detects structural milestones (10, 25, 50, 100 blocks)
and triggers LOVE credit minting. Every milestone emits a Genesis Gate event
for court admissibility.

---

## 6. Verify Pipeline

### 6.1 Check Shadow Bridge Health

```bash
curl https://shadow-bridge.trimtab-signal.workers.dev/health
# → {"ok":true,"service":"shadow-bridge","version":"1.0.0","gameId":"p31-roblox-bridge"}
```

### 6.2 Check Genesis Gate Health

```bash
curl https://genesis-gate.trimtab-signal.workers.dev/health
# → {"service":"genesis-gate","status":"ok","version":"1.0.0",...}
```

### 6.3 Test in Roblox Studio

1. Launch the game in Roblox Studio (Play button)
2. Walk your character to the Exit Portal
3. Check the Output window for:
   - `🚪 Portal.lua active`
   - `🔍 ChatMirror active`
   - `🏗️ BuildingSystem active`
4. Place 10 blocks with the Building Tool
5. Check for milestone message: `🏗️ MILESTONE: 10 blocks!`
6. Type a chat message to verify ChatMirror logging

### 6.4 Check LOVE Credits

After playing, verify LOVE credits were minted:

```bash
# Check session data (use the session ID from Studio output)
curl https://shadow-bridge.trimtab-signal.workers.dev/sessions/PORTAL_<timestamp>_<userid>

# Check leaderboard
curl https://shadow-bridge.trimtab-signal.workers.dev/leaderboard
```

### 6.5 Verify Genesis Gate Events

```bash
# Read recent events from Genesis Gate
curl https://genesis-gate.trimtab-signal.workers.dev/events?limit=10
```

---

## 7. R15 Compliance Checklist

Roblox R15 avatar rigs have 15 body parts (vs 6 in R6). The P31 bridge requires R15
for accurate `GetBoundingBox()` spatial math.

- [ ] Avatar rig type set to **R15** (Game Settings → Avatar → Avatar Type)
- [ ] `GetBoundingBox()` returns valid `.Y` dimension (not nil, not 0)
- [ ] Portal spawn position validated within bounds (±10000 studs)
- [ ] BuildingSystem correctly detects avatar height
- [ ] All three scripts show "active" in Output window
- [ ] HTTP requests completing without errors (no "HTTP 403" or "HTTP 502")

---

## 8. Rate Limiting

Roblox's `HttpService` has a **496 requests/minute** rate limit per game server.
The P31 scripts are designed to stay well under this limit:

| Script | Request Pattern | Est. req/min |
|--------|----------------|--------------|
| Portal | Once per player per 5s cooldown | ~12/player |
| ChatMirror | Once per chat message | ~20/player |
| BuildingSystem | Once per 5 blocks placed | ~20/player |
| **Total (per player)** | | **~52 req/min** |

With a full server (10 players): ~520 req/min (at burst, but average is ~200 req/min).

---

## 9. Troubleshooting

### "HTTP request failed"
- Check that `HttpService.HttpEnabled = true` in Game Settings
- Verify `https://shadow-bridge.trimtab-signal.workers.dev` is in the allow list
- Check internet connectivity from the Wine/Vinegar environment

### "R15 height returned 0"
- Ensure avatar is fully loaded before calling `GetBoundingBox()`
- Add a `task.wait(1)` before the first bounding box call
- Verify R15 rig type in Game Settings

### "No LOVE credits minted"
- Check Shadow Bridge health endpoint is 200
- Check Genesis Gate health endpoint is 200
- Verify `LOVE_ENABLED = "true"` in Shadow Bridge wrangler.toml
- Check that `https://love-bridge.trimtab-signal.workers.dev` is reachable

### "Portal not appearing"
- Portal is auto-created at Vector3(0, 10, 0) if not manually placed
- Check that the workspace is large enough (portal size is 12x10x2)
- Move portal manually via Explorer → Workspace → ExitPortal → Position

---

## 10. Production Deployment Checklist

Before deploying to a production Roblox game:

- [ ] Set `GAME_ID` in Shadow Bridge wrangler.toml to a unique game identifier
- [ ] Enable `LOVE_ENABLED = "true"` for production LOVE minting
- [ ] Set `GENESIS_GATE_URL` and `LOVE_BRIDGE_URL` to production URLs
- [ ] Test all three scripts on a fresh server
- [ ] Verify R15 avatar rig in production game settings
- [ ] Monitor Cloudflare dashboard for Shadow Bridge request volume
- [ ] Set up Cloudflare Alerts for worker errors >5/min

---

P31 Labs, Inc. | EIN 42-1888158 | AGPL-3.0
The cage holds. 863 Hz.
