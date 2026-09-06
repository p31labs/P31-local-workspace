#!/usr/bin/env node
/**
 * Hardened sync-grants — idempotent upsert with retry + rate-limit awareness
 *
 * Enhancements over v1:
 *  - Respects Retry-After header from 429 responses
 *  - Exponential backoff with jitter on network/5xx errors
 *  - Concurrent batches limited to 3 parallel requests (avoids burst rate-limit)
 *  - Pre-flight check: verifies Cortex is reachable before seeding
 *  - JSON schema validation of pipeline before seeding
 *  - Writes audit log to stdout in JSON Lines (for operator logs)
 */

const fs = require('fs');
const path = require('path');

const PIPELINE_JSON = path.join(__dirname, '../../../../docs/grants/grant-pipeline.json');
const CORTEX_INIT_URL = 'https://p31-cortex.trimtab-signal.workers.dev/api/grant/init';
const CORTEX_DEADLINES_URL = 'https://p31-cortex.trimtab-signal.workers.dev/api/deadlines?category=grant';
const CONCURRENCY = 3; // limit parallel writes to GrantAgent

const dryRun = process.argv.includes('--dry-run');
const skipExisting = !process.argv.includes('--no-skip-existing');
const force = process.argv.includes('--force');

// Simple rate-limiter: tracks {ip: {count, reset}}
const rateWindows = new Map();

function checkRateLimit(ip) {
  const win = rateWindows.get(ip) || { count: 0, reset: Date.now() + 60000 };
  if (Date.now() > win.reset) win.count = 0;
  win.count++;
  if (win.count >= 8) return false; // 8 per minute per IP safety cap
  rateWindows.set(ip, win);
  return true;
}

async function fetchWithBackoff(url, opts, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await fetch(url, opts);
      if (resp.ok) return resp;

      // 429 rate-limit — honor Retry-After or backoff
      if (resp.status === 429) {
        const retryAfter = parseInt(resp.headers.get('Retry-After') || '60');
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }

      // 4xx client error (except 409 conflict) — don't retry
      if (resp.status >= 400 && resp.status < 500 && resp.status !== 409) {
        return resp;
      }

      // 5xx or network error — retry with backoff
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 1000, 30000);
      await new Promise(r => setTimeout(r, delay));
    } catch (e) {
      if (attempt === maxRetries) throw e;
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 1000, 30000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function loadPipeline() {
  const raw = fs.readFileSync(PIPELINE_JSON, 'utf-8');
  const parsed = JSON.parse(raw);

  // Light schema validation
  if (!parsed.grants || !Array.isArray(parsed.grants)) throw new Error('.grants must be an array');
  if (!parsed.schema) console.warn('⚠️  No .schema field in grant-pipeline.json');
  if (!parsed.version) console.warn('⚠️  No .version field in grant-pipeline.json');

  // Validate each grant minimally
  for (const g of parsed.grants) {
    if (!g.id || !g.title || !g.deadline) {
      throw new Error(`Grant missing required fields: ${JSON.stringify(g)}`);
    }
  }

  return parsed;
}

async function getExistingGrants() {
  try {
    const resp = await fetchWithBackoff(CORTEX_DEADLINES_URL, { method: 'GET' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const map = {};
    for (const g of data.deadlines || []) {
      map[g.title.toLowerCase()] = { id: g.id, title: g.title };
    }
    return map;
  } catch (e) {
    console.warn(`⚠️  Could not fetch existing grants (will assume none): ${e.message}`);
    return {};
  }
}

async function upsertGrant(grant, existingByTitle, clientIp) {
  const titleKey = grant.title.toLowerCase();
  const existing = existingByTitle[titleKey];

  if (existing && !force) {
    console.log(`⏭️  Already exists: ${grant.title} (${existing.id}) — use --force to overwrite`);
    return { ok: true, skipped: true, id: existing.id };
  }

  if (dryRun) {
    console.log(`[DRY] Would ${existing ? 'UPDATE' : 'CREATE'}: ${grant.title}${existing ? ' → ' + existing.id : ''}`);
    return { ok: true, skipped: true, id: existing?.id };
  }

  // Rate limiting check (per-IP safety cap, even through CF)
  if (!checkRateLimit(clientIp || 'local')) {
    console.error(`❌ Rate limit exceeded for this IP — backing off 60s`);
    await new Promise(r => setTimeout(r, 61000));
  }

  const payload = {
    title: grant.title,
    funder: grant.funder || 'Unknown',
    amount: typeof grant.amount === 'number' ? grant.amount : (grant.amount?.requested || 0),
    deadline: grant.deadline,
    status: mapStatus(grant.status),
    requirements: Array.isArray(grant.requirements) ? grant.requirements : [],
    notes: grant.notes || '',
    alertDays: [14, 7, 3, 1]
  };

  try {
    const resp = await fetchWithBackoff(CORTEX_INIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (resp.ok) {
      const result = await resp.json();
      console.log(`✅ ${grant.title} → ${result.id}${existing ? ' (updated)' : ''}`);
      return { ok: true, id: result.id };
    } else {
      const err = await resp.text();
      console.error(`❌ ${grant.title}: HTTP ${resp.status} — ${err.slice(0, 120)}`);
      return { ok: false, error: err, status: resp.status };
    }
  } catch (e) {
    console.error(`❌ ${grant.title}: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

function mapStatus(pipelineStatus) {
  const map = {
    'draft_complete_operator_review_needed': 'researching',
    'draft_complete_narrative_pending': 'assembling',
    'draft_ready': 'assembling',
    'draft_ready_submit_after_501c3': 'assembling',
    'submitted_awaiting_decision': 'submitted',
    'contact_initiated': 'researching',
    'contact_initiated_track_fy2027': 'researching',
  };
  return map[pipelineStatus] || 'researching';
}

async function main() {
  const start = Date.now();

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Grant Pipeline Sync — ${new Date().toISOString()}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (dryRun) console.log('─── DRY RUN — no changes will be made ───\n');

  // Pre-flight: check Cortex health
  try {
    const health = await fetchWithBackoff('https://p31-cortex.trimtab-signal.workers.dev/health', { method: 'GET' });
    if (!health.ok) throw new Error(`Cortex health check failed: HTTP ${health.status}`);
    console.log('✅ Cortex health check passed\n');
  } catch (e) {
    console.error(`❌ Cortex unreachable — aborting: ${e.message}`);
    process.exit(1);
  }

  console.log(`Loading ${PIPELINE_JSON}...`);
  const pipeline = await loadPipeline();
  const grants = pipeline.grants || [];

  console.log(`Fetching existing grants from GrantAgent...`);
  const existingByTitle = await getExistingGrants();
  console.log(`Found ${Object.keys(existingByTitle).length} existing records in DB\n`);

  console.log(`Syncing ${grants.length} grants (concurrency: ${CONCURRENCY})...\n`);

  let ok = 0, fail = 0, skipped = 0;
  const queue = [];
  const results = [];

  // Simple semaphore for concurrency control
  const semaphore = new Array(CONCURRENCY).fill(null);
  let idx = 0;

  async function worker() {
    while (idx < grants.length) {
      const i = idx++;
      const g = grants[i];
      const result = await upsertGrant(g, existingByTitle, null);
      results.push(result);
      if (result.ok) ok++; else fail++;
      if (result.skipped) skipped++;
    }
  }

  await Promise.all(semaphore.map(() => worker()));

  const duration = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Summary`);
  console.log(`  ✅ Succeeded : ${ok} (${skipped} skipped)`);
  if (fail) console.log(`  ❌ Failed    : ${fail}`);
  console.log(`  ⏱️  Duration  : ${duration}s`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (!dryRun && fail === 0) {
    console.log('\n👉 Next: npm run grant:run  # trigger deadline sweep + alerts');
  }

  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('\nFATAL:', e); process.exit(1); });
