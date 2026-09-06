# P31 Agent Integration Guide

## Overview

The P31 Design MCP server exposes the design system, component catalog, icons, and UI controls to AI agents via the Model Context Protocol (MCP).

**Server URL:** `https://p31-design-mcp.trimtab-signal.workers.dev`

## Claude Desktop Integration

### Configuration File

**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "p31-design-mcp": {
      "url": "https://p31-design-mcp.trimtab-signal.workers.dev",
      "transport": "streamable-http",
      "headers": {
        "Content-Type": "application/json"
      },
      "description": "P31 Design System MCP Server"
    }
  }
}
```

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### Restart Claude Desktop

After updating the config, restart Claude Desktop. The `p31-design-mcp` server will appear in the MCP tools list.

## Available Tools

| Category | Tools | Description |
|----------|-------|-------------|
| **Tokens** | `token_list`, `token_resolve` | Query design tokens |
| **Components** | `component_schema`, `component_usage`, `component_search` | Component catalog |
| **Icons** | `list_icons`, `get_icon`, `icon_search`, `icon_preview` | Icon catalog with SVG |
| **UI Controls** | `toggleDrawer`, `navigate`, `setSpoonLevel`, `scan_ui` | Interactive UI bindings |
| **Layout** | `layout_generate` | Generate HTML layouts |
| **Validation** | `validate_component`, `audit_tokens`, `audit_icons` | Design system audits |

## Agent Workflow Example

### 1. Read the Design System

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "token_list",
    "arguments": {}
  }
}
```

### 2. Get Component Schema

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "component_schema",
    "arguments": {
      "component": "GlassCard"
    }
  }
}
```

### 3. Generate UI

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "layout_generate",
    "arguments": {
      "type": "card-grid",
      "count": 4
    }
  }
}
```

### 4. Scan for WebMCP Annotations

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "scan_ui",
    "arguments": {
      "html": "<button data-mcp-tool=\"toggleDrawer\" data-mcp-state=\"closed\">Menu</button>"
    }
  }
}
```

## Testing the Integration

Run the test harness:

```bash
cd /home/p31/P31-local-workspace
node scripts/test-mcp-agent.mjs
```

Expected output:
```
P31 Design MCP — Agent Integration Test Harness
[1/6] Initializing MCP session...
  OK  Server: p31-design-system v1.0.0
[2/6] Listing available tools...
  OK  23 tools available
[3/6] Testing token_list...
  OK  token_list returned tokens
[4/6] Testing component_schema...
  OK  GlassCard schema: 2 fields
[5/6] Testing scan_ui...
  OK  scan_ui found 1 annotations
[6/6] Testing setSpoonLevel...
  OK  setSpoonLevel: success=true, level=3
```

## WebMCP Annotations

Interactive elements in P31 apps expose `data-mcp-*` attributes:

```html
<button data-mcp-tool="toggleDrawer" data-mcp-state="closed" data-mcp-target="nav-drawer">
  Menu
</button>

<a data-mcp-tool="navigate" data-mcp-href="/dashboard" data-mcp-external="false">
  Dashboard
</a>

<button data-mcp-tool="setSpoonLevel" data-mcp-type="control" data-mcp-range="0,5" data-mcp-current="3">
  Spoon Level
</button>
```

## Next Steps

1. **Connect Claude Desktop** — add the MCP config above and restart
2. **Test with an agent** — ask Claude to generate a GlassCard using the design system
3. **Extend WebMCP annotations** — add `data-mcp-*` to more components (ConversationShell, modals, forms)
4. **Zephyr proof-of-concept** — port GlassCard to Zephyr for pure-CSS agent-controllable UI

## Troubleshooting

**"tools not showing in Claude"**
- Verify the config file is valid JSON
- Restart Claude Desktop after config changes
- Check `~/.config/Claude/claude_desktop_config.json` on Linux

**"MCP server returning errors"**
- Verify the worker is deployed: `https://p31-design-mcp.trimtab-signal.workers.dev`
- Check worker logs: `cd workers/design-mcp && npx wrangler tail`
- Verify `data.ts` is up to date: `node workers/design-mcp/build.mjs`

**"scan_ui finds 0 annotations"**
- The test HTML must include `data-mcp-tool` attribute
- Annotations are positional (`:nth-of-type()` selectors)
- Run `node scripts/scan-mcp-annotations.mjs` to verify annotations in source
