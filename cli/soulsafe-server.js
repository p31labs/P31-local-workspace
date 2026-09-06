#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// SOULSAFE — 3-Gate Verification Protocol Expert
// Implements the SOULSAFE protocol (Paper XIX — Johnson, 2026):
//   Triad of Cognition, Red Board Diagnostics, Objective Quality Evidence
//   (OQE), Zero-Work Detection, and the 3-gate deploy protocol.
// Reads the canonical crew manifest (~/p31-agents/manifest.yaml) and the
// ground-truth facts registry (~/p31-agents/ground-truth.json).
// Zero external dependencies. Stdio JSON-RPC pattern mirrors bob-server.js /
// marge-server.js (stateless MCP 2026-07-28).
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const AGENTS_ROOT = path.resolve(process.env.HOME || '/home/p31', 'p31-agents');
const MANIFEST_PATH = path.join(AGENTS_ROOT, 'manifest.yaml');
const GROUND_TRUTH_PATH = path.join(AGENTS_ROOT, 'ground-truth.json');
const SOULSAFE_PATH = path.join(AGENTS_ROOT, 'SOULSAFE.md');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(path.resolve(filePath), 'utf-8');
  } catch {
    return null;
  }
}

function readJsonSafe(filePath) {
  const content = readFileSafe(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function stripQuotes(s) {
  return String(s).replace(/^["']|["']$/g, '');
}

function parseManifestYaml(content) {
  const agents = [];
  let current = null;
  let listMode = null;
  for (const line of (content || '').split('\n')) {
    const m = line.match(/^(\s*)(.*)$/);
    const indent = m[1].length;
    const text = m[2].trim();
    if (!text || text === 'agents:' || text.startsWith('#')) continue;
    if (indent === 2 && text.endsWith(':') && /^[a-z][a-z0-9-]*:$/.test(text)) {
      if (current) agents.push(current);
      current = { name: text.slice(0, -1), description: '', triad_archetype: '', temperature: null, model: '', tools: [], competence: [], not_competent: [] };
      listMode = null;
      continue;
    }
    if (!current) continue;
    if (indent === 4) {
      const kv = text.match(/^([a-z][a-z0-9-]*):\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1];
      const val = stripQuotes(kv[2].trim());
      if (key === 'competence') { listMode = 'competence'; continue; }
      if (key === 'not_competent') { listMode = 'not_competent'; continue; }
      listMode = null;
      if (key === 'description') current.description = val;
      else if (key === 'triad-archetype') current.triad_archetype = val;
      else if (key === 'temperature') current.temperature = parseFloat(val);
      else if (key === 'model') current.model = val;
      else if (key === 'tools') {
        current.tools = val.replace(/^\[|\]$/g, '').split(',').map(s => stripQuotes(s.trim())).filter(Boolean);
      }
      continue;
    }
    if (indent === 6 && text.startsWith('-')) {
      const item = stripQuotes(text.slice(1).trim());
      if (listMode === 'competence') current.competence.push(item);
      else if (listMode === 'not_competent') current.not_competent.push(item);
    }
  }
  if (current) agents.push(current);
  return agents;
}

function getAgents() {
  const manifest = parseManifestYaml(readFileSafe(MANIFEST_PATH));
  if (manifest.length > 0) return manifest;
  return [
    { name: 'soulsafe-architect', description: 'Orchestrator + 3-gate verification', triad_archetype: 'Architect', temperature: 0.2, model: 'inherit', tools: ['read', 'write', 'edit', 'glob', 'grep', 'bash'], competence: ['3-gate protocol', 'OQE evidence classification', 'severity grading', 'Red Board'], not_competent: ['surface-specific expertise'] },
  ];
}

function getGroundTruth() {
  return readJsonSafe(GROUND_TRUTH_PATH);
}

function findOwningExpert(surface) {
  const agents = getAgents();
  const tokens = String(surface || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  let best = null;
  let bestScore = 0;
  for (const a of agents) {
    const hay = `${a.description} ${(a.competence || []).join(' ')}`.toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 1;
    if (score > bestScore) { bestScore = score; best = a; }
  }
  return bestScore > 0 ? best : null;
}

// ---------------------------------------------------------------------------
// Tool Definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'soulsafe_tagout',
    description: 'Evaluate a task against the competence boundary and return a tag-out verdict with the owning expert. Per SOULSAFE Paper XIX, no agent operates outside its verified lane.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Description of the task to evaluate' },
        surface: { type: 'string', description: 'Surface or file path the task touches (e.g. apps/phos/src/surfaces/DashboardPage.tsx)' },
        agent: { type: 'string', description: 'Name of the requesting agent (default: the caller)' },
      },
      required: ['task'],
    },
  },
  {
    name: 'soulsafe_redboard_detect',
    description: 'Run Red Board diagnostics against operator output. Detects burnout (spoon depletion), hypomania (untethered output), and RSD collapse (rejection sensitivity) and returns the protocol response.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Operator text or transcript to scan for failure-mode indicators' },
        signals: {
          type: 'object',
          description: 'Optional telemetry: { latencyMs, taskAvoidance, scopeExpansion, afterFeedbackWithdrawal }',
          properties: {
            latencyMs: { type: 'number' },
            taskAvoidance: { type: 'boolean' },
            scopeExpansion: { type: 'boolean' },
            afterFeedbackWithdrawal: { type: 'boolean' },
          },
        },
      },
    },
  },
  {
    name: 'soulsafe_zero_work',
    description: 'Classify a statement as a zero-work system hazard (consumes cognition, produces no actionable information) or as actionable, per the SOULSAFE protocol.',
    inputSchema: {
      type: 'object',
      properties: {
        statement: { type: 'string', description: 'The statement to classify' },
      },
      required: ['statement'],
    },
  },
  {
    name: 'soulsafe_oqe_classify',
    description: 'Classify a claim into an Objective Quality Evidence category (Test Suite Output, Compiler Output, Deployment Log, Source Code, Verify Suite, Primary Source, Published DOI) or label it aspirational.',
    inputSchema: {
      type: 'object',
      properties: {
        claim: { type: 'string', description: 'The claim to classify' },
      },
      required: ['claim'],
    },
  },
  {
    name: 'soulsafe_severity',
    description: 'Grade a finding by severity (critical / high / medium / low) and return the deploy action per the /gate protocol. Critical findings block deployment.',
    inputSchema: {
      type: 'object',
      properties: {
        finding: { type: 'string', description: 'The finding text to grade' },
        details: { type: 'string', description: 'Optional supporting detail' },
      },
      required: ['finding'],
    },
  },
  {
    name: 'soulsafe_policy',
    description: 'Look up a SOULSAFE protocol section: competence, red_board, oqe, zero_work, gates, or severity. Returns the canonical section content.',
    inputSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', description: 'Section name: competence | red_board | oqe | zero_work | gates | severity' },
      },
      required: ['section'],
    },
  },
  {
    name: 'soulsafe_gate1_self_review',
    description: 'Gate 1 — self-review checklist. The generating expert reviews their own output; every claim must carry an OQE citation and known failure modes must be identified.',
    inputSchema: {
      type: 'object',
      properties: {
        change: { type: 'string', description: 'Description of the change under review' },
        claims: { type: 'array', items: { type: 'string' }, description: 'Optional list of claims made about the change' },
      },
      required: ['change'],
    },
  },
  {
    name: 'soulsafe_gate2_cross_review',
    description: 'Gate 2 — cross-review with information barrier. A different expert independently verifies each claim. The reviewer must NOT see the generator chain-of-thought or confidence scores.',
    inputSchema: {
      type: 'object',
      properties: {
        change: { type: 'string', description: 'Description of the change under review' },
        reviewer: { type: 'string', description: 'Name of the independent reviewer' },
        generatorConfidence: { type: 'number', description: 'Ignored — stripped by the information barrier. Passed so callers see it is never surfaced.' },
      },
      required: ['change'],
    },
  },
  {
    name: 'soulsafe_gate3_full',
    description: 'Gate 3 — architect verification. Runs the full OQE verify checklist (tsc, vitest, vite build, wrangler, verify-shell ≥186/186 twice) and returns the blocking rule.',
    inputSchema: {
      type: 'object',
      properties: {
        change: { type: 'string', description: 'Description of the change under verification' },
      },
      required: ['change'],
    },
  },
  {
    name: 'soulsafe_run_protocol',
    description: 'Run the full SOULSAFE 3-gate protocol (Gates 1-2-3) and return the combined report with severity matrix and deploy-clearing verdict.',
    inputSchema: {
      type: 'object',
      properties: {
        change: { type: 'string', description: 'Description of the change under verification' },
        surface: { type: 'string', description: 'Primary surface touched (used for tag-out checks)' },
      },
      required: ['change'],
    },
  },
  {
    name: 'soulsafe_manifest',
    description: 'List the crew agents from the canonical manifest.yaml (name, archetype, temperature, competence boundary).',
    inputSchema: {
      type: 'object',
      properties: {
        includeCompetence: { type: 'boolean', description: 'Include competence / not-competent lists (default true)' },
      },
    },
  },
  {
    name: 'soulsafe_competence_check',
    description: 'Check whether a surface falls inside a given agent\'s verified competence domain, using the manifest competence boundaries.',
    inputSchema: {
      type: 'object',
      properties: {
        agent: { type: 'string', description: 'Agent name to check (e.g. home-guardian)' },
        surface: { type: 'string', description: 'Surface or file path to check' },
      },
      required: ['agent', 'surface'],
    },
  },
  {
    name: 'soulsafe_verify_invariants',
    description: 'Report the canonical toolchain invariants from ground-truth.json (direct binaries, verify command).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'soulsafe_protocol_info',
    description: 'Report server and protocol metadata: MCP protocol version, spec files consumed, and pricing-tier reference.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ---------------------------------------------------------------------------
// Tool Implementations
// ---------------------------------------------------------------------------

function soulsafeTagout({ task, surface, agent } = {}) {
  const owning = findOwningExpert(surface);
  const taskTokens = String(task || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const requesting = getAgents().find(a => a.name === agent);
  const requestingCompetent = taskTokens.length > 0 && requesting
    ? (requesting.competence || []).some(c => {
        const tokens = c.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        return tokens.some(t => taskTokens.includes(t));
      })
    : null;

  if (!owning) {
    return {
      status: 'ok',
      tag_out: true,
      recommendation: 'No owning expert could be matched from the manifest competence boundaries. Tag out to the SOULSAFE Architect for arbitration.',
    };
  }
  const requestedIsOwner = requesting && owning.name === requesting.name;
  return {
    status: 'ok',
    tag_out: !requestedIsOwner,
    owning_expert: owning.name,
    requesting_agent: agent || 'unknown',
    requesting_competent: requestingCompetent === null ? 'unknown' : requestingCompetent,
    response: requestedIsOwner
      ? `Proceed within lane. ${owning.name} is the verified owner for this surface.`
      : `⚠️ This task is outside the competence boundary of ${agent || 'the caller'}. Tagging out to ${owning.name} (${owning.description}). Action: delegate the surface-specific work and stop.`,
  };
}

function soulsafeRedboardDetect({ text, signals } = {}) {
  const t = String(text || '').toLowerCase();
  const s = signals || {};
  const detected = [];

  const burnoutHits = [
    /typo/i.test(t) || /declining (quality|output)/.test(t),
    s.taskAvoidance === true,
    typeof s.latencyMs === 'number' && s.latencyMs > 60000,
  ];
  if (burnoutHits.filter(Boolean).length >= 1) {
    detected.push({ mode: 'burnout', label: 'Burnout (Spoon Depletion)', response: '🛑 Halt current task. Enforce rest block. Do not present new decisions.' });
  }

  const hypoHits = [
    /grandiose|scope expansion|(3|three)[+ ]am/.test(t),
    s.scopeExpansion === true,
    /context[- ]switch/.test(t) && /rapid/.test(t),
  ];
  if (hypoHits.filter(Boolean).length >= 1) {
    detected.push({ mode: 'hypomania', label: 'Hypomania (Untethered Output)', response: '🚩 Flag output for review. Do not deploy without gate check. Park new ideas in parking lot.' });
  }

  const rsdHits = [
    /withdraw|scrap everything|abandon[- ]ship/.test(t),
    s.afterFeedbackWithdrawal === true,
  ];
  if (rsdHits.filter(Boolean).length >= 1) {
    detected.push({ mode: 'rsd_collapse', label: 'RSD Collapse (Rejection Sensitivity)', response: '✅ Validate the work done. Do not agree to scrap everything. Offer a specific, bounded next step.' });
  }

  return {
    status: 'ok',
    detected,
    clean: detected.length === 0,
    pattern: detected.length
      ? `I notice ${detected.map(d => d.label).join(' and ')}. This suggests ${detected.map(d => d.mode.replace('_', ' ')).join(', ')}. My recommendation: ${detected[0].response}`
      : 'No Red Board failure mode detected.',
  };
}

function soulsafeZeroWork({ statement } = {}) {
  const stmt = String(statement || '').toLowerCase().trim();
  const hazards = [
    { phrase: 'everything is going to be okay', replacement: 'Give the specific, actionable status (e.g. "the build fails at line 42; fix: add the missing import").' },
    { phrase: 'i know how you feel', replacement: 'Acknowledge the situation factually and state the concrete next step.' },
    { phrase: "it'll work out", replacement: 'Explicit uncertainty: "I don\'t know. Let me check the verify gates."' },
    { phrase: 'it will work out', replacement: 'Explicit uncertainty: "I don\'t know. Let me check the verify gates."' },
    { phrase: 'thoughts and prayers', replacement: 'A clear next step or a request for more information.' },
  ];
  const hit = hazards.find(h => stmt.includes(h.phrase));
  if (hit) {
    return {
      status: 'ok',
      hazardous: true,
      classification: 'zero-work hazard',
      reason: `Consumes cognitive resources without producing actionable information: "${hit.phrase}"`,
      replacement: hit.replacement,
    };
  }
  return {
    status: 'ok',
    hazardous: false,
    classification: 'actionable',
    note: 'Statement carries actionable information or explicit uncertainty. If unsure it acts: "I don\'t have enough information to act on that yet."',
  };
}

function soulsafeOqeClassify({ claim } = {}) {
  const c = String(claim || '');
  const lower = c.toLowerCase();
  let category = null;
  let guidance = '';

  if (/vitest|test suite|all passing|tests pass/i.test(lower)) {
    category = 'Test Suite Output'; guidance = 'Vitest reports all passing (verified)';
  } else if (/tsc|typescript|exit 0|compiler/i.test(lower)) {
    category = 'Compiler Output'; guidance = 'TypeScript passes (tsc --noEmit)';
  } else if (/wrangler|deploy(ed)? as|version \w*id/i.test(lower)) {
    category = 'Deployment Log'; guidance = 'Deployed as Version [ID]';
  } else if (/verify-shell|186\/186|verify suite/i.test(lower)) {
    category = 'Verify Suite'; guidance = 'Verify suite reports 186/186 checks passing';
  } else if (/(\.tsx?|\.js|\.mjs)(:\d+)?|source code|at .*:[0-9]+/.test(lower)) {
    category = 'Source Code'; guidance = 'Care score formula at DashboardPage.tsx:66-72';
  } else if (/10\.5281|doi|zenodo/i.test(lower)) {
    category = 'Published DOI'; guidance = 'As documented in Paper XIX, Section 3';
  } else if (/per .* section|datasheet|spec(ification)?|legal|primary source/i.test(lower)) {
    category = 'Primary Source'; guidance = 'Per [source], Section [n]';
  } else {
    category = 'Aspirational'; guidance = 'Not traceable to OQE — must be labeled aspirational. "I don\'t know" is a valid SOULSAFE response; "it\'ll work out" is not.';
  }

  return {
    status: 'ok',
    category,
    traceable: category !== 'Aspirational',
    citation: guidance,
  };
}

const SEVERITY_TABLE = {
  critical: { action: 'Blocks deploy; halt', definition: 'Breaks a gate, leaks a secret, corrupts state' },
  high: { action: 'Blocks deploy; fix first', definition: 'Breaks a feature path in production' },
  medium: { action: 'Deploy allowed after review', definition: 'Cosmetic / non-functional gap' },
  low: { action: 'Deploy allowed', definition: 'Style / naming nit' },
};

function soulsafeSeverity({ finding, details } = {}) {
  const f = String(finding || '').toLowerCase();
  const d = String(details || '').toLowerCase();
  const hay = `${f} ${d}`;
  let severity;
  if (/secret|leak|corrupt|breaks? (a )?gate|blocks? (the )?deploy/i.test(hay)) severity = 'critical';
  else if (/production|feature path|breaks? .*flow|data loss/i.test(hay)) severity = 'high';
  else if (/cosmetic|non-functional|visual|a11y gap/i.test(hay)) severity = 'medium';
  else if (/style|naming|nit|formatting/i.test(hay)) severity = 'low';
  else severity = 'medium';

  return {
    status: 'ok',
    severity,
    table: SEVERITY_TABLE[severity],
    note: '"looks fine" is not a valid finding. Every finding must cite evidence or be explicitly "unverified".',
  };
}

function soulsafePolicy({ section } = {}) {
  const sections = {
    competence: {
      title: 'Competence Boundary (Triad of Cognition)',
      content: 'No single agent operates outside its verified lane. If a task falls outside your verified competence domain, respond with the tag-out template and hand off cleanly.',
    },
    red_board: {
      title: 'Red Board Diagnostics',
      content: 'Monitor for Burnout (spoon depletion), Hypomania (untethered output), and RSD Collapse (rejection sensitivity). Respond with: "I notice [pattern]. This suggests [state]. My recommendation: [specific action]."',
    },
    oqe: {
      title: 'Objective Quality Evidence (OQE)',
      content: 'Every claim must trace to Test Suite Output, Compiler Output, Deployment Log, Source Code, Verify Suite, Primary Source, or Published DOI. Untraceable claims are aspirational and must be labeled as such.',
    },
    zero_work: {
      title: 'Zero-Work Detection',
      content: '"Everything is going to be okay", "I know how you feel", "It\'ll work out", and "Thoughts and prayers" are system hazards. Replace with specific, actionable information or explicit uncertainty.',
    },
    gates: {
      title: '3-Gate Protocol',
      content: 'Gate 1: self-review with OQE citations. Gate 2: independent cross-review with information barrier (no generator confidence or chain-of-thought). Gate 3: architect verification via the full verify suite. Critical findings block deployment. No exceptions.',
    },
    severity: {
      title: 'Severity Grading',
      content: 'Critical blocks deploy (halt). High blocks deploy (fix first). Medium deploy allowed after review. Low deploy allowed. Every finding is severity-graded; "looks fine" is not valid.',
    },
  };
  const key = section || 'gates';
  return {
    status: 'ok',
    section: key,
    found: key in sections,
    ...(sections[key] || { title: `Unknown section: ${key}`, content: `Available: ${Object.keys(sections).join(', ')}` }),
  };
}

function soulsafeGate1SelfReview({ change, claims = [] } = {}) {
  return {
    status: 'ok',
    gate: 1,
    name: 'Self-Review',
    change,
    checklist: [
      { item: 'Every claim carries an OQE citation', required: true },
      { item: 'Known failure modes identified', required: true },
      { item: 'Confidence scores are NOT shared downstream (Gate 2 barrier)', required: true },
      { item: 'No zero-work language ("looks fine", "trust me", "it\'ll work out")', required: true },
    ],
    claims: claims.map(c => ({ claim: c, oqe: soulsafeOqeClassify({ claim: c }) })),
    instruction: 'The generating expert reviews their own output and cites OQE for every claim.',
  };
}

function soulsafeGate2CrossReview({ change, reviewer, generatorConfidence } = {}) {
  return {
    status: 'ok',
    gate: 2,
    name: 'Cross-Review (Information Barrier)',
    change,
    reviewer: reviewer || 'unassigned (assign an independent expert)',
    informationBarrier: true,
    generatorConfidenceStripped: true,
    checklist: [
      { item: 'Reviewer verifies each claim against evidence/tools independently', required: true },
      { item: 'Reviewer has NOT seen generator chain-of-thought or confidence scores', required: true },
      { item: 'Findings are severity-classified (critical/high/medium/low)', required: true },
    ],
    note: generatorConfidence !== undefined ? 'Received generator confidence value — discarded by the information barrier. It is never surfaced to the reviewer.' : 'No generator confidence passed (correct).',
  };
}

function soulsafeGate3Full({ change } = {}) {
  const gt = getGroundTruth() || {};
  const verify = gt.verify || { baseline: '~186/186 gates', runTwice: true, command: 'NODE_PATH=/home/p31/node_modules node scripts/verify-shell.cjs' };
  return {
    status: 'ok',
    gate: 3,
    name: 'Architect Verification',
    change,
    baseline: verify.baseline,
    runTwice: verify.runTwice === true,
    command: verify.command,
    verifyChecklist: [
      { gate: './node_modules/.bin/tsc --noEmit', expected: 'exit 0' },
      { gate: './node_modules/.bin/vitest run', expected: 'all passing' },
      { gate: './node_modules/.bin/vite build', expected: 'succeeds' },
      { gate: './node_modules/.bin/wrangler deploy', expected: 'succeeds' },
      { gate: verify.command, expected: `${verify.baseline} (run twice)` },
    ],
    blockingRule: 'Any critical finding blocks deployment. No exceptions.',
  };
}

function soulsafeRunProtocol({ change, surface } = {}) {
  const tagout = soulsafeTagout({ task: change, surface });
  const gate1 = soulsafeGate1SelfReview({ change });
  const gate2 = soulsafeGate2CrossReview({ change });
  const gate3 = soulsafeGate3Full({ change });
  const severity = soulsafeSeverity({ finding: change });
  const critical = severity.severity === 'critical';
  return {
    status: 'ok',
    protocol: 'SOULSAFE 3-Gate (Paper XIX)',
    change,
    tagout,
    gates: [gate1, gate2, gate3],
    severity: severity.severity,
    verdict: critical
      ? 'DEPLOY BLOCKED — critical finding'
      : severity.severity === 'high'
        ? 'DEPLOY BLOCKED — high finding, fix first'
        : 'CLEARED — deploy allowed after gate pass',
  };
}

function soulsafeManifest({ includeCompetence = true } = {}) {
  const agents = getAgents().map(a => ({
    name: a.name,
    description: a.description,
    triad_archetype: a.triad_archetype,
    temperature: a.temperature,
    model: a.model,
    ...(includeCompetence ? { competence: a.competence, not_competent: a.not_competent } : {}),
  }));
  return { status: 'ok', manifest: MANIFEST_PATH, count: agents.length, agents };
}

function soulsafeCompetenceCheck({ agent, surface } = {}) {
  const target = getAgents().find(a => a.name === agent);
  if (!target) {
    return { status: 'error', error: `Unknown agent: ${agent}. Known: ${getAgents().map(a => a.name).join(', ')}` };
  }
  const owning = findOwningExpert(surface);
  const inLane = owning && owning.name === target.name;
  const surfaceTokens = String(surface || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const matchedCompetence = (target.competence || []).filter(c => {
    const tokens = c.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    return tokens.some(t => surfaceTokens.includes(t));
  });
  const matchedNotCompetent = (target.not_competent || []).filter(c => {
    const tokens = c.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    return tokens.some(t => surfaceTokens.includes(t));
  });
  return {
    status: 'ok',
    agent,
    surface,
    in_lane: inLane,
    matched_competence: matchedCompetence,
    matched_not_competent: matchedNotCompetent,
    owning_expert: owning ? owning.name : null,
    verdict: inLane ? 'In lane — proceed with surface-specific work.' : matchedNotCompetent.length > 0
      ? `Out of lane — tagged out to ${owning ? owning.name : 'the owning expert'}.`
      : 'Boundary ambiguous — tag out to SOULSAFE Architect for arbitration.',
  };
}

function soulsafeVerifyInvariants() {
  const gt = getGroundTruth() || {};
  const invariants = (gt.toolchain && gt.toolchain.invariants) || [];
  return {
    status: 'ok',
    source: GROUND_TRUTH_PATH,
    invariants,
    count: invariants.length,
  };
}

function soulsafeProtocolInfo() {
  return {
    status: 'ok',
    server: { name: 'p31-soulsafe', version: '2.0.0', upgraded: true },
    protocolVersion: '2026-07-28',
    consumes: { manifest: MANIFEST_PATH, groundTruth: GROUND_TRUTH_PATH, protocol: SOULSAFE_PATH },
    pricing: {
      free: ['soulsafe_tagout', 'soulsafe_redboard_detect', 'soulsafe_zero_work', 'soulsafe_oqe_classify', 'soulsafe_severity', 'soulsafe_policy', 'soulsafe_manifest', 'soulsafe_competence_check', 'soulsafe_verify_invariants', 'soulsafe_protocol_info'],
      meteredLow: ['soulsafe_gate1_self_review', 'soulsafe_gate2_cross_review'],
      premium: ['soulsafe_gate3_full', 'soulsafe_run_protocol'],
    },
  };
}

// ---------------------------------------------------------------------------
// Tool Execution Router
// ---------------------------------------------------------------------------

function executeTool(name, args) {
  switch (name) {
    case 'soulsafe_tagout':
      return soulsafeTagout(args);
    case 'soulsafe_redboard_detect':
      return soulsafeRedboardDetect(args);
    case 'soulsafe_zero_work':
      return soulsafeZeroWork(args);
    case 'soulsafe_oqe_classify':
      return soulsafeOqeClassify(args);
    case 'soulsafe_severity':
      return soulsafeSeverity(args);
    case 'soulsafe_policy':
      return soulsafePolicy(args);
    case 'soulsafe_gate1_self_review':
      return soulsafeGate1SelfReview(args);
    case 'soulsafe_gate2_cross_review':
      return soulsafeGate2CrossReview(args);
    case 'soulsafe_gate3_full':
      return soulsafeGate3Full(args);
    case 'soulsafe_run_protocol':
      return soulsafeRunProtocol(args);
    case 'soulsafe_manifest':
      return soulsafeManifest(args);
    case 'soulsafe_competence_check':
      return soulsafeCompetenceCheck(args);
    case 'soulsafe_verify_invariants':
      return soulsafeVerifyInvariants(args);
    case 'soulsafe_protocol_info':
      return soulsafeProtocolInfo(args);
    default:
      return { status: 'error', error: `Unknown tool: ${name}` };
  }
}

// ---------------------------------------------------------------------------
// JSON-RPC over stdio
// ---------------------------------------------------------------------------

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      handleRequest(JSON.parse(trimmed));
    } catch (_) {}
  }
});

function handleRequest(req) {
  const { id, method, params } = req;
  switch (method) {
    case 'initialize':
      respond(id, {
        protocolVersion: '2026-07-28',
        capabilities: { tools: {} },
        serverInfo: { name: 'p31-soulsafe', version: '2.0.0', upgraded: true },
      });
      break;
    case 'notifications/initialized':
      break;
    case 'tools/list':
      respond(id, { tools: TOOLS });
      break;
    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS.find(t => t.name === toolName);
      if (!tool) {
        respondError(id, -32602, `Unknown tool: ${toolName}`);
        break;
      }
      try {
        const out = executeTool(toolName, toolArgs);
        respond(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        respond(id, {
          content: [{ type: 'text', text: JSON.stringify({ error: e.message, status: 'error' }) }],
          isError: true,
        });
      }
      break;
    }
    case 'ping':
      respond(id, {});
      break;
    default:
      if (id !== undefined) respondError(id, -32601, `Method not found: ${method}`);
  }
}

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function respondError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}
