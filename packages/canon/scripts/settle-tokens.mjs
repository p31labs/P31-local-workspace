#!/usr/bin/env node
/**
 * settle-tokens.mjs — ONE walker, ONE file, ONE hardcoded absolute path.
 *
 * This exists because two ad-hoc walkers disagreed on the same file and
 * both "looked fine." The only way to settle it is to make the walk and
 * the string-presence check run in the SAME process against the SAME
 * bytes. If they disagree here, something is actually broken — not a
 * cache, not a phantom.
 */
import { readFileSync } from 'node:fs'

const F = '/home/p31/P31-local-workspace/packages/canon/tokens/tokens.dtc.json'
const raw = readFileSync(F, 'utf8')
const tree = JSON.parse(raw)

/** Single canonical walk: collect every leaf ($value present). */
function walk(node, p = [], out = []) {
  if (!node || typeof node !== 'object') return out
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object' && '$value' in v) out.push([...p, k].join('.'))
    else if (v && typeof v === 'object') walk(v, [...p, k], out)
  }
  return out
}

const leaves = walk(tree)
const themesLeaves = leaves.filter((x) => x.startsWith('themes.'))
const p31Leaves = leaves.filter((x) => x.startsWith('p31.'))

console.log('file bytes         :', raw.length)
console.log('walk leaves total  :', leaves.length)
console.log('  p31.* leaves     :', p31Leaves.length)
console.log('  themes.* leaves  :', themesLeaves.length)
console.log('  outside both     :', leaves.filter((x) => !x.startsWith('p31.') && !x.startsWith('themes.')).length)
console.log('raw string present :', raw.includes('themes.cipher.p31.base'))
console.log('sample theme leaf  :', themesLeaves[0] ?? '(none)')
console.log('CONVERGE           :', leaves.length === (p31Leaves.length + themesLeaves.length))
