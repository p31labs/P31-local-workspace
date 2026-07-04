// workers/fhir/src/alert.ts
// Home Assistant webhook triggers for calcium alerts

import type { Env, CalciumReading } from './types';
import { THRESHOLDS } from './types';
import { estimateForecast } from './fhir';
import { auditLog } from './audit';

export type AlertType = 'critical' | 'warning' | 'forecast';

export interface AlertResult {
  fired: boolean;
  type?: AlertType;
  value: number;
  threshold: number;
  haStatus?: number;
}

/**
 * Evaluate latest reading against thresholds and fire HA webhook if needed.
 * Returns alert result for logging.
 */
export async function evaluateAndAlert(
  env: Env,
  reading: CalciumReading
): Promise<AlertResult> {
  const value = reading.value_mgdl;

  // Check if already alerted for this reading (avoid duplicate HA triggers)
  const existing = await env.DB.prepare(
    `SELECT id FROM alert_history
     WHERE calcium_value = ? AND fired_at > ?`
  ).bind(value, Date.now() - 3_600_000).first();

  if (existing) {
    return { fired: false, value, threshold: THRESHOLDS.CRITICAL };
  }

  // Critical: haptic + urgent HA automation
  if (value < THRESHOLDS.CRITICAL) {
    return fireAlert(env, reading, 'critical', THRESHOLDS.CRITICAL);
  }

  // Warning: HA notification only
  if (value < THRESHOLDS.WARNING) {
    return fireAlert(env, reading, 'warning', THRESHOLDS.WARNING);
  }

  // Forecast check: estimate 6 hours ahead
  const forecast6h = await estimateForecast(env, reading, 6);
  if (forecast6h < THRESHOLDS.FORECAST_WARN) {
    return fireAlert(env, reading, 'forecast', THRESHOLDS.FORECAST_WARN, forecast6h);
  }

  return { fired: false, value, threshold: THRESHOLDS.WARNING };
}

async function fireAlert(
  env: Env,
  reading: CalciumReading,
  type: AlertType,
  threshold: number,
  forecastValue?: number
): Promise<AlertResult> {
  const webhookId = type === 'critical' ? env.HA_WEBHOOK_CRITICAL : env.HA_WEBHOOK_WARNING;
  const displayValue = forecastValue ?? reading.value_mgdl;

  const payload = {
    alert_type: type,
    calcium_value: reading.value_mgdl,
    forecast_value: forecastValue ?? null,
    threshold,
    observation_ts: new Date(reading.observation_ts).toISOString(),
    message: buildAlertMessage(type, reading.value_mgdl, forecastValue),
  };

  let haStatus: number | undefined;
  let haSuccess = false;

  try {
    const res = await fetch(
      `${env.HA_BASE_URL}/api/webhook/${webhookId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      }
    );
    haStatus = res.status;
    haSuccess = res.ok;
  } catch (err) {
    await auditLog(env, 'system', 'alert_fire', 'error', {
      detail: err instanceof Error ? err.message : 'HA webhook unreachable',
    });
  }

  // Record alert in D1 regardless of HA success
  const alertId = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await env.DB.prepare(
    `INSERT INTO alert_history
     (id, alert_type, calcium_value, threshold, ha_triggered, ha_response)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(alertId, type, displayValue, threshold, haSuccess ? 1 : 0, haStatus ?? null).run();

  await auditLog(env, 'system', 'alert_fire', haSuccess ? 'success' : 'error', {
    detail: `${type} alert: Ca=${reading.value_mgdl} mg/dL, HA=${haStatus}`,
  });

  return { fired: true, type, value: displayValue, threshold, haStatus };
}

function buildAlertMessage(type: AlertType, value: number, forecast?: number): string {
  switch (type) {
    case 'critical':
      return `CRITICAL: Serum calcium ${value.toFixed(1)} mg/dL (below 7.8). Take calcium supplement NOW. If symptomatic, call 911.`;
    case 'warning':
      return `Warning: Serum calcium ${value.toFixed(1)} mg/dL (below 8.0). Take calcium supplement. Monitor symptoms.`;
    case 'forecast':
      return `Forecast alert: Current Ca ${value.toFixed(1)} mg/dL. Projected to reach ${forecast?.toFixed(1) ?? '?'} mg/dL in 6 hours. Consider supplement now.`;
  }
}
