# Deployment

## Prerequisites
- Node.js >= 20
- Cloudflare API token with Pages write access
- wrangler CLI (`npm i -g wrangler` or `npx wrangler`)

## Manual Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name willow --branch=main
```

## CI/CD
Pushes to `main` trigger automatic deployment via `.github/workflows/ci-willow.yml`.
The workflow installs dependencies, runs tests with coverage, and executes `npm run deploy`.

## Environment
- `CLOUDFLARE_API_TOKEN` — set as GitHub Actions secret
- Project name on Cloudflare Pages: `willow`
- Production URL: `https://willow.pages.dev` (custom domain TBD)
