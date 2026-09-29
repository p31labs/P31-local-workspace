#!/usr/bin/env node
/**
 * agent-schema — zero-dependency JSON validation for the Lantern pipeline.
 *
 * Each stage's output contract is a schema here. Validation is Layer 1 of the
 * router's two-layer gate (schema validity, then conformal set collapse).
 * A validator that cannot be shown to fail is furniture — see the NC in
 * tools/agent-router/nc/.
 */

function typeCheck(value, expected) {
  if (expected === 'number') return typeof value === 'number' && Number.isFinite(value)
  if (expected === 'string') return typeof value === 'string'
  if (expected === 'boolean') return typeof value === 'boolean'
  if (expected === 'array') return Array.isArray(value)
  if (expected === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value)
  return true
}

function getPath(obj, dotted) {
  return dotted.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj)
}

function validateAgainst(schema, value, path = '') {
  const errors = []
  for (const [key, rule] of Object.entries(schema)) {
    const p = path ? `${path}.${key}` : key
    const v = key.includes('.') ? getPath(value, key) : value?.[key]
    if (v === undefined) {
      errors.push(`${p}: missing`)
      continue
    }
    if (rule.type && !typeCheck(v, rule.type)) {
      errors.push(`${p}: expected ${rule.type}, got ${typeof v}`)
      continue
    }
    if (rule.enum && !rule.enum.includes(v)) {
      errors.push(`${p}: not one of ${rule.enum.join('|')}`)
    }
    if (rule.type === 'array' && rule.itemSchema) {
      for (let i = 0; i < v.length; i++) {
        errors.push(...validateAgainst(rule.itemSchema, v[i], `${p}[${i}]`))
      }
    }
  }
  return errors
}

/** Stage output contracts. Shared shape: the research's "schema is part of inference." */
export const STAGE_SCHEMAS = {
  'dillpickle-narrator': {
    component: { type: 'string' },
    narrative: { type: 'string' },
    constraints: {
      type: 'object',
    },
    'constraints.accessibility.wcag': { type: 'string', enum: ['AA', 'AAA'] },
    'constraints.accessibility.contrast': { type: 'number' },
    'constraints.accessibility.touchTarget': { type: 'number' },
    'constraints.spoonAware': { type: 'boolean' },
    'constraints.performance.bundle': { type: 'number' },
    'constraints.performance.renderTime': { type: 'number' },
  },
  'cornichon-architect': {
    approved: { type: 'boolean' },
    checks: {
      type: 'array',
      itemSchema: {
        name: { type: 'string' },
        status: { type: 'string', enum: ['pass', 'warn', 'reject'] },
        detail: { type: 'string' },
      },
    },
  },
  'breadbutter-mechanic': {
    component: { type: 'string' },
    code: { type: 'string' },
    css: { type: 'string' },
    tests: { type: 'string' },
    story: { type: 'string' },
    limitations: { type: 'string' },
  },
  'gherkin-firmware': {
    component: { type: 'string' },
    bundleKB: { type: 'number' },
    renderTimeMs: { type: 'number' },
    budgetKB: { type: 'number' },
    budgetMs: { type: 'number' },
    verdict: { type: 'string', enum: ['pass', 'fail'] },
    detail: { type: 'string' },
  },
}

/** Validate a parsed output against a stage schema. Returns { ok, errors }. */
export function validateStageOutput(stage, output) {
  const schema = STAGE_SCHEMAS[stage]
  if (!schema) return { ok: false, errors: [`unknown stage: ${stage}`] }
  const errors = validateAgainst(schema, output)
  return { ok: errors.length === 0, errors }
}

/** Parse a model's text, tolerating fenced JSON, then validate. */
export function parseAndValidate(stage, text) {
  const cleaned = text
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim()
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return { ok: false, errors: ['invalid-json'], parsed: null }
  }
  const v = validateStageOutput(stage, parsed)
  return { ok: v.ok, errors: v.errors, parsed }
}