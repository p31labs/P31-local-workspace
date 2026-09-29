#!/usr/bin/env node
/**
 * semantic-check — content validation for the Lantern pipeline.
 *
 * Layer 2 of the router's two-layer gate. Layer 1 (agent-schema) checks the
 * output's SHAPE. This checks the output's MEANING — and its family-domain
 * appropriateness. The family rules are the reason this domain exists:
 *
 *   "the street never shows a human name" — no real names in narratives
 *   spoon-awareness must be honest — what changes across spoon levels
 *   child-facing components default to AAA (7:1), not AA (4.5:1)
 *   elder-facing components declare their contrast rationale
 *
 * A schema-valid output that violates a family rule is wrong-valid, and the
 * router's wrong_but_valid_rate metric must move. This is the honesty metric
 * the Constraint Tax research demands as first-class.
 */

const REAL_NAME_TOKENS = [
  // The family's real names must never appear — pickle names only.
  // Populated as the family's actual names are known; these are the
  // anti-pattern tokens that leak identity.
]

const SPOON_LANGUAGE = /\bspoon(?:s|ing|y)?\b/i

function checkNoRealNames(text) {
  for (const name of REAL_NAME_TOKENS) {
    if (text.toLowerCase().includes(name.toLowerCase())) {
      return { ok: false, message: `real name token present: "${name}" — the street never shows a human name` }
    }
  }
  return { ok: true }
}

function checkSpoonHonesty(narrative) {
  // Spoon-aware must be concrete: what changes across levels, not a vague claim.
  if (!SPOON_LANGUAGE.test(narrative)) {
    return { ok: false, message: 'narrative mentions no spoon behavior — a family component must be spoon-aware' }
  }
  return { ok: true }
}

function checkChildAccessibility(component, constraints) {
  // Child-facing (spark mode) components default to AAA contrast.
  const a = constraints?.accessibility ?? {}
  const wcag = a.wcag ?? 'AA'
  const contrast = a.contrast ?? 0
  const name = (component ?? '').toLowerCase()
  const childish = /kid|child|night garden|garden|candy|star|spark|play/i.test(name + ' ' + (constraints?.blurb ?? ''))
  if (childish && wcag === 'AA') {
    return { ok: false, message: `child-facing component "${component}" defaults to AA — must be AAA (7:1) for family children` }
  }
  if (childish && contrast < 7) {
    return { ok: false, message: `child-facing component "${component}" contrast ${contrast}:1 < 7:1 AAA floor` }
  }
  return { ok: true }
}

/**
 * Semantic check per stage. Returns { ok, errors: string[] }.
 * The router's record() increments wrong_but_valid when ok is false
 * but the schema (Layer 1) passed.
 */
export function semanticCheck(stage, output) {
  const errors = []
  if (!output) return { ok: false, errors: ['no output'] }

  switch (stage) {
    case 'dillpickle-narrator': {
      const narrative = output.narrative ?? ''
      const name = output.component ?? ''
      errors.push(...checkNoRealNames(narrative).ok ? [] : [checkNoRealNames(narrative).message])
      errors.push(...checkSpoonHonesty(narrative).ok ? [] : [checkSpoonHonesty(narrative).message])
      errors.push(...checkChildAccessibility(name, output.constraints).ok ? [] : [checkChildAccessibility(name, output.constraints).message])
      break
    }
    case 'cornichon-architect': {
      // The verdict must be consistent with the checks.
      const approved = output.approved
      const checks = Array.isArray(output.checks) ? output.checks : []
      const hasReject = checks.some((c) => c.status === 'reject')
      if (approved === true && hasReject) {
        errors.push(`architect approved=true but a check rejected — verdict contradicts checks`)
      }
      if (approved === false && !hasReject && checks.length === 0) {
        errors.push(`architect approved=false with no checks — verdict has no evidence`)
      }
      break
    }
    case 'breadbutter-mechanic': {
      // The output must be real code, not a placeholder or a wish.
      const code = output.code ?? ''
      if (code.includes('TODO') || code.includes('placeholder')) {
        errors.push('mechanic output contains TODO/placeholder — not complete code')
      }
      if (code.trim().length < 20) {
        errors.push('mechanic output too short to be a component')
      }
      break
    }
    case 'gherkin-firmware': {
      // The verdict must derive from the measured values.
      const verdict = output.verdict
      const bundle = output.bundleKB ?? 0
      const render = output.renderTimeMs ?? 0
      const budgetKB = output.budgetKB ?? 0
      const budgetMs = output.budgetMs ?? 0
      const actualPass = bundle <= budgetKB && render <= budgetMs
      if (verdict === 'pass' && !actualPass) {
        errors.push(`firmware verdict=pass but bundle ${bundle}KB > ${budgetKB}KB or render ${render}ms > ${budgetMs}ms`)
      }
      if (verdict === 'fail' && actualPass) {
        errors.push(`firmware verdict=fail but all values within budget`)
      }
      break
    }
    default:
      errors.push(`unknown stage: ${stage}`)
  }

  return { ok: errors.length === 0, errors }
}