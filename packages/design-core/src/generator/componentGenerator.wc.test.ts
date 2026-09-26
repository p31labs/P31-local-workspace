import {
  tokenPathToVar,
  resolveTokenVar,
  camelToKebab,
  escapeJs,
  tagName,
  observedAttrs,
  cssClasses,
  componentStyles,
  slotStyles,
  generateTokensCSS,
  resolveReferences,
  resolveRawToken,
  generateWC,
  generateWebComponents,
} from './componentGenerator.wc.js';
import type { ComponentDef, TokensFile } from './componentGenerator.wc.js';

const MOCK_TOKENS: TokensFile = {
  version: '2.0',
  primitive: {
    color: {
      cyan: { $value: '#00F0FF' },
      violet: { $value: '#A78BFA' },
      gold: { $value: '#FBBF24' },
      void: { $value: '#0A0A0F' },
      glass_surface: { $value: 'rgba(255,255,255,0.04)' },
      glass_border: { $value: 'rgba(255,255,255,0.08)' },
      glass_border_hover: { $value: 'rgba(255,255,255,0.15)' },
    },
    blur: {
      standard: { $value: '12px' },
      strong: { $value: '24px' },
      subtle: { $value: '8px' },
    },
    spacing: {
      sm: { $value: '8px' },
      md: { $value: '16px' },
      lg: { $value: '24px' },
      xl: { $value: '32px' },
      xs: { $value: '4px' },
    },
    radius: {
      sm: { $value: '8px' },
      md: { $value: '12px' },
      xl: { $value: '24px' },
    },
    shadow: {
      glass: { $value: '0 8px 32px rgba(0,0,0,0.15)' },
      glow_cyan: { $value: '0 0 20px rgba(0,240,255,0.25)' },
    },
    typography: {
      font_sans: { $value: 'system-ui, sans-serif' },
      font_mono: { $value: 'ui-monospace, monospace' },
    },
  },
  semantic: {
    color: {
      background: {
        default: { $value: '{primitive.color.void}' },
      },
      accent: {
        default: { $value: '{primitive.color.cyan}' },
      },
      text: {
        primary: { $value: '{primitive.color.gold}' },
        secondary: { $value: '{primitive.color.cyan}' },
        tertiary: { $value: '{primitive.color.violet}' },
      },
    },
  },
  component: {
    glass_panel: {
      background: { $value: '{primitive.color.glass_surface}' },
      border: { $value: '1px solid {primitive.color.glass_border}' },
    },
    glass_card: {
      background: { $value: '{primitive.color.glass_surface}' },
      border: { $value: '1px solid {primitive.color.glass_border}' },
      border_hover: { $value: '{primitive.color.glass_border_hover}' },
    },
  },
};

describe('tokenPathToVar', () => {
  it('converts primitive.color.cyan to CSS var', () => {
    expect(tokenPathToVar('primitive.color.cyan')).toBe('--p31-primitive-color-cyan');
  });

  it('converts primitive.shadow.glass to CSS var', () => {
    expect(tokenPathToVar('primitive.shadow.glass')).toBe('--p31-primitive-shadow-glass');
  });

  it('handles single-segment token', () => {
    expect(tokenPathToVar('cyan')).toBe('--p31-cyan');
  });
});

describe('resolveTokenVar', () => {
  it('resolves resolved token to literal value', () => {
    expect(resolveTokenVar('semantic.color.accent.default', MOCK_TOKENS)).toBe('#00F0FF');
  });

  it('returns var() reference when token missing', () => {
    expect(resolveTokenVar('primitive.missing.token', MOCK_TOKENS)).toBe('var(--p31-primitive-missing-token)');
  });
});

describe('camelToKebab', () => {
  it('converts variantName to variant-name', () => {
    expect(camelToKebab('variantName')).toBe('variant-name');
  });

  it('converts onClick to on-click', () => {
    expect(camelToKebab('onClick')).toBe('on-click');
  });

  it('leaves kebab-case unchanged', () => {
    expect(camelToKebab('already-kebab')).toBe('already-kebab');
  });

  it('handles single lowercase letter', () => {
    expect(camelToKebab('x')).toBe('x');
  });
});

describe('escapeJs', () => {
  it('escapes backslashes', () => {
    expect(escapeJs('C:\\path')).toBe('C:\\\\path');
  });

  it('escapes backticks', () => {
    expect(escapeJs('say `hi`')).toBe('say \\`hi\\`');
  });

  it('escapes dollars', () => {
    expect(escapeJs('cost $5')).toBe('cost \\$5');
  });

  it('leaves normal text unchanged', () => {
    expect(escapeJs('hello world')).toBe('hello world');
  });
});

describe('tagName', () => {
  it('converts glass-card to p31-glass-card', () => {
    expect(tagName('glass-card')).toBe('p31-glass-card');
  });

  it('converts glass_panel to p31-glass-panel', () => {
    expect(tagName('glass_panel')).toBe('p31-glass-panel');
  });
});

describe('resolveReferences', () => {
  it('resolves simple ref {primitive.color.cyan}', () => {
    expect(resolveReferences('{primitive.color.cyan}', MOCK_TOKENS)).toBe('#00F0FF');
  });

  it('resolves chain ref {semantic.color.accent.default}', () => {
    expect(resolveReferences('{semantic.color.accent.default}', MOCK_TOKENS)).toBe('#00F0FF');
  });

  it('returns raw for missing ref', () => {
    expect(resolveReferences('{primitive.missing}', MOCK_TOKENS)).toBe('{primitive.missing}');
  });

  it('prevents circular refs', () => {
    const circular: TokensFile = {
      version: '2.0',
      primitive: {
        a: { $value: '{primitive.b}' },
      },
      semantic: {},
    };
    (circular.primitive as any).b = { $value: '{primitive.a}' };
    expect(resolveReferences('{primitive.a}', circular)).toBe('{primitive.a}');
  });

  it('resolves nested refs fully', () => {
    const nested: TokensFile = {
      version: '2.0',
      primitive: {
        color: {
          cyan: { $value: '#00F0FF' },
        },
      },
      semantic: {
        color: {
          accent: {
            default: { $value: '{primitive.color.cyan}' },
          },
        },
      },
    };
    expect(resolveReferences('{semantic.color.accent.default}', nested)).toBe('#00F0FF');
  });
});

describe('resolveRawToken', () => {
  it('returns $value for leaf token', () => {
    expect(resolveRawToken('primitive.color.cyan', MOCK_TOKENS)).toBe('#00F0FF');
  });

  it('returns $value for nested path', () => {
    expect(resolveRawToken('primitive.blur.standard', MOCK_TOKENS)).toBe('12px');
  });

  it('returns undefined for missing path', () => {
    expect(resolveRawToken('primitive.nonexistent', MOCK_TOKENS)).toBeUndefined();
  });
});

describe('observedAttrs', () => {
  it('kebab-cases string and number props', () => {
    const def: ComponentDef = {
      props: {
        variant: { type: 'string' },
        count: { type: 'number' },
        disabled: { type: 'boolean' },
      },
    };
    expect(observedAttrs(def)).toEqual(['variant', 'count']);
  });

  it('returns empty array when no props', () => {
    expect(observedAttrs({ props: undefined })).toEqual([]);
  });

  it('handles undefined props', () => {
    expect(observedAttrs({ props: { active: { type: 'boolean' } } })).toEqual([]);
  });
});

describe('cssClasses', () => {
  it('emits var() declarations for primitive tokens', () => {
    const def: ComponentDef = {
      tokens: ['primitive.color.cyan', 'primitive.color.glass_surface'],
    };
    const result = cssClasses(def, MOCK_TOKENS);
    expect(result).toContain('--p31-primitive-color-cyan: #00F0FF;');
  });

  it('omits non-primitive tokens', () => {
    const def: ComponentDef = {
      tokens: ['semantic.color.accent.default'],
    };
    expect(cssClasses(def, MOCK_TOKENS)).toBe('');
  });
});

describe('componentStyles', () => {
  it('GlassCard includes blur, border, shadow, and color variant', () => {
    const def: ComponentDef = { tokens: ['primitive.color.cyan', 'primitive.color.glass_surface'] };
    const result = componentStyles('GlassCard', def, MOCK_TOKENS);
    expect(result).toContain('backdrop-filter: blur(12px)');
    expect(result).toContain('box-shadow:');
    expect(result).toContain(':host([color="violet"])');
    expect(result).toContain('--p31-accent: #A78BFA');
  });

  it('SpoonMeter includes .dot.filled and accent color', () => {
    const def: ComponentDef = { tokens: ['semantic.color.accent.default', 'semantic.color.text.tertiary'] };
    const result = componentStyles('SpoonMeter', def, MOCK_TOKENS);
    expect(result).toContain('.dot.filled');
    expect(result).toContain('--p31-semantic-color-accent-default: #00F0FF');
  });

  it('Button includes variant and size attribute selectors', () => {
    const def: ComponentDef = {
      tokens: ['semantic.color.accent.default', 'primitive.color.void'],
    };
    const result = componentStyles('Button', def, MOCK_TOKENS);
    expect(result).toContain(':host([variant="primary"])');
    expect(result).toContain(':host([size="sm"])');
    expect(result).toContain(':host([size="lg"])');
  });

  it('CrisisOverlay includes fixed and z-index', () => {
    const def: ComponentDef = { tokens: ['semantic.color.background.default'] };
    const result = componentStyles('CrisisOverlay', def, MOCK_TOKENS);
    expect(result).toContain('position: fixed');
    expect(result).toContain('z-index: 9999');
    expect(result).toContain('backdrop-filter:');
  });

  it('TetraGrid includes responsive breakpoints', () => {
    const def: ComponentDef = { tokens: [] };
    const result = componentStyles('TetraGrid', def, MOCK_TOKENS);
    expect(result).toContain('grid-template-columns: repeat(4, 1fr)');
    expect(result).toContain('@media (max-width: 1024px)');
    expect(result).toContain('@media (max-width: 640px)');
  });
});

describe('slotStyles', () => {
  it('GlassPanel returns ::slotted(*) selector', () => {
    expect(slotStyles('GlassPanel')).toContain('::slotted(*)');
  });

  it('CrisisOverlay returns crisis message and button styles', () => {
    const result = slotStyles('CrisisOverlay');
    expect(result).toContain('.p31-crisis-message');
    expect(result).toContain('.p31-crisis-button');
  });

  it('Starfield returns empty string', () => {
    expect(slotStyles('Starfield')).toBe('');
  });

  it('returns empty for unknown component', () => {
    expect(slotStyles('UnknownComp')).toBe('');
  });
});

describe('generateTokensCSS', () => {
  it('emits :root block with --p31-* variables', () => {
    const result = generateTokensCSS(MOCK_TOKENS);
    expect(result).toContain(':root {');
    expect(result).toContain('--p31-primitive-color-cyan: #00F0FF;');
  });

  it('includes at least one resolved semantic token', () => {
    const result = generateTokensCSS(MOCK_TOKENS);
    expect(result).toContain('--p31-semantic-color-background-default:');
  });
});

describe('generateWC', () => {
  it('produces Button with variant and size selectors', () => {
    const def: ComponentDef = {
      css_class: 'btn-primary',
      props: {
        variant: { type: 'string' },
        size: { type: 'string' },
      },
      tokens: ['semantic.color.accent.default', 'primitive.color.void'],
    };
    const result = generateWC('Button', def, MOCK_TOKENS);
    expect(result).toContain('const template = document.createElement');
    expect(result).toContain("customElements.define('p31-btn-primary'");
    expect(result).toContain(":host([variant=\"primary\"])");
    expect(result).toContain(":host([size=\"sm\"])");
    expect(result).toContain(":host([size=\"lg\"])");
  });

  it('produces CrisisOverlay with ARIA and slot defaults', () => {
    const def: ComponentDef = {
      css_class: 'crisis-overlay',
      props: {
        message: { type: 'string', default: 'Rest. Breathe.' },
        buttonLabel: { type: 'string', default: "I'm Ready" },
      },
      slots: [],
    };
    const result = generateWC('CrisisOverlay', def, MOCK_TOKENS);
    expect(result).toContain("setAttribute('role', 'dialog')");
    expect(result).toContain("setAttribute('aria-modal', 'true')");
    expect(result).toContain('Rest. Breathe.');
    expect(result).toContain("I'm Ready");
  });

  it('produces ThemeToggle with dark/light logic', () => {
    const def: ComponentDef = {
      css_class: 'theme-toggle',
      props: {},
      slots: [],
    };
    const result = generateWC('ThemeToggle', def, MOCK_TOKENS);
    expect(result).toContain("if (name === 'dark' || name === 'light')");
    expect(result).toContain('🌙');
    expect(result).toContain('☀');
  });

  it('produces StatusBadge with status attribute callback', () => {
    const def: ComponentDef = {
      css_class: 'status-badge',
      props: {
        status: { type: 'string', default: 'live' },
      },
      slots: [null],
    };
    const result = generateWC('StatusBadge', def, MOCK_TOKENS);
    expect(result).toContain("if (name === 'status')");
    expect(result).toContain('this.textContent = this.getAttribute');
  });

  it('produces GlassCard with color attribute logic', () => {
    const def: ComponentDef = {
      css_class: 'glass-card',
      props: {
        color: { type: 'string', default: 'accent' },
      },
      tokens: ['primitive.color.cyan', 'primitive.color.glass_surface'],
    };
    const result = generateWC('GlassCard', def, MOCK_TOKENS);
    expect(result).toContain("if (name === 'color')");
    expect(result).toContain("--p31-accent");
    expect(result).toContain(":host([color=\"violet\"])");
  });

  it('produces valid WC structure', () => {
    const def: ComponentDef = {
      css_class: 'test-comp',
      props: {},
      slots: [null],
    };
    const result = generateWC('TestComp', def, MOCK_TOKENS);
    expect(result).toContain('class P31TestComp extends HTMLElement');
    expect(result).toContain('attachShadow({ mode: \'open\' })');
    expect(result).toContain('connectedCallback()');
  });
});

describe('generateWebComponents', () => {
  const fixtureComponents = {
    components: {
      GlassPanel: { css_class: 'glass-panel', tokens: [] },
      GlassCard: { css_class: 'glass-card', tokens: [] },
      Button: { css_class: 'btn-primary', props: { variant: { type: 'string' } }, tokens: [] },
      SpoonMeter: { css_class: 'spoon-meter', tokens: [] },
      TetraGrid: { css_class: 'tetra-grid', tokens: [] },
      HonestLabel: { css_class: 'honest-label', tokens: [] },
      StatusBadge: { css_class: 'status-badge', tokens: [] },
      CrisisOverlay: { css_class: 'crisis-overlay', props: { message: { type: 'string', default: 'test' } }, tokens: [] },
      Starfield: { css_class: 'starfield', tokens: [], props: { count: { type: 'number', default: 200 } } },
      ThemeToggle: { css_class: 'theme-toggle', tokens: [] },
    },
    version: '2.0',
  };

  const fixtureTokens: TokensFile = {
    version: '2.0',
    primitive: {
      color: {
        cyan: { $value: '#00F0FF' },
        glass_surface: { $value: 'rgba(255,255,255,0.04)' },
      },
    },
    semantic: {},
  };

  it('generates files for all components in fixture', () => {
    const generated = generateWebComponents({ componentsData: fixtureComponents, tokensData: fixtureTokens });
    const names = generated.map((g) => g.name);
    expect(names).toContain('GlassPanel');
    expect(names).toContain('GlassCard');
    expect(names).toContain('Button');
    expect(names).toContain('SpoonMeter');
    expect(names).toContain('TetraGrid');
    expect(names).toContain('HonestLabel');
    expect(names).toContain('StatusBadge');
    expect(names).toContain('CrisisOverlay');
    expect(names).toContain('Starfield');
    expect(names).toContain('ThemeToggle');
    expect(names).toContain('p31-tokens');
    expect(generated).toHaveLength(11);
  });

  it('filters by component name', () => {
    const generated = generateWebComponents({ component: 'Button', componentsData: fixtureComponents, tokensData: fixtureTokens });
    expect(generated).toHaveLength(2);
    expect(generated.map((g) => g.name)).toEqual(['Button', 'p31-tokens']);
    expect(generated[0].code).toContain("customElements.define('p31-btn-primary'");
  });

  it('each generated file contains customElements.define', () => {
    const generated = generateWebComponents({ componentsData: fixtureComponents, tokensData: fixtureTokens });
    for (const item of generated) {
      if (item.name !== 'p31-tokens') {
        const comp = fixtureComponents.components[item.name as keyof typeof fixtureComponents.components];
        const tag = tagName(comp.css_class);
        expect(item.code).toContain(`customElements.define('${tag}'`);
      }
    }
  });
});
