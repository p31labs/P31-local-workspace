/**
 * @file Rule-based proposal engine for the P31 design system.
 * Generates new component and icon proposals from natural-language descriptions.
 */

import { components, icons, iconCatalog, tokens } from './data';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ComponentProposal {
  name: string;
  description: string;
  css_class: string;
  aiGuidance: {
    useWhen: string;
    avoidWhen: string;
    examples: string[];
  };
  props: Record<string, any>;
  slots: string[];
  tokens: string[];
  variants?: string[];
}

export interface ProposalResult {
  proposal: ComponentProposal;
  confidence: number;
  similarTo: string;
  validation: {
    valid: boolean;
    warnings: string[];
  };
}

export interface IconProposal {
  id: string;
  name: string;
  family: 'regular' | 'advanced';
  colors: string[];
  animated: boolean;
  description: string;
  ariaLabel: string;
  svgSuggestion?: string;
}

export interface IconProposalResult {
  proposal: IconProposal;
  confidence: number;
  similarTo: string;
}

// ─── Keyword heuristics ─────────────────────────────────────────────────────

const KEYWORD_TO_TOKEN: Record<string, string[]> = {
  crisis: ['semantic.color.accent.red', 'primitive.shadow.glow_cyan'],
  emergency: ['semantic.color.accent.red'],
  success: ['semantic.color.accent.green'],
  warning: ['semantic.color.accent.gold'],
  data: ['primitive.typography.font_mono', 'primitive.spacing.sm'],
  table: ['primitive.typography.font_mono'],
  list: ['primitive.spacing.sm'],
  status: ['semantic.color.accent.green', 'semantic.color.accent.violet'],
  indicator: ['semantic.color.accent.default'],
  glass: ['primitive.color.glass_surface', 'primitive.color.glass_border'],
  strong: ['primitive.color.glass_surface_strong'],
  subtle: ['primitive.color.glass_surface_subtle'],
  button: ['semantic.color.accent.default', 'primitive.color.void'],
  click: ['semantic.color.accent.default', 'primitive.color.void'],
  toggle: ['semantic.color.accent.default'],
  switch: ['semantic.color.accent.default'],
  meter: ['semantic.color.accent.default', 'semantic.color.text.tertiary'],
  grid: ['primitive.spacing.md'],
  label: ['primitive.typography.font_mono', 'semantic.color.text.tertiary'],
  badge: ['semantic.color.accent.green', 'semantic.color.accent.violet'],
  overlay: ['semantic.color.background.default'],
  starfield: ['semantic.color.background.default'],
  theme: ['semantic.color.background.default', 'theme.light.background.default'],
  spinner: ['semantic.color.accent.default'],
  loading: ['semantic.color.accent.default'],
  progress: ['semantic.color.accent.default', 'semantic.color.accent.green'],
  chart: ['primitive.typography.font_mono', 'primitive.spacing.sm'],
  graph: ['primitive.typography.font_mono', 'primitive.spacing.sm'],
  metric: ['primitive.typography.font_mono', 'semantic.color.accent.default'],
  alert: ['semantic.color.accent.red', 'semantic.color.accent.gold'],
  toast: ['semantic.color.accent.default', 'primitive.color.glass_surface'],
  modal: ['primitive.color.glass_surface', 'primitive.color.glass_border'],
  dialog: ['primitive.color.glass_surface', 'primitive.color.glass_border'],
  menu: ['primitive.color.glass_surface', 'semantic.color.text.primary'],
  nav: ['semantic.color.text.primary', 'semantic.color.text.secondary'],
  card: ['primitive.color.glass_surface', 'primitive.color.glass_border', 'primitive.radius.xl'],
  surface: ['primitive.color.glass_surface', 'primitive.color.glass_border'],
  input: ['primitive.color.glass_surface', 'semantic.color.text.primary'],
  form: ['primitive.spacing.sm', 'primitive.spacing.md'],
  field: ['primitive.spacing.sm', 'semantic.color.text.primary'],
  avatar: ['primitive.color.glass_surface', 'semantic.color.accent.default'],
  image: ['primitive.color.glass_surface'],
  media: ['primitive.color.glass_surface'],
  video: ['primitive.color.glass_surface'],
  player: ['primitive.color.glass_surface', 'primitive.color.glass_border'],
};

const KEYWORD_TO_FAMILY: Record<string, 'regular' | 'advanced'> = {
  sovereign: 'advanced',
  crown: 'advanced',
  authority: 'advanced',
  geometry: 'advanced',
  prism: 'advanced',
  nebula: 'advanced',
  comet: 'advanced',
  quantum: 'advanced',
  tetrahedron: 'advanced',
  default: 'regular',
};

// ─── Tokenization ────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
  'for', 'with', 'by', 'of', 'is', 'it', 'as', 'be', 'are', 'was',
  'were', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'my',
  'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us',
  'them', 'not', 'so', 'if', 'then', 'than', 'too', 'very', 'just',
  'about', 'above', 'after', 'before', 'between', 'into', 'through',
  'during', 'without', 'there', 'here', 'when', 'where', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'only', 'own', 'same', 'up', 'down', 'out',
  'off', 'over', 'under', 'again', 'further', 'once',
]);

export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .filter((word) => !STOP_WORDS.has(word));
}

// ─── Component scoring ──────────────────────────────────────────────────────

export function scoreComponents(
  keywords: string[],
  componentMap: Record<string, any> = components.components || {},
): { name: string; score: number }[] {
  console.log('scoreComponents keys:', Object.keys(componentMap).slice(0, 10));
  const results: { name: string; score: number }[] = [];
  for (const [name, def] of Object.entries(componentMap)) {
    const haystack = [
      name,
      (def as any).description || '',
      (def as any).css_class || '',
      (def as any).aiGuidance?.useWhen || '',
      (def as any).aiGuidance?.avoidWhen || '',
      ...((def as any).aiGuidance?.examples || []),
    ]
      .join(' ')
      .toLowerCase();

    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(haystack)) score += 1;
    }
    if (name.toLowerCase().includes(keywords[0] || '')) score += 2;
    results.push({ name, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

// ─── Token suggestion ───────────────────────────────────────────────────────

export function suggestTokens(keywords: string[]): string[] {
  const seen = new Set<string>();
  for (const kw of keywords) {
    const matched = KEYWORD_TO_TOKEN[kw];
    if (matched) matched.forEach((t) => seen.add(t));
  }
  if (seen.size === 0) {
    seen.add('primitive.color.glass_surface');
    seen.add('primitive.color.glass_border');
    seen.add('primitive.radius.xl');
  }
  return Array.from(seen);
}

// ─── Prop suggestion ────────────────────────────────────────────────────────

export function suggestProps(keywords: string[], interactive = false): Record<string, any> {
  const props: Record<string, any> = {};
  if (keywords.some((k) => ['size', 'large', 'small', 'big', 'tiny', 'medium', 'compact'].includes(k))) {
    props.size = { type: 'string', default: 'md', options: ['sm', 'md', 'lg'] };
  }
  if (keywords.some((k) => ['variant', 'style', 'type', 'mode'].includes(k))) {
    props.variant = { type: 'string', default: 'default' };
  }
  if (keywords.some((k) => ['color', 'accent', 'highlight', 'tint'].includes(k))) {
    props.color = { type: 'string', default: 'accent', options: ['accent', 'violet', 'gold', 'green', 'red'] };
  }
  if (interactive || keywords.some((k) => ['toggle', 'switch', 'click', 'press', 'action', 'submit'].includes(k))) {
    props.interactive = { type: 'boolean', default: true };
  }
  if (keywords.some((k) => ['label', 'title', 'text', 'heading', 'message'].includes(k))) {
    props.label = { type: 'string', default: '' };
  }
  if (keywords.some((k) => ['count', 'number', 'quantity', 'total'].includes(k))) {
    props.count = { type: 'number', default: 0 };
  }
  if (keywords.some((k) => ['current', 'level', 'step', 'stage'].includes(k))) {
    props.current = { type: 'number', default: 0 };
  }
  if (keywords.some((k) => ['disabled', 'inactive', 'off'].includes(k))) {
    props.disabled = { type: 'boolean', default: false };
  }
  return props;
}

// ─── AI guidance generation ──────────────────────────────────────────────

export function generateGuidance(description: string, keywords: string[]): {
  useWhen: string;
  avoidWhen: string;
  examples: string[];
} {
  const cleaned = description.replace(/^create\s+/i, '').replace(/\s+/g, ' ').trim();
  const useWhen = `When a user needs to ${cleaned.toLowerCase()} in the P31 sovereign design system.`;
  let avoidWhen = 'When the interaction requires a different surface or component type.';
  if (keywords.some((k) => ['button', 'click', 'press', 'toggle', 'switch', 'submit'].includes(k))) {
    avoidWhen = 'Navigating between pages (use a link instead).';
  } else if (keywords.some((k) => ['overlay', 'modal', 'dialog', 'crisis'].includes(k))) {
    avoidWhen = 'For non-emergency modals or routine notifications.';
  } else if (keywords.some((k) => ['label', 'badge', 'indicator'].includes(k))) {
    avoidWhen = 'For primary content areas or extended reading.';
  }
  const examples = [
    cleaned,
    `More ${cleaned.toLowerCase()} use cases`,
  ];
  return { useWhen, avoidWhen, examples: examples.slice(0, 2) };
}

// ─── Validation ────────────────────────────────────────────────────────────

export function validateProposal(proposal: ComponentProposal, tokenTree: Record<string, any> = tokens as any): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let valid = true;

  if (!proposal.name || !/^[A-Z][a-zA-Z0-9]*$/.test(proposal.name)) {
    warnings.push(`Component name "${proposal.name}" should be PascalCase.`);
  }

  if (!proposal.css_class || !/^[a-z][a-z0-9-]*$/.test(proposal.css_class)) {
    warnings.push(`CSS class "${proposal.css_class}" should be kebab-case.`);
  }

  if (!proposal.tokens || proposal.tokens.length === 0) {
    warnings.push('No tokens assigned.');
  }

  for (const t of proposal.tokens || []) {
    const parts = t.split('.');
    let node: any = tokenTree;
    for (const part of parts) {
      if (node == null || typeof node !== 'object') {
        warnings.push(`Token "${t}" does not exist in tokens.yml.`);
        break;
      }
      node = node[part];
    }
  }

  const requiredFields = ['description', 'css_class', 'aiGuidance', 'props', 'slots', 'tokens'];
  for (const f of requiredFields) {
    if (!(f in proposal)) {
      warnings.push(`Missing required field: ${f}`);
      valid = false;
    }
  }

  if (!proposal.aiGuidance?.useWhen || !proposal.aiGuidance?.avoidWhen) {
    warnings.push('aiGuidance should include useWhen and avoidWhen.');
  }

  return { valid, warnings };
}

// ─── Proposal assembly ────────────────────────────────────────────────────

export function proposeComponent(
  description: string,
  style?: string,
  interactive?: boolean,
  existingComponents?: Record<string, any>,
): ProposalResult {
  const keywords = tokenize(description);
  const componentMap = existingComponents || (components.components || {});
  const scored = scoreComponents(keywords, componentMap);
  console.log('proposeComponent scored:', JSON.stringify(scored.slice(0, 3)));
  const bestMatch = scored.length > 0 && scored[0].score > 0 ? scored[0].name : 'GlassCard';
  const topScore = scored.length > 0 ? scored[0].score : 0;
  const confidence = topScore > 0 ? Math.min(1, 0.3 + topScore * 0.15) : 0.2;

  const tokens = suggestTokens(keywords);
  const props = suggestProps(keywords, interactive || false);
  const guidance = generateGuidance(description, keywords);

  const cssClass = bestMatch.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()).replace(/^-/, '');
  const name =
    bestMatch !== 'GlassCard'
      ? bestMatch + 'Proposed'
      : description
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('') || 'ProposedComponent';

  const proposal: ComponentProposal = {
    name,
    description: description.replace(/\s+/g, ' ').trim(),
    css_class: cssClass,
    aiGuidance: guidance,
    props: Object.keys(props).length > 0 ? props : {},
    slots: ['default'],
    tokens,
    variants: [],
  };

  const { valid, warnings } = validateProposal(proposal);

  return {
    proposal,
    confidence: Math.round(confidence * 100) / 100,
    similarTo: bestMatch,
    validation: { valid, warnings },
  };
}

// ─── Icon proposal ────────────────────────────────────────────────────────

export function proposeIcon(
  description: string,
  family?: string,
  colors?: string[],
): IconProposalResult {
  const keywords = tokenize(description);
  const familyChoice = family || KEYWORD_TO_FAMILY[keywords[0] || ''] || 'regular';

  const scoredIcons = scoreIcons(keywords);
  const similarTo = scoredIcons.length > 0 ? scoredIcons[0].name : 'default';

  const suggestedColors = colors || ['--p31-accent', '--p31-accent-violet'];
  if (familyChoice === 'advanced' && suggestedColors.length < 4) {
    suggestedColors.push('--p31-accent-gold', '--p31-accent-green');
  }

  const id = keywords.join('-').replace(/_/g, '-') || 'new-icon';

  const proposal: IconProposal = {
    id,
    name: description,
    family: familyChoice,
    colors: suggestedColors,
    animated: true,
    description,
    ariaLabel: description,
    svgSuggestion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="${description.replace(/"/g, '&quot;')}">
  <title>${description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
  <desc>${description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</desc>
  <circle cx="100" cy="100" r="50" fill="var(--p31-accent, #00F0FF)" />
</svg>`,
  };

  return {
    proposal,
    confidence: scoredIcons.length > 0 ? Math.min(1, 0.4 + scoredIcons[0].score * 0.2) : 0.3,
    similarTo,
  };
}

function scoreIcons(keywords: string[]): { name: string; score: number }[] {
  const results: { name: string; score: number }[] = [];
  const catalogEntries = Object.entries(iconCatalog);
  for (const [id, entry] of catalogEntries) {
    const haystack = `${id} ${entry.description} ${entry.family}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) score += 1;
    }
    if (id.includes(keywords[0] || '')) score += 2;
    results.push({ name: id, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

// ─── Token proposal ────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  cyan: '#00F0FF',
  violet: '#A78BFA',
  purple: '#A78BFA',
  gold: '#FBBF24',
  green: '#34D399',
  emerald: '#34D399',
  red: '#FB7185',
  rose: '#FB7185',
  pink: '#F472B6',
  blue: '#60A5FA',
  amber: '#FBBF24',
  orange: '#FB923C',
  white: '#FFFFFF',
  black: '#000000',
};

const TYPE_KEYWORDS: Record<string, { type: string; category: string }> = {
  glow: { type: 'shadow', category: 'primitive' },
  shadow: { type: 'shadow', category: 'primitive' },
  drop: { type: 'shadow', category: 'primitive' },
  spacing: { type: 'spacing', category: 'primitive' },
  space: { type: 'spacing', category: 'primitive' },
  pad: { type: 'spacing', category: 'primitive' },
  margin: { type: 'spacing', category: 'primitive' },
  gap: { type: 'spacing', category: 'primitive' },
  radius: { type: 'radius', category: 'primitive' },
  round: { type: 'radius', category: 'primitive' },
  corner: { type: 'radius', category: 'primitive' },
  blur: { type: 'blur', category: 'primitive' },
  font: { type: 'typography', category: 'primitive' },
  text: { type: 'typography', category: 'primitive' },
  type: { type: 'typography', category: 'primitive' },
  heading: { type: 'typography', category: 'primitive' },
  mono: { type: 'typography', category: 'primitive' },
  accent: { type: 'color', category: 'semantic' },
  surface: { type: 'color', category: 'primitive' },
  glass: { type: 'color', category: 'primitive' },
  theme: { type: 'color', category: 'theme' },
  light: { type: 'color', category: 'theme' },
  dark: { type: 'color', category: 'theme' },
};

const INTENSITY_TO_PX: Record<string, string> = {
  xs: '4px', extra_small: '4px', tiny: '4px',
  sm: '8px', small: '8px',
  md: '16px', medium: '16px', base: '16px',
  lg: '24px', large: '24px',
  xl: '32px', extra_large: '32px',
  xxl: '64px', huge: '64px',
};

export interface TokenProposal {
  path: string;
  suggestedValue: string;
  type: string;
  category: string;
  rationale: string;
  confidence: number;
  similarTo: string;
}

export interface TokenProposalResult {
  proposal: TokenProposal;
  status: string;
}

export function proposeToken(
  description: string,
  category?: string,
  type?: string,
): TokenProposalResult {
  const keywords = tokenize(description);

  const cat = category || 'primitive';
  let inferredType = type || 'color';
  let rationale = '';

  const typeHits = keywords.map(k => TYPE_KEYWORDS[k]).filter(Boolean);
  if (typeHits.length > 0) {
    inferredType = typeHits[0].type;
    if (!type) rationale = `Inferred type "${inferredType}" from keywords.`;
  }

  const sanitized = keywords
    .filter(k => !TYPE_KEYWORDS[k])
    .join('_') || 'new_token';
  const path = `${cat}.${inferredType}.${sanitized}`;

  let suggestedValue = '';
  if (inferredType === 'color') {
    const colorKw = keywords.find(k => COLOR_HEX[k]);
    suggestedValue = colorKw ? COLOR_HEX[colorKw] : 'rgba(255,255,255,0.1)';
    rationale += colorKw
      ? ` Matched color keyword "${colorKw}" → ${COLOR_HEX[colorKw]}.`
      : ' Defaulting to a transparent white placeholder.';
  } else if (inferredType === 'shadow') {
    const glowColor = keywords.find(k => COLOR_HEX[k]) || 'cyan';
    suggestedValue = `0 0 20px ${COLOR_HEX[glowColor]}40`;
    rationale += ` Glow pattern based on ${glowColor} with 25% opacity.`;
  } else if (inferredType === 'typography') {
    suggestedValue = "system-ui, -apple-system, sans-serif";
    rationale += ' Default system font stack.';
  } else {
    const intensity = keywords.find(k => INTENSITY_TO_PX[k]) || 'md';
    suggestedValue = INTENSITY_TO_PX[intensity];
    rationale += ` Dimension inferred from "${intensity}" intensity.`;
  }

  const allTokenPaths = Object.entries(getAllTokenPaths(tokens)).map(([p]) => p);
  const scored = allTokenPaths
    .map(p => ({ path: p, score: keywords.filter(k => p.toLowerCase().includes(k)).length }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
  const similarTo = scored.length > 0 ? scored[0].path : 'primitive.color.glass_surface';

  const confidence = scored.length > 0
    ? Math.min(1, 0.3 + scored[0].score * 0.15)
    : 0.2;

  const proposal: TokenProposal = {
    path,
    suggestedValue,
    type: inferredType,
    category: cat,
    rationale: rationale.trim() || 'Proposed based on description keywords.',
    confidence: Math.round(confidence * 100) / 100,
    similarTo,
  };

  return { proposal, status: 'ok' };
}

function getAllTokenPaths(node: any, prefix = ''): string[] {
  const paths: string[] = [];
  if (node == null || typeof node !== 'object') return paths;
  if (Array.isArray(node)) {
    for (const item of node) {
      paths.push(...getAllTokenPaths(item, prefix));
    }
    return paths;
  }
  if (node.$value !== undefined || node.$type !== undefined) {
    if (prefix) paths.push(prefix);
    return paths;
  }
  for (const key of Object.keys(node)) {
    if (key.startsWith('$') || key === 'metadata' || key === 'component' || key === 'version') continue;
    paths.push(...getAllTokenPaths(node[key], prefix ? `${prefix}.${key}` : key));
  }
  return paths;
}
