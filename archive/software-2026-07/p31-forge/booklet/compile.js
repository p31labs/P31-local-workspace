#!/usr/bin/env node
/**
 * P31 Booklet Compiler — Markdown → HTML → PDF-ready
 *
 * Usage:
 *   node booklet/compile.js                    # defaults to booklet/booklet.md
 *   node booklet/compile.js --input path.md    # custom input
 *   node booklet/compile.js --output name.html # custom output
 *   node booklet/compile.js --pdf              # also generate PDF-friendly HTML
 *   node booklet/compile.js --docx             # also generate .docx via forge.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const MD_PATH = path.join(ROOT, 'booklet.md');
const OUT_DIR = path.join(ROOT, 'out');
const ASSETS_DIR = path.join(ROOT, 'assets');
const QR_DIR = path.join(ROOT, 'qrcodes');

// ── Args ──
const args = process.argv.slice(2);
const inputFile = args.includes('--input')
  ? args[args.indexOf('--input') + 1]
  : MD_PATH;
const outputBase = args.includes('--output')
  ? args[args.indexOf('--output') + 1].replace(/\.\w+$/, '')
  : 'P31_Explorer_Booklet';

// ── Simple Markdown → HTML converter ──
function mdToHtml(md) {
  let html = '';
  const lines = md.split('\n');
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listOpen = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip horizontal rules
    if (/^---+$/.test(trimmed)) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += '<hr />\n';
      continue;
    }

    // Headings
    if (trimmed.startsWith('###### ')) { if (inList) { html += '</ul>\n'; inList = false; } html += `<h6>${trimmed.slice(7)}</h6>\n`; continue; }
    if (trimmed.startsWith('##### ')) { if (inList) { html += '</ul>\n'; inList = false; } html += `<h5>${trimmed.slice(6)}</h5>\n`; continue; }
    if (trimmed.startsWith('#### ')) { if (inList) { html += '</ul>\n'; inList = false; } html += `<h4>${trimmed.slice(5)}</h4>\n`; continue; }
    if (trimmed.startsWith('### ')) { if (inList) { html += '</ul>\n'; inList = false; } html += `<h3>${trimmed.slice(4)}</h3>\n`; continue; }
    if (trimmed.startsWith('## ')) { if (inList) { html += '</ul>\n'; inList = false; } html += `<h2>${trimmed.slice(3)}</h2>\n`; continue; }
    if (trimmed.startsWith('# ')) { if (inList) { html += '</ul>\n'; inList = false; } html += `<h1>${trimmed.slice(2)}</h1>\n`; continue; }

    // Table
    if (trimmed.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Skip separator rows (|------|------|)
      if (/^\|[\s\-:]+\|/.test(trimmed)) continue;
      const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      inTable = false;
      html += '<table>\n';
      tableRows.forEach((row, ri) => {
        const tag = ri === 0 ? 'th' : 'td';
        html += `  <tr>${row.map(c => `<${tag}>${escapeHtml(c)}</${tag}>`).join('')}</tr>\n`;
      });
      html += '</table>\n';
      tableRows = [];
    }

    // Images
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.+?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const src = imgMatch[2];
      const isQR = src.includes('qrcodes/');
      html += `<div class="img-container ${isQR ? 'qr' : ''}">\n`;
      html += `  <img src="${src}" alt="${alt}" />\n`;
      html += `</div>\n`;
      continue;
    }

    // Unordered list
    if (trimmed.startsWith('- ')) {
      if (!inList) { html += '<ul>\n'; inList = true; }
      html += `  <li>${trimmed.slice(2)}</li>\n`;
      continue;
    } else if (inList) {
      html += '</ul>\n';
      inList = false;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      html += `<blockquote>${trimmed.slice(2)}</blockquote>\n`;
      continue;
    }

    // Empty line = paragraph break
    if (trimmed === '') {
      continue;
    }

    // Regular paragraph
    html += `<p>${inlineMd(trimmed)}</p>\n`;
  }

  if (inList) html += '</ul>\n';
  if (inTable) {
    html += '<table>\n';
    tableRows.forEach((row, ri) => {
      const tag = ri === 0 ? 'th' : 'td';
      html += `  <tr>${row.map(c => `<${tag}>${escapeHtml(c)}</${tag}>`).join('')}</tr>\n`;
    });
    html += '</table>\n';
  }

  return html;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

// ── Build HTML document ──
function buildHtml(contentHtml, title) {
  // Resolve relative paths to absolute for file:// protocol
  const base = path.resolve(ROOT);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');

  @page { margin: 0.5in; size: letter landscape; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Atkinson Hyperlegible', 'Open Sans', sans-serif;
    font-size: 14pt;
    line-height: 1.7;
    color: #1a1a2e;
    max-width: 9in;
    margin: 0 auto;
    padding: 0.5in;
    background: #fff;
  }

  h1 {
    font-size: 32pt;
    color: #e8614b;
    text-align: center;
    margin: 1.5em 0 0.5em;
    page-break-before: avoid;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  h2 {
    font-size: 22pt;
    color: #2a9d8f;
    margin: 1.2em 0 0.5em;
    border-bottom: 3px solid #f0f0f0;
    padding-bottom: 0.2em;
    page-break-before: avoid;
  }

  h3 {
    font-size: 16pt;
    color: #e8614b;
    margin: 1em 0 0.3em;
    text-transform: uppercase;
  }

  h4, h5, h6 { color: #1a1a2e; margin: 0.8em 0 0.3em; }

  p { margin: 0.8em 0; orphans: 3; widows: 3; }

  .img-container {
    text-align: center;
    margin: 1.5em 0;
    page-break-inside: avoid;
  }
  .img-container img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
  .img-container.qr img {
    width: 150px;
    border: 2px solid #1a1a2e;
    border-radius: 12px;
    padding: 10px;
  }

  blockquote {
    border-left: 5px solid #2a9d8f;
    padding: 0.5em 1em;
    margin: 1em 0;
    background: #f4fbfb;
    font-size: 11pt;
    color: #333;
    border-radius: 0 8px 8px 0;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 10px;
    margin: 1em 0;
    font-size: 12pt;
  }

  th, td {
    border: 2px solid #1a1a2e;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    background: #fdfdfd;
    font-weight: bold;
  }

  ul { margin: 0.5em 0 0.5em 1.5em; }
  li { margin: 0.3em 0; }

  hr {
    border: none;
    border-top: 2px solid #e8614b;
    margin: 1.5em 0;
    page-break-after: always;
  }

  code {
    font-family: 'Courier New', monospace;
    background: #f0f0f0;
    padding: 1px 4px;
    font-size: 11pt;
  }

  a { color: #e8614b; text-decoration: underline; }

  @media print {
    body { padding: 0; max-width: 100%; }
    hr { page-break-after: always; }
    .img-container { page-break-inside: avoid; }
    h1, h2, h3 { page-break-after: avoid; }
    a { text-decoration: none; color: #1a1a2e; }
    table { page-break-inside: avoid; }
  }

  .cover {
    text-align: center;
    padding-top: 2in;
  }
  .cover h1 { font-size: 36pt; margin-bottom: 0.2em; }
  .cover .subtitle { font-size: 16pt; color: #666; margin-bottom: 1em; }
  .page-break { page-break-after: always; }

  .footer {
    text-align: center;
    font-size: 9pt;
    color: #999;
    margin-top: 2em;
    border-top: 1px solid #ddd;
    padding-top: 1em;
  }

  .science-fact {
    background: #f0f8ff;
    border: 1px solid #b0d4f1;
    border-radius: 8px;
    padding: 0.6em 1em;
    margin: 0.8em 0;
    font-size: 10pt;
  }
</style>
</head>
<body>
${contentHtml}
<div class="footer">
  <p><em>The Shapes That Build Us</em> &mdash; A P31 Labs Explorer's Guide &mdash; CC BY-SA 4.0</p>
  <p>p31ca.org &bull; github.com/p31labs &bull; ko-fi.com/trimtab69420</p>
</div>
</body>
</html>`;
}

// ── Main ──
function main() {
  if (!fs.existsSync(inputFile)) {
    console.error(`Input not found: ${inputFile}`);
    process.exit(1);
  }

  const md = fs.readFileSync(inputFile, 'utf8');
  const contentHtml = mdToHtml(md);
  const title = 'The Shapes That Build Us';
  const fullHtml = buildHtml(contentHtml, title);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const htmlPath = path.join(OUT_DIR, `${outputBase}.html`);
  fs.writeFileSync(htmlPath, fullHtml, 'utf8');
  console.log(`✅ ${htmlPath} (${Buffer.byteLength(fullHtml, 'utf8')} bytes)`);

  // Also generate a plain Markdown copy for editing
  const mdOut = path.join(OUT_DIR, `${outputBase}.md`);
  fs.writeFileSync(mdOut, md, 'utf8');
  console.log(`✅ ${mdOut}`);

  console.log(`\nOpen ${htmlPath} in a browser, then File > Print > Save as PDF`);
  console.log('Or open the .md file in any Markdown editor to edit.');
}

main();
