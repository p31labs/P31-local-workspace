#!/usr/bin/env node
/**
 * generate-core-inventory.mjs
 *
 * Cycle 1 — generates the "what actually exists" side of the canonical core.
 * Walks both repos (P31-local-workspace source monorepo + production portal
 * repo) and emits inventory.json: every package, worker, MCP server, surface,
 * ledger, payment rail, and contract artifact.
 *
 * Classification (Layer 0-3 / retire) is AUTHORED in docs/00-CANONICAL-CORE.yaml.
 * This script only generates what exists. It never guesses a layer.
 *
 * Usage: node scripts/generate-core-inventory.mjs [--json]
 * Output: inventory.json (or stdout with --json)
 */

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = import.meta.url ? join(process.cwd()) : null
const ROOT = join(process.cwd())
const WORKSPACE = '/home/p31/P31-local-workspace'
const PRODUCTION = '/home/p31/production'

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'out',
  'archive',
  'stash-archive-export',
  '_template',
  'vendor',
  'generated',
  'cache',
  'lib',
  '.turbo',
  'storybook-static',
  'test-results',
  'playwright-report',
  '.wrangler',
  'tmp',
  'logs',
  'patches',
])

const MCP_HINTS = [
  /mcp/i,
  /model.?context/i,
  /webmcp/i,
]
const LEDGER_HINTS = [/love/i, /ledger/i, /economy/i, /revenue/i, /invoice/i, /account/i, /tokenomics/i]
const PAYMENT_HINTS = [/stripe/i, /gumroad/i, /kofi/i, /paypal/i, /btcpay/i, /blockonomics/i, /x402/i, /checkout/i, /payment/i, /settle/i, /wallet/i]
const SURFACE_HINTS = [/portal/i, /shell/i, /site/i, /www/i, /app/i, /desktop/i, /dashboard/i, /marketing/i, /game/i, /arcade/i]
const IDENTITY_HINTS = [/identity/i, /passport/i, /sovereign/i, /did/i, /eudi/i, /credential/i]
const TOKEN_HINTS = [/design-core/i, /design-system/i, /token/i, /theme/i, /skin/i, /icons/i]

/**
 * Find package.json in a dir and lineage.
 */
function readManifest(dir) {
  const p = join(dir, 'package.json')
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf-8'))
  } catch {
    return null
  }
}

/**
 * Walk a directory for subdirectories that look like artifact roots
 * (dir has package.json OR is a known leaf artifact).
 */
function collectArtifacts(root) {
  const artifacts = []
  const scan = (dir, depth) => {
    if (depth > 6) return
    let entries = []
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      if (EXCLUDED_DIRS.has(entry)) continue
      if (entry.startsWith('.') && entry !== '.well-known') continue
      const full = join(dir, entry)
      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }
      if (!st.isDirectory()) continue

      const hasPkg = existsSync(join(full, 'package.json'))
      // wrangler workers sometimes lack package.json; detect wrangler.toml/jsonc
      const hasWrangler =
        existsSync(join(full, 'wrangler.toml')) ||
        existsSync(join(full, 'wrangler.jsonc')) ||
        existsSync(join(full, 'wrangler.json'))
      const hasTsc = existsSync(join(full, 'tsconfig.json'))

      if (hasPkg || hasWrangler) {
        artifacts.push({ dir: full, hasPkg, hasWrangler, hasTsc })
      }
      // always drill into subdirectories; only true roots (pkg/wrangler) are emitted
      if (entry !== 'node_modules') scan(full, depth + 1)
    }
  }
  scan(root, 0)
  return artifacts
}

function classifyHints(path, manifest) {
  const hay = `${path} ${manifest?.name ?? ''} ${manifest?.description ?? ''}`
  const flags = {
    mcp: MCP_HINTS.some((r) => r.test(hay)),
    ledger: LEDGER_HINTS.some((r) => r.test(hay)),
    payment: PAYMENT_HINTS.some((r) => r.test(hay)),
    surface: SURFACE_HINTS.some((r) => r.test(hay)),
    identity: IDENTITY_HINTS.some((r) => r.test(hay)),
    token: TOKEN_HINTS.some((r) => r.test(hay)),
  }
  // kind detection
  let kind = 'package'
  if (flags.mcp) kind = 'mcp-server'
  else if (flags.ledger) kind = 'ledger'
  else if (flags.payment) kind = 'payment-rail'
  else if (flags.surface) kind = 'surface'
  else if (flags.identity) kind = 'identity'
  else if (flags.token) kind = 'design-token'
  if (path.includes('/workers/')) kind = 'worker'
  else if (path.includes('/software/workers/')) kind = 'worker'
  if (path.includes('/portals/')) kind = 'surface'
  if (path.includes('/apps/')) kind = 'surface'
  if (kind === 'worker' && flags.mcp) kind = 'mcp-server'
  return { kind, flags }
}

function main() {
  const report = []
  const seen = new Set()

  const add = (root, repo) => {
    for (const { dir, hasPkg, hasWrangler } of collectArtifacts(root)) {
      const rel = relative('/home/p31', dir)
      if (seen.has(rel)) continue
      seen.add(rel)
      const manifest = readManifest(dir)
      const { kind, flags } = classifyHints(dir, manifest)
      report.push({
        path: rel,
        repo,
        name: manifest?.name ?? basename(dir),
        kind,
        manifests: { package: hasPkg, wrangler: hasWrangler },
        hints: flags,
      })
    }
  }

  add(WORKSPACE, 'workspace')
  add(PRODUCTION, 'production')

  // Sort: repo, then path
  report.sort((a, b) => (a.repo === b.repo ? a.path.localeCompare(b.path) : a.repo.localeCompare(b.repo)))

  const out = { generated_at: new Date().toISOString(), repos: { workspace: WORKSPACE, production: PRODUCTION }, count: report.length, artifacts: report }
  const json = JSON.stringify(out, null, 2)
  const toStdout = process.argv.includes('--json')
  if (toStdout) {
    console.log(json)
  } else {
    const dest = join(ROOT, 'inventory.json')
    writeFileSync(dest, json)
    console.log(`Inventory: ${report.length} artifacts → ${dest}`)
  }
}

main()