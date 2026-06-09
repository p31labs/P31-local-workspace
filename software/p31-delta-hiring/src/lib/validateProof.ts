import type { Consent, ProofArtifact, ProofRecord } from '../types';

export type ParseResult = { ok: true; value: ProofRecord } | { ok: false; errors: string[] };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WCD_RE = /^WCD-[A-Z0-9]+-\d+$/i;

function isObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function validConsent(c: unknown): c is Consent {
  if (!isObject(c)) return false;
  if (c.version !== '1.0.0') return false;
  if (typeof c.dataProcessing !== 'boolean') return false;
  if (typeof c.shareWithReviewers !== 'boolean') return false;
  return true;
}

function validHttpOrFileUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'file:';
  } catch {
    return false;
  }
}

function validArtifact(x: unknown): x is ProofArtifact {
  if (!isObject(x)) {
    return false;
  }
  const kind = x.kind;
  if (kind !== 'repo' && kind !== 'url' && kind !== 'file' && kind !== 'other') {
    return false;
  }
  if (typeof x.id !== 'string' || x.id.length < 1) return false;
  if (typeof x.label !== 'string' || x.label.length < 1) return false;
  if (typeof x.url !== 'string' || x.url.length < 4) return false;
  if (!validHttpOrFileUrl(x.url)) return false;
  if (x.notes !== undefined && typeof x.notes !== 'string') return false;
  if (x.commitSha !== undefined && x.commitSha !== null) {
    if (typeof x.commitSha !== 'string') return false;
    if (x.commitSha.length > 0 && !/^[a-f0-9]{7,40}$/i.test(x.commitSha)) return false;
  }
  return true;
}

/**
 * Parse and structurally validate a `p31.proofRecord/1.0.0` object (import or pre-save).
 * Does not assert role/wcd exist in the catalog; caller may re-validate in context.
 */
export function parseProofJson(raw: unknown): ParseResult {
  const errors: string[] = [];
  if (!isObject(raw)) {
    return { ok: false, errors: ['Root must be a JSON object.'] };
  }
  if (raw.schema !== 'p31.proofRecord/1.0.0') {
    errors.push('schema must be p31.proofRecord/1.0.0');
  }
  if (typeof raw.id !== 'string' || raw.id.length < 4) {
    errors.push('id must be a string (min length 4)');
  } else {
    const ok = UUID_RE.test(raw.id) || raw.id.startsWith('proof-') || raw.id.startsWith('a-');
    if (!ok) errors.push('id must be a UUID, proof-…, or local artifact id');
  }
  for (const k of ['created', 'updated'] as const) {
    if (typeof raw[k] !== 'string' || raw[k]!.length < 8) {
      errors.push(`${k} must be an ISO-8601 string`);
    } else {
      const t = Date.parse(String(raw[k]));
      if (Number.isNaN(t)) errors.push(`${k} must be parseable as a date`);
    }
  }
  if (typeof raw.roleId !== 'string' || raw.roleId.length < 1) {
    errors.push('roleId required');
  }
  if (typeof raw.wcdId !== 'string' || !WCD_RE.test(raw.wcdId)) {
    errors.push('wcdId must look like WCD-XXX-000');
  }
  if (!validConsent(raw.consent)) {
    errors.push('consent must be { dataProcessing, shareWithReviewers, version: 1.0.0 }');
  }
  if (!Array.isArray(raw.artifacts)) {
    errors.push('artifacts must be an array');
  } else {
    raw.artifacts.forEach((a, i) => {
      if (!validArtifact(a)) {
        errors.push(
          `artifacts[${i}] invalid (id, kind, label, http(s) or file: url, optional 7+ hex commitSha, optional notes)`
        );
      }
    });
  }
  if (typeof raw.candidateNotes !== 'string' || raw.candidateNotes.length > 100_000) {
    errors.push('candidateNotes must be a string of reasonable size');
  }
  if (raw.selfAssessment === null || !isObject(raw.selfAssessment)) {
    errors.push('selfAssessment must be an object');
  } else {
    for (const [k, v] of Object.entries(raw.selfAssessment)) {
      if (typeof v !== 'number' || v < 1 || v > 5 || !Number.isFinite(v)) {
        errors.push(`selfAssessment.${k} must be 1–5`);
      }
    }
  }
  if (errors.length) return { ok: false, errors };

  const rec: ProofRecord = {
    schema: 'p31.proofRecord/1.0.0',
    id: raw.id as string,
    created: raw.created as string,
    updated: raw.updated as string,
    roleId: raw.roleId as string,
    wcdId: raw.wcdId as string,
    consent: raw.consent as Consent,
    artifacts: raw.artifacts as ProofArtifact[],
    selfAssessment: { ...(raw.selfAssessment as Record<string, number>) },
    candidateNotes: raw.candidateNotes as string
  };
  return { ok: true, value: rec };
}
