# Claude Desktop → P31 Sovereign Stack E2E Test

End-to-end test for controlling the agent-demo page at `https://agent.p31ca.org` via Claude Desktop through MCP tool invocations that produce DOM mutations.

---

## Prerequisites

- Chrome 149+ (required for WebMCP origin trial support)
- Claude Desktop with the P31 MCP server already configured
- Network access to `https://agent.p31ca.org` and `https://p31-design-mcp.trimtab-signal.workers.dev`
- Browser DevTools open (`F12`) on the agent-demo page for verification

---

## Step 1: Connect Claude Desktop

Verify the MCP server is connected and responding.

**In Claude Desktop:** Open the MCP panel (hammer icon) and confirm `p31-design-mcp` shows a green connected indicator.

**Or use curl:**

```bash
curl -s -X POST https://p31-design-mcp.trimtab-signal.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"server/discover","params":{},"_meta":{"protocolVersion":"2026-07-28"}}' | python3 -m json.tool
```

Expected: JSON response listing 23 available tools including `setSpoonLevel`, `setStatus`, `a2ui_preview`, and `page_discover`.

**Claude prompt:**

> What tools do you have available?

Verify that Claude lists the P31 MCP tools (crownDisplay, setSpoonLevel, setStatus, a2ui_preview, page_discover, etc.).

---

## Step 2: Open the Agent Demo

Navigate to `https://agent.p31ca.org` in Chrome 149+.

- Verify the Crown badge is visible at the top of the page (`data-mcp-tool="crownDisplay"`)
- Verify the SpoonDial element exists (`id="spoon-dial"`, `data-mcp-tool="spoonDial"`, `data-mcp-range="0,5"`)
- Verify the StatusBadge is visible (`data-mcp-tool="statusBadge"`)
- Verify the z-agent chat widget is rendered in the bottom-right corner
- Verify the A2UI Preview section is present

Open DevTools console and confirm:

```js
// Should return true if WebMCP bridge is active
typeof window.__p31MCPTools !== 'undefined';
typeof window.__p31MCPExec !== 'undefined';
// Should show registered tools
console.table(window.__p31MCPTools);
```

**Claude prompt:**

> What components are on this page?

Expected: Claude uses `page_discover` to enumerate components and returns a list (CrownDisplay, SpoonDial, StatusBadge, A2UI Preview, z-agent chat).

---

## Step 3: Test setSpoonLevel

**Claude prompt:**

> Set the spoon level to 4 on the page

Expected behavior:
1. Claude invokes `setSpoonLevel` with `{level: 4}`
2. The MCP server dispatches to `window.__p31MCPExec('setSpoonLevel', {level: 4})`
3. The SpoonDial element updates its visual state (needle rotates, level indicator shows 4)
4. `data-mcp-range="0,5"` constraint is respected

**Verify in DevTools:**

```js
// Read back the current spoon level
document.getElementById('spoon-dial').getAttribute('data-mcp-range');
// Check for any aria-live region updates
document.querySelector('[aria-live="polite"]')?.textContent;
```

Test edge cases:
- Set to 0 (minimum): `"Set the spoon level to 0"`
- Set to 5 (maximum): `"Set the spoon level to 5"`
- Set to 7 (out of range): verify Claude responds with a constraint error

---

## Step 4: Test setStatus

**Claude prompt:**

> Change the status badge to busy

Expected behavior:
1. Claude invokes `setStatus` with `{status: "busy"}`
2. The MCP server dispatches to `window.__p31MCPExec('setStatus', {status: "busy"})`
3. The StatusBadge element updates its text and styling
4. The Crown badge may reflect the status change

**Verify in DevTools:**

```js
document.querySelector('[data-mcp-tool="statusBadge"]').textContent;
// Should show "busy" or equivalent display text
```

Test multiple status values:
- `"Set the status to available"`
- `"Set the status to away"`
- `"Set the status to dnd"` (do not disturb)

---

## Step 5: Test A2UI Preview

**Claude prompt:**

> Show me a glass card with a spoon meter set to 3

Expected behavior:
1. Claude invokes `a2ui_preview` with the component description
2. The MCP server generates UI code and dispatches it
3. The A2UI Preview section renders a glass card containing a SpoonDial at level 3
4. The rendered component follows design tokens (no pure black, no pure white, glass styling)

**Verify in DevTools:**

```js
// Check the preview container
document.querySelector('[data-mcp-tool="a2uiPreview"]')?.innerHTML;
// Verify glass card class
document.querySelector('.glass-card') !== null;
// Verify spoon level
document.querySelector('#spoon-dial')?.getAttribute('data-mcp-range');
```

Other prompts to try:

- `"Render a crown badge with the text 'Sovereign'"`
- `"Show a status badge in a glass panel"`
- `"Create a glass card with a crown, a status badge, and a spoon dial"`

---

## Step 6: Verify WebMCP

Verify that the WebMCP origin trial is active and the browser bridge is functional.

**In Chrome DevTools console:**

```js
// Check WebMCP availability
navigator.modelContext;

// List tools registered with the browser
navigator.modelContext.tools?.then(tools => console.table(tools));

// Check origin trial token
document.querySelector('meta[http-equiv="origin-trial"]')?.content;
```

**Claude prompt:**

> What components are on this page?

The `page_discover` tool should enumerate the DOM by querying `[data-mcp-tool]` attributes. Verify all expected tools are reported:
- `crownDisplay` (Crown badge)
- `spoonDial` (SpoonDial)
- `statusBadge` (StatusBadge)
- `a2uiPreview` (A2UI Preview container)
- `zAgentChat` (z-agent widget)

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Claude says "no tools available" | MCP server not connected | Restart Claude Desktop; check `server/discover` with curl |
| `navigator.modelContext` is `undefined` | Chrome version < 149 or origin trial not enabled | Use Chrome 149+; verify `https://agent.p31ca.org` has valid origin trial meta tag |
| `window.__p31MCPTools` is empty | Browser MCP dispatcher not loaded | Hard refresh (Ctrl+F5); check console for JS errors |
| DOM does not update after tool call | CSS variable missing fallback | Check `tokens.css`; ensure every `var()` has a fallback value |
| SpoonDial shows 0 when set to 4 | Client-side validation mismatch | Verify `data-mcp-range` is `"0,5"` and setSpoonLevel respects bounds |
| A2UI Preview renders blank | SVG bounding box overflow | Wrap icon components in `overflow-hidden` container |
| Curl returns 404/timeout | Worker not deployed or network restricted | Confirm worker URL; check VPN/proxy settings |
| Claude responds "I don't have access" | Tool permissions or server config | Check `claude_desktop_config.json`; restart Claude |
| Glass card not rendering | Missing `.glass-card` CSS | Verify `@p31/design-core` CSS is imported on the page |
