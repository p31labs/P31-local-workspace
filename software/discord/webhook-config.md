# P31 Discord Webhook Configuration

## Overview
This file documents the webhook endpoints and payloads for real-time alerts in the P31 Discord server.

---

## Webhook Server

**Endpoint:** `http://localhost:3000/webhook` (configurable via `NODE_ONE_WEBHOOK_PORT`)

**Content-Type:** `application/json`

---

## Event Types

### 1. BONDING Multiplayer Match

**Event:** `bonding-match`

**Trigger:** When a multiplayer match starts or ends

**Payload:**
```json
{
  "event": "bonding-match",
  "data": {
    "type": "start" | "end",
    "roomCode": "ABC123",
    "players": ["player1", "player2"],
    "duration": 300,
    "timestamp": "2026-03-24T17:00:00Z"
  },
  "timestamp": 1700000000000
}
```

**Discord Channel:** `#multiplayer-matchmaking`

---

### 2. Node One Status

**Event:** `node-one-status`

**Trigger:** When Node One device goes online/offline or sends telemetry

**Payload:**
```json
{
  "event": "node-one-status",
  "data": {
    "deviceId": "NODE-001",
    "status": "online" | "offline" | "low-battery",
    "battery": 85,
    "signal": -42,
    "message": "Device connected",
    "timestamp": "2026-03-24T17:00:00Z"
  },
  "timestamp": 1700000000000
}
```

**Discord Channel:** `#technical-support`

---

### 3. Ko-fi Purchase (Node Count Update)

**Event:** `kofi-purchase`

**Trigger:** When someone purchases on Ko-fi

**Payload:**
```json
{
  "event": "kofi-purchase",
  "data": {
    "supporter": "username",
    "amount": "5.00",
    "tier": "Supporter",
    "nodeCount": 42,
    "timestamp": "2026-03-24T17:00:00Z"
  },
  "timestamp": 1700000000000
}
```

**Discord Channel:** `#announcements`

**Note:** Node Count milestones: 4 (first tetrahedron), 39 (Posner number), 69, 150 (Dunbar's number), 420, 863 (Larmor), 1776 (Abdication)

---

### 4. Release Announcement

**Event:** `release`

**Trigger:** When a new version of BONDING, Spaceship Earth, or other P31 software is released

**Payload:**
```json
{
  "event": "release",
  "data": {
    "product": "BONDING",
    "version": "1.2.0",
    "changes": ["New quest chain", "Bug fixes"],
    "url": "https://bonding.p31ca.org",
    "timestamp": "2026-03-24T17:00:00Z"
  },
  "timestamp": 1700000000000
}
```

**Discord Channel:** `#announcements`

---

## External Webhook Setup

### GitHub Actions (for releases)
```yaml
- name: Discord notification
  uses: mental/gsoc-discord-webhook-action@main
  with:
    webhook-url: ${{ secrets.DISCORD_WEBHOOK_URL }}
    message: "🎉 New release: BONDING v${{ github.event.release.tag_name }}"
```

### BONDING Server (multiplayer)
Send POST to webhook endpoint when matches start/end.

### Node One Device
Send POST to webhook endpoint on status changes.

### Ko-fi
Configure Ko-fi webhook to POST to this endpoint on successful payments.

---

## Security

- Verify webhook signatures using `KOFI_SECRET` environment variable
- Rate limiting: 100 requests per minute per IP
- All timestamps in ISO 8601 UTC

---

*Last updated: 2026-03-24*
*It's okay to be a little wonky.* 🔺