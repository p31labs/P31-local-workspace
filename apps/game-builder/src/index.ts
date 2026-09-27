import type { GameDefinition, GeneratedGame } from '@p31/game-generator/schema';
import { buildDefinition, generateGame } from '@p31/game-generator/generator';
import { gatedGameConfig, GameEngine, generateLuau, generateP31Skin } from '@p31ca/game-engine';
import type { GameBuilderInput } from '@p31/game-generator/schema';

const PLINTH_MCP_URL = 'http://127.0.0.1:9876/mcp';
const RENDER_SERVICE = 'https://render.p31ca.org';
const CORS_ORIGINS = ['https://phos.p31ca.org', 'https://p31ca.org', 'https://phosphorus31.org'];

interface Env {
  ROBLOX_BRIDGE: {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  };
}

interface GameSession {
  id: string;
  definition: GameDefinition;
  engine: GameEngine;
  spoons: number;
  createdAt: string;
}

const sessions = new Map<string, GameSession>();

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && CORS_ORIGINS.includes(origin) ? origin : 'https://phos.p31ca.org';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function errorBody(message: string, status: number): Response {
  const body = { error: message };
  if (status === 400) return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  if (status === 404) return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  if (status === 502) return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const path = url.pathname.replace(/\/$/, '');

    try {
      if (path === '/api/game/define' && request.method === 'POST') {
        return handleDefine(request, headers);
      }

      if (path === '/api/game/generate' && request.method === 'POST') {
        return handleGenerate(request, headers);
      }

      if (path === '/api/game/session' && request.method === 'POST') {
        return handleCreateSession(request, headers);
      }

      if (path.startsWith('/api/game/session/') && request.method === 'GET') {
        const sessionId = path.split('/').pop()!;
        return handleGetSession(sessionId, headers);
      }

      if (path.startsWith('/api/game/session/') && path.endsWith('/action') && request.method === 'POST') {
        const parts = path.split('/');
        const sessionId = parts[parts.length - 2];
        return handleGameAction(sessionId, request, headers, env);
      }

      if (path === '/api/plinth/proxy' && request.method === 'POST') {
        return handlePlinthProxy(request, headers);
      }

      if (path === '/api/plinth/status' && request.method === 'GET') {
        return handlePlinthStatus(headers);
      }

      if (path.startsWith('/play/')) {
        return handleGameSurface(url, headers);
      }

      return json({ endpoints: [
        'POST /api/game/define',
        'POST /api/game/generate',
        'POST /api/game/session',
        'GET /api/game/session/:id',
        'POST /api/game/session/:id/action',
        'POST /api/plinth/proxy',
        'GET /api/plinth/status',
        'GET /play/:gameId',
      ]}, 200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      return new Response(JSON.stringify({ error: message, status: 500 }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  },
};

async function handleDefine(request: Request, headers: Record<string, string>): Promise<Response> {
  const input: GameBuilderInput = await request.json();

  if (!input.game?.name || !input.game?.type) {
    return errorBody('game.name and game.type required', 400);
  }

  const definition = buildDefinition(input);
  return new Response(JSON.stringify({ definition }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

async function handleGenerate(request: Request, headers: Record<string, string>): Promise<Response> {
  const body: { definition?: GameDefinition; input?: GameBuilderInput } = await request.json();

  let definition: GameDefinition;
  if (body.definition) {
    definition = body.definition;
  } else if (body.input) {
    definition = buildDefinition(body.input);
  } else {
    return errorBody('Provide either `definition` or `input`', 400);
  }

  const generated: GeneratedGame = generateGame(definition);
  return new Response(JSON.stringify({ generated }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

async function handleCreateSession(request: Request, headers: Record<string, string>): Promise<Response> {
  const body: { definition?: GameDefinition; input?: GameBuilderInput; spoons?: number } = await request.json();

  let definition: GameDefinition;
  if (body.definition) {
    definition = body.definition;
  } else if (body.input) {
    definition = buildDefinition(body.input);
  } else {
    return errorBody('Provide `definition` or `input`', 400);
  }

  const spoons = body.spoons ?? 3;
  const nodeId = `game-${crypto.randomUUID()}`;
  const engine = new GameEngine(nodeId, { domeName: definition.game.name });

  const session: GameSession = {
    id: crypto.randomUUID(),
    definition,
    engine,
    spoons,
    createdAt: new Date().toISOString(),
  };

  sessions.set(session.id, session);

  return new Response(JSON.stringify({
    sessionId: session.id,
    player: engine.player,
    structures: engine.structures,
    gatedConfig: gatedGameConfig(spoons, engine.player.tier),
  }), {
    status: 201,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

async function handleGetSession(sessionId: string, headers: Record<string, string>): Promise<Response> {
  const session = sessions.get(sessionId);
  if (!session) return errorBody('Session not found', 404);

  return new Response(JSON.stringify({
    id: session.id,
    spoons: session.spoons,
    definition: {
      game: session.definition.game,
      ui: session.definition.ui,
    },
    engine: {
      player: session.engine.player,
      structures: session.engine.structures,
      activeChallenge: session.engine.activeChallenge,
    },
    gatedConfig: gatedGameConfig(session.spoons, session.engine.player.tier),
  }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

async function handleGameAction(sessionId: string, request: Request, headers: Record<string, string>, env: Env): Promise<Response> {
  const session = sessions.get(sessionId);
  if (!session) return errorBody('Session not found', 404);

  const body: { action: string; payload?: Record<string, unknown> } = await request.json();

  switch (body.action) {
    case 'place': {
      const { structureId, type, position, rotation, scale, color } = body.payload as any;
      if (!structureId || !type || !position) {
        return errorBody('place requires structureId, type, position', 400);
      }
      const result = session.engine.place(structureId, type, position, rotation, scale, color);
      return json({ piece: result, rigidity: result ? session.engine.structures.find(s => s.id === structureId)?.rigidity : null });
    }

    case 'undo': {
      const { structureId } = body.payload as any;
      if (!structureId) return errorBody('undo requires structureId', 400);
      const removed = session.engine.undo(structureId);
      return json({ removed });
    }

    case 'new-structure': {
      const { name, color } = body.payload as any;
      const structure = session.engine.newStructure(name || 'Untitled', color);
      return json({ structure });
    }

    case 'start-challenge': {
      const { challengeId } = body.payload as any;
      const started = session.engine.startChallenge(challengeId || '');
      return json({ started });
    }

    case 'set-spoons': {
      const { spoons } = body.payload as any;
      if (typeof spoons !== 'number' || spoons < 0 || spoons > 5) {
        return errorBody('spoons must be 0-5', 400);
      }
      session.spoons = spoons;
      return json({ spoons, config: gatedGameConfig(spoons, session.engine.player.tier) });
    }

    case 'export':
      return json({ snapshot: session.engine.export() });

    case 'deploy-to-roblox': {
      const worldName = (body.payload?.worldName as string) || session.definition?.game?.name || 'P31 Game';
      const snapshot = session.engine.export();
      const skin = generateP31Skin();
      const { luau } = generateLuau(snapshot);
      const fullCode = skin + '\n\n' + luau;

      const bridgeRes = await env.ROBLOX_BRIDGE.fetch('https://roblox-bridge.trimtab-signal.workers.dev/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode, worldName }),
      });

      const bridgeData = await bridgeRes.json();

      return json({
        ok: true,
        bridge: bridgeData,
        partCount: snapshot.structures.reduce((acc, s) => acc + s.pieces.length, 0),
      });
    }

    default:
      return errorBody(`Unknown action: ${body.action}`, 400);
  }
}

async function handlePlinthProxy(request: Request, headers: Record<string, string>): Promise<Response> {
  const body: { method: string; params?: Record<string, unknown> } = await request.json();

  if (!body.method) {
    return errorBody('MCP method required', 400);
  }

  let response: Response;
  try {
    response = await fetch(PLINTH_MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method: body.method,
        params: body.params || {},
      }),
    });
  } catch {
    return errorBody('Plinth MCP server unreachable', 502);
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

async function handlePlinthStatus(headers: Record<string, string>): Promise<Response> {
  let reachable = false;
  try {
    const res = await fetch(`${PLINTH_MCP_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
      signal: AbortSignal.timeout(3000),
    });
    reachable = res.ok;
  } catch {
    reachable = false;
  }

  return new Response(JSON.stringify({
    plinth: reachable ? 'connected' : 'unreachable',
    activeSessions: sessions.size,
    sessions: Array.from(sessions.keys()),
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

async function handleGameSurface(url: URL, _headers: Record<string, string>): Promise<Response> {
  const gameId = url.pathname.replace('/play/', '');
  const spoons = parseInt(url.searchParams.get('spoons') || '3', 10);

  const html = `<!DOCTYPE html>
<html lang="en" data-spoons="${spoons}" data-mcp-game-id="${gameId}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Game Builder — ${gameId}</title>
  <link rel="stylesheet" href="${RENDER_SERVICE}/tokens.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: var(--p31-bg, oklch(10% 0.01 240));
      color: var(--p31-text, oklch(96% 0.005 240));
      font-family: var(--p31-font-sans, system-ui, sans-serif);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--p31-spacing-md, 16px) var(--p31-spacing-lg, 24px);
      background: var(--p31-glass-bg, oklch(100% 0.01 240 / 0.04));
      border-bottom: 1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.08));
      backdrop-filter: blur(var(--p31-blur-standard, 12px));
    }
    .game-header h1 {
      font-size: var(--p31-scale-lg, 28px);
      color: var(--p31-accent, oklch(65% 0.18 195));
    }
    .game-stats {
      display: flex;
      gap: var(--p31-spacing-md, 16px);
      font-family: var(--p31-font-mono, ui-monospace, monospace);
      font-size: var(--p31-scale-sm, 16px);
    }
    .game-stats span {
      padding: var(--p31-spacing-xs, 12px) var(--p31-spacing-sm, 16px);
      background: var(--p31-glass-bg, oklch(100% 0.01 240 / 0.04));
      border: 1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.08));
      border-radius: var(--p31-radius-md, 10px);
    }
    .game-canvas-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      min-height: 400px;
    }
    .game-canvas-container canvas, .game-canvas-container .plinth-frame {
      width: 100%;
      height: 100%;
      border: none;
    }
    .game-controls {
      display: flex;
      gap: var(--p31-spacing-sm, 16px);
      padding: var(--p31-spacing-md, 16px) var(--p31-spacing-lg, 24px);
      background: var(--p31-glass-bg, oklch(100% 0.01 240 / 0.04));
      border-top: 1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.08));
      backdrop-filter: blur(var(--p31-blur-standard, 12px));
      flex-wrap: wrap;
    }
    .game-btn {
      padding: 12px 24px;
      border: 1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.08));
      border-radius: var(--p31-radius-md, 10px);
      background: var(--p31-glass-bg, oklch(100% 0.01 240 / 0.04));
      color: var(--p31-text, oklch(96% 0.005 240));
      font-family: var(--p31-font-sans, system-ui, sans-serif);
      font-size: var(--p31-scale-sm, 16px);
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      min-height: 48px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .game-btn:hover {
      background: var(--p31-glass-border-hover, oklch(100% 0.01 240 / 0.15));
      border-color: var(--p31-accent, oklch(65% 0.18 195));
    }
    .game-btn-primary {
      background: var(--p31-accent, oklch(65% 0.18 195));
      color: var(--p31-bg, oklch(10% 0.01 240));
      border-color: var(--p31-accent, oklch(65% 0.18 195));
    }
    .spoon-meter {
      display: flex;
      gap: 4px;
      align-items: center;
      margin-left: auto;
    }
    .spoon-dot {
      width: 12px;
      height: 20px;
      border-radius: var(--p31-radius-sm, 6px);
      transition: background 0.3s, opacity 0.3s;
    }
    .spoon-dot.active { opacity: 1; }
    .spoon-dot.inactive { opacity: 0.2; }
    @media (prefers-reduced-motion: reduce) {
      .game-btn { transition: none; }
      .spoon-dot { transition: none; }
    }
    [data-spoons="0"] .game-btn,
    [data-spoons="1"] .game-btn { transition: none; }
    [data-spoons="0"] .game-header h1,
    [data-spoons="1"] .game-header h1 { color: var(--p31-text, oklch(96% 0.005 240)); }
    .glass-panel {
      background: var(--p31-glass-bg, oklch(100% 0.01 240 / 0.04));
      border: 1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.08));
      border-radius: var(--p31-radius-xl, 24px);
      backdrop-filter: blur(var(--p31-blur-standard, 12px));
    }
  </style>
</head>
<body>
  <header class="game-header">
    <h1 data-mcp-game-id="${gameId}">${gameId}</h1>
    <div class="game-stats">
      <span data-mcp-score="0">Score: <strong>0</strong></span>
      <span data-mcp-love="0">♥ <strong>0</strong></span>
    </div>
  </header>

  <main class="game-canvas-container" data-mcp-game-state="playing">
    <div id="plinth-container" class="plinth-frame" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
      <div class="glass-panel" style="padding: 48px; text-align: center;">
        <p style="margin-bottom: 12px; color: var(--p31-text-secondary, oklch(75% 0.01 240));">
          Plinth 3D canvas — connect via MCP
        </p>
        <p style="font-family: var(--p31-font-mono, monospace); font-size: var(--p31-scale-xs, 12px); color: var(--p31-text-tertiary, oklch(55% 0.01 240));">
          POST /api/plinth/proxy to inject entities
        </p>
      </div>
    </div>
  </main>

  <footer class="game-controls" data-mcp-spoons="${spoons}">
    <button class="game-btn game-btn-primary" data-mcp-action="start" onclick="parent.postMessage({type:'game:action',action:'start'},'*')">
      ▶ Start
    </button>
    <button class="game-btn" data-mcp-action="pause" onclick="parent.postMessage({type:'game:action',action:'pause'},'*')">
      ⏸ Pause
    </button>
    <button class="game-btn" data-mcp-action="reset" onclick="parent.postMessage({type:'game:action',action:'reset'},'*')">
      ↺ Reset
    </button>
    <div class="spoon-meter" role="group" aria-label="Spoon level">
      ${[0,1,2,3,4,5].map(s => `
      <button class="spoon-dot ${s <= spoons ? 'active' : 'inactive'}"
              style="background: ${s <= 1 ? 'var(--p31-accent-red, oklch(65% 0.18 20))' : 'var(--p31-accent, oklch(65% 0.18 195))'}"
              onclick="parent.postMessage({type:'game:spoons',spoons:${s}},'*')"
              aria-label="Spoon level ${s}"
              data-mcp-action="set-spoons">
      </button>`).join('')}
    </div>
  </footer>

  <script>
    (function() {
      const spoons = ${spoons};
      document.documentElement.setAttribute('data-spoons', spoons);

      const container = document.getElementById('plinth-container');

      window.addEventListener('message', (e) => {
        if (e.data?.type === 'plinth:score') {
          const el = document.querySelector('[data-mcp-score] strong');
          if (el) el.textContent = e.data.score;
        }
        if (e.data?.type === 'plinth:love') {
          const el = document.querySelector('[data-mcp-love] strong');
          if (el) el.textContent = e.data.love;
        }
        if (e.data?.type === 'plinth:state') {
          document.querySelector('[data-mcp-game-state]')
            ?.setAttribute('data-mcp-game-state', e.data.state);
        }
      });

      if (var _ctx=(typeof document!=='undefined'&&document.modelContext)?document.modelContext:(typeof navigator!=='undefined'&&navigator.modelContext)?navigator.modelContext:null;_ctx&&'registerTool' in _ctx) {
        _ctx.registerTool({
          name: 'setSpoonLevel',
          description: 'Set the game spoon level (0-5)',
          inputSchema: {
            type: 'object',
            properties: {
              level: { type: 'number', description: 'Spoon level 0-5' }
            },
            required: ['level']
          },
          handler: async (args) => {
            const spoons = Math.max(0, Math.min(5, args.level));
            document.documentElement.setAttribute('data-spoons', spoons);
            document.querySelector('[data-mcp-spoons]')
              ?.setAttribute('data-mcp-spoons', String(spoons));
            document.querySelectorAll('.spoon-dot').forEach((dot, i) => {
              dot.className = 'spoon-dot ' + (i < spoons ? 'active' : 'inactive');
            });
            return { spoons };
          }
        });

        _ctx.registerTool({
          name: 'getGameState',
          description: 'Get the current game state',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
          handler: async () => {
            const state = document.querySelector('[data-mcp-game-state]')?.getAttribute('data-mcp-game-state') || 'unknown';
            const score = document.querySelector('[data-mcp-score] strong')?.textContent || '0';
            const love = document.querySelector('[data-mcp-love] strong')?.textContent || '0';
            return { state, score, love, spoons };
          }
        });

        _ctx.registerTool({
          name: 'injectGameAction',
          description: 'Trigger a game action button',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['start', 'pause', 'reset', 'set-spoons'],
                description: 'Action to trigger'
              }
            },
            required: ['action']
          },
          handler: async (args) => {
            const btn = document.querySelector(\`[data-mcp-action="\${args.action}"]\`);
            if (btn) { btn.click(); return { triggered: args.action }; }
            return { error: \`No button found for action: \${args.action}\` };
          }
        });
      }
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
