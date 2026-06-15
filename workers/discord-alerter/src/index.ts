export interface Env {
  DISCORD_WEBHOOK_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const webhookUrl = env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('Missing DISCORD_WEBHOOK_URL environment variable');
      return new Response('Server misconfigured', { status: 500 });
    }

    try {
      const body = await request.json();
      const { message, level = 'info' } = body as { message?: string; level?: string };

      if (!message) {
        return new Response('Missing "message" field', { status: 400 });
      }

      let color = 0x00ff88;
      if (level === 'warn') color = 0xffaa00;
      if (level === 'error') color = 0xff3333;

      const discordPayload = {
        embeds: [{
          title: `P31 Alert (${level})`,
          description: message,
          color,
          timestamp: new Date().toISOString(),
          footer: { text: 'discord-alerter • P31 Oracle' },
        }],
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      });

      if (!res.ok) {
        console.error(`Discord webhook error: ${res.status} ${await res.text()}`);
        return new Response('Failed to forward to Discord', { status: 502 });
      }

      return new Response('Alert sent', { status: 200 });
    } catch (err) {
      console.error('Error processing request:', err);
      return new Response('Invalid JSON', { status: 400 });
    }
  },
};
