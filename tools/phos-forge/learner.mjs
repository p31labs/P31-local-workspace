import { readdirSync, statSync, existsSync } from 'fs';
import { join, relative, basename, extname, dirname } from 'path';
import { execSync } from 'child_process';

export function learnProject(projectDir, repoRoot) {
  const projectName = basename(projectDir);
  const patterns = [];
  const seen = new Set();
  const rootEntries = scanDir(projectDir, 0, 0);

  function addPattern(glob, type, dest, exclude = []) {
    const key = `${type}:${glob}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (exclude.length > 0) {
      patterns.push({ type, glob, dest, exclude });
    } else {
      patterns.push({ type, glob, dest });
    }
  }

  function scanDir(dir, depth = 0, maxDepth = 3) {
    if (depth > maxDepth || !existsSync(dir)) return [];
    const entries = [];
    try {
      const items = readdirSync(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules' || item === 'dist' || item === 'build' || item === 'target') continue;
        entries.push(item);
      }
    } catch { return []; }
    return entries;
  }

  function detectConfigs(dir) {
    try {
      const entries = readdirSync(dir);
      const configs = ['package.json', 'tsconfig.json', 'wrangler.toml', 'astro.config.mjs', 'vite.config.ts', 'vite.config.mjs'];
      return configs.filter((c) => entries.includes(c));
    } catch { return []; }
  }

  // Framework detection
  const rootConfigs = detectConfigs(projectDir);
  const hasAstro = rootConfigs.includes('astro.config.mjs');
  const hasVite = rootConfigs.includes('vite.config.ts') || rootConfigs.includes('vite.config.mjs');

  // Scan src/
  const srcDir = join(projectDir, 'src');
  if (existsSync(srcDir)) {
    const srcEntries = scanDir(srcDir, 0, 1);
    const srcSubDirs = srcEntries.filter((e) => statSync(join(srcDir, e)).isDirectory());

    // Flat src/ (hearing-ops style)
    const flatSrcFiles = srcEntries.filter((e) => !statSync(join(srcDir, e)).isDirectory());
    const hasFlatTsx = flatSrcFiles.some((f) => f.endsWith('.tsx') || f.endsWith('.jsx'));
    const hasFlatSource = flatSrcFiles.some((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
    if (srcSubDirs.length === 0 && hasFlatSource) {
      addPattern('src/**/*.{ts,tsx}', 'source', `{base}/src/{relative}/{basename}.{ext}`);
    }

    for (const sub of srcSubDirs) {
      const subPath = join(srcDir, sub);
      const subEntries = scanDir(subPath, 1, 2);
      const tsxInSub = subEntries.filter((f) => f.endsWith('.tsx') || f.endsWith('.jsx')).length;
      const tsInSub = subEntries.filter((f) => f.endsWith('.ts')).length;

      if (sub === 'pages' || (hasAstro && sub === 'pages')) {
        const astroCount = subEntries.filter((f) => f.endsWith('.astro')).length;
        if (astroCount > 0) {
          addPattern('src/pages/**/*.astro', 'page', `{base}/src/pages/{relative}/{basename}.{ext}`);
        }
        const apiCount = subEntries.filter((f) => ['.ts', '.js'].includes(extname(f))).length;
        if (apiCount > 0) {
          addPattern('src/pages/**/*.{ts,js}', 'page_api', `{base}/src/pages/{relative}/{basename}.{ext}`);
        }
      }

      if (sub === 'components' && tsxInSub > 0) {
        const testCount = subEntries.filter((f) => f.includes('__tests__')).length;
        addPattern('src/components/**/*.{ts,tsx,jsx}', 'component', `{base}/src/components/{relative}/{basename}.{ext}`);
        if (testCount > 0) {
          addPattern('src/components/__tests__/*.test.{ts,tsx}', 'component_test', `{base}/src/components/__tests__/{basename}.{ext}`);
        }
      }

      if (sub === 'surfaces') {
        addPattern('src/surfaces/*.tsx', 'surface', `{base}/src/surfaces/{basename}.{ext}`);
        const testCount = subEntries.filter((f) => f.endsWith('.test.tsx') || f.endsWith('.test.ts')).length;
        if (testCount > 0) {
          addPattern('src/surfaces/__tests__/*.test.tsx', 'surface_test', `{base}/src/surfaces/__tests__/{basename}.{ext}`);
        }
      }

      if (sub === 'lib' && tsInSub > 0) {
        addPattern('src/lib/*.ts', 'lib', `{base}/src/lib/{basename}.{ext}`);
        const testCount = subEntries.filter((f) => f.endsWith('.test.ts') || f.endsWith('.test.tsx')).length;
        if (testCount > 0) {
          addPattern('src/lib/__tests__/*.test.{ts,tsx}', 'lib_test', `{base}/src/lib/__tests__/{basename}.{ext}`);
        }
      }

      if (sub === 'hooks') {
        addPattern('src/hooks/*.{ts,tsx}', 'hook', `{base}/src/hooks/{basename}.{ext}`);
      }

      if (sub === 'context') {
        addPattern('src/context/*.tsx', 'context', `{base}/src/context/{basename}.{ext}`);
      }

      if (sub === 'styles' || sub === 'style') {
        addPattern('src/styles/*.css', 'style', `{base}/src/styles/{basename}.{ext}`);
      }

      if (sub === 'types') {
        addPattern('src/types/*.d.ts', 'type_def', `{base}/src/types/{basename}.{ext}`);
      }

      if (sub === 'layouts') {
        addPattern('src/layouts/**/*.astro', 'layout', `{base}/src/layouts/{relative}/{basename}.{ext}`);
      }

      if (sub === 'data') {
        addPattern('src/data/**/*.{ts,json}', 'data', `{base}/src/data/{relative}/{basename}.{ext}`);
      }

      if (sub === 'content') {
        addPattern('src/content/**/*.{md,mdx}', 'content', `{base}/src/content/{relative}/{basename}.{ext}`);
      }

      if (sub === 'engine') {
        addPattern('src/engine/**/*.ts', 'engine', `{base}/src/engine/{relative}/{basename}.{ext}`);
      }

      if (sub === 'mesh') {
        addPattern('src/mesh/**/*.{ts,tsx}', 'mesh', `{base}/src/mesh/{relative}/{basename}.{ext}`);
      }

      if (sub === 'rooms') {
        addPattern('src/rooms/**/*.{ts,tsx}', 'rooms', `{base}/src/rooms/{relative}/{basename}.{ext}`);
      }

      if (sub === 'boot') {
        addPattern('src/boot/**/*.ts', 'boot', `{base}/src/boot/{relative}/{basename}.{ext}`);
      }

      if (sub === 'commands') {
        addPattern('src/commands/*.ts', 'command', `{base}/src/commands/{basename}.{ext}`);
      }

      if (sub === 'services') {
        addPattern('src/services/*.ts', 'service', `{base}/src/services/{basename}.{ext}`);
      }

      if (sub === 'qa') {
        addPattern('src/qa/**/*.ts', 'qa', `{base}/src/qa/{relative}/{basename}.{ext}`);
      }

      // Rust backend
      if (sub === 'src-tauri') {
        const tauriEntries = scanDir(join(srcDir, 'src-tauri'), 1, 3);
        const rsCount = tauriEntries.filter((f) => f.endsWith('.rs')).length;
        if (rsCount > 0) {
          addPattern('src-tauri/src/**/*.rs', 'rust_source', `{base}/src-tauri/src/{relative}/{basename}.{ext}`);
          addPattern('src-tauri/*.toml', 'tauri_config', `{base}/src-tauri/{basename}.{ext}`);
          addPattern('src-tauri/*.json', 'tauri_config_json', `{base}/src-tauri/{basename}.{ext}`);
        }
      }
    }

    // Ambient
    const ambientDir = join(srcDir, 'components', 'ambient');
    if (existsSync(ambientDir)) {
      const ambientEntries = scanDir(ambientDir, 0, 1);
      if (ambientEntries.some((f) => f.endsWith('.tsx'))) {
        addPattern('src/components/ambient/*.tsx', 'ambient', `{base}/src/components/ambient/{basename}.{ext}`);
        if (ambientEntries.some((f) => f.includes('__tests__'))) {
          addPattern('src/components/ambient/__tests__/*.test.tsx', 'ambient_test', `{base}/src/components/ambient/__tests__/{basename}.{ext}`);
        }
      }
    }
  }

  // Public assets
  const publicDir = join(projectDir, 'public');
  if (existsSync(publicDir)) {
    const publicEntries = scanDir(publicDir, 0, 2);
    const assetCount = publicEntries.filter((f) => !f.endsWith('_headers') && !f.endsWith('_redirects')).length;
    if (assetCount > 0) {
      addPattern('public/**/*.*', 'public_asset', `{base}/public/{relative}/{basename}.{ext}`);
    }
  }

  // Worker directory
  const workerDir = join(projectDir, 'worker');
  if (existsSync(workerDir)) {
    const workerEntries = scanDir(workerDir, 0, 2);
    if (workerEntries.some((f) => f.endsWith('.ts'))) {
      addPattern('worker/**/*.ts', 'worker', `{base}/worker/{relative}/{basename}.{ext}`);
    }
  }

  // Root config files
  const configExtensions = ['.ts', '.mjs', '.js', '.toml', '.json', '.yaml', '.yml'];
  const configFiles = rootEntries.filter((f) => configExtensions.includes(extname(f)));
  if (configFiles.length > 0 && !hasVite && !hasAstro) {
    addPattern('*.{ts,mjs,js}', 'config', `{base}/{basename}.{ext}`);
  } else if (configFiles.length > 0) {
    const configFileNames = rootEntries.filter((f) => configExtensions.includes(extname(f)));
    if (configFileNames.length <= 5) {
      addPattern(`{${configFileNames.join(',')}}`, 'config', `{base}/{basename}.{ext}`);
    }
  }

  // Determine base
  let base;
  if (projectDir.includes('/phos/')) base = 'phos';
  else if (projectDir.includes('software/p31ca')) base = 'software/p31ca';
  else if (projectDir.includes('phosphorus31.org')) base = 'phosphorus31.org/planetary-planet';
  else if (projectDir.includes('p31-hearing-ops')) base = 'software/p31-hearing-ops';
  else if (projectDir.includes('software/bonding')) base = 'software/bonding';
  else if (projectDir.includes('spaceship-earth')) base = 'software/spaceship-earth';
  else if (projectDir.includes('software/discord')) base = 'software/discord/p31-bot';
  else if (projectDir.includes('software/spin-mesh')) base = 'software/spin-mesh';
  else if (projectDir.includes('firmware/')) base = `firmware/${projectName}`;
  else if (projectDir.includes('ecosystem/')) base = `ecosystem/${projectName}`;
  else if (projectDir.includes('software/cloudflare-worker/')) base = `software/cloudflare-worker/${projectName}`;
  else if (projectDir.includes('software/packages/')) base = `software/packages/${projectName}`;
  else base = `apps/${projectName}`;

  return {
    version: '1.0.0',
    inferred: true,
    project: projectName,
    project_dir: relative(repoRoot, projectDir),
    base,
    framework: hasAstro ? 'astro' : hasVite ? 'vite' : 'unknown',
    patterns,
  };
}

export function formatMap(draft) {
  const lines = [
    `  "${draft.project}": {`,
    `    "description": "${draft.project} (inferred by phos learn)",`,
    `    "base": "${draft.base}",`,
    `    "patterns": [`,
  ];

  for (const p of draft.patterns) {
    lines.push(`      {`);
    lines.push(`        "type": "${p.type}",`);
    lines.push(`        "glob": "${p.glob}",`);
    lines.push(`        "dest": "${p.dest}"`);
    if (p.exclude && p.exclude.length > 0) {
      lines.push(`,\n        "exclude": ${JSON.stringify(p.exclude)}`);
    }
    lines.push(`\n      },`);
  }

  lines.push(`    ]`);
  lines.push(`  }`);

  return lines.join('\n');
}
