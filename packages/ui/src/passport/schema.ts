/**
 * @file schema — TypeScript types mirroring
 * `software/packages/shared/src/schemas/passport.schema.json` v4.1.0,
 * extended with an optional `face` (deterministic SVG identicon string).
 *
 * Keep this in sync with the JSON schema; the `face` field is a P31 extension
 * not yet in the canonical contract.
 */

export type Role = 'SYSTEM_CORE' | 'PARENT_A' | 'PARENT_B' | 'CHILD' | 'OPERATOR';

export interface PassportIdentity {
  displayName?: string;
  pronouns?: string;
  role?: Role;
  oneLiner?: string;
}

export interface PassportCognition {
  processingStyle?: string;
  learningPreference?: 'visual' | 'kinetic' | 'text' | 'audio' | 'multimodal';
  executiveFunctionNotes?: string;
  strengths?: string[];
  challenges?: string[];
}

export interface PassportCommunication {
  preferredTone?: 'direct' | 'gentle' | 'analytical' | 'casual' | 'formal';
  avoidList?: string[];
  responseLength?: 'concise' | 'detailed' | 'bullet-points';
  languagePrimary?: string;
}

export interface PassportAccessibility {
  screenComfort: number;
  motionPreference: 'off' | 'reduced' | 'full';
  contrastPreference: 'high' | 'standard' | 'low';
  fontSize: number;
  density: number;
  colorSensitivity?: string[];
  audioPreference?: 'off' | 'reduced' | 'full';
  temperaturePreference?: number;
}

export interface PassportExportProfiles {
  clinical?: boolean;
  family?: boolean;
  public?: boolean;
  workplace?: boolean;
  grantReviewer?: boolean;
  legal?: boolean;
  financial?: boolean;
  emergency?: boolean;
  educator?: boolean;
  device?: boolean;
  app?: boolean;
  guest?: boolean;
}

export interface CognitivePassport {
  identity: PassportIdentity;
  cognition?: PassportCognition;
  communication?: PassportCommunication;
  accessibility: PassportAccessibility;
  baselineSpoons?: number;
  created: string;
  updated?: string;
  did: string;
  publicKey?: string;
  exportProfiles?: PassportExportProfiles;
  /** P31 extension: deterministic SVG identicon seeded by `did`. */
  face?: string;
}

export interface PassportBundle {
  identity: {
    did: string;
    publicKey: string;
    privateKeyJwk: JsonWebKey;
    publicKeyJwk: JsonWebKey;
  };
  passport: CognitivePassport;
}
