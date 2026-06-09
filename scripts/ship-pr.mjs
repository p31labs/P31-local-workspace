#!/usr/bin/env node
/**
 * Protected-main helper: lockfile check → push branch → open PR to main.
 *
 *   pnpm run ship:pr
 *   pnpm run ship:pr -- --no-lockfile
 *   pnpm run ship:pr -- --base main --title "ci: nested lockfile"
 *
 * Requires: git, pnpm, GitHub CLI (`gh`) authenticated for this repo.
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Prefer GitHub's official CLI over npm's `gh` package (often shadows real `gh` when nvm is first in PATH).
if (process.platform !== 'win32' && existsSync('/usr/local/bin/gh')) {
  const sep = ':';
  const p = process.env.PATH || '';
  if (!p.split(sep).includes('/usr/local/bin')) {
    process.env.PATH = `/usr/local/bin${p ? `${sep}${p}` : ''}`;
  }
}

const args = process.argv.slice(2);
const flags = {
  noLockfile: args.includes('--no-lockfile'),
  allowDirty: args.includes('--allow-dirty'),
  base: (() => {
    const i = args.indexOf('--base');
    return i >= 0 && args[i + 1] ? args[i + 1] : 'main';
  })(),
  title: (() => {
    const i = args.indexOf('--title');
    return i >= 0 && args[i + 1] ? args[i + 1] : '';
  })()
};

function sh(cmd) {
  const r = spawnSync(cmd, { shell: true, cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || '');
    process.exit(r.status ?? 1);
  }
  return (r.stdout || '').trim();
}

function shQuiet(cmd) {
  const r = spawnSync(cmd, { shell: true, cwd: ROOT, encoding: 'utf8' });
  return { status: r.status ?? 1, out: (r.stdout || '').trim() };
}

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, shell: true });
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/ship-pr.mjs [options]

  Runs lockfile:check, fetches origin, then pushes the current branch (or
  splits a new auto/… branch if you are on ${flags.base} with local commits)
  and opens a PR to origin/${flags.base}.

Options:
  --no-lockfile   Skip pnpm run lockfile:check
  --allow-dirty   Allow uncommitted changes (default: require clean working tree)
  --base <branch> Base branch (default: main)
  --title <text>  PR title (default: first unpushed commit subject or branch name)
`);
  process.exit(0);
}

if (shQuiet('command -v gh').status !== 0) {
  console.error('ship-pr: `gh` (GitHub CLI) is required. Install: https://cli.github.com/');
  process.exit(1);
}

if (!flags.noLockfile) {
  run('pnpm run lockfile:check');
}

const dirty = sh('git status --porcelain');
if (dirty && !flags.allowDirty) {
  console.error('ship-pr: working tree is not clean. Commit or stash, or pass --allow-dirty');
  process.exit(1);
}

run(`git fetch origin ${flags.base}`);

const head = sh('git rev-parse HEAD');
const baseRef = shQuiet(`git merge-base HEAD origin/${flags.base}`).out;
if (!baseRef) {
  console.error(`ship-pr: no common ancestor with origin/${flags.base}. Fetch and try again.`);
  process.exit(1);
}

const toBase = shQuiet(`git rev-list --count origin/${flags.base}..HEAD`).out;
if (toBase === '0' || !toBase) {
  console.error(
    `ship-pr: no unique commits on this branch (nothing ahead of origin/${flags.base} to open a PR for).`
  );
  process.exit(1);
}

let branch = sh('git rev-parse --abbrev-ref HEAD');
if (branch === flags.base) {
  const short = sh('git rev-parse --short HEAD');
  const day = new Date().toISOString().slice(0, 10);
  branch = `auto/ship-${day}-${short}`;
  run(`git checkout -b ${branch}`);
}

run(`git push -u origin ${branch}`);

const list = spawnSync(
  'gh',
  ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number'],
  { encoding: 'utf8', cwd: ROOT }
);
if (list.status === 0) {
  const n = (() => {
    try {
      return JSON.parse((list.stdout || '').trim() || '[]')[0]?.number;
    } catch {
      return undefined;
    }
  })();
  if (n) {
    const u = sh(`gh pr view ${String(n)} --json url -q .url`);
    console.log(`ship-pr: open PR already exists: ${u}`);
    process.exit(0);
  }
}

const title =
  flags.title ||
  shQuiet(`git log -1 --pretty=%s ${head}`).out ||
  branch;

const body = `Auto-opened with pnpm run ship:pr. Lockfile: ${
  flags.noLockfile ? 'not checked' : 'pnpm run lockfile:check'
}.`;

const create = spawnSync(
  'gh',
  [
    'pr',
    'create',
    '--base',
    flags.base,
    '--head',
    branch,
    '--title',
    title,
    '--body',
    body
  ],
  { stdio: 'inherit', cwd: ROOT }
);
if (create.status !== 0) process.exit(create.status ?? 1);

const url = sh('gh pr view --json url -q .url');
console.log(`ship-pr: ${url}`);
