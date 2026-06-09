# P31 Cloudflare Worker Technical Specifications
## Full Technical Design for 10 Edge Computing Projects

**Date:** March 24, 2026  
**Version:** 1.0.0  
**Classification:** Architectural Planning Document

---

## Table of Contents

1. [Cognitive Passport Edge Cache](#1-cognitive-passport-edge-cache)
2. [L.O.V.E. Token Ledger](#2-love-token-ledger)
3. [Emergency Broadcast System](#3-emergency-broadcast-system)
4. [Real-Time Multiplayer Gateway](#4-real-time-multiplayer-gateway)
5. [Cognitive Load API](#5-cognitive-load-api)
6. [Fawn Response Detection System](#6-fawn-response-detection-system)
7. [Legal Document Versioning](#7-legal-document-versioning)
8. [Mesh Network Relay](#8-mesh-network-relay)
9. [Phenix Navigator Telemetry](#9-phenix-navigator-telemetry)
10. [Room State Sync](#10-room-state-sync)

---

## Cloudflare Infrastructure Overview

| Resource | Free Tier | P31 Usage |
|----------|-----------|-----------|
| Workers | 100K req/day | Primary API layer |
| KV | 1GB storage | Session state, cache |
| D1 | 5GB database | LOVE ledger, analytics |
| R2 | No egress fees | Media, archives, logs |
| Durable Objects | $0.018/100K ops | Real-time rooms |
| Pub/Sub | 1M messages/day | Broadcast, presence |
| Queues | 1M enqueues/day | Background jobs |
| AI Gateway | 50K inference/day | ML inference |

---

## 1. Cognitive Passport Edge Cache

### Overview
Edge-cached copy of the Cognitive Passport for sub-50ms global access across all P31 properties.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Worker    │────▶│     KV      │
│ (Browser)   │     │ (Edge)      │     │ (Hot Cache) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼ Miss
                    ┌─────────────┐     ┌─────────────┐
                    │     R2      │────▶│     KV      │
                    │ (Origin)    │     │ (Update)    │
                    └─────────────┘     └─────────────┘
```

### Technical Specification

#### Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/passport/{userId}` | Retrieve cached passport |
| POST | `/api/passport/{userId}` | Update passport (admin) |
| GET | `/api/passport/{userId}/version` | Get version number |

#### KV Schema

```typescript
// Key: passport:{userId}
// Value: JSON stringified passport
// TTL: 3600 seconds (1 hour)

interface PassportCache {
  userId: string;
  version: number;
  data: CognitivePassport;
  cachedAt: number; // Unix timestamp
  expiresAt: number;
}
```

#### R2 Schema

```typescript
// Object key: passports/{userId}/latest.json
// Metadata: version, updatedAt, contentHash

interface PassportOrigin {
  userId: string;
  version: number;
  data: CognitivePassport;
  updatedAt: string; // ISO 8601
  contentHash: string; // SHA-256
}
```

#### Cache Invalidation Strategy

1. **Time-based:** 1-hour TTL in KV
2. **Version-based:** Check version on each request, update if newer
3. **Manual:** Admin endpoint to force cache invalidation

#### Compression
- Brotli compression for all responses
- Content-Encoding: br header

#### Performance Targets

| Metric | Target |
|--------|--------|
| Cache Hit Latency | <50ms (p95) |
| Cache Miss Latency | <200ms (p95) |
| Cache Hit Rate | >90% |
| Global Availability | 99.9% |

#### Implementation Code

```typescript
// workers/passport-cache.ts

interface Env {
  PASSPORT_KV: KVNamespace;
  PASSPORT_R2: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    // Check KV cache first
    const cached = await env.PASSPORT_KV.get(`passport:${userId}`);
    
    if (cached) {
      const passport = JSON.parse(cached);
      
      // Check if expired
      if (passport.expiresAt > Date.now()) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
            'X-Cache': 'HIT',
            'X-Version': passport.version.toString(),
          },
        });
      }
    }

    // Cache miss - fetch from R2
    const r2Object = await env.PASSPORT_R2.get(`passports/${userId}/latest.json`);
    
    if (!r2Object) {
      return new Response('Passport not found', { status: 404 });
    }

    const data = await r2Object.json() as CognitivePassport;
    const version = r2Object.customMetadata?.version || 1;
    
    // Store in KV for next time
    const cacheEntry = {
      userId,
      version,
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour
    };
    
    await env.PASSPORT_KV.put(
      `passport:${userId}`,
      JSON.stringify(cacheEntry),
      { expirationTtl: 3600 }
    );

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'MISS',
        'X-Version': version.toString(),
      },
    });
  },
};
```

#### Spoon Cost
- **Implementation:** 1/5 (low complexity)
- **Maintenance:** 1/5 (automatic with TTL)

---

## 2. L.O.V.E. Token Ledger

### Overview
Distributed ledger for the LOVE (Ledger of Ontological Volume and Entropy) currency using D1 for persistence and Durable Objects for atomic transactions.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Worker    │────▶│  Durable    │
│ (BONDING)   │     │ (API)       │     │  Object     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │     D1      │◀───▶│    D1       │
                    │ (Persist)   │     │ (Transaction)│
                    └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Pub/Sub   │
                    │ (Broadcast) │
                    └─────────────┘
```

### Technical Specification

#### D1 Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  total_love_earned INTEGER DEFAULT 0,
  total_spoons_spent INTEGER DEFAULT 0
);

-- Transactions table (append-only)
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'earn' | 'spend' | 'bonus'
  amount INTEGER NOT NULL,
  description TEXT,
  metadata TEXT, -- JSON string
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- Balances (materialized view for fast queries)
CREATE TABLE balances (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/love/balance/{userId}` | Get user's LOVE balance |
| GET | `/api/love/transactions/{userId}` | Get transaction history |
| POST | `/api/love/earn` | Earn LOVE (care, creation) |
| POST | `/api/love/spend` | Spend LOVE (activities) |
| GET | `/api/love/leaderboard` | Top earners |

#### Durable Object: Transaction Processor

```typescript
// durable-objects/love-transaction.ts

export class LoveTransactionDO implements DurableObject {
  async fetch(request: Request): Promise<Response> {
    const body = await request.json() as TransactionRequest;
    
    // Validate transaction
    if (!body.userId || !body.type || !body.amount) {
      return new Response('Invalid transaction', { status: 400 });
    }

    // Atomic transaction using D1
    // 1. Check balance (for spend transactions)
    // 2. Insert transaction record
    // 3. Update balance
    
    const result = await this.env.D1.prepare(`
      BEGIN;
      
      -- Check balance for spend transactions
      ${body.type === 'spend' ? `
      SELECT balance FROM balances WHERE user_id = ?;
      ` : ''}
      
      -- Insert transaction
      INSERT INTO transactions (id, user_id, type, amount, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?);
      
      -- Update balance
      INSERT INTO balances (user_id, balance, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        balance = balance + ?,
        updated_at = ?;
      
      COMMIT;
    `).bind(
      // Parameters
      ...(body.type === 'spend' ? [body.userId] : []),
      crypto.randomUUID(),
      body.userId,
      body.type,
      body.amount,
      body.description || '',
      JSON.stringify(body.metadata || {}),
      Date.now(),
      body.userId,
      body.type === 'earn' ? body.amount : -body.amount,
      Date.now(),
      body.type === 'earn' ? body.amount : -body.amount,
      Date.now()
    ).run();

    // Broadcast via Pub/Sub
    await this.env.PUB_SUB.publish(
      `love:${body.userId}`,
      JSON.stringify({
        type: 'balance_update',
        userId: body.userId,
        amount: body.amount,
        newBalance: await this.getBalance(body.userId),
      })
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getBalance(userId: string): Promise<number> {
    const result = await this.env.D1.prepare(
      'SELECT balance FROM balances WHERE user_id = ?'
    ).bind(userId).first();
    return result?.balance || 0;
  }
}
```

#### Soulbound Token Logic

```typescript
// LOVE tokens are soulbound - non-transferable
// This is enforced at the application level, not blockchain

interface LoveToken {
  id: string;
  userId: string; // Bound to specific user
  type: 'care' | 'creation' | 'consistency' | 'bonus';
  amount: number;
  earnedAt: number;
  description: string;
  metadata: Record<string, unknown>;
}

// Validation: Cannot transfer, cannot sell
// Only earn (by performing actions) and spend (on activities)
```

#### Pub/Sub Events

| Event | Channel | Payload |
|-------|---------|---------|
| Balance Update | `love:{userId}` | `{ type, userId, amount, newBalance }` |
| Transaction | `love:global` | `{ type, userId, amount, description }` |

#### Performance Targets

| Metric | Target |
|--------|--------|
| Transaction Latency | <200ms (p95) |
| Balance Query | <50ms (p95) |
| Throughput | 100 tx/sec |
| Availability | 99.9% |

#### Spoon Cost
- **Implementation:** 3/5 (medium complexity)
- **Maintenance:** 2/5 (routine monitoring)

---

## 3. Emergency Broadcast System

### Overview
Real-time emergency broadcast to all connected devices when operator experiences a crisis, using Pub/Sub for instant propagation.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Trigger   │────▶│   Worker    │────▶│   Pub/Sub   │
│ (Manual/    │     │ (Validate)  │     │ (Broadcast) │
│  Auto)      │     └─────────────┘     └─────────────┘
└─────────────┘            │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │     D1      │     │   Clients   │
                    │ (Log)       │     │ (WebSocket) │
                    └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  External   │
                    │ (911, SMS)  │
                    └─────────────┘
```

### Technical Specification

#### Trigger Sources

| Source | Description | Priority |
|--------|-------------|----------|
| Manual Button | One-click in BONDING/Spaceship Earth | 1 |
| Biometric Alert | Heart rate spike from wearable | 2 |
| Location Alert | Geofence exit (e.g., court) | 3 |
| Scheduled Check | Missed check-in timer | 4 |

#### Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/emergency/trigger` | Trigger emergency broadcast |
| POST | `/api/emergency/acknowledge` | Acknowledge receipt |
| GET | `/api/emergency/status` | Current emergency status |
| GET | `/api/emergency/contacts` | Get emergency contacts |

#### Broadcast Channels

| Channel | Subscribers | Purpose |
|---------|-------------|---------|
| `emergency:global` | All connected devices | Full system alert |
| `emergency:brenda` | Brenda's devices | Direct notification |
| `emergency:tyler` | Tyler's devices | Backup contact |
| `emergency:operator` | Will's devices | Self-acknowledge |

#### Alert Payload

```typescript
interface EmergencyAlert {
  id: string;
  type: 'manual' | 'biometric' | 'location' | 'scheduled';
  severity: 'warning' | 'critical' | 'life-threatening';
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  message: string;
  timestamp: number;
  acknowledgedBy: string[];
  expiresAt: number;
}
```

#### Notification Channels

| Channel | Method | Latency Target |
|---------|--------|----------------|
| In-app | WebSocket/Push | <100ms |
| SMS | Twilio API | <5s |
| Phone | Twilio Voice | <10s |
| Email | SendGrid | <30s |

#### Implementation

```typescript
// workers/emergency-broadcast.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/emergency/trigger' && request.method === 'POST') {
      return this.handleTrigger(request, env);
    }

    if (path === '/api/emergency/acknowledge' && request.method === 'POST') {
      return this.handleAcknowledge(request, env);
    }

    return new Response('Not found', { status: 404 });
  }

  async handleTrigger(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as EmergencyTrigger;
    
    // Validate trigger
    if (!body.type || !body.severity) {
      return new Response('Invalid trigger', { status: 400 });
    }

    const alert: EmergencyAlert = {
      id: crypto.randomUUID(),
      type: body.type,
      severity: body.severity,
      location: body.location,
      message: body.message || this.getDefaultMessage(body.severity),
      timestamp: Date.now(),
      acknowledgedBy: [],
      expiresAt: Date.now() + 3600000, // 1 hour
    };

    // Store in D1
    await env.D1.prepare(`
      INSERT INTO emergency_alerts (id, type, severity, message, location, timestamp, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      alert.id,
      alert.type,
      alert.severity,
      alert.message,
      alert.location ? JSON.stringify(alert.location) : null,
      alert.timestamp,
      alert.expiresAt
    ).run();

    // Broadcast via Pub/Sub
    await env.PUB_SUB.publish('emergency:global', JSON.stringify(alert));

    // Send external notifications for critical/life-threatening
    if (alert.severity === 'critical' || alert.severity === 'life-threatening') {
      await this.sendExternalNotifications(alert, env);
    }

    return new Response(JSON.stringify({ alertId: alert.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async sendExternalNotifications(alert: EmergencyAlert, env: Env): Promise<void> {
    // SMS to Brenda
    if (env.TWILIO_SID) {
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${env.TWILIO_SID}:${env.TWILIO_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: env.BRENDA_PHONE,
          From: env.TWILIO_PHONE,
          Body: `P31 EMERGENCY: ${alert.message} - ${alert.location ? `Location: ${alert.location.lat},${alert.location.lng}` : 'No location'}`,
        }),
      });
    }
  }

  getDefaultMessage(severity: string): string {
    switch (severity) {
      case 'warning': return 'Operator needs support';
      case 'critical': return 'Operator in distress - please check in';
      case 'life-threatening': return 'EMERGENCY - Operator needs immediate assistance';
      default: return 'Operator alert';
    }
  }
};
```

#### D1 Schema

```sql
CREATE TABLE emergency_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT,
  location TEXT,
  timestamp INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  acknowledged_by TEXT DEFAULT '[]'
);

CREATE TABLE emergency_contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  priority INTEGER NOT NULL,
  notify_sms INTEGER DEFAULT 1,
  notify_email INTEGER DEFAULT 1,
  notify_call INTEGER DEFAULT 0
);
```

#### Spoon Cost
- **Implementation:** 4/5 (high complexity)
- **Maintenance:** 2/5 (routine checks)

---

## 4. Real-Time Multiplayer Gateway

### Overview
Replace BONDING's current polling-based relay with true WebSocket connections using Durable Objects for sub-100ms real-time synchronization.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Worker    │────▶│  Durable    │
│  (BONDING)  │     │ (Upgrade)   │     │  Object     │
└─────────────┘     └─────────────┘     │  (Room DO)  │
                           │            └─────────────┘
                    ┌─────────────┐            │
                    │  WebSocket  │◀───────────┘
                    │  Upgrade    │
                    └─────────────┘
```

### Technical Specification

#### Durable Object: Game Room

```typescript
// durable-objects/game-room.ts

export class GameRoomDO implements DurableObject {
  private roomCode: string;
  private players: Map<string, PlayerState> = new Map();
  private state: GameState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = new DurableObjectState(state);
    this.roomCode = ''; // Set on first request
  }

  async fetch(request: Request): Promise<Response> {
    // Upgrade to WebSocket
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // HTTP endpoints
    const url = new URL(request.url);
    if (url.pathname === '/state') {
      return new Response(JSON.stringify(this.getState()), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  async handleWebSocket(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair();
    
    const playerId = new URL(request.url).searchParams.get('playerId') || crypto.randomUUID();
    
    // Add player to room
    this.players.set(playerId, {
      id: playerId,
      connected: true,
      lastSeen: Date.now(),
      state: {},
    });

    // Handle messages
    server.addEventListener('message', async (event) => {
      await this.handleMessage(playerId, event.data);
    });

    server.addEventListener('close', () => {
      this.players.delete(playerId);
      this.broadcast({
        type: 'player_left',
        playerId,
        players: this.getPlayerList(),
      });
    });

    // Send initial state
    server.send(JSON.stringify({
      type: 'welcome',
      playerId,
      roomCode: this.roomCode,
      players: this.getPlayerList(),
      state: this.getState(),
    }));

    // Broadcast new player
    this.broadcast({
      type: 'player_joined',
      playerId,
      players: this.getPlayerList(),
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async handleMessage(playerId: string, data: string): Promise<void> {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'place_atom':
        this.state.atoms.push(message.atom);
        this.broadcast({
          type: 'atom_placed',
          playerId,
          atom: message.atom,
        });
        break;

      case 'ping':
        this.broadcast({
          type: 'pong',
          playerId,
          timestamp: Date.now(),
        });
        break;

      case 'reaction':
        this.broadcast({
          type: 'reaction',
          playerId,
          reaction: message.reaction,
        });
        break;
    }

    // Persist state to KV
    await this.persistState();
  }

  broadcast(message: object): void {
    // Broadcast to all connected players
    // Implementation depends on WebSocket library
  }

  getPlayerList(): PlayerState[] {
    return Array.from(this.players.values());
  }

  getState(): GameState {
    return this.state;
  }

  async persistState(): Promise<void> {
    // Save to KV for recovery
  }
}
```

#### Room Management

```typescript
// workers/room-manager.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Create room
    if (path === '/api/room/create' && request.method === 'POST') {
      const roomCode = this.generateRoomCode();
      
      // Get DO ID for room
      const id = env.GAME_ROOM.idFromName(roomCode);
      const stub = env.GAME_ROOM.get(id);
      
      // Initialize room
      await stub.fetch(new Request('http://internal/init'));
      
      return new Response(JSON.stringify({ roomCode }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Join room
    if (path === '/api/room/join' && request.method === 'POST') {
      const { roomCode, playerId } = await request.json();
      
      const id = env.GAME_ROOM.idFromName(roomCode);
      const stub = env.GAME_ROOM.get(id);
      
      // Return WebSocket upgrade URL
      const wsUrl = `wss://${url.host}/ws/${roomCode}?playerId=${playerId}`;
      
      return new Response(JSON.stringify({ wsUrl }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },

  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  },
};
```

#### Performance Targets

| Metric | Target |
|--------|--------|
| Message Latency | <100ms (p95) |
| Connection Recovery | <500ms |
| Max Players/Room | 4 |
| Room Timeout | 24 hours idle |

#### Spoon Cost
- **Implementation:** 4/5 (high complexity)
- **Maintenance:** 3/5 (connection monitoring)

---

## 5. Cognitive Load API

### Overview
Edge-based API that receives spoon expenditure data from the Buffer, aggregates across sessions, and provides real-time cognitive load dashboards.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Buffer    │────▶│   Worker    │────▶│     KV      │
│  (Client)   │     │ (Ingest)    │     │ (Daily)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │     D1      │     │    D1       │
                    │ (Archive)   │     │ (Aggregate) │
                    └─────────────┘     └─────────────┘
```

### Technical Specification

#### Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/spoons/log` | Log spoon expenditure |
| GET | `/api/spoons/summary/{userId}` | Get daily summary |
| GET | `/api/spoons/trends/{userId}` | Get weekly trends |
| GET | `/api/spoons/debt/{userId}` | Get spoon debt warning |

#### KV Schema

```typescript
// Key: spoons:{userId}:{date} (YYYY-MM-DD)
// Value: JSON array of spoon events

interface SpoonEvent {
  id: string;
  userId: string;
  amount: number; // Negative for expenditure
  trigger: string; // What triggered the expenditure
  context: string; // Current activity
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface DailySpoonSummary {
  userId: string;
  date: string;
  totalSpent: number;
  totalEarned: number;
  netBalance: number;
  events: SpoonEvent[];
  triggers: Record<string, number>; // Aggregation by trigger
}
```

#### Implementation

```typescript
// workers/spoons-api.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/spoons/log' && request.method === 'POST') {
      return this.handleLog(request, env);
    }

    if (path.startsWith('/api/spoons/summary/')) {
      return this.handleSummary(request, env);
    }

    if (path.startsWith('/api/spoons/trends/')) {
      return this.handleTrends(request, env);
    }

    return new Response('Not found', { status: 404 });
  },

  async handleLog(request: Request, env: Env): Promise<Response> {
    const event = await request.json() as SpoonEvent;
    
    // Validate
    if (!event.userId || event.amount === undefined) {
      return new Response('Invalid event', { status: 400 });
    }

    const date = new Date(event.timestamp).toISOString().split('T')[0];
    const key = `spoons:${event.userId}:${date}`;

    // Get existing events
    const existing = await env.SPOONS_KV.get(key);
    const events: SpoonEvent[] = existing ? JSON.parse(existing) : [];
    
    // Add new event
    events.push({
      ...event,
      id: crypto.randomUUID(),
      timestamp: event.timestamp || Date.now(),
    });

    // Store back to KV
    await env.SPOONS_KV.put(key, JSON.stringify(events), {
      expirationTtl: 86400 * 7, // 7 days
    });

    // Archive to D1 for long-term
    await env.D1.prepare(`
      INSERT INTO spoon_events (id, user_id, amount, trigger, context, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.id,
      event.userId,
      event.amount,
      event.trigger,
      event.context,
      JSON.stringify(event.metadata || {}),
      event.timestamp
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleSummary(request: Request, env: Env): Promise<Response> {
    const userId = request.url.split('/').pop();
    const date = new URL(request.url).searchParams.get('date') || 
                 new Date().toISOString().split('T')[0];

    const key = `spoons:${userId}:${date}`;
    const events = await env.SPOONS_KV.get(key);
    
    if (!events) {
      return new Response(JSON.stringify({ 
        userId, 
        date, 
        totalSpent: 0, 
        totalEarned: 0,
        netBalance: 0,
        events: [],
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parsed = JSON.parse(events) as SpoonEvent[];
    const summary = this.calculateSummary(userId, date, parsed);

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  calculateSummary(userId: string, date: string, events: SpoonEvent[]): DailySpoonSummary {
    const totalSpent = events
      .filter(e => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    
    const totalEarned = events
      .filter(e => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);

    const triggers = events.reduce((acc, e) => {
      acc[e.trigger] = (acc[e.trigger] || 0) + Math.abs(e.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      userId,
      date,
      totalSpent,
      totalEarned,
      netBalance: totalEarned - totalSpent,
      events,
      triggers,
    };
  },
};
```

#### D1 Schema

```sql
CREATE TABLE spoon_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  trigger TEXT,
  context TEXT,
  metadata TEXT,
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_spoon_events_user ON spoon_events(user_id);
CREATE INDEX idx_spoon_events_timestamp ON spoon_events(timestamp DESC);
```

#### Spoon Cost
- **Implementation:** 2/5 (moderate complexity)
- **Maintenance:** 1/5 (automatic)

---

## 6. Fawn Response Detection System

### Overview
Edge ML inference to detect stress patterns in text input, voice (via Web Speech API), or behavioral signals, enabling early intervention.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Worker    │────▶│ AI Gateway  │
│  (Buffer)   │     │ (Feature    │     │ (TensorFlow │
│             │     │  Extract)   │     │  .js)       │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │     KV      │     │   Risk      │
                    │ (Thresholds)│     │   Score     │
                    └─────────────┘     └─────────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │   Fawn      │
                                      │   Guard     │
                                      │ (Brenda)    │
                                      └─────────────┘
```

### Technical Specification

#### Detection Signals

| Signal | Source | Weight |
|--------|--------|--------|
| Typing Speed | Keyboard events | 0.3 |
| Response Latency | Message timestamps | 0.25 |
| Sentiment | Text analysis | 0.25 |
| Error Rate | Input corrections | 0.1 |
| Session Duration | Time tracking | 0.1 |

#### Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/fawn/detect` | Analyze input for stress |
| GET | `/api/fawn/thresholds/{userId}` | Get user's thresholds |
| POST | `/api/fawn/thresholds/{userId}` | Set thresholds |

#### AI Model

```typescript
// TensorFlow.js model for stress detection
// Input: [typingSpeed, responseLatency, sentiment, errorRate, sessionDuration]
// Output: [riskScore] (0-1)

const model = await tf.loadLayersModel('/models/fawn-detect/model.json');

// Preprocessing
const features = [
  normalize(typingSpeed, 0, 200), // 0-200 WPM
  normalize(responseLatency, 0, 30000), // 0-30s
  normalize(sentiment, -1, 1), // -1 to 1
  normalize(errorRate, 0, 1), // 0-1
  normalize(sessionDuration, 0, 7200), // 0-2 hours
];

const prediction = model.predict(tf.tensor2d([features])) as tf.Tensor;
const riskScore = (await prediction.data())[0];
```

#### Implementation

```typescript
// workers/fawn-detect.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/fawn/detect' && request.method === 'POST') {
      return this.handleDetect(request, env);
    }

    return new Response('Not found', { status: 404 });
  },

  async handleDetect(request: Request, env: Env): Promise<Response> {
    const input = await request.json() as FawnInput;
    
    // Extract features
    const features = this.extractFeatures(input);
    
    // Get user thresholds
    const thresholds = await this.getThresholds(input.userId, env);
    
    // Run inference (simplified - actual implementation uses AI Gateway)
    const riskScore = await this.runInference(features);
    
    // Check against thresholds
    const alert = riskScore > thresholds.warning;
    
    if (alert) {
      // Log alert
      await this.logAlert(input.userId, riskScore, features, env);
      
      // Notify Fawn Guard
      await env.PUB_SUB.publish(
        `fawn:${env.BRENDA_USER_ID}`,
        JSON.stringify({
          type: 'stress_alert',
          userId: input.userId,
          riskScore,
          features,
          timestamp: Date.now(),
        })
      );
    }

    return new Response(JSON.stringify({
      riskScore,
      alert,
      thresholds,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  extractFeatures(input: FawnInput): number[] {
    return [
      this.normalize(input.typingSpeed, 0, 200),
      this.normalize(input.responseLatency, 0, 30000),
      this.normalize(input.sentiment, -1, 1),
      this.normalize(input.errorRate, 0, 1),
      this.normalize(input.sessionDuration, 0, 7200),
    ];
  },

  normalize(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
  },

  async runInference(features: number[]): Promise<number> {
    // Simplified inference - in production use AI Gateway
    // Weighted sum based on feature importance
    const weights = [0.3, 0.25, 0.25, 0.1, 0.1];
    return features.reduce((sum, f, i) => sum + f * weights[i], 0);
  },
};
```

#### Threshold Defaults

| Level | Threshold | Action |
|-------|-----------|--------|
| Normal | 0.0 - 0.3 | None |
| Elevated | 0.3 - 0.5 | Log only |
| Warning | 0.5 - 0.7 | Notify Fawn Guard |
| Critical | 0.7 - 1.0 | Trigger Emergency |

#### Spoon Cost
- **Implementation:** 4/5 (high complexity)
- **Maintenance:** 3/5 (model updates)

---

## 7. Legal Document Versioning

### Overview
Tamper-evident hash chain for court filings, ensuring document integrity across the legal defense strategy.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │────▶│   Worker    │────▶│     D1      │
│  (Upload)   │     │ (Hash Chain)│     │ (Chain)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │     R2      │     │    R2       │
                    │ (Document)  │     │ (Audit Log) │
                    └─────────────┘     └─────────────┘
```

### Technical Specification

#### D1 Schema

```sql
CREATE TABLE document_chain (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  hash TEXT NOT NULL,
  previous_hash TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL
);

CREATE INDEX idx_document_chain_doc ON document_chain(document_id);
CREATE INDEX idx_document_chain_hash ON document_chain(hash);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  case_number TEXT,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/legal/upload` | Upload document |
| GET | `/api/legal/document/{id}` | Get document |
| GET | `/api/legal/verify/{id}` | Verify hash chain |
| GET | `/api/legal/history/{id}` | Get version history |

#### Hash Chain Logic

```typescript
// workers/legal-versioning.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/legal/upload' && request.method === 'POST') {
      return this.handleUpload(request, env);
    }

    if (path.startsWith('/api/legal/verify/')) {
      return this.handleVerify(request, env);
    }

    return new Response('Not found', { status: 404 });
  },

  async handleUpload(request: Request, env: Env): Promise<Response> {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');

    // Read file content
    const content = await file.text();
    
    // Calculate hash
    const hash = await this.calculateHash(content);
    
    // Get previous hash
    const previousHash = await this.getLatestHash(metadata.documentId, env);
    
    // Generate document ID if not provided
    const documentId = metadata.documentId || crypto.randomUUID();
    
    // Get version number
    const version = await this.getNextVersion(documentId, env);

    // Store in R2
    const key = `legal/${documentId}/v${version}.txt`;
    await env.LEGAL_R2.put(key, content, {
      customMetadata: {
        documentId,
        version: version.toString(),
        hash,
        previousHash,
        uploadedAt: Date.now().toString(),
      },
    });

    // Record in hash chain (D1)
    await env.D1.prepare(`
      INSERT INTO document_chain (id, document_id, version, hash, previous_hash, metadata, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      documentId,
      version,
      hash,
      previousHash,
      JSON.stringify(metadata),
      Date.now(),
      metadata.uploadedBy || 'unknown'
    ).run();

    return new Response(JSON.stringify({
      documentId,
      version,
      hash,
      previousHash,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async calculateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async handleVerify(request: Request, env: Env): Promise<Response> {
    const documentId = request.url.split('/').pop();
    
    // Get all versions
    const versions = await env.D1.prepare(`
      SELECT * FROM document_chain 
      WHERE document_id = ? 
      ORDER BY version ASC
    `).bind(documentId).all();

    // Verify chain
    let previousHash: string | null = null;
    const verification = {
      valid: true,
      documentId,
      versions: [] as { version: number; hash: string; valid: boolean }[],
    };

    for (const record of versions.results as any[]) {
      const valid = previousHash === null || record.previous_hash === previousHash;
      verification.versions.push({
        version: record.version,
        hash: record.hash,
        valid,
      });
      
      if (!valid) {
        verification.valid = false;
      }
      
      previousHash = record.hash;
    }

    return new Response(JSON.stringify(verification), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

#### Spoon Cost
- **Implementation:** 2/5 (moderate complexity)
- **Maintenance:** 1/5 (automatic)

---

## 8. Mesh Network Relay

### Overview
Bridge between LoRa mesh (Phenix Navigator devices) and internet, storing relay data in R2 for downstream processing.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   LoRa      │────▶│   MQTT      │────▶│   Worker    │
│   Device    │     │  Gateway    │     │   (Bridge)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │     R2      │
                                      │   (Logs)    │
                                      └─────────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │     D1      │
                                      │ (Analytics) │
                                      └─────────────┘
```

### Technical Specification

#### Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/mesh/ingest` | Ingest LoRa message |
| GET | `/api/mesh/nodes` | List active nodes |
| GET | `/api/mesh/topology` | Get network topology |
| GET | `/api/mesh/messages/{nodeId}` | Get node message history |

#### Message Format

```typescript
interface LoRaMessage {
  nodeId: string;
  timestamp: number;
  payload: string; // Base64 encoded
  rssi: number;
  snr: number;
  frequency: number;
  bandwidth: number;
  spreadingFactor: number;
  location?: {
    lat: number;
    lng: number;
  };
}
```

#### Implementation

```typescript
// workers/mesh-relay.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/mesh/ingest' && request.method === 'POST') {
      return this.handleIngest(request, env);
    }

    if (path === '/api/mesh/topology' && request.method === 'GET') {
      return this.handleTopology(request, env);
    }

    return new Response('Not found', { status: 404 });
  },

  async handleIngest(request: Request, env: Env): Promise<Response> {
    const message = await request.json() as LoRaMessage;
    
    // Validate
    if (!message.nodeId || !message.timestamp) {
      return new Response('Invalid message', { status: 400 });
    }

    // Store raw in R2
    const key = `mesh/${message.nodeId}/${message.timestamp}.json`;
    await env.MESH_R2.put(key, JSON.stringify(message));

    // Update node status in D1
    await env.D1.prepare(`
      INSERT INTO mesh_nodes (id, last_seen, last_rssi, last_snr)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        last_seen = ?,
        last_rssi = ?,
        last_snr = ?
    `).bind(
      message.nodeId,
      message.timestamp,
      message.rssi,
      message.snr,
      message.timestamp,
      message.rssi,
      message.snr
    ).run();

    // Update topology
    if (message.location) {
      await env.D1.prepare(`
        INSERT INTO mesh_locations (node_id, lat, lng, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(node_id) DO UPDATE SET
          lat = ?,
          lng = ?,
          updated_at = ?
      `).bind(
        message.nodeId,
        message.location.lat,
        message.location.lng,
        message.timestamp,
        message.location.lat,
        message.location.lng,
        message.timestamp
      ).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleTopology(request: Request, env: Env): Promise<Response> {
    const nodes = await env.D1.prepare(`
      SELECT n.id, n.last_seen, n.last_rssi, n.last_snr, l.lat, l.lng
      FROM mesh_nodes n
      LEFT JOIN mesh_locations l ON n.id = l.node_id
      ORDER BY n.last_seen DESC
    `).all();

    return new Response(JSON.stringify(nodes), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

#### D1 Schema

```sql
CREATE TABLE mesh_nodes (
  id TEXT PRIMARY KEY,
  last_seen INTEGER,
  last_rssi INTEGER,
  last_snr INTEGER
);

CREATE TABLE mesh_locations (
  node_id TEXT PRIMARY KEY,
  lat REAL,
  lng REAL,
  updated_at INTEGER
);

CREATE TABLE mesh_messages (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  payload TEXT,
  rssi INTEGER,
  snr INTEGER,
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_mesh_messages_node ON mesh_messages(node_id);
```

#### Spoon Cost
- **Implementation:** 3/5 (medium complexity)
- **Maintenance:** 2/5 (routine)

---

## 9. Phenix Navigator Telemetry

### Overview
Ingest telemetry data from Phenix Navigator hardware devices, process in background with Queues, store in D1 for analysis.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Phenix    │────▶│   Worker    │────▶│   Queue     │
│  Navigator  │     │   (Ingest)  │     │  (Background│
│  (Device)   │     │             │     │   Process)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │     D1      │
                                      │ (Storage)   │
                                      └─────────────┘
```

### Technical Specification

#### Telemetry Data

```typescript
interface TelemetryData {
  deviceId: string;
  timestamp: number;
  battery: {
    level: number; // 0-100
    voltage: number;
    charging: boolean;
  };
  haptic: {
    events: number;
    totalDuration: number;
    avgIntensity: number;
  };
  connectivity: {
    type: 'lora' | 'ble' | 'wifi';
    rssi: number;
    connected: boolean;
  };
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  errors: string[];
}
```

#### Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/telemetry/ingest` | Ingest telemetry |
| GET | `/api/telemetry/{deviceId}` | Get device telemetry |
| GET | `/api/telemetry/stats` | Get aggregate stats |

#### Queue Consumer

```typescript
// queues/telemetry-processor.ts

export default {
  async queue(
    batch: MessageBatch,
    env: Env
  ): Promise<void> {
    for (const message of batch.messages) {
      const telemetry = JSON.parse(message.body) as TelemetryData;
      
      // Store in D1
      await env.D1.prepare(`
        INSERT INTO telemetry (id, device_id, battery_level, battery_voltage, charging, haptic_events, haptic_duration, haptic_intensity, connectivity_type, connectivity_rssi, connected, location_lat, location_lng, location_accuracy, errors, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        telemetry.deviceId,
        telemetry.battery.level,
        telemetry.battery.voltage,
        telemetry.battery.charging ? 1 : 0,
        telemetry.haptic.events,
        telemetry.haptic.totalDuration,
        telemetry.haptic.avgIntensity,
        telemetry.connectivity.type,
        telemetry.connectivity.rssi,
        telemetry.connectivity.connected ? 1 : 0,
        telemetry.location?.lat || null,
        telemetry.location?.lng || null,
        telemetry.location?.accuracy || null,
        JSON.stringify(telemetry.errors),
        telemetry.timestamp
      ).run();

      // Acknowledge message
      message.ack();
    }
  },
};
```

#### D1 Schema

```sql
CREATE TABLE telemetry (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  battery_level INTEGER,
  battery_voltage REAL,
  charging INTEGER,
  haptic_events INTEGER,
  haptic_duration INTEGER,
  haptic_intensity REAL,
  connectivity_type TEXT,
  connectivity_rssi INTEGER,
  connected INTEGER,
  location_lat REAL,
  location_lng REAL,
  location_accuracy REAL,
  errors TEXT,
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_telemetry_device ON telemetry(device_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp DESC);
```

#### Spoon Cost
- **Implementation:** 2/5 (moderate complexity)
- **Maintenance:** 1/5 (automatic)

---

## 10. Room State Sync

### Overview
Real-time sync for Spaceship Earth's room-based navigation using Durable Objects for each room's state.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Worker    │────▶│  Durable    │
│ (Spaceship  │     │  (Route)    │     │  Object     │
│   Earth)    │     │             │     │  (Room)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                    ┌─────────────┐            │
                    │     KV      │◀───────────┘
                    │  (Config)   │
                    └─────────────┘
```

### Technical Specification

#### Room Types

| Room | Description | State |
|------|-------------|-------|
| Observatory | Geodesic data dome | Node positions, colors |
| Collider | Particle simulator | Particle states, beams |
| Bonding | BONDING game | Game state |
| Buffer | Cognitive dashboard | Load metrics |
| Bridge | LOVE wallet | Balance, transactions |

#### Durable Object: Room State

```typescript
// durable-objects/room-state.ts

export class RoomStateDO implements DurableObject {
  private roomId: string;
  private state: RoomState;
  private users: Map<string, UserPresence> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = new DurableObjectState(state);
    this.roomId = '';
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'join':
        return this.handleJoin(request);
      case 'leave':
        return this.handleLeave(request);
      case 'update':
        return this.handleUpdate(request);
      case 'state':
        return this.handleGetState();
      default:
        return new Response('Invalid action', { status: 400 });
    }
  }

  async handleJoin(request: Request): Promise<Response> {
    const { userId, userName } = await request.json();
    
    this.users.set(userId, {
      userId,
      userName,
      joinedAt: Date.now(),
      lastActive: Date.now(),
    });

    // Broadcast to all users
    await this.broadcast({
      type: 'user_joined',
      userId,
      userName,
      users: this.getUserList(),
    });

    return new Response(JSON.stringify({
      roomId: this.roomId,
      state: this.state,
      users: this.getUserList(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async handleUpdate(request: Request): Promise<Response> {
    const update = await request.json();
    
    // Apply update to room state
    Object.assign(this.state, update);
    
    // Broadcast to all users
    await this.broadcast({
      type: 'state_update',
      state: this.state,
    });

    // Persist to KV
    await this.persist();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async handleGetState(): Promise<Response> {
    return new Response(JSON.stringify({
      roomId: this.roomId,
      state: this.state,
      users: this.getUserList(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  getUserList(): UserPresence[] {
    return Array.from(this.users.values());
  }

  async broadcast(message: object): Promise<void> {
    // Implementation depends on WebSocket or SSE
  }

  async persist(): Promise<void> {
    // Save to KV for recovery
  }
}
```

#### Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/room/{roomId}` | Get room state |
| POST | `/api/room/{roomId}/join` | Join room |
| POST | `/api/room/{roomId}/leave` | Leave room |
| POST | `/api/room/{roomId}/update` | Update room state |

#### Room Configuration (KV)

```typescript
// Key: room:config:{roomId}
// Value: Room configuration

interface RoomConfig {
  roomId: string;
  type: 'observatory' | 'collider' | 'bonding' | 'buffer' | 'bridge';
  name: string;
  description: string;
  maxUsers: number;
  features: string[];
  createdAt: number;
  updatedAt: number;
}
```

#### Spoon Cost
- **Implementation:** 4/5 (high complexity)
- **Maintenance:** 3/5 (monitoring)

---

## Implementation Priority

| Priority | Project | Complexity | Impact | Timeline |
|----------|---------|------------|--------|----------|
| P1 | Cognitive Passport Edge Cache | Low | High | Week 1-2 |
| P1 | L.O.V.E. Token Ledger | Medium | High | Week 1-2 |
| P2 | Emergency Broadcast | High | Critical | Week 3-4 |
| P2 | Real-Time Multiplayer | High | High | Week 3-4 |
| P3 | Cognitive Load API | Medium | Medium | Month 2 |
| P3 | Fawn Response Detection | High | High | Month 2 |
| P4 | Legal Document Versioning | Low | Medium | Month 3 |
| P4 | Mesh Network Relay | Medium | Medium | Month 3 |
| P5 | Phenix Navigator Telemetry | Medium | Low | Month 4 |
| P5 | Room State Sync | High | Medium | Month 4 |

---

## Cost Estimation

| Project | Workers (req/day) | KV | D1 | R2 | DO | Est. Monthly Cost |
|---------|-------------------|-----|-----|-----|-----|-------------------|
| Passport Cache | 10K | 10MB | - | 50MB | - | $0 |
| LOVE Ledger | 5K | 1MB | 100MB | - | 100K ops | $0.05 |
| Emergency Broadcast | 1K | 1MB | 10MB | - | 10K ops | $0 |
| Multiplayer Gateway | 50K | 50MB | - | - | 1M ops | $0.18 |
| Cognitive Load API | 20K | 100MB | 50MB | - | - | $0.05 |
| Fawn Detection | 10K | 10MB | - | - | - | $0 |
| Legal Versioning | 1K | 1MB | 10MB | 100MB | - | $0.05 |
| Mesh Relay | 5K | 1MB | 10MB | 1GB | - | $0.50 |
| Telemetry | 10K | 1MB | 50MB | 10GB | - | $5.00 |
| Room Sync | 20K | 50MB | - | - | 500K ops | $0.09 |
| **Total** | **132K** | **225MB** | **230MB** | **11GB** | **610K** | **~$5.92/month** |

---

## Conclusion

These 10 Cloudflare Worker projects provide comprehensive edge computing capabilities for the P31 Andromeda ecosystem. The implementation should follow the priority matrix, starting with the Cognitive Passport Edge Cache and L.O.V.E. Token Ledger as quick wins with high impact.

All projects leverage Cloudflare's unique advantages:
- **Global edge distribution** for low latency
- **Durable Objects** for stateful real-time features
- **D1** for SQL-based persistence
- **R2** for zero-egress storage
- **Pub/Sub** for instant broadcasting

---

*Prepared: March 24, 2026*
*P31 Labs | phosphorus31.org | github.com/p31labs*
*It's okay to be a little wonky.* 🔺