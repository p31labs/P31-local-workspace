/**
 * P31 GUMROAD WEBHOOK WORKER
 * ===========================
 * Receives Gumroad webhooks → routes to Discord + D1 + Queue.
 *
 * Gumroad webhook events: sale.created, sale.refunded, subscription.updated, license_key.verified
 *
 * Deploy:  npx wrangler deploy
 * Secrets: wrangler secret put GUMROAD_WEBHOOK_SECRET
 *          wrangler secret put DISCORD_WEBHOOK_URL
 * Queue:   p31-revenue (bind in wrangler.toml)
 * D1:      p31-revenue-db (bind in wrangler.toml)
 *
 * Pattern: mirrors p31-forge/webhook/kofi + p31-kofi-webhook
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'content-type, x-gumroad-signature',
        },
      });
    }

    // Health check
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return jsonResponse({ service: 'p31-gumroad-webhook', status: 'operational' });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // ── Verify webhook signature ──────────────────────────────────────
    // Gumroad sends HMAC-SHA256 in x-gumroad-signature header
    const sig = request.headers.get('x-gumroad-signature') || '';
    if (env.GUMROAD_WEBHOOK_SECRET) {
      const body = await request.text();
      const expected = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(env.GUMROAD_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', expected, new TextEncoder().encode(body));
      const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (sig !== hex) {
        return jsonResponse({ error: 'Invalid signature' }, 401);
      }
      // Re-parse body after reading for sig check
      const payload = JSON.parse(body);
      return handleWebhook(payload, env, ctx);
    }

    // No secret configured — accept without verification (dev mode)
    const payload = await request.json().catch(() => ({}));
    return handleWebhook(payload, env, ctx);
  },
};

// ─── Main handler ─────────────────────────────────────────────────────

async function handleWebhook(payload, env, ctx) {
  const eventType = payload.type || payload.event || 'unknown';
  const data = payload.data || payload.sale || payload.subscription || {};

  // Ignore test/verification events
  if (!data || eventType === 'test' || eventType === 'verification') {
    return jsonResponse({ received: true, ignored: true, type: eventType });
  }

  const sale = normalizeSale(data, eventType);

  // 1. Log to D1 (if bound)
  let d1Status = 'not_bound';
  if (env.DB) {
    try {
      await env.DB.prepare(
        'INSERT INTO sales (source, event_type, product_id, product_name, amount, currency, email, buyer_name, timestamp, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        'gumroad', eventType, sale.product_id, sale.product_name,
        sale.amount, sale.currency, sale.email, sale.buyer_name,
        sale.timestamp, JSON.stringify(payload)
      ).run();
      d1Status = 'inserted';
    } catch (e) {
      d1Status = `error:${e.message.slice(0, 50)}`;
    }
  }

  // 2. Push to Queue for batch processing (if bound)
  let queueStatus = 'not_bound';
  if (env.REVENUE_QUEUE) {
    try {
      await env.REVENUE_QUEUE.send({
        source: 'gumroad',
        event: eventType,
        sale,
        received_at: new Date().toISOString(),
      });
      queueStatus = 'queued';
    } catch (e) {
      queueStatus = `error:${e.message.slice(0, 50)}`;
    }
  }

  // 3. Discord notification (fire-and-forget)
  let discordStatus = 'not_configured';
  if (env.DISCORD_WEBHOOK_URL) {
    try {
      const embed = buildDiscordEmbed(sale, eventType, d1Status);
      ctx.waitUntil(
        fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [embed] }),
        }).then(r => {
          discordStatus = r.ok ? 'sent' : `http_${r.status}`;
        }).catch(e => {
          discordStatus = `error:${e.message.slice(0, 30)}`;
        })
      );
    } catch {
      discordStatus = 'error';
    }
  }

  // 4. Genesis Gate event (R09 pattern — fire-and-forget, no PII)
  if (env.GENESIS_GATE_URL) {
    ctx.waitUntil(
      fetch(`${env.GENESIS_GATE_URL}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'p31-gumroad-webhook',
          type: 'gumroad_sale',
          payload: {
            event_type: eventType,
            product: sale.product_name,
            amount: sale.amount,
            currency: sale.currency,
            license_key: sale.license_key ? 'present' : 'none',
          },
          timestamp: new Date().toISOString(),
          session_id: 'gumroad-' + Math.random().toString(36).slice(2, 8),
        }),
      }).catch(() => {})
    );
  }

  return jsonResponse({
    received: true,
    type: eventType,
    sale: {
      product: sale.product_name,
      amount: `${sale.amount} ${sale.currency}`,
      buyer: sale.buyer_name,
    },
    status: { d1: d1Status, queue: queueStatus, discord: discordStatus },
  });
}

// ─── Normalize Gumroad payload shapes ─────────────────────────────────

function normalizeSale(data, eventType) {
  // Gumroad sends different shapes for sale.created vs subscription.updated
  const product = data.product || {};
  const purchaser = data.purchaser || data.customer || {};

  return {
    product_id: product.id || data.product_id || '',
    product_name: product.name || data.product_name || 'Unknown Product',
    amount: parseFloat(data.price || data.amount || 0),
    currency: data.currency || 'USD',
    email: purchaser.email || data.email || '',
    buyer_name: purchaser.name || data.purchaser_name || data.full_name || 'Anonymous',
    timestamp: data.created_at || data.timestamp || new Date().toISOString(),
    sale_id: data.id || data.sale_id || '',
    license_key: data.license_key || '',
    refunded: eventType === 'sale.refunded',
    subscription_id: data.subscription_id || '',
  };
}

// ─── Discord embed builder ────────────────────────────────────────────

function buildDiscordEmbed(sale, eventType, d1Status) {
  const isMilestone = sale.amount >= 15; // Bundle sale threshold
  const color = eventType === 'sale.refunded' ? 0xFF4444
              : isMilestone ? 0xF59E0B
              : 0x00FF88;

  const fields = [
    { name: 'Product', value: sale.product_name.slice(0, 100), inline: true },
    { name: 'Amount', value: `${sale.amount} ${sale.currency}`, inline: true },
  ];

  if (sale.license_key) {
    fields.push({ name: 'License', value: 'Key generated', inline: true });
  }

  if (sale.refunded) {
    fields.push({ name: '⚠️ Refunded', value: 'Sale was refunded', inline: false });
  }

  return {
    title: isMilestone ? '🌟 Bundle Sale!' : '🛒 New Sale',
    description: `**${sale.buyer_name}** purchased from P31 Labs`,
    color,
    fields,
    footer: { text: `P31 Labs | Gumroad | ${d1Status}` },
    timestamp: new Date().toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
