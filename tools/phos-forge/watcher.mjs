import { watch } from 'chokidar';
import { resolve, relative } from 'path';
import { existsSync, renameSync, copyFileSync, unlinkSync } from 'fs';
import { loadMap } from './classifier.mjs';
import { classifyFile } from './classifier.mjs';
import { addEntry } from './manifest.mjs';
import { updateAllImports } from './importer.mjs';

const DEBOUNCE_MS = 5000;

export function createWatcher(options = {}) {
  const map = loadMap();
  const root = map.repo_root;
  const dropZones = (options.dropZones || map.drop_zones || []).map((z) =>
    resolve(z.replace(/^~/, process.env.HOME || '/home/p31'))
  );
  const watchPaths = [root, ...dropZones];

  const debounceTimers = new Map();
  const pendingMoves = new Map();

  function debouncedProcess(filePath, eventType) {
    const key = `${eventType}:${filePath}`;
    if (debounceTimers.has(key)) clearTimeout(debounceTimers.get(key));
    debounceTimers.set(
      key,
      setTimeout(async () => {
        debounceTimers.delete(key);
        await processFile(filePath, eventType);
      }, DEBOUNCE_MS)
    );
  }

  async function processFile(filePath, eventType) {
    const absPath = resolve(filePath);

    if (eventType === 'unlink') {
      pendingMoves.delete(absPath);
      return;
    }

    // Wait briefly for file to finish writing
    await new Promise((r) => setTimeout(r, 500));

    if (!existsSync(absPath)) return;

    const result = await classifyFile(absPath);

    if (!result.classified) {
      addEntry({
        oldPath: absPath,
        newPath: absPath,
        classification: null,
        status: 'unclassified',
        reason: result.reason,
      });
      return;
    }

    if (result.oldPath === result.newPath) {
      // Already canonical
      return;
    }

    // File needs to move
    try {
      const destDir = result.newPath.substring(
        0,
        result.newPath.lastIndexOf('/')
      );
      if (!existsSync(destDir)) {
        const { mkdirSync } = await import('fs');
        mkdirSync(destDir, { recursive: true });
      }

      // Check for conflicts
      if (existsSync(result.newPath)) {
        const conflictPath =
          result.newPath.replace(
            /\.([^.]+)$/,
            '-conflict.$1'
          );
        renameSync(absPath, conflictPath);
        addEntry({
          oldPath: absPath,
          newPath: conflictPath,
          classification: result.type,
          group: result.group,
          status: 'conflict',
          reason: 'destination_exists',
        });
        return;
      }

      // Move the file
      renameSync(absPath, result.newPath);

      // Update imports
      const importResult = await updateAllImports(
        absPath,
        result.newPath,
        root
      );

      addEntry({
        oldPath: absPath,
        newPath: result.newPath,
        classification: result.type,
        group: result.group,
        status: 'moved',
        importsUpdated: importResult.updatedFiles,
        importChanges: importResult.totalChanges,
        reason: 'watcher_move',
      });
    } catch (err) {
      addEntry({
        oldPath: absPath,
        newPath: result.newPath,
        classification: result.type,
        group: result.group,
        status: 'failed',
        reason: err.message,
      });
    }
  }

  const watcher = watch(watchPaths, {
    ignored: [
      /(^|[/\\])\../, // dotfiles
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/target/**',
      '**/.wrangler/**',
      '**/.astro/**',
      '**/coverage/**',
      '**/.pnpm/**',
    ],
    persistent: true,
    ignoreInitial: true,
    depth: options.depth || 10,
    interval: options.interval || 1000,
  });

  watcher.on('add', (filePath) => debouncedProcess(filePath, 'add'));
  watcher.on('change', (filePath) => debouncedProcess(filePath, 'change'));

  return {
    watcher,
    close: () => {
      for (const timer of debounceTimers.values()) clearTimeout(timer);
      debounceTimers.clear();
      return watcher.close();
    },
  };
}
