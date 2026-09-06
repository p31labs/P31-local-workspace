import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  ROBLOX_BRIDGE_URL?: string;
  SHADOW_BRIDGE_URL?: string;
  ENVIRONMENT?: string;
  LOVE_DB?: D1Database;
};

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; default?: unknown }>;
    required?: string[];
  };
}

const TOOLS: ToolDefinition[] = [
  {
    name: 'roblox_create_instance',
    description: 'Create a new Roblox Instance (Part, Script, Model, etc.)',
    inputSchema: { type: 'object', properties: { className: { type: 'string', description: 'Roblox class name (e.g. Part, Script, Model)' }, parent: { type: 'string', description: 'Parent instance path (default: Workspace)', default: 'Workspace' }, name: { type: 'string', description: 'Instance name (optional)' } }, required: ['className'] },
  },
  {
    name: 'roblox_set_property',
    description: 'Set a property on a Roblox instance',
    inputSchema: { type: 'object', properties: { instance: { type: 'string', description: 'Full path to the instance' }, property: { type: 'string', description: 'Property name' }, value: { type: 'string', description: 'Property value (JSON for complex types)' } }, required: ['instance', 'property', 'value'] },
  },
  {
    name: 'roblox_get_property',
    description: 'Get a property value from a Roblox instance',
    inputSchema: { type: 'object', properties: { instance: { type: 'string', description: 'Full path to the instance' }, property: { type: 'string', description: 'Property name' } }, required: ['instance', 'property'] },
  },
  {
    name: 'roblox_delete_instance',
    description: 'Delete a Roblox instance',
    inputSchema: { type: 'object', properties: { instance: { type: 'string', description: 'Full path to the instance to delete' } }, required: ['instance'] },
  },
  {
    name: 'roblox_run_script',
    description: 'Execute Luau code in the Roblox environment',
    inputSchema: { type: 'object', properties: { code: { type: 'string', description: 'Luau script code to execute' }, context: { type: 'string', description: 'Optional execution context path', default: 'Workspace' } }, required: ['code'] },
  },
  {
    name: 'roblox_call_function',
    description: 'Call a global Luau function by name',
    inputSchema: { type: 'object', properties: { functionName: { type: 'string', description: 'Name of the global function to call' }, args: { type: 'string', description: 'JSON array of arguments' } }, required: ['functionName'] },
  },
  {
    name: 'roblox_create_brick',
    description: 'Create a brick with specific dimensions and color',
    inputSchema: { type: 'object', properties: { size: { type: 'string', description: 'Size as Vector3 JSON (e.g. [4,1,2])', default: '[4,1,2]' }, color: { type: 'string', description: 'BrickColor name or RGB hex', default: 'Bright blue' }, position: { type: 'string', description: 'Position as Vector3 JSON (e.g. [0,5,0])', default: '[0,5,0]' }, anchored: { type: 'string', description: 'Whether the brick is anchored', default: 'true' } } },
  },
  {
    name: 'roblox_weld_parts',
    description: 'Weld two parts together',
    inputSchema: { type: 'object', properties: { part0: { type: 'string', description: 'First part path' }, part1: { type: 'string', description: 'Second part path' } }, required: ['part0', 'part1'] },
  },
  {
    name: 'roblox_anchor_part',
    description: 'Anchor or unanchor a part',
    inputSchema: { type: 'object', properties: { instance: { type: 'string', description: 'Part path' }, anchored: { type: 'string', description: 'true or false', default: 'true' } }, required: ['instance'] },
  },
  {
    name: 'roblox_generate_terrain',
    description: 'Generate terrain in the workspace',
    inputSchema: { type: 'object', properties: { shape: { type: 'string', description: 'Terrain shape: flat, mountainous, canyon, rolling', default: 'flat' }, size: { type: 'string', description: 'Terrain region size (e.g. 512,512,128)', default: '512,512,128' } } },
  },
  {
    name: 'roblox_set_lighting',
    description: 'Set lighting properties like ambient color, brightness',
    inputSchema: { type: 'object', properties: { ambient: { type: 'string', description: 'Ambient Color3 (e.g. 0.5,0.5,0.5)', default: '0.5,0.5,0.5' }, brightness: { type: 'string', description: 'Brightness float', default: '2' }, colorShift_Top: { type: 'string', description: 'ColorShift_Top Color3', default: '0.5,0.5,0.5' }, colorShift_Bottom: { type: 'string', description: 'ColorShift_Bottom Color3', default: '0.5,0.5,0.5' } } },
  },
  {
    name: 'roblox_set_camera',
    description: 'Set camera position and focus target',
    inputSchema: { type: 'object', properties: { position: { type: 'string', description: 'Camera position Vector3 JSON (e.g. [0,10,20])', default: '[0,10,20]' }, focus: { type: 'string', description: 'Focus position Vector3 JSON', default: '[0,0,0]' } } },
  },
  {
    name: 'roblox_deploy_code',
    description: 'Deploy generated code as a Roblox Script or LocalScript',
    inputSchema: { type: 'object', properties: { code: { type: 'string', description: 'Luau source code to deploy' }, scriptType: { type: 'string', description: 'Script type: Script, LocalScript, ModuleScript', default: 'Script' }, name: { type: 'string', description: 'Script name', default: 'P31GeneratedScript' }, parent: { type: 'string', description: 'Parent instance', default: 'ServerScriptService' } }, required: ['code'] },
  },
  {
    name: 'roblox_get_place_info',
    description: 'Get information about the current Roblox place',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'roblox_publish_place',
    description: 'Publish or save the current place',
    inputSchema: { type: 'object', properties: { description: { type: 'string', description: 'Place description', default: '' } } },
  },
];

function generateLuau(tool: string, params: Record<string, unknown>): string {
  switch (tool) {
    case 'roblox_create_instance': {
      const cn = String(params.className || 'Part');
      const n = params.name ? `\n${String(params.name)} = ` : ' = ';
      return `local instance${n}Instance.new("${cn}")\ninstance.Parent = ${String(params.parent || 'Workspace')}`;
    }
    case 'roblox_set_property':
      return `${String(params.instance)}.${String(params.property)} = ${String(params.value)}`;
    case 'roblox_create_brick': {
      const size = params.size || '[4,1,2]';
      const color = params.color || 'Bright blue';
      const pos = params.position || '[0,5,0]';
      const anc = params.anchored !== 'false';
      return [
        `local part = Instance.new("Part")`,
        `part.Size = Vector3.new(unpack(${size}))`,
        `part.BrickColor = BrickColor.new("${color}")`,
        `part.Position = Vector3.new(unpack(${pos}))`,
        `part.Anchored = ${anc}`,
        `part.Parent = Workspace`,
      ].join('\n');
    }
    case 'roblox_deploy_code': {
      const st = String(params.scriptType || 'Script');
      const nm = String(params.name || 'P31GeneratedScript');
      return [
        `local script = Instance.new("${st}")`,
        `script.Name = "${nm}"`,
        `script.Source = [==[`,
        String(params.code || ''),
        `]==]`,
        `script.Parent = ${String(params.parent || 'ServerScriptService')}`,
      ].join('\n');
    }
    case 'roblox_generate_terrain': {
      const shape = String(params.shape || 'flat');
      const size = params.size || '512,512,128';
      return [
        `local terrain = workspace.Terrain`,
        `terrain:Clear()`,
        `-- Generate ${shape} terrain region ${size}`,
        shape === 'flat' ? `-- Flat terrain (no generation needed)` :
        shape === 'mountainous' ? `terrain:FillRegion(Region3.new(Vector3.new(-256,-64,-256), Vector3.new(256,64,256)), 4, Enum.TerrainMaterial.Slate)` :
        `terrain:FillRegion(Region3.new(Vector3.new(-256,-64,-256), Vector3.new(256,64,256)), 4, Enum.TerrainMaterial.Grass)`,
      ].join('\n');
    }
    case 'roblox_set_lighting': {
      const amb = params.ambient || '0.5,0.5,0.5';
      const bri = params.brightness || '2';
      return [
        `game.Lighting.Ambient = Color3.new(${amb})`,
        `game.Lighting.Brightness = ${bri}`,
        `game.Lighting.OutdoorAmbient = Color3.new(${amb})`,
      ].join('\n');
    }
    case 'roblox_set_camera': {
      const pos = params.position || '[0,10,20]';
      const focus = params.focus || '[0,0,0]';
      return [
        `local cam = workspace.CurrentCamera`,
        `cam.CFrame = CFrame.new(Vector3.new(unpack(${pos})), Vector3.new(unpack(${focus})))`,
      ].join('\n');
    }
    case 'roblox_run_script':
      return String(params.code || '');
    default:
      return `-- No generated Luau for ${tool}`;
  }
}

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-game-id', 'x-player-did'],
  maxAge: 86400,
}));

app.get('/health', (c) => c.json({
  ok: true,
  service: 'roblox-bridge',
  tools: TOOLS.length,
  bridge_configured: !!c.env.ROBLOX_BRIDGE_URL,
  env: c.env.ENVIRONMENT || 'development',
}));

app.post('/tools/list', (c) => c.json({ tools: TOOLS }));

app.post('/tools/call', async (c) => {
  const { tool, params } = await c.req.json<{ tool: string; params: Record<string, unknown> }>();
  if (!tool) return c.json({ error: 'Missing tool name' }, 400);

  const def = TOOLS.find(t => t.name === tool);
  if (!def) return c.json({ error: `Unknown tool: ${tool}` }, 404);

  const bridgeUrl = c.env.ROBLOX_BRIDGE_URL;
  if (bridgeUrl) {
    try {
      const res = await fetch(`${bridgeUrl}/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, params }),
      });
      const data = await res.json();
      return c.json(data);
    } catch (e: any) {
      return c.json({ error: `Bridge unavailable: ${e.message}`, generated_luau: generateLuauPatched(tool, params || {}) });
    }
  }

  const luau = generateLuauPatched(tool, params || {});
  return c.json({ tool, generated_luau: luau, p31_skin_injected: tool === 'roblox_deploy_code', note: 'Bridge not configured — returning generated Luau with P31 skin. Set ROBLOX_BRIDGE_URL for live execution.' });
});

app.post('/deploy', async (c) => {
  const { code, worldName, worldId } = await c.req.json<{ code: string; worldName?: string; worldId?: string }>();
  if (!code) return c.json({ error: 'Missing code' }, 400);

  const luau = generateLuauPatched('roblox_deploy_code', { code, name: worldName || 'P31GeneratedScript', scriptType: 'Script' });
  const bridgeUrl = c.env.ROBLOX_BRIDGE_URL;
  if (bridgeUrl) {
    try {
      const res = await fetch(`${bridgeUrl}/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'roblox_deploy_code', params: { code, name: worldName || 'P31GeneratedScript', scriptType: 'Script' } }),
      });
      const data = await res.json<Record<string, unknown>>();
      return c.json({ ok: true, bridge_url: bridgeUrl, world_name: worldName || 'P31GeneratedScript', ...data });
    } catch (e: any) {
      return c.json({ error: `Bridge unavailable: ${e.message}`, generated_luau: luau });
    }
  }

  return c.json({
    ok: true,
    generated_luau: luau,
    world_name: worldName || 'P31GeneratedScript',
    note: 'Bridge URL not configured — Luau code generated but not deployed. Set ROBLOX_BRIDGE_URL to enable live deployment.',
    roblox_url: `https://www.roblox.com/games/?worldName=${encodeURIComponent(worldName || 'P31GeneratedScript')}`,
  });
});

// ── Game LOVE minting (proxied to shadow-bridge) ─────────────────────

async function proxyShadow(c: Context<{ Bindings: Bindings }>, subpath: string, body?: unknown): Promise<Response> {
  const shadowUrl = c.env.SHADOW_BRIDGE_URL;
  if (!shadowUrl) {
    return c.json({ ok: false, note: `SHADOW_BRIDGE_URL not configured — ${subpath} unavailable.` }, 503);
  }
  try {
    const res = await fetch(`${shadowUrl}${subpath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e: any) {
    return c.json({ ok: false, error: `shadow-bridge unavailable: ${e.message}` }, 502);
  }
}

app.post('/game/pending-love', async (c) => {
  const { userId } = await c.req.json<{ userId?: string }>();
  if (!userId) return c.json({ error: 'userId required' }, 400);
  return proxyShadow(c, '/game/pending-love', { userId });
});

app.post('/game/queue-love', async (c) => {
  const { userId, amount, reason } = await c.req.json<{ userId?: string; amount?: number; reason?: string }>();
  if (!userId || !amount || amount <= 0) return c.json({ error: 'userId and amount (> 0) required' }, 400);
  return proxyShadow(c, '/game/queue-love', { userId, amount, reason });
});

app.post('/game/mint-love', async (c) => {
  const body = await c.req.json<{ userId?: string; amount?: number; reason?: string; sessionId?: string }>();
  if (!body.userId || !body.amount || body.amount <= 0) {
    return c.json({ error: 'userId and amount (> 0) required' }, 400);
  }
  const shadowUrl = c.env.SHADOW_BRIDGE_URL;
  if (!shadowUrl) {
    return c.json({
      ok: false,
      queued: true,
      note: 'SHADOW_BRIDGE_URL not configured — LOVE mint queued for later processing. Set SHADOW_BRIDGE_URL to enable live minting.',
      requested: { userId: body.userId, amount: body.amount, reason: body.reason || 'mint_love' },
    }, 202);
  }
  try {
    const res = await fetch(`${shadowUrl}/game/mint-love`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e: any) {
    return c.json({ ok: false, queued: true, error: `shadow-bridge unavailable: ${e.message}` }, 502);
  }
});

// ── P31 Skin ──────────────────────────────────────────────────────────
const P31_SKIN_LUAU = `
-- [[ P31 Skin — glass/glow aesthetic ]]
local P31 = {}
P31.colors = {
  glass = BrickColor.new(0.05, 0.05, 0.08),
  accent = BrickColor.new("Bright blue"),
  gold = BrickColor.new("Bright yellow"),
  violet = BrickColor.new("Medium violet"),
  green = BrickColor.new("Bright green"),
  rose = BrickColor.new("Bright red"),
}
P31.material = Enum.Material.SmoothPlastic
P31.glow = Enum.Material.Neon
P31.glowIntensity = 0.5
return P31
`;

// ── World Management (D1-backed) ───────────────────────────────────────

async function ensureWorldsTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS worlds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        creator_did TEXT DEFAULT 'anonymous',
        created_at INTEGER NOT NULL
      )`
    )
    .run();
  try {
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_worlds_created ON worlds(created_at DESC)').run();
  } catch {
    /* index already exists */
  }
}

app.post('/worlds', async (c) => {
  if (!c.env.LOVE_DB) return c.json({ error: 'LOVE_DB not bound' }, 503);
  await ensureWorldsTable(c.env.LOVE_DB);
  const { name, description, creator_did } = await c.req.json<{ name: string; description?: string; creator_did?: string }>();
  if (!name) return c.json({ error: 'Missing name' }, 400);
  const id = `world_${Date.now()}`;
  await c.env.LOVE_DB.prepare(
    'INSERT INTO worlds (id, name, description, creator_did, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, name, description || '', creator_did || 'anonymous', Date.now()).run();
  return c.json({ id, name, description });
});

app.get('/worlds', async (c) => {
  if (!c.env.LOVE_DB) return c.json({ error: 'LOVE_DB not bound' }, 503);
  await ensureWorldsTable(c.env.LOVE_DB);
  const { results } = await c.env.LOVE_DB.prepare(
    'SELECT id, name, description, creator_did, created_at FROM worlds ORDER BY created_at DESC'
  ).all();
  return c.json(results);
});

app.get('/worlds/:id', async (c) => {
  if (!c.env.LOVE_DB) return c.json({ error: 'LOVE_DB not bound' }, 503);
  await ensureWorldsTable(c.env.LOVE_DB);
  const id = c.req.param('id');
  const row = await c.env.LOVE_DB.prepare('SELECT * FROM worlds WHERE id = ?').bind(id).first();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

// ── Skin-enhanced deploy ───────────────────────────────────────────────

// Patch the generateLuau to prepend skin code for roblox_deploy_code
const origGenerateLuau = generateLuau;
const patchedGenerateLuau = (tool: string, params: Record<string, unknown>): string => {
  if (tool === 'roblox_deploy_code') {
    return P31_SKIN_LUAU + '\n\n' + origGenerateLuau(tool, params);
  }
  return origGenerateLuau(tool, params);
};
// Override generateLuau with patched version
const generateLuauPatched = patchedGenerateLuau;

export default app;
