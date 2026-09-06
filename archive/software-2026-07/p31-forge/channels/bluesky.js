/**
 * Bluesky (ATProto) — com.atproto.server.createSession + com.atproto.repo.createRecord
 * Auth: username/app-password -> session token
 * Docs: https://docs.bsky.app/docs/api/com-atproto-repo-create-record
 */

const SERVICE = 'https://bsky.social';

async function createSession(identifier, password) {
  const res = await fetch(`${SERVICE}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Bluesky session ${res.status}: ${body.message || body.error}`);
  return body; // { accessJwt, refreshJwt, did, handle }
}

async function publish({ content, env }) {
  const handle = env.BLUESKY_HANDLE;
  const password = env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) {
    throw new Error('BLUESKY_HANDLE and BLUESKY_APP_PASSWORD required');
  }

  const session = await createSession(handle, password);
  const record = {
    $type: 'app.bsky.feed.post',
    text: content,
    createdAt: new Date().toISOString()
  };

  const res = await fetch(`${SERVICE}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessJwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record
    })
  });

  const body = await res.json();
  if (!res.ok) throw new Error(`Bluesky ${res.status}: ${body.message || JSON.stringify(body)}`);

  // URI shape: at://<did>/<collection>/<rkey>  -> permalink bsky.app/profile/<handle>/post/<rkey>
  const rkey = (body.uri || '').split('/').pop();
  return {
    success: true,
    platform: 'bluesky',
    id: body.uri,
    cid: body.cid,
    url: rkey ? `https://bsky.app/profile/${session.handle}/post/${rkey}` : null,
    length: content.length
  };
}

module.exports = { publish };
