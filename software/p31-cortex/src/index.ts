import type { CortexEnv } from "./types";
export { LegalAgentDO } from "./do/legal-agent";
export { GrantAgentDO } from "./do/grant-agent";
export { ContentAgentDO } from "./do/content-agent";
export { FinanceAgentDO } from "./do/finance-agent";
export { BenefitsAgentDO } from "./do/benefits-agent";
export { KofiAgentDO } from "./do/kofi-agent";
export { OrchestratorDO } from "./do/orchestrator";

const AGENT_BINDINGS = [
  { key: "legal", binding: "LEGAL_AGENT" as const },
  { key: "grant", binding: "GRANT_AGENT" as const },
  { key: "content", binding: "CONTENT_AGENT" as const },
  { key: "finance", binding: "FINANCE_AGENT" as const },
  { key: "benefits", binding: "BENEFITS_AGENT" as const },
  { key: "kofi", binding: "KOFI_AGENT" as const },
];

const app = {
  async fetch(request: Request, env: CortexEnv): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Status
    if (path === "/api/status" && request.method === "GET") {
      return handleStatus(env);
    }

    // List deadlines (with optional category filter)
    if (path === "/api/deadlines" && request.method === "GET") {
      return handleListDeadlines(env, url);
    }

    // Orchestrator — run all agents
    if (path === "/api/orchestrator/run" && request.method === "POST") {
      return handleRunAgent(env, "ORCHESTRATOR", "orchestrator-primary");
    }

    // Generic agent routes: /api/{agent}/init and /api/{agent}/run
    for (const agent of AGENT_BINDINGS) {
      if (path === `/api/${agent.key}/init` && request.method === "POST") {
        return handleAgentInit(
          request,
          env,
          agent.binding,
          `${agent.key}-primary`,
        );
      }
      if (path === `/api/${agent.key}/run` && request.method === "POST") {
        return handleRunAgent(env, agent.binding, `${agent.key}-primary`);
      }
    }

    // Ko-fi webhook — receives donations, routes to kofi agent
    if (path === "/webhook/kofi" && request.method === "POST") {
      return handleKofiWebhook(request, env);
    }

    // Root — API index
    return new Response(
      JSON.stringify({
        name: "P31 Cortex",
        version: "0.1.0",
        endpoints: [
          "GET  /api/status",
          "GET  /api/deadlines?category=&status=",
          "POST /api/orchestrator/run",
          "POST /api/legal/init",
          "POST /api/legal/run",
          "POST /api/grant/init",
          "POST /api/grant/run",
          "POST /api/content/init",
          "POST /api/content/run",
          "POST /api/finance/init",
          "POST /api/finance/run",
          "POST /api/benefits/init",
          "POST /api/benefits/run",
          "POST /api/kofi/init",
          "POST /api/kofi/run",
          "GET  /health",
        ],
        message: "It's okay to be a little wonky. 🔺",
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, CF-Access-Jwt-Assertion'
        },
      },
    );

    // Health check endpoint
    if (path === "/health" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          worker: "p31-cortex",
          version: "0.1.0",
          agents: AGENT_BINDINGS.map(a => a.key),
          timestamp: new Date().toISOString()
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
  },

  async scheduled(_event: ScheduledEvent, env: CortexEnv): Promise<void> {
    console.log("[Cortex] Cron fired — running orchestrator");

    const orchId = env.ORCHESTRATOR.idFromName("orchestrator-primary");
    const orchStub = env.ORCHESTRATOR.get(orchId);
    const resp = await orchStub.fetch("http://internal/run", {
      method: "POST",
    });
    const result = await resp.json();
    console.log("[Cortex] Orchestrator run:", JSON.stringify(result));
  },
};

async function handleStatus(env: CortexEnv): Promise<Response> {
  const deadlines = await env.DB.prepare(
    "SELECT COUNT(*) as total FROM deadlines WHERE status = 'pending'",
  ).first<{ total: number }>();

  const overdue = await env.DB.prepare(
    "SELECT COUNT(*) as total FROM deadlines WHERE status = 'overdue'",
  ).first<{ total: number }>();

  const alerts = await env.DB.prepare(
    "SELECT COUNT(*) as total FROM alerts WHERE status = 'scheduled'",
  ).first<{ total: number }>();

  return new Response(
    JSON.stringify({
      status: "operational",
      pendingDeadlines: deadlines?.total ?? 0,
      overdueDeadlines: overdue?.total ?? 0,
      scheduledAlerts: alerts?.total ?? 0,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function handleAgentInit(
  request: Request,
  env: CortexEnv,
  bindingKey: keyof CortexEnv,
  agentName: string,
): Promise<Response> {
  const binding = env[bindingKey] as DurableObjectNamespace;
  const id = binding.idFromName(agentName);
  const stub = binding.get(id);
  const resp = await stub.fetch("http://internal/init", {
    method: "POST",
    body: await request.text(),
    headers: { "Content-Type": "application/json" },
  });
  return new Response(await resp.text(), {
    status: resp.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, CF-Access-Jwt-Assertion'
    }
  });
}

async function handleRunAgent(
  env: CortexEnv,
  bindingKey: keyof CortexEnv,
  agentName: string,
): Promise<Response> {
  const binding = env[bindingKey] as DurableObjectNamespace;
  const id = binding.idFromName(agentName);
  const stub = binding.get(id);
  const resp = await stub.fetch("http://internal/run", { method: "POST" });
  return new Response(await resp.text(), {
    status: resp.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, CF-Access-Jwt-Assertion'
    }
  });
}

async function handleListDeadlines(
  env: CortexEnv,
  url: URL,
): Promise<Response> {
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");

  let query = `SELECT id, title, due_date, category, priority, status, metadata FROM deadlines WHERE 1=1`;
  const params: string[] = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY due_date ASC LIMIT 50`;

  const stmt = env.DB.prepare(query);
  const results =
    params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  return new Response(
    JSON.stringify({
      deadlines: results.results ?? [],
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}

export default app;
