#!/usr/bin/env node
/**
 * p31 release <patch|minor|major> [--dry-run] [--message "..."]
 *
 * Semantic versioning for the P31 Sovereign Design System.
 * Validates token/component changes against previous release snapshots,
 * enforces semver gates, updates version fields, creates git tags,
 * and generates CHANGELOG.md.
 */

import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const FILES_TO_RELEASE = [
  { file: 'cli/tokens/tokens.yml', prefix: 'tokens', label: 'Design Tokens' },
  { file: 'cli/tokens/components.yml', prefix: 'components', label: 'Component Registry' },
];

const RELEASE_ORDER = { patch: 0, minor: 1, major: 2 };

function loadYAML(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return yaml.parse(fs.readFileSync(abs, 'utf8'));
}

function flattenPaths(obj, prefix = '') {
  const result = [];
  if (!obj || typeof obj !== 'object') return result;
  if (obj['$value'] !== undefined) { result.push(prefix); return result; }
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key === 'metadata' || key === 'canonical_constants') continue;
    result.push(...flattenPaths(obj[key], prefix ? `${prefix}.${key}` : key));
  }
  return result;
}

function getNode(obj, pathStr) {
  const parts = pathStr.split('.');
  let node = obj;
  for (const p of parts) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[p];
  }
  return node;
}

function diffTokens(oldObj, newObj) {
  const oldPaths = new Set(flattenPaths(oldObj));
  const newPaths = new Set(flattenPaths(newObj));
  const removed = [...oldPaths].filter(p => !newPaths.has(p));
  const added = [...newPaths].filter(p => !oldPaths.has(p));
  const changed = [];
  const typeChanged = [];

  for (const p of oldPaths) {
    if (!newPaths.has(p)) continue;
    const oldNode = getNode(oldObj, p);
    const newNode = getNode(newObj, p);
    if (!oldNode || !newNode) continue;
    const ov = oldNode['$value'];
    const nv = newNode['$value'];
    const ot = oldNode['$type'];
    const nt = newNode['$type'];
    if (ot && nt && ot !== nt) {
      typeChanged.push({ path: p, old: ot, new: nt });
    } else if (JSON.stringify(ov) !== JSON.stringify(nv)) {
      changed.push({ path: p, old: ov, new: nv });
    }
  }
  return { added, removed, changed, typeChanged };
}

function classifyChanges(diff) {
  if (diff.removed.length > 0 || diff.typeChanged.length > 0) return 'major';
  if (diff.added.length > 0) return 'minor';
  if (diff.changed.length > 0) return 'patch';
  return null;
}

function bumpVersion(current, type) {
  const parts = String(current).split('.').map(Number);
  switch (type) {
    case 'major': return `${parts[0] + 1}.0.0`;
    case 'minor': return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch': return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default: return current;
  }
}

function getLastTag(prefix) {
  try {
    const result = execSync(
      `git describe --tags --match "${prefix}-v*" --abbrev=0 2>/dev/null || true`,
      { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    return result.trim() || null;
  } catch { return null; }
}

function getCommitsSince(tag, fileGlobs) {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  const files = fileGlobs.join(' ');
  try {
    const cmd = `git log ${range} --pretty=format:"%H||%s||%an||%ad" --date=short -- ${files} 2>/dev/null || true`;
    const output = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return output.trim().split('\n').filter(Boolean).map(line => {
      const [hash, subject, author, date] = line.split('||');
      return { hash: hash?.substring(0, 7) || '', subject: subject || '', author: author || '', date: date || '' };
    });
  } catch { return []; }
}

function classifyCommit(subject) {
  if (/^breaking[!(:]/.test(subject)) return 'Breaking Changes';
  if (/^feat[!(:]/.test(subject)) return 'Features';
  if (/^fix[!(:]/.test(subject)) return 'Fixes';
  if (/^chore[!(:]/.test(subject)) return 'Chores';
  if (/^docs[!(:]/.test(subject)) return 'Documentation';
  return 'Changes';
}

function printDiff(diff) {
  if (diff.added.length > 0) console.log(`     + ${diff.added.length} added`);
  if (diff.removed.length > 0) {
    console.log(`     - ${diff.removed.length} removed:`);
    diff.removed.slice(0, 5).forEach(p => console.log(`       ${p}`));
    if (diff.removed.length > 5) console.log(`       ... and ${diff.removed.length - 5} more`);
  }
  if (diff.changed.length > 0) {
    console.log(`     ~ ${diff.changed.length} changed:`);
    diff.changed.slice(0, 3).forEach(c => console.log(`       ${c.path}: ${JSON.stringify(c.old)} → ${JSON.stringify(c.new)}`));
    if (diff.changed.length > 3) console.log(`       ... and ${diff.changed.length - 3} more`);
  }
  if (diff.typeChanged.length > 0) {
    console.log(`     ! ${diff.typeChanged.length} type change(s):`);
    diff.typeChanged.forEach(t => console.log(`       ${t.path}: ${t.old} → ${t.new}`));
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const releaseType = rawArgs.find(a => ['patch', 'minor', 'major'].includes(a));
  const dryRun = rawArgs.includes('--dry-run');
  const msgIdx = rawArgs.indexOf('--message');
  const message = msgIdx >= 0 ? rawArgs[msgIdx + 1] : undefined;

  if (!releaseType) {
    console.error('Usage: p31 release <patch|minor|major> [--dry-run] [--message "..."]');
    console.error('\n  patch  — value-only changes (e.g. colour tweaks)');
    console.error('  minor  — new tokens or components added');
    console.error('  major  — removed tokens, type changes');
    process.exit(1);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  P31 Release — ${releaseType.toUpperCase()}${dryRun ? ' [DRY RUN]' : ''}`);
  console.log(`${'═'.repeat(60)}\n`);

  let anyChanges = false;
  const tagsToPush = [];

  for (const { file, prefix, label } of FILES_TO_RELEASE) {
    console.log(`── ${label} ──`);
    console.log(`   File: ${file}`);

    const current = loadYAML(file);
    if (!current) {
      console.log(`   SKIP: file not found\n`);
      continue;
    }

    const currentVersion = current.version || '1.0.0';
    console.log(`   Version: ${currentVersion}`);

    // Find previous snapshot
    const snapshotDir = path.join(ROOT, 'cli', 'tokens', 'releases');
    let previous = null;
    if (fs.existsSync(snapshotDir)) {
      const snapshots = fs.readdirSync(snapshotDir)
        .filter(f => f.startsWith(prefix) && f.endsWith('.yml'))
        .sort().reverse();
      if (snapshots.length > 0) {
        previous = loadYAML(path.join('cli', 'tokens', 'releases', snapshots[0]));
        if (previous) console.log(`   Baseline: ${snapshots[0]}`);
      }
    }

    // Validate
    if (previous) {
      const diff = diffTokens(previous, current);
      const classified = classifyChanges(diff);

      if (classified) {
        console.log(`   Changes detected:`);
        printDiff(diff);
        console.log(`   Classification: ${classified.toUpperCase()}`);

        if (!dryRun && RELEASE_ORDER[releaseType] < RELEASE_ORDER[classified]) {
          console.error(`\n   ERROR: ${classified} changes require at least a ${classified} release, but you specified ${releaseType}.`);
          console.error(`   Use: p31 release ${classified}\n`);
          process.exit(1);
        }

        console.log(`   Gate: ${releaseType} >= ${classified} ✓`);
        anyChanges = true;
      } else {
        console.log(`   No token changes since last snapshot.`);
        continue;
      }
    } else {
      console.log(`   No previous snapshot — first release for ${label}.`);
      anyChanges = true;
    }

    // Bump + release (skip if dry run)
    const newVersion = bumpVersion(currentVersion, releaseType);

    if (dryRun) {
      console.log(`   Would bump: ${currentVersion} → ${newVersion}`);
      console.log();
      continue;
    }

    console.log(`   Bumping: ${currentVersion} → ${newVersion}`);

    // Save snapshot
    if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });
    const snapshotPath = path.join(snapshotDir, `${prefix}-v${newVersion}.yml`);
    fs.writeFileSync(snapshotPath, yaml.stringify(current));
    console.log(`   Snapshot: cli/tokens/releases/${prefix}-v${newVersion}.yml`);

    // Bump version in source
    const filePath = path.join(ROOT, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/^version:\s*".*"/m, `version: "${newVersion}"`);
    fs.writeFileSync(filePath, content);
    console.log(`   Updated: ${file}`);

    // Tag
    try {
      const tag = `${prefix}-v${newVersion}`;
      execSync(`git tag -a ${tag} -m "${message || tag}"`, { cwd: ROOT, stdio: 'inherit' });
      console.log(`   Tagged: ${tag}`);
      tagsToPush.push(tag);
    } catch (e) {
      console.error(`   WARNING: Could not create git tag: ${e.message}`);
    }

    // Changelog
    const fileGlobs = [
      'cli/tokens/', 'packages/design-core/src/css/',
      'cli/design-mcp-server.js', 'workers/design-mcp/',
    ];
    const lastTag = getLastTag(prefix);
    const commits = getCommitsSince(lastTag, fileGlobs);
    if (commits.length > 0) {
      const groups = {};
      for (const c of commits) {
        const group = classifyCommit(c.subject);
        if (!groups[group]) groups[group] = [];
        groups[group].push(`- ${c.subject} (\`${c.hash}\`, ${c.author}, ${c.date})`);
      }
      let md = `## ${prefix}-v${newVersion} (${new Date().toISOString().split('T')[0]})\n\n`;
      for (const [group, entries] of Object.entries(groups)) {
        md += `### ${group}\n${entries.join('\n')}\n\n`;
      }
      const changelogPath = path.join(ROOT, 'CHANGELOG.md');
      const existing = fs.existsSync(changelogPath)
        ? fs.readFileSync(changelogPath, 'utf8')
        : '# Changelog\n\nAll notable changes to the P31 Sovereign Design System.\n\n';
      fs.writeFileSync(changelogPath, md + existing);
      console.log(`   CHANGELOG.md updated (${commits.length} commits)`);
    }

    console.log();
  }

  if (!anyChanges) {
    console.log('No changes detected. Nothing to release.\n');
  } else if (!dryRun && tagsToPush.length > 0) {
    console.log(`Tags: ${tagsToPush.join(', ')}`);
    console.log('Push: git push --tags\n');
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Release complete.\n`);
}

main().catch(e => { console.error('Release failed:', e.message); process.exit(1); });
