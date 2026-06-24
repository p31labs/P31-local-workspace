# phos — Deployment

## Build
```bash
npm run build
```
Output: `dist/`

## Deploy (Cloudflare Pages)
```bash
npx wrangler pages project create phos --production-branch main
npx wrangler pages deploy dist --project-name phos --branch main
```

## Health
```bash
curl https://phos.p31ca.org/health
```
