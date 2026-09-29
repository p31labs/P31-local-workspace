import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseIntent, summarize, type ParseResult } from './intent/parser';
import type { IntentSpec } from './intent/schema';

const EXAMPLES = join(dirname(fileURLToPath(import.meta.url)), 'intent/examples');

export interface AgentStage {
  agent: 'dillpickle-narrator' | 'cornichon-architect' | 'breadbutter-mechanic' | 'gherkin-firmware';
  /** What this stage receives */
  input: string;
  /** What this stage must produce */
  output: string;
  /** Gate that can reject and send work back */
  gate?: 'qa-gates' | 'perf-budget';
}

/** The canonical tag-out plan for one component (canon §IV). */
export function pipelinePlan(): AgentStage[] {
  return [
    { agent: 'dillpickle-narrator', input: 'user request + design principles', output: 'Intent YAML (validated)' },
    { agent: 'cornichon-architect', input: 'Intent YAML', output: 'approved spec + trade-off rationale', gate: 'qa-gates' },
    { agent: 'breadbutter-mechanic', input: 'approved spec', output: 'component + recipes.css additions + tests + stories' },
    { agent: 'gherkin-firmware', input: 'generated code', output: 'profile report vs budget', gate: 'perf-budget' },
  ];
}

/**
 * Loads + validates every bundled example. Used by `p31 design list`
 * and CI to keep the DSL honest.
 */
export function loadExampleSpecs(): Record<string, ParseResult & { name: string; summary?: string[] }> {
  const out: Record<string, ParseResult & { name: string; summary?: string[] }> = {};
  const files = ['button-affirm', 'filter-toggle', 'crisis-exit', 'toast-love', 'modal-confirm', 'input-did', 'dropdown-actions', 'badge-status', 'spinner-patient', 'spoon-dial-editor'];
  for (const f of files) {
    const res = parseIntent(readFileSync(join(EXAMPLES, `${f}.yml`), 'utf8'));
    out[f] = {
      name: f,
      ...res,
      summary: res.ok ? summarize(res.spec as IntentSpec) : undefined,
    };
  }
  return out;
}
