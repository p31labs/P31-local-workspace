/**
 * @file P31 Component Converter — React ↔ Astro ↔ HTML round-tripping.
 *
 * Preserves CSS classes and visual parity by mapping framework-specific
 * syntax to shared P31 recipe classes.
 *
 * Usage:
 *   convertReactToAstro(tsxCode, 'Topbar')
 *   convertAstroToReact(astroCode, 'Topbar')
 *   convertHtmlToReact(htmlCode, 'Topbar')
 *   convertReactToHtml(tsxCode, 'Topbar')
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// ─── React → Astro ───────────────────────────────────────────────────────

export function convertReactToAstro(tsx: string, componentName: string): string {
  let astro = tsx;

  // Extract imports
  const imports: string[] = [];
  const importRegex = /import\s+.*?from\s+['"].*?['"];?/g;
  let importMatch;
  while ((importMatch = importRegex.exec(tsx)) !== null) {
    imports.push(importMatch[0]);
  }

  // Remove React import (not needed in Astro)
  const reactImports = imports.filter((i) => !i.includes('react'));
  const importBlock = reactImports.length > 0 ? reactImports.join('\n') + '\n\n' : '';

  // Convert JSX → Astro template
  astro = astro
    .replace(/className=/g, 'class=')
    .replace(/htmlFor=/g, 'for=')
    .replace(/onClick=/g, 'onclick=')
    .replace(/onChange=/g, 'onchange=')
    .replace(/onSubmit=/g, 'onsubmit=')
    .replace(/readOnly=/g, 'readonly=')
    .replace(/tabIndex=/g, 'tabindex=')
    .replace(/<br\s*\/>/g, '<br>')
    .replace(/<img\s*\/>/g, '<img>')
    .replace(/<input\s*\/>/g, '<input>')
    .replace(/<hr\s*\/>/g, '<hr>');

  // Remove React-specific patterns
  astro = astro.replace(/\{\s*useState\([^)]*\)\s*\}/g, '');
  astro = astro.replace(/\{\s*useEffect\([^)]*\)\s*\}/g, '');
  astro = astro.replace(/\{\s*useRef<[^>]+>\(\)\s*\}/g, '');
  astro = astro.replace(/\{\s*useCallback\([^)]*\)\s*\}/g, '');

  // Convert React event handlers in template
  astro = astro.replace(/\{\(\)\s*=>\s*[^}]+\}/g, '');
  astro = astro.replace(/\{\s*e\s*=>\s*[^}]+\}/g, '');
  astro = astro.replace(/\{\s*event\s*=>\s*[^}]+\}/g, '');

  // Convert {children} → <slot />
  astro = astro.replace(/\{\s*children\s*\}/g, '<slot />');

  // Convert style objects to style strings (basic)
  astro = astro.replace(/style=\{\{\s*([^}]+)\s*\}\}/g, (match, props) => {
    const stylePairs = props
      .split(',')
      .map((p: string) => {
        const [key, value] = p.split(':').map((s: string) => s.trim());
        if (!key || !value) return '';
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .filter(Boolean);
    return `style="${stylePairs.join('; ')}"`;
  });

  // Remove type annotations from props
  astro = astro.replace(/: string\b/g, '');
  astro = astro.replace(/: number\b/g, '');
  astro = astro.replace(/: boolean\b/g, '');
  astro = astro.replace(/: ReactNode\b/g, '');
  astro = astro.replace(/: React\.CSSProperties\b/g, '');

  // Generate Astro frontmatter
  const propsMatch = tsx.match(/interface\s+\w+Props\s*\{([^}]+)\}/);
  let frontmatter = '';
  if (propsMatch) {
    const props = propsMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, type] = line.split(':').map((s) => s.trim());
        return `  ${name};`;
      })
      .join('\n');
    frontmatter = `---\ninterface Props {\n${props}\n}\nconst { /* destructure props */ } = Astro.props;\n---\n\n`;
  }

  return `${importBlock}${frontmatter}${astro}`;
}

// ─── Astro → React ──────────────────────────────────────────────────────

export function convertAstroToReact(astro: string, componentName: string): string {
  let tsx = astro;

  // Remove Astro frontmatter
  tsx = tsx.replace(/---[\s\S]*?---/g, '');

  // Convert Astro syntax → React
  tsx = tsx.replace(/class=/g, 'className=');
  tsx = tsx.replace(/for=/g, 'htmlFor=');
  tsx = tsx.replace(/onclick=/g, 'onClick=');
  tsx = tsx.replace(/onchange=/g, 'onChange=');
  tsx = tsx.replace(/onsubmit=/g, 'onSubmit=');

  // Convert <slot /> → {children}
  tsx = tsx.replace(/<slot\s*\/>/g, '{children}');

  // Convert void elements back to self-closing
  tsx = tsx.replace(/<br>(?!\s*<\/br>)/g, '<br />');
  tsx = tsx.replace(/<img>(?!\s*<\/img>)/g, '<img />');
  tsx = tsx.replace(/<input>(?!\s*<\/input>)/g, '<input />');
  tsx = tsx.replace(/<hr>(?!\s*<\/hr>)/g, '<hr />');

  // Generate React component wrapper
  const imports = `import type { ReactNode } from 'react';\n\n`;
  const interfaceMatch = astro.match(/interface\s+Props\s*\{([^}]+)\}/);
  let propsInterface = '';
  if (interfaceMatch) {
    const props = interfaceMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `  ${line}`)
      .join('\n');
    propsInterface = `interface ${componentName}Props {\n${props}\n}\n\n`;
  }

  return `${imports}${propsInterface}export function ${componentName}(props: ${componentName}Props) {\n  const { children, ...rest } = props;\n  return (\n${tsx.split('\n').map((line) => '    ' + line).join('\n')}\n  );\n}\n\nexport default ${componentName};\n`;
}

// ─── HTML → React ───────────────────────────────────────────────────────

export function convertHtmlToReact(html: string, componentName: string): string {
  let tsx = html;

  // Convert HTML attributes → React
  tsx = tsx.replace(/\s+class=/g, ' className=');
  tsx = tsx.replace(/\s+for=/g, ' htmlFor=');
  tsx = tsx.replace(/\s+onclick=/g, ' onClick=');
  tsx = tsx.replace(/\s+onchange=/g, ' onChange=');
  tsx = tsx.replace(/\s+onsubmit=/g, ' onSubmit=');

  // Convert void elements
  tsx = tsx.replace(/<br>/g, '<br />');
  tsx = tsx.replace(/<img>/g, '<img />');
  tsx = tsx.replace(/<input>/g, '<input />');
  tsx = tsx.replace(/<hr>/g, '<hr />');

  // Wrap in React component
  const imports = `import type { ReactNode } from 'react';\n\n`;
  return `${imports}export function ${componentName}({ children }: { children?: ReactNode }) {\n  return (\n${tsx.split('\n').map((line) => '    ' + line).join('\n')}\n  );\n}\n\nexport default ${componentName};\n`;
}

// ─── React → HTML ────────────────────────────────────────────────────────

export function convertReactToHtml(tsx: string, componentName: string): string {
  let html = tsx;

  // Remove React-specific syntax
  html = html.replace(/className=/g, 'class=');
  html = html.replace(/htmlFor=/g, 'for=');
  html = html.replace(/onClick=/g, 'onclick=');
  html = html.replace(/onChange=/g, 'onchange=');
  html = html.replace(/onSubmit=/g, 'onsubmit=');

  // Remove JSX expressions
  html = html.replace(/\{[^}]*\}/g, '');

  // Convert self-closing to void elements
  html = html.replace(/<br\s*\/>/g, '<br>');
  html = html.replace(/<img\s*\/>/g, '<img>');
  html = html.replace(/<input\s*\/>/g, '<input>');
  html = html.replace(/<hr\s*\/>/g, '<hr>');

  // Remove TypeScript types
  html = html.replace(/: string\b/g, '');
  html = html.replace(/: number\b/g, '');
  html = html.replace(/: boolean\b/g, '');
  html = html.replace(/: ReactNode\b/g, '');
  html = html.replace(/: React\.CSSProperties\b/g, '');

  // Remove imports and exports
  html = html.replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '');
  html = html.replace(/export\s+(default\s+)?/g, '');
  html = html.replace(/interface\s+\w+\s*\{[^}]*\}/g, '');

  return html;
}

// ─── CLI ────────────────────────────────────────────────────────────────

export function convertFile(inputPath: string, outputPath: string, source: string, target: string) {
  const code = readFileSync(inputPath, 'utf-8');
  const componentName = inputPath.split(/[\/\\]/).pop()?.replace(/\.(tsx|astro|html?)$/, '') || 'Component';

  let result: string;
  switch (`${source}->${target}`) {
    case 'react->astro':
      result = convertReactToAstro(code, componentName);
      break;
    case 'astro->react':
      result = convertAstroToReact(code, componentName);
      break;
    case 'html->react':
      result = convertHtmlToReact(code, componentName);
      break;
    case 'react->html':
      result = convertReactToHtml(code, componentName);
      break;
    default:
      throw new Error(`Unsupported conversion: ${source} → ${target}`);
  }

  const dir = outputPath.split(/[\/\\]/).slice(0, -1).join('/');
  mkdirSync(dir, { recursive: true });
  writeFileSync(outputPath, result);
  console.log(`Converted ${inputPath} → ${outputPath} (${source} → ${target})`);
}
