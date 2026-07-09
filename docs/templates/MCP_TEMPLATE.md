# MCP Server: `SERVER_NAME`

**Version:** 1.0.0  
**Status:** `live` | `beta` | `deprecated`  
**Owner:** @username  
**Path:** `cli/mcp-server.js` (or `tools/...`)

---

## Overview

One‑paragraph description of what this MCP server does and who it's for.

## Tools

| Tool | Description | Input Schema | Output |
|------|-------------|--------------|--------|
| `tool_name` | Brief description | `{ type: "object", properties: {...} }` | JSON object |
| `tool_name_2` | Brief description | ... | ... |

### `tool_name` — Detailed Usage

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "param1": "value"
    }
  }
}
```

**Response:**

```json
{
  "result": {
    "content": [{ "type": "text", "text": "..." }]
  }
}
```

## Error Handling

| Error Code | Meaning |
|------------|---------|
| -32601 | Method not found |
| -32602 | Invalid parameters |

## Testing

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node cli/mcp-server.js
```

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-09 | Initial release |

---

**Last Updated:** YYYY-MM-DD
