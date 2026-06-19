#!/usr/bin/env node

import { resolve } from 'path';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { classifyFile, scanRepo } from './classifier.mjs';
import { getRecentEntries, getStats, rollbackEntries } from './manifest.mjs';
import { updateAllImports } from './importer.mjs';

const [nodePath, scriptPath, command, ...args] = process.argv;

async function cmdAdopt() {
  console.log('🔍 Scanning repo for unclassified files...');
  const result = await scanRepo();

  console.log(`\n📊 Scan complete:`);
  console.log(`   Total files: ${result.total}`);
  console.log(`   Classified:  ${result.classified}`);
  console.log(`   Unclassified: ${result.unclassified}`);
  console.log(`   Needs move:  ${result.needsMove}`);

  if (result.needsMove > 0) {
    console.log(`\n📋 Files that need to be moved:`);
    for (const item of result.items) {
      if (item.classified && item.oldPath !== item.newPath) {
        console.log(`   ${item.oldPath}`);
        console.log(`   → ${item.newPath}`);
        console.log(`   (${item.group}:${item.type})`);
        console.log('');
      }
    }

    if (!args.includes('--dry-run')) {
      console.log('🔄 Moving files...');
      const { renameSync, mkdirSync } = await import('fs');
      const { addEntry } = await import('./manifest.mjs');
      let moved = 0;
      let failed = 0;

      for (const item of result.items) {
        if (!item.classified || item.oldPath === item.newPath) continue;

        try {
          const destDir = item.newPath.substring(
            0,
            item.newPath.lastIndexOf('/')
          );
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }

          if (existsSync(item.newPath)) {
            console.log(`   ⚠️  Conflict: ${item.newPath}`);
            failed++;
            continue;
          }

          renameSync(item.oldPath, item.newPath);

          const importResult = await updateAllImports(
            item.oldPath,
            item.newPath,
            resolve(new URL('../../', import.meta.url).pathname)
          );

          addEntry({
            oldPath: item.oldPath,
            newPath: item.newPath,
            classification: item.type,
            group: item.group,
            status: 'moved',
            importsUpdated: importResult.updatedFiles,
            importChanges: importResult.totalChanges,
            reason: 'phos_adopt',
          });

          moved++;
          if (importResult.totalChanges > 0) {
            console.log(
              `   ✅ Moved → ${item.newPath} (updated ${importResult.totalChanges} imports)`
            );
          } else {
            console.log(`   ✅ Moved → ${item.newPath}`);
          }
        } catch (err) {
          console.error(`   ❌ Failed: ${item.oldPath} → ${err.message}`);
          failed++;
        }
      }

      console.log(`\n📊 Move complete: ${moved} moved, ${failed} failed`);
    } else {
      console.log('\n🏁 Dry run — no files moved. Use `phos adopt` without --dry-run to execute.');
    }
  } else {
    console.log('\n✨ All files are in their canonical locations.');
  }
}

async function cmdStatus() {
  const stats = getStats();
  const recent = getRecentEntries(10);

  console.log(`📊 Manifest stats:`);
  console.log(`   Total entries: ${stats.total}`);
  console.log(`   Moved:         ${stats.moved}`);
  console.log(`   Failed:        ${stats.failed}`);
  console.log(`   Rolled back:   ${stats.rolledBack}`);
  console.log(`   Unclassified:  ${stats.unclassified}`);

  if (recent.length > 0) {
    console.log(`\n📋 Recent activity:`);
    for (const entry of recent) {
      const time = new Date(entry.timestamp).toLocaleString();
      console.log(`   [${time}] ${entry.status}: ${entry.oldPath}`);
      if (entry.newPath && entry.newPath !== entry.oldPath) {
        console.log(`           → ${entry.newPath}`);
      }
      if (entry.importChanges) {
        console.log(`           (${entry.importChanges} imports updated)`);
      }
      console.log('');
    }
  }

  // Also check for unclassified files in drop zones
  console.log('🔍 Checking for unclassified files...');
  const result = await scanRepo();
  const unclassifiedItems = result.items.filter((i) => !i.classified);
  if (unclassifiedItems.length > 0) {
    console.log(`\n⚠️  ${unclassifiedItems.length} unclassified files found:`);
    for (const item of unclassifiedItems.slice(0, 20)) {
      console.log(`   • ${item.oldPath || item.reason}`);
    }
    if (unclassifiedItems.length > 20) {
      console.log(`   ... and ${unclassifiedItems.length - 20} more`);
    }
    console.log('\n   Run `phos adopt` to classify and move them.');
  } else {
    console.log('\n✨ No unclassified files.');
  }
}

async function cmdRollback() {
  const count = parseInt(args[0], 10) || 1;
  const entries = rollbackEntries(count);
  if (entries.length === 0) {
    console.log('No entries to roll back.');
    return;
  }

  console.log(`↩️  Rolling back ${entries.length} move(s)...`);
  for (const entry of entries) {
    try {
      const { renameSync, mkdirSync } = await import('fs');
      const destDir = entry.newPath.substring(
        0,
        entry.newPath.lastIndexOf('/')
      );
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
      renameSync(entry.oldPath, entry.newPath);
      console.log(`   ✅ ${entry.oldPath} ← ${entry.newPath}`);
    } catch (err) {
      console.error(`   ❌ ${entry.oldPath}: ${err.message}`);
    }
  }
}

async function cmdClassify() {
  const target = args[0];
  if (!target) {
    console.error('Usage: phos classify <file-path>');
    process.exit(1);
  }
  const absPath = resolve(target);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }
  const result = await classifyFile(absPath);
  if (result.classified) {
    console.log(`📋 Classification:`);
    console.log(`   Type:  ${result.type}`);
    console.log(`   Group: ${result.group}`);
    console.log(`   From:  ${result.oldPath}`);
    console.log(`   To:    ${result.newPath}`);
  } else {
    console.log(`❓ Unclassified: ${result.reason}`);
  }
}

async function cmdWatch() {
  console.log('👀 Starting file watcher (vibe mode)...');
  console.log('   Watching repo root + drop zones for new files.');
  console.log('   Press Ctrl+C to stop.\n');

  const { createWatcher } = await import('./watcher.mjs');
  const { watcher, close } = createWatcher();

  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping watcher...');
    close();
    process.exit(0);
  });

  // Keep alive
  await new Promise(() => {});
}

async function main() {
  const commandMap = {
    adopt: cmdAdopt,
    status: cmdStatus,
    rollback: cmdRollback,
    classify: cmdClassify,
    watch: cmdWatch,
  };

  const handler = commandMap[command];
  if (!handler) {
    console.log(`PHOS Forge — Autonomic File Organization

Usage:
  phos adopt          Classify and move all unclassified files to canonical locations
  phos adopt --dry-run  Preview moves without executing
  phos status         Show manifest stats, recent activity, and unclassified files
  phos rollback [n]   Roll back the last N moves (default: 1)
  phos classify <path>  Classify a single file and show its destination
  phos watch          Start the background file watcher (vibe mode)
`);
    process.exit(1);
  }

  try {
    await handler();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
