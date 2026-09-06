import type { ProofRecord, ProofArtifact, Consent } from './types';

const KEY = 'p31.deltaHiring.proofRecords.v1';

function loadAll(): ProofRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as ProofRecord[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function saveAll(records: ProofRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(records, null, 0));
}

export function listProofs(): ProofRecord[] {
  return loadAll().sort((a, b) => b.updated.localeCompare(a.updated));
}

export function getProof(id: string): ProofRecord | undefined {
  return loadAll().find((p) => p.id === id);
}

export function upsertProof(
  r: ProofRecord
): void {
  const all = loadAll();
  const i = all.findIndex((x) => x.id === r.id);
  if (i >= 0) all[i] = r;
  else all.push(r);
  saveAll(all);
}

export function deleteProof(id: string): void {
  saveAll(loadAll().filter((p) => p.id !== id));
}

export function newProofTemplate(roleId: string, wcdId: string): ProofRecord {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `proof-${Date.now()}`;
  const consent: Consent = {
    dataProcessing: true,
    shareWithReviewers: true,
    version: '1.0.0'
  };
  return {
    schema: 'p31.proofRecord/1.0.0',
    id,
    created: now,
    updated: now,
    roleId,
    wcdId,
    consent,
    artifacts: [],
    selfAssessment: {},
    candidateNotes: ''
  };
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `a-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function makeArtifact(
  kind: ProofArtifact['kind'],
  label: string,
  url: string,
  notes?: string,
  commitSha?: string
): ProofArtifact {
  return {
    id: uuid(),
    kind,
    label: label.slice(0, 200),
    url: url.slice(0, 2000),
    notes: notes?.slice(0, 4000),
    ...(commitSha && commitSha.length >= 7
      ? { commitSha: commitSha.slice(0, 64) }
      : {})
  };
}
