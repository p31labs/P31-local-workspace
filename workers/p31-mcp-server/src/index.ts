/**
 * p31-mcp-server — P31 native MCP server (CWP-2026-017, Workstream B).
 *
 * Exposes P31's 9 tools via the Model Context Protocol using the Cloudflare
 * Agents SDK (`agents/mcp` → `createMcpHandler`) + the MCP SDK `McpServer`.
 * Any MCP client (Claude, Cursor, etc.) can connect and call the ecosystem's
 * tools. This also serves as the native fallback for the Spike Land MCP
 * integration (CWP-2026-016 C), which remains feature-flagged.
 *
 * Each tool call forwards an MCP `tools/call` to `mcp-x402-gateway` (the L3.4
 * bridge front door) via a service binding — the same backend the orchestrator
 * routes non-builtin tools to. No new tool execution surface is introduced.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";
import { z } from "zod";

interface Env {
  // mcp-x402-gateway — L3.4 bridge front door for the 9 P31 tools.
  GATEWAY: Fetcher;
}

interface P31Tool {
  name: string;
  description: string;
  schema: z.ZodRawShape;
}

const P31_TOOLS: P31Tool[] = [
  {
    name: "oasis_execute",
    description: "Run an Oasis CLI command or interactive experience in the P31 workspace",
    schema: { command: z.string().describe("Oasis CLI command or expression to run") },
  },
  {
    name: "phos_adopt",
    description: "Adopt a PHOS surface into the workspace",
    schema: { surface: z.string().describe("PHOS surface id to adopt") },
  },
  {
    name: "jitterbug_run",
    description: "Run a brain-dump orchestration in Jitterbug",
    schema: { prompt: z.string().describe("Brain-dump prompt / context") },
  },
  {
    name: "phos_learn",
    description: "Train or fine-tune a PHOS model",
    schema: {
      dataset: z.string().describe("Training dataset or source"),
      model: z.string().optional().describe("Optional model id to fine-tune"),
    },
  },
  {
    name: "phos_deploy",
    description: "Deploy a PHOS surface to production",
    schema: {
      surface: z.string().describe("PHOS surface id"),
      target: z.string().optional().describe("Optional deploy target"),
    },
  },
  {
    name: "phos_watch",
    description: "Watch a PHOS surface for changes or regressions",
    schema: { surface: z.string().describe("PHOS surface id") },
  },
  {
    name: "healer_remediate",
    description: "Auto-remediate a detected fault in the system",
    schema: { fault: z.string().describe("Fault id or description to remediate") },
  },
  {
    name: "bus_emit",
    description: "Emit an event on the message bus",
    schema: {
      topic: z.string().describe("Event topic"),
      payload: z.string().optional().describe("Event payload (JSON string)"),
    },
  },
  {
    name: "phos_rollback",
    description: "Roll back a PHOS deployment to a previous version",
    schema: {
      surface: z.string().describe("PHOS surface id"),
      version: z.string().optional().describe("Optional target version"),
    },
  },
];

async function forwardTool(
  env: Env,
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const rpc = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  };
  try {
    const res = await env.GATEWAY.fetch("https://mcp-x402-gateway/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rpc),
    });
    const data = (await res.json().catch(() => null)) as any;
    const text = JSON.stringify(data?.result ?? data, null, 2);
    return { content: [{ type: "text", text }] };
  } catch (e: any) {
    return { content: [{ type: "text", text: `error: ${String(e?.message ?? e)}` }] };
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        service: "p31-mcp-server",
        tools: P31_TOOLS.map((t) => t.name),
      });
    }

    // Build a fresh server per request so each tool handler closes over its
    // own `env` (avoids shared mutable state across concurrent requests).
    const server = new McpServer({ name: "p31-mcp-server", version: "1.0.0" });
    for (const t of P31_TOOLS) {
      server.registerTool(
        t.name,
        { description: t.description, inputSchema: t.schema },
        async (args) => forwardTool(env, t.name, args as Record<string, unknown>),
      );
    }

    const handler = createMcpHandler(server, { route: "/mcp" });
    return handler(request, env, ctx);
  },
};
