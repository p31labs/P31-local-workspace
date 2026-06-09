# WCD-13: MULTIPLAYER RELAY WIRING

**Status:** 🟡 HIGH — core March 10 feature: Dad plays alongside kids from separate devices
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-12 (difficulty modes). This is a 2-day build.
**Estimated Effort:** 2 days (Mar 3-4 per build timeline)

---

## 1. FEATURE DESCRIPTION

Multiplayer is NOT co-editing. Each player builds independently in a shared room. The relay is a bulletin board — it broadcasts what each player has built, their LOVE balance, and their completion status. Players can send PING reactions to each other's molecules.

**The use case:** Will opens BONDING on his device. Bash opens it on his tablet. Willow opens it on hers. They're in the same room. Will can see that Bash just built CO₂. Willow can see Dad's atoms pulsing. Bash sends a 💚 ping to Willow's H₂O. Every interaction is timestamped in the Genesis Block.

**This is a bridge, not a game lobby.** Design for a family of 2-4 players, not for 100-player matchmaking.

---

## 2. ARCHITECTURE: THE BULLETIN BOARD

```
┌──────────┐     POST /room/create        ┌──────────────────┐
│ Player A │ ─────────────────────────────→│                  │
│ (Will)   │     POST /room/{code}/update  │  Cloudflare      │
│          │ ─────────────────────────────→│  Worker +        │
│          │     GET  /room/{code}/state   │  KV Store        │
│          │ ←─────────────────────────────│                  │
└──────────┘                               │  bonding-relay.  │
                                           │  trimtab-signal. │
┌──────────┐     POST /room/{code}/join    │  workers.dev     │
│ Player B │ ─────────────────────────────→│                  │
│ (Bash)   │     POST /room/{code}/update  │                  │
│          │ ─────────────────────────────→│                  │
│          │     GET  /room/{code}/state   │                  │
│          │ ←─────────────────────────────│                  │
└──────────┘                               └──────────────────┘
```

**No WebSocket.** KV polling every 3 seconds. At family scale (2-4 players), this is ~20-40 KV reads per minute. Well within Cloudflare's free tier. Simple, stateless, zero operational complexity.

---

## 3. FILE MANIFEST

Files you WILL create:

| File | Purpose |
|------|---------|
| `src/multiplayer/relay.ts` | Client-side relay: create/join room, poll state, send updates/pings |
| `src/multiplayer/types.ts` | Shared types: RoomState, PlayerState, PingEvent |
| `src/components/RoomOverlay.tsx` | UI: room code display, player list, connection status |
| `src/components/PingButton.tsx` | PING reaction selector (💚🤔😂🔺) |

Files you WILL modify:

| File | Action |
|------|--------|
| `worker-telemetry.ts` (or separate relay worker) | Add room endpoints: create, join, update, state, ping |
| `src/stores/gameStore.ts` | Add multiplayer state: roomCode, players, isMultiplayer |
| `src/components/ModeSelect.tsx` | Un-gate "Play Together" (remove VITE_MULTIPLAYER_ENABLED check from WCD-10) |
| `src/components/TopBar.tsx` | Show room code + player count when in multiplayer |
| `src/components/Lobby.tsx` | Wire to real relay (replace localStorage mock) |
| `src/telemetry/eventBus.ts` | Add ROOM_CREATED, ROOM_JOINED, PING_SENT, PING_RECEIVED event types |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/*` | Chemistry engine is single-player; multiplayer is a display layer |
| `src/economy/economyStore.ts` | LOVE is local. Each player earns their own LOVE independently. |
| `src/components/BugReport.tsx` | Locked from WCD-11 |
| `src/config/modes.ts` | Locked from WCD-12 |

---

## 4. KV DATA MODEL

### Room State

Key: `room:{code}`
TTL: 4 hours (rooms auto-expire)

```typescript
interface RoomState {
  code: string;              // 6-char alphanumeric, uppercase
  createdAt: string;         // ISO 8601
  hostName: string;          // who created
  mode: GameMode;            // seed/sprout/sapling — set by host
  players: PlayerState[];
  pings: PingEvent[];        // last 50 pings, circular buffer
}

interface PlayerState {
  id: string;                // crypto.randomUUID() on join
  name: string;
  color: string;             // hex from lobby color picker
  joinedAt: string;
  lastSeen: string;          // updated on each poll — used for presence detection
  currentMolecule: string | null;  // formula currently on canvas (e.g., "H2O")
  moleculesCompleted: string[];    // formulas built this session
  loveBalance: number;
  atomCount: number;
}

interface PingEvent {
  id: string;
  fromPlayer: string;        // player id
  fromName: string;
  toPlayer: string;          // player id
  emoji: '💚' | '🤔' | '😂' | '🔺';
  molecule: string;          // which molecule the ping is about
  timestamp: string;
}
```

### Room Code Generation

```typescript
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1, O/0 confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

---

## 5. WORKER ENDPOINTS

All endpoints return JSON with CORS headers. All operate on the same KV namespace.

### POST /api/room/create

```typescript
// Input: { hostName: string, color: string, mode: GameMode }
// Output: { code: string, room: RoomState }
// Logic:
//   1. Generate 6-char code
//   2. Verify uniqueness (KV.get to check)
//   3. Create RoomState with host as first player
//   4. KV.put with 4-hour TTL
//   5. Return code
```

### POST /api/room/{code}/join

```typescript
// Input: { name: string, color: string }
// Output: { playerId: string, room: RoomState }
// Logic:
//   1. KV.get room
//   2. If not found: 404
//   3. If players.length >= 6: 400 "Room full"
//   4. Add player to players array
//   5. KV.put updated room
//   6. Return playerId + full room state
```

### POST /api/room/{code}/update

```typescript
// Input: { playerId: string, currentMolecule, moleculesCompleted, loveBalance, atomCount }
// Output: { room: RoomState }
// Logic:
//   1. KV.get room
//   2. Find player by id
//   3. Update player fields + lastSeen = now
//   4. KV.put updated room
//   5. Return full room state (so client gets everyone's state in one call)
```

### GET /api/room/{code}/state

```typescript
// Output: { room: RoomState }
// Logic:
//   1. KV.get room
//   2. If not found: 404
//   3. Mark stale players (lastSeen > 30s ago) — don't remove, just flag
//   4. Return room state
```

### POST /api/room/{code}/ping

```typescript
// Input: { fromPlayer, fromName, toPlayer, emoji, molecule }
// Output: { success: true }
// Logic:
//   1. KV.get room
//   2. Push ping to pings array (cap at 50, shift oldest)
//   3. KV.put updated room
```

### KV Write Contention Note

Multiple players updating the same room key simultaneously can cause last-write-wins data loss. At family scale (2-4 players, 3-second poll intervals), the probability of collision is low but nonzero. **Accept this tradeoff.** The alternative (per-player keys + aggregation) is over-engineering for the launch scope. If a player update gets lost, the next poll cycle catches up. The bulletin board is eventually consistent.

---

## 6. CLIENT: relay.ts

### Core Polling Loop

```typescript
class BondingRelay {
  private roomCode: string | null = null;
  private playerId: string | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private onStateUpdate: (room: RoomState) => void;
  private onPingReceived: (ping: PingEvent) => void;

  constructor(callbacks: { onStateUpdate, onPingReceived }) {
    this.onStateUpdate = callbacks.onStateUpdate;
    this.onPingReceived = callbacks.onPingReceived;
  }

  async createRoom(name: string, color: string, mode: GameMode): Promise<string> {
    const res = await fetch(`${RELAY_URL}/api/room/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName: name, color, mode }),
    });
    const data = await res.json();
    this.roomCode = data.code;
    this.playerId = data.room.players[0].id;
    this.startPolling();
    return data.code;
  }

  async joinRoom(code: string, name: string, color: string): Promise<void> {
    const res = await fetch(`${RELAY_URL}/api/room/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    const data = await res.json();
    this.roomCode = code;
    this.playerId = data.playerId;
    this.startPolling();
  }

  private startPolling(): void {
    // Immediately fetch once
    this.poll();
    // Then every 3 seconds
    this.pollInterval = setInterval(() => this.poll(), 3000);
  }

  private async poll(): Promise<void> {
    if (!this.roomCode) return;
    // Combine update + state fetch in one call
    const localState = getLocalPlayerState(); // read from gameStore
    const res = await fetch(`${RELAY_URL}/api/room/${this.roomCode}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: this.playerId, ...localState }),
    });
    const data = await res.json();
    this.onStateUpdate(data.room);

    // Check for new pings addressed to this player
    const myPings = data.room.pings.filter(
      p => p.toPlayer === this.playerId && !this.seenPingIds.has(p.id)
    );
    myPings.forEach(p => {
      this.seenPingIds.add(p.id);
      this.onPingReceived(p);
    });
  }

  async sendPing(toPlayer: string, emoji: string, molecule: string): Promise<void> {
    await fetch(`${RELAY_URL}/api/room/${this.roomCode}/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromPlayer: this.playerId,
        fromName: getLocalPlayerName(),
        toPlayer,
        emoji,
        molecule,
      }),
    });
  }

  disconnect(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.roomCode = null;
    this.playerId = null;
  }
}
```

---

## 7. UI COMPONENTS

### RoomOverlay (persistent HUD element during multiplayer)

Small panel in top-right corner showing:
```
┌─────────────────┐
│ Room: HK3M9V    │
│ 🟢 Dad          │
│ 🟢 Bash         │
│ 🟡 Willow       │  ← yellow = lastSeen > 10s ago
└─────────────────┘
```

Glassmorphism per Cockpit doctrine. z-index 11 (HUD panel layer).

### Player Molecules (in-canvas display)

When another player completes a molecule, show a brief toast:
```
🌿 Bash built CO₂! 💚
```

Keep it simple. No 3D rendering of other players' canvases. Just text notifications.

### PING Reactions

When viewing another player's completed molecule in the toast, tap to send a ping:

```
Bash built CO₂!
[💚] [🤔] [😂] [🔺]
```

Four buttons. One tap. Ping delivered. Each ping earns LOVE for both sender and receiver (per Passport §3: "Every ping = LOVE for both sender and receiver. Max 3 per molecule.").

Received pings show as a brief animation/toast:
```
💚 Dad reacted to your H₂O!
```

---

## 8. GENESIS BLOCK INTEGRATION

New telemetry events:

```typescript
// Room lifecycle
eventBus.emit({ type: 'ROOM_CREATED', data: { code, mode, hostName } });
eventBus.emit({ type: 'ROOM_JOINED', data: { code, playerName } });

// Pings (engagement proof)
eventBus.emit({ type: 'PING_SENT', data: { toPlayer, emoji, molecule } });
eventBus.emit({ type: 'PING_RECEIVED', data: { fromName, emoji, molecule } });
```

Each ping is timestamped, cryptographically logged proof of parent-child interaction across devices.

---

## 9. VERIFICATION CHECKLIST

- [ ] **Create room:** Host gets 6-char code displayed
- [ ] **Join room:** Second player enters code, appears in player list
- [ ] **Player list updates:** New players appear within one poll cycle (3s)
- [ ] **State sync:** Player A builds H₂O → Player B sees toast within 3s
- [ ] **PING send:** Tap emoji → ping delivered to target player within 3s
- [ ] **PING receive:** Receiving player sees animated toast with emoji + sender name
- [ ] **PING LOVE:** Both sender and receiver earn LOVE on ping
- [ ] **PING limit:** Max 3 pings per molecule per player enforced
- [ ] **Stale detection:** Player offline > 30s shows yellow indicator
- [ ] **Room expiry:** Rooms auto-expire after 4 hours (KV TTL)
- [ ] **Room code format:** 6 chars, uppercase, no confusable characters (I/1, O/0)
- [ ] **CORS clean:** No CORS errors in DevTools
- [ ] **Solo play unaffected:** Choosing "Play" (solo) skips all relay code
- [ ] **Genesis Block:** ROOM_CREATED, ROOM_JOINED, PING_SENT, PING_RECEIVED all log
- [ ] **Vitest:** Existing tests pass + new tests for relay logic (mock fetch)
- [ ] **Build clean:** `npm run build` — zero errors
- [ ] **tsc clean:** `tsc --noEmit` — zero errors

---

## 10. SCOPE BOUNDARY

**IN SCOPE:**
- Room create/join
- Player presence (polling)
- State broadcast (molecules, LOVE, atoms)
- PING reactions (4 emoji, max 3 per molecule)
- Basic toasts for other players' activity

**OUT OF SCOPE:**
- Real-time co-editing of the same canvas
- Voice/text chat
- Room password/privacy
- Spectator mode
- Player kick/ban
- Persistent rooms (rooms are ephemeral, 4-hour TTL)
- Room browser/matchmaking (code sharing is the join mechanism)

---

## 11. TESTING WITH TYLER

After WCD-13 is closed, schedule a multiplayer stress test with Tyler. The test protocol:

1. Will creates room on desktop Chrome
2. Tyler joins on his device
3. Both build molecules simultaneously for 10 minutes
4. Verify: state sync, ping delivery, no crashes, no KV errors
5. Tyler's family (Ashley, Link, Judah) joins → test 4-5 player room

This should happen Mar 6-7 per the build timeline.

---

*WCD-13 — Opus — March 2, 2026*
*"The relay is a bulletin board. Each player builds alone, together. Every ping is a bridge."*
