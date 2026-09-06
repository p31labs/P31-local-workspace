export interface SwarmEnv {
  GATEWAY: Fetcher;
  AGENT_RUNTIME: DurableObjectNamespace;
}

export const K4_VERTICES = ['V1', 'V2', 'V3', 'V4'] as const;

export const K4_EDGES: [string, string][] = [
  ['V1', 'V2'],
  ['V1', 'V3'],
  ['V1', 'V4'],
  ['V2', 'V3'],
  ['V2', 'V4'],
  ['V3', 'V4'],
];

export function getK4VertexFromPath(path: string): string {
  if (path.startsWith('/api/agent')) return 'V2';
  if (path.startsWith('/api/tool')) return 'V3';
  if (path.startsWith('/api/dispatch')) return 'V4';
  return 'V1';
}

export class K4Router {
  private vertices: Map<string, { id: string; name: string; role: string; route: (req: Request) => Promise<Response> }> = new Map();

  constructor(env: SwarmEnv) {
    this.vertices.set('V1', {
      id: 'V1',
      name: 'Gateway',
      role: 'routing',
      route: (req) => env.GATEWAY.fetch(req),
    });
    this.vertices.set('V2', {
      id: 'V2',
      name: 'AgentRuntime',
      role: 'execution',
      route: (req) => env.AGENT_RUNTIME.get(env.AGENT_RUNTIME.idFromName('default')).fetch(req),
    });
    this.vertices.set('V3', {
      id: 'V3',
      name: 'MCPServer',
      role: 'tooling',
      route: (req) => env.GATEWAY.fetch(req),
    });
    this.vertices.set('V4', {
      id: 'V4',
      name: 'DispatchRouter',
      role: 'orchestration',
      route: (req) => env.GATEWAY.fetch(req),
    });
  }

  async route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const vertex = getK4VertexFromPath(path);
    return this.routeToVertex(vertex, request);
  }

  private async routeToVertex(vertexId: string, request: Request): Promise<Response> {
    const vertex = this.vertices.get(vertexId);
    if (!vertex) {
      return new Response(JSON.stringify({ error: 'Vertex not found' }), { status: 404 });
    }
    const headers = new Headers(request.headers);
    headers.set('X-K4-Route', `V1→${vertexId}`);
    headers.set('X-K4-Edge-Count', String(K4_EDGES.length));
    const req = new Request(request.url, { method: request.method, headers, body: request.body, redirect: 'manual' });
    return vertex.route(req);
  }
}
