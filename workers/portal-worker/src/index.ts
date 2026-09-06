export interface Env {
  LOVE_LEDGER_URL: string;
  FEDERATION_URL: string;
  GENERATED_GAMES: KVNamespace;
  game_definitions: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/game/generate' && request.method === 'POST') {
      return handleGenerate(request, env);
    }

    if (path.startsWith('/play/')) {
      return handlePlay(path, env);
    }

    const did = request.headers.get('X-DID') || url.searchParams.get('did') || 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

    let loveBalance = 42;
    let trustTier = 'basic';
    let authenticated = false;

    try {
      const loveRes = await fetch(`${env.LOVE_LEDGER_URL}/api/love/balance/${did}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      if (loveRes.ok) {
        const data = await loveRes.json();
        loveBalance = data.balance ?? 42;
      }
    } catch {
      loveBalance = 42;
    }

    try {
      const profileRes = await fetch(`${env.FEDERATION_URL}/api/profile/${did}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        trustTier = profile.trustTier ?? 'basic';
        authenticated = profile.authenticated ?? false;
      }
    } catch {
      trustTier = 'basic';
    }

    const html = await fetch(request.url).then(r => r.text()).catch(() => '');

    const initialState = JSON.stringify({
      did,
      love: { balance: loveBalance, earned: 0, spent: 0 },
      trustTier,
      authenticated,
      spoons: 2
    });

    const injected = html.replace(
      '<script',
      `<script id="initial-state">window.__INITIAL_STATE__=${initialState};</script><script`
    );

    return new Response(injected, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=300',
        'X-DID': did,
        'X-Trust-Tier': trustTier
      }
    });
  }
};

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { name, type, spoonsMin, spoonsMax, loveCompletion, loveMilestone } = body;

  if (!name || !type) {
    return new Response(JSON.stringify({ error: 'name and type required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const id = `${type}-${Date.now()}`;
  const gameDef = {
    id,
    name,
    type,
    spoonsMin: spoonsMin ?? 2,
    spoonsMax: spoonsMax ?? 5,
    loveCompletion: loveCompletion ?? 100,
    loveMilestone: loveMilestone ?? 20,
    generatedAt: new Date().toISOString()
  };

  await env.GENERATED_GAMES.put(`game:${id}`, JSON.stringify(gameDef));

  await env.game_definitions.prepare(
    'INSERT INTO game_definitions (id, name, type, spoons_min, spoons_max, love_completion, love_milestone, generated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, name, type, gameDef.spoonsMin, gameDef.spoonsMax, gameDef.loveCompletion, gameDef.loveMilestone, gameDef.generatedAt).first();

  return new Response(JSON.stringify({ id, name, type, route: `/play/${id}` }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handlePlay(path: string, env: Env): Promise<Response> {
  const id = path.replace('/play/', '');

  const cached = await env.GENERATED_GAMES.get(`game:${id}`);
  if (cached) {
    const game = JSON.parse(cached);
    return new Response(renderGamePage(game), {
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'max-age=600' }
    });
  }

  const row = await env.game_definitions.prepare(
    'SELECT * FROM game_definitions WHERE id = ?'
  ).bind(id).first();

  if (!row) {
    return new Response('Game not found', { status: 404 });
  }

  const game = {
    id: row.id,
    name: row.name,
    type: row.type,
    spoonsMin: row.spoons_min,
    spoonsMax: row.spoons_max,
    loveCompletion: row.love_completion,
    loveMilestone: row.love_milestone
  };

  await env.GENERATED_GAMES.put(`game:${id}`, JSON.stringify(game), { expirationTtl: 3600 });

  return new Response(renderGamePage(game), {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'max-age=600' }
  });
}

function renderGamePage(game: any): string {
  return `<!DOCTYPE html>
<html lang="en" data-spoons="2">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${game.name} — P31 Arcade</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <style>
    body { margin: 0; padding: 0; background: #0A0A0F; color: #f0f0f4; font-family: monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .game-container { text-align: center; padding: 24px; }
    h1 { color: #00F0FF; font-size: 24px; margin-bottom: 16px; }
    .stats { display: flex; gap: 24px; justify-content: center; margin: 16px 0; }
    .stat { font-size: 14px; }
    .stat span { color: #FBBF24; font-weight: bold; font-size: 18px; }
    canvas { border-radius: 12px; border: 1px solid rgba(0,240,255,0.2); }
    .controls { margin-top: 16px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .controls button { padding: 8px 16px; background: #00F0FF; color: #0A0A0F; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: monospace; min-height: 48px; min-width: 48px; }
    .controls button:active { opacity: 0.8; transform: scale(0.95); }
    .back { margin-top: 16px; padding: 8px 16px; background: rgba(255,255,255,0.1); color: #f0f0f4; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; cursor: pointer; font-family: monospace; font-size: 12px; min-height: 48px; }
  </style>
</head>
<body>
  <div class="game-container">
    <h1>${game.name}</h1>
    <div class="stats">
      <div class="stat">Score: <span id="score">0</span></div>
      <div class="stat">LOVE: <span id="love">0</span></div>
      <div class="stat">Phase: <span id="phase">0.00</span></div>
    </div>
    <canvas id="gameCanvas" width="400" height="400"></canvas>
    <div class="controls">
      <button onclick="setSpoons(0)">! (0)</button>
      <button onclick="setSpoons(1)">1</button>
      <button onclick="setSpoons(2)">2</button>
      <button onclick="setSpoons(3)">3</button>
      <button onclick="setSpoons(4)">4</button>
      <button onclick="setSpoons(5)">5</button>
    </div>
    <button class="back" onclick="window.location.href='/portal'">← Back to Portal</button>
  </div>
  <script>
    const game = ${JSON.stringify(game)};
    let score = 0;
    let loveEarned = 0;
    let phase = 0;
    let targetPhase = Math.random();
    let spoons = 2;
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const step = 0.005 * (spoons / 3 + 0.5);

    function jitterbugVertices(t) {
      const phi = (1 + Math.sqrt(5)) / 2;
      const vertices = [
        [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
        [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
        [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
      ];
      const scale = 0.5 + t * 0.5;
      return vertices.map(([x, y, z]) => {
        const x2 = x * scale, y2 = y * scale, z2 = z * scale;
        return { x: x2, y: y2, z: z2 };
      });
    }

    function jitterbugEdges() {
      return [[0,1],[0,5],[0,7],[0,10],[0,11],[1,3],[1,5],[1,7],[2,3],[2,4],[2,6],[2,11],[3,4],[3,9],[4,5],[4,9],[5,9],[6,7],[6,8],[6,10],[7,8],[8,9],[8,10],[10,11]];
    }

    function rotateY(v, angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return { x: v.x * c - v.z * s, y: v.y, z: v.x * s + v.z * c };
    }

    function rotateX(v, angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
    }

    function project(v) {
      const fov = 3;
      const scale = fov / (fov + v.z);
      return { x: v.x * scale * 100 + 200, y: v.y * scale * 100 + 200 };
    }

    function animate() {
      ctx.fillStyle = '#0A0A0F';
      ctx.fillRect(0, 0, 400, 400);
      phase = (phase + step) % 1;
      document.getElementById('phase').textContent = phase.toFixed(2);

      const verts = jitterbugVertices(phase).map(v => rotateY(rotateX(v, phase * Math.PI), phase * 0.7));
      const targetVerts = jitterbugVertices(targetPhase).map(v => rotateY(rotateX(v, targetPhase * Math.PI), targetPhase * 0.7));
      const edges = jitterbugEdges();

      ctx.save();
      ctx.strokeStyle = 'rgba(251,191,36,0.15)';
      ctx.lineWidth = 1;
      for (const [a, b] of edges) {
        const pa = project(targetVerts[a]), pb = project(targetVerts[b]);
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(0,240,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 6;
      for (const [a, b] of edges) {
        const pa = project(verts[a]), pb = project(verts[b]);
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }
      for (const v of verts) {
        const p = project(v);
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#00F0FF';
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();

      const diff = Math.abs(phase - targetPhase);
      if (diff < 0.05) {
        score += 10;
        loveEarned += game.loveMilestone;
        document.getElementById('score').textContent = score;
        document.getElementById('love').textContent = loveEarned;
        targetPhase = Math.random();
        if (score >= 100) {
          loveEarned += game.loveCompletion;
          document.getElementById('love').textContent = loveEarned;
        }
      }

      requestAnimationFrame(animate);
    }

    function setSpoons(s) { spoons = s; }

    animate();
  </script>
</body>
</html>`;
}