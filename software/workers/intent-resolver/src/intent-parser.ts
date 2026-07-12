import { generateInterfaceFromIntent } from '@p31/interface-generator';
import { classifyIntent, type NeedleResult, type NeedleError } from './needle-engine';
import { P31_TOOLS } from './tools';

export interface ParsedIntent {
  summary: string;
  spoons: number;
  passport: any;
  description: any;
  needle_used: boolean;
  fallback_reason?: string;
  needle_result?: NeedleResult;
}

export async function parseIntent(
  prompt: string,
  passport: any,
  spoons: number,
  env?: { NEEDLE_WEIGHTS: R2Bucket },
): Promise<ParsedIntent> {
  // 1. Try Needle transformer for tool classification.
  let needleResult: NeedleResult | null = null;
  let fallback_reason: string | undefined;

  if (env?.NEEDLE_WEIGHTS) {
    needleResult = await classifyIntent(prompt, P31_TOOLS, env);
  }

  if (!needleResult) {
    fallback_reason = env?.NEEDLE_WEIGHTS
      ? 'Needle init or inference failed, using heuristic fallback'
      : 'NEEDLE_WEIGHTS binding not configured';
  }

  // 2. UIG for interface generation (always — Needle doesn't handle UI).
  const description = generateInterfaceFromIntent({ prompt, spoons, role: 'participant' });

  const summary = needleResult
    ? `${needleResult.tool} (via needle)`
    : (description.widgets ?? [])
        .filter((w: any) => w.type === 'text-block')
        .map((w: any) => w.title)
        .join(' ') || prompt.slice(0, 120);

  return {
    summary,
    spoons,
    passport,
    description,
    needle_used: !!needleResult,
    fallback_reason,
    needle_result: needleResult ?? undefined,
  };
}
