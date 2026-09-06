// ═══════════════════════════════════════════════════════
// @p31/shared — Constitution Engine
//
// Three-tiered rule evaluation: Prime Directives (immutable),
// Global Rules (community consensus), Creator Rules (zone-specific).
// Creator Rules can be MORE restrictive than Global Rules but NEVER
// less restrictive.
//
// Based on WCD-SE-SDS specification for Spaceship Earth.
// ═══════════════════════════════════════════════════════

import { RuleTier, RuleOperator, RuleContext, RuleEvaluationResult, Rule, Constitution, RuleCondition, RuleAction } from './types';

/**
 * Evaluate rules against a context using three-tiered hierarchy.
 * Prime Directives are absolute and cannot be overridden.
 * Global Rules apply everywhere.
 * Creator Rules can only tighten restrictions, never relax them.
 */
export function evaluateRules(
  constitution: Constitution,
  context: RuleContext,
  zoneId?: string
): RuleEvaluationResult {
  const result: RuleEvaluationResult = {
    allowed: true,
    matchedRules: [],
    warnings: [],
    requiredAcknowledgments: [],
    transformations: [],
  };

  // Phase 1: Prime Directives — absolute, non-negotiable
  for (const rule of sortByPriority(constitution.primeDirectives)) {
    if (!rule.enabled) continue;
    if (matchesConditions(rule, context)) {
      result.matchedRules.push(rule);
      applyAction(rule.action, result);
      if (result.allowed === false) {
        result.deniedBy = rule;
        return result; // Prime Directive denial is final
      }
    }
  }

  // Phase 2: Global Rules
  for (const rule of sortByPriority(constitution.globalRules)) {
    if (!rule.enabled) continue;
    if (matchesConditions(rule, context)) {
      result.matchedRules.push(rule);
      applyAction(rule.action, result);
    }
  }
  const globalDeny = result.allowed === false;

  // Phase 3: Creator Rules — can only TIGHTEN, never RELAX
  if (zoneId) {
    const zoneRules = constitution.creatorRules.get(zoneId) ?? [];
    for (const rule of sortByPriority(zoneRules)) {
      if (!rule.enabled) continue;
      if (matchesConditions(rule, context)) {
        result.matchedRules.push(rule);
        // CRITICAL INVARIANT: Creator rules cannot reverse a Global denial
        // and cannot ALLOW something a Global rule denies
        if (rule.action.type === 'ALLOW' && globalDeny) continue; // Silent skip
        applyAction(rule.action, result);
      }
    }
  }

  return result;
}

/**
 * Sort rules by priority (highest first) within the same tier.
 */
function sortByPriority(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => b.priority - a.priority);
}

/**
 * Check if a rule's conditions match the given context.
 */
function matchesConditions(rule: Rule, ctx: RuleContext): boolean {
  const evalFn = rule.conditionLogic === 'AND'
    ? rule.conditions.every(c => evaluateCondition(c, ctx))
    : rule.conditions.some(c => evaluateCondition(c, ctx));
  return evalFn;
}

/**
 * Evaluate a single condition against the context.
 */
function evaluateCondition(c: RuleCondition, ctx: RuleContext): boolean {
  const knownFields = ['time', 'spoonBalance', 'karma', 'zoneEnergy', 'userId', 'zoneId'] as const;
  const actual = knownFields.includes(c.field as any)
    ? ctx[c.field as keyof Omit<RuleContext, 'metadata'>]
    : ctx.metadata?.[c.field];
  
  switch (c.operator) {
    case 'ALWAYS':
      return true;
    case 'EQUALS':
      return actual === c.value;
    case 'NOT_EQUALS':
      return actual !== c.value;
    case 'GREATER_THAN':
      return (actual as number) > (c.value as number);
    case 'LESS_THAN':
      return (actual as number) < (c.value as number);
    case 'CONTAINS':
      return (actual as string)?.includes?.(c.value as string) ?? false;
    case 'IN':
      return (c.value as string[]).includes(actual as string);
    case 'BETWEEN': {
      const [lo, hi] = c.value as [number, number];
      return (actual as number) >= lo && (actual as number) <= hi;
    }
    case 'TIME_RANGE': {
      const [start, end] = c.value as [number, number];
      const hour = new Date().getHours();
      return hour >= start && hour < end;
    }
    default:
      return false;
  }
}

/**
 * Apply a rule's action to the evaluation result.
 */
function applyAction(action: RuleAction, result: RuleEvaluationResult): void {
  switch (action.type) {
    case 'ALLOW':
      result.allowed = true;
      break;
    case 'DENY':
      result.allowed = false;
      break;
    case 'REQUIRE_ACK':
      result.requiredAcknowledgments.push(action.message);
      break;
    case 'WARN':
      result.warnings.push(action.message);
      break;
    case 'TRANSFORM':
      result.transformations.push(action);
      break;
    case 'SHIELD':
      result.transformations.push(action);
      break;
  }
}

/**
 * Create a default Constitution with Prime Directives.
 */
export function createDefaultConstitution(): Constitution {
  return {
    primeDirectives: [
      {
        id: 'pd-001',
        tier: RuleTier.PRIME_DIRECTIVE,
        name: 'Right to Sovereign Space',
        description: 'Every person has the right to a space where they can exist without justification.',
        conditions: [{ field: 'any', operator: 'ALWAYS', value: true, description: 'Applies universally' }],
        conditionLogic: 'AND',
        action: { type: 'ALLOW', message: 'Sovereign space rights are inviolable.' },
        priority: 1000,
        createdBy: 'SYSTEM',
        createdAt: Date.now(),
        enabled: true,
        immutable: true,
      }
    ],
    globalRules: [
      {
        id: 'gr-001',
        tier: RuleTier.GLOBAL,
        name: 'Quiet Hours',
        description: 'Respect quiet hours for rest and recovery.',
        conditions: [{ field: 'time', operator: 'TIME_RANGE', value: [22, 7], description: '10PM–7AM' }],
        conditionLogic: 'AND',
        action: { type: 'REQUIRE_ACK', message: 'Quiet hours active. Keep volume below conversational level.' },
        priority: 100,
        createdBy: 'COMMUNITY',
        createdAt: Date.now(),
        enabled: true,
        immutable: false,
      },
      {
        id: 'gr-002',
        tier: RuleTier.GLOBAL,
        name: 'Spoon Gate — Stand Down Protection',
        description: 'Protect cognitive energy when depleted.',
        conditions: [{ field: 'spoonBalance', operator: 'LESS_THAN', value: 1, description: 'Zero spoons remaining' }],
        conditionLogic: 'AND',
        action: { type: 'DENY', message: 'Stand Down active. You have no spoons remaining. Rest first.' },
        priority: 200,
        createdBy: 'COMMUNITY',
        createdAt: Date.now(),
        enabled: true,
        immutable: false,
      }
    ],
    creatorRules: new Map(),
  };
}

/**
 * Add a Creator Rule to a specific zone.
 */
export function addCreatorRule(
  constitution: Constitution,
  zoneId: string,
  rule: Omit<Rule, 'id' | 'tier' | 'createdAt' | 'immutable'>
): void {
  if (!zoneId) {
    throw new Error('Creator rules must specify a zoneId');
  }

  const fullRule: Rule = {
    ...rule,
    id: crypto.randomUUID(),
    tier: RuleTier.CREATOR,
    createdAt: Date.now(),
    immutable: false,
  };

  const zoneRules = constitution.creatorRules.get(zoneId) || [];
  zoneRules.push(fullRule);
  constitution.creatorRules.set(zoneId, zoneRules);
}

/**
 * Remove a Creator Rule from a specific zone.
 */
export function removeCreatorRule(
  constitution: Constitution,
  zoneId: string,
  ruleId: string
): boolean {
  const zoneRules = constitution.creatorRules.get(zoneId);
  if (!zoneRules) return false;

  const index = zoneRules.findIndex(r => r.id === ruleId);
  if (index === -1) return false;

  zoneRules.splice(index, 1);
  if (zoneRules.length === 0) {
    constitution.creatorRules.delete(zoneId);
  } else {
    constitution.creatorRules.set(zoneId, zoneRules);
  }
  return true;
}

/**
 * Update a Creator Rule in a specific zone.
 */
export function updateCreatorRule(
  constitution: Constitution,
  zoneId: string,
  ruleId: string,
  updates: Partial<Omit<Rule, 'id' | 'tier' | 'createdAt' | 'immutable' | 'createdBy'>>
): boolean {
  const zoneRules = constitution.creatorRules.get(zoneId);
  if (!zoneRules) return false;

  const ruleIndex = zoneRules.findIndex(r => r.id === ruleId);
  if (ruleIndex === -1) return false;

  zoneRules[ruleIndex] = { ...zoneRules[ruleIndex], ...updates };
  constitution.creatorRules.set(zoneId, zoneRules);
  return true;
}