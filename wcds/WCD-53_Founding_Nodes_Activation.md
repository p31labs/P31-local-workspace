# WCD-53: Founding Nodes Activation

**Status:** 🟢 EXECUTING — Hardware rewards system active
**Date:** March 31, 2026
**Executor:** Will Johnson
**Priority:** P1 — Hardware reward distribution
**Activation:** This WCD is now LIVE. The Founding Nodes system is operational.

---

## 1. CONTEXT

The Quantum Egg Hunt is active. The first 4 participants to complete all 4 eggs become Founding Nodes and receive Node Zero hardware devices.

**Current Date:** March 31, 2026
**Egg Hunt End Date:** April 5, 2026 (Easter Sunday)
**Hardware Ships:** Q2 2026

---

## 2. FOUNDING NODES SYSTEM (ACTIVE)

### 2.1 Rewards

| Reward | Value | Description |
|--------|-------|-------------|
| Node Zero device | ~$100 | ESP32-S3 with touchscreen |
| Founding Node badge | N/A | Eternal Discord role |
| Priority shipping | N/A | First batch hardware |
| Eternal 10% donation match | N/A | 10% of all future donations |

### 2.2 Eligibility

- Complete all 4 eggs in Quantum Egg Hunt
- First 4 to complete = Founding Nodes
- Remaining completers = Mesh Nodes

### 2.3 Egg Requirements

| Egg | Discovery | Frequency | Points |
|-----|------------|-----------|--------|
| Bashium | Bash Johnson | 172.35Hz | 39 spoons |
| Willium | Will Johnson | 172.35Hz | 39 spoons |
| Missing Node | Unknown | 172.35Hz | 39 spoons |
| First Tetrahedron | Unknown | K4 | 39 spoons + Founding Node |

## 3. HARDWARE REWARDS TRACKING

### 3.1 Node Zero Device Specifications

| Spec | Value |
|------|-------|
| **Device** | ESP32-S3 with Touchscreen |
| **Cost** | ~$100 per unit |
| **Quantity** | 4 units (one per Founding Node) |
| **Total Budget** | ~$400 + shipping |
| **Ship Date** | Q2 2026 |

### 3.2 Reward Fulfillment Status

| Slot | Discord ID | Username | Eggs Complete | Hardware Status | Shipping Status |
|------|------------|----------|---------------|-----------------|-----------------|
| 1 | _pending_ | _pending_ | 4/4 | ⏳ Awaiting | ⏳ Not started |
| 2 | _pending_ | _pending_ | 4/4 | ⏳ Awaiting | ⏳ Not started |
| 3 | _pending_ | _pending_ | 4/4 | ⏳ Awaiting | ⏳ Not started |
| 4 | _pending_ | _pending_ | 4/4 | ⏳ Awaiting | ⏳ Not started |

### 3.3 Tracking Files

| File | Path | Status |
|------|------|--------|
| `founding-nodes.json` | `software/discord/p31-bot/` | ✅ Active |
| `egg-progress.json` | `software/discord/p31-bot/` | ✅ Active |
| `shipping-manifest.json` | `software/discord/p31-bot/` | 🆕 Created |

---

## 4. CURRENT STATE

### 3.1 Files

| File | Purpose |
|------|---------|
| `egg-progress.json` | Tracks egg discoveries per user |
| `founding-nodes.json` | Tracks founding node status |

### 3.4 Current State

| Metric | Value |
|--------|-------|
| **Founding Nodes Claimed** | 0/4 |
| **Total Egg Hunters** | 2 |
| **Eggs Discovered (Total)** | 4 |
| **Days Until Easter** | 5 |

**Note:** `founding-nodes.json` currently contains placeholder data (`user_001` through `user_004`). These will be replaced with actual Discord user IDs upon real claims.

---

## 5. EXECUTION STEPS

### 5.1 Pre-Deadline (NOW — April 5)

- [x] Discord bot deployed with egg hunt active
- [x] Founding Node tracking system operational
- [x] Hardware specifications confirmed
- [ ] Monitor `founding-nodes.json` for claims
- [ ] Verify completion timestamps
- [ ] DM operator on each Founding Node claim

### 5.2 Deadline (April 5 end of day)

- [ ] Announce final Founding Nodes in Discord #announcements
- [ ] Award `[⚛️] Creator` role to all 4 Founding Nodes
- [ ] Update `founding-nodes.json` with verified IDs
- [ ] Generate shipping manifest

### 5.3 Post-Deadline (April 6+)

- [ ] Contact Founding Nodes via Discord DM for shipping addresses
- [ ] Procure Node Zero hardware (4 units)
- [ ] Ship hardware to Founding Nodes (Q2 2026)
- [ ] Announce winners on Twitter/Bluesky
- [ ] Update WCD-53 to COMPLETED status
- [ ] Begin 69-node community campaign

---

## 6. SHIPPING PROTOCOL

### 6.1 Package Contents (per Founding Node)

| Item | Qty | Notes |
|------|-----|-------|
| Node Zero device | 1 | Pre-flashed with P31 firmware |
| Quick Start Guide | 1 | Printed card with Discord invite |
| Sticker pack | 1 | P31 branding |
| Handwritten note | 1 | From operator |

### 6.2 Shipping Cost Estimate

| Component | Cost |
|-----------|------|
| Node Zero (4 units × $100) | $400 |
| Shipping (4 × $15 domestic) | $60 |
| Packaging materials | $20 |
| **Total** | **$480** |

---

## 7. SUCCESS CRITERIA

| Criterion | Status |
|-----------|--------|
| 4 Founding Nodes identified | ⏳ In progress |
| Discord roles awarded | ⏳ Pending deadline |
| Hardware procurement started | ⏳ Pending addresses |
| Winners announced on social | ⏳ Pending deadline |
| Hardware shipped | ⏳ Q2 2026 |

---

## 8. AUTHORIZATION

| Role | Name | Status |
|------|------|--------|
| Architect | Will Johnson | ✅ WCD-53 ACTIVE |
| System | Discord Bot (p31-bot) | ✅ Tracking operational |

---

**STATUS: 🟢 WCD-53 IS EXECUTING**

The Founding Nodes hardware rewards system is now live. The Discord bot is tracking egg discoveries. When the first 4 users complete all eggs, their Founding Node status will be recorded and hardware rewards will be allocated.

**Next action:** Monitor `founding-nodes.json` for real Discord user IDs replacing placeholder data.
