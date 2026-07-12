# Pilot Family Onboarding Guide

*For pilot families, disability advocates, and autism support networks.*

Welcome to the P31 pilot program. This guide walks a family from "interested" to
"live in the care mesh" in a few steps. No engineering background required — if
you can fill in a form, you can onboard.

## What you get

- A **LOVE account** — your family's care-credit identity (non-extractive,
  care-based, not a tollbooth).
- A **pilot registry entry** — your family appears on the Arcade dashboard.
- **Care mesh participation** — privacy-preserving sharing of care signals
  (spoons, care events) with other pilot families, with differential-privacy
  noise so no single family can be re-identified.
- **Care reports** — a single view of your family's care score and balance.

## Step 1 — Create a LOVE account

Every family needs a `did` (decentralized identifier). This is created by the
LOVE ledger. If you already have a P31 account, you have a `did`. If not, create
one via the PHOS app or ask your onboarding contact to provision it.

> You cannot onboard without an existing LOVE account — the ledger checks for it
> and returns `404 Account not found` otherwise.

## Step 2 — Onboard the family

Your onboarding contact (or you, if you have API access) calls:

```
POST https://love-ledger.p31ca.org/family/onboard
Content-Type: application/json

{
  "did": "<your-family-did>",
  "family_name": "The Example Family",
  "nodes": ["node-1", "node-2"]   // optional: your devices/nodes
}
```

Response:

```json
{ "success": true, "did": "<did>", "status": "pending" }
```

Your family is now in the registry with status `pending`.

## Step 3 — Activate

Once your setup is verified, set status to `active`:

```
PATCH https://love-ledger.p31ca.org/family/<your-did>/status
Content-Type: application/json

{ "status": "active" }
```

Valid statuses: `pending` → `active` → `completed`.

After activation you'll appear as an **active pilot** on the
[Arcade dashboard](https://arcade.p31ca.org), and you can start sharing care data.

## Step 4 — Share care data (the care mesh)

Families submit signed care records. Each record is an Ed25519 signature over:

```
<family_did>|<period_start>|<period_end>|<avg_spoons>|<care_event_count>|<care_score>
```

The care mesh (`care-mesh.trimtab-signal.workers.dev`) exposes:

| Endpoint | What it does |
|---|---|
| `POST /submit` | Send a signed care record (verified, then stored) |
| `GET /aggregates?family_did=` | Your own raw stored records |
| `GET /mesh?family_did=` | Other families' records, with Laplace DP noise on `avg_spoons` |

The mesh view is **differentially private**: your `avg_spoons` is perturbed with
Laplace noise (ε = 0.5) and clamped to the spoon range `[0,5]`, so other families
see useful aggregate signal without being able to re-identify your exact values.

> **Spoon-aware note:** submitting once or twice a day is plenty. The system is
> designed for low-effort participation — don't let tracking become a burden.

## Step 5 — Watch the dashboard

The Arcade dashboard shows pilot status, care events, and mesh health. If
something looks off, reach out to your onboarding contact.

## Privacy & safety

- Your raw records are only visible to **you** (`/aggregates`).
- Other families see only the **noised** mesh view (`/mesh`).
- All submissions are cryptographically signed — tampering is rejected.
- LOVE is care-credit, not surveillance. Participation is reversible; you can
  move a family to `completed` at any time.

## Need help?

Contact your onboarding contact or P31 Labs support. We hand-hold the first
families personally.
