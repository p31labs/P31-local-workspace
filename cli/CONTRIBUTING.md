# Contributing to andromeda-cli

## Development Setup
```bash
git clone https://github.com/p31labs/P31-local-workspace.git
cd P31-local-workspace
pnpm install
```

## Running Locally
```bash
node cli/index.js --help
node cli/mcp-server.js   # Start MCP server
```

## Testing
```bash
pnpm --filter andromeda-cli run test
```

## Code Style
- ES modules (`import`/`export`)
- JSDoc for public API
- No Babel transpilation needed (Node 20+ native ESM)

## MCP Servers
- `cli/mcp-server.js` — Oasis CLI (11 tools)
- `cli/component-registry.js` — Component Registry (5 tools)
- `cli/love-registry.js` — LOVE Ledger (4 tools)
- `cli/cognitive-prosthetic.js` — Cognitive Prosthetic (47 tools)

## Publishing
```bash
pnpm --filter andromeda-cli publish --access public
```
