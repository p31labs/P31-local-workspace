# Budget Alerts — Setup Guide

## Critical Warning

**There is no hard spending cap for Durable Object operations.** Cloudflare's Workers Usage Notifications only monitor CPU time — not DO row reads or writes. A runaway DO alarm loop can generate $34K+ overnight with zero platform warning.

## Setup (5 minutes)

### 1. Cloudflare Dashboard → Billing → Budget Alerts

1. Navigate to https://dash.cloudflare.com → Billing → Budget Alerts
2. Click "Add Budget Alert"
3. Configure:

| Threshold | Alert Method | Action |
|-----------|-------------|--------|
| $20/month | Email | Notification only |
| $50/month | Email + Webhook | Review usage |
| $100/month | Email + Webhook | Pause non-critical Workers |
| $500/month | Email + Webhook + SMS | Emergency — kill DOs |

### 2. Kill-Switch Worker (Already Deployed)

Your `workers/kill-switch` Worker runs hourly and checks DO row read/write budgets. It sends email alerts via MailChannels when thresholds are exceeded:

- DO row reads: >1,000,000 per instance per day
- DO row writes: >100,000 per instance per day
- Estimated monthly cost: >$100

### 3. Manual Cost Monitoring

```bash
# Check D1 storage
wrangler d1 list

# Check DO storage  
# Cloudflare Dashboard → Workers → Durable Objects → Storage

# Check estimated monthly cost
# Cloudflare Dashboard → Billing → Usage
```

## Response Plan

| Alert Level | Actions |
|-------------|---------|
| $20 | Review usage dashboard. Check for anomaly. |
| $50 | Investigate DO metrics. Check kill-switch logs. |
| $100 | Pause non-critical Workers. Investigate all DOs. |
| $500 | Emergency: delete offending DO class, roll back Workers, open support ticket. |

## Monthly Review

- Check D1 storage growth (target: <500 MB per database)
- Review DO row read/write trends
- Verify no Worker has unguarded `setAlarm()` calls (`pnpm run verify:do-alarms`)
- Run `pnpm run audit:do-hibernate` to verify DOs are hibernation-eligible
