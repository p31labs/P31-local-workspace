import type { ParsedIntent } from './intent-parser';

// Lightweight intent → capability-plan heuristic. Mirrors the MCP tool tiers
// in the mcp-x402 PRICING map so the Quote stays consistent with settlement.
const INTENT_TOOLS: Record<string, string[]> = {
  game: ['oasis_execute', 'phos-adopt', 'jitterbug-run'],
  arcade: ['oasis_execute', 'phos-adopt', 'jitterbug-run'],
  document: ['oasis_execute', 'phos-learn'],
  file: ['phos-adopt', 'phos-learn', 'phos-rollback'],
  deploy: ['phos-deploy', 'bus-emit'],
  heal: ['healer-remediate', 'phos-watch'],
  default: ['oasis_execute'],
};

export interface CapabilityPlan {
  tools: string[];
  a2ui_surface: any;
}

export function generateCapabilityPlan(intent: ParsedIntent): CapabilityPlan {
  const text = (intent.summary || '').toLowerCase();
  const match = Object.keys(INTENT_TOOLS).find((k) => text.includes(k)) || 'default';
  return { tools: INTENT_TOOLS[match], a2ui_surface: intent.description };
}
