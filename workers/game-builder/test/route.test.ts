import { describe, it, expect, afterEach, vi } from 'vitest';
import app from '../src/index';

const env = {
  ROBLOX_BRIDGE_URL: 'https://roblox-bridge.test',
  SHADOW_BRIDGE_URL: 'https://shadow-bridge.test',
  ENVIRONMENT: 'test',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('game-builder router', () => {
  it('lists the tool catalog', async () => {
    const res = await app.request('/tools', {}, env);
    expect(res.status).toBe(200);
    const { tools } = await res.json();
    const routes = tools.map((t: { route: string }) => t.route);
    expect(routes).toContain('worlds.create');
    expect(routes).toContain('worlds.list');
    expect(routes).toContain('worlds.get');
    expect(routes).toContain('love.balance');
    expect(routes).toContain('love.mint_status');
    expect(routes).toContain('love.mint');
    expect(routes).toContain('tools.list');
  });

  it('routes worlds.list to roblox-bridge', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ id: 'world_1', name: 'A' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await app.request(
      '/route',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ route: 'worlds.list', payload: {} }) },
      env,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.target).toBe('roblox-bridge');
    expect(body.result).toEqual([{ id: 'world_1', name: 'A' }]);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://roblox-bridge.test/worlds');
  });

  it('routes worlds.get with path param', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'world_7', name: 'B' }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await app.request(
      '/route',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ route: 'worlds.get', payload: { id: 'world_7' } }) },
      env,
    );
    expect(res.status).toBe(200);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://roblox-bridge.test/worlds/world_7');
  });

  it('routes love.mint to shadow-bridge with payload', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, queued: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await app.request(
      '/route',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ route: 'love.mint', payload: { userId: 'u1', amount: 10 } }) },
      env,
    );
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://shadow-bridge.test/game/mint-love');
    expect(JSON.parse(init.body)).toEqual({ userId: 'u1', amount: 10 });
  });

  it('routes love.mint_status as a GET with query params', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, queued: [], pendingCount: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await app.request(
      '/route',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ route: 'love.mint_status', payload: { userId: 'u1', sessionId: 's1' } }) },
      env,
    );
    expect(res.status).toBe(200);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://shadow-bridge.test/game/mint-status?userId=u1&sessionId=s1');
  });

  it('returns 404 with available routes for unknown route', async () => {
    const res = await app.request(
      '/route',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ route: 'nope', payload: {} }) },
      env,
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.available).toContain('tools.list');
  });

  it('returns 502 when the upstream target is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED'); }));
    const res = await app.request(
      '/route',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ route: 'worlds.list', payload: {} }) },
      env,
    );
    expect(res.status).toBe(502);
  });

  it('serves /health', async () => {
    const res = await app.request('/health', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.service).toBe('game-builder');
    expect(body.roblox_bridge_configured).toBe(true);
    expect(body.shadow_bridge_configured).toBe(true);
  });
});
