#!/usr/bin/env node
/**
 * P31 Post-Quantum Cryptography Audit — EXEC-05 / Gap J
 *
 * Audits all cryptographic operations in the P31 stack and generates
 * a migration roadmap with concrete timelines.
 *
 * Usage: node scripts/pqc-audit.mjs [--path andromeda/04_SOFTWARE]
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { argv } from 'process';

const ROOT = argv[3] ?? join(import.meta.dirname ?? '.', '..', '04_SOFTWARE');
const NOW = new Date().toISOString();

// ── Crypto patterns to detect ─────────────────────────────────────────────

const PATTERNS = [
  // Classical key exchange (vulnerable to Harvest Now Decrypt Later)
  { regex: /\bRSA\b/g, label: 'RSA', risk: 'CRITICAL', replacement: 'ML-KEM-768 (CRYSTALS-Kyber)', nistStandard: 'FIPS 203' },
  { regex: /\bECDH\b|\bP-256\b|\bP-384\b/g, label: 'ECDH/NIST-curves', risk: 'HIGH', replacement: 'ML-KEM-768 (hybrid with X25519)', nistStandard: 'FIPS 203' },
  { regex: /\bX25519\b/g, label: 'X25519', risk: 'MEDIUM', replacement: 'Hybrid: X25519 + ML-KEM-768', nistStandard: 'FIPS 203 (hybrid)' },
  { regex: /\bDH\b|\bDiffie.Hellman\b/i, label: 'DH', risk: 'CRITICAL', replacement: 'ML-KEM-768', nistStandard: 'FIPS 203' },

  // Signatures (vulnerable to quantum Shor's algorithm)
  { regex: /\bECDSA\b/g, label: 'ECDSA', risk: 'HIGH', replacement: 'ML-DSA-65 (CRYSTALS-Dilithium)', nistStandard: 'FIPS 204' },
  { regex: /\bEd25519\b/g, label: 'Ed25519', risk: 'MEDIUM', replacement: 'Hybrid: Ed25519 + ML-DSA-65', nistStandard: 'FIPS 204 (hybrid)' },
  { regex: /\bsecp256k1\b|\bETH\b.*sign|\bBTC\b.*sign/i, label: 'secp256k1', risk: 'HIGH', replacement: 'ML-DSA-87', nistStandard: 'FIPS 204' },

  // Symmetric (generally quantum-safe at 256-bit; 128-bit halved by Grover)
  { regex: /\bAES-128\b|\bAES128\b/g, label: 'AES-128', risk: 'LOW', replacement: 'AES-256 (double key length)', nistStandard: 'FIPS 197 (256-bit)' },
  { regex: /\bAES-256\b|\bAES256\b/g, label: 'AES-256', risk: 'SAFE', replacement: null, nistStandard: 'FIPS 197' },
  { regex: /\bChaCha20\b/g, label: 'ChaCha20', risk: 'SAFE', replacement: null, nistStandard: null },

  // Hash functions (SHA-256 safe, MD5/SHA1 not)
  { regex: /\bSHA-256\b|\bsha256\b/gi, label: 'SHA-256', risk: 'SAFE', replacement: null, nistStandard: 'FIPS 180-4' },
  { regex: /\bSHA-512\b|\bsha512\b/gi, label: 'SHA-512', risk: 'SAFE', replacement: null, nistStandard: 'FIPS 180-4' },
  { regex: /\bMD5\b/g, label: 'MD5', risk: 'CRITICAL', replacement: 'SHA-256 (not quantum — just broken classically)', nistStandard: null },
  { regex: /\bSHA1\b|\bSHA-1\b/g, label: 'SHA-1', risk: 'CRITICAL', replacement: 'SHA-256', nistStandard: 'FIPS 180-4' },

  // HMAC (safe if underlying hash is safe)
  { regex: /\bHMAC.SHA256\b|\bHMAC-SHA-256\b/gi, label: 'HMAC-SHA256', risk: 'SAFE', replacement: null, nistStandard: 'FIPS 198-1' },

  // Symmetric wrapping (P31-specific patterns)
  { regex: /\bFernet\b/g, label: 'Fernet (Python RNS)', risk: 'MEDIUM', replacement: 'AES-256-GCM + ML-KEM encapsulation', nistStandard: 'FIPS 203+197' },
  { regex: /\bgpg\b|\.gpg\b|--symmetric/gi, label: 'GPG symmetric', risk: 'LOW', replacement: 'GPG --cipher-algo AES256 is safe', nistStandard: null },
];

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.py', '.sh', '.yaml', '.toml', '.json']);

// ── File walker ───────────────────────────────────────────────────────────

function walk(dir, files = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return files; }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) walk(full, files);
    else if (EXTENSIONS.has('.' + entry.split('.').pop())) files.push(full);
  }
  return files;
}

// ── Audit ─────────────────────────────────────────────────────────────────

function auditFiles(rootDir) {
  const files = walk(rootDir);
  const findings = [];

  for (const filePath of files) {
    let content;
    try { content = readFileSync(filePath, 'utf8'); } catch { continue; }
    const relPath = relative(rootDir, filePath);

    for (const pattern of PATTERNS) {
      const flags = pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g';
      const matches = [...content.matchAll(new RegExp(pattern.regex.source, flags))];
      if (!matches.length) continue;

      // Find line numbers
      const lines = content.split('\n');
      const lineNums = new Set();
      for (const match of matches) {
        let pos = 0;
        for (let i = 0; i < lines.length; i++) {
          if (pos + lines[i].length >= match.index) { lineNums.add(i + 1); break; }
          pos += lines[i].length + 1;
        }
      }

      findings.push({
        file: relPath,
        algorithm: pattern.label,
        risk: pattern.risk,
        replacement: pattern.replacement,
        nistStandard: pattern.nistStandard,
        occurrences: matches.length,
        lines: [...lineNums].slice(0, 5),
      });
    }
  }

  return findings;
}

// ── Migration roadmap ─────────────────────────────────────────────────────

function buildRoadmap(findings) {
  const criticalCount = findings.filter(f => f.risk === 'CRITICAL').length;
  const highCount = findings.filter(f => f.risk === 'HIGH').length;
  const medCount = findings.filter(f => f.risk === 'MEDIUM').length;

  return {
    summary: { criticalCount, highCount, medCount, totalFindings: findings.length },
    phases: [
      {
        phase: 1,
        name: 'Classical Breakage (immediate)',
        timeline: '2026 Q2',
        actions: [
          'Replace MD5 and SHA-1 with SHA-256 (quantum-independent, classically broken)',
          'Verify all HMAC uses SHA-256 or SHA-512',
          'Upgrade AES-128 to AES-256 where found',
        ],
        effort: 'low',
      },
      {
        phase: 2,
        name: 'Hybrid Key Exchange (transition)',
        timeline: '2026 Q3-Q4',
        actions: [
          'Add @noble/post-quantum to @p31/shared: npm add @noble/post-quantum',
          'Wrap X25519 with ML-KEM-768 in shared/src/crypto/pqc.ts',
          'Update sync Worker to use hybrid KEM for Durable Object auth',
          'Update FHIR Worker HMAC to use hybrid MAC (HMAC-SHA256 + ML-DSA challenge)',
        ],
        effort: 'medium',
      },
      {
        phase: 3,
        name: 'Signature Migration (DID + genesis)',
        timeline: '2027 Q1',
        actions: [
          'Add ML-DSA-65 co-signature to DID document alongside Ed25519',
          'Genesis Block events: add ML-DSA-65 chain signature field',
          'Cognitive Passport: add dual signature (Ed25519 + ML-DSA)',
          'Update did.json to include ML-DSA verification method',
        ],
        effort: 'medium',
      },
      {
        phase: 4,
        name: 'Classical Deprecation',
        timeline: '2030-2032',
        actions: [
          'Remove Ed25519-only paths once ML-DSA is universal',
          'Remove X25519-only paths once ML-KEM is universal',
          'Follow NIST FIPS 203/204/205 deprecation timeline',
        ],
        effort: 'low',
      },
    ],
    immediateActions: [
      {
        action: 'Install @noble/post-quantum',
        command: 'cd 04_SOFTWARE/packages/shared && npm add @noble/post-quantum',
        blocker: false,
      },
      {
        action: 'Generate P31 ML-DSA-65 keypair (DID co-signature)',
        command: 'node -e "const {ml_dsa65} = require(\'@noble/post-quantum/ml-dsa\'); const kp = ml_dsa65.keygen(); console.log(Buffer.from(kp.publicKey).toString(\'hex\'))"',
        blocker: false,
      },
      {
        action: 'Update backup.sh to use AES-256 (already is — verify)',
        command: 'grep cipher-algo matrix/scripts/backup.sh',
        blocker: false,
      },
    ],
  };
}

// ── Report ────────────────────────────────────────────────────────────────

function report(findings, roadmap) {
  const RISK_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, SAFE: 4 };
  const sorted = [...findings].sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);

  const criticalItems = sorted.filter(f => ['CRITICAL', 'HIGH'].includes(f.risk));
  const safeItems = sorted.filter(f => f.risk === 'SAFE');

  console.log('\n╔══ P31 POST-QUANTUM CRYPTOGRAPHY AUDIT ══════════════════════╗');
  console.log(`║  ${NOW}                         ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`Summary: ${roadmap.summary.criticalCount} CRITICAL | ${roadmap.summary.highCount} HIGH | ${roadmap.summary.medCount} MEDIUM\n`);

  if (criticalItems.length) {
    console.log('── CRITICAL / HIGH (replace before quantum threat materializes) ──');
    for (const f of criticalItems) {
      console.log(`  [${f.risk.padEnd(8)}] ${f.algorithm.padEnd(20)} ${f.file}:${f.lines.join(',')}`);
      if (f.replacement) console.log(`             → ${f.replacement} (${f.nistStandard ?? 'no NIST standard'})`);
    }
  }

  console.log('\n── SAFE (quantum-resistant at current key sizes) ──');
  const safeAlgs = [...new Set(safeItems.map(f => f.algorithm))];
  console.log('  ' + safeAlgs.join(', '));

  console.log('\n── MIGRATION ROADMAP ──');
  for (const phase of roadmap.phases) {
    console.log(`\n  Phase ${phase.phase} [${phase.timeline}] — ${phase.name}`);
    for (const action of phase.actions) console.log(`    • ${action}`);
  }

  console.log('\n── IMMEDIATE ACTIONS ──');
  for (const action of roadmap.immediateActions) {
    console.log(`\n  ${action.action}`);
    console.log(`    $ ${action.command}`);
  }

  console.log('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────

const findings = auditFiles(ROOT);
const roadmap = buildRoadmap(findings);

report(findings, roadmap);

const outPath = `pqc-audit-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(outPath, JSON.stringify({ auditedAt: NOW, findings, roadmap }, null, 2));
console.log(`Full audit written to: ${outPath}`);
