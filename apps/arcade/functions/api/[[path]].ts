import { Hono } from 'hono';
import { generateGame, buildDefinition } from '@p31/game-generator';
import type { GameBuilderInput } from '@p31/game-generator/schema';

type Env = {
  DB: D1Database;
  K4_CAGE: Fetcher;
  GENERATED_GAMES: KVNamespace;
  LOVE_LEDGER_URL?: string;
  TALER_BRIDGE_URL?: string;
  MULTIPLAYER_ROOM_URL?: string;
  SHADOW_BRIDGE_URL?: string;
};

const LOVE_LEDGER = 'https://love-ledger.p31ca.org';
const TALER_BRIDGE = 'https://taler-bridge-billing.trimtab-signal.workers.dev';
const MULTIPLAYER_ROOM = 'https://multiplayer-room.trimtab-signal.workers.dev';
const SHADOW_BRIDGE = 'https://shadow-bridge.trimtab-signal.workers.dev';

const app = new Hono<{ Bindings: Env }>();

// ── LOVE Balance ──
app.get('/balance', async (c) => {
  const did = c.req.query('did');
  if (!did) return c.json({ error: 'Missing did' }, 400);
  try {
    const url = (c.env.LOVE_LEDGER_URL || LOVE_LEDGER) + '/balance?did=' + encodeURIComponent(did);
    const res = await fetch(url);
    const data = await res.json() as any;
    return c.json({ balance: data.balance ?? data.total ?? 0 });
  } catch {
    return c.json({ balance: 0, note: 'ledger unreachable' });
  }
});

// ── LOVE Balance ──
app.get('/active-players', async (c) => {
  const [shadowRes, roomRes] = await Promise.allSettled([
    fetch(SHADOW_BRIDGE + '/stats').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(MULTIPLAYER_ROOM + '/room/list').then(r => r.ok ? r.json() : null).catch(() => null),
  ]);

  const shadow = shadowRes.status === 'fulfilled' ? shadowRes.value as any : {};
  const rooms = roomRes.status === 'fulfilled' ? roomRes.value as any : {};

  return c.json({
    activeInRoblox: shadow?.activeSessions ?? 0,
    totalPlayers: shadow?.totalPlayers ?? 0,
    totalLove: shadow?.totalLove ?? 0,
    rooms: rooms?.rooms?.length ?? 0,
    leaderboard: shadow?.leaderboard ?? [],
  });
});

// ── Pilots ──
app.get('/pilots', async (c) => {
  try {
    const pilots = await c.env.DB.prepare(`
      SELECT p.did, p.family_name, p.status, p.onboarded_at, p.active_nodes, p.mesh_health,
             COUNT(c.id) as care_events
      FROM pilot_registry p
      LEFT JOIN love_chain c ON c.from_did = p.did AND c.type = 'transfer'
      GROUP BY p.did
      ORDER BY p.onboarded_at DESC
    `).all();
    let k4Topology: any = null;
    try {
      const k4Res = await c.env.K4_CAGE.fetch('https://k4/api/topology/summary');
      if (k4Res.ok) k4Topology = await k4Res.json();
    } catch {}
    const enriched = pilots.results.map((p: any) =>
      (k4Topology && k4Topology.totalLove > 0)
        ? { ...p, mesh_health: k4Topology.online / k4Topology.vertices || p.mesh_health, active_nodes: k4Topology.online || p.active_nodes, k4_love: k4Topology.totalLove, k4_online: k4Topology.online, k4_rigidity: k4Topology.rigidity }
        : p,
    );
    return c.json(enriched);
  } catch {
    return c.json({ error: 'Failed to query pilots' }, 500);
  }
});

// ── Health ──
app.get('/health', async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_pilots,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_pilots,
        AVG(mesh_health) as avg_health,
        SUM(active_nodes) as total_nodes
      FROM pilot_registry
    `).first();
    return c.json(stats || { total_pilots: 0, active_pilots: 0, avg_health: 0, total_nodes: 0 });
  } catch {
    return c.json({ error: 'Failed to query health' }, 500);
  }
});

// ── Games Catalog ──
app.get('/games', (c) => c.json({
  games: [
    { id: 'bashball', name: 'BASHBALL', description: 'Markov chain baseball — built for Sebastian.', skin: 'skin-tetra', deployUrl: '/play/bashball' },
    { id: 'gridiron', name: 'Gridiron', description: 'Strategic American football with spoon‑based play calling.', skin: 'skin-phos', deployUrl: '/play/gridiron' },
    { id: 'geodesic', name: 'Geodesic Builder', description: 'Snap primitives into rigid structures with Maxwell check.', skin: 'skin-willow', deployUrl: '/play/geodesic' },
    { id: 'strategy-board', name: 'Strategy Board', description: 'Turn‑based tetra tactics with minimax AI.', skin: 'skin-willow', deployUrl: '/play/strategy' },
    { id: 'card-table', name: 'Card Table', description: 'Quantum Solitaire and Rummy.', skin: 'skin-willow', deployUrl: '/play/cards' },
    { id: 'liquid-sculptor', name: 'Liquid Sculptor', description: 'Jitterbug Navier‑Stokes fluid sandbox.', skin: 'skin-phos', deployUrl: '/play/liquid' },
    { id: 'jitterbug-puzzle', name: 'Jitterbug Puzzle', description: 'Match the morphing geometry target.', skin: 'skin-tetra', deployUrl: '/play/jitterbug' },
    { id: 'bonding', name: 'BONDING', description: 'Multiplayer molecule builder with real covalent bonding.', skin: 'skin-willow', deployUrl: 'https://bonding.p31ca.org' },
  ],
}));

// ── Game Generate ──
app.post('/game/generate', async (c) => {
  let body: GameBuilderInput;
  try { body = await c.req.json(); } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.game?.name || !body.game?.type) {
    return c.json({ error: 'game.name and game.type required' }, 400);
  }

  try {
    const def = buildDefinition(body);
    const generated = generateGame(def);
    const kv = c.env.GENERATED_GAMES;

    await kv.put(`game:${def.game.id}:component`, generated.component);
    await kv.put(`game:${def.game.id}:css`, generated.css);
    await kv.put(`game:${def.game.id}:manifest`, JSON.stringify(generated.manifest));

    return c.json({
      ok: true,
      id: def.game.id,
      name: def.game.name,
      type: def.game.type,
      route: `/play/${def.game.id}`,
      manifest: generated.manifest,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Generation failed' }, 500);
  }
});

// ── Game Component Loader ──
app.get('/game/component', async (c) => {
  const url = new URL(c.req.url);
  const id = url.searchParams.get('id');
  if (!id) return c.json({ error: 'Missing id' }, 400);

  const kv = c.env.GENERATED_GAMES;
  const [component, css, manifestRaw] = await Promise.all([
    kv.get(`game:${id}:component`),
    kv.get(`game:${id}:css`),
    kv.get(`game:${id}:manifest`),
  ]);

  if (!component) return c.json({ error: 'Game not found' }, 404);

  return c.json({
    component,
    css,
    manifest: manifestRaw ? JSON.parse(manifestRaw) : null,
  });
});

app.get('/ping', (c) => c.json({ ok: true, service: 'arcade' }));

// ── LOVE Mint (authenticated) ──
app.post('/love/mint', async (c) => {
  const body = await c.req.json().catch(() => null) as { did?: string; amount?: number; reason?: string; signature?: string } | null;
  if (!body?.did || !body?.amount) {
    return c.json({ error: 'did and amount required' }, 400);
  }
  if (!body.signature) {
    return c.json({ error: 'signature required for LOVE minting' }, 401);
  }
  if (typeof body.amount !== 'number' || body.amount <= 0 || body.amount > 1000) {
    return c.json({ error: 'amount must be a positive number <= 1000' }, 400);
  }

  const ledgerUrl = c.env.LOVE_LEDGER_URL || LOVE_LEDGER;
  try {
    const verifyRes = await fetch(`${ledgerUrl}/verify-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        did: body.did,
        message: `mint|${body.did}|${body.amount}|${body.reason || ''}`,
        signature: body.signature,
      }),
    });
    const verifyData = await verifyRes.json() as any;
    if (!verifyData.valid) {
      return c.json({ error: 'invalid signature' }, 401);
    }
  } catch {
    return c.json({ error: 'signature verification unavailable' }, 503);
  }

  try {
    const res = await fetch('https://shadow-bridge.trimtab-signal.workers.dev/game/action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: body.did, sessionId: `arcade_${Date.now()}`, actionType: 'milestone_reached', value: body.amount }),
    });

    await fetch('https://revenue-ledger.trimtab-signal.workers.dev/revenue/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'arcade',
        payer_did: body.did,
        merchant_did: body.did,
        amount_usdc: '0',
        asset: 'LOVE',
        amount_love: String(body.amount),
        tx_hash: `arcade-love-${Date.now()}`,
        metadata: { reason: body.reason, game: 'arcade' },
      }),
    }).catch(() => {});

    return c.json({ ok: res.ok, amount: body.amount, reason: body.reason });
  } catch {
    return c.json({ ok: false, error: 'bridge unreachable' }, 502);
  }
});

export const onRequest = ({ request, env }: { request: Request; env: Env }) => {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/^\/api/, '') || '/';
  const modifiedUrl = new URL(request.url);
  modifiedUrl.pathname = pathname;
  const modifiedRequest = new Request(modifiedUrl, request);
  return app.fetch(modifiedRequest, env);
};
