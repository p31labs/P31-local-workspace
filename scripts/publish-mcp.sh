#!/bin/bash
# Publish P31 MCP servers to public registries
# Usage: bash publish-mcp.sh [registry]
# Registries: smithery, official, mcpfind, all

REGISTRY="${1:-all}"

echo "=== P31 MCP Server Publishing ==="
echo "Servers: p31-design-mcp, p31-crypto-mcp"
echo ""

# Prerequisites
if ! command -v npx &> /dev/null; then
  echo "ERROR: npx not found. Install Node.js first."
  exit 1
fi

# Verify servers are deployed
echo "--- Pre-flight checks ---"
echo "Checking p31-design-mcp..."
curl -s -o /dev/null -w "%{http_code}" https://p31-design-mcp.trimtab-signal.workers.dev/mcp | xargs -I {} echo "p31-design-mcp: HTTP {}"

echo "Checking p31-crypto-mcp..."
curl -s -o /dev/null -w "%{http_code}" https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp | xargs -I {} echo "p31-crypto-mcp: HTTP {}"

echo ""
echo "--- Publishing instructions ---"
echo ""

if [ "$REGISTRY" = "smithery" ] || [ "$REGISTRY" = "all" ]; then
  echo "1. Smithery (smithery.ai)"
  echo "   smithery publish --url \"https://p31-design-mcp.trimtab-signal.workers.dev/mcp\" -n p31labs/design-mcp"
  echo "   smithery publish --url \"https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp\" -n p31labs/crypto-mcp"
  echo ""
fi

if [ "$REGISTRY" = "official" ] || [ "$REGISTRY" = "all" ]; then
  echo "2. Official MCP Registry (registry.modelcontextprotocol.io)"
  echo "   Submit PR to: https://github.com/modelcontextprotocol/registry"
  echo "   Include server.json from each worker directory"
  echo ""
fi

if [ "$REGISTRY" = "mcpfind" ] || [ "$REGISTRY" = "all" ]; then
  echo "3. MCPFind (mcpfind.org)"
  echo "   Submit via: https://mcpfind.org/submit"
  echo "   Or create issue at: https://github.com/edgecast/mcpfind"
  echo ""
fi

echo "--- .well-known/mcp/server-card.json ---"
echo "Already deployed at: https://p31-shell.trimtab-signal.workers.dev/.well-known/mcp/server-card.json"
echo ""
echo "Done."
