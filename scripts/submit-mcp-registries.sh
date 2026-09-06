#!/bin/bash
# MCP Registry Submission Helper
# Run from /home/p31/P31-local-workspace

set -e

echo "=== P31 MCP Registry Submissions ==="
echo ""

# Glama
echo "1. GLAMA (https://glama.ai/mcp/servers/new)"
echo "   Spaceship Earth: cat glama-submission-payload.json"
echo "   Crypto MCP:      cat workers/p31-crypto-mcp/glama-submission-payload.json"
echo "   Design MCP:      cat cli/design-mcp-server/glama-submission-payload.json"
echo ""

# Official AAIF Registry
echo "2. OFFICIAL AAIF REGISTRY (https://github.com/anthropics/official-registry)"
echo "   Create PR adding servers to registry JSON"
echo "   See MCP-SUBMISSION-GUIDE.md for format"
echo ""

# HuggingFace
echo "3. HUGGING FACE (https://huggingface.co/datasets/modelcontextprotocol/servers)"
echo "   Upload server configs to MCP dataset"
echo "   Refreshes every 12 hours"
echo ""

# Smithery
echo "4. SMITHERY (https://smithery.ai)"
echo "   p31-design-mcp: auto-detected via npm package"
echo "   p31-crypto-mcp: auto-detected via npm package"
echo "   Verify at: https://smithery.ai/server/p31-design-mcp"
echo ""

echo "Full guide: cat MCP-SUBMISSION-GUIDE.md"
