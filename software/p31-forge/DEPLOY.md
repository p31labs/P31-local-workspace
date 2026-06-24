# p31-forge — Deployment

## Prerequisites
- Node 20+
- Python 3 (for PDF generation)
- `npx wrangler login`

## Deploy Worker
```bash
npm run worker:deploy
```

## Generate documents locally
```bash
npm run compile          # compile all docs
npm run brand            # generate brand assets
npm run pdf              # convert DOCX to PDF
```

## Health check
```bash
curl https://p31-forge.<your-subdomain>.workers.dev/health
```
