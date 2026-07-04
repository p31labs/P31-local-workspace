#!/usr/bin/env node
/**
 * Copy Vite `dist/` into p31ca `public/spaceship-earth/` (same-origin on p31ca.org).
 * Run after `npm run build`. Override target: P31CA_SPACESHIP_DIR=/abs/path.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot   = path.join(__dirname, '..');
const dist      = path.join(pkgRoot, 'dist');
const defaultTarget = path.join(pkgRoot, '..', 'p31ca', 'public', 'spaceship-earth');
const target = process.env.P31CA_SPACESHIP_DIR
  ? path.resolve(process.env.P31CA_SPACESHIP_DIR)
  : defaultTarget;

if (!fs.existsSync(dist) || !fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('sync-p31ca-public: run `npm run build` first; expected', dist);
  process.exit(1);
}

const publicParent = path.join(target, '..');
if (!fs.existsSync(publicParent)) {
  console.error('sync-p31ca-public: p31ca public dir missing:', publicParent);
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.cpSync(dist, target, { recursive: true });
console.log('sync-p31ca-public:', dist, '->', target);
