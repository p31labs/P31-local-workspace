# P31 GITHUB API FALLBACK MITIGATION

**Issue:** Posner Multi-Sig system relies on GitHub Actions webhooks  
**Severity:** CRITICAL  
**Status:** MITIGATION REQUIRED BEFORE DAY 0  
**Document ID:** MIT-001-GITHUB-FALLBACK

---

## 1. PROBLEM STATEMENT

The Posner Multi-Sig consensus system (the "5-Key Lock") uses GitHub Actions workflows to tally votes from 5 different contributors. If GitHub experiences extended downtime:

1. New vote submissions may fail
2. Vote tallies may not update
3. Ca₉(PO₄)₆ molecule assembly could stall

---

## 2. FALLBACK ARCHITECTURE

### 2.1 Primary Path (GitHub)

```
User Vote → Discord Bot → GitHub Action → PR → Merge → State Update
```

### 2.2 Fallback Path (Direct Git)

```
User Vote → Discord Bot → Direct Git Push → Local State Update
```

---

## 3. IMPLEMENTATION STRATEGY

### 3.1 Polling-Based Fallback

Add a cron job that runs every 5 minutes to check for missed webhooks:

```yaml
# .github/workflows/posner-sync-fallback.yml
name: Posner Sync Fallback
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:
```

### 3.2 Local Vote Cache

The Discord bot already maintains a local vote cache in Upstash Redis. This can serve as the fallback source:

```javascript
// Vote cache structure
{
  "votes": {
    "issue_123": {
      "user_a": { "voted": true, "timestamp": "..." },
      "user_b": { "voted": true, "timestamp": "..." },
      // etc.
    }
  },
  "lastGitHubSync": "2026-03-23T14:00:00Z"
}
```

### 3.3 Reconciliation Protocol

1. On bot startup, compare GitHub PR state with local vote cache
2. If GitHub unreachable for >10 minutes, switch to "local-only mode"
3. Mark votes as "pending sync" in audit trail
4. When GitHub returns, batch upload pending votes via GraphQL API

---

## 4. GRACEFUL DEGRADATION MATRIX

| GitHub Status | System Behavior | User Impact |
|---------------|-----------------|-------------|
| Operational | Full Multi-Sig via Actions | None |
| Slow (>5min response) | Local cache + queue | Minor delay |
| Down (<10min) | Local-only mode | Warning message |
| Extended Down (>1hr) | Offline vote capture | Votes saved for later sync |

---

## 5. IMPLEMENTATION CHECKLIST

- [ ] Add `posner-sync-fallback.yml` workflow
- [ ] Update Discord bot to cache votes locally
- [ ] Add reconciliation logic on bot startup
- [ ] Add "GitHub sync" status indicator in bot
- [ ] Document manual GraphQL sync procedure
- [ ] Test fallback mode with simulated GitHub outage

---

## 6. TIMELINE

| Task | Est. Effort | Priority |
|------|-------------|----------|
| Fallback workflow | 2 hours | HIGH |
| Local vote cache | 1 hour | HIGH |
| Reconciliation logic | 1 hour | HIGH |
| Status indicator | 30 min | MEDIUM |
| Manual sync doc | 30 min | MEDIUM |

**Total:** ~5 hours before Day 0

---

## 7. ALTERNATIVE: ZERO-GITHUB MODE

For full decentralization, the Posner Multi-Sig could bypass GitHub entirely by using:

- **Threshold Signature Scheme (TSS)** — Multiple parties sign jointly without GitHub
- **MPC (Multi-Party Computation)** — Cryptographic consensus without a central relay

However, this is a **future enhancement** — not required for Day 0 launch.

---

**MITIGATION STATUS:** IN PROGRESS  
**TARGET:** Complete before Day 0 ignition  
**RISK AFTER MITIGATION:** LOW

---
