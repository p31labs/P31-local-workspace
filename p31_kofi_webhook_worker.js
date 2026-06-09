/**
 * P31 Ko-fi Webhook Worker
 * Listens for Ko-fi webhooks and tracks node count for the Delta mesh
 * Includes Discord webhook integration for automated donation notifications
 *
 * Deploy: wrangler deploy p31_kofi_webhook_worker.js
 * Environment secrets: KOFI_SECRET, DISCORD_WEBHOOK_URL
 * KV binding: NODE_COUNT_KV
 *
 * Merges functionality from p31_kofi_discord_telemetry.js
 */

// Node milestones from Cognitive Passport
const NODE_MILESTONES = [4, 39, 69, 150, 420, 863, 1776];

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-kofi-webhook-secret',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // GET endpoint for node count and milestone status
    if (request.method === 'GET') {
      if (path === '/health' || path === '/') {
        return jsonResponse({
          service: 'p31-kofi-webhook',
          status: 'operational',
          node_count: await getNodeCount(env),
        });
      }

      const nodeCount = await getNodeCount(env);
      const nextMilestone = getNextMilestone(nodeCount);
      const rewards = getAvailableRewards(nodeCount);

      return jsonResponse({
        node_count: nodeCount,
        next_milestone: nextMilestone,
        rewards: rewards,
        milestone_meaning: getMilestoneMeaning(nodeCount),
        progress: getProgressToNext(nodeCount),
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      // Verify webhook secret (supports both header and Ko-fi verification token)
      const webhookSecret = request.headers.get('x-kofi-webhook-secret');
      const kofiSecret = env.KOFI_SECRET || '';
      if (kofiSecret && webhookSecret !== kofiSecret) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      // Parse Ko-fi webhook payload (supports both JSON and form-encoded)
      let payload;
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        const dataField = formData.get('data');
        payload = dataField ? JSON.parse(dataField) : {};
      } else {
        payload = await request.json();
      }

      const event = parseWebhookEvent(payload);

      if (!event) {
        return jsonResponse({
          node_count: await getNodeCount(env),
          status: 'ignored',
          message: 'Non-donation event',
        });
      }

      // Process the donation/purchase
      const result = await processEvent(event, env, ctx);

      // R09: Emit kofi_donation to Genesis Gate (fire-and-forget, no PII)
      const genesisUrl = (env.GENESIS_GATE_URL || 'https://genesis.p31ca.org') + '/event';
      ctx.waitUntil(fetch(genesisUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'p31-kofi-webhook',
          type: 'kofi_donation',
          payload: { event_type: event.type, milestone_reached: result.milestone },
          timestamp: new Date().toISOString(),
          session_id: 'kofi-' + Math.random().toString(36).slice(2, 8),
        }),
      }).catch(() => {}));

      return jsonResponse({
        node_count: await getNodeCount(env),
        status: 'processed',
        event_type: event.type,
        amount: event.amount,
        message: result.message,
        milestone_reached: result.milestone,
      });
    } catch (error) {
      return jsonResponse({
        error: 'Internal server error',
        details: error.message,
      }, 500);
    }
  },

  // Scheduled: daily node count digest to Discord
  async scheduled(event, env, ctx) {
    const nodeCount = await getNodeCount(env);
    const nextMilestone = getNextMilestone(nodeCount);
    const webhookUrl = env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) return;

    const embed = {
      embeds: [{
        title: '📊 Daily Node Count Digest',
        color: 0x00D4FF,
        fields: [
          { name: 'Total Nodes', value: `${nodeCount}`, inline: true },
          {
            name: 'Next Milestone',
            value: nextMilestone
              ? `${nextMilestone.target} (${nextMilestone.remaining} to go)`
              : 'All milestones reached!',
            inline: true,
          },
        ],
        footer: { text: 'P31 Labs | Daily Ko-fi Digest' },
        timestamp: new Date().toISOString(),
      }],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });
  },
};

function parseWebhookEvent(payload) {
  // Ko-fi webhook types: Donation, Subscription, ShopOrder
  const type = payload.type;
  
  if (!type || type === 'Payment Process' || type === 'Verification') {
    return null;
  }

  return {
    type: type,
    amount: parseFloat(payload.amount) || 0,
    currency: payload.currency || 'USD',
    email: payload.email || '',
    name: payload.from_name || 'Anonymous',
    message: payload.message || '',
    order_id: payload.order_id || payload.kofi_transaction_id || '',
    timestamp: payload.timestamp || new Date().toISOString()
  };
}

async function processEvent(event, env, ctx) {
  let nodeCount = await getNodeCount(env);
  const previousCount = nodeCount;

  // Increment node count (each supporter = 1 node)
  nodeCount++;

  // Save to KV
  await saveNodeCount(env, nodeCount);

  // Log the support
  await logSupport(env, event);

  // Check for milestone
  let milestone = null;
  if (NODE_MILESTONES.includes(nodeCount) && nodeCount > previousCount) {
    milestone = {
      reached: nodeCount,
      milestone: getMilestoneMeaning(nodeCount),
    };
    console.log(`Node milestone reached: ${nodeCount}`);
  }

  // Send Discord notification
  if (env.DISCORD_WEBHOOK_URL) {
    await sendDiscordNotification(event, nodeCount, milestone, env);
  }

  return {
    message: `Thank you, ${event.name}! Node ${nodeCount} in the Delta mesh.`,
    milestone: milestone,
  };
}

async function sendDiscordNotification(event, nodeCount, milestone, env) {
  const embed = {
    embeds: [{
      title: milestone
        ? `MILESTONE: Node ${nodeCount}!`
        : 'New Node Added to Delta Mesh',
      description: `**${event.name}** just supported P31 Labs!`,
      color: milestone ? 0xF59E0B : 0x00FF88,
      fields: [
        { name: 'Amount', value: `${event.amount} ${event.currency}`, inline: true },
        { name: 'Total Nodes', value: `${nodeCount}`, inline: true },
        { name: 'Message', value: event.message || '_No message_', inline: false },
      ],
      footer: { text: 'P31 Labs | The Delta is rigid. The mesh holds.' },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });
  } catch (error) {
    console.error('Discord notification failed:', error);
  }
}

async function getNodeCount(env) {
  if (!env.NODE_COUNT_KV) {
    return 0;
  }
  const count = await env.NODE_COUNT_KV.get('node_count');
  return parseInt(count) || 0;
}

async function saveNodeCount(env, count) {
  if (!env.NODE_COUNT_KV) return;
  await env.NODE_COUNT_KV.put('node_count', count.toString());
}

async function logSupport(env, event) {
  if (!env.NODE_COUNT_KV) return;
  const log = {
    timestamp: event.timestamp,
    type: event.type,
    amount: event.amount,
    name: event.name,
    message: event.message,
  };
  const timestamp = Date.now();
  await env.NODE_COUNT_KV.put(`support_${timestamp}`, JSON.stringify(log));
}

function getMilestoneMeaning(n) {
  const meanings = {
    4: 'First tetrahedron — Maxwell rigidity achieved',
    39: 'Posner number — Calcium cage protecting Phosphorus',
    69: 'Nice',
    150: "Dunbar's number — meaningful social connections",
    420: 'Tetrahedral angle in degrees × 7',
    863: 'Larmor frequency — ³¹P resonance in Earth field',
    1776: 'Abdication of the Crown — systems change'
  };
  return meanings[n] || `Node ${n} in the Delta mesh`;
}

function getNextMilestone(count) {
  for (const milestone of NODE_MILESTONES) {
    if (milestone > count) {
      return {
        target: milestone,
        remaining: milestone - count,
        meaning: getMilestoneMeaning(milestone)
      };
    }
  }
  return null;
}

function getAvailableRewards(count) {
  const rewards = [];
  
  if (count >= 4) {
    rewards.push({
      id: 'first-tetrahedron',
      name: 'First Tetrahedron Badge',
      unlocked: true,
      description: 'Maxwell rigidity achieved — the minimum stable structure'
    });
  }
  if (count >= 39) {
    rewards.push({
      id: 'posner-cage',
      name: 'Posner Cage Badge',
      unlocked: true,
      description: 'Vote on next feature priority'
    });
  }
  if (count >= 69) {
    rewards.push({
      id: 'nice',
      name: 'Nice Badge',
      unlocked: true,
      description: 'Discord access'
    });
  }
  if (count >= 150) {
    rewards.push({
      id: 'dunbar',
      name: 'Dunbar Badge',
      unlocked: true,
      description: 'Monthly community call invitation'
    });
  }
  if (count >= 420) {
    rewards.push({
      id: 'tetrahedron',
      name: 'Tetrahedron Badge',
      unlocked: true,
      description: 'Name in Spaceship Earth credits'
    });
  }
  if (count >= 863) {
    rewards.push({
      id: 'larmor',
      name: 'Larmor Badge',
      unlocked: true,
      description: 'Limited edition Node One prototype vote'
    });
  }
  if (count >= 1776) {
    rewards.push({
      id: 'abdication',
      name: 'Abdication Badge',
      unlocked: true,
      description: 'Founding member status for P31 Labs'
    });
  }
  
  // Add locked rewards
  const next = getNextMilestone(count);
  if (next) {
    const lockedNames = {
      4: 'First Tetrahedron Badge',
      39: 'Posner Cage Badge',
      69: 'Nice Badge',
      150: 'Dunbar Badge',
      420: 'Tetrahedron Badge',
      863: 'Larmor Badge',
      1776: 'Abdication Badge'
    };
    rewards.push({
      id: `locked-${next.target}`,
      name: lockedNames[next.target] || `Milestone ${next.target}`,
      unlocked: false,
      target: next.target,
      remaining: next.remaining,
      description: getMilestoneMeaning(next.target)
    });
  }
  
  return rewards;
}

function getProgressToNext(count) {
  const next = getNextMilestone(count);
  if (!next) return 100;
  
  const prev = NODE_MILESTONES.filter(m => m < next.target).pop() || 0;
  const range = next.target - prev;
  const progress = count - prev;
  return Math.round((progress / range) * 100);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
