// Normalize the divergent passport shapes in the repo into a single
// generator-consumable subset of the Cognitive Passport v4.1 schema.
// We intentionally normalize to the SUBSET the generator needs
// (cognition/accessibility/baselineSpoons), not the full v4.1 document.

export function defaultPassport(): any {
  return {
    schemaVersion: 'p31.cognitivePassport/4.1.0',
    identity: { displayName: 'Guest', role: 'OPERATOR' },
    cognition: { processingStyle: 'visual' },
    accessibility: { screenComfort: 50, motionPreference: 'reduced' },
    baselineSpoons: 3,
    did: 'did:key:local',
  };
}

export function normalizePassport(raw: any): any {
  if (!raw || (typeof raw === 'object' && Object.keys(raw).length === 0)) {
    return defaultPassport();
  }
  if (raw.schemaVersion === 'p31.cognitivePassport/4.1.0') return raw;

  // usePassportConsumer.CognitiveProfile (bonding app)
  if (raw.cognitiveStyle) {
    return {
      schemaVersion: 'p31.cognitivePassport/4.1.0',
      identity: { displayName: raw.name || 'User', role: 'OPERATOR' },
      cognition: {
        processingStyle: raw.cognitiveStyle || 'visual',
        executiveFunctionNotes: Array.isArray(raw.triggers) ? raw.triggers.join(', ') : '',
      },
      accessibility: {
        screenComfort: raw.accommodations?.screenComfort ?? 50,
        motionPreference: raw.accommodations?.motionPreference ?? 'reduced',
      },
      baselineSpoons: raw.baselineSpoons ?? 3,
      did: raw.did ?? 'did:key:local',
    };
  }

  // passport-cache.CognitivePassport (edge cache)
  if (raw.operator) {
    return {
      schemaVersion: 'p31.cognitivePassport/4.1.0',
      identity: { displayName: raw.operator || 'User', role: 'OPERATOR' },
      cognition: {
        processingStyle: Array.isArray(raw.cognitive) ? raw.cognitive[0] : 'visual',
      },
      accessibility: { screenComfort: 50, motionPreference: 'reduced' },
      baselineSpoons: 3,
      did: raw.did ?? 'did:key:local',
    };
  }

  return defaultPassport();
}
