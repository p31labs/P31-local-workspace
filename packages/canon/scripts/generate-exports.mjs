#!/usr/bin/env node
/**
 * @p31/canon — generate-exports.mjs
 *
 * THE CANON'S CENTERPIECE, in one file.
 *
 * Exports are never hand-maintained. This script is the ONLY writer of
 * package.json "exports". Every specifier below is DERIVED by walking
 * src/** — a specifier exists because its target file exists, and for
 * no other reason. Then the ghost gate hard-verifies each target on
 * disk before the map is allowed to be written.
 *
 * Ghosts (specifier → missing file) are structurally impossible to
 * ship: derivation makes them absent by construction, and the gate
 * makes any survivor fatal (exit 1).
 *
 * Run: node scripts/generate-exports.mjs  (from packages/canon)
 */
import { existsSync, readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const src = join(root, 'src')

/** Derive the exports map from src/**. A specifier exists ONLY if its
 * target exists. walk returns { specifier: './src/...' }. */
function walk(dir, prefix = []) {
  const map = {}
  let names = []
  try { names = readdirSync(dir) } catch { return map } // missing dir -> no exports
  for (const name of names) {
    if (name.startsWith('.')) continue // hidden -> never ships
    const full = join(dir, name)
    let isDir = false, isFile = false
    try { const st = statSync(full); isDir = st.isDirectory(); isFile = st.isFile() } catch { continue }
    if (isDir) { Object.assign(map, walk(full, [...prefix, name])); continue }
    if (!isFile) continue
    if (!/\.(ts|tsx|astro)$/.test(name)) continue
    const segs = [...prefix, name.replace(/\.(ts|tsx|astro|css)$/, '')]
    if (name === 'index.ts') {
      const dirKey = prefix.length ? './' + prefix.join('/') : '.'
      map[dirKey] = './src/' + [...prefix, name].join('/')
      continue
    }
    map['./' + segs.join('/')] = './src/' + [...prefix, name].join('/')
  }
  return map
}

const derived = walk(src)
const rootTarget = './src/index.ts'
if (!existsSync(join(root, rootTarget))) {
  console.error('\nGHOST GATE FAILED: root export has no face — src/index.ts missing.\n')
  process.exit(1)
}
derived['.'] = rootTarget

// One deliberate CSS artifact. The walker excludes .css by design; the runtime
// tokens stylesheet is still a real consumer surface, so it gets a derived,
// ghost-gated entry. gen:tokens runs before gen:exports in the build chain,
// so dist/tokens.css exists by the time this gate runs.
if (existsSync(join(root, 'dist', 'tokens.css'))) {
  derived['./tokens.css'] = './dist/tokens.css'
}

// Component/layout CSS — canon owns the non-token CSS too. Derived from
// src/css/*.css and shipped to dist/css/ by scripts/build-css.mjs, which runs
// BEFORE gen:exports in the build chain so the targets exist for the ghost gate.
const cssDir = join(root, 'src', 'css')
if (existsSync(cssDir)) {
  for (const name of readdirSync(cssDir)) {
    if (!name.endsWith('.css')) continue
    const target = './dist/css/' + name
    if (existsSync(join(root, target))) derived['./css/' + name] = target
  }
}

// GHOST GATE — every target must resolve on disk before writing.
const ghosts = []
for (const [spec, target] of Object.entries(derived)) {
  if (!existsSync(join(root, target))) ghosts.push(spec + ' -> ' + target)
}
if (ghosts.length) {
  console.error('\nGHOST GATE FAILED — ' + ghosts.length + ' ghost export(s).\n')
  for (const g of ghosts) console.error('   * ' + g)
  process.exit(1)
}

const sorted = Object.fromEntries(
  Object.entries(derived).sort(([a], [b]) => (a < b ? -1 : 1)),
)
const pkgPath = join(root, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.exports = sorted
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log('canon exports derived: ' + Object.keys(sorted).length + ' specifiers, all resolve, 0 ghosts.')
