#!/usr/bin/env node
/**
 * p31-standards eval harness — deterministic, no LLM.
 *
 * Runs the golden eval cases under workers/design-mcp/skills/p31-standards/evals/
 * against the audit rules declared in SKILL.md. Each case carries an
 * expected.json that names, per rule, the exact {line, rule} flags that MUST
 * fire and the rules that MUST pass. The harness compares actual rule output
 * to the golden expectations and exits nonzero on any drift.
 *
 * Reaches the SAME conclusion as the CI that gates a merge: if this exits
 * nonzero, the standard is broken. No agent self-reporting required.
 *
 * Usage: node scripts/skills-eval.mjs [--fix-baseline]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EVALS_ROOT = path.resolve(__dirname, '..', 'workers', 'design-mcp', 'skills', 'p31-standards', 'evals')

// ─── Rule implementations (deterministic, regex + structure) ─────────────────
// Each rule: (lines: string[]) => Array<{ line, rule, severity, message }>
// `line` is 1-based.

function noHardcodedHex(lines) {
  const flags = []
  lines.forEach((text, i) => {
    const re = /#[0-9a-fA-F]{3,8}\b/g
    let m
    while ((m = re.exec(text)) !== null) {
      flags.push({
        line: i + 1,
        rule: 'no-hardcoded-hex',
        severity: 'MUST',
        message: `Hardcoded hex color ${m[0]}. Use a var(--p31-*) token.`,
      })
      if (m.index === re.lastIndex) re.lastIndex++
    }
  })
  return flags
}

function noMediaQueries(lines) {
  const flags = []
  lines.forEach((text, i) => {
    if (/@media\s/.test(text)) {
      flags.push({
        line: i + 1,
        rule: 'no-media-queries',
        severity: 'SHOULD',
        message: 'Fixed @media breakpoint. Use container queries or fluid clamp().',
      })
    }
  })
  return flags
}

function noInlineStyles(lines) {
  const flags = []
  let open = -1
  lines.forEach((text, i) => {
    if (open >= 0) {
      flags.push({
        line: i + 1,
        rule: 'no-inline-styles',
        severity: 'MUST',
        message: 'Inline style object. Declare tokens/classes instead.',
      })
      if (text.includes('}}')) open = -1
      return
    }
    if (text.includes('style={{')) {
      flags.push({
        line: i + 1,
        rule: 'no-inline-styles',
        severity: 'MUST',
        message: 'Inline style object. Declare tokens/classes instead.',
      })
      if (!text.includes('}}')) open = i
    } else if (text.includes('style={')) {
      flags.push({
        line: i + 1,
        rule: 'no-inline-styles',
        severity: 'MUST',
        message: 'Inline style object. Declare tokens/classes instead.',
      })
    }
  })
  return flags
}

const BARE_TAGS = ['div', 'span', 'button', 'ul', 'li', 'a', 'p', 'h1', 'h2', 'h3']

function noUnstyledTags(lines) {
  const flags = []
  lines.forEach((text, i) => {
    for (const tag of BARE_TAGS) {
      const re = new RegExp(`<${tag}(?=[\\s/>])`)
      if (re.test(text)) {
        flags.push({
          line: i + 1,
          rule: 'no-unstyled-tags',
          severity: 'WARN',
          message: `Bare HTML tag <${tag}> in P31 surface. Use design-core primitives/compositions.`,
        })
        break
      }
    }
  })
  return flags
}

function spoonsDeclared(lines) {
  const flags = []
  const interactive = /<(Button|button|a|Input|TextInput)(?=[\s>])/
  lines.forEach((text, i) => {
    if (interactive.test(text) && !/data-spoons=/.test(text)) {
      flags.push({
        line: i + 1,
        rule: 'spoons-declared',
        severity: 'SHOULD',
        message: 'Interactive element missing data-spoons cost. 2 = read+respond.',
      })
    }
  })
  return flags
}

function motionRhythm(lines) {
  const text = lines.join('\n')
  const hasReducedMotion = /prefers-reduced-motion/.test(text)
  const flags = []
  const animRe = /(animation|transition):\s*[^;]+/g
  lines.forEach((line, i) => {
    let m
    while ((m = animRe.exec(line)) !== null) {
      const value = m[0]
      if (!value.includes('--p31-motion')) {
        flags.push({
          line: i + 1,
          rule: 'motion-rhythm',
          severity: 'SHOULD',
          message: 'Animation duration not on P31 863Hz rhythm. Use var(--p31-motion-*) and respect prefers-reduced-motion.',
        })
      }
    }
  })
  if (!hasReducedMotion && flags.length === 0 && /animation|transition:/.test(text)) {
    // If any motion exists but no reduced-motion guard, flag the first motion line.
    const idx = lines.findIndex((l) => /(animation|transition):/.test(l))
    if (idx >= 0) {
      flags.push({
        line: idx + 1,
        rule: 'motion-rhythm',
        severity: 'SHOULD',
        message: 'Motion used without prefers-reduced-motion guard.',
      })
    }
  }
  return flags
}

function a11yTouchTarget(lines) {
  const flags = []
  lines.forEach((text, i) => {
    if (!/<(button|a|Input|TextInput)(?=[\s>])/.test(text)) return
    const sizing = /width:\s*(\d+)px|height:\s*(\d+)px|style=\{[^}]*:\s*(\d{1,2})\b/
    const m = sizing.exec(text)
    const classes = text.match(/className="[^"]*"/)
    const hasP31BtnClass = classes && /p31-btn/.test(classes[0])
    if (m) {
      const dims = [m[1], m[2], m[3]].filter(Boolean).map(Number)
      if (dims.some((d) => d < 48) && !hasP31BtnClass) {
        flags.push({
          line: i + 1,
          rule: 'a11y-touch-target',
          severity: 'MUST',
          message: 'Touch target < 48px on coarse pointer (WCAG 2.5.8).',
        })
      }
    }
  })
  return flags
}

function a11yAriaLabel(lines) {
  const flags = []
  lines.forEach((text, i) => {
    if (!/<(button|a|Input|TextInput)(?=[\s>])/.test(text)) return
    const hasLabel = />?\s*[A-Za-z][^<]*<\/|aria-label=|title=/.test(text)
    if (!hasLabel) {
      flags.push({
        line: i + 1,
        rule: 'a11y-aria-label',
        severity: 'MUST',
        message: 'Icon-only control must have aria-label.',
      })
    }
  })
  return flags
}

const CONTRACT_ELEMENTS = ['Card', 'GlassCard', 'Button', 'GlassPanel', 'ChatMessage']

function contractPropInvented(lines) {
  const flags = []
  lines.forEach((text, i) => {
    const el = CONTRACT_ELEMENTS.find((c) => new RegExp(`<${c}(?=[\\s/>])`).test(text))
    if (!el) return
    const invented = new RegExp(/(?:elevation|glow|shadowColor|borderRadius|paddingX|paddingY|fontSize)=("[^"]*"|'[^']*'|\{[^}]*\})/g)
    for (const match of text.matchAll(invented)) {
      flags.push({
        line: i + 1,
        rule: 'contract-prop-invented',
        severity: 'MUST',
        message: `${match[0]} not in ${el} contract. Use semantic parts (${el}.Header/Body/Footer).`,
      })
    }
  })
  return flags
}

function transientState(lines) {
  const flags = []
  const text = lines.join('\n')
  const persists = /localStorage\.setItem|useState\(|\.setItem\(/.test(text)
  const derives = /(isUnread|isStreaming|isActive)\s*=\s*[^;]*[><]=?/.test(text)
  if (persists && !derives) {
    flags.push({
      line: 1,
      rule: 'transient-state',
      severity: 'MUST',
      message: 'Transient state must be derived (e.g. isUnread = updatedAt > lastViewedAt), never persisted.',
    })
  }
  return flags
}

// ─── Rule registry & scope ───────────────────────────────────────────────────

const RULES = {
  'no-hardcoded-hex': noHardcodedHex,
  'no-media-queries': noMediaQueries,
  'no-inline-styles': noInlineStyles,
  'no-unstyled-tags': noUnstyledTags,
  'spoons-declared': spoonsDeclared,
  'motion-rhythm': motionRhythm,
  'a11y-touch-target': a11yTouchTarget,
  'a11y-aria-label': a11yAriaLabel,
  'contract-prop-invented': contractPropInvented,
  'transient-state': transientState,
}

const PASS_RULE_MISSING_OVERRIDES = new Map()

// ─── Harness ─────────────────────────────────────────────────────────────────

function loadCases(root) {
  const cases = []
  for (const dir of fs.readdirSync(root)) {
    const caseDir = path.join(root, dir)
    if (!fs.statSync(caseDir).isDirectory()) continue
    const input = fs.readdirSync(caseDir).find((f) => f.startsWith('input'))
    const expectedFile = path.join(caseDir, 'expected.json')
    if (!input || !fs.existsSync(expectedFile)) continue
    const ext = path.extname(input)
    cases.push({
      name: dir,
      inputPath: path.join(caseDir, input),
      ext,
      expected: JSON.parse(fs.readFileSync(expectedFile, 'utf8')),
    })
  }
  return cases.sort((a, b) => a.name.localeCompare(b.name))
}

function runCase(caze) {
  const src = fs.readFileSync(caze.inputPath, 'utf8')
  const lines = src.split('\n')
  // Strip trailing empty line artifact from write (files written with trailing newline).
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()

  const expectedFlagRules = new Set((caze.expected.flags || []).map((f) => f.rule))
  const expectedPassRules = new Set((caze.expected.passes || []).map((p) => p.rule))
  const scoped = new Set([...expectedFlagRules, ...expectedPassRules])

  const actual = []
  const problems = []
  for (const [ruleName, fn] of Object.entries(RULES)) {
    if (!scoped.has(ruleName)) continue
    let flags
    try {
      flags = fn(lines)
    } catch (e) {
      problems.push(`rule ${ruleName} threw: ${e.message}`)
      continue
    }
    actual.push(...flags)

    if (expectedPassRules.has(ruleName) && flags.length > 0) {
      problems.push(
        `rule ${ruleName} must PASS but flagged ${flags.map((f) => `L${f.line}`).join(', ')}`
      )
    }
  }

  if (expectedPassRules.has('chat-shell-contract') && !src.includes('ChatShell')) {
    problems.push('rule chat-shell-contract must PASS but ChatShell is not imported/used')
  }

  // Exact flag match (line + rule), tolerant to message wording.
  const actualKey = actual.map((f) => `${f.rule}@${f.line}`)
  const expectedKey = (caze.expected.flags || []).map((f) => `${f.rule}@${f.line}`)
  const missing = expectedKey.filter((k) => !actualKey.includes(k))
  const unexpected = actualKey.filter((k) => !expectedKey.includes(k))
  if (missing.length > 0) problems.push(`missing expected flags: ${missing.join(', ')}`)
  if (unexpected.length > 0) problems.push(`unexpected flags: ${unexpected.join(', ')}`)

  return { name: caze.name, expected: caze.expected, actual, problems, lines: lines.length }
}

function main() {
  const fixBaseline = process.argv.includes('--fix-baseline')
  const cases = loadCases(EVALS_ROOT)
  if (cases.length === 0) {
    console.error('No eval cases found under ' + EVALS_ROOT)
    process.exit(1)
  }

  let passCount = 0
  let failCount = 0
  for (const caze of cases) {
    const result = runCase(caze)
    if (fixBaseline) {
      const expectedFile = path.join(EVALS_ROOT, result.name, 'expected.json')
      const flags = result.actual.map((f) => ({ line: f.line, rule: f.rule, message: f.message }))
      fs.writeFileSync(expectedFile, JSON.stringify({ flags, passes: [] }, null, 2) + '\n')
      console.log(`🔧 ${result.name}: baseline rewritten`)
      continue
    }
    if (result.problems.length === 0) {
      passCount++
      console.log(`✅ ${result.name}: ${result.actual.length} flag(s) match golden expectation`)
    } else {
      failCount++
      console.log(`❌ ${result.name}:`)
      for (const p of result.problems) console.log(`   - ${p}`)
    }
  }

  if (fixBaseline) {
    console.log(`\nRewrote baselines for ${cases.length} case(s). Inspect and commit deliberately.`)
    process.exit(0)
  }

  console.log(`\n${passCount} passed, ${failCount} failed (${cases.length} total)`)
  if (failCount > 0) process.exit(1)
  process.exit(0)
}

main()