# P31 Labs: Discord Server Architecture

**Canonical Source of Truth** — Auto-scaffolded via `!scaffold-p31` command in the p31 bot.

---

## 1. Core Philosophy

This server is a **Sovereign Mesh**. It is designed for neurodivergent minds (AuDHD).

- **Low Noise**: Categories are strictly separated.
- **High Signal**: Channels have clear, explicit purposes. No unwritten social rules.
- **Spoon Conscious**: Emotes and roles exist to communicate energy levels without typing.

---

## 2. Role Hierarchy

| Role | Color | Hex | Purpose |
|------|-------|-----|---------|
| `[🔺] Trimtab` | Cyan | `#06b6d4` | Admin / Core Team |
| `[⚛️] Creator` | Purple | `#9c27b0` | Quantum Egg Hunt Winners |
| `[📡] Node` | Blue | `#3b82f6` | Verified Community Member |
| `[🥄] Low Spoons` | Slate | `#64748b` | Status Role — mutes pings |

---

## 3. Category & Channel Topology

```
📁 [ 📡 ] THE DIRECTIVE  (Read-Only)
  #rules            — The core axioms (see Section 4).
  #announcements    — P31 Labs updates, GitHub releases, Node hardware drops.
  #welcome          — Landing zone.

📁 [ 🧩 ] OPERATION TRIMTAB  (Campaigns)
  #showcase         — Chemical Egg drops and project showcases. (Auto-scaffolded)
  #decryption-log   — Discussion of lore, frequencies, and the Quantum Egg Hunt.

📁 [ 🧪 ] LABORATORIES  (The Tech)
  #bonding          — Multiplayer molecular game feedback, chemistry talk.
  #node-one         — ESP32 hardware, haptic feedback, mesh networking.
  #spaceship-earth  — 3D cognitive dashboard, Three.js, WebGPU.
  #the-buffer       — Fawn Guard, NLP, communication accessibility.

📁 [ 💬 ] THE COMMONS  (Community)
  #general          — Standard mesh chatter.
  #audhd-chat       — Neurodivergent experiences, late-diagnosis talk.
  #spoon-exchange   — Request help, offer help, or just state your current capacity.
```

---

## 4. Server Rules (Paste-ready for `#rules`)

**1. Protect Your Spoons.**
You are not obligated to reply to anyone immediately. Fawning is not required here. "No" is a complete sentence. If you are out of spoons, use the [🥄] reaction or role. We understand.

**2. The Mesh is Open.**
Everything we build is open-source. Share knowledge freely. Gatekeeping has no place in the geometry.

**3. Assume Positive Intent (But Verify Safety).**
Tone is hard, especially here. Ask for clarification before assuming hostility. However, discrimination, harassment, and intentional harm will result in an immediate severing from the mesh.

**4. Keep the Signal Clean.**
Use the right channels for the right topics. It helps keep the cognitive load low for everyone navigating the server.

---

## 5. Scaffolder Notes

- Run `!scaffold-p31` in any channel (requires Administrator)
- Idempotent — safe to re-run; existing channels/roles are found, not duplicated
- `#showcase` is moved into `[ 🧩 ] OPERATION TRIMTAB` if it was previously orphaned
- Chemical Egg listener (`QuantumEggHunt`) is rebound to the resolved `#showcase` ID after scaffold
- Role `[⚛️] Creator` must exist before the Chemical Egg can grant it — scaffold creates it
