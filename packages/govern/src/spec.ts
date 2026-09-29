/**
 * spec — the authoring format. A YAML spec compiles to a 0.3.0 constitution
 * plus runbook stubs, negative-control stubs, a fleet registration file, and
 * a test scaffold.
 *
 * The generator produces HONEST scaffolding: generated gates start
 * OBSERVATIONAL, generated NCs fail with STUB_NOT_IMPLEMENTED (never the
 * proof marker), and the constitution's aspirational[] lists what is not
 * yet enforced. A generated domain is DECLARED, not governed — and its
 * audit says so.
 */

export interface OqeSpec {
  evidenceClass: 'test-suite' | 'compiler' | 'deploy-log' | 'primary-source' | 'doi' | 'api-response' | 'legal-record';
  reference: string;
}

export interface CredentialSpec {
  type: 'did:key' | 'sbt' | 'role' | 'system';
  id: string;
  scope?: string;
}

export interface GateSpec {
  id: string;
  description: string;
  command: string;
  scope: string;
  state?: 'OBSERVATIONAL' | 'WARNING' | 'BLOCKING';
  owner: CredentialSpec[];
  remediation: string; // runbooks/RUNBOOK-*.md
  oqe: OqeSpec;
  enforcementMoment?: 'pre-commit' | 'ci' | 'weekly' | 'event';
  /** If true, the generator writes a runbook stub at remediation. */
  generateRunbook?: boolean;
  /** If true, the generator writes an NC stub that FAILS (declared, not governed). */
  generateNegativeControl?: boolean;
}

export interface RatchetSpec {
  id: string;
  description: string;
  baseline: number;
  countSource: string;
  countSourceArgs?: string[];
  lockThreshold: number;
}

export interface ReviewSpec {
  cadence: string;
  onFailure: string;
  abdication: { afterCleanCycles: number; requiresHumanSignoff: true };
  /** Four-party K₄ — required if any gate is BLOCKING. */
  fourParty?: {
    user: CredentialSpec;
    issuer: CredentialSpec;
    ledger: CredentialSpec;
    court: CredentialSpec;
  };
  /** Single-owner fallback for OBSERVATIONAL bootstrap. */
  singleOwner?: CredentialSpec[];
}

export interface DomainSpec {
  domain: string;
  version: string;
  description: string;
  genesisTimestamp: string;
  canonicalSource: { path: string; description: string; oqe: OqeSpec };
  mirrors: Array<{ path: string; generatedFrom: string; parityGate: string }>;
  gates: GateSpec[];
  ratchets?: RatchetSpec[];
  lessons?: Array<{
    id: string;
    rootCause: string | { unproven: true; ruledOut: string[] };
    prevention: string;
    oqe: OqeSpec;
  }>;
  review: ReviewSpec;
  auditLog?: { chainName: string; sink: 'jsonl-hash-chain' | 'stdout' };
  aspirational?: string[];
}

export interface InterDomainContract {
  id: string;
  provider: string; // domain name
  consumers: string[]; // domain names
  guarantee: string;
  evidence: OqeSpec;
  gate: string; // the provider gate that enforces it
  /** Optional: a command the composer can run to verify the contract. */
  verify?: string;
}

export interface EnterpriseSpec {
  name: string;
  version: string;
  genesisTimestamp: string;
  description: string;
  domains: Array<{ name: string; ref: string }>;
  interDomainContracts: InterDomainContract[];
  crossCutting: {
    identity: { canonicalSource: string; oqe: OqeSpec };
    capacity: { model: 'spoon-dial'; range: [number, number]; contract: string; oqe: OqeSpec };
    audit: { chainName: string; sink: 'jsonl-hash-chain' | 'stdout' };
  };
  review: {
    cadence: string;
    onFailure: string;
    abdication: { afterCleanCycles: number; requiresHumanSignoff: true };
    fourParty: { user: CredentialSpec; issuer: CredentialSpec; ledger: CredentialSpec; court: CredentialSpec };
  };
  aspirational?: string[];
}