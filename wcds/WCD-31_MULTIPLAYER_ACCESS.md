# WCD-31: RESTORE MULTIPLAYER ACCESS

**Status:** 🔴 SHIP BLOCKER — no way to create/join rooms after WCD-25 declutter
**Date:** March 3, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** IMMEDIATE — multiplayer is a core feature for March 10 (Dad + 2 kids)
**QA Source:** Will Johnson, Chromebook — Image 1/2 show PING bar visible but no room button in top bar

---

## 1. DEFECT DESCRIPTION

WCD-25 (Clippy Popups / Top Bar Declutter) removed the network/wifi button from the top bar. This button was the ONLY entry point to the multiplayer lobby (create room, join room, enter room code).

**Current state:**
- Top bar: 🌱 + 🔊 + BONDING + 💛 LOVE + 🔥 streak — no multiplayer button
- Bottom command bar: 💚🤔😂🔺 PING emoji row renders — but there's no active room to ping into
- The multiplayer relay (WCD-13) is deployed and functional at `bonding-relay.trimtab-signal.workers.dev`
- The lobby UI (WCD-13) exists in the codebase — it's just unreachable

**Impact:** The entire point of BONDING shipping on March 10 is remote multiplayer. Dad on his phone, Bash on his tablet, Willow on her tablet. Three devices. Same room. If there's no button to create a room, multiplayer doesn't exist.

---

## 2. FIX

### Add a multiplayer button back to the top bar

The decluttered top bar has room for one more icon. Add a 🤝 (handshake) button next to the mute toggle:

```
🌱  🤝 🔊   BONDING    💛 368  🔥2d
```

- **🌱** = current mode (tap to return to mode select)
- **🤝** = multiplayer (tap to open lobby overlay)
- **🔊** = mute toggle

### Behavior

Tapping 🤝 opens the multiplayer lobby as an overlay (not a new page). The lobby already exists from WCD-13 — just wire the button to show it.

```typescript
// In TopBar.tsx
const [showLobby, setShowLobby] = useState(false);

<button onClick={() => setShowLobby(true)} className="hud-icon" title="Play Together">
  🤝
</button>

{showLobby && <MultiplayerLobby onClose={() => setShowLobby(false)} />}
```

### PING bar visibility

The PING emoji row (💚🤔😂🔺) should ONLY render when the player is in an active multiplayer session:

```typescript
const isInRoom = useGameStore(s => s.multiplayerRoom !== null);

// Only show PING bar in multiplayer
{isInRoom && <PingBar />}
```

In solo play, the PING bar is hidden. No orphaned emoji icons.

### Room status indicator

When in an active room, replace the 🤝 icon with a connection indicator:

```typescript
const isInRoom = useGameStore(s => s.multiplayerRoom !== null);
const playerCount = useGameStore(s => s.multiplayerRoom?.players?.length || 0);

<button onClick={() => setShowLobby(true)} className="hud-icon">
  {isInRoom ? `👥${playerCount}` : '🤝'}
</button>
```

- **Solo:** Shows 🤝 (tap to create/join room)
- **In room:** Shows 👥2 or 👥3 (tap to see room status, leave room)

---

## 3. QUEST PANEL: SHOW ONLY ACTIVE MODE'S QUEST

Image 2 shows BOTH Genesis (0/4) and The Kitchen (0/5) in the quest panel while in Sprout mode. Only The Kitchen should be visible.

**Fix:** Filter the quest panel to show only the quest matching the current mode:

```typescript
const currentMode = useGameStore(s => s.currentMode);
const activeQuest = QUESTS.find(q => q.mode === currentMode);

// Render only activeQuest, not all quests
{activeQuest && (
  <QuestCard quest={activeQuest} progress={questProgress[activeQuest.id]} />
)}
```

If the player wants to see quests for other modes, they switch modes. One mode = one quest visible.

---

## 4. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/TopBar.tsx` | Add 🤝 multiplayer button, wire to lobby overlay |
| `src/components/CommandBar.tsx` (or PingBar) | Only render PING bar when `isInRoom` is true |
| `src/components/QuestHUD.tsx` (or quest panel) | Filter to show only current mode's quest |
| `src/components/MultiplayerLobby.tsx` | Verify it renders as overlay when triggered from TopBar |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `worker-telemetry.ts` | Relay endpoints are working |
| `src/stores/gameSync.ts` | Sync logic is correct |
| `src/config/quests.ts` | Quest definitions are correct |

---

## 5. VERIFICATION CHECKLIST

- [ ] **🤝 button visible in top bar:** Between mode icon and mute toggle
- [ ] **Tap 🤝 → lobby opens:** Overlay with "Start Room" + "Join Room" + room code input
- [ ] **Create room → button updates:** Shows 👥1 (or 👥 + player count)
- [ ] **PING bar hidden in solo:** No 💚🤔😂🔺 icons when not in a room
- [ ] **PING bar visible in room:** Icons appear when in active multiplayer session
- [ ] **Quest panel in Seed:** Shows Genesis only
- [ ] **Quest panel in Sprout:** Shows The Kitchen only
- [ ] **Quest panel in Sapling:** Shows The Posner Quest only
- [ ] **Quest panel does NOT show multiple quests** at once
- [ ] **Close lobby overlay:** ✕ or tap outside dismisses lobby
- [ ] **Mobile:** 🤝 button is 48px touch target
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-31 — Opus — March 3, 2026*
*"If Dad can't create a room, the game is a solo toy. The 🤝 button is the bridge."*
