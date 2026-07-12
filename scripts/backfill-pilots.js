#!/usr/bin/env node
// backfill-pilots.js — Run once to populate pilot_registry from existing data.
// Uses wrangler d1 execute --json output.

import { execSync } from 'child_process';

function query(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  const result = execSync(
    `npx wrangler d1 execute love-ledger --command "${escaped}" --json`,
    { encoding: 'utf8', cwd: process.cwd() }
  );
  const parsed = JSON.parse(result);
  return parsed[0]?.results || [];
}

console.log('=== P31 Pilot Backfill ===');

// Get all accounts that might be pilots
const accounts = query(`
  SELECT DISTINCT from_did as did FROM love_chain WHERE type = 'transfer'
  UNION
  SELECT DISTINCT did FROM love_accounts WHERE balance > 0 OR staked > 0
`);

console.log(`Found ${accounts.length} candidate pilots.`);

let added = 0;
for (const row of accounts) {
  const did = row.did;
  if (!did) continue;

  // Check if already in pilot_registry
  const existing = query(`SELECT did FROM pilot_registry WHERE did = "${did}"`);
  if (existing.length) {
    console.log(`  Skip ${did} (already registered)`);
    continue;
  }

  // Get first love_chain entry for metadata
  const name = query(`SELECT metadata FROM love_chain WHERE from_did = "${did}" LIMIT 1`);
  let family_name = did;
  if (name.length && name[0].metadata) {
    try {
      const meta = JSON.parse(name[0].metadata);
      family_name = meta.family_name || did;
    } catch {}
  }

  // Get active nodes from hardware_pairings (if table exists)
  let active_nodes = 0;
  try {
    const nodes = query(`SELECT COUNT(*) as cnt FROM hardware_pairings WHERE subject_id = "${did}"`);
    active_nodes = nodes[0]?.cnt || 0;
  } catch {
    // hardware_pairings table may not exist
  }

  const onboarded_at = Date.now();
  query(`
    INSERT INTO pilot_registry (did, family_name, status, onboarded_at, active_nodes, mesh_health)
    VALUES ("${did}", "${family_name}", "active", ${onboarded_at}, ${active_nodes}, 0.8)
  `);
  console.log(`  Added pilot ${family_name} (${did}) with ${active_nodes} nodes`);
  added++;
}

console.log(`\nBackfill complete. ${added} new pilots added.`);
