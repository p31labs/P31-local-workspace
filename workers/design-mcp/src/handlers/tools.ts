import { COMPONENT_CONTRACTS } from '../generated/contracts';
import { COMPONENT_DEFS } from '../generated/componentDefs';

export async function handleToggleDrawer(args: { state: 'open' | 'closed', target: string, surfaceId?: string, userId?: string }): Promise<any> {
  return {
    success: true,
    action: 'toggleDrawer',
    target: args.target,
    state: args.state,
    surfaceId: args.surfaceId || null,
    userId: args.userId || null,
  };
}

export async function handleNavigate(args: { href: string, external?: boolean, surfaceId?: string, userId?: string }): Promise<any> {
  return {
    success: true,
    action: 'navigate',
    href: args.href,
    external: args.external || false,
    surfaceId: args.surfaceId || null,
    userId: args.userId || null,
  };
}

export async function handleSetSpoonLevel(args: { level: number, surfaceId?: string, userId?: string }): Promise<any> {
  if (args.level < 0 || args.level > 5) {
    throw new Error('Spoon level must be between 0 and 5');
  }
  return {
    success: true,
    action: 'setSpoonLevel',
    level: args.level,
    surfaceId: args.surfaceId || null,
    userId: args.userId || null,
  };
}

export async function handleListContracts(): Promise<any> {
  const entries = Object.entries(COMPONENT_CONTRACTS).map(([name, contract]: [string, any]) => ({
    name,
    system: contract.system || 'unknown',
    semanticParts: contract.semantic_parts || [],
    status: 'available',
  }));
  return { contracts: entries, total: entries.length, status: 'ok' };
}

export async function handleGetContract(args: { name: string }): Promise<any> {
  const contract = COMPONENT_CONTRACTS[args.name];
  if (!contract) {
    return { error: `Contract not found: "${args.name}"`, status: 'error' };
  }
  return { name: args.name, ...contract, status: 'ok' };
}

export async function handleValidateContract(args: { name: string; code?: string }): Promise<any> {
  const contract = COMPONENT_CONTRACTS[args.name];
  if (!contract) {
    return { error: `Contract not found: "${args.name}"`, status: 'error' };
  }
  const violations: string[] = [];
  if (args.code) {
    if (/#[0-9a-fA-F]{3,8}/.test(args.code)) violations.push('Hardcoded hex color — use var(--p31-*) token');
    if (/rgba?\([^)]*\)/.test(args.code)) violations.push('Raw rgba()/rgb() literal — use color token with alpha variant');
    if (/style=\{\{/.test(args.code) || /style=\{/.test(args.code)) violations.push('Inline style — use tokens/classes instead');
    if (/emoji/.test(args.code) || /[\u{1F300}-\u{1F9FF}]/u.test(args.code)) violations.push('Emoji icon — use P31 icon system');
    if (contract.forbidden_patterns) {
      for (const pattern of contract.forbidden_patterns) {
        if (args.code.toLowerCase().includes(pattern.toLowerCase())) {
          violations.push(`Forbidden pattern: ${pattern}`);
        }
      }
    }
  }
  return {
    name: args.name,
    valid: violations.length === 0,
    violations,
    contract: {
      requiredAria: contract.required_aria || [],
      interactionStates: contract.interaction_states || [],
      spoonContract: contract.spoon_contract || {},
    },
    status: 'ok',
  };
}

export async function handleClarify(args: { prompt: string; context?: Record<string, any> }): Promise<any> {
  const prompt = String(args.prompt || '');
  const questions: Array<{ field: string; question: string; priority: 'high' | 'medium' | 'low' }> = [];
  if (!prompt) {
    return { error: 'Missing "prompt" field.', status: 'error' };
  }
  if (!args.context) {
    questions.push({ field: 'context', question: 'What is the context? (theme, brand, age, sensory mode)', priority: 'high' });
  }
  if (/color|colour|palette|visual/i.test(prompt) && !/color|colour|palette|visual/i.test(args.context?.theme || '')) {
    questions.push({ field: 'theme', question: 'What visual theme? (dark, light, ocean, garden, etc.)', priority: 'medium' });
  }
  if (/brand|extend|override/i.test(prompt) && !args.context?.brand) {
    questions.push({ field: 'brand', question: 'Which brand? (p31ca, phos, phosphorus31, willow, bonding)', priority: 'medium' });
  }
  if (/component|build|generate/i.test(prompt) && !args.context?.component) {
    questions.push({ field: 'component', question: 'Which component type? (card, panel, button, navigation, etc.)', priority: 'medium' });
  }
  if (/token|color|background|text/i.test(prompt) && !/token|color|background|text/i.test(args.context?.tokens || '')) {
    questions.push({ field: 'tokens', question: 'Which token categories? (color, spacing, typography, shadow, etc.)', priority: 'low' });
  }
  return {
    ambiguities: questions,
    count: questions.length,
    status: questions.length > 0 ? 'needs_clarification' : 'clear',
  };
}

export async function handleProposeFromSpec(args: { spec: string }): Promise<any> {
  const spec = String(args.spec || '').toLowerCase();
  const contract = COMPONENT_CONTRACTS[spec];
  if (!contract) {
    const available = Object.keys(COMPONENT_CONTRACTS);
    return { error: `Spec not found: "${args.spec}". Available: ${available.join(', ')}`, status: 'error' };
  }
  const specKey = Object.keys(COMPONENT_DEFS).find(
    (k) => k.toLowerCase() === spec || k.toLowerCase() === spec || COMPONENT_DEFS[k].css_class === spec
  );
  const def = specKey ? { name: specKey, ...COMPONENT_DEFS[specKey] } : null;
  const proposal = {
    spec,
    component: contract.component || spec,
    system: contract.system || 'design-core',
    semanticParts: contract.semantic_parts || [],
    requiredAria: contract.required_aria || [],
    interactionStates: contract.interaction_states || [],
    spoonContract: contract.spoon_contract || {},
    visualBaseline: def ? {
      name: def.name,
      description: def.description,
      cssClass: def.css_class,
      category: def.category,
      importPath: def.importPath,
    } : null,
    validation: contract.forbidden_patterns ? {
      checks: contract.forbidden_patterns.map((p: string) => ({ pattern: p, description: p })),
    } : null,
  };
  return { ...proposal, status: 'ok' };
}

export function componentPreviewHtmlInline(args: { name: string }): { html: string; status: string } {
  const name = String(args.name || '');
  const def = COMPONENT_DEFS[name];
  if (!def) {
    return { html: `<div>Component "${name}" not found.</div>`, status: 'error' };
  }
  const tokensHtml = (def.tokens || []).map((t: string) => `<span class="token">${t}</span>`).join(', ');
  return {
    html: `<div class="component-preview" data-component="${name}" data-css-class="${def.css_class}" data-category="${def.category}">
  <header class="component-preview-header">${name}</header>
  <div class="component-preview-meta">
    <span class="component-preview-class">${def.css_class}</span>
    <span class="component-preview-category">${def.category}</span>
  </div>
  <div class="component-preview-tokens">${tokensHtml || 'No tokens'}</div>
  <p class="component-preview-desc">${def.description}</p>
</div>`,
    status: 'ok',
  };
}
