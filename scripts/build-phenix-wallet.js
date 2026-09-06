import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'workers', 'phenix-wallet', 'dist');

console.log('[1/2] Bundling wallet library...');
await esbuild.build({
  entryPoints: [path.resolve(rootDir, 'packages', 'spaceship-earth', 'src', 'services', 'phenixWallet.ts')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: path.resolve(distDir, 'wallet.js'),
  external: [],
  logLevel: 'info',
  target: 'es2022',
});

console.log('[2/2] Bundling shared library...');
await esbuild.build({
  entryPoints: [path.resolve(rootDir, 'packages', 'shared', 'src', 'index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: path.resolve(distDir, 'shared.js'),
  logLevel: 'info',
  target: 'es2022',
});

console.log('✅ Wallet bundled to', distDir);
