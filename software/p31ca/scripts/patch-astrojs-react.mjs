/**
 * Patch @astrojs/react to export jsx-dev-runtime for Vite dev HMR.
 * @astrojs/react@5.0.4 does not include this export in its package.json.
 * This patches the pnpm store copy.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

try {
  const pkgPath = require.resolve('@astrojs/react/package.json', { paths: [projectRoot] });
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  if (pkg.exports['./jsx-dev-runtime']) {
    console.log('jsx-dev-runtime already exported');
    process.exit(0);
  }

  // Add jsx-dev-runtime to exports
  pkg.exports['./jsx-dev-runtime'] = './dist/jsx-dev-runtime.js';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('Patched exports map:', pkgPath);

  // Write the dist file
  const distPath = pkgPath.replace(/package\.json$/, 'dist/jsx-dev-runtime.js');
  const runtimeContent = 'export { jsx, jsxs, jsxDEV, Fragment } from "react/jsx-dev-runtime";\n';
  fs.writeFileSync(distPath, runtimeContent);
  console.log('Wrote dist file:', distPath);
} catch (e) {
  console.error('Failed to patch @astrojs/react:', e.message);
  process.exit(0);
}
