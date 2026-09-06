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
      return `<div style="background:rgba(255,255,255,0.04);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.15);">
  <p style="color:rgba(245,245,247,0.6);font-size:14px;">GlassPanel surface</p>
</div>`;
    case 'GlassCard':
      return `<div style="background:rgba(255,255,255,0.04);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:16px;box-shadow:0 4px 16px rgba(0,0,0,0.15);">
  <p style="color:rgba(245,245,247,0.6);font-size:14px;">GlassCard surface</p>
</div>`;
    case 'GlassStrong':
      return `<div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.25);">
  <p style="color:rgba(245,245,247,0.8);font-size:14px;">GlassStrong surface</p>
</div>`;
    case 'GlassSubtle':
      return `<div style="background:rgba(255,255,255,0.03);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  <p style="color:rgba(245,245,247,0.5);font-size:14px;">GlassSubtle surface</p>
</div>`;
    case 'Button':
      return `<div style="display:flex;gap:12px;flex-wrap:wrap;">
  <button style="padding:8px 20px;border-radius:8px;background:#00F0FF;color:#0A0A0F;border:none;font-weight:600;cursor:pointer;">Primary</button>
  <button style="padding:8px 20px;border-radius:8px;background:rgba(255,255,255,0.08);color:#F5F5F7;border:1px solid rgba(255,255,255,0.15);cursor:pointer;">Secondary</button>
  <button style="padding:8px 20px;border-radius:8px;background:transparent;color:rgba(245,245,247,0.6);border:none;cursor:pointer;">Ghost</button>
</div>`;
    case 'SpoonMeter':
      return `<div style="display:flex;align-items:center;gap:8px;">
  <span style="width:10px;height:10px;border-radius:50%;background:#00F0FF;box-shadow:0 0 6px rgba(0,240,255,0.5);"></span>
  <span style="width:10px;height:10px;border-radius:50%;background:#00F0FF;box-shadow:0 0 6px rgba(0,240,255,0.5);"></span>
  <span style="width:10px;height:10px;border-radius:50%;background:#00F0FF;box-shadow:0 0 6px rgba(0,240,255,0.5);"></span>
  <span style="width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.1);"></span>
  <span style="width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.1);"></span>
</div>`;
    case 'TetraGrid':
      return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;opacity:0.6;">
  <div style="background:rgba(255,255,255,0.03);border-radius:8px;height:60px;"></div>
  <div style="background:rgba(255,255,255,0.03);border-radius:8px;height:60px;"></div>
  <div style="background:rgba(255,255,255,0.03);border-radius:8px;height:60px;"></div>
  <div style="background:rgba(255,255,255,0.03);border-radius:8px;height:60px;"></div>
</div>`;
    case 'HonestLabel':
      return `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:4px;font-size:12px;font-family:monospace;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(245,245,247,0.5);">
  ⚠️ HonestLabel
</span>`;
    case 'StatusBadge':
      return `<div style="display:flex;gap:8px;flex-wrap:wrap;">
  <span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:rgba(52,211,153,0.2);color:#34D399;border:1px solid rgba(52,211,153,0.3);">Live</span>
  <span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:rgba(251,191,36,0.2);color:#FBBF24;border:1px solid rgba(251,191,36,0.3);">Beta</span>
  <span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:rgba(167,139,250,0.2);color:#A78BFA;border:1px solid rgba(167,139,250,0.3);">Research</span>
</div>`;
    case 'CrisisOverlay':
      return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:40px;background:rgba(10,10,15,0.95);border-radius:16px;min-height:200px;">
  <p style="font-size:20px;font-weight:300;color:#F5F5F7;text-align:center;">Rest. Breathe. The mesh holds.</p>
  <button style="padding:10px 24px;border-radius:8px;background:#00F0FF;color:#0A0A0F;font-weight:600;border:none;cursor:pointer;">I'm Ready</button>
</div>`;
    case 'Starfield':
      return `<div style="position:relative;height:120px;background:radial-gradient(ellipse at center, rgba(0,240,255,0.05) 0%, transparent 70%);border-radius:12px;overflow:hidden;">
  <p style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(245,245,247,0.3);font-size:12px;">Animated canvas</p>
</div>`;
    case 'ThemeToggle':
      return `<button style="padding:8px;border-radius:9999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);cursor:pointer;font-size:18px;" aria-label="Toggle theme">🌙</button>`;
    default:
      return `<div style="padding:16px;background:rgba(255,255,255,0.04);border-radius:8px;color:rgba(245,245,247,0.5);font-size:14px;">
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
      <div style="padding:16px;background:rgba(255,255,255,0.02);border-radius:8px;font-size:13px;color:rgba(245,245,247,0.6);">
        <p style="margin:0 0 8px 0;"><strong style="color:rgba(245,245,247,0.8);">Use when:</strong> ${escapedUse || 'Not specified'}</p>
        <p style="margin:0 0 8px 0;"><strong style="color:rgba(245,245,247,0.8);">Avoid when:</strong> ${escapedAvoid || 'Not specified'}</p>
        <p style="margin:0;"><strong style="color:rgba(245,245,247,0.8);">Examples:</strong> ${escapedExamples || 'None'}</p>
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
      background: #0A0A0F;
      color: #F5F5F7;
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
      color: #00F0FF;
    }
    .description {
      font-size: 16px;
      color: rgba(245,245,247,0.6);
      margin: 0 0 32px 0;
    }
    .preview-section {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
    }
    .preview-label {
      font-size: 11px;
      font-weight: 600;
      color: rgba(245,245,247,0.4);
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
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(245,245,247,0.8);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .copy-btn:hover {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.2);
    }
    .meta {
      font-size: 12px;
      color: rgba(245,245,247,0.4);
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
      <code style="display:block;padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;font-size:13px;color:#A78BFA;">${escapedClass || name.toLowerCase()}</code>
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
