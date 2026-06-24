# k4-hubs — Runbook

## Health check
`GET /health` returns JSON with `status`, `service`, `version`, `hubFusion` (boolean reflecting DO binding).

## Key routes
- `POST /route` — route messages (`send_to_mesh`, `query_agent`, `broadcast`)
- `GET /mesh-state/:scope` — room stats from k4-cage
- `GET /hub/:id/*` — HubFusion DO proxy
  - `GET /hub/:id/health` — DO liveness
  - `GET /hub/:id/roster` — 4-member roster
  - `PUT /hub/:id/roster` — set roster (requires `X-P31-Hub-Token`)
  - `GET /hub/:id/fusion` — symmetric energy read

## Known failure modes
- `hubFusion: false` in /health: HUB_FUSION DO binding missing
- `500` on /route: upstream k4-cage or k4-personal unreachable
- `401` on PUT /hub/:id/roster: missing or wrong `X-P31-Hub-Token`

## Recovery
1. Verify wrangler.toml bindings (`HUB_FUSION`, `K4_CAGE`, `K4_PERSONAL`)
2. Run `npm run deploy`
3. Check worker logs in Cloudflare Dashboard
