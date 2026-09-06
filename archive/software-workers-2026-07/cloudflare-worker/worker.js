// Cloudflare Worker for Discord Interactions and Upstash Redis Integration
// Handles: Discord Slash Commands + React ColliderMode Telemetry
import { verifyKey } from 'discord-interactions';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ============================================================
    // SECTION A: React App Endpoints (ColliderMode Telemetry)
    // These endpoints handle POSTs from the React frontend
    // ============================================================

    // Handle mesh telemetry POST from ColliderMode React app
    if (path === '/api/mesh-telemetry' && method === 'POST') {
      try {
        const body = await request.json();
        const { event, location, timestamp, threshold } = body;

        // Helper function to interact with Upstash
        async function setMeshState(key, value) {
          const response = await fetch(`https://upstash.redisflare.com`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.UPSTASH_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              command: 'SET',
              args: [key, JSON.stringify(value)]
            })
          });
          return response.json();
        }

        // Store in Redis for state persistence
        const meshState = {
          lastGroundEvent: {
            event,
            location,
            timestamp,
            threshold,
          },
          lastUpdate: Date.now(),
        };
        await setMeshState('P31_MESH_STATE', meshState);

        // Get Discord webhook URL from environment
        const discordWebhook = env.DISCORD_WEBHOOK_URL;
        if (discordWebhook) {
          const embed = {
            embeds: [{
              title: '📡 MESH TELEMETRY UPDATE',
              color: event === 'grounded' ? 0x00FF88 : 0xFF6600,
              fields: [
                {
                  name: 'Event',
                  value: event === 'grounded' ? '✅ DELTA FORMED' : '⚠️ SEEKING',
                  inline: true,
                },
                {
                  name: 'Location',
                  value: location ? `${location.lat?.toFixed(4)}, ${location.lon?.toFixed(4)}` : 'N/A',
                  inline: true,
                },
                {
                  name: 'Threshold',
                  value: `${threshold}m`,
                  inline: true,
                },
                {
                  name: 'Timestamp',
                  value: new Date(timestamp).toISOString(),
                },
              ],
              footer: {
                text: 'P31 Mesh • Operation Trimtab',
              },
              timestamp: new Date().toISOString(),
            }],
          };

          await fetch(discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(embed),
          });
        }

        return new Response(JSON.stringify({ success: true, event }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // KV GET endpoint for mesh state (React app polling)
    if (path === '/api/mesh-state' && method === 'GET') {
      async function getMeshState(key) {
        const response = await fetch(`https://upstash.redisflare.com`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.UPSTASH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            command: 'GET',
            args: [key]
          })
        });
        const result = await response.json();
        return result.result ? JSON.parse(result.result) : null;
      }

      const state = await getMeshState('P31_MESH_STATE');
      return new Response(state || '{}', {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ============================================================
    // SECTION B: Discord Interactions
    // These endpoints handle Discord slash commands
    // ============================================================

    // Only accept POST requests from Discord
    if (method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // 1. Verify the cryptographic signature from Discord
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();

    const isValidRequest = verifyKey(
      body,
      signature,
      timestamp,
      env.DISCORD_PUBLIC_KEY
    );

    if (!isValidRequest) {
      return new Response('Bad request signature', { status: 401 });
    }

    const interaction = JSON.parse(body);

    // 2. Handle Discord Ping (Type 1) - Required by Discord for setup
    if (interaction.type === 1) {
      return Response.json({ type: 1 });
    }

    // 3. Handle Slash Commands (Type 2)
    if (interaction.type === 2) {
      const commandName = interaction.data.name;

      // Helper function to interact with Upstash
      async function upstashCommand(cmd, args = []) {
        const response = await fetch(`https://upstash.redisflare.com`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.UPSTASH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            command: cmd,
            args: args
          })
        });
        return response.json();
      }

      async function getMeshState(key) {
        const response = await fetch(`https://upstash.redisflare.com`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.UPSTASH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            command: 'GET',
            args: [key]
          })
        });
        const result = await response.json();
        return result.result ? JSON.parse(result.result) : null;
      }

      async function setMeshState(key, value) {
        const response = await fetch(`https://upstash.redisflare.com`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.UPSTASH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            command: 'SET',
            args: [key, JSON.stringify(value)]
          })
        });
        return response.json();
      }

      // COMMAND: /ping-mesh
      if (commandName === 'ping-mesh') {
        const edges = await getMeshState('k4_edges') || [];
        const edgeCount = edges.length;
        
        let statusMessage = '';
        if (edgeCount === 0) statusMessage = "Topology: WYE (Unstable). No connections formed.";
        else if (edgeCount < 6) statusMessage = `Topology: TRANSIT. ${edgeCount}/6 edges formed. Maxwell rigidity pending.`;
        else statusMessage = "Topology: DELTA (Locked). K4 Tetrahedron complete. 🔺";

        return Response.json({
          type: 4,
          data: {
            content: `**Mesh Status Report:**\n${statusMessage}\nNodes connected: ${edges.length}`,
          }
        });
      }

      // COMMAND: /spoon-check
      if (commandName === 'spoon-check') {
        const targetUser = interaction.data.options?.[0]?.value || 'default_node';
        const nodeData = await getMeshState(`mesh_node_${targetUser}`);
        
        if (!nodeData) {
          return Response.json({
            type: 4,
            data: { content: `Node [${targetUser}] not found in physical transit.` }
          });           
        }

        const spoons = nodeData.spoon_count;
        let warning = spoons <= 20 ? "⚠️ **FAWN GUARD ACTIVATION RECOMMENDED** ⚠️" : "Metabolic load nominal.";

        return Response.json({
          type: 4,
          data: {
            content: `**Node [${targetUser}] Telemetry:**\nSpoon Economy: ${spoons}/100\nStatus: ${nodeData.status}\n${warning}`,
          }
        });
      }

      // COMMAND: /ground-status
      if (commandName === 'ground-status') {
        const meshStatus = await getMeshState('mesh_status') || {
          phase: 'superposition',
          active_nodes: 0,
          completed_edges: 0,
          target_location: { name: 'Unknown' }
        };

        const phaseEmoji = {
          'superposition': '🌌',
          'measurement': '📍',
          'triadic_closure': '🔗',
          'payload': '💎'
        };

        return Response.json({
          type: 4,
          data: {
            content: `**Ground Status Report:**\n${phaseEmoji[meshStatus.phase]} Phase: ${meshStatus.phase.toUpperCase()}\n📍 Target: ${meshStatus.target_location.name}\n👥 Active Nodes: ${meshStatus.active_nodes}\n🔗 Completed Edges: ${meshStatus.completed_edges}/6`,
          }
        });
      }

      // COMMAND: /ark-access
      if (commandName === 'ark-access') {
        const edges = await getMeshState('k4_edges') || [];
        
        if (edges.length === 6) {
          return Response.json({
            type: 4,
            data: {
              content: `**ARK ACCESS GRANTED** 🔺\n\nThe K4 Tetrahedron has been stabilized. You now have access to:\n• Node One CAD files\n• Mesh network documentation\n• Quantum frequency protocols\n\nUse /ark-download to receive the files.`,
            }
          });
        } else {
          return Response.json({
            type: 4,
            data: {
              content: `**ARK ACCESS DENIED** ⚠️\n\nThe K4 Tetrahedron is not yet complete. ${6 - edges.length} more connections required.`,
            }
          });
        }
      }

      // COMMAND: /ark-download
      if (commandName === 'ark-download') {
        const edges = await getMeshState('k4_edges') || [];
        
        if (edges.length === 6) {
          return Response.json({
            type: 4,
            data: {
              content: `**DOWNLOAD LINKS** 📦\n\nNode One CAD: https://p31ca.org/cad/node-one\nMesh Documentation: https://p31ca.org/docs/mesh\nFrequency Protocols: https://p31ca.org/docs/frequencies\n\nRemember: With great power comes great responsibility. Use this knowledge wisely.`,
            }
          });
        } else {
          return Response.json({
            type: 4,
            data: {
              content: `**DOWNLOAD DENIED** ⚠️\n\nComplete the K4 Tetrahedron first. ${6 - edges.length} more connections required.`,
            }
          });
        }
      }
    }

    return new Response('Unknown interaction type', { status: 400 });
  }
};