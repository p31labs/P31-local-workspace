/**
 * Token → CSS variable generator for app-builder Worker.
 * Converts design-system.json tokens to :root CSS custom properties.
 */

interface TokenValue {
  $type?: string;
  $value: string | number;
  $description?: string;
}

export function tokensToCSS(tokens: Record<string, any>): string {
  const lines: string[] = [];
  lines.push('  /* P31 Quantum Design System — tokens generated at edge */');

  const root = tokens.root || {};
  for (const [key, val] of Object.entries(root)) {
    const name = key.replace(/_/g, '-');
    const v = (val as any).$value ?? val;
    lines.push(`  --p31-${name}: ${v};`);
  }

  const scale = tokens.scale || {};
  for (const [key, val] of Object.entries(scale)) {
    const v = (val as any).$value ?? val;
    lines.push(`  --p31-scale-${key}: ${v};`);
  }

  const spacing = tokens.spacing || {};
  for (const [key, val] of Object.entries(spacing)) {
    const v = (val as any).$value ?? val;
    lines.push(`  --p31-space-${key}: ${v};`);
  }

  const typo = tokens.typography || {};
  for (const [key, val] of Object.entries(typo)) {
    const name = key.replace(/_/g, '-');
    const v = (val as any).$value ?? val;
    lines.push(`  --p31-font-${name}: ${v};`);
  }

  const anim = tokens.animation || {};
  for (const [key, val] of Object.entries(anim)) {
    const name = key.replace(/_/g, '-');
    const v = (val as any).$value ?? val;
    lines.push(`  --p31-${name}: ${v};`);
  }

  const shadow = tokens.shadow || {};
  for (const [key, val] of Object.entries(shadow)) {
    const name = key.replace(/_/g, '-');
    const v = (val as any).$value ?? val;
    lines.push(`  --p31-shadow-${name}: ${v};`);
  }

  const prim = tokens.primitive || {};
  const colors = prim.color || {};
  for (const [key, val] of Object.entries(colors)) {
    const v = (val as any).$value ?? val;
    lines.push(`  --p31-ref-${key}: ${v};`);
  }

  const blur = prim.blur || {};
  for (const [key, val] of Object.entries(blur)) {
    const v = (val as any).$value ?? val;
    lines.push(`  --p31-blur-${key}: ${v};`);
  }

  const radius = prim.radius || {};
  for (const [key, val] of Object.entries(radius)) {
    const v = (val as any).$value ?? val;
    lines.push(`  --p31-radius-${key}: ${v};`);
  }

  const comp = tokens.component || {};
  for (const [key, props] of Object.entries(comp) as [string, Record<string, string>][]) {
    const prefix = `--p31-${key.replace(/_/g, '-')}`;
    for (const [prop, value] of Object.entries(props)) {
      const propName = prop.replace(/_/g, '-');
      lines.push(`  ${prefix}-${propName}: ${value};`);
    }
  }

  const sem = tokens.semantic || {};
  const semColors = sem.color || {};
  for (const [key, val] of Object.entries(semColors)) {
    const name = key.replace(/_/g, '-');
    const typed = val as any;
    if (typed.$value) {
      lines.push(`  --p31-${name}: ${typed.$value};`);
    } else if (typeof val === 'string') {
      lines.push(`  --p31-${name}: ${val};`);
    }
  }

  return lines.join('\n');
}
