# WCD-QE-01: Quantum Edge Production Deployment
## Work Control Document - P31 Labs Edge Worker Deployment

**Author:** Kilo Code Agent  
**Date:** 2026-03-24  
**Status:** READY FOR DEPLOYMENT  
**P31 Context:** Node One (The Totem) hardware integration

---

## 1. Overview

This document outlines the deployment steps for the P31 Labs Quantum Edge Worker to Cloudflare's global edge network. The worker handles Node One telemetry ingestion and SIC-POVM biological state processing.

## 2. Prerequisites

- [ ] Cloudflare account with Workers and KV access
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] P31 Labs Cloudflare account access
- [ ] KV namespaces created (see §3)

---

## 3. Create KV Namespaces

Execute the following commands to create the required KV namespaces:

```bash
# Navigate to quantum-edge directory
cd software/packages/quantum-edge

# Create TELEMETRY_KV namespace
wrangler kv:namespace create TELEMETRY_KV --preview

# Create STATE_KV namespace  
wrangler kv:namespace create STATE_KV --preview

# Create ALERTS_KV namespace
wrangler kv:namespace create ALERTS_KV --preview
```

**Note:** Replace preview IDs in `wrangler.toml` with production IDs after creation:

```bash
# Get production namespace IDs
wrangler kv:namespace list
```

Update `wrangler.toml` with the actual IDs:

```toml
[[kv_namespaces]]
binding = "TELEMETRY_KV"
id = "YOUR_ACTUAL_TELEMETRY_KV_ID"

[[kv_namespaces]]
binding = "STATE_KV"
id = "YOUR_ACTUAL_STATE_KV_ID"

[[kv_namespaces]]
binding = "ALERTS_KV"
id = "YOUR_ACTUAL_ALERTS_KV_ID"
```

---

## 4. Deploy to Staging

```bash
# Deploy to staging environment
wrangler deploy --env staging

# Verify staging deployment
curl https://p31-quantum-edge-staging.pages.dev/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "p31-quantum-edge",
  "version": "1.0.0"
}
```

---

## 5. Deploy to Production

```bash
# Deploy to production
wrangler deploy --env production

# Verify production health check
curl https://p31-quantum-edge.pages.dev/health
```

---

## 6. Test Telemetry Ingestion

### 6.1 Send Test Telemetry

```bash
# Send test telemetry payload
curl -X POST https://p31-quantum-edge.pages.dev/telemetry \
  -H "Content-Type: application/json" \
  -H "X-Device-ID: node-one-test-001" \
  -d '{
    "deviceId": "node-one-test-001",
    "timestamp": 1739999999999,
    "calcium": 0.72,
    "pth": 0.45,
    "hrv": 0.60,
    "vitD": 0.81,
    "battery": 0.95,
    "signalStrength": -65,
    "firmware": "1.0.0"
  }'
```

**Expected response:**
```json
{
  "status": "success",
  "cognitivePayload": {
    "status": "OPTIMAL",
    "primaryMetric": 0.645,
    "metricLabel": "Composite Health",
    "actionableAdvice": "✅ All systems nominal. Continue current protocol.",
    "pqcSecured": true,
    "timestamp": 1739999999999,
    "deviceId": "node-one-test-001"
  },
  "verifiableCredential": {
    "@context": [...],
    "type": ["VerifiableCredential", "P31HealthTomographyCredential"],
    ...
  }
}
```

### 6.2 Test Critical Alert

```bash
# Send critical calcium telemetry
curl -X POST https://p31-quantum-edge.pages.dev/telemetry \
  -H "Content-Type: application/json" \
  -H "X-Device-ID: node-one-test-001" \
  -d '{
    "deviceId": "node-one-test-001",
    "timestamp": 1739999999999,
    "calcium": 0.15,
    "pth": 0.20,
    "hrv": 0.30,
    "vitD": 0.40,
    "battery": 0.95,
    "signalStrength": -65,
    "firmware": "1.0.0"
  }'
```

**Expected:** Should trigger CRASH_WARNING status and store alert in ALERTS_KV

---

## 7. Node One Integration

### 7.1 Configure Device Endpoint

Update Node One firmware to send telemetry to:

```
Production: https://quantum-edge.p31ca.org/telemetry
Staging:    https://quantum-edge-staging.p31ca.org/telemetry
```

### 7.2 Telemetry Payload Format

```typescript
interface NodeOneTelemetry {
    deviceId: string;        // Unique device identifier
    timestamp: number;       // Unix timestamp (ms)
    calcium: number;         // 0-1 normalized
    pth: number;            // 0-1 normalized
    hrv: number;            // 0-1 normalized (Heart Rate Variability)
    vitD: number;           // 0-1 normalized
    battery: number;        // 0-1 normalized
    signalStrength: number; // dBm
    firmware: string;        // Firmware version
}
```

---

## 8. Monitoring & Observability

### 8.1 Cloudflare Dashboard

Navigate to:
- **Workers & Pages** → **p31-quantum-edge** → **Metrics**
- **Workers & Pages** → **KV** → **TELEMETRY_KV**

### 8.2 Log Retention

| Namespace | Retention | Purpose |
|-----------|-----------|---------|
| TELEMETRY_KV | 30 days | Raw device telemetry |
| STATE_KV | 30 days | Daily aggregated state |
| ALERTS_KV | 90 days | Critical alerts |

---

## 9. Rollback Procedure

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback --env production
```

---

## 10. Post-Deployment Checklist

- [ ] KV namespaces created and configured
- [ ] Staging deployment verified
- [ ] Production deployment verified
- [ ] Telemetry ingestion test passed
- [ ] Critical alert test passed
- [ ] Node One firmware endpoint configured
- [ ] Monitoring dashboard accessible
- [ ] Rollback procedure tested

---

## 11. Integration with BONDING

The Quantum Edge worker follows the same patterns as BONDING relay:

| Component | BONDING | Quantum Edge |
|-----------|---------|--------------|
| KV Namespace | TELEMETRY_KV | TELEMETRY_KV, STATE_KV, ALERTS_KV |
| Relay Pattern | Bulletin board | Telemetry ingestion + state analysis |
| Multiplayer | Side-by-side play | Device-to-edge real-time |

**Shared principles:**
- No CRDT (bulletin board model)
- IndexedDB for local persistence
- Cloudflare KV for edge sync

---

## 12. Brand Integration

P31 brand colors applied in responses:

| Color | Hex | Usage |
|-------|-----|-------|
| Phosphor Green | #00FF88 | OPTIMAL status |
| Quantum Cyan | #00D4FF | Links, credentials |
| Quantum Violet | #7A27FF | ATTENTION status |
| Danger Red | #EF4444 | CRITICAL/CRASH_WARNING |

---

**Document Status:** DEPLOYMENT READY  
**Next Action:** Execute §3 (Create KV Namespaces) → §4 (Deploy Staging) → §5 (Deploy Production)
