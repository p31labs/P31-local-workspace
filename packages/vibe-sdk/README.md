# @p31/vibe-sdk

**P31 Vibe Coding SDK** — programmatic access to the P31 Vibe Coding Engine. Generate, deploy, audit, and manage apps from your own code.

## Quick Start

```bash
npm install @p31/vibe-sdk
```

```typescript
import { P31Client } from '@p31/vibe-sdk';

const p31 = new P31Client({
  familyId: 'did:key:your-family-id',
});

// Generate an app from a prompt
const result = await p31.generate({
  prompt: 'Build a star-catching game for my 6-year-old',
  vibeTags: ['calm', 'sparkly', 'playful'],
  ageGroup: 'child',
});
console.log(`Generated ${result.html.length}B HTML, MARGE score: ${result.auditScore}`);

// Deploy to the mesh
const deployed = await p31.deploy({
  name: 'Star Catcher',
  html: result.html,
  css: result.css,
  js: result.js,
});
console.log(`Live at: ${deployed.url}`);

// List all apps
const apps = await p31.list();
console.log(`${apps.length} deployed apps`);

// Run MARGE audit on some code
const audit = await p31.audit(html, css, js);
console.log(`Audit score: ${audit.score}/100`);
```

## CLI Usage

```bash
# Install the CLI
curl -fsSL https://cli.p31ca.org/install | bash

# Generate
p31 vibe generate "Build a memory game" --playful --age=child

# Deploy
p31 vibe deploy --name "Memory Game" --html "<h1>🧠</h1>"

# List
p31 vibe list

# List for a specific family
p31 vibe list --family did:key:my-family
```

## MCP Tools

The PHOS Forge MCP server includes vibe coding tools:

| Tool | Description |
|------|-------------|
| `vibe-generate` | Generate code from a prompt |
| `vibe-deploy` | Deploy to the P31 mesh |
| `vibe-list` | List deployed apps |

AI agents (Claude Code, Cursor, Copilot) can use these tools via MCP to generate and deploy apps programmatically.

## API Reference

### `new P31Client(config?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `baseUrl` | `string` | `https://phos.p31ca.org` | PHOS API base URL |
| `apiKey` | `string` | `undefined` | API key for authenticated requests |
| `familyId` | `string` | `p31:default` | Family DID for multi-tenant isolation |

### `client.generate(params)`

| Param | Type | Description |
|-------|------|-------------|
| `prompt` | `string` | Natural language description of what to build |
| `vibeTags` | `string[]` | Optional: calm, playful, warm, minimal, dense, sparkly, cozy, bold |
| `ageGroup` | `string` | Optional: child, youth, adult |
| `did` | `string` | Optional: user DID |

Returns: `{ html, css, js, auditScore, iterations, loveCost }`

### `client.deploy(params)`

| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | App name |
| `html` | `string` | HTML content |
| `css` | `string` | CSS content |
| `js` | `string` | JavaScript content |
| `creator` | `string` | Creator DID |
| `familyId` | `string` | Family DID |

Returns: `{ ok, id, family_id, url }`

### `client.list()`

Returns: `Array<{ id, name, creator, family_id, created_at, deploy_count }>`

### `client.delete(appId)`

Returns: `{ ok }`

### `client.audit(html, css, js, ageGroup?)`

Runs MARGE design audit on code. Returns: `{ score, violations, compliant }`

### `client.health()`

Returns: `{ ok, service, apps, families, audit_events }`

## Platform Architecture

```
Developer code → @p31/vibe-sdk
     │
     ├── p31.generate() → phos.p31ca.org/api/vibe/generate
     │                   → Gateway → Multi-agent pipeline
     │                   → MARGE audit → return code
     │
     ├── p31.deploy()   → app-supervisor.trimsig.workers.dev/apps/create
     │                   → SQLite storage → live URL
     │
     └── p31.list()     → app-supervisor.trimsig.workers.dev/apps
                         → Per-family filtering → app list
```

## Limits

| Limit | Value |
|-------|-------|
| Deploys per day per family | 50 |
| Total apps per family | 100 |
| Max code size | 100KB |
| In-memory cache TTL | 5 minutes |
| Rate limit (API) | 100 req/min |
| Rate limit (LLM) | 10 req/min |

## Security

- All deployed apps serve with `Content-Security-Policy: default-src 'none'`
- No outbound network access from generated apps
- `robots: noindex, nofollow` on all deployed pages
- Family isolation via X-Family-DID headers
- Prompt moderation for child safety
- Audit logging for every deploy event

## Links

- **PHOS Vibe Studio:** https://phos.p31ca.org/vibe
- **Developer Portal:** https://phos.p31ca.org/developer
- **GitHub:** https://github.com/p31labs
- **Research:** https://p31ca.org/research/
- **CLI Install:** `curl -fsSL https://cli.p31ca.org/install | bash`

---

*P31 Labs · Georgia nonprofit · EIN 42-1888158 · The cage holds · 863 Hz*
