/**
 * Mastodon — POST /api/v1/statuses
 * Auth: Bearer <access_token>
 * Docs: https://docs.joinmastodon.org/methods/statuses/#create
 */

async function publish({ content, env, visibility = 'public' }) {
  const instance = env.MASTODON_INSTANCE || 'https://mastodon.social';
  const token = env.MASTODON_ACCESS_TOKEN;
  if (!token) throw new Error('MASTODON_ACCESS_TOKEN not set');

  const res = await fetch(`${instance.replace(/\/$/, '')}/api/v1/statuses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: content, visibility })
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Mastodon ${res.status}: ${body.error || JSON.stringify(body)}`);
  }
  return {
    success: true,
    platform: 'mastodon',
    id: body.id,
    url: body.url,
    length: content.length
  };
}

module.exports = { publish };
