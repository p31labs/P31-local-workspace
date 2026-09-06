import { WORKERS } from '../state/healthStore';

export interface WorkflowStep {
  id: string;
  action: string;
  inputs: Record<string, string>;
  wait?: { status: string };
}

export interface TemplateParam {
  key: string;
  label: string;
  type: 'string' | 'select' | 'number';
  default?: string;
  options?: string[];
  required?: boolean;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  category: 'app' | 'worker' | 'passport' | 'governance' | 'payment';
  params: TemplateParam[];
  steps: WorkflowStep[];
}

export interface StepResult {
  id: string;
  status: 'pending' | 'running' | 'ok' | 'failed';
  output?: string;
  error?: string;
}

export type RunCallback = (step: string, status: StepResult['status'], output?: string) => void;

function resolveAction(action: string): { baseUrl: string; method: string; path: string } | null {
  const parts = action.split(/\s+/);
  if (parts.length < 2) return null;
  const [workerRef, fullPath] = parts;
  const [method, ...pathParts] = fullPath.split('/');
  const path = '/' + pathParts.join('/');
  const worker = WORKERS.find(
    (w) => w.name === workerRef || w.name === workerRef.replace(/\.workers\.dev$/, '')
  );
  if (!worker) return null;
  const baseUrl = worker.url.replace(/\/health$/, '');
  return { baseUrl, method: method.toUpperCase(), path };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const TEMPLATES: WorkflowTemplate[] = [
  // ── Golden Path: New App ─────────────────────────────────────────
  {
    name: 'New App',
    description: 'Generate a new app via Vibe, deploy to a temporary URL, then claim it permanently.',
    category: 'app',
    params: [
      { key: 'prompt', label: 'App description', type: 'string', required: true, default: 'A simple counter app' },
      { key: 'name', label: 'App name', type: 'string', required: true, default: 'my-app' },
    ],
    steps: [
      { id: 'generate', action: 'app-supervisor POST /api/vibe/generate', inputs: { prompt: '{{prompt}}' } },
      { id: 'deploy-temp', action: 'app-supervisor POST /apps/create', inputs: { name: '{{name}}', html: '{{output}}', creator: 'golden-path' } },
      { id: 'preview', action: 'app-supervisor GET /apps/{{id}}', inputs: {}, wait: { status: 'active' } },
    ],
  },
  // ── Golden Path: New Worker ──────────────────────────────────────
  {
    name: 'New Worker',
    description: 'Scaffold a Cloudflare Worker with boilerplate, deploy it, and verify health.',
    category: 'worker',
    params: [
      { key: 'name', label: 'Worker name', type: 'string', required: true, default: 'my-worker' },
      { key: 'template', label: 'Language', type: 'select', default: 'typescript', options: ['typescript', 'javascript'] },
    ],
    steps: [
      { id: 'scaffold', action: 'genesis-gate POST /event', inputs: { source: 'golden-path', type: 'worker.scaffold', payload: '{"name":"{{name}}","lang":"{{template}}"}' } },
      { id: 'deploy', action: 'genesis-gate POST /event', inputs: { source: 'golden-path', type: 'worker.deploy', payload: '{"name":"{{name}}"}' } },
      { id: 'health', action: 'genesis-gate GET /health', inputs: {} },
    ],
  },
  // ── Golden Path: New Passport ────────────────────────────────────
  {
    name: 'New Passport',
    description: 'Generate a cognitive passport, sync to the edge, and issue a PQC credential.',
    category: 'passport',
    params: [
      { key: 'did', label: 'DID (did:key:z...)', type: 'string', required: true },
      { key: 'displayName', label: 'Display name', type: 'string', default: 'Anonymous' },
    ],
    steps: [
      { id: 'generate-passport', action: 'intent-resolver POST /profile', inputs: { did: '{{did}}', profile: '{"identity":{"displayName":"{{displayName}}"}}' } },
      { id: 'issue-credential', action: 'ledger-bridge POST /credential/issue-pqc', inputs: { did: '{{did}}' } },
    ],
  },
  // ── Legacy templates (retained from Phase 4a) ────────────────────
  {
    name: 'Proposal → Vote → Contract → LOVE Settlement',
    description: 'Create a governance proposal, wait for approval, deploy the contract, and settle LOVE.',
    category: 'governance',
    params: [
      { key: 'did', label: 'Proposer DID', type: 'string', required: true },
      { key: 'recipient', label: 'LOVE recipient', type: 'string', required: true },
    ],
    steps: [
      { id: 'create-proposal', action: 'governance-engine POST /proposal', inputs: { title: 'Community Fund Q3', description: 'Allocate LOVE for ecosystem grants', creator: '{{did}}' } },
      { id: 'wait-vote', action: 'governance-engine GET /proposal/{{id}}/status', inputs: {}, wait: { status: 'approved' } },
      { id: 'create-contract', action: 'contract-engine POST /contract', inputs: { proposal_id: '{{id}}', terms: '30d vest, 1000 LOVE' } },
      { id: 'settle-love', action: 'love-ledger POST /spend', inputs: { amount: '1000', to: '{{recipient}}' } },
    ],
  },
  {
    name: 'Care Proof → FHIR Observation → Ledger',
    description: 'Submit a care proof, create an HL7 FHIR observation, and record it on the LOVE ledger.',
    category: 'payment',
    params: [
      { key: 'did', label: 'Subject DID', type: 'string', required: true },
      { key: 'score', label: 'Care score', type: 'number', default: '85' },
    ],
    steps: [
      { id: 'create-care-proof', action: 'federation-bridge POST /credential/issue', inputs: { type: 'care-proof', subject: '{{did}}' } },
      { id: 'create-observation', action: 'fhir-bridge POST /fhir/Observation', inputs: { status: 'final', code: 'care-score', value: '{{score}}' } },
      { id: 'record-ledger', action: 'love-ledger POST /transfer', inputs: { amount: '{{love}}', memo: 'care-proof settlement' } },
    ],
  },
  {
    name: 'Taler Payment → Receipt → LOVE Credit',
    description: 'Process a Taler payment, generate a creation receipt, and credit LOVE.',
    category: 'payment',
    params: [
      { key: 'usdc', label: 'USDC amount', type: 'number', default: '10' },
      { key: 'contract', label: 'Contract reference', type: 'string', default: 'contract-001' },
    ],
    steps: [
      { id: 'process-payment', action: 'taler-bridge-billing POST /pay', inputs: { amount: '{{usdc}}', contract: '{{contract}}' } },
      { id: 'generate-receipt', action: 'creation-accountant POST /receipt', inputs: { amount_paid: '{{usdc}}', service: '{{service}}' } },
      { id: 'credit-love', action: 'love-ledger POST /mint', inputs: { amount: '{{love}}', reason: 'Taler settlement bonus' } },
    ],
  },
  {
    name: 'Passport Sync → Intent Personalization',
    description: 'Sync a cognitive passport, then create a personalized intent quote.',
    category: 'passport',
    params: [
      { key: 'did', label: 'DID (did:key:z...)', type: 'string', required: true },
      { key: 'prompt', label: 'Intent prompt', type: 'string', default: 'Help me organize my day' },
    ],
    steps: [
      { id: 'sync-profile', action: 'intent-resolver POST /profile', inputs: { did: '{{did}}', profile: '{{profile}}' } },
      { id: 'create-intent', action: 'intent-resolver POST /intent', inputs: { prompt: '{{prompt}}', did: '{{did}}' } },
    ],
  },
];

export async function executeWorkflow(
  template: WorkflowTemplate,
  inputs: Record<string, string>,
  onStep: RunCallback
): Promise<StepResult[]> {
  const results: StepResult[] = template.steps.map((s) => ({ id: s.id, status: 'pending' }));

  for (let i = 0; i < template.steps.length; i++) {
    const step = template.steps[i];
    results[i] = { id: step.id, status: 'running' };
    onStep(step.id, 'running');

    const resolved = resolveAction(step.action);
    if (!resolved) {
      await sleep(800 + Math.random() * 600);
      results[i] = { id: step.id, status: 'ok', output: `[simulated] ${step.action}` };
      onStep(step.id, 'ok', `Simulated: ${step.action}`);
      continue;
    }

    try {
      const body: Record<string, string> = {};
      for (const [k, v] of Object.entries(step.inputs)) {
        body[k] = v.replace(/\{\{(\w+)\}\}/g, (_, key) => inputs[key] ?? '');
      }

      const fetchOpts: RequestInit = { method: resolved.method, headers: { 'Content-Type': 'application/json' } };
      if (resolved.method === 'POST') fetchOpts.body = JSON.stringify(body);

      const res = await fetch(`${resolved.baseUrl}${resolved.path}`, {
        ...fetchOpts,
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => 'unknown')}`);
      }

      const text = await res.text();
      if (step.wait) {
        for (let attempt = 0; attempt < 10; attempt++) {
          await sleep(1500);
          try {
            const pollRes = await fetch(`${resolved.baseUrl}${resolved.path}`, { signal: AbortSignal.timeout(5000) });
            const data = await pollRes.json() as Record<string, unknown>;
            if (data?.status === step.wait.status) break;
          } catch { /* retry */ }
        }
      }

      results[i] = { id: step.id, status: 'ok', output: text.slice(0, 200) };
      onStep(step.id, 'ok', `${resolved.method} ${resolved.path} → ${res.status}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      results[i] = { id: step.id, status: 'failed', error: msg };
      onStep(step.id, 'failed', msg);
      break;
    }
  }

  return results;
}
