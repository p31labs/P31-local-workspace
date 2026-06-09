#!/usr/bin/env node
/**
 * CWP-P31-MAP-2026-01 (D-MAP-4) — operator export handoff.
 * Production: list keys from the DONATE_EVENTS KV (after binding) or use the dashboard.
 * No secrets in this file.
 */

const help = `pipeline-export (MAP)

When DONATE_EVENTS KV is bound in donate-api, list keys (requires wrangler auth):

  cd 04_SOFTWARE/donate-api
  npx wrangler kv key list --binding=DONATE_EVENTS --prefix=stripe:event: --count=1000

For JSON lines to stdout (manual operator step until wrangler output is stable):

  npx wrangler kv key list --binding=DONATE_EVENTS --prefix=stripe:event: | ...

This script exits 0; use the commands above in ops runbooks.`;

// eslint-like: allow running as "documentation executable"
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(help);
  process.exit(0);
}

console.log(help);
process.exit(0);
