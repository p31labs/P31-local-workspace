#!/usr/bin/env node
/**
 * audit-ticket-sync.mjs — read .p31/audit/P31_AUDIT_MANIFEST.yaml and post open findings
 * to GitHub Issues (or Discord webhook).
 *
 * Usage: node scripts/audit-ticket-sync.mjs [--dry-run] [--channel github|discord]
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(new URL('.', import.meta.url)));
const ROOT = join(__dirname, '..');
const AUDIT_FILE = join(ROOT, '.p31/audit/P31_AUDIT_MANIFEST.yaml');
const DRY_RUN = process.argv.includes('--dry-run');
const CHANNEL = process.argv.find(a => a === 'github' || a === 'discord') || 'github';

function parseYamlFindings(text) {
  const findings = [];
  const blocks = text.split(/^  - id: /m).filter(Boolean);
  for (const block of blocks) {
    const id = block.match(/^(\S+)/)?.[1];
    const title = block.match(/title: "([^"]+)"/)?.[1];
    const severity = block.match(/severity: (\w+)/)?.[1];
    const status = block.match(/status: (\w+)/)?.[1];
    const location = block.match(/location: "([^"]+)"/)?.[1];
    if (id && title && status === 'open') {
      findings.push({ id, title, severity, location });
    }
  }
  return findings;
}

async function main() {
  if (!existsSync(AUDIT_FILE)) {
    console.log('No audit manifest found at', AUDIT_FILE);
    process.exit(0);
  }

  const text = readFileSync(AUDIT_FILE, 'utf8');
  const findings = parseYamlFindings(text);
  console.log(`Found ${findings.length} open findings`);

  if (DRY_RUN) {
    for (const f of findings) console.log(`  [DRY] ${f.id}: ${f.severity} - ${f.title}`);
    process.exit(0);
  }

  if (CHANNEL === 'github') {
    console.log('Posting to GitHub Issues requires gh CLI + repo secrets. Run manually:');
    for (const f of findings) {
      console.log(`  gh issue create --title "[${f.id}] ${f.title}" --label "audit,${f.severity}" --body "${f.location}"`);
    }
  } else if (CHANNEL === 'discord') {
    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (!webhook) {
      console.error('DISCORD_WEBHOOK_URL not set');
      process.exit(1);
    }
    for (const f of findings) {
      const payload = JSON.stringify({
        content: `**${f.id}** [${f.severity}] ${f.title}\n\`${f.location}\``,
      });
      await fetch(webhook, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' } });
    }
    console.log(`Posted ${findings.length} findings to Discord`);
  }
}

main();
