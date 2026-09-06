import { describe, it, expect } from 'vitest';
import { validateComponent, auditTokens, auditIcons, type ValidationResult, type AuditResult, type AuditIconsResult } from './validator';

const FIXTURE_TOKENS = {
  version: '2.0',
  primitive: {
    color: {
      cyan: { $value: '#00F0FF', $type: 'color' },
      violet: { $value: '#A78BFA', $type: 'color' },
      glass_surface: { $value: 'rgba(255,255,255,0.04)', $type: 'color' },
      glass_border: { $value: 'rgba(255,255,255,0.08)', $type: 'color' },
    },
    spacing: {
      sm: { $value: '8px', $type: 'dimension' },
    },
    radius: {
      xl: { $value: '24px', $type: 'dimension' },
      md: { $value: '12px', $type: 'dimension' },
    },
    shadow: {
      glass: { $value: '0 4px 24px rgba(0,0,0,0.2)', $type: 'shadow' },
    },
  },
  semantic: {
    color: {
      accent: {
        default: { $value: '{primitive.color.cyan}', $type: 'color' },
        red: { $value: '#FB7185', $type: 'color' },
      },
    },
  },
};

const FIXTURE_COMPONENTS = {
  GlassCard: {
    description: 'Compact glassmorphic card with padding.',
    css_class: 'glass-card',
    aiGuidance: {
      useWhen: 'Displaying a single piece of content in a grid or list.',
      avoidWhen: 'For full-width sections, use GlassPanel instead.',
      examples: ['Product card in a grid'],
    },
    props: {
      color: { type: 'string', default: 'accent', options: ['accent', 'violet', 'gold', 'green', 'red'] },
      padding: { type: 'string', default: 'lg', options: ['sm', 'md', 'lg'] },
      interactive: { type: 'boolean', default: true },
    },
    slots: ['default', 'header'],
    tokens: ['primitive.color.glass_surface', 'primitive.color.glass_border', 'primitive.radius.xl'],
  },
  GlassPanel: {
    description: 'Glassmorphic elevated surface with backdrop blur.',
    css_class: 'glass-panel',
    aiGuidance: {
      useWhen: 'You need a top-level surface that separates content sections with depth.',
      avoidWhen: 'For compact inline content, use GlassCard instead.',
      examples: ['Main content area wrapper'],
    },
    props: {
      padding: { type: 'string', default: 'md', options: ['sm', 'md', 'lg'] },
    },
    slots: ['default'],
    tokens: ['primitive.color.glass_surface', 'primitive.color.glass_border', 'primitive.radius.xl', 'primitive.shadow.glass'],
  },
  Button: {
    description: 'Button component.',
    css_class: 'btn-primary',
    aiGuidance: {
      useWhen: 'User needs to submit a form.',
      avoidWhen: 'Navigating between pages — use a link instead.',
      examples: ['Submit order'],
    },
    props: {
      variant: { type: 'string', default: 'primary', options: ['primary', 'secondary', 'ghost'] },
      size: { type: 'string', default: 'md', options: ['sm', 'md', 'lg'] },
    },
    slots: ['default'],
    tokens: ['semantic.color.accent.default', 'primitive.color.void'],
  },
};

describe('validateComponent', () => {
  it('returns valid for correct component', () => {
    const result = validateComponent('GlassCard', FIXTURE_COMPONENTS.GlassCard, FIXTURE_TOKENS, FIXTURE_COMPONENTS);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.component).toBe('GlassCard');
  });

  it('flags missing fields', () => {
    const result = validateComponent('BadComp', { css_class: 'bad-comp' }, FIXTURE_TOKENS, FIXTURE_COMPONENTS);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('description'))).toBe(true);
    expect(result.errors.some((e) => e.includes('aiGuidance.useWhen'))).toBe(true);
  });

  it('flags invalid css_class', () => {
    const result = validateComponent('BadComp', { css_class: 'InvalidClass!' }, FIXTURE_TOKENS, FIXTURE_COMPONENTS);
    expect(result.errors.some((e) => e.includes('not kebab-case'))).toBe(true);
  });

  it('flags missing token paths', () => {
    const result = validateComponent('BadComp', {
      description: 'test',
      css_class: 'bad-comp',
      aiGuidance: { useWhen: 'x', avoidWhen: 'y', examples: [] },
      props: {},
      slots: ['default'],
      tokens: ['primitive.nonexistent.token'],
    }, FIXTURE_TOKENS, FIXTURE_COMPONENTS);
    expect(result.errors.some((e) => e.includes('does not exist in tokens.yml'))).toBe(true);
  });

  it('flags prop missing type', () => {
    const result = validateComponent('BadComp', {
      description: 'test',
      css_class: 'bad-comp',
      aiGuidance: { useWhen: 'x', avoidWhen: 'y', examples: [] },
      props: { size: { default: 'md' } },
      slots: ['default'],
      tokens: [],
    }, FIXTURE_TOKENS, FIXTURE_COMPONENTS);
    expect(result.errors.some((e) => e.includes('missing "type" field'))).toBe(true);
  });

  it('flags prop options that are not arrays', () => {
    const result = validateComponent('BadComp', {
      description: 'test',
      css_class: 'bad-comp',
      aiGuidance: { useWhen: 'x', avoidWhen: 'y', examples: [] },
      props: { size: { type: 'string', default: 'md', options: 'sm,md,lg' } },
      slots: ['default'],
      tokens: [],
    }, FIXTURE_TOKENS, FIXTURE_COMPONENTS);
    expect(result.errors.some((e) => e.includes('options must be an array'))).toBe(true);
  });

  it('flags non-empty slot', () => {
    const result = validateComponent('BadComp', {
      description: 'test',
      css_class: 'bad-comp',
      aiGuidance: { useWhen: 'x', avoidWhen: 'y', examples: [] },
      props: {},
      slots: ['default', ''],
      tokens: [],
    }, FIXTURE_TOKENS, FIXTURE_COMPONENTS);
    expect(result.errors.some((e) => e.includes('must be a non-empty string'))).toBe(true);
  });

  it('warns when useWhen equals avoidWhen', () => {
    const result = validateComponent('BadComp', {
      description: 'test',
      css_class: 'bad-comp',
      aiGuidance: { useWhen: 'same', avoidWhen: 'same', examples: [] },
      props: {},
      slots: ['default'],
      tokens: [],
    }, FIXTURE_TOKENS, FIXTURE_COMPONENTS);
    expect(result.warnings.some((w) => w.includes('identical'))).toBe(true);
    expect(result.valid).toBe(true);
  });

  it('flags duplicate css_class', () => {
    const components = {
      GlassCard: { ...FIXTURE_COMPONENTS.GlassCard },
      BadCopy: { ...FIXTURE_COMPONENTS.GlassCard, description: 'copy' },
    };
    const result = validateComponent('BadCopy', components.BadCopy, FIXTURE_TOKENS, components);
    expect(result.errors.some((e) => e.includes('duplicated on: GlassCard'))).toBe(true);
  });
});

describe('auditTokens', () => {
  it('returns summary stats', () => {
    const result = auditTokens(FIXTURE_TOKENS, { version: '1.0', components: FIXTURE_COMPONENTS });
    expect(result.summary.components).toBe(Object.keys(FIXTURE_COMPONENTS).length);
    expect(result.summary.versions.tokens).toBe('2.0');
    expect(result.summary.versions.components).toBe('1.0');
  });

  it('detects orphaned token references', () => {
    const components = {
      GlassCard: {
        ...FIXTURE_COMPONENTS.GlassCard,
        tokens: ['primitive.color.doesnotexist'],
      },
    };
    const result = auditTokens(FIXTURE_TOKENS, components);
    expect(result.orphanedTokens).toContain('primitive.color.doesnotexist');
  });

  it('detects dead tokens', () => {
    const result = auditTokens(FIXTURE_TOKENS, FIXTURE_COMPONENTS);
    expect(result.deadTokens.length).toBeGreaterThan(0);
    expect(result.deadTokens).toContain('primitive.color.violet');
  });

  it('detects missing values', () => {
    const tokens = {
      primitive: {
        color: {
          broken: { $type: 'color' },
        },
      },
    };
    const result = auditTokens(tokens, {});
    expect(result.missingValues).toContain('primitive.color.broken');
  });

  it('detects circular references', () => {
    const tokens = {
      primitive: {
        color: {
          cyan: { $value: '{primitive.color.cyan}', $type: 'color' },
        },
      },
    };
    const result = auditTokens(tokens, {});
    expect(result.circularReferences.some((c) => c.includes('cycle'))).toBe(true);
  });

  it('returns valid=true when system is clean', () => {
    const tokens = {
      primitive: {
        color: {
          cyan: { $value: '#00F0FF', $type: 'color' },
        },
      },
    };
    const components = {
      Good: {
        description: 'test',
        css_class: 'good',
        aiGuidance: { useWhen: 'x', avoidWhen: 'y', examples: [] },
        props: {},
        slots: ['default'],
        tokens: ['primitive.color.cyan'],
      },
    };
    const result = auditTokens(tokens, components);
    expect(result.valid).toBe(true);
    expect(result.orphanedTokens).toHaveLength(0);
    expect(result.deadTokens).toHaveLength(0);
    expect(result.missingValues).toHaveLength(0);
    expect(result.circularReferences).toHaveLength(0);
  });

  it('resolves references in audit', () => {
    const tokens = {
      primitive: {
        color: {
          cyan: { $value: '#00F0FF', $type: 'color' },
          accent: { $value: '{primitive.color.cyan}', $type: 'color' },
        },
      },
    };
    const components = {
      Good: {
        description: 'test',
        css_class: 'good',
        aiGuidance: { useWhen: 'x', avoidWhen: 'y', examples: [] },
        props: {},
        slots: ['default'],
        tokens: ['primitive.color.accent', 'primitive.color.cyan'],
      },
    };
    const result = auditTokens(tokens, components);
    expect(result.orphanedTokens).toHaveLength(0);
    expect(result.deadTokens).toHaveLength(0);
  });
});

const FIXTURE_ICONS = [
  {
    id: 'k4-tetrahedron', name: 'K4 Tetrahedron', family: 'regular',
    description: 'Foundational structure, sovereignty', colors: ['--p31-accent', '--p31-accent-violet', '--p31-text'], animated: true,
    svg: '<svg viewBox="0 0 200 200" aria-label="K4 Tetrahedron"><style>@keyframes spin{}</style></svg>',
  },
  {
    id: 'sovereign-crown', name: 'Sovereign Crown', family: 'advanced',
    description: 'Sovereign authority, six-faceted leadership', colors: ['--p31-accent','--p31-accent-violet','--p31-accent-gold','--p31-accent-green','--p31-accent-iris','--p31-accent-red'], animated: true,
    svg: '<svg viewBox="0 0 200 200" aria-label="Sovereign Crown"><style>@keyframes orbit{}</style></svg>',
  },
  {
    id: 'bad-no-svg', name: 'Bad', family: 'regular',
    description: 'Missing SVG', colors: ['--p31-accent', '--p31-accent-violet', '--p31-text'], animated: true,
    svg: '',
  },
  {
    id: 'bad-meta', name: '', family: 'regular',
    description: '', colors: [], animated: false,
    svg: '<svg viewBox="0 0 200 200"></svg>',
  },
  {
    id: 'bad-family', name: 'Weird', family: 'alien',
    description: 'Bad family', colors: [], animated: false,
    svg: '<svg viewBox="0 0 200 200"></svg>',
  },
  {
    id: 'bad-colors', name: 'Too few', family: 'regular',
    description: 'Color mismatch', colors: ['--p31-accent'], animated: false,
    svg: '<svg viewBox="0 0 200 200"></svg>',
  },
  {
    id: 'k4-tetrahedron', name: 'Duplicate', family: 'regular',
    description: 'Duplicate ID', colors: ['--p31-accent', '--p31-accent-violet', '--p31-text'], animated: false,
    svg: '<svg viewBox="0 0 200 200"></svg>',
  },
  {
    id: 'no-anim', name: 'No Anim', family: 'advanced',
    description: 'Should animate but does not', colors: ['--p31-accent','--p31-accent-violet','--p31-accent-gold','--p31-accent-green','--p31-accent-iris','--p31-accent-red'], animated: true,
    svg: '<svg viewBox="0 0 200 200" aria-label="No Anim"></svg>',
  },
  {
    id: 'no-vb', name: 'No ViewBox', family: 'regular',
    description: 'Missing viewBox', colors: ['--p31-accent', '--p31-accent-violet', '--p31-text'], animated: false,
    svg: '<svg aria-label="No ViewBox"></svg>',
  },
  {
    id: 'no-aria', name: 'No Aria', family: 'regular',
    description: 'Missing aria-label', colors: ['--p31-accent', '--p31-accent-violet', '--p31-text'], animated: false,
    svg: '<svg viewBox="0 0 200 200"></svg>',
  },
];

const EMPTY_CATALOG: Record<string, any> = {};
const FULL_CATALOG: Record<string, any> = {
  'k4-tetrahedron': {}, 'sovereign-crown': {}, 'bad-no-svg': {},
};

describe('auditIcons', () => {
  it('returns summary counts', () => {
    const result = auditIcons(FIXTURE_ICONS, FULL_CATALOG);
    expect(result.summary.icons).toBe(FIXTURE_ICONS.length);
    expect(result.summary.regular).toBeGreaterThan(0);
    expect(result.summary.advanced).toBeGreaterThan(0);
  });

  it('detects missing SVG', () => {
    const result = auditIcons(FIXTURE_ICONS, FULL_CATALOG);
    expect(result.missingSvg).toContain('bad-no-svg');
  });

  it('detects missing metadata', () => {
    const result = auditIcons(FIXTURE_ICONS, FULL_CATALOG);
    expect(result.missingMetadata.some(m => m.includes('bad-meta'))).toBe(true);
  });

  it('detects invalid family', () => {
    const result = auditIcons(FIXTURE_ICONS, FULL_CATALOG);
    expect(result.invalidFamily).toContain('bad-family');
  });

  it('detects color count mismatch', () => {
    const result = auditIcons(FIXTURE_ICONS, FULL_CATALOG);
    expect(result.colorCountMismatch.some(m => m.includes('bad-colors'))).toBe(true);
  });

  it('detects duplicate IDs', () => {
    const result = auditIcons(FIXTURE_ICONS, FULL_CATALOG);
    expect(result.duplicateIds).toContain('k4-tetrahedron');
  });

  it('detects animation mismatch', () => {
    const result = auditIcons(FIXTURE_ICONS, FULL_CATALOG);
    expect(result.animationMismatch).toContain('no-anim');
  });

  it('detects missing viewBox', () => {
    const result = auditIcons(FIXTURE_ICONS, FULL_CATALOG);
    expect(result.missingViewBox).toContain('no-vb');
  });

  it('returns valid=false when errors exist', () => {
    const result = auditIcons(FIXTURE_ICONS, FULL_CATALOG);
    expect(result.valid).toBe(false);
  });

  it('returns valid=true for clean set', () => {
    const clean = [FIXTURE_ICONS[0], FIXTURE_ICONS[1]];
    const result = auditIcons(clean, { 'k4-tetrahedron': {}, 'sovereign-crown': {} });
    expect(result.valid).toBe(true);
    expect(result.missingSvg).toHaveLength(0);
    expect(result.duplicateIds).toHaveLength(0);
    expect(result.catalogMismatch).toHaveLength(0);
  });

  it('detects catalog mismatch when iconCatalog is empty', () => {
    const result = auditIcons([FIXTURE_ICONS[0]], EMPTY_CATALOG);
    expect(result.catalogMismatch.some(m => m.includes('in icons array but not in catalog'))).toBe(true);
  });

  it('detects catalog mismatch when icons array is empty', () => {
    const result = auditIcons([], FULL_CATALOG);
    expect(result.catalogMismatch.some(m => m.includes('in catalog but not in icons array'))).toBe(true);
  });

  it('detects missing aria-label', () => {
    const result = auditIcons(FIXTURE_ICONS, FULL_CATALOG);
    expect(result.missingAriaLabel.some(m => m.includes('no-aria'))).toBe(true);
  });
});
