import { describe, it, expect, beforeEach } from 'vitest';
import app from '../src/index';

function makeEnv() {
  const store: Record<string, any[]> = { fhir_observations: [], fhir_patients: [], fhir_provenances: [] };
  const db: any = {
    prepare: (sql: string) => {
      const stmt: any = {
        async first() {
          if (/SELECT 1/.test(sql)) return { '1': 1 };
          const table = Object.keys(store).find((t) => sql.includes(t));
          if (!table) return null;
          const row = store[table].find((r) => r[Object.keys(r)[0]] === stmt._vals?.[0]);
          return row ?? null;
        },
        async run() {
          for (const t of Object.keys(store)) {
            if (sql.includes(`INTO ${t}`)) {
              const cols = sql.match(/\(([^)]+)\)/)?.[1].split(',').map((s) => s.trim()) ?? [];
              const obj: any = {};
              cols.forEach((c, i) => (obj[c] = (stmt._vals ?? [])[i]));
              const key = cols[0];
              const idx = store[t].findIndex((r) => r[key] === obj[key]);
              if (idx >= 0) store[t][idx] = obj;
              else store[t].push(obj);
            }
          }
          return { success: true };
        },
        bind(...vals: any[]) {
          stmt._vals = vals;
          return stmt;
        },
      };
      return stmt;
    },
  };
  return { LOVEDB: db } as any;
}

describe('fhir-bridge', () => {
  let env: any;
  beforeEach(() => (env = makeEnv()));

  it('health reports ok', async () => {
    const res = await app.request('/health', {}, env);
    expect(res.status).toBe(200);
    expect(((await res.json()) as any).service).toBe('fhir-bridge');
  });

  it('creates a Patient from a DID', async () => {
    const res = await app.request('/fhir/Patient', {
      method: 'POST',
      body: JSON.stringify({ did: 'did:web:family.example' }),
    }, env);
    expect(res.status).toBe(201);
    const p = (await res.json()) as any;
    expect(p.resourceType).toBe('Patient');
    expect(p.id).toBe('did:web:family.example');
  });

  it('maps a care proof to a FHIR Observation', async () => {
    const res = await app.request('/fhir/Observation', {
      method: 'POST',
      body: JSON.stringify({
        did: 'did:web:family.example',
        tProx: 42,
        qRes: 0.9,
        tasks: 3,
        entropyRoot: 'abc123',
        timestamp: 1700000000000,
        signature: 'sig-base64',
      }),
    }, env);
    expect(res.status).toBe(201);
    const obs = (await res.json()) as any;
    expect(obs.resourceType).toBe('Observation');
    expect(obs.valueQuantity.value).toBe(42);
    expect(obs.component.length).toBe(2);
    expect(obs.subject.reference).toBe('Patient/did:web:family.example');
  });

  it('returns 400 when Observation missing did', async () => {
    const res = await app.request('/fhir/Observation', {
      method: 'POST',
      body: JSON.stringify({ tProx: 1 }),
    }, env);
    expect(res.status).toBe(400);
  });
});
