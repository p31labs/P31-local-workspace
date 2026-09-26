/**
 * @file HTML Adapter — YAML → standalone HTML preview snippets.
 * Generates .html files with inline CSS previews, AI guidance, and copy buttons.
 *
 * Adapter interface:
 *   - generate(components, tokens, options) → GeneratedFile[]
 *   - write(components, tokens, options) → void
 */

import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { ComponentDef, TokensFile, GeneratedFile, GeneratorOptions } from '../shared';
import {
  loadComponents,
  loadTokens,
  parseYamlSimple,
  ensureDir,
  escapeHtml,
  cssVarName,
  COMPONENTS_YAML,
  TOKENS_YAML,
} from '../shared';

const OUTPUT_DIR = resolve(process.cwd(), '..', '..', 'packages', 'design-core', 'src', 'generated-html');

function componentPreview(name: string, def: ComponentDef): string {
  switch (name) {
    case 'GlassPanel':
      return `<div style="background:oklch(100% 0.01 270 / 0.04);backdrop-filter:blur(12px);border:1px solid oklch(100% 0.01 270 / 0.08);border-radius:24px;padding:24px;box-shadow:0 8px 32px oklch(0 0 0 / 0.15);">
  <p style="color:oklch(96% 0.005 270 / 0.6);font-size:14px;">GlassPanel surface</p>
</div>`;
    case 'GlassCard':
      return `<div style="background:oklch(100% 0.01 270 / 0.04);backdrop-filter:blur(12px);border:1px solid oklch(100% 0.01 270 / 0.08);border-radius:24px;padding:16px;box-shadow:0 4px 16px oklch(0 0 0 / 0.15);">
  <p style="color:oklch(96% 0.005 270 / 0.6);font-size:14px;">GlassCard surface</p>
</div>`;
    case 'GlassStrong':
      return `<div style="background:oklch(100% 0.01 270 / 0.08);backdrop-filter:blur(24px);border:1px solid oklch(NaN NaN NaN);border-radius:24px;padding:24px;box-shadow:0 8px 32px oklch(NaN NaN NaN);">
  <p style="color:oklch(NaN NaN NaN);font-size:14px;">GlassStrong surface</p>
</div>`;
    case 'GlassSubtle':
      return `<div style="background:oklch(NaN NaN NaN);backdrop-filter:blur(12px);border:1px solid oklch(100% 0.01 270 / 0.06);border-radius:24px;padding:16px;box-shadow:0 2px 8px oklch(NaN NaN NaN);">
  <p style="color:oklch(NaN NaN NaN);font-size:14px;">GlassSubtle surface</p>
</div>`;
    case 'Button':
      return `<div style="display:flex;gap:12px;flex-wrap:wrap;">
  <button style="padding:8px 20px;border-radius:8px;background:oklch(0.870 0.148 203);color:oklch(0.147 0.011 285);border:none;font-weight:600;cursor:pointer;">Primary</button>
  <button style="padding:8px 20px;border-radius:8px;background:oklch(100% 0.01 270 / 0.08);color:oklch(0.971 0.003 286);border:1px solid oklch(NaN NaN NaN);cursor:pointer;">Secondary</button>
  <button style="padding:8px 20px;border-radius:8px;background:transparent;color:oklch(96% 0.005 270 / 0.6);border:none;cursor:pointer;">Ghost</button>
</div>`;
    case 'SpoonMeter':
      return `<div style="display:flex;align-items:center;gap:8px;">
  <span style="width:10px;height:10px;border-radius:50%;background:oklch(0.870 0.148 203);box-shadow:0 0 6px oklch(NaN NaN NaN);"></span>
  <span style="width:10px;height:10px;border-radius:50%;background:oklch(0.870 0.148 203);box-shadow:0 0 6px oklch(NaN NaN NaN);"></span>
  <span style="width:10px;height:10px;border-radius:50%;background:oklch(0.870 0.148 203);box-shadow:0 0 6px oklch(NaN NaN NaN);"></span>
  <span style="width:10px;height:10px;border-radius:50%;background:oklch(NaN NaN NaN);"></span>
  <span style="width:10px;height:10px;border-radius:50%;background:oklch(NaN NaN NaN);"></span>
</div>`;
    case 'TetraGrid':
      return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;opacity:0.6;">
  <div style="background:oklch(NaN NaN NaN);border-radius:8px;height:60px;"></div>
  <div style="background:oklch(NaN NaN NaN);border-radius:8px;height:60px;"></div>
  <div style="background:oklch(NaN NaN NaN);border-radius:8px;height:60px;"></div>
  <div style="background:oklch(NaN NaN NaN);border-radius:8px;height:60px;"></div>
</div>`;
    case 'HonestLabel':
      return `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:4px;font-size:12px;font-family:monospace;background:oklch(100% 0.01 270 / 0.05);border:1px solid oklch(NaN NaN NaN);color:oklch(NaN NaN NaN);">
  ⚠️ HonestLabel
</span>`;
    case 'StatusBadge':
      return `<div style="display:flex;gap:8px;flex-wrap:wrap;">
  <span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:oklch(NaN NaN NaN);color:oklch(0.773 0.153 163);border:1px solid oklch(NaN NaN NaN);">Live</span>
  <span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:oklch(NaN NaN NaN);color:oklch(0.837 0.164 84);border:1px solid oklch(NaN NaN NaN);">Beta</span>
  <span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:oklch(NaN NaN NaN);color:oklch(0.709 0.159 294);border:1px solid oklch(NaN NaN NaN);">Research</span>
</div>`;
    case 'CrisisOverlay':
      return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:40px;background:oklch(NaN NaN NaN);border-radius:16px;min-height:200px;">
  <p style="font-size:20px;font-weight:300;color:oklch(0.971 0.003 286);text-align:center;">Rest. Breathe. The mesh holds.</p>
  <button style="padding:10px 24px;border-radius:8px;background:oklch(0.870 0.148 203);color:oklch(0.147 0.011 285);font-weight:600;border:none;cursor:pointer;">I'm Ready</button>
</div>`;
    case 'Starfield':
      return `<div style="position:relative;height:120px;background:radial-gradient(ellipse at center, oklch(NaN NaN NaN) 0%, transparent 70%);border-radius:12px;overflow:hidden;">
  <p style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:oklch(NaN NaN NaN);font-size:12px;">Animated canvas</p>
</div>`;
    case 'ThemeToggle':
      return `<button style="padding:8px;border-radius:9999px;background:oklch(100% 0.01 270 / 0.05);border:1px solid oklch(NaN NaN NaN);cursor:pointer;font-size:18px;" aria-label="Toggle theme">🌙</button>`;
    case 'SectionStrip':
      return `<nav style="display:flex;gap:6px;padding:8px;background:oklch(100% 0.01 270 / 0.04);border:1px solid oklch(100% 0.01 270 / 0.08);border-radius:999px;">
  <button style="padding:8px 16px;border-radius:999px;border:none;background:oklch(0.870 0.148 203);color:oklch(0.147 0.011 285);font-weight:600;cursor:pointer;">System</button>
  <button style="padding:8px 16px;border-radius:999px;border:none;background:transparent;color:oklch(96% 0.005 270 / 0.6);cursor:pointer;">Foundations</button>
  <button style="padding:8px 16px;border-radius:999px;border:none;background:transparent;color:oklch(96% 0.005 270 / 0.6);cursor:pointer;">Components</button>
</nav>`;
    case 'CommandPalette':
      return `<div style="position:relative;width:100%;max-width:480px;">
  <div style="background:oklch(NaN NaN NaN);border:1px solid oklch(NaN NaN NaN);border-radius:16px;box-shadow:0 24px 64px oklch(NaN NaN NaN);overflow:hidden;">
    <div style="display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid oklch(100% 0.01 270 / 0.08);">
      <input style="flex:1;background:transparent;border:none;outline:none;color:oklch(0.971 0.003 286);font-size:14px;" placeholder="Search…" aria-label="Search" />
      <kbd style="font-size:11px;color:oklch(NaN NaN NaN);border:1px solid oklch(NaN NaN NaN);border-radius:4px;padding:2px 6px;">esc</kbd>
    </div>
    <div style="padding:8px;">
      <button style="display:flex;width:100%;gap:10px;align-items:center;padding:10px 12px;border-radius:8px;border:none;background:oklch(NaN NaN NaN);color:oklch(0.971 0.003 286);font-size:14px;cursor:pointer;">System</button>
      <button style="display:flex;width:100%;gap:10px;align-items:center;padding:10px 12px;border-radius:8px;border:none;background:transparent;color:oklch(NaN NaN NaN);font-size:14px;cursor:pointer;">Foundations</button>
    </div>
  </div>
</div>`;
    case 'Chameleon':
      return `<div style="display:flex;align-items:center;gap:10px;">
  <button style="width:38px;height:38px;border-radius:9999px;background:oklch(100% 0.01 270 / 0.05);border:1px solid oklch(NaN NaN NaN);cursor:pointer;display:flex;align-items:center;justify-content:center;color:oklch(0.971 0.003 286);" aria-label="Adaptive theme controls">◐</button>
  <button style="width:38px;height:38px;border-radius:9999px;background:oklch(100% 0.01 270 / 0.05);border:1px solid oklch(NaN NaN NaN);cursor:pointer;display:flex;align-items:center;justify-content:center;color:oklch(0.870 0.148 203);" aria-label="Adaptive theme controls">◈</button>
</div>`;
    case 'PageHeader':
      return `<header style="padding:48px 0 24px 0;text-align:center;">
  <span style="font-size:12px;font-family:monospace;letter-spacing:0.08em;color:oklch(NaN NaN NaN);text-transform:uppercase;">System</span>
  <h1 style="font-size:32px;font-weight:600;margin:8px 0;background:linear-gradient(120deg,oklch(0.870 0.148 203),oklch(0.709 0.159 294));-webkit-background-clip:text;background-clip:text;color:transparent;">Design System</h1>
  <p style="font-size:16px;color:oklch(96% 0.005 270 / 0.6);margin:0;">Live primitives from design-core</p>
</header>`;
    default:
      return `<div style="padding:16px;background:oklch(100% 0.01 270 / 0.04);border-radius:8px;color:oklch(NaN NaN NaN);font-size:14px;">
  Component preview
</div>`;
  }
}

function buildPreviewHtml(name: string, def: ComponentDef): string {
  const escapedName = escapeHtml(name);
  const escapedDesc = escapeHtml(def.description || '');
  const escapedUse = escapeHtml(def.aiGuidance?.useWhen || '');
  const escapedAvoid = escapeHtml(def.aiGuidance?.avoidWhen || '');
  const escapedExamples = escapeHtml((def.aiGuidance?.examples || []).join(', '));
  const cssClass = def.css_class || name.toLowerCase();
  const escapedClass = escapeHtml(cssClass);
  const preview = componentPreview(name, def);

  const aiSection = `    <div class="preview-section">
      <p class="preview-label">AI Guidance</p>
      <div style="padding:16px;background:oklch(NaN NaN NaN);border-radius:8px;font-size:13px;color:oklch(96% 0.005 270 / 0.6);">
        <p style="margin:0 0 8px 0;"><strong style="color:oklch(NaN NaN NaN);">Use when:</strong> ${escapedUse || 'Not specified'}</p>
        <p style="margin:0 0 8px 0;"><strong style="color:oklch(NaN NaN NaN);">Avoid when:</strong> ${escapedAvoid || 'Not specified'}</p>
        <p style="margin:0;"><strong style="color:oklch(NaN NaN NaN);">Examples:</strong> ${escapedExamples || 'None'}</p>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedName} — P31 Design System</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      margin: 0;
      padding: 40px 24px;
      background: oklch(0.147 0.011 285);
      color: oklch(0.971 0.003 286);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 32px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: oklch(0.870 0.148 203);
    }
    .description {
      font-size: 16px;
      color: oklch(96% 0.005 270 / 0.6);
      margin: 0 0 32px 0;
    }
    .preview-section {
      background: oklch(NaN NaN NaN);
      border: 1px solid oklch(100% 0.01 270 / 0.08);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
    }
    .preview-label {
      font-size: 11px;
      font-weight: 600;
      color: oklch(NaN NaN NaN);
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .preview {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
    }
    .copy-btn {
      margin-top: 16px;
      padding: 8px 16px;
      border-radius: 8px;
      background: oklch(100% 0.01 270 / 0.06);
      border: 1px solid oklch(NaN NaN NaN);
      color: oklch(NaN NaN NaN);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .copy-btn:hover {
      background: oklch(NaN NaN NaN);
      border-color: oklch(NaN NaN NaN);
    }
    .meta {
      font-size: 12px;
      color: oklch(NaN NaN NaN);
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapedName}</h1>
    <p class="description">${escapedDesc}</p>

    <div class="preview-section">
      <p class="preview-label">Preview</p>
      <div class="preview">
        ${preview}
      </div>
    </div>

    <div class="preview-section">
      <p class="preview-label">CSS Class</p>
      <code style="display:block;padding:12px;background:oklch(100% 0.01 270 / 0.04);border-radius:8px;font-size:13px;color:oklch(0.709 0.159 294);">${escapedClass || name.toLowerCase()}</code>
      <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapedClass || name.toLowerCase()}').then(()=>this.textContent='Copied!',()=>this.textContent='Copy')">Copy class</button>
    </div>

    ${aiSection}

    <p class="meta">Generated from components.yml · P31 Design System</p>
  </div>
</body>
</html>`;
}

export function generateHtml(options: GeneratorOptions = {}): GeneratedFile[] {
  const componentsPath = options.componentsPath || COMPONENTS_YAML;
  const tokensPath = options.tokensPath || TOKENS_YAML;
  const components = loadComponents(componentsPath);
  const tokens = loadTokens(tokensPath);
  const generated: GeneratedFile[] = [];
  const names = Object.keys(components.components || components);

  for (const name of names) {
    if (options.component && options.component !== name) continue;
    const def = components.components?.[name] || (components as any)[name];
    if (!def) continue;

    const html = buildPreviewHtml(name, def as ComponentDef);
    const filePath = `${options.outputDir || OUTPUT_DIR}/${name}.html`;
    generated.push({ name, path: filePath, code: html });
  }

  return generated;
}

export function writeHtml(options: GeneratorOptions = {}): void {
  const tokens = loadTokens(options.tokensPath);
  const components = loadComponents(options.componentsPath);
  const generated: GeneratedFile[] = [];
  const names = Object.keys(components.components || components);
  ensureDir(options.outputDir || OUTPUT_DIR);

  for (const name of names) {
    if (options.component && options.component !== name) continue;
    const def = components.components?.[name] || (components as any)[name];
    if (!def) continue;

    const html = buildPreviewHtml(name, def as ComponentDef);
    const filePath = `${options.outputDir || OUTPUT_DIR}/${name}.html`;
    writeFileSync(filePath, html, 'utf-8');
    generated.push({ name, path: filePath, code: html });
    console.log(`  Generated: ${filePath}`);
  }

  console.log(`\n✅ Generated ${generated.length} static HTML snippets for ${options.component || 'all components'}`);
}

// Legacy re-exports for backward compatibility
export { escapeHtml as escapeHtml, cssVarName as cssVarName, componentPreview as componentPreview };
