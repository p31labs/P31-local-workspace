#!/usr/bin/env node
// PQC Security Audit — stub: scans for post-quantum crypto usage
// Usage: node scripts/pqc-audit.js <scan-path> [output-file]
const fs = require('fs');
const path = require('path');

const scanPath = process.argv[2] || '.';
const outputFile = process.argv[3] || 'pqc-audit-results.json';

function scanDir(dir) {
  const findings = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        findings.push(...scanDir(fullPath));
      } else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('@noble/post-quantum') || content.includes('pqc') || content.includes('post-quantum')) {
          findings.push({
            file: fullPath,
            severity: 'INFO',
            message: 'References PQC-related code',
          });
        }
      }
    }
  } catch {}
  return findings;
}

const findings = scanDir(scanPath);
const result = { scanPath, timestamp: new Date().toISOString(), findings };
fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
console.log(`PQC audit: ${findings.length} findings written to ${outputFile}`);
