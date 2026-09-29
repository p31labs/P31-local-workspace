/**
 * reconcile — the enterprise timeline operation.
 *
 * Each domain writes only to its own Genesis chain (the .govern-audit.jsonl
 * file at each constitution root). The enterprise timeline
 * (specs/enterprise-audit.jsonl) is built by mirroring: for every domain block
 * whose currentHash is not yet present, a mirror block `{ domain, blockNumber,
 * blockHash }` is appended to the enterprise chain. This is the decoupled
 * design — domains never write to the enterprise chain directly.
 *
 * `reconcile()` performs the mirror and reports per-domain status.
 * `checkReconciliation()` is the read-only gate: it reports which domain's
 * latest block is NOT mirrored (the orphan check without appending).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadConstitution, constitutionRoot } from './constitution.js';
import { loadEnterpriseFromYaml } from './spec-yaml.js';
import { JsonlHashChainSink, type Block, type AuditEvent } from './sink.js';

export interface DomainStatus {
  name: string;
  constitutionPath: string;
  chainPath: string;
  latestBlockNumber: number | null;
  mirrored: boolean;
  blocksMirrored: number;
  error?: string;
}

export interface ReconcileResult {
  enterpriseChainPath: string;
  ok: boolean;
  domains: DomainStatus[];
}

export interface DomainChainRef {
  name: string;
  constitutionPath: string;
  chainPath: string;
}

/** Read a hash-chain file as an ordered block list. Throws if missing/unreadable. */
export function readChain(path: string): Block[] {
  if (!existsSync(path)) throw new Error(`chain not found: ${path}`);
  const raw = readFileSync(path, 'utf8').trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map((l) => JSON.parse(l) as Block);
}

/**
 * Resolve the domain chains the enterprise spec governs. Each domain's chain
 * lives at its constitution's root (the dirname of the constitution file).
 */
export function resolveDomainChains(specPath: string): DomainChainRef[] {
  const spec = loadEnterpriseFromYaml(specPath);
  const specDir = dirname(resolve(specPath));
  return spec.domains.map((d) => {
    const constitutionPath = resolve(specDir, d.ref);
    return {
      name: d.name,
      constitutionPath,
      chainPath: resolve(constitutionRoot(constitutionPath), '.govern-audit.jsonl'),
    };
  });
}

/** The enterprise chain path: the spec's sibling, named enterprise-audit.jsonl. */
export function enterpriseChainPath(specPath: string): string {
  return resolve(dirname(resolve(specPath)), 'enterprise-audit.jsonl');
}

/**
 * The hashes the enterprise chain already covers: every chain block's own
 * currentHash AND every mirror block's payload.blockHash (which records the
 * mirrored domain block's hash). Both must count so re-reconciliation is
 * idempotent — a domain block is covered if either form is present.
 */
function coveredHashes(blocks: Block[]): Set<string> {
  const s = new Set<string>();
  for (const b of blocks) {
    s.add(b.currentHash);
    if (b.payload && typeof b.payload === 'object' && 'blockHash' in b.payload) {
      s.add((b.payload as { blockHash: string }).blockHash);
    }
  }
  return s;
}

/** Read-only reconcile check: which domains are NOT fully mirrored. Never appends. */
export function checkReconciliation(specPath: string): ReconcileResult {
  const enterprisePath = enterpriseChainPath(specPath);
  let hashes = new Set<string>();
  try {
    hashes = coveredHashes(readChain(enterprisePath));
  } catch {
    // Enterprise chain missing — nothing mirrored yet; every block is an orphan.
    hashes = new Set<string>();
  }

  let ok = true;
  const domains = resolveDomainChains(specPath).map((d) => {
    let blocks: Block[];
    try {
      blocks = readChain(d.chainPath);
    } catch (e) {
      ok = false;
      return {
        name: d.name, constitutionPath: d.constitutionPath, chainPath: d.chainPath,
        latestBlockNumber: null, mirrored: false, blocksMirrored: 0,
        error: `domain chain missing or unreadable: ${(e as Error).message}`,
      };
    }
    const latest = blocks.length > 0 ? blocks[blocks.length - 1] : null;
    const mirrored = !latest || hashes.has(latest.currentHash);
    if (!mirrored) ok = false;
    return {
      name: d.name, constitutionPath: d.constitutionPath, chainPath: d.chainPath,
      latestBlockNumber: latest ? latest.blockNumber : null,
      mirrored, blocksMirrored: 0,
      error: mirrored ? undefined : `latest block #${latest?.blockNumber} (${latest?.currentHash.slice(0, 16)}…) not mirrored in the enterprise chain`,
    };
  });
  return { enterpriseChainPath: enterprisePath, ok, domains };
}

/**
 * Mirror every domain block that is not yet in the enterprise chain. Seeds the
 * enterprise genesis anchor on first run so mirror blocks are eventType 'audit'.
 * Exits 0 (ok) only if every domain's latest block is mirrored afterwards.
 */
export function reconcile(specPath: string): ReconcileResult {
  const spec = loadEnterpriseFromYaml(specPath);
  const specDir = dirname(resolve(specPath));
  const enterprisePath = enterpriseChainPath(specPath);
  const sink = new JsonlHashChainSink(enterprisePath, spec.crossCutting.audit.chainName);

  const existing = new Set<string>();
  if (existsSync(enterprisePath)) {
    for (const b of coveredHashes(readChain(enterprisePath))) existing.add(b);
  }
  if (existing.size === 0) {
    // The enterprise chain needs a genesis anchor; mirrors start at block 1.
    const genesis = sink.append({
      domain: spec.name,
      schemaVersion: spec.version,
      timestamp: spec.genesisTimestamp,
      valid: true,
      violations: [],
      selfTest: { gates: 0, canFail: 0, furniture: [] },
      ratchets: [],
      floatingNeutrals: [],
      capacity: null,
    } as unknown as AuditEvent);
    existing.add(genesis.currentHash);
  }

  let ok = true;
  const domains = resolveDomainChains(specPath).map((d) => {
    let blocks: Block[];
    try {
      blocks = readChain(d.chainPath);
    } catch (e) {
      ok = false;
      return {
        name: d.name, constitutionPath: d.constitutionPath, chainPath: d.chainPath,
        latestBlockNumber: null, mirrored: false, blocksMirrored: 0,
        error: `domain chain missing or unreadable: ${(e as Error).message}`,
      };
    }

    let blocksMirrored = 0;
    for (const b of blocks) {
      if (existing.has(b.currentHash)) continue;
      // Mirror block: records the domain block's identity, not its payload.
      sink.append({ domain: d.name, blockNumber: b.blockNumber, blockHash: b.currentHash } as unknown as AuditEvent);
      existing.add(b.currentHash);
      blocksMirrored++;
    }

    const latest = blocks.length > 0 ? blocks[blocks.length - 1] : null;
    const mirrored = !latest || existing.has(latest.currentHash);
    if (!mirrored) ok = false;
    return {
      name: d.name, constitutionPath: d.constitutionPath, chainPath: d.chainPath,
      latestBlockNumber: latest ? latest.blockNumber : null,
      mirrored, blocksMirrored,
      error: mirrored ? undefined : 'latest block could not be mirrored',
    };
  });

  return { enterpriseChainPath: enterprisePath, ok, domains };
}