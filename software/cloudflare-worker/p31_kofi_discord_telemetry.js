/**
 * DEPRECATED — Consolidated into p31_kofi_webhook_worker.js
 * ---------------------------------------------------------
 * This worker's functionality (Ko-fi → Discord payment telemetry)
 * is now merged into the Ko-fi webhook worker at kofi.p31ca.org.
 * The webhook worker handles: donation tracking, node count,
 * milestone alerts, AND Discord notifications.
 *
 * This file is kept for reference only. Do not deploy.
 *
 * P31 Labs: Ko-fi to Discord Payment Telemetry
 * ---------------------------------------------------------
 * Receives Ko-fi payment webhooks and forwards formatted
 * alerts to the P31 Discord mesh.
 */

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("🔺 P31 Ko-fi Gateway: POST required.", { status: 405 });
    }

    try {
      const formData = await request.formData();
      const data = JSON.parse(formData.get("data"));

      // Extract Ko-fi payment details
      const { 
        from_name, 
        amount, 
        currency, 
        message, 
        type, 
        url 
      } = data;

      // Construct Discord Embed
      const discordPayload = {
        embeds: [{
          title: `💰 New Contribution: ${type}`,
          description: message || "No message provided.",
          url: url,
          color: 0xFFD700, // Gold
          fields: [
            { name: "From", value: from_name || "Anonymous", inline: true },
            { name: "Amount", value: `${amount} ${currency}`, inline: true }
          ],
          footer: { text: "P31 Labs | Sovereign Funding Mesh" },
          timestamp: new Date().toISOString()
        }]
      };

      // Forward to Discord Webhook
      await fetch(env.DISCORD_PAYMENT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload)
      });

      return new Response("✅ Telemetry forwarded.", { status: 200 });

    } catch (error) {
      return new Response(`❌ Error: ${error.message}`, { status: 500 });
    }
  }
};
