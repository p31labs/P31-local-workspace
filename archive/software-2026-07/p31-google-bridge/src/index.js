/**
 * P31 Google Bridge — Google OAuth, manual token submit, /auth UI
 * Secrets: GOOGLE_CLIENT_SECRET
 * Vars: GOOGLE_CLIENT_ID, REDIRECT_URL, OAUTH_SUCCESS_URL, CORS_ALLOW_ORIGIN,
 *       OAUTH_RETURN_ALLOWLIST (comma: origins or full URL prefixes for ?return=),
 *       DEFAULT_OAUTH_SCOPES
 */

const COOKIE = "p31_gb_sid";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7;
const STATE_TTL_SEC = 600;

function parseList(s) {
  if (!s || typeof s !== "string") return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function cors(request, env) {
  const origin = request.headers.get("Origin");
  const allow = parseList(env.CORS_ALLOW_ORIGIN);
  const hit = allow.includes("*") ? "*" : allow.find((o) => o === origin);
  const o = hit || allow[0] || "";
  const h = {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Cookie, X-Requested-With, Accept",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
  if (!o) delete h["Access-Control-Allow-Origin"];
  return h;
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

function b64urlDecode(str) {
  const m = str.length % 4;
  const pad = m === 0 ? 0 : 4 - m;
  const s = str.replace(/-/g, "+").replace(/_/g, "/") + (pad ? "=".repeat(pad) : "");
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))));
}

function idTokenPayload(idToken) {
  const p = idToken.split(".");
  if (p.length < 2) return null;
  return b64urlDecode(p[1]);
}

async function randomId() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function cookieHeader(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function getCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1].trim()) : null;
}

/** Allowlist: comma-separated; each entry is a full origin (https://p31ca.org) or URL prefix (https://p31ca.org/auth). */
function validReturnUrl(raw, env) {
  if (!raw || typeof raw !== "string") return null;
  const allow = parseList(env.OAUTH_RETURN_ALLOWLIST || "");
  if (allow.length === 0) return null;
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  for (const a of allow) {
    if (a === "*") return u.href;
    if (raw === a || raw.startsWith(a)) return u.href;
    try {
      const base = new URL(a);
      if (u.origin === base.origin) return u.href;
    } catch { /* */ }
  }
  return null;
}

async function exchangeCode(env, code) {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.REDIRECT_URL,
    grant_type: "authorization_code",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const t = await r.json();
  if (!r.ok) return { error: t.error || "token_exchange_failed", details: t };
  return t;
}

async function refreshAccessToken(env, refreshToken) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const t = await r.json();
  if (!r.ok) return { error: t.error, details: t };
  return t;
}

async function getGoogleUserInfo(accessToken) {
  const r = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const d = await r.json();
  if (!r.ok) return { error: d.error || "userinfo_failed", details: d };
  return d;
}

function googleAuthUrl(env, state) {
  const scope = (env.DEFAULT_OAUTH_SCOPES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  u.searchParams.set("redirect_uri", env.REDIRECT_URL);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", scope);
  u.searchParams.set("state", state);
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");
  return u.toString();
}

async function persistLogin(
  env,
  { access_token, refresh_token, expires_in, id_token, scope, emailHint, subHint, source: sourceTag }
) {
  let sub = subHint;
  let email = emailHint || "";
  if (id_token) {
    const idt = idTokenPayload(id_token);
    if (idt) {
      if (idt.sub) sub = idt.sub;
      if (idt.email) email = idt.email;
    }
  }
  if (!sub) {
    const u = await getGoogleUserInfo(access_token);
    if (u.error) return { error: u.error, details: u.details };
    sub = String(u.id || u.sub || "");
    if (u.email) email = u.email;
  }
  if (!sub) return { error: "no_sub" };
  const expSec = Number(expires_in) > 0 ? Number(expires_in) : 3600;
  const store = {
    access_token,
    refresh_token: refresh_token || null,
    expires_at: Date.now() + expSec * 1000,
    scope: scope || env.DEFAULT_OAUTH_SCOPES,
    email,
    sub,
    source: sourceTag || "unknown",
    updated: new Date().toISOString(),
  };
  await env.GOOGLE_OAUTH.put(`google_token:${sub}`, JSON.stringify(store));
  const sid = await randomId();
  await env.GOOGLE_OAUTH.put(
    `sess:${sid}`,
    JSON.stringify({ sub, email, created: new Date().toISOString() }),
    { expirationTtl: SESSION_TTL_SEC }
  );
  return { ok: true, sub, email, sessionId: sid, store };
}

function redirectResponse(location, setCookie) {
  const h = { Location: location };
  if (setCookie) h["Set-Cookie"] = setCookie;
  return new Response(null, { status: 302, headers: h });
}

/** Parallel KV read + parse session + token row. */
async function loadSubAndToken(request, env) {
  const sid = getCookie(request, COOKIE);
  if (!sid) return { error: "no_session" };
  const sRaw = await env.GOOGLE_OAUTH.get(`sess:${sid}`);
  if (!sRaw) return { error: "session_expired" };
  const s = JSON.parse(sRaw);
  const tRaw = await env.GOOGLE_OAUTH.get(`google_token:${s.sub}`);
  if (!tRaw) return { error: "no_token_row", sub: s.sub, sid };
  return { sid, sub: s.sub, t: JSON.parse(tRaw) };
}

/** Refresh if access_token expires in &lt; 60s; persist to KV. */
async function ensureFreshAccessToken(env, sub, t) {
  if (Date.now() < (t.expires_at || 0) - 60_000) {
    return { t };
  }
  if (!t.refresh_token) {
    return { error: "token_expired_reauth" };
  }
  const r = await refreshAccessToken(env, t.refresh_token);
  if (r.error) {
    return { error: r.error, details: r.details };
  }
  const next = {
    ...t,
    access_token: r.access_token,
    expires_at: Date.now() + (r.expires_in || 3600) * 1000,
    scope: r.scope || t.scope,
  };
  if (r.refresh_token) next.refresh_token = r.refresh_token;
  await env.GOOGLE_OAUTH.put(`google_token:${sub}`, JSON.stringify(next));
  return { t: next };
}

function buildReadyPayload(env, urlOrigin) {
  const id = (env.GOOGLE_CLIENT_ID || "").trim();
  return {
    ok: true,
    service: "p31-google-bridge",
    time: new Date().toISOString(),
    config: {
      client_id_set: id.length > 0 && !/^replace-me$/i.test(id),
      client_secret_set: Boolean(env.GOOGLE_CLIENT_SECRET),
      redirect_url: env.REDIRECT_URL || null,
      allowlist_size: parseList(env.OAUTH_RETURN_ALLOWLIST || "").length,
    },
    endpoints: {
      self: urlOrigin,
      auth: `${urlOrigin}/auth`,
      setup: `${urlOrigin}/setup`,
      oauth_start: `${urlOrigin}/oauth/google/start`,
      ready: `${urlOrigin}/api/google/ready`,
    },
  };
}

function setupPageHtml(request, env) {
  const u = new URL(request.url);
  const o = u.origin;
  const ready = buildReadyPayload(env, o);
  const scopes = (env.DEFAULT_OAUTH_SCOPES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Setup &amp; automation | P31 Google Bridge</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-dvh bg-[#0a0a0a] text-[#d8d6d0] p-6 font-sans text-sm max-w-3xl mx-auto">
  <h1 class="text-xl font-bold text-white border-b border-[#D94F3B] pb-2 mb-4">Google Bridge — setup &amp; efficiency</h1>
  <section class="mb-6">
    <h2 class="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">1. Google Cloud Console</h2>
    <p class="text-white/60 mb-2">Add these <strong>Authorized redirect URIs</strong> (exact match):</p>
    <pre class="bg-black/50 border border-white/10 rounded p-3 text-xs font-mono overflow-x-auto text-[#4db8a8]">${
      escapeHtml(env.REDIRECT_URL || "(set REDIRECT_URL in wrangler)")
    }</pre>
    <p class="text-white/50 mt-2 mb-1">Optional — <strong>Authorized JavaScript origins</strong>:</p>
    <pre class="bg-black/50 border border-white/10 rounded p-3 text-xs font-mono overflow-x-auto">${escapeHtml(o)}</pre>
  </section>
  <section class="mb-6">
    <h2 class="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">2. Scopes in Playground / app</h2>
    <ul class="list-disc pl-5 text-white/60 space-y-1">${scopes.map((s) => `<li class="font-mono text-xs">${escapeHtml(s)}</li>`).join("")}</ul>
  </section>
  <section class="mb-6">
    <h2 class="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">3. One-shot checks (copy)</h2>
    <pre class="bg-black/50 border border-white/10 rounded p-3 text-xs font-mono overflow-x-auto">curl -sS "${o}/api/google/ready" | jq

curl -sS "${o}/health"</pre>
  </section>
  <section class="mb-6">
    <h2 class="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">4. Readiness (live)</h2>
    <pre class="bg-black/50 border border-white/10 rounded p-3 text-xs font-mono overflow-x-auto">${
      escapeHtml(JSON.stringify(ready, null, 2))
    }</pre>
  </section>
  <p class="text-white/30 text-xs">Run <code class="text-white/50">npm run preflight</code> locally from <code>software/p31-google-bridge</code> before every deploy.</p>
  <p class="mt-4"><a class="text-[#4db8a8] underline" href="/auth">→ Web login /auth</a></p>
</body></html>`;
}

function authPageHtml(request, env) {
  const u = new URL(request.url);
  const origin = u.origin;
  const qReturn = u.searchParams.get("return");
  const qErr = u.searchParams.get("error");
  const errBanner = qErr
    ? `<p class="text-sm text-red-400/90 mb-4 p-2 rounded border border-red-500/30 bg-red-500/10">${escapeHtml(
        qErr
      )} — try OAuth again or check your token.</p>`
    : "";
  const safeReturn = validReturnUrl(qReturn, env) || "";
  const startUrl = safeReturn
    ? `${origin}/oauth/google/start?return=${encodeURIComponent(safeReturn)}`
    : `${origin}/oauth/google/start`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Web login — P31 Google Bridge</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-dvh bg-[#0f1115] text-[#d8d6d0] font-sans antialiased p-6">
  <div class="max-w-md mx-auto">
    <p class="text-xs uppercase tracking-widest text-white/30 mb-2">P31 / Google</p>
    <h1 class="text-2xl font-bold text-white border-b-4 border-[#D94F3B] inline-block pr-1 mb-4">Web login</h1>
    ${errBanner}
    <p class="text-sm text-white/60 mb-6">Use OAuth when Google is available. If not (stale blockers, headless, air‑gap prep), paste a <strong>refresh token</strong> (best) or short‑lived <strong>access token</strong>.</p>
    <a href="${startUrl}" class="block w-full text-center py-3.5 rounded-xl font-bold text-sm bg-[#25897d] hover:bg-[#2a9d8f] text-white mb-3">Sign in with Google</a>
    ${safeReturn ? `<p class="text-xs font-mono text-white/30 mb-6">After OAuth → ${escapeHtml(safeReturn)}</p>` : ""}
    <div class="border border-white/10 rounded-xl p-4 bg-white/[0.03]">
      <h2 class="text-sm font-bold text-white/80 mb-2">No OAuth? Paste a token</h2>
      <p class="text-xs text-white/40 mb-3">Get refresh token from <a class="text-[#4db8a8] underline" href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener">OAuth 2.0 Playground</a> (own OAuth client) or your machine’s <code class="text-white/50">gcloud</code> flow. Access tokens expire ~1h.</p>
      <form method="post" action="${origin}/api/tokens/submit" class="space-y-2">
        <input type="hidden" name="return" value="${escapeHtml(safeReturn)}" />
        <label class="block text-xs text-white/50">Refresh token (preferred)</label>
        <textarea name="refresh_token" rows="2" class="w-full text-xs font-mono bg-[#0a0a0a] border border-white/10 rounded p-2 text-white/80" placeholder="1//0e…" autocomplete="off"></textarea>
        <label class="block text-xs text-white/50 pt-1">Or access token only</label>
        <textarea name="access_token" rows="2" class="w-full text-xs font-mono bg-[#0a0a0a] border border-white/10 rounded p-2 text-white/80" placeholder="ya29.…" autocomplete="off"></textarea>
        <button type="submit" class="w-full py-2.5 rounded-lg font-bold text-sm bg-white/10 hover:bg-white/15 text-white">Submit &amp; open session</button>
      </form>
    </div>
    <p class="mt-6 text-xs font-mono text-white/20">
      <a class="text-[#4db8a8]" href="/setup">Setup checklist</a> ·
      <a class="text-[#4db8a8]" href="/api/google/me">Session JSON</a> ·
      <a class="text-[#4db8a8]" href="/oauth/google/logout">Log out</a>
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(request, env) });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    const ch = { ...cors(request, env) };

    if (path === "/auth" && request.method === "GET") {
      const html = authPageHtml(request, env);
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...ch },
      });
    }

    if (path === "/setup" && request.method === "GET") {
      const html = setupPageHtml(request, env);
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...ch },
      });
    }

    if (path === "/api/google/ready" && request.method === "GET") {
      return json(buildReadyPayload(env, url.origin), 200, { ...ch, "Cache-Control": "no-cache" });
    }

    if (path === "/health" || path === "/") {
      return json(
        {
          ...buildReadyPayload(env, url.origin),
          hints: { preflight: "npm run preflight in p31-google-bridge" },
        },
        200,
        { ...ch, "Cache-Control": "no-cache" }
      );
    }

    if (path === "/oauth/google/start" && request.method === "GET") {
      const state = await randomId();
      const wantReturn = url.searchParams.get("return");
      const returnUrl = validReturnUrl(wantReturn, env);
      const payload = returnUrl
        ? JSON.stringify({ v: 1, return: returnUrl })
        : "1";
      await env.GOOGLE_OAUTH.put(`state:${state}`, payload, { expirationTtl: STATE_TTL_SEC });
      return Response.redirect(googleAuthUrl(env, state), 302);
    }

    if (path === "/api/tokens/submit" && (request.method === "POST" || request.method === "PUT")) {
      if (!env.GOOGLE_CLIENT_SECRET) {
        return json({ error: "GOOGLE_CLIENT_SECRET_not_set" }, 500, ch);
      }
      let body = {};
      const ct = request.headers.get("Content-Type") || "";
      if (ct.includes("application/json")) {
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400, ch);
        }
      } else {
        const fd = await request.formData();
        body = {
          refresh_token: (fd.get("refresh_token") || "").trim(),
          access_token: (fd.get("access_token") || "").trim(),
          return: (fd.get("return") || "").trim() || null,
        };
      }
      const rt = (body.refresh_token || "").trim();
      const at = (body.access_token || "").trim();
      const ret = body.return ? validReturnUrl(String(body.return), env) : null;
      if (body.return && !ret) {
        const wantsJson = request.headers.get("Accept")?.includes("application/json");
        if (wantsJson) return json({ error: "invalid_return_url" }, 400, ch);
        return new Response("invalid return URL (not in OAUTH_RETURN_ALLOWLIST)", { status: 400, headers: ch });
      }
      if (!rt && !at) {
        if (ct.includes("application/json")) {
          return json({ error: "need_refresh_or_access_token" }, 400, ch);
        }
        return redirectResponse(ret || `${url.origin}/auth?error=missing_token`, null);
      }

      let access_token;
      let refresh_token = null;
      let expires_in = 3600;
      if (rt) {
        const ref = await refreshAccessToken(env, rt);
        if (ref.error) {
          if (ct.includes("application/json")) {
            return json({ error: ref.error, details: ref.details }, 400, ch);
          }
          return redirectResponse(`${url.origin}/auth?error=${encodeURIComponent(ref.error)}`);
        }
        access_token = ref.access_token;
        refresh_token = ref.refresh_token || rt;
        expires_in = ref.expires_in || 3600;
      } else {
        access_token = at;
        expires_in = 3600;
        refresh_token = null;
      }

      const out = await persistLogin(env, {
        access_token,
        refresh_token: refresh_token || (rt || null),
        expires_in,
        id_token: null,
        scope: null,
        emailHint: null,
        subHint: null,
        source: rt ? "manual_refresh" : "manual_access",
      });
      if (out.error) {
        if (ct.includes("application/json")) {
          return json({ error: out.error, details: out.details }, 400, ch);
        }
        return redirectResponse(`${url.origin}/auth?error=${encodeURIComponent(String(out.error))}`);
      }
      const setCookie = cookieHeader(COOKIE, out.sessionId, SESSION_TTL_SEC);
      const go = ret || env.OAUTH_SUCCESS_URL || `${url.origin}/connected`;
      if (ct.includes("application/json")) {
        return json(
          { ok: true, email: out.email, sub: out.sub, redirect: go },
          200,
          { ...ch, "Set-Cookie": setCookie }
        );
      }
      return redirectResponse(go, setCookie);
    }

    if (path === "/oauth/google/callback" && request.method === "GET") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const err = url.searchParams.get("error");
      if (err) return json({ error: err, from: "google" }, 400, ch);
      if (!code || !state) return json({ error: "missing_code_or_state" }, 400, ch);

      const st = await env.GOOGLE_OAUTH.get(`state:${state}`);
      if (!st) return json({ error: "invalid_or_expired_state" }, 400, ch);
      await env.GOOGLE_OAUTH.delete(`state:${state}`);

      let returnUrl = null;
      if (st && st !== "1") {
        try {
          returnUrl = JSON.parse(st).return || null;
        } catch { /* */ }
      }
      const safeReturn = returnUrl && validReturnUrl(returnUrl, env) ? returnUrl : null;

      if (!env.GOOGLE_CLIENT_SECRET) return json({ error: "GOOGLE_CLIENT_SECRET_not_set" }, 500, ch);
      const tok = await exchangeCode(env, code);
      if (tok.error) return json({ error: tok.error, details: tok.details }, 400, ch);

      const pl = await persistLogin(env, {
        access_token: tok.access_token,
        refresh_token: tok.refresh_token,
        expires_in: tok.expires_in,
        id_token: tok.id_token,
        scope: tok.scope,
        emailHint: null,
        subHint: null,
        source: "oauth",
      });
      if (pl.error) return json(pl, 500, ch);
      const setCookie = cookieHeader(COOKIE, pl.sessionId, SESSION_TTL_SEC);
      const redir = safeReturn || env.OAUTH_SUCCESS_URL || `https://p31ca.org/open-doc-suite.html`;
      return redirectResponse(redir, setCookie);
    }

    if (path === "/api/google/me" && request.method === "GET") {
      const x = await loadSubAndToken(request, env);
      if (x.error === "no_session") {
        return json({ connected: false }, 200, ch);
      }
      if (x.error === "session_expired") {
        return json({ connected: false, reason: "session_expired" }, 200, ch);
      }
      if (x.error === "no_token_row") {
        return json({ connected: false, sub: x.sub }, 200, ch);
      }
      const t = x.t;
      return json(
        {
          connected: true,
          email: t.email,
          sub: t.sub,
          scope: t.scope,
          has_refresh: Boolean(t.refresh_token),
          source: t.source || "unknown",
        },
        200,
        ch
      );
    }

    if (path === "/api/google/calendar/list" && request.method === "GET") {
      const x = await loadSubAndToken(request, env);
      if (x.error) {
        return json({ error: x.error }, 401, ch);
      }
      if (!x.t.access_token) return json({ error: "no_tokens" }, 500, ch);
      const fr = await ensureFreshAccessToken(env, x.sub, x.t);
      if (fr.error) {
        return json({ error: fr.error, details: fr.details || null }, 401, ch);
      }
      const t = fr.t;
      const cal = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=20", {
        headers: { Authorization: `Bearer ${t.access_token}` },
      });
      const data = await cal.json();
      if (!cal.ok) return json({ error: "calendar_api", details: data }, cal.status, ch);
      return json({ items: data.items || [] }, 200, ch);
    }

    if (path === "/oauth/google/logout" && request.method === "GET") {
      const sid = getCookie(request, COOKIE);
      if (sid) await env.GOOGLE_OAUTH.delete(`sess:${sid}`);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/auth",
          "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        },
      });
    }

    if (path === "/connected" && request.method === "GET") {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google — connected</title></head>
<body style="font-family:system-ui;padding:2rem;background:#0f1115;color:#d8d6d0">
<h1>Google account linked</h1>
<p><a style="color:#4db8a8" href="/api/google/me">/api/google/me</a> · <a style="color:#4db8a8" href="/api/google/calendar/list">Calendar list</a></p>
<p><a style="color:#4db8a8" href="/setup">/setup</a> (checklist) ·
<a style="color:#4db8a8" href="/api/google/ready">/api/google/ready</a> ·
<a style="color:#4db8a8" href="/oauth/google/start">Re-link (OAuth)</a> ·
<a style="color:#4db8a8" href="/auth">/auth</a></p>
</body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", ...ch } });
    }

    return json({ error: "not_found", path }, 404, ch);
  },
};
