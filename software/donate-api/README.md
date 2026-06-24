# Donate API

<!-- pmm-badge -->
![PMM Maturity](../../.p31/badges/donate-api.svg)
<!-- /pmm-badge -->

Creates Stripe Checkout Sessions for phosphorus31.org/donate.

Endpoints:
- `POST /create-checkout`
- `POST /stripe-webhook`

## Deploy
```bash
npx wrangler deploy
```

## Tests
```bash
npm test
```

## Docs
See [DEPLOY.md](./DEPLOY.md) for secrets and domain setup.
See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup.
