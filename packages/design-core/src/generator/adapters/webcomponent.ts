/**
 * @file Web Component Adapter — YAML → Shadow DOM custom elements.
 * Generates self-registering .wc.js files with CSS custom properties.
 *
 * Adapter interface:
 *   - generate(components, tokens, options) → GeneratedFile[]
 *   - write(components, tokens, options) → void
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import type { ComponentDef, TokensFile, GeneratedFile, GeneratorOptions } from '../shared';
import {
  loadComponents,
  loadTokens,
  ensureDir,
  COMPONENTS_YAML,
  TOKENS_YAML,
  camelToKebab,
  escapeJs,
  resolveToken,
  resolveReferences,
  resolveRawToken,
  tokenPathToVar,
  resolveTokenVar,
} from '../shared';

const OUTPUT_DIR = resolve(process.cwd(), '..', '..', 'packages', 'design-core', 'src', 'generated-wc');

export function tagName(cssClass: string): string {
  return 'p31-' + cssClass.replace(/_/g, '-');
}

export function observedAttrs(def: ComponentDef): string[] {
  const attrs: string[] = [];
  if (def.props) {
    for (const [name, pdef] of Object.entries(def.props)) {
      const type = (pdef as any).type;
      if (type !== 'boolean') {
        attrs.push(camelToKebab(name));
      }
    }
  }
  return attrs;
}

export function componentStyles(name: string, def: ComponentDef, tokens: TokensFile): string {
  const tag = tagName(def.css_class || name.toLowerCase());
  const styles: string[] = [];

  const tokenVars: string[] = [];
  for (const t of def.tokens || []) {
    const val = resolveTokenVar(t, tokens);
    const varName = tokenPathToVar(t);
    tokenVars.push(`    ${varName}: ${val};`);
  }

  switch (name) {
    case 'GlassPanel': {
      styles.push(`:host {
  display: block;
${tokenVars.join('\n')}
  border-radius: var(${tokenPathToVar('primitive.radius.xl')});
  backdrop-filter: blur(${resolveTokenVar('primitive.blur.standard', tokens)});
  -webkit-backdrop-filter: blur(${resolveTokenVar('primitive.blur.standard', tokens)});
  border: ${resolveTokenVar('component.glass_panel.border', tokens)};
  box-shadow: var(${tokenPathToVar('primitive.shadow.glass')});
}
:host([padding="sm"]) { padding: var(${tokenPathToVar('primitive.spacing.sm')}); }
:host([padding="lg"]) { padding: var(${tokenPathToVar('primitive.spacing.lg')}); }
`);
      break;
    }
    case 'GlassCard': {
      styles.push(`:host {
  display: block;
${tokenVars.join('\n')}
  border-radius: var(${tokenPathToVar('primitive.radius.xl')});
  backdrop-filter: blur(${resolveTokenVar('primitive.blur.standard', tokens)});
  -webkit-backdrop-filter: blur(${resolveTokenVar('primitive.blur.standard', tokens)});
  border: ${resolveTokenVar('component.glass_card.border', tokens)};
  box-shadow: var(${tokenPathToVar('primitive.shadow.glass')});
  transition: border-color 0.2s ease;
}
:host(:hover) {
  border-color: ${resolveTokenVar('component.glass_card.border_hover', tokens)};
}
:host([padding="sm"]) { padding: var(${tokenPathToVar('primitive.spacing.sm')}); }
:host([padding="lg"]) { padding: var(${tokenPathToVar('primitive.spacing.lg')}); }
:host([color="violet"]) {
  --p31-accent: ${resolveTokenVar('primitive.color.violet', tokens)};
}
:host([color="gold"]) {
  --p31-accent: ${resolveTokenVar('primitive.color.gold', tokens)};
}
:host([color="green"]) {
  --p31-accent: ${resolveTokenVar('primitive.color.green', tokens)};
}
:host([color="red"]) {
  --p31-accent: ${resolveTokenVar('primitive.color.red', tokens)};
}`);
      break;
    }
    case 'GlassStrong': {
      styles.push(`:host {
  display: block;
${tokenVars.join('\n')}
  border-radius: var(${tokenPathToVar('primitive.radius.xl')});
  backdrop-filter: blur(${resolveTokenVar('primitive.blur.strong', tokens)});
  -webkit-backdrop-filter: blur(${resolveTokenVar('primitive.blur.strong', tokens)});
  box-shadow: 0 8px 32px oklch(0 0 0 / 0.4);
}`);
      break;
    }
    case 'GlassSubtle': {
      styles.push(`:host {
  display: block;
${tokenVars.join('\n')}
  border-radius: var(${tokenPathToVar('primitive.radius.xl')});
  backdrop-filter: blur(${resolveTokenVar('primitive.blur.subtle', tokens)});
  -webkit-backdrop-filter: blur(${resolveTokenVar('primitive.blur.subtle', tokens)});
  box-shadow: 0 2px 8px oklch(0 0 0 / 0.2);
}`);
      break;
    }
    case 'Button': {
      styles.push(`:host {
  display: inline-flex;
${tokenVars.join('\n')}
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border-radius: var(${tokenPathToVar('primitive.radius.md')});
  font-size: 14px;
  padding: var(${tokenPathToVar('primitive.spacing.sm')}) var(${tokenPathToVar('primitive.spacing.lg')});
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 44px;
  min-width: 44px;
  font-family: ${resolveTokenVar('primitive.typography.font_sans', tokens)};
}
:host([variant="primary"]) {
  background: var(${tokenPathToVar('semantic.color.accent.default')});
  color: var(${tokenPathToVar('primitive.color.void')});
  box-shadow: var(${tokenPathToVar('primitive.shadow.glow_cyan')});
}
:host([variant="primary"]:hover) {
  filter: brightness(1.1);
}
:host([variant="secondary"]) {
  background: oklch(100% 0.01 270 / 0.06);
  color: var(${tokenPathToVar('semantic.color.text.primary')});
  border: 1px solid oklch(NaN NaN NaN);
}
:host([variant="ghost"]) {
  background: transparent;
  color: var(${tokenPathToVar('semantic.color.text.secondary')});
}
:host([size="sm"]) {
  font-size: 12px;
  padding: var(${tokenPathToVar('primitive.spacing.xs')}) var(${tokenPathToVar('primitive.spacing.sm')});
}
:host([size="lg"]) {
  font-size: 16px;
  padding: var(${tokenPathToVar('primitive.spacing.md')}) var(${tokenPathToVar('primitive.spacing.xl')});
}`);
      break;
    }
    case 'SpoonMeter': {
      styles.push(`:host {
  display: inline-flex;
  align-items: center;
  gap: 6px;
${tokenVars.join('\n')}
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: oklch(NaN NaN NaN);
  transition: all 0.3s ease;
}
.dot.filled {
  background: var(${tokenPathToVar('semantic.color.accent.default')});
  box-shadow: 0 0 6px var(${tokenPathToVar('semantic.color.accent.default')});
}`);
      break;
    }
    case 'TetraGrid': {
      styles.push(`:host {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1024px) {
  :host { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  :host { grid-template-columns: 1fr; }
}`);
      break;
    }
    case 'HonestLabel': {
      styles.push(`:host {
  display: inline-flex;
  align-items: center;
  gap: 6px;
${tokenVars.join('\n')}
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: oklch(100% 0.01 270 / 0.05);
  border: 1px solid oklch(NaN NaN NaN);
  font-family: ${resolveTokenVar('primitive.typography.font_mono', tokens)};
}`);
      break;
    }
    case 'StatusBadge': {
      styles.push(`:host {
  display: inline-flex;
  align-items: center;
${tokenVars.join('\n')}
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}
:host([status="live"]) {
  background: oklch(NaN NaN NaN);
  color: oklch(0.773 0.153 163);
  border-color: oklch(NaN NaN NaN);
}
:host([status="beta"]) {
  background: oklch(NaN NaN NaN);
  color: oklch(0.837 0.164 84);
  border-color: oklch(NaN NaN NaN);
}
:host([status="research"]) {
  background: oklch(NaN NaN NaN);
  color: oklch(0.709 0.159 294);
  border-color: oklch(NaN NaN NaN);
}`);
      break;
    }
    case 'CrisisOverlay': {
      styles.push(`:host {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
${tokenVars.join('\n')}
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}`);
      break;
    }
    case 'Starfield': {
      styles.push(`:host {
  position: fixed;
  inset: 0;
  pointer-events: none;
  display: block;
}`);
      break;
    }
    case 'ThemeToggle': {
      styles.push(`:host {
  display: inline-flex;
${tokenVars.join('\n')}
  padding: 8px;
  border-radius: 9999px;
  background: oklch(100% 0.01 270 / 0.05);
  border: 1px solid oklch(NaN NaN NaN);
  cursor: pointer;
  transition: border-color 0.2s ease;
}
:host(:hover) {
  border-color: oklch(NaN NaN NaN);
}`);
      break;
    }
    case 'SectionStrip': {
      styles.push(`:host {
  display: block;
${tokenVars.join('\n')}
}
.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: var(--p31-primitive-color-glass-surface);
  border: 1px solid var(--p31-primitive-color-glass-border);
  width: fit-content;
}
.tab {
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--p31-primitive-color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  min-height: 40px;
}
.tab.active {
  background: var(--p31-semantic-color-accent-default);
  color: var(--p31-primitive-color-void);
  font-weight: 600;
}`);
      break;
    }
    case 'CommandPalette': {
      styles.push(`:host {
  display: block;
${tokenVars.join('\n')}
}
.overlay {
  position: fixed;
  inset: 0;
  background: oklch(NaN NaN NaN);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 999;
}
.panel {
  width: min(480px, 90vw);
  background: var(--p31-primitive-color-glass-surface);
  border: 1px solid var(--p31-primitive-color-glass-border);
  border-radius: 12px;
  box-shadow: 0 24px 64px oklch(NaN NaN NaN);
  overflow: hidden;
}
.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid oklch(100% 0.01 270 / 0.08);
}
input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--p31-primitive-color-text-primary);
  font-size: 14px;
}
.list {
  padding: 6px;
  max-height: 40vh;
  overflow-y: auto;
}
.item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--p31-primitive-color-text-secondary);
  font-size: 14px;
  cursor: pointer;
}
.item.active {
  background: var(--p31-semantic-color-accent-default);
  color: var(--p31-primitive-color-void);
}`);
      break;
    }
    case 'Chameleon': {
      styles.push(`:host {
  display: inline-block;
${tokenVars.join('\n')}
}
.trigger {
  width: 38px;
  height: 38px;
  border-radius: 9999px;
  background: var(--p31-primitive-color-glass-surface);
  border: 1px solid var(--p31-primitive-color-glass-border);
  cursor: pointer;
  color: var(--p31-primitive-color-text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}`);
      break;
    }
    case 'PageHeader': {
      styles.push(`:host {
  display: block;
${tokenVars.join('\n')}
  text-align: center;
  padding: 48px 0 24px 0;
}
.eyebrow {
  font-family: var(--p31-primitive-typography-font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--p31-primitive-color-text-tertiary);
}
h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 8px 0;
  color: var(--p31-semantic-color-accent-default);
}
.lede {
  font-size: 16px;
  color: var(--p31-primitive-color-text-secondary);
  margin: 0;
}`);
      break;
    }
    default: {
      styles.push(`:host {
  display: block;
${tokenVars.join('\n')}
}`);
    }
  }

  return styles.join('\n');
}

export function slotStyles(name: string): string {
  switch (name) {
    case 'GlassPanel':
    case 'GlassCard':
    case 'GlassStrong':
    case 'GlassSubtle':
      return '::slotted(*) { color: var(--p31-semantic-color-text-primary); }\n';
    case 'Button':
      return '::slotted(*) { display: inline; }\n';
    case 'CrisisOverlay':
      return `::slotted(.p31-crisis-message) {
  font-size: 24px;
  font-weight: 300;
  color: var(--p31-semantic-color-text-primary);
  margin-bottom: 8px;
  text-align: center;
}
::slotted(.p31-crisis-button) {
  padding: 12px 24px;
  border-radius: 8px;
  background: var(--p31-semantic-color-accent-default);
  color: var(--p31-primitive-color-void);
  font-weight: 600;
  border: none;
  cursor: pointer;
  min-height: 44px;
}`;
    case 'SectionStrip':
      return `::slotted(p31-section-tab) {
  padding: 8px 18px;
  border-radius: 999px;
}`;
    case 'PageHeader':
      return `::slotted(*) {
  color: var(--p31-semantic-color-text-primary);
}`;
    default:
      return '';
  }
}

export function generateWC(name: string, def: ComponentDef, tokens: TokensFile): string {
  const tag = tagName(def.css_class || name.toLowerCase());
  const styleBlock = componentStyles(name, def, tokens);
  const slotStyle = slotStyles(name);
  const attrs = observedAttrs(def);
  const attrsList = attrs.map(a => `'${a}'`).join(', ');

  const attributeLogic: string[] = [];

  if (name === 'GlassCard') {
    attributeLogic.push(`    if (name === 'color') {
      this.shadowRoot.host.style.setProperty('--p31-accent', newVal || '');
    }`);
  }
  if (name === 'SpoonMeter') {
    attributeLogic.push(`    if (name === 'current') {
      const n = parseInt(newVal || '3', 10);
      const dots = this.shadowRoot.querySelectorAll('.dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('filled', i < n);
      });
    }`);
  }
  if (name === 'StatusBadge') {
    attributeLogic.push(`    if (name === 'status') {
      this.textContent = this.getAttribute('label') || STATUS_CONFIG[newVal]?.label || newVal;
    }`);
  }
  if (name === 'CrisisOverlay') {
    attributeLogic.push(`    if (name === 'message') {
      const msg = this.shadowRoot.querySelector('.p31-crisis-message');
      if (msg) msg.textContent = newVal;
    }
    if (name === 'buttonlabel') {
      const btn = this.shadowRoot.querySelector('.p31-crisis-button');
      if (btn) btn.textContent = newVal;
    }`);
  }
  if (name === 'ThemeToggle') {
    attributeLogic.push(`    if (name === 'dark' || name === 'light') {
      const isDark = this.getAttribute('dark') !== null;
      this.textContent = isDark ? '🌙' : '☀️';
    }`);
  }

  const eventProps: string[] = [];
  if (def.props) {
    for (const [pname, pdef] of Object.entries(def.props)) {
      const type = (pdef as any).type;
      if (type === 'function') {
        const eventName = camelToKebab(pname);
        eventProps.push(`    if (name === '${eventName}') {
      this.dispatchEvent(new CustomEvent('${eventName}', { bubbles: true, detail: { value: newVal } }));
    }`);
      }
    }
  }

  const allAttributeLogic = [...attributeLogic, ...eventProps];
  const attrBlock = allAttributeLogic.length > 0
    ? `  attributeChangedCallback(name, oldVal, newVal) {
${allAttributeLogic.join('\n')}
  }`
    : '';

  const slotDefault: string[] = [];
  if (name === 'SectionStrip') {
    slotDefault.push(`      <div class="tabs">
        <button class="tab active">Section</button>
        <button class="tab">Section</button>
        <button class="tab">Section</button>
      </div>`);
  } else if (name === 'CommandPalette') {
    slotDefault.push(`      <div class="overlay">
        <div class="panel">
          <div class="input-row">
            <input placeholder="Search…" aria-label="Search" />
          </div>
          <div class="list">
            <button class="item active">Result</button>
            <button class="item">Result</button>
          </div>
        </div>
      </div>`);
  } else if (name === 'Chameleon') {
    slotDefault.push(`      <button class="trigger" title="Adaptive theme controls">◐</button>`);
  } else if (name === 'PageHeader') {
    slotDefault.push(`      <span class="eyebrow">System</span>
      <h1>Design System</h1>
      <p class="lede">Live primitives from design-core</p>`);
  } else if (name === 'CrisisOverlay') {
    slotDefault.push(`      <slot class="p31-crisis-message">${escapeJs((def.props?.message?.default as string) || 'Rest. Breathe. The mesh holds.')}</slot>
      <slot class="p31-crisis-button">${escapeJs((def.props?.buttonLabel?.default as string) || "I'm Ready")}</slot>`);
  } else if (name === 'StatusBadge') {
    slotDefault.push(`      <slot>Live</slot>`);
  } else if (!['SpoonMeter', 'Starfield', 'ThemeToggle'].includes(name)) {
    slotDefault.push('      <slot></slot>');
  }

  return `/**
 * @file ${name}.wc.js — Web Component (Shadow DOM) version of ${name}.
 * Auto-generated from components.yml.
 *
 * Usage:
 *   <script type="module" src="./${name}.wc.js"></script>
 *   <${tag}></${tag}>
 *
 * Requires p31-tokens.css to be loaded (defines --p31-* variables).
 */

const template = document.createElement('template');
template.innerHTML = \`
  <style>
${styleBlock}
${slotStyle}
  </style>
${slotDefault.join('\n')}
\`;

class P31${name} extends HTMLElement {
  static get observedAttributes() { return [${attrsList}]; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
${attrBlock}

  connectedCallback() {
    ${name === 'CrisisOverlay' ? `this.setAttribute('role', 'dialog');\n    this.setAttribute('aria-modal', 'true');` : ''}
    ${name === 'SpoonMeter' ? `this.setAttribute('role', 'img');\n    this.setAttribute('aria-label', 'Spoon level ' + (this.getAttribute('current') || '3') + ' of 5');` : ''}
  }
}

customElements.define('${tag}', P31${name});
`;
}

export function generateTokensCSS(tokens: TokensFile): string {
  const lines: string[] = [
    '/**',
    ' * P31 Design System — Token CSS Variables',
    ' * Auto-generated from tokens.yml',
    ' */',
    '',
    ':root {',
  ];

  function walk(prefix: string, node: any) {
    if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('$')) continue;
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && '$value' in value) {
          const cssVar = '--p31-' + path.replace(/\./g, '-');
          lines.push(`  ${cssVar}: ${value.$value};`);
        } else {
          walk(path, value);
        }
      }
    }
  }

  walk('', tokens);
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

export function generateWebComponents(options: GeneratorOptions = {}): GeneratedFile[] {
  const componentsData = options.componentsData || loadComponents(options.componentsPath);
  const tokens = options.tokensData || loadTokens(options.tokensPath);
  const generated: GeneratedFile[] = [];
  const names = Object.keys(componentsData.components || componentsData);

  for (const name of names) {
    if (options.component && options.component !== name) continue;
    const def = componentsData.components?.[name] || componentsData[name];
    if (!def) continue;

    generated.push({
      name,
      path: `${OUTPUT_DIR}/${name}.wc.js`,
      code: generateWC(name, def, tokens),
    });
  }

  generated.push({
    name: 'p31-tokens',
    path: `${OUTPUT_DIR}/p31-tokens.css`,
    code: generateTokensCSS(tokens),
  });

  return generated;
}

export function writeWebComponents(options: GeneratorOptions = {}): void {
  const generated = generateWebComponents(options);
  ensureDir(OUTPUT_DIR);

  for (const item of generated) {
    writeFileSync(item.path, item.code, 'utf-8');
    console.log(`  Generated: ${item.path}`);
  }

  console.log(`\n✅ Generated ${generated.length} Web Component files for ${options.component || 'all components'}`);
}
