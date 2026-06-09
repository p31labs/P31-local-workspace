/**
 * P31 FORGE — Cloudflare Worker (HTTP service)
 * =============================================
 * Exposes the Forge document pipeline over HTTP so:
 *   - Agents / bots can POST content packs and get .docx back
 *   - Webhooks (Discord, GitHub, Ko-fi) can trigger document generation
 *   - The PWA / admin dashboard can generate docs in the browser
 *
 * Endpoints:
 *   GET  /                        — service info + usage
 *   GET  /health                  — liveness probe
 *   GET  /brand                   — brand constants (COLORS, TYPE, ENTITY, SOCIAL)
 *   POST /compile                 — content pack → .docx (body: pack JSON)
 *   POST /social                  — format post for platform (body: { content, platform })
 *   POST /webhook/kofi            — Ko-fi payment webhook → Discord embed + activity
 *   POST /webhook/discord         — Discord slash-command webhook (stub)
 *   POST /webhook/github          — GitHub release webhook (stub)
 *
 * Auth:
 *   POST endpoints require header: `X-Forge-Key: <FORGE_API_KEY>`
 *   Set via: wrangler secret put FORGE_API_KEY
 *   EXCEPT /webhook/kofi — Ko-fi servers authenticate with their own
 *   verification token (x-kofi-webhook-secret), checked against env.KOFI_SECRET.
 *
 * CORS:
 *   OPTIONS preflight handled; Access-Control-Allow-Origin driven by ALLOWED_ORIGINS env.
 */

// forge.js, brand.js, channels, and store.js are CommonJS — esbuild
// handles CJS-in-ESM interop and walks the dependency graph so all
// channel modules + docx land in the bundle. (createRequire would
// leave these out because it resolves at runtime against a filesystem
// that CF Workers don't have.)
import forge from '../forge.js';
import B from '../brand.js';
import { Packer } from 'docx';
import store from './store.js';

const { compile, publish, publishPack, CHANNELS } = forge;
const {
  logActivity, listActivity,
  diffGrants, saveLastGrantsScan, getLastGrantsScan
} = store;

const JSON_HEADERS = { 'content-type': 'application/json' };

function cors(env) {
  const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes('*') ? '*' : allowed.join(', '),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-forge-key',
    'Access-Control-Max-Age': '86400'
  };
}

function json(body, init = {}, env = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status: init.status || 200,
    headers: { ...JSON_HEADERS, ...cors(env), ...(init.headers || {}) }
  });
}

function requireAuth(request, env) {
  if (!env.FORGE_API_KEY) return null; // Auth disabled when no key set
  const key = request.headers.get('x-forge-key');
  if (!key || key !== env.FORGE_API_KEY) {
    return json({ error: 'unauthorized', hint: 'set X-Forge-Key header' }, { status: 401 }, env);
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ───────────────────────────────────────────────────────────────────

async function handleInfo(env) {
  return json({
    service: 'P31 Forge',
    version: '0.1.0',
    entity: B.ENTITY.org,
    ein: B.ENTITY.ein,
    endpoints: {
      'GET /health':             'liveness probe',
      'GET /brand':              'brand constants',
      'GET /channels':           'list available publishing channels',
      'GET /activity':           'recent activity log (KV-backed)',
      'GET /scan/grants/last':   'summary of last grants.gov scan',
      'POST /compile':           'content pack (JSON) -> .docx',
      'POST /social':            'format post for platform',
      'POST /publish/:channel':  'publish to a single channel (body: { content, opts? })',
      'POST /publish-pack':      'publish a social pack across multiple channels',
      'POST /scan-grants':       'scan grants.gov for keyword hits (tracks new vs seen)',
      'POST /scan-substack':     'scan Substack RSS + optional cross-post fan-out',
      'POST /webhook/kofi':      'Ko-fi payment webhook \u2192 Discord embed + activity',
      'POST /webhook/*':         'other automation webhooks (discord/github)'
    },
    kinds: ['court', 'letter', 'resolution', 'memo', 'grant'],
    channels: Object.keys(CHANNELS),
    kv_bound: !!env?.FORGE_KV
  }, {}, env);
}

async function handleChannels(env) {
  return json({ channels: Object.keys(CHANNELS) }, {}, env);
}

async function handleHealth(env) {
  return json({ status: 'ok', timestamp: new Date().toISOString() }, {}, env);
}

async function handleBrand(env) {
  return json({
    colors: B.COLORS,
    type:   B.TYPE,
    entity: B.ENTITY,
    social: B.SOCIAL
  }, {}, env);
}

async function handleCompile(request, env) {
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;

  let pack;
  try {
    pack = await request.json();
  } catch {
    return json({ error: 'invalid JSON body' }, { status: 400 }, env);
  }

  try {
    const doc = compile(pack);
    const buffer = await Packer.toBuffer(doc);
    const filename = pack.filename || `forge_${Date.now()}.docx`;
    await logActivity(env, {
      kind: 'compile',
      ok: true,
      detail: { packKind: pack.kind, filename, bytes: buffer.byteLength || buffer.length },
      source: 'http'
    });
    return new Response(buffer, {
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'content-disposition': `attachment; filename="${filename}"`,
        ...cors(env)
      }
    });
  } catch (e) {
    await logActivity(env, {
      kind: 'compile',
      ok: false,
      error: e.message,
      detail: { packKind: pack?.kind },
      source: 'http'
    });
    return json({ error: 'compile failed', detail: e.message, kind: pack.kind }, { status: 500 }, env);
  }
}

async function handleSocial(request, env) {
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid JSON body' }, { status: 400 }, env);
  }

  const { content, platform = 'bluesky' } = body;
  if (!content) return json({ error: 'content required' }, { status: 400 }, env);

  const result = B.formatSocial(content, platform);
  return json(result, {}, env);
}

// ───────────────────────────────────────────────────────────────────
// PUBLISH HANDLERS (channel dispatch — OAuth/API keys live in env)
// ───────────────────────────────────────────────────────────────────

async function handlePublish(request, env, channel) {
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;

  if (!CHANNELS[channel]) {
    return json({
      error: `unknown channel: "${channel}"`,
      valid: Object.keys(CHANNELS)
    }, { status: 400 }, env);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid JSON body' }, { status: 400 }, env);
  }

  const { content, ...opts } = body;
  if (content === undefined) {
    return json({ error: 'content required' }, { status: 400 }, env);
  }

  try {
    const result = await publish(channel, content, env, opts);
    await logActivity(env, {
      kind: 'publish',
      channel,
      ok: true,
      detail: { id: result.id, url: result.url, length: result.length },
      source: 'http'
    });
    return json(result, {}, env);
  } catch (e) {
    await logActivity(env, {
      kind: 'publish',
      channel,
      ok: false,
      error: e.message,
      source: 'http'
    });
    return json({
      error: 'publish failed',
      channel,
      detail: e.message
    }, { status: 502 }, env);
  }
}

async function handlePublishPack(request, env) {
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid JSON body' }, { status: 400 }, env);
  }

  const { pack, ...opts } = body;
  if (!pack || !Array.isArray(pack.posts)) {
    return json({ error: 'body must be { pack: { posts: [...] }, postIds?, targets? }' }, { status: 400 }, env);
  }

  try {
    const results = await publishPack(pack, env, opts);
    const ok = results.filter(r => r.success !== false).length;
    await logActivity(env, {
      kind: 'publish-pack',
      ok: ok === results.length,
      detail: {
        ok,
        failed: results.length - ok,
        total: results.length,
        postIds: opts.postIds || null,
        targets: opts.targets || null
      },
      source: 'http'
    });
    return json({
      ok,
      failed: results.length - ok,
      total: results.length,
      results
    }, {}, env);
  } catch (e) {
    await logActivity(env, {
      kind: 'publish-pack',
      ok: false,
      error: e.message,
      source: 'http'
    });
    return json({ error: 'publish-pack failed', detail: e.message }, { status: 502 }, env);
  }
}

async function handleScanSubstack(request, env) {
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;

  let body = {};
  try {
    body = await request.json();
  } catch {
    // empty body OK
  }

  try {
    const result = await publish('substack', body || {}, env);

    // Optional fan-out — body may include { targets: [...] }
    let fanResults = null;
    if (Array.isArray(body.targets) && body.targets.length && result.newCount > 0) {
      const pack = { posts: result.newPosts, defaultTargets: body.targets };
      fanResults = await publishPack(pack, env, { targets: body.targets });
    }

    await logActivity(env, {
      kind: 'scan-substack',
      ok: true,
      detail: {
        total: result.count,
        new: result.newCount,
        feed: result.feed,
        fannedTo: body.targets || null,
        fanOk: fanResults ? fanResults.filter(r => r.success !== false).length : null,
        fanTotal: fanResults ? fanResults.length : null
      },
      source: 'http'
    });
    return json({ ...result, fanResults }, {}, env);
  } catch (e) {
    await logActivity(env, {
      kind: 'scan-substack',
      ok: false,
      error: e.message,
      source: 'http'
    });
    return json({ error: 'scan-substack failed', detail: e.message }, { status: 502 }, env);
  }
}

async function handleScanGrants(request, env) {
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;

  let body = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is valid — scan with defaults
  }

  try {
    const result = await publish('grants', body || {}, env);
    const { newHits, firstScan } = await diffGrants(env, result.hits || []);
    await saveLastGrantsScan(env, {
      count: result.count,
      newCount: newHits.length,
      firstScan,
      keywords: result.keywords
    });
    await logActivity(env, {
      kind: 'scan-grants',
      ok: true,
      detail: {
        total: result.count,
        new: newHits.length,
        firstScan,
        keywordCount: result.keywords.length
      },
      source: 'http'
    });
    return json({ ...result, newHits, firstScan }, {}, env);
  } catch (e) {
    await logActivity(env, {
      kind: 'scan-grants',
      ok: false,
      error: e.message,
      source: 'http'
    });
    return json({ error: 'scan-grants failed', detail: e.message }, { status: 502 }, env);
  }
}

async function handleActivity(request, env) {
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const kind = url.searchParams.get('kind');
  const { entries, bound, total } = await listActivity(env, { limit, kind });
  return json({ bound, total, count: entries.length, entries }, {}, env);
}

async function handleLastGrantsScan(request, env) {
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;
  const last = await getLastGrantsScan(env);
  if (!last) return json({ bound: !!env?.FORGE_KV, last: null }, {}, env);
  return json({ bound: true, last }, {}, env);
}

// ───────────────────────────────────────────────────────────────────
// WEBHOOK STUBS (automation hooks — flesh out as agents come online)
// ───────────────────────────────────────────────────────────────────

async function handleDiscordWebhook(request, env) {
  // Discord sends interaction payload; route slash-commands to Forge.
  // Expected: /forge compile court:supp_notice
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;
  const payload = await request.json().catch(() => ({}));
  return json({ received: true, type: 'discord', echo: payload }, {}, env);
}

// ─── Ko-fi payment webhook ──────────────────────────────────────────
// Ko-fi posts multipart/form-data or application/x-www-form-urlencoded
// with a `data` field containing the JSON payload. It authenticates
// with its own verification token (x-kofi-webhook-secret or a
// verification_token field inside the JSON), so FORGE_API_KEY does NOT
// apply here — Ko-fi has no way to send it.
//
// Porting note: this mirrors the deprecated p31_kofi_discord_telemetry
// worker's embed shape (gold, Amount/From fields, P31 Labs footer).
// The production Ko-fi worker at kofi.p31ca.org still owns node-count
// milestones + rewards; Forge just gets a redundant Discord telemetry
// path + an activity-log entry so payments show up in /activity.
async function handleKofiWebhook(request, env) {
  let raw = null;
  let payload = null;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      payload = await request.json();
    } else {
      // multipart/form-data or application/x-www-form-urlencoded
      const form = await request.formData();
      raw = form.get('data');
      payload = raw ? JSON.parse(raw) : {};
    }
  } catch (e) {
    await logActivity(env, {
      kind: 'webhook-kofi', ok: false,
      error: `parse: ${e.message}`, source: 'http'
    });
    return json({ error: 'invalid ko-fi payload', detail: e.message }, { status: 400 }, env);
  }

  // Verify Ko-fi secret if configured. Ko-fi sends it as a header
  // (x-kofi-webhook-secret) OR as a `verification_token` field in the
  // JSON payload, depending on the integration style.
  if (env.KOFI_SECRET) {
    const hdr = request.headers.get('x-kofi-webhook-secret');
    const inPayload = payload?.verification_token;
    if (hdr !== env.KOFI_SECRET && inPayload !== env.KOFI_SECRET) {
      await logActivity(env, {
        kind: 'webhook-kofi', ok: false,
        error: 'bad verification token', source: 'http'
      });
      return json({ error: 'unauthorized' }, { status: 401 }, env);
    }
  }

  // Ignore Ko-fi's own verification / test events — no embed worth firing.
  const type = payload?.type;
  if (!type || type === 'Payment Process' || type === 'Verification') {
    await logActivity(env, {
      kind: 'webhook-kofi', ok: true,
      detail: { ignored: true, type: type || 'null' }, source: 'http'
    });
    return json({ received: true, ignored: true, type: type || null }, {}, env);
  }

  const from_name = payload.from_name || 'Anonymous';
  const amount    = payload.amount    || '0';
  const currency  = payload.currency  || 'USD';
  const message   = payload.message   || '';
  const url       = payload.url       || undefined;

  const embed = {
    title: `\ud83d\udcb0 New Contribution: ${type}`,
    description: message || 'No message provided.',
    url,
    color: 0xFFD700, // Gold
    fields: [
      { name: 'From',   value: from_name,                inline: true },
      { name: 'Amount', value: `${amount} ${currency}`, inline: true }
    ],
    footer: { text: 'P31 Labs | Sovereign Funding Mesh' },
    timestamp: new Date().toISOString()
  };

  try {
    const result = await publish('discord', { embeds: [embed] }, env, { role: 'payment' });
    await logActivity(env, {
      kind: 'webhook-kofi',
      channel: 'discord',
      ok: true,
      detail: {
        type, from_name, amount, currency,
        order_id: payload.kofi_transaction_id || payload.order_id || null,
        discord_id: result.id || null,
        discord_url: result.url || null
      },
      source: 'http'
    });
    return json({
      received: true,
      forwarded: 'discord',
      type,
      amount: `${amount} ${currency}`,
      discord: { id: result.id || null, url: result.url || null }
    }, {}, env);
  } catch (e) {
    await logActivity(env, {
      kind: 'webhook-kofi',
      channel: 'discord',
      ok: false,
      error: e.message,
      detail: { type, from_name, amount, currency },
      source: 'http'
    });
    return json({ error: 'discord forward failed', detail: e.message }, { status: 502 }, env);
  }
}

async function handleGitHubWebhook(request, env) {
  // GitHub release webhook — e.g., trigger grant-deadline reminder docs.
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;
  const payload = await request.json().catch(() => ({}));
  return json({ received: true, type: 'github', echo: payload }, {}, env);
}

// ───────────────────────────────────────────────────────────────────
// ROUTER
// ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env) });
    }

    // GET routes
    if (method === 'GET') {
      if (pathname === '/')               return handleInfo(env);
      if (pathname === '/health')         return handleHealth(env);
      if (pathname === '/brand')          return handleBrand(env);
      if (pathname === '/channels')       return handleChannels(env);
      if (pathname === '/activity')       return handleActivity(request, env);
      if (pathname === '/scan/grants/last') return handleLastGrantsScan(request, env);
    }

    // POST routes
    if (method === 'POST') {
      if (pathname === '/compile')           return handleCompile(request, env);
      if (pathname === '/social')            return handleSocial(request, env);
      if (pathname === '/publish-pack')      return handlePublishPack(request, env);
      if (pathname === '/scan-grants')       return handleScanGrants(request, env);
      if (pathname === '/scan-substack')     return handleScanSubstack(request, env);
      if (pathname.startsWith('/publish/')) {
        const channel = pathname.slice('/publish/'.length);
        return handlePublish(request, env, channel);
      }
      if (pathname === '/webhook/kofi')      return handleKofiWebhook(request, env);
      if (pathname === '/webhook/discord')   return handleDiscordWebhook(request, env);
      if (pathname === '/webhook/github')    return handleGitHubWebhook(request, env);
    }

    return json({ error: 'not found', path: pathname }, { status: 404 }, env);
  },

  // ─── Cron trigger (see wrangler.toml [triggers] crons) ───────────
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(event, env));
  }
};

// ═══════════════════════════════════════════════════════════════════
// SCHEDULED — fires from cron, matched by event.cron string
// ═══════════════════════════════════════════════════════════════════

async function runScheduled(event, env) {
  const cron = event?.cron || '';

  // Daily grants.gov watchlist scan (09:00 UTC by convention)
  if (cron === '0 9 * * *') {
    try {
      const result = await publish('grants', {}, env);
      const { newHits, firstScan } = await diffGrants(env, result.hits || []);
      await saveLastGrantsScan(env, {
        count: result.count,
        newCount: newHits.length,
        firstScan,
        keywords: result.keywords
      });
      await logActivity(env, {
        kind: 'scan-grants',
        ok: true,
        detail: {
          total: result.count,
          new: newHits.length,
          firstScan,
          keywordCount: result.keywords.length,
          newTitles: newHits.slice(0, 10).map(h => ({ id: h.id, title: h.title, agency: h.agency }))
        },
        source: 'cron'
      });
    } catch (e) {
      await logActivity(env, {
        kind: 'scan-grants',
        ok: false,
        error: e.message,
        source: 'cron'
      });
    }
    return;
  }

  // Hourly Substack scan — matches the legacy Discord poller cadence.
  // If SUBSTACK_AUTO_TARGETS (comma-separated list) is set, fan new posts
  // out; otherwise just log the fact that new posts exist.
  if (cron === '0 * * * *') {
    try {
      const result = await publish('substack', {}, env);
      const autoTargets = (env.SUBSTACK_AUTO_TARGETS || '').split(',').map(s => s.trim()).filter(Boolean);
      let fanResults = null;
      if (autoTargets.length && result.newCount > 0) {
        const pack = { posts: result.newPosts, defaultTargets: autoTargets };
        fanResults = await publishPack(pack, env, { targets: autoTargets });
      }
      await logActivity(env, {
        kind: 'scan-substack',
        ok: true,
        detail: {
          total: result.count,
          new: result.newCount,
          feed: result.feed,
          newTitles: result.newPosts.slice(0, 5).map(p => p.meta.title),
          fannedTo: autoTargets.length ? autoTargets : null,
          fanOk: fanResults ? fanResults.filter(r => r.success !== false).length : null,
          fanTotal: fanResults ? fanResults.length : null
        },
        source: 'cron'
      });
    } catch (e) {
      await logActivity(env, {
        kind: 'scan-substack',
        ok: false,
        error: e.message,
        source: 'cron'
      });
    }
    return;
  }

  // Unknown cron — log so we can tell later
  await logActivity(env, {
    kind: 'cron-unhandled',
    ok: false,
    detail: { cron },
    source: 'cron'
  });
}
