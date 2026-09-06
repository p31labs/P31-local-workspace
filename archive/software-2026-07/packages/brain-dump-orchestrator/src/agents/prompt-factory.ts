import type { Axis, Deliverable, ConvergenceGateCheck, AgentPrompt } from '../types/index.js';

export function generateAxisPrompt(axis: Axis): AgentPrompt {
  const deliverablesList = axis.deliverable.map((d: Deliverable) => `1. \`${d.filePath}\` — ${d.description}`).join('\n');
  const gateList = axis.convergenceGate.checks.map((c: ConvergenceGateCheck) => `- [ ] ${c.description}`).join('\n');

  const system = `You are the ${axis.agentRole} agent for ${axis.letter}. Your job: ${axis.focusArea}. No narration. Ship files.`;

  const user = `
## 🤖 Axis ${axis.letter} – ${axis.name}

**ROLE:** ${axis.agentRole}
**MISSION:** ${axis.focusArea}

**CONTEXT:**
This axis is part of a parallel Jitterbug execution. Other axes are running simultaneously. Do not wait for them. This axis must be fully self-contained.

**CRITICAL DESIGN RULES:**
${generateDesignRules(axis)}

**MISSION:**
${deliverablesList}

**CONSTRAINTS:**
- No hardcoded values that violate project constraints
- TypeScript strict mode — no \`any\` on public interfaces
- All new code must be complete and self-contained
- Do NOT reference build artifacts — ship source files

**DELIVERABLES (exact file list):**
${deliverablesList}

**CONVERGENCE GATE (must pass before declaring done):**
${gateList}

**OUTPUT FORMAT:**
For each file, output the FULL file content preceded by a header:
\`\`\`
### FILE: path/to/file
[complete file content]
\`\`\`
No diffs. No "..." truncation. Complete, copy-paste ready.`;

  return { system, user, outputFiles: axis.deliverable.map(d => d.filePath) };
}

function generateDesignRules(axis: Axis): string {
  const rules = [
    'All code must satisfy the convergence gate checks',
    'No silent failures — report errors explicitly',
  ];
  if (axis.complexity === 'high') {
    rules.push('Include integration tests for cross-cutting concerns');
  }
  return rules.map((r, i) => `${i + 1}. ${r}`).join('\n');
}
