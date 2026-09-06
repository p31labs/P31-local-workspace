/**
 * Token → CSS variable generator for edge-render Worker.
 * Converts design-system.json tokens to :root CSS custom properties.
 */

interface TokenValue {
  $type: string;
  $value: string | number;
  $description?: string;
}

export function tokensToCSS(tokens: Record<string, Record<string, TokenValue>>): string {
  const lines: string[] = [];
  lines.push('  /* P31 Quantum Design System — tokens generated at edge */');

  // Root tokens → --p31-{name}
  const root = tokens.root || {};
  for (const [key, val] of Object.entries(root)) {
    const name = key.replace(/_/g, '-');
    lines.push(`  --p31-${name}: ${val.$value};`);
  }

  // Scale → --p31-scale-{name}
  const scale = tokens.scale || {};
  for (const [key, val] of Object.entries(scale)) {
    lines.push(`  --p31-scale-${key}: ${val.$value};`);
  }

  // Spacing → --p31-space-{name}
  const spacing = tokens.spacing || {};
  for (const [key, val] of Object.entries(spacing)) {
    lines.push(`  --p31-space-${key}: ${val.$value};`);
  }

  // Typography → --p31-font-{name}
  const typo = tokens.typography || {};
  for (const [key, val] of Object.entries(typo)) {
    const name = key.replace(/_/g, '-');
    lines.push(`  --p31-font-${name}: ${val.$value};`);
  }

  // Animation → --p31-duration-{name}, --p31-easing-{name}
  const anim = tokens.animation || {};
  for (const [key, val] of Object.entries(anim)) {
    const name = key.replace(/_/g, '-');
    lines.push(`  --p31-${name}: ${val.$value};`);
  }

  // Shadow → --p31-shadow-{name}
  const shadow = tokens.shadow || {};
  for (const [key, val] of Object.entries(shadow)) {
    const name = key.replace(/_/g, '-');
    lines.push(`  --p31-shadow-${name}: ${val.$value};`);
  }

  // Primitive colors → --p31-ref-{name}
  const prim = tokens.primitive || {};
  const colors = (prim as any).color || {};
  for (const [key, val] of Object.entries(colors) as [string, any][]) {
    lines.push(`  --p31-ref-${key}: ${val.$value || val};`);
  }

  // Primitive blur → --p31-blur-{name}
  const blur = (prim as any).blur || {};
  for (const [key, val] of Object.entries(blur) as [string, any][]) {
    lines.push(`  --p31-blur-${key}: ${val.$value || val};`);
  }

  // Primitive radius → --p31-radius-{name}
  const radius = (prim as any).radius || {};
  for (const [key, val] of Object.entries(radius) as [string, any][]) {
    lines.push(`  --p31-radius-${key}: ${val.$value || val};`);
  }

  // Component tokens → --p31-{name}
  const comp = tokens.component || {};
  for (const [key, props] of Object.entries(comp) as [string, Record<string, string>][]) {
    const prefix = `--p31-${key.replace(/_/g, '-')}`;
    for (const [prop, value] of Object.entries(props)) {
      const propName = prop.replace(/_/g, '-');
      lines.push(`  ${prefix}-${propName}: ${value};`);
    }
  }

  // Semantic colors → --p31-{name}
  const sem = tokens.semantic || {};
  const semColors = (sem as any).color || {};
  for (const [key, val] of Object.entries(semColors) as [string, any][]) {
    const name = key.replace(/_/g, '-');
    if (typeof val === 'object' && val.$value) {
      lines.push(`  --p31-${name}: ${val.$value};`);
    } else if (typeof val === 'string') {
      lines.push(`  --p31-${name}: ${val};`);
    }
  }

  return lines.join('\n');
}
