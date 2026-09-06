# P31 Discord Server Structure

## Server Overview
**Name:** P31 Labs Community
**Description:** Open-source assistive technology for neurodivergent individuals. Home of BONDING, Node One, and the P31 ecosystem.

---

## Category 1: P31 Labs (Organizational)

| Channel | Purpose | Permissions |
|---------|---------|-------------|
| `#announcements` | Official P31 Labs news, releases, milestones | @everyone read |
| `#roadmap` | Development priorities, upcoming features | Contributor role+ |
| `#introductions` | New member intros | @everyone |
| `#faq` | Frequently asked questions | @everyone |

---

## Category 2: BONDING (Gaming)

| Channel | Purpose |
|---------|---------|
| `#game-discussion` | General BONDING chat, strategies |
| `#quest-help` | Quest chain assistance, tips |
| `#multiplayer-matchmaking` | Find players for multiplayer |
| `#bugs-feedback` | Report issues, suggest features |
| `🎮 BONDING Room 1` | Voice: multiplayer sessions |
| `🎮 BONDING Room 2` | Voice: community play |

---

## Category 3: Support

| Channel | Purpose |
|---------|---------|
| `#technical-support` | Node One, firmware, hardware help |
| `#accessibility-questions` | P31 accessibility features |
| `#general-help` | General troubleshooting |

---

## Category 4: Node One (Hardware)

| Channel | Purpose |
|---------|---------|
| `#build-guides` | Step-by-step Node One builds |
| `#firmware-discussion` | ESP32 firmware, updates |
| `#hardware-mods` | Custom modifications, improvements |
| `🔧 Lab Bench` | Voice: build sessions, Q&A |

---

## Category 5: General

| Channel | Purpose |
|---------|---------|
| `#off-topic` | Non-P31 chat |
| `#showcase` | Share your builds, screenshots |
| `#resources` | Links to docs, tools, research |
| `☕ Lounge` | Voice: hang out |
| `🎤 Stage` | Voice: community calls, presentations |

---

## Role Structure

| Role | Color | Permissions |
|------|-------|-------------|
| `@everyone` | Default | Read channels |
| `@member` | Phosphor Green | Post, react |
| `@contributor` | Quantum Cyan | Manage messages, pins |
| `@moderator` | Calcium Amber | Kick, ban, manage roles |
| `@admin` | Quantum Violet | Full server control |

---

## Bot Configuration

### Required Bot Permissions
- `Send Messages`
- `Embed Links`
- `Use External Emojis`
- `Manage Roles`
- `Voice Connect`
- `Speak`

### Intent Requirements
- `GUILD_MESSAGES`
- `GUILD_VOICE_STATES`
- `MESSAGE_CONTENT`

---

## Webhook Integrations

| Source | Webhook Channel | Payload |
|--------|-----------------|---------|
| BONDING multiplayer | `#multiplayer-matchmaking` | Match start/end events |
| Node One telemetry | `#technical-support` | Offline/online alerts |
| Ko-fi purchases | `#announcements` | Node Count updates |
| New releases | `#announcements` | Version announcements |

---

## Moderation Guidelines

1. **Direct communication** - No corporate pleasantries
2. **Accessibility first** - Clear language, no jargon without explanation
3. **Fawn response awareness** - Bot detects and de-escalates
4. **No military metaphors** - This is a DoD civilian space, not military
5. **Geometric metaphors OK** - Delta topology, tetrahedra, etc.

---

*Last updated: 2026-03-24*
*It's okay to be a little wonky.* 🔺