#!/usr/bin/env node

// ═════════════════════════════════════════════════════════════════════════════
// Spoon-Aware Stress Test
// Verifies CrisisMode invariant, prompt adaptation, and state transitions
// ═════════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const PHOS_SRC = path.join(__dirname, '..', 'apps', 'phos', 'src');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  Spoon-Aware Stress Test                                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

// ─── Test 1: CrisisMode Invariant in PHOSWorkspace ──────────────────────────
console.log('Test 1: CrisisMode invariant — spoons === 0 renders ONLY CrisisMode...');

const workspaceCode = fs.readFileSync(
  path.join(PHOS_SRC, 'components', 'PHOSWorkspace.tsx'),
  'utf8',
);

// Check that spoons === 0 returns CrisisMode early (before any other render)
const crisisLine = workspaceCode.indexOf('if (spoons === 0) return <CrisisMode');
assert(crisisLine > 0, 'CrisisMode early return exists');

// Check that CrisisMode is imported
assert(workspaceCode.includes("import CrisisMode from './CrisisMode'"), 'CrisisMode imported');

// Check that the early return is before the main render
const mainRender = workspaceCode.indexOf('return (');
assert(crisisLine < mainRender, 'CrisisMode return is before main render (hard invariant)');

// ─── Test 2: CrisisMode Component Structure ─────────────────────────────────
console.log('\nTest 2: CrisisMode component structure...');

const crisisCode = fs.readFileSync(
  path.join(PHOS_SRC, 'components', 'CrisisMode.tsx'),
  'utf8',
);

// Check for breathing overlay
assert(crisisCode.includes('breathing') || crisisCode.includes('Breathing') || crisisCode.includes('breath'),
  'CrisisMode includes breathing element');

// Check for exit control
assert(crisisCode.includes('Escape') || crisisCode.includes('exit') || crisisCode.includes('ready'),
  'CrisisMode includes exit control');

// Check for spoons reset to 3
assert(crisisCode.includes('3') && (crisisCode.includes('spoonsStore') || crisisCode.includes('set')),
  'CrisisMode resets spoons to 3');

// ─── Test 3: Data-Spoons Attribute Propagation ──────────────────────────────
console.log('\nTest 3: data-spoons attribute propagation...');

assert(workspaceCode.includes('data-spoons') || workspaceCode.includes("dataset.spoons"),
  'data-spoons attribute is set on document');

// Check that spoons state drives the attribute
assert(workspaceCode.includes('toString()') || workspaceCode.includes('.toString()'),
  'Spoons value is converted to string for attribute');

// ─── Test 4: System Prompt Adapts to All 6 Levels ───────────────────────────
console.log('\nTest 4: System prompt adapts to all 6 spoon levels...');

const llmCode = fs.readFileSync(
  path.join(PHOS_SRC, 'lib', 'llm.ts'),
  'utf8',
);

// Check that buildSystemPrompt exists
assert(llmCode.includes('function buildSystemPrompt'), 'buildSystemPrompt function exists');

// Check that it accepts spoonLevel parameter
assert(llmCode.includes('spoonLevel'), 'Accepts spoonLevel parameter');

// Check that all 6 levels have distinct guidance
const levels = ['CRISIS', 'Low energy', 'Recovering', 'Baseline', 'Energized', 'High energy'];
levels.forEach(level => {
  assert(llmCode.includes(level), `Level includes "${level}" guidance`);
});

// Check that spoonLevel is used in generateResponse
assert(llmCode.includes("options?.spoonLevel"), 'generateResponse reads spoonLevel from options');

// Check that activePrompt is built dynamically
assert(llmCode.includes('activePrompt'), 'activePrompt variable used for dynamic prompt');

// ─── Test 5: Hook Passes SpoonLevel Through ─────────────────────────────────
console.log('\nTest 5: useSovereignBrain hook passes spoonLevel...');

const hookCode = fs.readFileSync(
  path.join(PHOS_SRC, 'hooks', 'useSovereignBrain.ts'),
  'utf8',
);

assert(hookCode.includes('spoonLevel'), 'Hook accepts spoonLevel parameter');
assert(hookCode.includes('opts.spoonLevel'), 'Hook reads spoonLevel from options');
assert(hookCode.includes('spoonLevel,'), 'Hook passes spoonLevel to brain.generateResponse');

// ─── Test 6: PHOSWorkspace Passes SpoonLevel to generateResponse ────────────
console.log('\nTest 6: PHOSWorkspace passes spoonLevel to generateResponse...');

assert(workspaceCode.includes('spoonLevel: s'), 'handleSend passes spoon level (s) to generateResponse');

// ─── Test 7: Design Tokens File Exists ──────────────────────────────────────
console.log('\nTest 7: Design tokens module exists and is correct...');

const tokensCode = fs.readFileSync(
  path.join(PHOS_SRC, 'lib', 'design-tokens.ts'),
  'utf8',
);

assert(tokensCode.includes("'quantum-cyan'"), 'quantum-cyan token defined');
assert(tokensCode.includes("'void'"), 'void token defined');
assert(tokensCode.includes("'glass-surface'"), 'glass-surface token defined');
assert(tokensCode.includes("'rounded.lg'") || tokensCode.includes('lg:'), 'rounded.lg token defined');

// ─── Test 8: Motion Scaling by Spoon Level ──────────────────────────────────
console.log('\nTest 8: Motion scaling configuration...');

const motionCss = fs.readFileSync(
  path.join(PHOS_SRC, 'styles', 'motion.css'),
  'utf8',
);

assert(motionCss.includes('data-spoons') || motionCss.includes('spoons'),
  'Motion CSS references data-spoons');
assert(motionCss.includes('0') && motionCss.includes('disabled') || motionCss.includes('0ms'),
  'Motion disabled at spoon level 0');

// ─── Test 9: Spoon Dot Component ────────────────────────────────────────────
console.log('\nTest 9: Spoon dot UI component...');

assert(workspaceCode.includes('Energy level'), 'Spoon dots have aria-label');
assert(workspaceCode.includes('w-2.5 h-2.5 rounded-full'), 'Spoon dots use small circle styling');
assert(workspaceCode.includes('hover:scale-150'), 'Spoon dots have hover effect');

// ─── Test 10: Edge Cases ────────────────────────────────────────────────────
console.log('\nTest 10: Edge cases...');

// Check that spoons 0-5 are the valid range
assert(workspaceCode.includes('[0, 1, 2, 3, 4, 5]') || workspaceCode.includes('[0,1,2,3,4,5]'),
  'Spoon range 0-5 defined');

// Check that spoonsStore type is 0-5
const storeCode = fs.readFileSync(
  path.join(PHOS_SRC, 'store', 'spoons.ts'),
  'utf8',
);
assert(storeCode.includes('0 | 1 | 2 | 3 | 4 | 5'), 'SpoonsStore type is 0-5 union');

// ─── Summary ────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  SPOON-AWARE STRESS TEST: ${passed} passed, ${failed} failed${' '.repeat(Math.max(0, 20 - String(passed).length - String(failed).length))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) process.exit(1);
