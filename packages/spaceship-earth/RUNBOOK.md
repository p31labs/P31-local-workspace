# Spaceship Earth — Operational Runbook

**Version:** 1.1.0
**Last Updated:** 2026-08-08
**Deployment:** https://bf53b085.spaceship-earth.pages.dev

---

## 1. Prerequisites

- Node.js >= 20
- pnpm >= 9
- Cloudflare Wrangler CLI (`pnpm dlx wrangler`)
- Playwright (`NODE_PATH=/home/p31/node_modules node scripts/verify-ship.cjs`)

## 2. Local Development

```bash
pnpm dev          # Vite dev server on :5180
pnpm test         # Vitest unit suite (89 tests)
pnpm build        # tsc --noEmit + vite build → dist/
pnpm preview      # Preview production build
```

## 3. Verification

```bash
# Unit tests
pnpm test

# E2E verify suite (runs against live Pages deploy)
NODE_PATH=/home/p31/node_modules node scripts/verify-ship.cjs
```

Expected results:
- Unit: 89/89 tests pass
- E2E: 187/187 checks pass against `bf53b085.spaceship-earth.pages.dev`

## 4. Deployment

### Pages (static frontend)
```bash
cd packages/spaceship-earth
pnpm build
pnpm dlx wrangler pages deploy dist --project-name=spaceship-earth --branch=main
```

### Worker (relay + telemetry)
```bash
pnpm dlx wrangler deploy --name=spaceship-relay
```

### Environment Variables
- `VITE_RELAY_URL` — WebSocket relay endpoint (optional)
- `VITE_LLM_KEY` — LLM API key (optional)

## 5. MCP Server

```bash
node cli/spaceship-server.js
```

Exposes 4 stdio tools:
- `duna_status`
- `system_health`
- `dome_structure`
- `neo_pixel_control`

Persistent state: `~/p31-agents/spaceship-state.json`

## 6. Troubleshooting

| Issue | Resolution |
|-------|-----------|
| tsc type errors | Ensure `@webgpu/types` and `@types/web-bluetooth` are installed |
| Verify suite flakes | Known flakes: a2ui mount, Posner-24O, Zenodo empty feed — do not chase |
| Live deploy stale | Rebuild `dist/` from current HEAD and redeploy Pages |
| Worker fails | Check `SPACESHIP_TELEMETRY` KV namespace binding |
| LED controls no-op | `neo_pixel_control` is UI-only until hardware bridge is wired |

## 7. Architecture Reference

See `MANUFACTURERS_MANUAL.md` (P31-SE-MAN-001) for full technical specification.
