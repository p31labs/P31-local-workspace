// workers/fhir/src/fhir.ts
// Epic FHIR R4 client — serum calcium Observations (LOINC 2000-8)

import type { Env, FHIRBundle, FHIRObservation, CalciumReading } from './types';
import { CALCIUM_LOINC } from './types';
import { auditLog } from './audit';

/**
 * Pull serum calcium Observations from Epic FHIR.
 * Returns new readings not already stored in D1.
 */
export async function pullCalciumObservations(
  env: Env,
  accessToken: string,
  patientId: string,
  count = 10
): Promise<CalciumReading[]> {
  const params = new URLSearchParams({
    patient: patientId,
    code: `http://loinc.org|${CALCIUM_LOINC}`,
    _sort: '-date',
    _count: String(count),
    category: 'laboratory',
  });

  const res = await fetch(
    `${env.EPIC_FHIR_BASE_URL}/Observation?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
      signal: AbortSignal.timeout(15_000),
    }
  );

  if (!res.ok) {
    await auditLog(env, 'cron', 'lab_pull', 'error', {
      resource: 'Observation',
      detail: `HTTP ${res.status}`,
    });
    throw new Error(`FHIR pull failed: ${res.status}`);
  }

  const bundle = await res.json() as FHIRBundle;
  const entries = bundle.entry ?? [];

  await auditLog(env, 'cron', 'lab_pull', 'success', {
    resource: 'Observation',
    detail: `${entries.length} observations retrieved`,
  });

  const readings: CalciumReading[] = [];

  for (const { resource: obs } of entries) {
    const reading = parseObservation(obs);
    if (!reading) continue;

    // Only store final/amended results with numeric values
    const stored = await storeReading(env, reading);
    if (stored) readings.push(reading);
  }

  return readings;
}

function parseObservation(obs: FHIRObservation): CalciumReading | null {
  if (!obs.valueQuantity?.value) return null;
  if (!['final', 'amended', 'corrected'].includes(obs.status)) return null;

  const effectiveTs = obs.effectiveDateTime ?? obs.effectivePeriod?.start;
  if (!effectiveTs) return null;

  const valueMgdl = normalizeToMgdl(obs.valueQuantity.value, obs.valueQuantity.unit);
  if (valueMgdl === null) return null;

  return {
    id: obs.id,
    observation_ts: new Date(effectiveTs).getTime(),
    value_mgdl: valueMgdl,
    reference_low: 8.5,
    reference_high: 10.5,
    status: obs.status,
    pulled_at: Date.now(),
  };
}

// Normalize to mg/dL — Epic may return mmol/L
function normalizeToMgdl(value: number, unit: string): number | null {
  const u = unit.toLowerCase().replace(/\s/g, '');
  if (u === 'mg/dl' || u === 'mg/dl[mass/volume]') return value;
  if (u === 'mmol/l' || u === 'mmol/l[moles/volume]') return value * 4.008;  // Ca: 1 mmol/L = 4.008 mg/dL
  if (u === 'meq/l') return value * 2.004;  // Ca: 1 mEq/L = 2.004 mg/dL
  // Unknown unit — skip rather than store wrong value
  return null;
}

// Returns true if this was a new reading (not already in DB)
async function storeReading(env: Env, reading: CalciumReading): Promise<boolean> {
  const existing = await env.DB.prepare(
    'SELECT id FROM calcium_readings WHERE id = ?'
  ).bind(reading.id).first();

  if (existing) return false;

  await env.DB.prepare(
    `INSERT INTO calcium_readings
     (id, observation_ts, value_mgdl, reference_low, reference_high, status, pulled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    reading.id,
    reading.observation_ts,
    reading.value_mgdl,
    reading.reference_low,
    reading.reference_high,
    reading.status,
    reading.pulled_at
  ).run();

  return true;
}

/**
 * Get the most recent N calcium readings from D1.
 */
export async function getRecentReadings(env: Env, limit = 5): Promise<CalciumReading[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM calcium_readings ORDER BY observation_ts DESC LIMIT ?'
  ).bind(limit).all<CalciumReading>();
  return result.results;
}

/**
 * Estimate current calcium based on last reading + medication timing.
 * Conservative model: if unsure, assume lower (triggers alert sooner).
 *
 * Physiology notes (not medical advice — for alert estimation only):
 * - Without calcitriol: serum Ca drops ~0.05-0.15 mg/dL per hour in hypoparathyroidism
 * - Calcitriol (active D) raises absorption over 12-24h, not immediately
 * - Oral calcium carbonate raises serum Ca by ~0.3-0.5 mg/dL within 1-2h
 * - Estimate is a conservative floor; real monitoring requires lab confirmation
 */
export async function estimateForecast(
  env: Env,
  lastReading: CalciumReading,
  hoursAhead: number
): Promise<number> {
  const hoursSinceLab = (Date.now() - lastReading.observation_ts) / 3_600_000;
  const totalHours = hoursSinceLab + hoursAhead;

  // Pull calcitriol doses in last 24h (active dose: taken=1)
  const dosesResult = await env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM medication_log
     WHERE medication = 'calcitriol' AND taken = 1
       AND logged_at > ?`
  ).bind(Date.now() - 86_400_000).first<{ cnt: number }>();

  const calcitriolDoses = dosesResult?.cnt ?? 0;

  // Pull calcium carbonate in last 4h
  const carbResult = await env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM medication_log
     WHERE medication = 'calcium_carbonate' AND taken = 1
       AND logged_at > ?`
  ).bind(Date.now() - 14_400_000).first<{ cnt: number }>();

  const carbDoses = carbResult?.cnt ?? 0;

  // Conservative drop rate: 0.08 mg/dL per hour without treatment
  const baseDrop = totalHours * 0.08;

  // Calcitriol effect: absorbed over 12-24h, ~0.3 mg/dL per dose (conservative)
  const calcitriolEffect = Math.min(calcitriolDoses * 0.3, 1.0);

  // Calcium carbonate: short-acting, ~0.25 mg/dL per dose, fades after 2h
  const carbEffect = carbDoses > 0 ? Math.min(carbDoses * 0.25, 0.5) : 0;

  const estimate = lastReading.value_mgdl - baseDrop + calcitriolEffect + carbEffect;

  // Floor at 7.0 — below this the model is meaningless and clinical emergency applies
  return Math.max(7.0, estimate);
}

/**
 * Export all calcium readings in FHIR Bundle format (patient portability).
 */
export async function exportFHIRBundle(env: Env): Promise<FHIRBundle> {
  const readings = await env.DB.prepare(
    'SELECT * FROM calcium_readings ORDER BY observation_ts DESC'
  ).all<CalciumReading>();

  await auditLog(env, 'operator', 'export', 'success', {
    resource: 'Observation',
    detail: `Exported ${readings.results.length} calcium readings`,
  });

  return {
    resourceType: 'Bundle',
    total: readings.results.length,
    entry: readings.results.map(r => ({
      resource: {
        resourceType: 'Observation',
        id: r.id,
        status: r.status as FHIRObservation['status'],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: CALCIUM_LOINC,
            display: 'Calcium [Mass/volume] in Serum or Plasma',
          }],
        },
        effectiveDateTime: new Date(r.observation_ts).toISOString(),
        valueQuantity: {
          value: r.value_mgdl,
          unit: 'mg/dL',
          system: 'http://unitsofmeasure.org',
          code: 'mg/dL',
        },
      },
    })),
  };
}
