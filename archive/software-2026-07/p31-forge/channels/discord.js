/**
 * Discord — incoming webhook poster
 * Auth: the webhook URL itself is the secret (no header auth).
 * Docs: https://discord.com/developers/docs/resources/webhook#execute-webhook
 *
 * Inputs:
 *   content: string   OR
 *   content: { content?, embeds?, username?, avatar_url?, webhookUrl? }
 *
 * env:
 *   DISCORD_WEBHOOK_URL         (default; used when content.webhookUrl absent)
 *   DISCORD_PAYMENT_WEBHOOK_URL (convenience alias for payment events)
 *   DISCORD_ACTIVITY_WEBHOOK_URL (convenience alias for activity events)
 *
 * `opts.role` selects a named webhook alias: "default" | "payment" | "activity"
 * (maps to the env vars above). Explicit content.webhookUrl always wins.
 */

const ROLE_ENV = {
  default:  'DISCORD_WEBHOOK_URL',
  payment:  'DISCORD_PAYMENT_WEBHOOK_URL',
  activity: 'DISCORD_ACTIVITY_WEBHOOK_URL'
};

async function publish({ content, env = {}, role = 'default' } = {}) {
  // Normalize: string → { content }
  const payload = typeof content === 'string' ? { content } : { ...(content || {}) };
  const webhookUrl =
    payload.webhookUrl ||
    env[ROLE_ENV[role] || ROLE_ENV.default] ||
    env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      `Discord: no webhook URL (looked at content.webhookUrl, env.${ROLE_ENV[role] || ROLE_ENV.default}, env.DISCORD_WEBHOOK_URL)`
    );
  }
  if (!payload.content && !(Array.isArray(payload.embeds) && payload.embeds.length)) {
    throw new Error('Discord: either content (string) or embeds[] required');
  }

  // Strip our control keys before forwarding
  delete payload.webhookUrl;

  const body = {
    username:   payload.username   || 'P31 Forge',
    avatar_url: payload.avatar_url || undefined,
    content:    payload.content    || undefined,
    embeds:     payload.embeds     || undefined
  };

  // `?wait=true` makes Discord return the created message so we can
  // surface a permalink back to the caller.
  const res = await fetch(webhookUrl + '?wait=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Discord webhook ${res.status}: ${errText}`);
  }
  const msg = await res.json().catch(() => ({}));
  return {
    success: true,
    platform: 'discord',
    id: msg.id || null,
    channel_id: msg.channel_id || null,
    url: (msg.id && msg.channel_id)
      ? `https://discord.com/channels/@me/${msg.channel_id}/${msg.id}`
      : null
  };
}

module.exports = { publish };
