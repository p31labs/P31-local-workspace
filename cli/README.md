# P31 Oasis CLI

Interactive terrain user interface (TUI) for the P31 ecosystem.

Package: `andromeda-cli`, binary: `andromeda`.

## Install globally (npm)

```bash
npm install -g andromeda-cli
andromeda --agent
```

This makes `andromeda` available in any environment (local shell, CI/CD, GitHub Actions) without cloning the monorepo. The MCP servers (`mcp-server.js`, `component-registry.js`) can then be invoked directly:

```bash
node /usr/lib/node_modules/andromeda-cli/mcp-server.js
```

## Quick Start (from source)

```bash
cd /path/to/P31-local-workspace/cli
npm install
node index.js
```

**Requires a TTY.** Without one, only `--version` and `--help` respond.

## Usage

Inside the TUI, type text to send commands to the SANDBOX shell (your default `$SHELL`). Use slash-commands for UI actions:

| Command | Action |
|---------|--------|
| `/exit` | Save session and exit |
| `/clear` | Clear the LOG pane |
| `/sandbox clear` | Clear the SANDBOX pane |
| `/export log` | Write LOG to `p31-oasis-log-<timestamp>.txt` |
| `/save` | Save session to `~/.p31/cli-session.json` |
| `/notify test` | Show test notifications |
| `/help` | Display help box |
| `/theme <name>` | Switch theme (cyberpunk, nord, dracula, catppuccin, warm) |
| `/mode <name>` | Set mode (build/plan/review/debug) |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab / S-Tab | Cycle focus between panes |
| Ctrl+P | Open command palette |
| Ctrl+T | Cycle themes |
| Ctrl+L | Clear LOG |
| Ctrl+S | Save session |
| Esc / Ctrl+C | Save and exit |

## Flags

| Flag | Output |
|------|--------|
| `--version`, `-v` | `andromeda-cli v1.0.0` |
| `--help`, `-h` | Usage information |
| `--agent`, `-a` | JSON output of session state + design tokens |

Flags work in both TTY and non-TTY environments. `--agent` always outputs JSON regardless of TTY.

## Edge-Aware Commands

These commands interact with the live P31 infrastructure. All support `--agent` for JSON output.

### `andromeda status`

Check health of the P31 gateway and edge services.

```bash
andromeda status                    # Human-readable table
andromeda status --agent            # Machine-readable JSON
andromeda status --service phos     # Filter a single service
```

### `andromeda surfaces`

List available PHOS surfaces from the gateway.

```bash
andromeda surfaces                  # All 23 surfaces
andromeda surfaces --agent           # JSON output
andromeda surfaces --name dashboard  # Filter by name
```

### `andromeda deploy`

Deploy an app to Cloudflare Pages or Workers. Requires `CLOUDFLARE_API_TOKEN` environment variable.

```bash
andromeda deploy --app phos                             # Build + deploy
andromeda deploy --app p31ca --env preview               # Preview environment
andromeda deploy --app gateway                           # Cloudflare Worker
andromeda deploy --app phos --dry-run --agent             # Preview as JSON
```

Supported apps: `phos`, `p31ca`, `phosphorus31`, `bonding`, `willow`, `gateway`.

## Agent Mode (`--agent`)

For programmatic use by AI agents, the CLI supports a `--agent` flag that outputs machine-readable JSON:

```bash
andromeda --agent
```

Output includes: `version`, `mode`, `theme`, `todos`, `sandboxCwd`, `design` (tokens from `DESIGN.md`), `capabilities` (slash-commands, shortcuts, themes, modes), and `status`.

Example:

```json
{
  "version": "1.0.0",
  "mode": "BUILD",
  "theme": "warm",
  "design": { "colors": { "quantum-cyan": "#00F0FF", "void": "#0A0A0F" } },
  "capabilities": { "themes": ["cyberpunk", "nord", "dracula", "catppuccin", "warm"] },
  "status": "ok"
}
```

## MCP Server

The CLI exposes its capabilities via an [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) server for agent tool invocation:

```bash
node cli/mcp-server.js
```

The server reads JSON-RPC requests from stdin and writes responses to stdout. Supported methods:

| Method | Description |
|--------|-------------|
| `initialize` | Handshake with protocol version |
| `tools/list` | List available tools (10 tools) |
| `tools/call` | Execute a tool by name |

Available tools:

| Tool | Description |
|------|-------------|
| `oasis_status` | Get session state, design tokens, capabilities |
| `oasis_save` | Persist session to disk |
| `oasis_theme` | Switch CLI theme |
| `oasis_mode` | Set CLI mode |
| `oasis_clear` | Clear log buffer |
| `oasis_export_log` | Export log to file |
| `oasis_sandbox_clear` | Clear sandbox output |
| `oasis_notify` | Queue a notification |
| `oasis_add_todo` | Add a todo item |
| `oasis_toggle_todo` | Toggle a todo's done state |
| `oasis_execute` | Execute a shell command in sandbox directory |

## Component Registry MCP Server

A separate MCP server exposes the PHOS design system as a queryable component registry:

```bash
node cli/component-registry.js
```

5 tools for design-system-aware agent workflows:

| Tool | Description |
|------|-------------|
| `design_list_components` | List all PHOS components with descriptions and token deps |
| `design_get_component` | Get full details: props, tokens, CSS, usage example |
| `design_get_tokens` | Get all design tokens and invariants |
| `design_search` | Search components by keyword or token |
| `design_spoon_guide` | Get spoon-level UI behavior guide (0–5) |

## Architecture

The CLI is built with [blessed](https://github.com/chjj/blessed) for the TUI and [node-pty](https://github.com/microsoft/node-pty) for the embedded shell. It provides four panes:

- **LOG** — session log output
- **SANDBOX** — interactive shell
- **META** — metadata display
- **TODOS** — task list

## License

MIT
