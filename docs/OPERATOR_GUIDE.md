# P31 Operator Guide

For pilot operators managing families in the P31 programme.

## Dashboard Access

**URL:** https://pilot.p31ca.org

The dashboard shows:
- **Pilot count:** Total registered families
- **Active:** Families with completed onboarding
- **Care mints:** Total ProofOfCare SBTs minted
- **SD-JWTs:** Credentials issued
- **Anomalies:** Families with issues (low health, no mints, non-active status)

## Inviting Families

1. Open the dashboard at https://pilot.p31ca.org
2. Find the family in the table
3. Click "Invite" in the Actions column
4. Share the onboarding link with the family
5. The family completes the 5-step onboarding wizard in PHOS

## Monitoring Health

- **Mesh health:** Bar chart shows each family's mesh connectivity (0-100%)
- **D1 latency:** Health endpoint at `/health` shows database response time
- **Request IDs:** All API calls include `x-request-id` for debugging

## Troubleshooting

| Issue | Action |
|-------|--------|
| Family can't connect | Check mesh health < 50% — may need node restart |
| No mints showing | Family hasn't completed Step 5 (SBT mint) |
| SD-JWT verification failed | Check credential expiry (1 year default) |
| Dashboard shows errors | Check `/health` endpoint, review Workers Logs |

## API Reference

All API endpoints require HMAC-SHA256 authentication:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pilots` | GET | List all pilots |
| `/api/stats` | GET | Aggregated statistics |
| `/api/onboard/status` | GET | Onboarding progress |
| `/api/onboard` | POST | Trigger onboarding for a DID |
| `/api/invite` | POST | Send invitation (public) |
| `/api/invite/track` | POST | Log onboarding event (public) |
