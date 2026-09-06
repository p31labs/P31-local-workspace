// Minimal FHIR R5 resource shapes used by the bridge.
// (Full HL7 FHIR R5 is large; we model only what the care
// attestation mapping needs.)

export interface FhirObservation {
  resourceType: 'Observation';
  id?: string;
  status: 'final' | 'preliminary' | 'amended';
  category: { coding: { system: string; code: string; display: string }[] }[];
  code: {
    coding: { system: string; code: string; display: string }[];
  };
  subject: { reference: string };
  effectiveDateTime?: string;
  valueQuantity?: { value: number; unit: string; system?: string; code?: string };
  component?: {
    code: { coding: { code: string; display?: string }[] };
    valueQuantity?: { value: number; unit: string };
    valueInteger?: number;
  }[];
  performer?: { reference: string }[];
  note?: { text: string }[];
}

export interface FhirPatient {
  resourceType: 'Patient';
  id: string;
  identifier?: { system: string; value: string }[];
  active?: boolean;
}

export interface FhirProvenance {
  resourceType: 'Provenance';
  id: string;
  target: { reference: string }[];
  signature?: { type: { system: string; code: string }; data: string }[];
}

export interface CareProofInput {
  did: string;
  tProx: number;
  qRes: number;
  tasks: number;
  entropyRoot: string;
  timestamp: number;
}
