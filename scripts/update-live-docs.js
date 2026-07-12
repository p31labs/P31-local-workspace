#!/usr/bin/env node
// update-live-docs.js — Query D1 for pilot data, replace {{PLACEHOLDERS}} in docs, write files.
// Used by .github/workflows/update-live-docs.yml

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(process.cwd());
const DOCS_DIR = resolve(ROOT, 'docs');

function query(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  const result = execSync(
    `npx wrangler d1 execute love-ledger --command "${escaped}" --json`,
    { encoding: 'utf8', cwd: ROOT }
  );
  const parsed = JSON.parse(result);
  return parsed[0]?.results || [];
}

// 1. Fetch pilot data
const pilots = query(`
  SELECT p.did, p.family_name, p.status, p.onboarded_at, p.active_nodes, p.mesh_health,
         COUNT(c.id) as care_events
  FROM pilot_registry p
  LEFT JOIN love_chain c ON c.from_did = p.did AND c.type = 'transfer'
  GROUP BY p.did
  ORDER BY p.onboarded_at ASC
`);

// 2. Fetch node data
const nodes = query(`
  SELECT r.node_id, r.family_did, r.last_seen, r.firmware_version, r.battery_level,
         p.family_name
  FROM node_registry r
  JOIN pilot_registry p ON p.did = r.family_did
  ORDER BY p.family_name, r.last_seen DESC
`);

// 3. Render markdown tables
function renderPilotTable(pilots) {
  if (!pilots.length) return '*No pilots registered yet.*';
  let md = '| Family | Status | Nodes | Mesh Health | Care Events | Onboarded |\n';
  md += '|--------|--------|-------|-------------|-------------|-----------|\n';
  for (const p of pilots) {
    const date = p.onboarded_at ? new Date(p.onboarded_at).toLocaleDateString() : 'unknown';
    md += `| ${p.family_name || p.did} | ${p.status || 'pending'} | ${p.active_nodes || 0} | ${(p.mesh_health || 0).toFixed(2)} | ${p.care_events || 0} | ${date} |\n`;
  }
  return md;
}

function renderNodeTable(nodes) {
  if (!nodes.length) return '*No nodes registered yet.*';
  let md = '| Node ID | Family | Last Seen | Firmware | Battery |\n';
  md += '|---------|--------|-----------|----------|---------|\n';
  for (const n of nodes) {
    const seen = n.last_seen ? new Date(n.last_seen).toLocaleString() : 'unknown';
    md += `| ${n.node_id} | ${n.family_name || n.family_did} | ${seen} | ${n.firmware_version || 'unknown'} | ${n.battery_level != null ? n.battery_level + '%' : '?'} |\n`;
  }
  return md;
}

const pilotTable = renderPilotTable(pilots);
const nodeTable = renderNodeTable(nodes);
const activePilots = pilots.filter(p => p.status === 'active').length;
const stats = `**Active pilots:** ${activePilots}/${pilots.length}`;

let totalLOVE = 0;
try {
  const loveTotal = query('SELECT SUM(amount) as total FROM love_chain WHERE type = "love_withdraw"');
  totalLOVE = loveTotal[0]?.total || 0;
} catch {}

const avgCurvature = pilots.length
  ? (pilots.reduce((acc, p) => acc + (p.mesh_health || 0), 0) / pilots.length).toFixed(3)
  : '0.000';
const worstNode = nodes.length
  ? nodes.reduce((a, b) => (a.battery_level || 100) < (b.battery_level || 100) ? a : b).node_id
  : 'none';
const totalSBTs = pilots.reduce((acc, p) => acc + (p.care_events || 0), 0);

// 4. Replace placeholders in doc files
function updateDoc(filename, replacements) {
  const path = resolve(DOCS_DIR, filename);
  if (!existsSync(path)) {
    console.log(`  Skip ${filename} (not found)`);
    return;
  }
  let content = readFileSync(path, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  }
  writeFileSync(path, content);
  console.log(`  Updated ${filename}`);
}

console.log('=== P31 Live Docs Update ===');
console.log(`Pilots: ${pilots.length}, Nodes: ${nodes.length}, Active: ${activePilots}`);

updateDoc('MESH_RESILIENCE_RESEARCH_NOTE.md', {
  PILOT_TABLE: pilotTable,
  NODE_TABLE: nodeTable,
  AVG_CURVATURE: avgCurvature,
  WORST_NODE: worstNode,
  LAST_UPDATE: new Date().toISOString(),
});

updateDoc('LOVE_TOKENOMICS_WHITE_PAPER.md', {
  PILOT_SUMMARY: stats,
  FAMILY_COUNT: pilots.length,
  ACTIVE_WORKERS: activePilots,
  TOTAL_LOVE: totalLOVE,
  TOTAL_SBTS: totalSBTs,
  LAST_UPDATE: new Date().toISOString(),
});

console.log('Docs updated.');
