// workers/fhir/src/types.ts

export interface Env {
  DB: D1Database;
  FHIR_TOKENS: KVNamespace;

  // Epic SMART on FHIR app credentials
  EPIC_CLIENT_ID: string;
  EPIC_CLIENT_SECRET: string;
  EPIC_FHIR_BASE_URL: string;    // e.g. https://fhir.ufhealth.org/arg/fhir/r4
  EPIC_OAUTH_BASE_URL: string;   // e.g. https://fhir.ufhealth.org/oauth2

  // Redirect URI registered with Epic app
  FHIR_REDIRECT_URI: string;    // https://api.p31ca.org/fhir/callback

  // Home Assistant webhook for calcium alerts
  HA_BASE_URL: string;          // https://home.p31ca.org
  HA_WEBHOOK_CRITICAL: string;  // webhook id for calcium < 7.8
  HA_WEBHOOK_WARNING: string;   // webhook id for calcium < 8.0

  // Worker auth
  P31_API_SECRET: string;
}

// FHIR R4 Observation (partial — only fields we need)
export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled';
  code: {
    coding: Array<{ system: string; code: string; display?: string }>;
  };
  effectiveDateTime?: string;
  effectivePeriod?: { start: string; end?: string };
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  total: number;
  entry?: Array<{ resource: FHIRObservation }>;
}

export interface TokenRow {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  patient_id: string;
  updated_at: number;
}

export interface CalciumReading {
  id: string;
  observation_ts: number;
  value_mgdl: number;
  reference_low: number;
  reference_high: number;
  status: string;
  pulled_at: number;
}

// Calcium alert thresholds
export const THRESHOLDS = {
  CRITICAL: 7.8,   // haptic on Node Zero + HA critical automation
  WARNING: 8.0,    // HA warning notification
  FORECAST_WARN: 8.2,  // trigger if 6hr forecast drops below this
  NORMAL_LOW: 8.5,
} as const;

// LOINC code for serum calcium
export const CALCIUM_LOINC = '2000-8';
