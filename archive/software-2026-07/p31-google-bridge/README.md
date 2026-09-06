# p31-google-bridge

Cloudflare Worker: **Google Workspace OAuth2** (OIDC + optional Calendar readonly) with tokens in **KV**. Session cookie is **host-only** — the OAuth flow and `/api/*` must be used on the **same public URL** (e.g. `*.workers.dev` or a dedicated route under your zone; see [cross-origin](#cross-origin-and-p31caorg)).

**Docs:** [`/docs/integrations/GOOGLE-WORKSPACE.md`](../../docs/integrations/GOOGLE-WORKSPACE.md)

## Automation & efficiency

| Command | When |
|--------|------|
| **`npm run verify`** | **All-in-one:** `print:redirect` → `preflight` (no second wrangler) → `wrangler deploy --dry-run`. Use from monorepo root: `pnpm run google-bridge:verify`. |
| `npm run preflight` | Before **every** deploy: checks `wrangler.toml`, optional `.dev.vars`, optional `wrangler deploy --dry-run` (drop `--no-wrangler` to skip local dry-run). |
| `npm run check` | Fast local check only (`--no-wrangler`). |
| `npm run print:redirect` | Print **exact** redirect URI + JS origin for Google Cloud Console. |
| From `software/`: `pnpm run google-bridge:preflight` or `google-bridge:verify` | Monorepo shortcut. |
| **In browser** | `GET /setup` — one-page **checklist** (redirect, scopes, curl samples, live readiness JSON). `GET /api/google/ready` — machine-readable (CI/monitoring, no session). |

**CI:** [`.github/workflows/p31-google-bridge.yml`](../../.github/workflows/p31-google-bridge.yml) — `npm ci` + same as `npm run verify` on this tree.

**Code path:** `loadSubAndToken` + `ensureFreshAccessToken` DRY session + token refresh (Calendar and future Google APIs use the same path).

---

## One-time Google Cloud setup

1. [Google Cloud Console](https://console.cloud.google.com/) → new project.  
2. **APIs & Services → Library** → enable **Google Calendar API** (and any others for your scopes).  
3. **OAuth consent screen** — *Internal* if only `@yourdomain` Workspace.  
4. **Credentials → OAuth 2.0 Client ID** → type **Web application**.  
5. **Authorized redirect URIs** (must **exact** match `REDIRECT_URL` in `wrangler.toml`):  
   - Dev: `http://127.0.0.1:8787/oauth/google/callback`  
   - Prod: `https://p31-google-bridge.<your>.workers.dev/oauth/google/callback` (or your custom host + path).  
6. Copy **Client ID**; create **Client secret** for `wrangler secret put GOOGLE_CLIENT_SECRET`.

## One-time Cloudflare setup

1. `cd software/p31-google-bridge`  
2. `npm install`  
3. `npx wrangler kv namespace create GOOGLE_OAUTH` → put the `id` in `wrangler.toml` for **both** default and `env.production` (replace the placeholder).  
4. `npx wrangler secret put GOOGLE_CLIENT_SECRET`  
5. Edit `wrangler.toml`: set `GOOGLE_CLIENT_ID`, `REDIRECT_URL`, `CORS_ALLOW_ORIGIN`, and `OAUTH_SUCCESS_URL` to the **same host** as `REDIRECT_URL` (e.g. `https://<worker>.workers.dev/connected`).  
6. `npm run deploy` (or `npx wrangler deploy`).

## Endpoints

| Path | Use |
|------|-----|
| `GET /` or `/health` | Liveness + JSON. |
| `GET /auth` | **Login UI** — “Sign in with Google” + form to **paste refresh or access token** (OAuth down / air-gapped / Playground). |
| `GET /oauth/google/start` | Optional `?return=<url>` (must be in `OAUTH_RETURN_ALLOWLIST`). Redirects to Google; `state` in KV may carry return URL. |
| `GET /oauth/google/callback` | Exchanges `code`, session cookie, redirects to `return` (allowlisted) or `OAUTH_SUCCESS_URL`. |
| `POST /api/tokens/submit` | `application/x-www-form-urlencoded` (from `/auth` form) or `application/json` — `{ "refresh_token", "access_token", "return" }`. Validates with Google, sets same session as OAuth. |
| `GET /connected` | Small HTML “linked” page with API links. |
| `GET /api/google/me` | JSON: `{ connected, email, sub, source, ... }` (session cookie). |
| `GET /api/google/calendar/list` | Calendar list (requires `calendar.readonly` in scopes). |
| `GET /oauth/google/logout` | Clears session; lands on `/auth`. |

**Cookie:** `p31_gb_sid` — `HttpOnly`, `Secure`, `SameSite=Lax`.

## Local dev

```bash
# .dev.vars (gitignored) — for local only
GOOGLE_CLIENT_SECRET=GOCSPX-...

npx wrangler dev
# Open http://127.0.0.1:8787/oauth/google/start
```

Ensure Google Console has redirect `http://127.0.0.1:8787/oauth/google/callback` and `wrangler.toml` `REDIRECT_URL` matches.

## Cross-origin and p31ca.org

Third-party cookies and cross-site `fetch` + `credentials` are unreliable. This Worker is **meant to be the origin** the operator uses for the Google handoff: link from the hub, e.g. [open-doc-suite](https://p31ca.org/open-doc-suite.html) with your deployed `https://<name>.workers.dev/oauth/google/start`.  
To embed JSON on `p31ca.org` without a backend, you’d add a **Worker route** on the same hostname as the app or use a **BFF** — out of scope for this package.

## Security

- Never put `GOOGLE_CLIENT_SECRET` in the repo or a public bundle.  
- Replace placeholder KV `id` in `wrangler.toml` before production deploy.  
- Narrow `DEFAULT_OAUTH_SCOPES` to what you need.  
- Review `p31ca/security/worker-allowlist.json` entry for this worker.

## License

CC-BY-4.0 (match P31 Forge / corporate suite) unless the repo `LICENSE` says otherwise for `software/`.
