# care-mesh — RUNBOOK

**Service:** `care-mesh.trimtab-signal.workers.dev`
**Repo:** `software/workers/care-mesh`
**D1:** reuses shared `love-ledger` D1 as `CARE_DB` (account at 10/10 D1 Free-Plan cap — no new DB)

## Purpose
Privacy-preserving aggregation of care data across families. A family submits
Ed25519-signed care records; any other family can query an aggregated,
differentially-private view of peers' data (Laplace noise on `avg_spoons`).

## Schema (migration `001_care_mesh_aggregates.sql`)
`care_mesh_aggregates(family_did, period_start, period_end, avg_spoons,
care_event_count, care_score, signature, pubkey, created_at)` + index on `family_did`.

Applied idempotently:
```
cd software/workers/care-mesh
wrangler d1 execute love-ledger --remote --file=migrations/001_care_mesh_aggregates.sql
```

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| POST | `/submit` | signed care record (Ed25519-verified) |
| GET | `/aggregates?family_did=` | raw stored rows for a family |
| GET | `/mesh?family_did=` | peer rows with Laplace DP noise on `avg_spoons` |

## /submit payload
```json
{
  "family_did": "familyA",
  "period_start": 1,
  "period_end": 2,
  "avg_spoons": 3,
  "care_event_count": 10,
  "care_score": 0.7,
  "signature": "<hex Ed25519 sig>",
  "pubkey": "<hex raw 32-byte Ed25519 pubkey>"
}
```
`signature` is an Ed25519 signature over the canonical string:
```
<family_did>|<period_start>|<period_end>|<avg_spoons>|<care_event_count>|<care_score>
```
Verification uses Web Crypto `crypto.subtle` (import the raw 32-byte pubkey).

## /mesh differential privacy
`avg_spoons` is perturbed with Laplace noise: ε = 0.5, sensitivity = 5 → scale = 10.
Result clamped to `[0,5]` (the spoon range). Response includes `noise_epsilon`.

## Sign a submission (openssl)
```
printf '%s' "familyA|1|2|3|10|0.7" \
  | openssl pkeyutl -sign -inkey key.pem -rawin | xxd -p   # -> signature
openssl pkey -pubin -in pub.pem -outform DER | tail -c 32 | xxd -p   # -> pubkey
```

## Deploy
```
cd software/workers/care-mesh
npx wrangler deploy
```

## Verify
```
curl https://care-mesh.trimtab-signal.workers.dev/health
curl "https://care-mesh.trimtab-signal.workers.dev/mesh?family_did=familyA"
```

## Rollback
`wrangler rollback`. The D1 table is additive and safe to leave in place.
