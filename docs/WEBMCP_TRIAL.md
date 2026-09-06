# WebMCP Origin Trial Setup

## What is WebMCP?

WebMCP (Web Content Mediation Protocol) is a Chrome origin trial that enables
web applications to act as MCP (Model Context Protocol) clients, allowing AI
agents to interact with web pages through a standardized protocol.

## Registering for the Trial

### 1. Go to the Origin Trial registration page

Open a browser and navigate to:
https://developer.chrome.com/origintrials

### 2. Find the WebMCP trial

Search for "WebMCP" or "Web Content Mediation Protocol" in the list of active
origin trials. Click **Register**.

### 3. Register each domain

You need to submit **5 separate registrations**, one for each domain:

| # | Domain | App Type | Framework |
|---|--------|----------|-----------|
| 1 | `https://p31ca.org` | Technical Hub | Astro static |
| 2 | `https://phos.p31ca.org` | Cognitive Prosthetic | Vite React |
| 3 | `https://willow.p31ca.org` | Child Companion | Vite React |
| 4 | `https://bonding.p31ca.org` | Chemistry Game | Vite React |
| 5 | `https://phosphorus31.org` | Org Homepage | Astro hybrid |

For each registration:

1. Enter the origin URL exactly as shown above (with `https://` and no trailing slash)
2. Select **"Third-party matching"** if available (WebMCP may be used across subdomains)
3. Accept the terms and submit
4. Copy the **token** (a long base64 string like `Av9...AAA=`)

### 4. Gather tokens

Create a file or note with the mapping:

```
p31ca.org:          Av9...token1...AAA=
phos.p31ca.org:     Av9...token2...AAA=
willow.p31ca.org:   Av9...token3...AAA=
bonding.p31ca.org:  Av9...token4...AAA=
phosphorus31.org:   Av9...token5...AAA=
```

> **Note:** If the trial supports a single token for multiple origins, you
> may get one token. In that case, use the same token for all domains.

## Injecting the Token

### Option A: Build-time injection (recommended)

Set the environment variable before building each app:

**For Astro apps (p31ca, phosphorus31):**
```bash
export PUBLIC_WEBMCP_ORIGIN_TRIAL="Av9...AAA="
pnpm --filter @p31/p31ca run build
pnpm --filter phosphorus31 run build
```

**For Vite apps (phos, willow, bonding):**
```bash
export VITE_WEBMCP_ORIGIN_TRIAL="Av9...AAA="
pnpm --filter @p31/phos run build
pnpm --filter @p31/willow run build
pnpm --filter @p31/bonding run build
```

Or add the variables to each app's `.env` file:

**apps/p31ca/.env:**
```
PUBLIC_WEBMCP_ORIGIN_TRIAL=Av9...AAA=
```

**apps/phos/.env:**
```
VITE_WEBMCP_ORIGIN_TRIAL=Av9...AAA=
```

### Option B: Deploy-time injection (using the setup script)

Run the setup script to inject the token into all HTML shells at once:

```bash
export WEBMCP_ORIGIN_TRIAL_TOKEN="Av9...AAA="
node scripts/setup-webmcp-trial.mjs
```

This replaces `__WEBMCP_ORIGIN_TRIAL_TOKEN__` placeholders in all HTML files.

To clear the token from all shells:
```bash
export WEBMCP_ORIGIN_TRIAL_TOKEN=""
node scripts/setup-webmcp-trial.mjs
```

## How It Works

### Astro apps (p31ca, phosphorus31)

The layout template conditionally renders the `<meta>` tag:

```astro
---
const originTrialToken = import.meta.env.PUBLIC_WEBMCP_ORIGIN_TRIAL;
---
{originTrialToken && <meta http-equiv="origin-trial" content={originTrialToken} set:head />}
```

### Vite React apps (phos, willow, bonding)

The `index.html` contains a placeholder:

```html
<meta http-equiv="origin-trial" content="__WEBMCP_ORIGIN_TRIAL_TOKEN__">
```

This placeholder is replaced at deploy time by the setup script, or at build
time by setting `VITE_WEBMCP_ORIGIN_TRIAL` in the environment.

## Verifying the Trial is Active

### 1. Open Chrome DevTools

Navigate to any P31 domain (e.g., `https://p31ca.org`).

1. Press `F12` or `Ctrl+Shift+I` / `Cmd+Option+I`
2. Go to the **Application** tab
3. Select **Origin Trials** in the left sidebar

You should see:
- **WebMCP** listed under "Active trials"
- The token value shown
- Status: **Enabled**

### 2. Check the `<head>` element

In the **Elements** tab, search (`Ctrl+F`) for `origin-trial`:

```html
<meta http-equiv="origin-trial" content="Av9...AAA=">
```

The meta tag must be present in the `<head>`.

### 3. Check the Network tab

Filter by `origin-trial`:
1. Open the **Network** tab
2. Reload the page
3. Look for the `Origin-Trial` response header (served by Cloudflare)

The presence of the meta tag OR the HTTP header enables the trial.

### 4. JavaScript API check

In the DevTools **Console**, run:

```js
document.querySelector('meta[http-equiv="origin-trial"]')?.content
```

This should return the token string.

### 5. Verify MCP client capability

Once the trial is active, check that the WebMCP API is available:

```js
'launchMCPClient' in navigator
// or
'MCPSession' in window
```

The exact API name depends on the trial implementation.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Meta tag missing | Env var not set | Set `PUBLIC_WEBMCP_ORIGIN_TRIAL` or `VITE_WEBMCP_ORIGIN_TRIAL` before build |
| Token not replaced | Script not run | Run `node scripts/setup-webmcp-trial.mjs` |
| Trial shows "Expired" | Token expired | Get a new token from developer.chrome.com/origintrials |
| Trial shows "Not matching" | Wrong origin | Verify the origin in DevTools matches the registered origin exactly (incl. `https://`) |
| "Invalid token" error | Token malformed | Check for extra whitespace or truncated base64 |

## Files Modified by This Infrastructure

| File | Purpose |
|------|---------|
| `apps/p31ca/src/layouts/AppShell.astro` | Conditional meta tag (Astro `import.meta.env.PUBLIC_WEBMCP_ORIGIN_TRIAL`) |
| `apps/phosphorus31/src/layouts/Layout.astro` | Conditional meta tag (same pattern) |
| `apps/phos/index.html` | Placeholder `__WEBMCP_ORIGIN_TRIAL_TOKEN__` |
| `apps/willow/index.html` | Placeholder `__WEBMCP_ORIGIN_TRIAL_TOKEN__` |
| `apps/bonding/index.html` | Placeholder `__WEBMCP_ORIGIN_TRIAL_TOKEN__` |
| `apps/phosphorus31/index.html` | Placeholder `__WEBMCP_ORIGIN_TRIAL_TOKEN__` |
| `apps/phosphorus31/deploy/index.html` | Placeholder `__WEBMCP_ORIGIN_TRIAL_TOKEN__` |
| `.env.example` | Template with all 3 env vars documented |
| `scripts/setup-webmcp-trial.mjs` | Bulk injection script |
| `docs/WEBMCP_TRIAL.md` | This documentation |
