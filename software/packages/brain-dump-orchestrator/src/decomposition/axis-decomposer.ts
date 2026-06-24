import type { Axis, ConvergenceGateCheck } from '../types/index.js';

export function decomposeBrainDump(bd: {
  projectName: string;
  coreProblem: string;
  currentState: {
    artifacts: Array<{ path: string; description: string; status: string }>;
    gaps: Array<{ description: string; severity: string }>;
    blockers: Array<{ description: string; type: string }>;
  };
  constraints: Array<{ id: string; rule: string; severity: string }>;
  desiredEndState: { description: string; targetStage: string; measurableCriteria: string[]; convergenceTarget: string };
  knownAssets: Array<{ name: string; description: string }>;
  openQuestions: Array<{ id: string; question: string; priority: string }>;
}, config?: { minAxes?: number; maxAxes?: number; requireSelfContained?: boolean }): Axis[] {
  const axes: Axis[] = [];
  const focusAreas = identifyFocusAreas(bd);
  const complexities = rateComplexities(focusAreas);

  for (let i = 0; i < focusAreas.length; i++) {
    const area = focusAreas[i];
    const letter = String.fromCharCode(65 + i);
    const complexity = complexities[i] || 'medium';

    const convergenceGate = buildConvergenceGate(area, complexity);

    axes.push({
      id: `${bd.projectName.toLowerCase().replace(/\s+/g, '-')}-axis-${letter.toLowerCase()}`,
      letter,
      name: area.name,
      focusArea: area.description,
      agentRole: area.agentRole,
      deliverable: area.deliverables,
      convergenceGate,
      complexity,
      dependencies: extractDependencies(area),
      status: 'pending',
    });
  }

  return enforceSelfContained(axes, config?.requireSelfContained ?? true);
}

export function identifyFocusAreas(bd: {
  projectName: string;
  constraints: Array<{ rule: string }>;
  currentState: { artifacts: Array<{ path: string; description: string }>; gaps: Array<{ description: string; severity: string }> };
  knownAssets: Array<{ name: string }>;
}): Array<{ name: string; description: string; agentRole: string; deliverables: Array<{ description: string; filePath: string; acceptanceCriteria: string[] }> }> {
  const areas: Array<{ name: string; description: string; agentRole: string; deliverables: Array<{ description: string; filePath: string; acceptanceCriteria: string[] }> }> = [];

  const hasLegal = bd.constraints.some((c: { rule: string }) => /legal|court|ADA|FERPA|compliance/i.test(c.rule));
  const hasGrants = bd.knownAssets.some((a: { name: string }) => /grant|fiscal|501\(c\)|SAM\.gov/i.test(a.name));
  const hasSecurity = bd.constraints.some((c: { rule: string }) => /security|sovereign|trust|crypto/i.test(c.rule));
  const hasFrontend = bd.currentState.artifacts.some((a: { path: string }) => /\.astro|\.jsx|\.tsx|pwa|ui/i.test(a.path));
  const hasBackend = bd.currentState.artifacts.some((a: { path: string }) => /worker|api|backend|server/i.test(a.path));
  const hasTests = bd.currentState.gaps.some((g: { description: string }) => /test|coverage|suite/i.test(g.description));

  if (hasLegal || hasGrants) {
    areas.push({
      name: 'Legal & Grants',
      description: 'Legal compliance, grant strategy, and corporate filings',
      agentRole: 'Legal Architect',
      deliverables: [
        { description: 'Grant application draft', filePath: `docs/grants/${bd.projectName.toLowerCase().replace(/\s+/g, '-')}-grant.md`, acceptanceCriteria: ['Citations verified', 'EIN consistent', 'Under word count'] },
        { description: 'Compliance checklist', filePath: `docs/legal/${bd.projectName.toLowerCase().replace(/\s+/g, '-')}-compliance.md`, acceptanceCriteria: ['All constraints mapped', 'No hallucinated citations'] },
      ],
    });
  }

  if (hasSecurity || bd.constraints.some((c: { rule: string }) => /zero trust|eigentrust|sybil/i.test(c.rule))) {
    areas.push({
      name: 'Trust & Security',
      description: 'Trust architecture, EigenTrust implementation, SSRF protection',
      agentRole: 'Security Architect',
      deliverables: [
        { description: 'Trust architecture document', filePath: `docs/security/${bd.projectName.toLowerCase().replace(/\s+/g, '-')}-trust.md`, acceptanceCriteria: ['EigenTrust params documented', 'Genosis weight defined'] },
        { description: 'Security test suite', filePath: `tests/${bd.projectName.toLowerCase().replace(/\s+/g, '-')}.security.test.ts`, acceptanceCriteria: ['100% pass', 'No magic numbers'] },
      ],
    });
  }

  if (hasFrontend) {
    areas.push({
      name: 'UI & Experience',
      description: 'Frontend components, accessibility, voice interfaces',
      agentRole: 'Frontend Architect',
      deliverables: [
        { description: 'Accessibility report', filePath: `docs/a11y/${bd.projectName.toLowerCase().replace(/\s+/g, '-')}-a11y.md`, acceptanceCriteria: ['WCAG AA pass', 'No hardcoded identities'] },
      ],
    });
  }

  if (hasBackend) {
    areas.push({
      name: 'Runtime & Infrastructure',
      description: 'Workers, DOs, KV, deployment configs',
      agentRole: 'Runtime Architect',
      deliverables: [
        { description: 'Deployment runbook', filePath: `docs/ops/${bd.projectName.toLowerCase().replace(/\s+/g, '-')}-deploy.md`, acceptanceCriteria: ['No hardcoded secrets', 'Cron schedules documented'] },
      ],
    });
  }

  if (hasTests || bd.currentState.gaps.length > 0) {
    areas.push({
      name: 'Quality & Verification',
      description: 'Test coverage, convergence validation, OQE checks',
      agentRole: 'QA Architect',
      deliverables: [
        { description: 'Test augmentation plan', filePath: `tests/${bd.projectName.toLowerCase().replace(/\s+/g, '-')}-qa.md`, acceptanceCriteria: ['Coverage targets met', 'All new tests pass'] },
      ],
    });
  }

  if (areas.length < 2) {
    areas.push({
      name: 'Specification',
      description: 'Core specification and interface design',
      agentRole: 'Architect',
      deliverables: [
        { description: 'Specification document', filePath: `docs/spec/${bd.projectName.toLowerCase().replace(/\s+/g, '-')}-spec.md`, acceptanceCriteria: ['All interfaces defined', 'No unresolved unknowns'] },
      ],
    });
  }

  while (areas.length < 2) {
    areas.push({
      name: 'Integration',
      description: 'Cross-cutting integration and documentation',
      agentRole: 'Integration Architect',
      deliverables: [
        { description: 'Integration README', filePath: `docs/integration/${bd.projectName.toLowerCase().replace(/\s+/g, '-')}-integration.md`, acceptanceCriteria: ['All dependencies documented', 'Setup steps verified'] },
      ],
    });
  }

  return areas.slice(0, 8);
}

export function rateComplexities(areas: ReturnType<typeof identifyFocusAreas>): Array<'low' | 'medium' | 'high'> {
  return areas.map((area) => {
    if (area.deliverables.length >= 3) return 'high';
    if (area.deliverables.length >= 2) return 'medium';
    return 'low';
  });
}

function buildConvergenceGate(area: { deliverables: Array<{ description: string; acceptanceCriteria: string[] }> }, complexity: string): { checks: ConvergenceGateCheck[]; overallCriteria: string } {
  const checks: ConvergenceGateCheck[] = area.deliverables.map((d, i) => ({
    id: `gate-${i + 1}`,
    description: `${d.description}: ${d.acceptanceCriteria.join(', ')}`,
    type: 'custom',
    config: { criteria: d.acceptanceCriteria },
  }));

  if (complexity === 'high') {
    checks.push({
      id: 'gate-integration',
      description: 'All deliverables integrate without conflicts',
      type: 'custom',
      config: { checkType: 'integration' },
    });
  }

  return {
    checks,
    overallCriteria: `All ${checks.length} checks pass with zero violations`,
  };
}

function extractDependencies(_area: { deliverables: Array<{ filePath: string }> }): string[] {
  return [];
}

function enforceSelfContained(axes: Axis[], requireSelfContained: boolean): Axis[] {
  const seenNames = new Set<string>();
  return axes.filter((axis) => {
    if (!requireSelfContained) return true;
    if (seenNames.has(axis.name)) return false;
    seenNames.add(axis.name);
    return true;
  });
}

export const DEFAULT_DECOMPOSITION_CONFIG = {
  minAxes: 3,
  maxAxes: 8,
  requireSelfContained: true,
};
