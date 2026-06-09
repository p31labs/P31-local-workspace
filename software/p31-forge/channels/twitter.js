/**
 * Twitter / X — POST /2/tweets
 * Auth: OAuth 1.0a User Context (HMAC-SHA1)
 * Docs: https://developer.twitter.com/en/docs/authentication/oauth-1-0a
 *
 * Required secrets:
 *   TWITTER_API_KEY              (consumer key)
 *   TWITTER_API_SECRET           (consumer secret)
 *   TWITTER_ACCESS_TOKEN         (user access token)
 *   TWITTER_ACCESS_TOKEN_SECRET  (user access token secret)
 *
 * OAuth 1.0a signing is implemented via Web Crypto (HMAC-SHA1),
 * which is available in both Cloudflare Workers and Node >= 15.
 */

const ENDPOINT = 'https://api.twitter.com/2/tweets';

async function publish({ content, env }) {
  const keys = {
    consumerKey:       env.TWITTER_API_KEY,
    consumerSecret:    env.TWITTER_API_SECRET,
    accessToken:       env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: env.TWITTER_ACCESS_TOKEN_SECRET
  };
  for (const [k, v] of Object.entries(keys)) {
    if (!v) throw new Error(`Twitter: missing ${k}`);
  }
  if (typeof content !== 'string') {
    throw new Error('Twitter: content must be a string');
  }
  if (content.length > 280) {
    throw new Error(`Twitter: content ${content.length} > 280 chars`);
  }

  const bodyJson = JSON.stringify({ text: content });

  // OAuth 1.0a signs ONLY the oauth_* params for application/json bodies.
  // Body does NOT participate in the signature base string here.
  const oauth = {
    oauth_consumer_key:     keys.consumerKey,
    oauth_nonce:            randomNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token:            keys.accessToken,
    oauth_version:          '1.0'
  };

  const signature = await signOAuth1({
    method: 'POST',
    url: ENDPOINT,
    params: oauth,
    consumerSecret: keys.consumerSecret,
    tokenSecret: keys.accessTokenSecret
  });
  oauth.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.entries(oauth)
    .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
    .join(', ');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization':  authHeader,
      'Content-Type':   'application/json',
      'User-Agent':     'P31-Forge/0.1'
    },
    body: bodyJson
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Twitter ${res.status}: ${JSON.stringify(body)}`);
  }
  const id = body.data?.id;
  return {
    success: true,
    platform: 'twitter',
    id,
    url: id ? `https://x.com/i/status/${id}` : null,
    length: content.length
  };
}

// ─── OAuth 1.0a helpers ──────────────────────────────────────────────

function percentEncode(s) {
  // RFC 3986 — per OAuth 1.0a spec
  return encodeURIComponent(String(s))
    .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function randomNonce() {
  // 32-byte hex nonce
  const buf = new Uint8Array(16);
  (globalThis.crypto || require('crypto').webcrypto).getRandomValues(buf);
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}

async function signOAuth1({ method, url, params, consumerSecret, tokenSecret }) {
  // 1. Normalize parameters (sorted, percent-encoded, joined by &)
  const paramStr = Object.keys(params).sort()
    .map(k => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');

  // 2. Signature base string
  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramStr)
  ].join('&');

  // 3. Signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  // 4. HMAC-SHA1 -> base64
  const subtle = (globalThis.crypto || require('crypto').webcrypto).subtle;
  const enc = new TextEncoder();
  const key = await subtle.importKey(
    'raw',
    enc.encode(signingKey),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await subtle.sign('HMAC', key, enc.encode(baseString));
  return bufferToBase64(sig);
}

function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

module.exports = { publish };
