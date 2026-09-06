# P31 Starter Template

**One command to start building on the P31 Vibe Coding Platform.**

```bash
npx @p31/vibe-sdk generate "Build a star-catching game" --sparkly
npx @p31/mcp-vibe vibe-deploy --name "Star Catcher" --html "<h1>⭐</h1>"
```

## Quick Start

### 1. Install the CLI
```bash
curl -fsSL https://cli.p31ca.org/install | bash
```

### 2. Generate Your First App
```bash
p31 vibe generate "Build a mood tracker for my kids" --warm --age=child
```

### 3. Deploy to the Mesh
```bash
p31 vibe deploy --name "Mood Tracker" --html "<main>...</main>"
```

### 4. Open in Browser
```bash
open https://phos.p31ca.org/cage  # Start the Calcium Cage tutorial
open https://phos.p31ca.org/vibe  # Open the Vibe Studio
```

## What's Included

| Tool | Description |
|------|-------------|
| `@p31/vibe-sdk` | Programmatic code generation and deployment |
| `@p31/mcp-vibe` | MCP server for AI agents (Claude, Cursor, Copilot) |
| `p31 vibe` CLI | Command-line interface for generation and deployment |
| PHOS Vibe Studio | Full visual IDE with multi-agent pipeline |
| Calcium Cage | 9-level progressive onboarding game |

## For Developers

### SDK Usage
```typescript
import { P31Client } from '@p31/vibe-sdk';
const p31 = new P31Client({ familyId: 'your-family-id' });
const app = await p31.generate({ prompt: 'Build a memory game', vibeTags: ['playful'], ageGroup: 'child' });
const deployed = await p31.deploy({ name: 'Memory Game', ...app });
console.log(`Live at: ${deployed.url}`);
```

### MCP Usage
Add to Claude Desktop, Cursor, or any MCP-compatible client:
```json
{
  "mcpServers": {
    "p31-vibe": {
      "command": "npx",
      "args": ["@p31/mcp-vibe"]
    }
  }
}
```

## Community

- **GitHub Discussions:** https://github.com/p31labs/P31-local-workspace/discussions
- **The 863 Hz Dispatch:** Weekly newsletter — subscribe at p31ca.org
- **PHOS:** https://phos.p31ca.org
- **Calcium Cage:** https://phos.p31ca.org/cage

## License

MIT — P31 Labs, Inc. Georgia nonprofit EIN 42-1888158.
