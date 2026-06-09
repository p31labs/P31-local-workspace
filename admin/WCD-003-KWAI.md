# WORK CONTROL DOCUMENT (WCD)

**NODE DESIGNATION:** KWAI (The Centaur Cognitive Backend)  
**Document ID:** WCD-003-KWAI  
**Stack Layer:** p31.c (Brain)  
**Compliance:** 21 CFR §890.3710 (510(k) Exempt) — Powered Communication System  
**Status:** ACTIVE / DEPLOYED  

---

## 1. NODE PURPOSE & CLINICAL JUSTIFICATION

Node KWAI serves as the central "Cognitive Router" for the P31 ecosystem, bridging human intent with digital execution. As a backend service running Node.js/Express, KWAI manages:

- **Genesis Identity Registration** — Captures and validates user fingerprints (molecule signatures)
- **Spoon Economy Management** — Tracks daily cognitive energy allocation (5-7 spoons/day baseline)
- **Wallet Synchronization** — Manages L.O.V.E. (Ledger of Verified Existence) and Karma tokens
- **State Synchronization** — CRDT-based game state replication across devices

**Clinical Justification:** KWAI is designed to protect the user's executive function by providing clear, non-overwhelming state transitions. It prevents decision paralysis by automating routine state management and providing explicit feedback when user intervention is required.

---

## 2. ARCHITECTURE & DEPENDENCIES

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 18.x+ |
| Framework | Express | 4.x |
| Database | In-memory (mock) / Redis-ready | — |
| Network Protocol | REST API + WebSocket | — |
| Upstream | p31.ui (Frontend) | — |
| Downstream | p31.b (KILO Shield) | — |

**Data Flow:**
```
p31.ui → HTTP/REST → KWAI → p31.b (Buffer)
            ↓
       p31.state (Local Store)
```

---

## 3. I/O SPECIFICATIONS (DATA PIPELINE)

### 3.1 REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shelter/molecule` | Register new molecule fingerprint |
| GET | `/api/shelter/brain` | Get current spoon state |
| PATCH | `/api/shelter/brain` | Update spoons/maxSpoons/color |
| GET | `/api/shelter/wallet/:fingerprint` | Get user wallet (LOVE/Stars) |
| POST | `/api/shelter/sync` | Sync game state from client |
| GET | `/api/shelter/state/:fingerprint` | Retrieve persisted state |
| GET | `/api/shelter/mesh` | List active network nodes |

### 3.2 Request/Response Format

**Molecule Registration:**
```json
{
  "fingerprint": "string",
  "molecule": { "shape": "Ca9(PO4)6", "bonds": 39 }
}
```

**Brain State:**
```json
{
  "spoons": 5,
  "maxSpoons": 7,
  "color": "#39FF14"
}
```

**Wallet Response:**
```json
{
  "sovereigntyPool": 0,
  "performancePool": 0,
  "totalEarned": 0
}
```

---

## 4. SAFETY & TOLERANCE PROTOCOLS

### 4.1 Cognitive Load Management

- **Maximum Spoon Allocation:** 7/day (configurable)
- **Spoon Decrement Rate:** 1 per significant action
- **Spoon Recovery:** Daily reset at 00:00 UTC

### 4.2 Rate Limiting

- **Request Throttle:** Max 10 requests/second per fingerprint
- **Buffer Overflow Protection:** If queue >100, oldest entries dropped
- **Graceful Degradation:** Returns cached state if backend overloaded

### 4.3 Error Handling

| Error Code | Condition | User Feedback |
|------------|-----------|---------------|
| 400 | Missing fingerprint | "Identity not found. Please regenerate." |
| 404 | State not found | "No saved state. Starting fresh." |
| 429 | Rate limited | "Slow down. The ship is processing." |
| 500 | Server error | "System temporarily overloaded." |

---

## 5. REGULATORY COMPLIANCE

### 5.1 21 CFR §890.3710 Classification

KWAI qualifies as a **Powered Communication System** component because:

1. **Assists Communication:** Translates user intent into system state
2. **Medical Purpose:** Supports cognitive function for neurodivergent users
3. **Non-Invasive:** Software-only, no physical intervention
4. **510(k) Exempt:** Class I device, general controls sufficient

### 5.2 ADA Compliance

- **Section 508:** WCAG 2.1 AA compatible output
- **Cognitive Accessibility:** Explicit state transitions, no hidden modes
- **Spoon-Gated Actions:** Prevents overstimulation

### 5.3 Audit Trail

All state changes logged with:
- Timestamp (ISO 8601)
- Fingerprint (anonymized hash)
- Action type
- Pre/Post state delta

---

## 6. CALIBRATION PROFILES

| Profile | Use Case | Spoon Cost |
|---------|----------|------------|
| **Genesis** | Initial molecule registration | 0 |
| **Mining** | L.O.V.E. generation | 1/action |
| **Sync** | State synchronization | 0 |
| **Wallet** | Token transfer | 1/action |

---

## 7. DEPLOYMENT SPECIFICATIONS

- **Container:** Docker-ready (Dockerfile provided)
- **Port:** 3001 (configurable via `PORT` env)
- **Health Check:** `GET /health`
- **Startup Time:** <3 seconds
- **Memory Footprint:** <128MB

---

## 8. CHANGE LOG

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-03-23 | Initial WCD | System Architect |

---

**APPROVAL SIGNATURE:**  
KWAI is approved as a Cognitive Router for P31 Labs assistive technology.  

*21 CFR §890.3710 Compliant • ADA Section 508 Compatible* 🔺
