/**
 * Q-Factor Coherence Algorithm — P31 Labs
 * EXEC-09 / Gap H — Quadrant-Aware Cognitive Load Modeling
 *
 * Maps biometric + context inputs to a 2D arousal/valence space,
 * outputs a cognitive load score and recommendations for
 * BONDING game difficulty + HA automation triggers.
 *
 * Quadrant model (Russell's Circumplex):
 *   Q1 (+arousal, +valence): Flow/engaged  → optimal task load
 *   Q2 (+arousal, −valence): Anxious/stress → reduce load
 *   Q3 (−arousal, −valence): Exhausted     → minimal tasks
 *   Q4 (−arousal, +valence): Calm/recovery → creative, low-demand
 */

// ── Input types ───────────────────────────────────────────────────────────

export interface QFactorInputs {
  // HRV (Bangle.js 2 via GadgetBridge → HA → here)
  hrvRmssd?: number;        // ms, normal range 20-100+

  // Activity (Bangle.js step count + HA motion sensors)
  activityLevel?: number;   // 0-1 (0=sedentary, 1=vigorous)

  // Spoon economy (BONDING / spoon-calculator)
  spoonBalance?: number;    // current spoons remaining (0-10 typical)
  spoonMax?: number;        // max spoons today (default 10)

  // Medical (FHIR calcium worker)
  calciumMgDl?: number;     // serum Ca mg/dL (8.0-9.0 safe)
  medAdherenceScore?: number; // 0-1 (1 = all meds taken on time)

  // Circadian (time-of-day context)
  hourUTC?: number;         // 0-23

  // Social / context (optional)
  socialConnectivity?: number; // 0-1 (1 = recently bonded with family)
  recentStressor?: boolean;    // true if legal/medical event in last 24h

  // Override: manual spoon tier (HIGH/MEDIUM/LOW/MINIMAL)
  spoonTier?: SpoonTier;
}

export type SpoonTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';

export type QQuadrant = 'Q1_FLOW' | 'Q2_ANXIOUS' | 'Q3_EXHAUSTED' | 'Q4_CALM';

export interface QFactorOutput {
  // Core scores (0-100)
  arousal: number;
  valence: number;
  qScore: number;        // composite 0-100 (100 = ideal flow)
  cognitiveLoad: number; // 0-100 (100 = max load, needs reduction)

  // Quadrant
  quadrant: QQuadrant;
  quadrantLabel: string;

  // Game difficulty (BONDING)
  bondingDifficulty: 'GENTLE' | 'EASY' | 'NORMAL' | 'HARD';

  // HA automation recommendations
  haPayload: {
    spoonTier: SpoonTier;
    hapticPattern: 'none' | 'gentle' | 'alert' | 'urgent';
    lightScene: string;
    notificationLevel: 'silent' | 'normal' | 'priority';
  };

  // Calcium context
  calciumStatus: 'critical' | 'warning' | 'normal' | 'unknown';

  // Human-readable
  summary: string;
  recommendations: string[];

  // Debug
  _inputs: QFactorInputs;
  _computed: Record<string, number>;
}

// ── Constants ─────────────────────────────────────────────────────────────

const HRV_LOW = 25;   // ms — below this: high arousal (stress)
const HRV_HIGH = 65;  // ms — above this: low arousal (calm/recovery)

const CA_CRITICAL = 7.8;
const CA_WARNING = 8.0;
const CA_NORMAL_LOW = 8.5;

// Circadian arousal curve (empirical)
// Peak at ~10am, trough at ~3pm and ~3am
const CIRCADIAN_AROUSAL: Record<number, number> = {
  0: 20, 1: 15, 2: 10, 3: 10, 4: 15, 5: 25,
  6: 45, 7: 60, 8: 72, 9: 80, 10: 85, 11: 83,
  12: 78, 13: 72, 14: 65, 15: 55, 16: 60, 17: 65,
  18: 68, 19: 65, 20: 58, 21: 48, 22: 38, 23: 28,
};

// ── Helpers ───────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t);
}

// ── Arousal computation ───────────────────────────────────────────────────

function computeArousal(inputs: QFactorInputs): { arousal: number; components: Record<string, number> } {
  const components: Record<string, number> = {};

  // HRV component (inverted: low HRV = high arousal = stress)
  let hrvArousal = 50;
  if (inputs.hrvRmssd !== undefined) {
    if (inputs.hrvRmssd <= HRV_LOW) {
      hrvArousal = lerp(90, 75, (inputs.hrvRmssd - 5) / (HRV_LOW - 5));
    } else if (inputs.hrvRmssd >= HRV_HIGH) {
      hrvArousal = lerp(30, 15, (inputs.hrvRmssd - HRV_HIGH) / 40);
    } else {
      hrvArousal = lerp(75, 30, (inputs.hrvRmssd - HRV_LOW) / (HRV_HIGH - HRV_LOW));
    }
  }
  components.hrv = clamp(hrvArousal);

  // Activity component (high activity = high arousal)
  const actArousal = (inputs.activityLevel ?? 0.3) * 80 + 10;
  components.activity = clamp(actArousal);

  // Circadian component
  const hour = inputs.hourUTC ?? new Date().getUTCHours();
  components.circadian = CIRCADIAN_AROUSAL[hour] ?? 50;

  // Weighted average
  const weights = { hrv: 0.50, activity: 0.25, circadian: 0.25 };
  const arousal = clamp(
    components.hrv * weights.hrv +
    components.activity * weights.activity +
    components.circadian * weights.circadian
  );

  return { arousal, components };
}

// ── Valence computation ───────────────────────────────────────────────────

function computeValence(inputs: QFactorInputs): { valence: number; components: Record<string, number> } {
  const components: Record<string, number> = {};

  // Spoon component (more spoons = more positive valence)
  const spoonRatio = (inputs.spoonBalance ?? 5) / (inputs.spoonMax ?? 10);
  components.spoons = clamp(spoonRatio * 80 + 10);

  // Calcium component (safe range = positive, critical = very negative)
  let calciumValence = 60;
  if (inputs.calciumMgDl !== undefined) {
    if (inputs.calciumMgDl < CA_CRITICAL) {
      calciumValence = 5;
    } else if (inputs.calciumMgDl < CA_WARNING) {
      calciumValence = 25;
    } else if (inputs.calciumMgDl < CA_NORMAL_LOW) {
      calciumValence = 55;
    } else {
      calciumValence = 75;
    }
  }
  components.calcium = clamp(calciumValence);

  // Med adherence (took meds on time = positive)
  const medValence = (inputs.medAdherenceScore ?? 0.8) * 70 + 15;
  components.medAdherence = clamp(medValence);

  // Social connectivity (bonded recently = positive)
  const socialValence = (inputs.socialConnectivity ?? 0.5) * 50 + 25;
  components.social = clamp(socialValence);

  // Active stressor penalty
  const stressorPenalty = inputs.recentStressor ? -25 : 0;
  components.stressorPenalty = stressorPenalty;

  // Weighted average
  const weights = { spoons: 0.35, calcium: 0.30, medAdherence: 0.15, social: 0.20 };
  const valence = clamp(
    components.spoons * weights.spoons +
    components.calcium * weights.calcium +
    components.medAdherence * weights.medAdherence +
    components.social * weights.social +
    stressorPenalty
  );

  return { valence, components };
}

// ── Spoon tier from balance ───────────────────────────────────────────────

function calciumStatus(mg: number | undefined): QFactorOutput['calciumStatus'] {
  if (mg === undefined) return 'unknown';
  if (mg < CA_CRITICAL) return 'critical';
  if (mg < CA_WARNING) return 'warning';
  return 'normal';
}

function spoonTierFromBalance(balance: number, max: number): SpoonTier {
  const ratio = balance / max;
  if (ratio >= 0.7) return 'HIGH';
  if (ratio >= 0.4) return 'MEDIUM';
  if (ratio >= 0.15) return 'LOW';
  return 'MINIMAL';
}

function classifyQuadrant(arousal: number, valence: number): QQuadrant {
  const highArousal = arousal >= 50;
  const positiveValence = valence >= 50;
  if (highArousal && positiveValence) return 'Q1_FLOW';
  if (highArousal && !positiveValence) return 'Q2_ANXIOUS';
  if (!highArousal && !positiveValence) return 'Q3_EXHAUSTED';
  return 'Q4_CALM';
}

const QUADRANT_LABELS: Record<QQuadrant, string> = {
  Q1_FLOW: 'Flow / Engaged',
  Q2_ANXIOUS: 'Anxious / Stressed',
  Q3_EXHAUSTED: 'Exhausted / Depleted',
  Q4_CALM: 'Calm / Recovery',
};

// ── Q-Score: distance from ideal (Q1 center) ─────────────────────────────

function computeQScore(arousal: number, valence: number): number {
  // Ideal point: arousal=70, valence=75 (Q1, but not at maximum arousal — sustainable flow)
  const idealArousal = 70, idealValence = 75;
  const dist = Math.sqrt((arousal - idealArousal) ** 2 + (valence - idealValence) ** 2);
  const maxDist = Math.sqrt(idealArousal ** 2 + idealValence ** 2); // max distance from ideal
  return clamp(100 - (dist / maxDist) * 100);
}

// ── BONDING difficulty ────────────────────────────────────────────────────

function bondingDifficulty(quadrant: QQuadrant, qScore: number): QFactorOutput['bondingDifficulty'] {
  if (quadrant === 'Q3_EXHAUSTED' || qScore < 25) return 'GENTLE';
  if (quadrant === 'Q4_CALM' || qScore < 45) return 'EASY';
  if (quadrant === 'Q1_FLOW' && qScore >= 65) return 'HARD';
  return 'NORMAL';
}

// ── HA payload ────────────────────────────────────────────────────────────

function haPayload(
  tier: SpoonTier,
  quadrant: QQuadrant,
  caStatus: QFactorOutput['calciumStatus']
): QFactorOutput['haPayload'] {
  const haptic: Record<string, QFactorOutput['haPayload']['hapticPattern']> = {
    Q1_FLOW: 'none',
    Q2_ANXIOUS: 'gentle',
    Q3_EXHAUSTED: 'gentle',
    Q4_CALM: 'none',
  };

  const lightScenes: Record<SpoonTier, string> = {
    HIGH: 'bright_energizing',
    MEDIUM: 'neutral_daylight',
    LOW: 'warm_dim',
    MINIMAL: 'circadian_minimum',
  };

  const notif: Record<SpoonTier, QFactorOutput['haPayload']['notificationLevel']> = {
    HIGH: 'normal',
    MEDIUM: 'normal',
    LOW: 'silent',
    MINIMAL: 'silent',
  };

  return {
    spoonTier: tier,
    hapticPattern: caStatus === 'critical' ? 'urgent'
                 : caStatus === 'warning'  ? 'alert'
                 : haptic[quadrant],
    lightScene: lightScenes[tier],
    notificationLevel: notif[tier],
  };
}

// ── Recommendations ───────────────────────────────────────────────────────

function recommendations(
  quadrant: QQuadrant,
  tier: SpoonTier,
  caStatus: QFactorOutput['calciumStatus']
): string[] {
  const recs: string[] = [];

  if (caStatus === 'critical') recs.push('CALCIUM CRITICAL — take supplement now, contact provider');
  if (caStatus === 'warning') recs.push('Calcium low — take supplement with food');

  if (quadrant === 'Q3_EXHAUSTED') {
    recs.push('Energy very low — rest, no complex tasks');
    if (tier === 'MINIMAL') recs.push('Spoons at minimum — delegate or defer all non-critical tasks');
  } else if (quadrant === 'Q2_ANXIOUS') {
    recs.push('Arousal high, valence low — grounding recommended');
    recs.push('Box breathing: 4-4-4-4 before any communication');
  } else if (quadrant === 'Q1_FLOW') {
    recs.push('Optimal state — good time for complex cognitive work');
  } else if (quadrant === 'Q4_CALM') {
    recs.push('Low arousal, positive — ideal for creative or relational tasks');
  }

  if (tier === 'LOW') recs.push('Conserve spoons — skip optional social obligations');
  if (tier === 'MINIMAL') recs.push('MINIMAL spoon mode — emergency tasks only');

  return recs;
}

// ── Main export ───────────────────────────────────────────────────────────

export function computeQFactor(inputs: QFactorInputs): QFactorOutput {
  const overrideTier = inputs.spoonTier;

  const { arousal, components: arousalC } = computeArousal(inputs);
  const { valence, components: valenceC } = computeValence(inputs);
  const qScore = computeQScore(arousal, valence);
  const cognitiveLoad = clamp(100 - qScore + (arousal > 70 && valence < 40 ? 20 : 0));

  const quadrant = classifyQuadrant(arousal, valence);
  const spoonMax = inputs.spoonMax ?? 10;
  const tier = overrideTier ?? spoonTierFromBalance(inputs.spoonBalance ?? 5, spoonMax);
  const caStatus = calciumStatus(inputs.calciumMgDl);

  const summary = `${QUADRANT_LABELS[quadrant]} | Q-Score ${Math.round(qScore)} | Load ${Math.round(cognitiveLoad)} | ${tier} spoons${
    caStatus !== 'normal' && caStatus !== 'unknown' ? ` | Ca ${caStatus.toUpperCase()}` : ''
  }`;

  return {
    arousal: Math.round(arousal),
    valence: Math.round(valence),
    qScore: Math.round(qScore),
    cognitiveLoad: Math.round(cognitiveLoad),
    quadrant,
    quadrantLabel: QUADRANT_LABELS[quadrant],
    bondingDifficulty: bondingDifficulty(quadrant, qScore),
    haPayload: haPayload(tier, quadrant, caStatus),
    calciumStatus: caStatus,
    summary,
    recommendations: recommendations(quadrant, tier, caStatus),
    _inputs: inputs,
    _computed: { ...arousalC, ...valenceC, arousal, valence, qScore },
  };
}
