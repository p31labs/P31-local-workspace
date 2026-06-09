/**
 * Dev.to — POST /api/articles
 * Auth: api-key: <DEVTO_API_KEY>
 * Docs: https://developers.forem.com/api/v1#tag/articles/operation/createArticle
 */

async function publish({ content, env, published = true }) {
  const token = env.DEVTO_API_KEY;
  if (!token) throw new Error('DEVTO_API_KEY not set');

  // content: { title, body_markdown, description?, tags?, canonical_url? }
  if (typeof content === 'string') {
    throw new Error('devto requires { title, body_markdown, ... } object');
  }

  const article = {
    title: content.title,
    body_markdown: content.body_markdown || content.body || '',
    published,
    ...(content.description ? { description: content.description } : {}),
    ...(content.tags ? { tags: content.tags.slice(0, 4) } : {}),
    ...(content.canonical_url ? { canonical_url: content.canonical_url } : {})
  };

  const res = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: { 'api-key': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ article })
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Dev.to ${res.status}: ${body.error || JSON.stringify(body)}`);
  }
  return {
    success: true,
    platform: 'devto',
    id: body.id,
    url: body.url,
    canonical_url: body.canonical_url
  };
}

module.exports = { publish };
