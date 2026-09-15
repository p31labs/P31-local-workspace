import skillsData from './src/generated/skills.json';

const SKILLS = skillsData as Record<string, { title: string; body: string; has_evals: boolean }>;

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

const TOOLS: ToolDef[] = [
  {
    name: 'list_skills',
    description: 'List all skills available in the manifest.',
    inputSchema: {},
  },
  {
    name: 'get_skill',
    description: 'Get a specific skill by name.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    },
  },
];

function mcpResponse(id: number | string, result: any): any {
  return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } };
}

function mcpError(id: number | string, code: number, message: string): any {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function executeTool(toolName: string, args: Record<string, any>): any {
  switch (toolName) {
    case 'list_skills': {
      const skills = Object.entries(SKILLS).map(([name, skill]) => ({
        name,
        title: skill.title,
        has_evals: skill.has_evals,
      }));
      return { skills, total: skills.length, status: 'ok' };
    }
    case 'get_skill': {
      const skillName = String(args.name || '');
      const skill = SKILLS[skillName];
      if (!skill) return { error: `Skill not found: "${skillName}"`, status: 'error' };
      return { name: skillName, body: skill.body, status: 'ok' };
    }
    default:
      return { error: `Unknown tool: ${toolName}`, status: 'error' };
  }
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/' || url.pathname === '') {
    if (request.method === 'POST') {
      const body = await request.text();
      try {
        const params = JSON.parse(body);
        const id = params.id ?? null;
        const method = params.method ?? '';

        switch (method) {
          case 'tools/call': {
            const toolName = params.params?.name;
            const toolArgs = params.params?.arguments || {};
            if (!TOOLS.find(t => t.name === toolName)) {
              return Response.json(mcpError(id, -32602, `Unknown tool: ${toolName}`));
            }
            try {
              const result = executeTool(toolName, toolArgs);
              return Response.json(mcpResponse(id, result));
            } catch (e: any) {
              return Response.json(mcpResponse(id, { error: e.message, status: 'error' }), { status: 200 });
            }
          }
          case 'ping':
            return Response.json(mcpResponse(id, {}));
          default:
            if (id !== null) return Response.json(mcpError(id, -32601, `Method not found: ${method}`));
            return new Response(null, { status: 204 });
        }
      } catch (e: any) {
        return Response.json(mcpError(id, -32700, `Parse error: ${e.message}`), { status: 400 });
      }
    }

    const toolList = TOOLS.map(t => `<li><code>${t.name}</code> — ${t.description}</li>`).join('');
    return new Response(`<!DOCTYPE html><html><body><h1>P31 Design System MCP — Skills Fixture</h1><ul>${toolList}</ul></body></html>`, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
