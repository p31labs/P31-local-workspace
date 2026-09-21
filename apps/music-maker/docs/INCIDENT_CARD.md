# Incident card — the spatial music maker

**One page. Three humans, one URL.** When it breaks, read this before anything
else. It is deliberately short — the runbook (`DEPLOY_RUNBOOK.md`) has the
full pre-flight/deploy/post-flight procedure; this is the "what do we do right
now" page.

## Contact

- URL: `https://music-presence.trimtab-signal.workers.dev`
- Logs: Cloudflare dashboard → Workers → `music-presence` → Observability
  (`wrangler tail` for a live stream)
- Rollback: `wrangler rollback` from `apps/music-maker/worker`

## The failure modes that matter for a family instrument

| Symptom | Likely cause | Do now |
|---|---|---|
| **No one can open the app** | Worker crashed / deploy broke / D1 down | `wrangler tail`; check dashboard error rate. Roll back if a recent deploy caused it. |
| **Sound never plays** | AudioContext gesture boundary | Hard reload. If the toggle shows "Sound off", tap it. Not a server issue. |
| **A device is silent in the room** | That device never tapped its toggle (opt-in per device) | Tap the sound toggle on that device. It is NOT the same as the other family members' state. |
| **Placements vanish / don't appear** | D1 write failing, or a reconnect lost the reconcile | `wrangler d1 execute music-maker --remote --command="SELECT COUNT(*) FROM events"`. If the count is wrong, the log is the source of truth — reload. |
| **"the service is having trouble"** | D1 failure surfaced as `reason:infra` | Check D1 quota / error rate. The committed log is the only state that must survive. |
| **"the connection stalled"** | WS/SSE transport degraded | The client self-heals (backoff + reconcile). Wait ~30s; it reconnects. |
| **Deploy fails with a storage error** | legacy-kv in config, or a stale migration | Confirm `storage = "sqlite"` and no `[[migrations]]` `new_classes`. |

## What must survive (and what can be lost)

- **The committed log (D1) must survive.** It is the score — the family's
  arrangement. Back it up before destructive work (see backup drill below).
- **Ephemeral presence can be lost freely.** Triggers, cursor positions,
  who-is-hearing-what — gone by design, no recovery needed.
- **The DO's in-memory sockets can be evicted.** Hibernation wakes them on the
  next message; clients reconnect and reconcile themselves.

## Rollback (the one command that fixes most things)

```bash
cd apps/music-maker/worker
npx wrangler rollback              # back to the previous version
# or to a specific version:
npx wrangler rollback --version <VERSION_ID>
```

Rollback restores code/config traffic, NOT D1/DO data. The log is separate.

## Escalation

- **Agent**: runs the checks above, can roll back, can read logs.
- **Human with Cloudflare credentials**: can change Access, budgets, D1.
- **The family**: if the app is broken, the fallback is the phone — play the
  instrument's notes by hand, or wait for the fix. The instrument is not
  life-critical; nothing here is an emergency.

---

## Backup + restore drill (Tier 1i) — run before the family writes real data

The D1 `events` table is the only state that must survive. Cloudflare D1 has
Time Travel (point-in-time recovery) — the drill is:

```bash
# 1. Export the log (source of truth, human-readable JSON lines).
npx wrangler d1 execute music-maker --remote \
  --command="SELECT seq, ts, data, prev_hash, scope FROM events ORDER BY seq ASC" \
  > /tmp/music-log-export.json

# 2. Confirm the export is non-empty and has the expected head.
#    The seq chain must be contiguous 0..N and each prev_hash must link.

# 3. Restore drill: wipe a THROWAWAY copy, not the live table. D1 Time Travel
#    in the dashboard restores the live DB to a point in time; practice on a
#    scratch database (wrangler d1 create music-maker-scratch) first.
```

Schedule: export before any destructive migration, and before the family test
so there is a clean baseline.

## Budget alert (Tier 1j) — dashboard step, not code

- Workers Paid includes 1M requests/mo; Durable Objects bill Duration
  (GB-seconds). Hibernation keeps idle duration near zero — that is the
  design's whole point, and the runbook's coast phase confirms it stays low.
- Set a Cloudflare dashboard budget alert for the account (Workers / D1 usage)
  so a runaway room can't surprise anyone on the bill.