# MCP Registry PR — P31 Servers

## PR Title

Add P31 Oasis CLI and Component Registry MCP servers

## DNS Ownership Verification

The MCP Registry uses DNS TXT records to verify namespace ownership. The following record must be active at `_agent.p31ca.org` before submitting the PR:

```
_agent.p31ca.org. 300 IN TXT "ver=1; uri=https://p31ca.org/.well-known/agents.json; auth=none"
```

This record is documented in `DNS_TXT_RECORD.md`.

## Server Definitions

### 1. P31 Oasis CLI (`p31-oasis-cli`)

**Path:** `servers/src/p31-oasis-cli/`

**`server.json`:**

```json
{
  "name": "p31-oasis-cli",
  "description": "P31 Oasis CLI — interactive TUI with 11 MCP tools for session management, theme switching, shell execution, and todo management.",
  "version": "1.0.0",
  "vendor": "P31 Labs",
  "homepage": "https://p31ca.org/cli",
  "repository": "https://github.com/p31labs/P31-local-workspace/tree/main/cli",
  "license": "MIT",
  "tags": ["cli", "developer-tools", "neuroinclusive"],
  "capabilities": {
    "tools": [
      { "name": "oasis_status", "description": "Get current session state, design tokens, and capabilities" },
      { "name": "oasis_save", "description": "Persist session to ~/.p31/cli-session.json" },
      { "name": "oasis_theme", "description": "Switch CLI theme (cyberpunk, nord, dracula, catppuccin, warm)" },
      { "name": "oasis_mode", "description": "Set CLI mode (BUILD, PLAN, REVIEW, DEBUG)" },
      { "name": "oasis_clear", "description": "Clear the log buffer" },
      { "name": "oasis_export_log", "description": "Export log to timestamped text file" },
      { "name": "oasis_sandbox_clear", "description": "Clear sandbox output" },
      { "name": "oasis_notify", "description": "Queue a test notification" },
      { "name": "oasis_add_todo", "description": "Add a todo item" },
      { "name": "oasis_toggle_todo", "description": "Toggle a todo's done state by index" },
      { "name": "oasis_execute", "description": "Execute a shell command in the sandbox directory" }
    ]
  },
  "installation": {
    "command": "node",
    "args": ["/path/to/P31-local-workspace/cli/mcp-server.js"],
    "env": {}
  },
  "usage": "Run `andromeda --agent` for JSON output, or connect the MCP server to any MCP client (Cursor, Claude Desktop, etc.)."
}
```

**`README.md`:**

```markdown
# P31 Oasis CLI MCP Server

MCP server for the P31 Oasis CLI — an interactive TUI with session management, theming, and shell execution.

## Installation

Clone the repository and navigate to `cli/`.

## Usage

Connect your MCP client (Cursor, Claude Desktop) to:

\`\`\`bash
node cli/mcp-server.js
\`\`\`

## Tools

See `server.json` for the full list of 11 tools.

## License

MIT
```

---

### 2. P31 Component Registry (`p31-component-registry`)

**Path:** `servers/src/p31-component-registry/`

**`server.json`:**

```json
{
  "name": "p31-component-registry",
  "description": "P31 design system component registry — 5 MCP tools for agents to retrieve tokens, components, and spoon-aware UI guidance.",
  "version": "1.0.0",
  "vendor": "P31 Labs",
  "homepage": "https://p31ca.org/docs/design",
  "repository": "https://github.com/p31labs/P31-local-workspace/tree/main/cli",
  "license": "MIT",
  "tags": ["design-system", "component-registry", "neuroinclusive", "spoon-aware"],
  "capabilities": {
    "tools": [
      { "name": "design_list_components", "description": "List all PHOS design system components with descriptions" },
      { "name": "design_get_component", "description": "Get full component details (props, tokens, CSS, example)" },
      { "name": "design_get_tokens", "description": "Get all design tokens (colors, typography, spacing, rounding) and invariants" },
      { "name": "design_search", "description": "Search components by keyword or token name" },
      { "name": "design_spoon_guide", "description": "Get spoon-level UI behavior guide (0–5)" }
    ]
  },
  "installation": {
    "command": "node",
    "args": ["/path/to/P31-local-workspace/cli/component-registry.js"],
    "env": {}
  },
  "usage": "Connect to any MCP client to let agents generate correct-by-construction UI that respects P31 design tokens and spoon-aware behavior."
}
```

**`README.md`:**

```markdown
# P31 Component Registry MCP Server

MCP server for the P31 design system — agents can retrieve tokens, component specs, and spoon-aware UI guidance.

## Installation

Clone the repository and navigate to `cli/`.

## Usage

Connect your MCP client to:

\`\`\`bash
node cli/component-registry.js
\`\`\`

## Tools

| Tool | Description |
|------|-------------|
| `design_list_components` | List all components |
| `design_get_component` | Get spec for a component |
| `design_get_tokens` | Get design tokens and invariants |
| `design_search` | Search by keyword |
| `design_spoon_guide` | Spoon-level behavior guide |

## License

MIT
```

---

## PR Submission Steps

1. **DNS Verification:** Ensure `_agent.p31ca.org` TXT record is live (see `DNS_TXT_RECORD.md`).
2. Fork `github.com/modelcontextprotocol/servers`
3. Create branch `add-p31-servers`
4. Add directories `servers/src/p31-oasis-cli/` and `servers/src/p31-component-registry/`
5. Add `server.json` and `README.md` to each
6. Update the root `README.md` or `servers/README.md` to list the new servers
7. Submit PR

## Additional Distribution

- **Smithery:** Run `npx @smithery/cli publish` after registry PR is merged.
- **MCP Toolbox:** Submit via their web form.
