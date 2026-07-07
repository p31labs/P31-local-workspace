# P31 Oasis CLI

Interactive terrain user interface (TUI) for the P31 ecosystem.

Package: `@p31/andromeda-cli`, binary: `andromeda`.

## Quick Start

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
| `--version`, `-v` | `@p31/andromeda-cli v1.0.0` |
| `--help`, `-h` | Usage information |
| `--agent`, `-a` | JSON output of session state + design tokens |

Flags work in both TTY and non-TTY environments. `--agent` always outputs JSON regardless of TTY.

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

## Architecture

The CLI is built with [blessed](https://github.com/chjj/blessed) for the TUI and [node-pty](https://github.com/microsoft/node-pty) for the embedded shell. It provides four panes:

- **LOG** — session log output
- **SANDBOX** — interactive shell
- **META** — metadata display
- **TODOS** — task list

## License

MIT
