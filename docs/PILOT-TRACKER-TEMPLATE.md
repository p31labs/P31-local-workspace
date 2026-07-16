# P31 Pilot Tracker Template

Copy this table to a Google Sheet or spreadsheet for tracking pilot family onboarding.

| Family Name | DID | Status | Invited Date | Onboarded Date | Contact | Notes |
|-------------|-----|--------|--------------|----------------|---------|-------|
| Family 1 | did:key:z... | pending | | | | |
| Family 2 | did:key:z... | pending | | | | |
| Family 3 | did:key:z... | pending | | | | |
| Family 4 | did:key:z... | pending | | | | |
| Family 5 | did:key:z... | pending | | | | |
| Family 6 | did:key:z... | pending | | | | |
| Family 7 | did:key:z... | pending | | | | |
| Family 8 | did:key:z... | pending | | | | |
| Family 9 | did:key:z... | pending | | | | |
| Family 10 | did:key:z... | pending | | | | |
| Family 11 | did:key:z... | pending | | | | |
| Family 12 | did:key:z... | pending | | | | |
| Family 13 | did:key:z... | pending | | | | |
| Family 14 | did:key:z... | pending | | | | |
| Family 15 | did:key:z... | pending | | | | |
| Family 16 | did:key:z... | pending | | | | |
| Family 17 | did:key:z... | pending | | | | |
| Family 18 | did:key:z... | pending | | | | |

## Status Values

- **pending** — Not yet invited
- **invited** — Invitation sent, awaiting response
- **onboarded** — Completed onboarding flow (DID + PQC keys + Care SBT)

## How to Update

```bash
# Export current status from D1
node scripts/pilot-onboard.js --export-csv

# After a family completes onboarding
node scripts/pilot-onboard.js --onboard <did>
```

## Columns

- **Family Name** — Display name for the family
- **DID** — Their `did:key` (Ed25519) from onboarding
- **Status** — pending / invited / onboarded
- **Invited Date** — When the invitation was sent
- **Onboarded Date** — When they completed onboarding
- **Contact** — Email or Discord handle
- **Notes** — Any relevant notes (issues, feedback, etc.)
