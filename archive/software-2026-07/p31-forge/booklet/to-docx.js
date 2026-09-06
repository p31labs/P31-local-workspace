#!/usr/bin/env node
/**
 * booklet-to-docx.js — Convert booklet Markdown to .docx
 * Uses the same docx library as forge.js
 */

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
        AlignmentType, HeadingLevel, BorderStyle, PageBreak } = require('docx');

const ROOT = path.resolve(__dirname);
const MD_PATH = path.join(ROOT, 'out', 'P31_Explorer_Booklet.md');

if (!fs.existsSync(MD_PATH)) {
  console.error(`Markdown not found at ${MD_PATH}. Run 'node forge.js booklet' first.`);
  process.exit(1);
}

const md = fs.readFileSync(MD_PATH, 'utf8');
const lines = md.split('\n');

const children = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (!line) continue;

  // Headings
  if (line.startsWith('# ')) {
    children.push(new Paragraph({
      text: line.slice(2),
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }));
    continue;
  }
  if (line.startsWith('## ')) {
    children.push(new Paragraph({
      text: line.slice(3),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 150 },
    }));
    continue;
  }
  if (line.startsWith('### ')) {
    children.push(new Paragraph({
      text: line.slice(4),
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 },
    }));
    continue;
  }
  if (line.startsWith('#### ')) {
    children.push(new Paragraph({
      text: line.slice(5),
      heading: HeadingLevel.HEADING_4,
      spacing: { before: 150, after: 80 },
    }));
    continue;
  }

  // Images (placeholder — docx ImageRun needs the actual bytes)
  const imgMatch = line.match(/^!\[(.*?)\]\((.+?)\)$/);
  if (imgMatch) {
    const src = path.resolve(ROOT, imgMatch[2]);
    const alt = imgMatch[1];
    try {
      if (fs.existsSync(src) && src.match(/\.(png|jpg|jpeg)$/i)) {
        const imgBytes = fs.readFileSync(src);
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [new ImageRun({
            data: imgBytes,
            transformation: { width: 200, height: 200 },
            type: src.endsWith('.png') ? 'png' : 'jpeg',
          })],
        }));
      } else {
        // SVG or missing — text placeholder
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [new TextRun({
            text: `[Illustration: ${alt}]`,
            italics: true,
            color: '999999',
          })],
        }));
      }
    } catch {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `[Image: ${alt}]`, italics: true, color: '999999' })],
      }));
    }
    continue;
  }

  // Horizontal rule = page break
  if (/^---+$/.test(line)) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: '', break: 1 })], spacing: { before: 200, after: 200 } }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: 'e8614b', space: 1 } },
        spacing: { after: 200 },
      })
    );
    continue;
  }

  // Blockquotes
  if (line.startsWith('> ')) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: line.slice(2),
        italics: true,
        color: '555555',
      })],
      indent: { left: 400 },
      spacing: { before: 80, after: 80 },
    }));
    continue;
  }

  // Regular paragraph — process inline formatting
  const processedText = line
    .replace(/\*\*(.+?)\*\*/g, '\x00B$1\x00B')
    .replace(/\*(.+?)\*/g, '\x00I$1\x00I')
    .replace(/`(.+?)`/g, '\x00C$1\x00C');

  const runs = [];
  let current = '';
  let inBold = false, inItalic = false, inCode = false;

  for (let j = 0; j < processedText.length; j++) {
    const ch = processedText[j];
    const nextCh = processedText[j + 1] || '';

    if (ch === '\x00' && nextCh === 'B') { inBold = true; j++; continue; }
    if (ch === '\x00' && nextCh === 'I') { inItalic = true; j++; continue; }
    if (ch === '\x00' && nextCh === 'C') { inCode = true; j++; continue; }
    if (ch === '\x00') {
      if (current) {
        runs.push(new TextRun({
          text: current,
          bold: inBold,
          italics: inItalic || inCode,
          font: inCode ? 'Courier New' : 'Georgia',
          size: inCode ? 20 : 24,
        }));
        current = '';
      }
      inBold = false; inItalic = false; inCode = false;
      continue;
    }
    current += ch;
  }
  if (current) {
    runs.push(new TextRun({
      text: current,
      bold: inBold,
      italics: inItalic || inCode,
      font: inCode ? 'Courier New' : 'Georgia',
      size: inCode ? 20 : 24,
    }));
  }

  if (runs.length > 0) {
    children.push(new Paragraph({ children: runs, spacing: { before: 60, after: 60 } }));
  }
}

// Build document
const doc = new Document({
  title: 'The Shapes That Build Us',
  description: 'A P31 Labs Explorer\'s Guide',
  sections: [{
    properties: {
      page: {
        margin: { top: 720, bottom: 720, left: 720, right: 720 },
      },
    },
    children,
  }],
});

// Write
const OUT_DIR = path.join(ROOT, 'out');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, 'P31_Explorer_Booklet.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ ${outPath} (${buffer.length} bytes)`);
}).catch(err => {
  console.error(`Error: ${err.message}`);
});
