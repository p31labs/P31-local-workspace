import type {
  CareProofInput,
  FhirObservation,
  FhirPatient,
  FhirProvenance,
} from './types';

const CARE_METRICS_SYSTEM = 'https://p31ca.org/fhir/codesystem/care-metrics';
const OBSERVATION_CATEGORY = 'http://terminology.hl7.org/CodeSystem/observation-category';

// P31 care proof -> FHIR R5 Observation.
export function toFhirObservation(proof: CareProofInput, id: string): FhirObservation {
  return {
    resourceType: 'Observation',
    id,
    status: 'final',
    category: [
      {
        coding: [
          { system: OBSERVATION_CATEGORY, code: 'survey', display: 'Survey' },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: CARE_METRICS_SYSTEM,
          code: 'care-attestation',
          display: 'Care Attestation',
        },
        ],
    },
    subject: { reference: `Patient/${proof.did}` },
    effectiveDateTime: new Date(proof.timestamp).toISOString(),
    valueQuantity: {
      value: proof.tProx,
      unit: 'care-minutes',
      system: 'http://unitsofmeasure.org',
      code: 'min',
    },
    component: [
      {
        code: { coding: [{ code: 'qRes', display: 'Resonance Quality' }] },
        valueQuantity: { value: proof.qRes, unit: 'coherence' },
      },
      {
        code: { coding: [{ code: 'tasks', display: 'Tasks Completed' }] },
        valueInteger: proof.tasks,
      },
    ],
    performer: [{ reference: `Patient/${proof.did}` }],
    note: [{ text: `Entropy root: ${proof.entropyRoot}` }],
  };
}

// Family identity (DID) -> FHIR R5 Patient.
export function toFhirPatient(did: string): FhirPatient {
  return {
    resourceType: 'Patient',
    id: did,
    identifier: [{ system: 'https://p31ca.org/did', value: did }],
    active: true,
  };
}

// Cryptographic proof -> FHIR R5 Provenance.
export function toFhirProvenance(
  observationId: string,
  did: string,
  signature: string,
): FhirProvenance {
  return {
    resourceType: 'Provenance',
    id: `prov-${observationId}`,
    target: [{ reference: `Observation/${observationId}` }],
    signature: [
      {
        type: { system: 'https://p31ca.org/signature-type', code: 'ml-dsa-65' },
        data: signature,
      },
    ],
  };
}
