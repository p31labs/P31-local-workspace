#!/usr/bin/env node
/**
 * setup-webmcp-trial.mjs
 *
 * Injects the WebMCP origin trial token into all P31 app HTML shells.
 * Reads tokens from tokens.json at repo root. WEBMCP_ORIGIN_TRIAL_TOKEN
 * env var overrides for testing/deploy overrides.
 *
 * Tokens manifest shape (tokens.json):
 * {
 *   "version": 1,
 *   "origins": {
 *     "p31ca.org": {
 *       "webmcp": {
 *         "google": { "token": "...", "expires": "...", ... },
 *         "microsoft": { "status": "deferred" | "active", ... }
 *       }
 *     }
 *   }
 * }
 *
 * Usage:
 *   WEBMCP_ORIGIN_TRIAL_TOKEN="token" node scripts/setup-webmcp-trial.mjs
 *   node scripts/setup-webmcp-trial.mjs --origin phosphorus31.org
 *   node scripts/setup-webmcp-trial.mjs --dry-run
 *
 * Set WEBMCP_ORIGIN_TRIAL_TOKEN to empty to clear tokens from all shells.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const ROOT = resolve(__dirname, '..');
const PLACEHOLDER = '__WEBMCP_ORIGIN_TRIAL_TOKEN__';
const TOKENS_PATH = resolve(ROOT, 'tokens.json');

// The deployed portals live under /home/p31/production (sibling of this workspace).
const PORTAL_ROOT = resolve(ROOT, '..', 'production');

const args = process.argv.slice(2);
const overrideToken = process.env.WEBMCP_ORIGIN_TRIAL_TOKEN ?? null;
const dryRun = args.includes('--dry-run');
const flagOrigin = args.find((a) => a.startsWith('--origin='))?.split('=')[1]
  ?? args.find((a) => a.startsWith('--origin'))?.split(' ')[1]
  ?? null;

function loadTokens() {
  if (!existsSync(TOKENS_PATH)) {
    console.warn(`[warn] tokens.json not found at ${TOKENS_PATH}`);
    return null;
  }
  try {
    const raw = readFileSync(TOKENS_PATH, 'utf-8');
    const data = JSON.parse(raw);
    if (data.version !== 1) {
      console.warn(`[warn] tokens.json version ${data.version} — expected 1`);
    }
    return data;
  } catch (e) {
    console.error(`[error] Failed to parse tokens.json: ${e.message}`);
    return null;
  }
}

function getGoogleToken(tokens, origin) {
  if (overrideToken !== null) return overrideToken;
  if (!tokens) return null;
  const entry = tokens.origins?.[origin];
  if (!entry?.webmcp?.google?.token) return null;
  return entry.webmcp.google.token;
}

function getDeferredOrigins(tokens) {
  if (!tokens) return [];
  const deferred = [];
  for (const [origin, data] of Object.entries(tokens.origins ?? {})) {
    const ms = data.webmcp?.microsoft;
    if (ms && (ms.status === 'deferred' || ms.status === 'expired')) {
      deferred.push({ origin, ...ms });
    }
  }
  return deferred;
}

function detectOrigin(htmlFiles) {
  for (const f of htmlFiles) {
    if (!existsSync(resolve(ROOT, f))) continue;
    const content = readFileSync(resolve(ROOT, f), 'utf-8');
    const m = content.match(/data-brand="(phos|willow|bonding|phosphorus31|tetra-ops|agent-demo)"/);
    if (m) {
      const brand = m[1];
      if (brand === 'phosphorus31') return 'phosphorus31.org';
      return 'p31ca.org';
    }
  }
  return null;
}

const htmlFiles = [
  'apps/phos/index.html',
  'apps/willow/index.html',
  'apps/bonding/public/index.html',
  'apps/phosphorus31/index.html',
  'apps/phosphorus31/deploy/index.html',
  'apps/tetra-ops/index.html',
  'apps/agent-demo/public/index.html',
];

const workerFiles = [
  resolve(ROOT, 'workers/phosphorus31/src/index.ts'),
  resolve(ROOT, 'workers/federation-bridge/src/index.ts'),
];

const envFiles = [
  resolve(ROOT, 'apps/p31ca/.env'),
  resolve(ROOT, 'apps/phosphorus31/.env'),
  resolve(ROOT, 'apps/phos/.env'),
  resolve(ROOT, 'apps/willow/.env'),
  resolve(ROOT, 'apps/bonding/.env'),
];

const headerFiles = [
  'apps/bonding/public/_headers',
  'apps/willow/public/_headers',
];

// Portal _headers are served verbatim by Cloudflare Pages, so they get the real
// token (not the placeholder) — the token is swapped in directly. The _headers
// file lives at the portal root (deploy-unified copies it into dist) except QPJ
// and chat, which ship it from public/.
//
// Phase 1 enrolls qpj only. Add sibling portals to this array as they join the
// WebMCP origin trial.
const portalHeaderFiles = [
  'portals/qpj/public/_headers',
];

// Portal dist HTML shells (post-build) for the meta-tag fallback.
const portalHtmlFiles = [
  'portals/qpj/dist/index.html',
];

const tokens = loadTokens();
const origin = flagOrigin ?? detectOrigin(htmlFiles) ?? 'p31ca.org';
const token = getGoogleToken(tokens, origin);
const deferred = getDeferredOrigins(tokens);

const modified = [];

if (dryRun) {
  console.log(`[dry-run] Origin: ${origin}`);
  console.log(`[dry-run] Token: ${token ? 'set' : 'not set (placeholder)'}`);
  console.log(`[dry-run] Deferred origins: ${deferred.length}`);
  for (const d of deferred) {
    console.log(`  ${d.origin}: ${d.status} (${d.reason})`);
  }
  console.log(`[dry-run] Would process ${htmlFiles.length} HTML files, ${envFiles.length} env files, ${headerFiles.length} header files, ${portalHeaderFiles.length + portalHtmlFiles.length} portal files`);
  console.log('[dry-run] No files modified.');
} else {
  for (const filePath of htmlFiles) {
    const absPath = resolve(ROOT, filePath);
    if (!existsSync(absPath)) {
      console.warn(`[warn] File not found: ${absPath}`);
      continue;
    }

    let content = readFileSync(absPath, 'utf-8');
    const original = content;

    if (token) {
      const metaTag = `<meta http-equiv="origin-trial" content="${PLACEHOLDER}">`;
      const oldMetaMatches = content.match(/<meta[^>]*origin-trial[^>]*>/gi) ?? [];
      if (oldMetaMatches.length > 0) {
        content = content.replace(/<meta[^>]*origin-trial[^>]*>/gi, metaTag);
      } else if (!content.includes(PLACEHOLDER)) {
        const headMatch = content.match(/<head>/i);
        if (headMatch && typeof headMatch.index === 'number') {
          const idx = headMatch.index + headMatch[0].length;
          content = content.slice(0, idx) + '\n    ' + metaTag + content.slice(idx);
        }
      }
    } else {
      content = content.replace(
        new RegExp(`\\s*<meta[^>]*origin-trial[^>]*>\\s*`, 'gi'),
        '',
      );
    }

    if (content !== original) {
      writeFileSync(absPath, content, 'utf-8');
      modified.push(relative(ROOT, absPath));
    }
  }

  if (token) {
    for (const wpath of workerFiles) {
      if (!existsSync(wpath)) continue;
      let wcontent = readFileSync(wpath, 'utf-8');
      const woriginal = wcontent;
      // Only clobber real origin-trial tokens: long base64 strings containing
      // '+'/'/'/='. A plain alphanumeric const (e.g. a base58 alphabet) stays put.
      wcontent = wcontent.replace(
        /(const\s+\w+\s*=\s*['"])[A-Za-z0-9+/=_\-]{80,}(['"];)/,
        `$1${PLACEHOLDER}$2`,
      );
      wcontent = wcontent.replace(
        /(header\(['"]Origin-Trial['"],\s*['"])([A-Za-z0-9+/=]+)(['"]\);)/,
        `$1${PLACEHOLDER}$3`,
      );
      if (wcontent !== woriginal) {
        writeFileSync(wpath, wcontent, 'utf-8');
        modified.push(relative(ROOT, wpath));
      }
    }

    for (const envPath of envFiles) {
      try {
        let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
        const isAstro = envPath.includes('p31ca') || envPath.includes('phosphorus31');
        const varName = isAstro ? 'PUBLIC_WEBMCP_ORIGIN_TRIAL' : 'VITE_WEBMCP_ORIGIN_TRIAL';
        const line = `${varName}=${token}\n`;

        if (!envContent.includes('WEBMCP_ORIGIN_TRIAL')) {
          envContent += `\n# WebMCP Origin Trial\n${line}`;
          writeFileSync(envPath, envContent, 'utf-8');
          modified.push(relative(ROOT, envPath));
        }
      } catch {
        // skip unwritable env files
      }
    }

    for (const filePath of headerFiles) {
      const absPath = resolve(ROOT, filePath);
      if (!existsSync(absPath)) continue;
      let content = readFileSync(absPath, 'utf-8');
      const original = content;
      if (token) {
        content = content.replace(
          /(Origin-Trial:\s*)[A-Za-z0-9+/=]+/g,
          `$1${PLACEHOLDER}`,
        );
        content = content.replace(
          /^(Origin-Agent-Cluster:\s*).*$/m,
          `$1?1`,
        );
        if (!/Origin-Agent-Cluster/.test(content)) {
          content = content.replace(
            /^(Origin-Trial:.*)$/m,
            `$1\nOrigin-Agent-Cluster: ?1`,
          );
        }
      } else {
        content = content.replace(/^Origin-Trial:.*$/m, '');
        content = content.replace(/^Origin-Agent-Cluster:.*$/m, '');
      }
      if (content !== original) {
        writeFileSync(absPath, content, 'utf-8');
        modified.push(relative(ROOT, absPath));
      }
    }

    // Portals: served verbatim by Cloudflare Pages — swap the real token in.
    for (const filePath of portalHeaderFiles) {
      const absPath = resolve(PORTAL_ROOT, filePath);
      if (!existsSync(absPath)) continue;
      let content = readFileSync(absPath, 'utf-8');
      const original = content;
      if (token) {
        if (/^Origin-Trial:/m.test(content)) {
          content = content.replace(/^Origin-Trial:\s*.*$/m, `Origin-Trial: ${token}`);
        } else {
          content = content.replace(
            /(^Referrer-Policy:.*$\n?)/m,
            `$1Origin-Trial: ${token}\n`,
          );
        }
        if (/^Origin-Agent-Cluster:/m.test(content)) {
          content = content.replace(/^Origin-Agent-Cluster:\s*.*$/m, `Origin-Agent-Cluster: ?1`);
        } else {
          content = content.replace(
            /(^Origin-Trial:.*$\n?)/m,
            `$1Origin-Agent-Cluster: ?1\n`,
          );
        }
      } else {
        content = content.replace(/^Origin-Trial:.*$\n?/m, '');
        content = content.replace(/^Origin-Agent-Cluster:.*$\n?/m, '');
      }
      if (content !== original) {
        writeFileSync(absPath, content, 'utf-8');
        modified.push(relative(ROOT, absPath));
      }
    }

    for (const filePath of portalHtmlFiles) {
      const absPath = resolve(PORTAL_ROOT, filePath);
      if (!existsSync(absPath)) continue;
      let content = readFileSync(absPath, 'utf-8');
      const original = content;
      const metaTag = `<meta http-equiv="origin-trial" content="${token ?? ''}">`;
      if (token) {
        content = content.replace(/<meta[^>]*http-equiv="origin-trial"[^>]*>/gi, metaTag);
      } else {
        content = content.replace(/\s*<meta[^>]*http-equiv="origin-trial"[^>]*>/gi, '');
      }
      if (content !== original) {
        writeFileSync(absPath, content, 'utf-8');
        modified.push(relative(ROOT, absPath));
      }
    }
  }

  console.log('\n=== WebMCP Origin Trial Injection Summary ===');
  if (modified.length === 0) {
    console.log('No files modified.');
  } else {
    for (const f of modified) {
      console.log(`  ✔ ${f}`);
    }
  }
  console.log(`\nToken ${token ? 'injected' : 'cleared'} for origin ${origin} across ${modified.length} file(s).`);

  if (deferred.length > 0) {
    console.log('\n=== Deferred Origin Trials ===');
    for (const d of deferred) {
      console.log(`  ${d.origin}: ${d.status} — ${d.reason}`);
      if (d.nextAction) console.log(`    → ${d.nextAction}`);
    }
  }
}
