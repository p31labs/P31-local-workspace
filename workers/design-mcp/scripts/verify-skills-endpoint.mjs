#!/usr/bin/env node
/**
 * Integration test: verifies the design-mcp Worker serves skills over MCP.
 *
 * Spawns `wrangler dev`, POSTs a JSON-RPC tools/call for get_skill,
 * asserts the response body contains known content, then shuts down.
 *
 * Usage: node scripts/verify-skills-endpoint.mjs
 */
import { spawn } from 'node:child_process';
import { setTimeout as setTimeoutPromise } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const PORT = 8787;
const URL = `http://localhost:${PORT}`;
const __dirname = dirname(fileURLToPath(import.meta.url));

function spawnWrangler() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['wrangler', 'dev', '--port', String(PORT), '--local'], {
      cwd: resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let ready = false;
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      if (!ready && (text.includes('http://') || text.includes('localhost') || text.includes('dev server'))) {
        ready = true;
        resolve(proc);
      }
    });
    proc.stderr.on('data', (data) => {
      const text = data.toString();
      if (!ready && (text.includes('http://') || text.includes('localhost') || text.includes('dev server'))) {
        ready = true;
        resolve(proc);
      }
    });
    setTimeout(() => { if (!ready) resolve(proc); }, 15000);
    proc.on('error', reject);
  });
}

async function callSkill(name) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'get_skill',
        arguments: { name },
      },
    }),
  });
  const json = await res.json();
  return json;
}

async function main() {
  console.log('Starting wrangler dev...');
  const proc = await spawnWrangler();

  try {
    await setTimeoutPromise(5000);

    console.log('Calling get_skill(p31-standards)...');
    const result = await callSkill('p31-standards');

    if (result.error) {
      throw new Error(`MCP error: ${JSON.stringify(result.error)}`);
    }

    const content = JSON.parse(result.content?.[0]?.text || '{}');
    const body = content.body || '';

    if (!body.includes('No hardcoded')) {
      throw new Error('Response body missing "No hardcoded"');
    }
    if (!body.includes('Failure Mode')) {
      throw new Error('Response body missing "Failure Mode"');
    }

    console.log('get_skill(p31-standards) returned', body.length, 'bytes');
    console.log('PASS: skills endpoint verified via JSON-RPC');

    console.log('Calling list_skills...');
    const listResult = await callSkill('list_skills');
    if (listResult.error) {
      throw new Error(`list_skills error: ${JSON.stringify(listResult.error)}`);
    }
    const listContent = JSON.parse(listResult.content?.[0]?.text || '{}');
    if (!listContent.skills?.some((s) => s.name === 'p31-standards')) {
      throw new Error('list_skills missing p31-standards');
    }
    console.log('PASS: list_skills verified via JSON-RPC');
  } finally {
    if (typeof proc.kill === 'function') {
      proc.kill('SIGTERM');
    }
  }
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
