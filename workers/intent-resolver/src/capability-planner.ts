import type { ParsedIntent } from './intent-parser';

// Keyword → tool array mapping (heuristic fallback when Needle is unavailable).
const INTENT_TOOLS: Record<string, string[]> = {
  game: ['oasis_execute', 'phos_adopt', 'jitterbug_run'],
  arcade: ['oasis_execute', 'phos_adopt', 'jitterbug_run'],
  document: ['oasis_execute', 'phos_learn'],
  file: ['phos_adopt', 'phos_learn', 'phos_rollback'],
  deploy: ['phos_deploy', 'bus_emit'],
  heal: ['healer_remediate', 'phos_watch'],
  default: ['oasis_execute'],
};

export interface CapabilityPlan {
  tools: string[];
  a2ui_surface: any;
  needle_used: boolean;
}

export function generateCapabilityPlan(intent: ParsedIntent): CapabilityPlan {
  // If Needle classified the intent, use its tool selection directly.
  if (intent.needle_used && intent.needle_result) {
    return {
      tools: [intent.needle_result.tool],
      a2ui_surface: intent.description,
      needle_used: true,
    };
  }

  // Heuristic fallback: keyword lookup in INTENT_TOOLS.
  const text = (intent.summary || '').toLowerCase();
  const match = Object.keys(INTENT_TOOLS).find((k) => text.includes(k)) || 'default';
  return {
    tools: INTENT_TOOLS[match],
    a2ui_surface: intent.description,
    needle_used: false,
  };
}
