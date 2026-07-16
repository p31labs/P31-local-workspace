# P31 Content Ground Truth

This directory contains the authoritative source for every mutable value displayed on p31ca.org pages. No page should hardcode any number, date, status, or URL that can change.

## Files

| File | Purpose | Update Frequency | How Updated |
|------|---------|-----------------|-------------|
| `nonprofit.json` | EIN, IRS status, founding date, policy effective dates | Monthly or on legal change | Manual |
| `stats.json` | Dynamic stats — test counts, Zenodo views, Q-factor | Weekly (auto-fetched at build) | `scripts/fetch-content-stats.mjs` |
| `constants.json` | Long-lived constants — FERS deadline, Larmor Hz, version pins | Yearly or on version bump | Manual |
| `love.json` | Fallback LOVE ledger values | Monthly | Manual (update from live API) |

## How to Update

### Manual updates

Edit the JSON file directly. Bump `lastVerified` to today's date. Run:

```bash
npm run content:status
npm run verify:content
```

### Automatic fetches

```bash
node scripts/fetch-content-stats.mjs          # normal fetch
node scripts/fetch-content-stats.mjs --force  # force update even if recent
```

### Check staleness

```bash
npm run content:status   # shows all files and their staleness
npm run verify:content   # runs all content verification scripts
```

## Rules

- **Every mutable value** on p31ca.org pages must source from one of these JSON files or a computed property of an existing data file (e.g., `p31-research.json` length for paper count).
- **If you add a new hardcoded number** to a page that can change, CI will flag it.
- **If you change a value** in these files, update `lastVerified`.
- **If a file exceeds its `stalenessThreshold`**, the prebuild verify step blocks deployment.

## Schema

All files follow the pattern:

```json
{
  "schema": "p31.content.X/1.0.0",
  "version": "1.0.0",
  "lastVerified": "ISO8601 timestamp",
  "stalenessThreshold": 7,
  "...data..."
}
```
