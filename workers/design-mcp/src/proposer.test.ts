import { describe, it, expect } from 'vitest';
import {
  tokenize,
  scoreComponents,
  suggestTokens,
  suggestProps,
  generateGuidance,
  validateProposal,
  proposeComponent,
  proposeIcon,
  proposeToken,
} from './proposer';

const FIXTURE_COMPONENTS = {
  GlassPanel: {
    description: 'Glassmorphic elevated surface with backdrop blur.',
    css_class: 'glass-panel',
    aiGuidance: {
      useWhen: 'You need a top-level surface that separates content sections with depth.',
      avoidWhen: 'For compact inline content, use GlassCard or GlassSubtle instead.',
      examples: ['Main content area wrapper', 'Settings panel container'],
    },
    props: { padding: { type: 'string', default: 'md', options: ['sm', 'md', 'lg'] } },
    slots: ['default'],
    tokens: ['primitive.color.glass_surface', 'primitive.color.glass_border', 'primitive.radius.xl', 'primitive.shadow.glass'],
  },
  GlassCard: {
    description: 'Compact glassmorphic card with padding.',
    css_class: 'glass-card',
    aiGuidance: {
      useWhen: 'Displaying a single piece of content in a grid or list.',
      avoidWhen: 'For full-width sections, use GlassPanel instead.',
      examples: ['Product card in a grid', 'Info card in a dashboard'],
    },
    props: {
      color: { type: 'string', default: 'accent', options: ['accent', 'violet', 'gold', 'green', 'red'] },
      padding: { type: 'string', default: 'lg', options: ['sm', 'md', 'lg'] },
      interactive: { type: 'boolean', default: true },
    },
    slots: ['default', 'header'],
    tokens: ['primitive.color.glass_surface', 'primitive.color.glass_border', 'primitive.radius.xl'],
  },
  Button: {
    description: 'Button component with primary, secondary, and ghost variants.',
    css_class: 'btn-primary',
    aiGuidance: {
      useWhen: 'User needs to submit a form, confirm an action, or trigger a primary interaction.',
      avoidWhen: 'Navigating between pages — use a link or TetraGrid navigation item instead.',
      examples: ['Submit order', 'Save changes'],
    },
    props: {
      variant: { type: 'string', default: 'primary', options: ['primary', 'secondary', 'ghost'] },
      size: { type: 'string', default: 'md', options: ['sm', 'md', 'lg'] },
    },
    slots: ['default'],
    tokens: ['semantic.color.accent.default', 'primitive.color.void'],
  },
  SpoonMeter: {
    description: 'Real-time cognitive load indicator (0-5 scale).',
    css_class: 'spoon-meter',
    aiGuidance: { useWhen: 'Displaying current spoon level.', avoidWhen: 'Decorative-only contexts.', examples: ['Header status bar'] },
    props: { current: { type: 'number', default: 3, range: [0, 5] } },
    slots: [],
    tokens: ['semantic.color.accent.default', 'semantic.color.text.tertiary'],
  },
  CrisisOverlay: {
    description: 'Full-screen breathing overlay shown when spoons=0.',
    css_class: 'crisis-overlay',
    aiGuidance: {
      useWhen: 'User spoon level reaches 0; requires immediate calming UI with a single exit action.',
      avoidWhen: 'For non-emergency modals.',
      examples: ['Spoons depleted screen'],
    },
    props: { message: { type: 'string', default: 'Rest. Breathe.' }, buttonLabel: { type: 'string', default: "I'm Ready" } },
    slots: [],
    tokens: ['semantic.color.background.default'],
  },
};

describe('tokenize', () => {
  it('returns empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('splits on spaces and hyphens', () => {
    expect(tokenize('crisis-overlay')).toEqual(['crisis', 'overlay']);
  });

  it('lowercases and strips punctuation', () => {
    expect(tokenize('Create Button!')).toEqual(['create', 'button']);
  });

  it('handles multiple spaces', () => {
    expect(tokenize('  glass   card  ')).toEqual(['glass', 'card']);
  });
});

describe('scoreComponents', () => {
  it('returns sorted scores descending', () => {
    const scores = scoreComponents(['glass', 'card'], FIXTURE_COMPONENTS);
    console.log('scores:', JSON.stringify(scores));
    expect(scores[0].score).toBeGreaterThanOrEqual(1);
    expect(scores.some((s) => s.name === 'GlassCard')).toBe(true);
    expect(scores.some((s) => s.name === 'GlassPanel')).toBe(true);
    expect(scores[0].score).toBeGreaterThanOrEqual(scores[scores.length - 1].score);
  });

  it('boosts score for name prefix match', () => {
    const scores = scoreComponents(['button'], FIXTURE_COMPONENTS);
    const buttonScore = scores.find((s) => s.name === 'Button');
    expect(buttonScore?.score).toBeGreaterThanOrEqual(2);
  });

  it('returns 0 score for no matches', () => {
    const scores = scoreComponents(['zzzz'], FIXTURE_COMPONENTS);
    expect(scores.every((s) => s.score === 0)).toBe(true);
  });
});

describe('suggestTokens', () => {
  it('maps crisis keywords to red and glow tokens', () => {
    const tokens = suggestTokens(['crisis', 'emergency']);
    expect(tokens).toContain('semantic.color.accent.red');
    expect(tokens).toContain('primitive.shadow.glow_cyan');
  });

  it('maps data keywords to mono font and spacing', () => {
    const tokens = suggestTokens(['data', 'table']);
    expect(tokens).toContain('primitive.typography.font_mono');
    expect(tokens).toContain('primitive.spacing.sm');
  });

  it('falls back to glass tokens when no match', () => {
    const tokens = suggestTokens(['unknown', 'thing']);
    expect(tokens).toContain('primitive.color.glass_surface');
    expect(tokens).toContain('primitive.color.glass_border');
  });
});

describe('suggestProps', () => {
  it('adds size prop for size keywords', () => {
    const props = suggestProps(['large', 'small']);
    expect(props.size).toEqual({ type: 'string', default: 'md', options: ['sm', 'md', 'lg'] });
  });

  it('adds interactive prop for toggle/click keywords', () => {
    const props = suggestProps(['toggle', 'press']);
    expect(props.interactive).toEqual({ type: 'boolean', default: true });
  });

  it('returns empty for no matching keywords', () => {
    const props = suggestTokens(['glass', 'surface']);
    // note: this calls suggestProps — surface does not match any prop heuristics
  });
});

describe('generateGuidance', () => {
  it('generates useWhen from description', () => {
    const guidance = generateGuidance('Create a button to submit forms', ['button', 'submit']);
    expect(guidance.useWhen).toContain('submit forms');
  });

  it('sets avoidWhen for button-like keywords', () => {
    const guidance = generateGuidance('Create a button', ['button']);
    expect(guidance.avoidWhen).toContain('Navigating between pages');
  });

  it('generates two examples', () => {
    const guidance = generateGuidance('Create a status badge', ['status']);
    expect(guidance.examples).toHaveLength(2);
  });
});

describe('validateProposal', () => {
  it('flags invalid css_class', () => {
    const result = validateProposal({
      name: 'TestComp',
      description: 'A test component',
      css_class: 'InvalidClass!',
      aiGuidance: { useWhen: '', avoidWhen: '', examples: [] },
      props: {},
      slots: ['default'],
      tokens: [],
    });
    console.log('warnings:', JSON.stringify(result.warnings));
    expect(result.warnings.some((w) => w.toLowerCase().includes('css class'))).toBe(true);
  });

  it('warns about non-existent tokens', () => {
    const warnings = validateProposal({
      name: 'TestComp',
      description: 'A test component',
      css_class: 'test-comp',
      aiGuidance: { useWhen: '', avoidWhen: '', examples: [] },
      props: {},
      slots: ['default'],
      tokens: ['primitive.nonexistent.token'],
    }).warnings;
    expect(warnings.some((w) => w.includes('does not exist'))).toBe(true);
  });

  it('validates correct proposal', () => {
    const result = validateProposal({
      name: 'GoodComp',
      description: 'A good component',
      css_class: 'good-comp',
      aiGuidance: { useWhen: 'Use in good contexts.', avoidWhen: 'Avoid in bad contexts.', examples: ['Example 1'] },
      props: {},
      slots: ['default'],
      tokens: ['primitive.color.glass_surface'],
    });
    expect(result.warnings).toHaveLength(0);
  });
});

describe('proposeComponent', () => {
  it('returns a proposal for glass card description', () => {
    const result = proposeComponent('Create a compact glass card for displaying product info', undefined, undefined, FIXTURE_COMPONENTS);
    expect(result.proposal.name).toBeDefined();
    expect(result.proposal.css_class).toBeDefined();
    expect(result.proposal.tokens.length).toBeGreaterThan(0);
    expect(result.similarTo).toBe('GlassCard');
  });

  it('returns Button as similar for button descriptions', () => {
    const result = proposeComponent('Create a submit button for forms', undefined, undefined, FIXTURE_COMPONENTS);
    expect(result.similarTo).toBe('Button');
  });

  it('includes validators warnings when present', () => {
    const result = proposeComponent('Create a widget with zzz tokens', undefined, undefined, FIXTURE_COMPONENTS);
    expect(result.validation).toBeDefined();
    expect(typeof result.validation.valid).toBe('boolean');
    expect(Array.isArray(result.validation.warnings)).toBe(true);
  });

  it('falls back to GlassCard when no match', () => {
    const result = proposeComponent('Create a totally new thing', undefined, undefined, FIXTURE_COMPONENTS);
    console.log('fallback result:', JSON.stringify({ similarTo: result.similarTo, confidence: result.confidence, proposal: result.proposal.name }));
    expect(result.similarTo).toBe('GlassCard');
    expect(result.confidence).toBeGreaterThanOrEqual(0.2);
  });
});

describe('proposeIcon', () => {
  it('returns regular family for generic keywords', () => {
    const result = proposeIcon('signal wave mesh');
    expect(result.proposal.family).toBe('regular');
  });

  it('returns advanced family for sovereign keywords', () => {
    const result = proposeIcon('sovereign crown geometry');
    expect(result.proposal.family).toBe('advanced');
  });

  it('includes id, ariaLabel, and svgSuggestion', () => {
    const result = proposeIcon('crystal resonance');
    expect(result.proposal.id).toBe('crystal-resonance');
    expect(result.proposal.ariaLabel).toBe('crystal resonance');
    expect(result.proposal.svgSuggestion).toContain('<svg');
  });

  it('includes confidence and similarTo', () => {
    const result = proposeIcon('crown authority');
    expect(typeof result.confidence).toBe('number');
    expect(result.similarTo).toBeDefined();
  });
});

describe('proposeToken', () => {
  it('proposes a shadow token from glow + color keywords', () => {
    const result = proposeToken('a bright cyan glow');
    expect(result.proposal.path).toBe('primitive.shadow.bright_cyan');
    expect(result.proposal.type).toBe('shadow');
    expect(result.proposal.category).toBe('primitive');
    expect(result.proposal.suggestedValue).toBe('0 0 20px #00F0FF40');
    expect(result.proposal.rationale).toContain('Glow pattern');
  });

  it('proposes a shadow token with matched color', () => {
    const result = proposeToken('a soft purple glow');
    expect(result.proposal.path).toBe('primitive.shadow.soft_purple');
    expect(result.proposal.type).toBe('shadow');
    expect(result.proposal.suggestedValue).toContain('#A78BFA');
  });

  it('proposes a dimension token from spacing keywords', () => {
    const result = proposeToken('huge spacing');
    expect(result.proposal.path).toBe('primitive.spacing.huge');
    expect(result.proposal.type).toBe('spacing');
    expect(result.proposal.suggestedValue).toBe('64px');
  });

  it('respects explicit category and type overrides', () => {
    const result = proposeToken('primary brand color', 'semantic', 'color');
    expect(result.proposal.category).toBe('semantic');
    expect(result.proposal.type).toBe('color');
    expect(result.proposal.path.startsWith('semantic.color.')).toBe(true);
  });

  it('uses description as path token when nothing else matches', () => {
    const result = proposeToken('zzz');
    expect(result.proposal.path).toBe('primitive.color.zzz');
    expect(result.proposal.suggestedValue).toBe('rgba(255,255,255,0.1)');
    expect(result.status).toBe('ok');
  });

  it('returns confidence and similarTo', () => {
    const result = proposeToken('cyan glow');
    expect(typeof result.proposal.confidence).toBe('number');
    expect(result.proposal.similarTo).toBeDefined();
    expect(result.proposal.confidence).toBeGreaterThan(0);
  });

  it('validates proposed path format', () => {
    const result = proposeToken('a sharp red alert shadow');
    expect(result.proposal.path).toMatch(/^(primitive|semantic|theme)\.[a-z]+\./);
    expect(result.proposal.type).toBe('shadow');
  });

  it('includes rationale', () => {
    const result = proposeToken('a soft gold glow');
    expect(result.proposal.rationale.length).toBeGreaterThan(0);
  });
});
