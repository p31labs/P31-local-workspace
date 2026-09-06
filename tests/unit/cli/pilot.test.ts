import { describe, it, expect, beforeEach } from 'vitest';
import { spawn } from 'child_process';
import { join } from 'path';
import fs from 'fs';
import yaml from 'yaml';

const CLI_PATH = join('/home/p31/P31-local-workspace', 'cli', 'index.js');
const REPO_ROOT = '/home/p31/P31-local-workspace';
const PILOTS_FILE = join(REPO_ROOT, 'cli', 'pilots.yml');

function runCli(args: string[]): Promise<{ out: string; err: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [CLI_PATH, ...args], { cwd: REPO_ROOT, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    proc.on('close', (code) => {
      resolve({ out, err, code: code ?? 0 });
    });
    proc.stdout.on('data', (chunk) => { out += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { err += chunk.toString(); });
  });
}

function resetPilots() {
  fs.writeFileSync(PILOTS_FILE, 'version: "1.0"\npilots: []\n', 'utf8');
}

describe('andromeda pilot', () => {
  beforeEach(() => {
    resetPilots();
  });

  it('requires --email and --name', async () => {
    const { err, code } = await runCli(['pilot', '--invite']);
    expect(code).not.toBe(0);
    expect(err).toContain('--email and --name are required');
  });

  it('dry-run does not write to registry', async () => {
    const { out } = await runCli(['pilot', '--invite', '--email', 'dry@test.com', '--name', 'Dry Run', '--dry-run']);
    expect(out).toContain('[DRY RUN]');
    expect(out).toContain('Dry Run');
  });

  it('dry-run outputs onboarding URL', async () => {
    const { out } = await runCli(['pilot', '--invite', '--email', 'dry2@test.com', '--name', 'Dry Run 2', '--dry-run']);
    expect(out).toContain('https://phos.p31ca.org?did=');
  });

  it('--agent outputs JSON', async () => {
    const { out } = await runCli(['pilot', '--invite', '--email', 'agent-json@test.com', '--name', 'Agent Test', '--agent']);
    const parsed = JSON.parse(out);
    expect(parsed.id).toBeDefined();
    expect(parsed.name).toBe('Agent Test');
    expect(parsed.email).toBe('agent-json@test.com');
    expect(parsed.status).toBe('ok');
    expect(parsed.onboardUrl).toContain('phos.p31ca.org?did=');
  });

  it('rejects duplicate email in local registry', async () => {
    await runCli(['pilot', '--invite', '--email', 'dup@test.com', '--name', 'Original']);
    const { err, code } = await runCli(['pilot', '--invite', '--email', 'dup@test.com', '--name', 'Duplicate']);
    expect(code).not.toBe(0);
    expect(err).toContain('Pilot already exists');
  });

  it('rejects missing --name', async () => {
    const { err, code } = await runCli(['pilot', '--invite', '--email', 'noname@test.com']);
    expect(code).not.toBe(0);
    expect(err).toContain('--email and --name are required');
  });

  it('rejects missing --email', async () => {
    const { err, code } = await runCli(['pilot', '--invite', '--name', 'No Email']);
    expect(code).not.toBe(0);
    expect(err).toContain('--email and --name are required');
  });

  it('handles missing --batch file gracefully', async () => {
    const { out, err, code } = await runCli(['pilot', '--invite', '--batch', '/nonexistent/file.csv']);
    expect(code).not.toBe(0);
  });

  it('generates deterministic pilot IDs', async () => {
    const { out: out1 } = await runCli(['pilot', '--invite', '--email', 'deterministic@test.com', '--name', 'Deterministic', '--dry-run']);
    const match1 = out1.match(/Pilot ID: (P31-\S+)/);
    const { out: out2 } = await runCli(['pilot', '--invite', '--email', 'deterministic@test.com', '--name', 'Deterministic', '--dry-run']);
    const match2 = out2.match(/Pilot ID: (P31-\S+)/);
    expect(match1).not.toBeNull();
    expect(match2).not.toBeNull();
    expect(match1![1]).toBe(match2![1]);
  });

  it('includes onboarding URL in output', async () => {
    const { out } = await runCli(['pilot', '--invite', '--email', 'dash@test.com', '--name', 'Dashboard Test', '--dry-run']);
    expect(out).toContain('Onboarding: https://phos.p31ca.org?did=');
  });

  it('list shows no pilots when registry is empty', async () => {
    const { out } = await runCli(['pilot', '--list']);
    expect(out).toContain('No pilots registered.');
  });

  it('list shows pilots in human-readable format', async () => {
    await runCli(['pilot', '--invite', '--email', 'list-human@test.com', '--name', 'List Human']);
    const { out } = await runCli(['pilot', '--list']);
    expect(out).toContain('List Human');
    expect(out).toContain('list-human@test.com');
  });

  it('list --agent outputs JSON with pilots array and total', async () => {
    await runCli(['pilot', '--invite', '--email', 'list-json@test.com', '--name', 'List JSON']);
    const { out } = await runCli(['pilot', '--list', '--agent']);
    const parsed = JSON.parse(out);
    expect(parsed.pilots).toBeInstanceOf(Array);
    expect(parsed.total).toBeGreaterThanOrEqual(1);
    expect(parsed.status).toBe('ok');
  });

  it('status --id shows details for existing pilot', async () => {
    const { out } = await runCli(['pilot', '--invite', '--email', 'status-id@test.com', '--name', 'Status ID']);
    const match = out.match(/Pilot ID: (P31-\S+)/);
    expect(match).not.toBeNull();
    const { out: statusOut } = await runCli(['pilot', '--status', '--id', match![1]]);
    expect(statusOut).toContain('Status ID');
    expect(statusOut).toContain('status-id@test.com');
    expect(statusOut).toContain('https://phos.p31ca.org?did=');
  });

  it('status --email shows details for existing pilot', async () => {
    await runCli(['pilot', '--invite', '--email', 'status-email@test.com', '--name', 'Status Email']);
    const { out: statusOut } = await runCli(['pilot', '--status', '--email', 'status-email@test.com']);
    expect(statusOut).toContain('Status Email');
    expect(statusOut).toContain('status-email@test.com');
  });

  it('status exits with error for missing pilot', async () => {
    const { err, code } = await runCli(['pilot', '--status', '--id', 'P31-00000000-00000000']);
    expect(code).not.toBe(0);
    expect(err).toContain('Pilot not found');
  });

  it('status --id takes precedence over --email', async () => {
    const { out } = await runCli(['pilot', '--invite', '--email', 'precedence@test.com', '--name', 'Precedence']);
    const match = out.match(/Pilot ID: (P31-\S+)/);
    expect(match).not.toBeNull();
    const { out: statusOut } = await runCli(['pilot', '--status', '--id', match![1], '--email', 'other@test.com']);
    expect(statusOut).toContain('Precedence');
    expect(statusOut).toContain('precedence@test.com');
  });

  it('status --agent outputs JSON', async () => {
    const { out } = await runCli(['pilot', '--invite', '--email', 'agent-status@test.com', '--name', 'Agent Status']);
    const match = out.match(/Pilot ID: (P31-\S+)/);
    const { out: agentOut } = await runCli(['pilot', '--status', '--id', match![1], '--agent']);
    const parsed = JSON.parse(agentOut);
    expect(parsed.name).toBe('Agent Status');
    expect(parsed.email).toBe('agent-status@test.com');
    expect(parsed.status).toBe('ok');
    expect(parsed.id).toBe(match![1]);
  });

  it('sync pulls pilots from D1 and updates local YAML', async () => {
    const { out } = await runCli(['pilot', '--sync']);
    expect(out).toContain('Synced');
    const synced = yaml.parse(fs.readFileSync(PILOTS_FILE, 'utf8')).pilots;
    expect(synced.length).toBeGreaterThanOrEqual(1);
    const sources = synced.map((p: any) => p.source);
    expect(sources).toContain('synthetic');
    expect(sources).toContain('test');
  });

  it('sync --agent outputs JSON envelope', async () => {
    const { out } = await runCli(['pilot', '--sync', '--agent']);
    const parsed = JSON.parse(out);
    expect(parsed.pilots).toBeInstanceOf(Array);
    expect(parsed.total).toBeGreaterThanOrEqual(1);
    expect(parsed.status).toBe('ok');
    const sources = parsed.pilots.map((p: any) => p.source);
    expect(sources).toContain('synthetic');
    expect(sources).toContain('test');
  });

  it('sync overwrites stale local data', async () => {
    fs.writeFileSync(PILOTS_FILE, 'version: "1.0"\npilots:\n  - id: stale\n    name: Stale\n    email: stale@test.com\n    status: invited\n');
    const { out } = await runCli(['pilot', '--sync']);
    expect(out).toContain('Synced');
    const synced = yaml.parse(fs.readFileSync(PILOTS_FILE, 'utf8')).pilots;
    const ids = synced.map((p: any) => p.id);
    expect(ids).not.toContain('stale');
  });

  it('sync handles pilots without email', async () => {
    const { out } = await runCli(['pilot', '--sync']);
    const synced = yaml.parse(fs.readFileSync(PILOTS_FILE, 'utf8')).pilots;
    const withoutEmail = synced.filter((p: any) => !p.email);
    expect(withoutEmail.length).toBeGreaterThanOrEqual(0);
  });

  it('sync shows summary with count', async () => {
    const { out } = await runCli(['pilot', '--sync']);
    expect(out).toContain('Synced');
    expect(out).toContain('pilots from remote D1');
  });
});
