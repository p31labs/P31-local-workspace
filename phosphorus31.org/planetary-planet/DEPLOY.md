# phosphorus31.org — Deployment

## Prerequisites
- Node 20+
- `npx wrangler login`

## Build
```bash
npm run build
```

## Deploy
```bash
npm run deploy
```

## Health check
```bash
curl https://phosphorus31.org/api/health
```

## CI/CD
GitHub Actions workflow at `.github/workflows/phosphorus31-site.yml` builds on every PR and deploys on merge to main.
