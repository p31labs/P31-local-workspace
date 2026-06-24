import type { PassportDocument, PassportProfileId } from '@p31/shared/cognitive-passport';
import { filterForAudience } from '@p31/shared/cognitive-passport';

const PHOS_FIELD_GROUPS = ['cog', 'comm', 'pii', 'prof', 'fam'] as const;

export interface PHOSPersonaConfig {
  displayName: string;
  preferredName: string;
  pronouns: string;
  neurotype: string;
  sensorySensitivity: number;
  communicationStyle: string;
  modalityPreference: string;
  relationshipRole: string;
  accessibilityFlags: string[];
  themePreferences: {
    density: 'low' | 'medium' | 'high';
    reducedMotion: boolean;
    contrast: 'normal' | 'high';
  };
}

export interface CogPassPHOSAdapter {
  getPersonaConfig(): PHOSPersonaConfig;
  applyToUI(): void;
  getFieldErrors(): string[];
}

export function createCogPassAdapter(
  passport: PassportDocument,
  profile: PassportProfileId = 'cursor-agent',
): CogPassPHOSAdapter {
  const filtered = filterForAudience(passport, profile);
  const fields = filtered.document.fields;

  const cog = (fields.cog as Record<string, unknown>) ?? {};
  const pii = (fields.pii as Record<string, unknown>) ?? {};
  const comm = (fields.comm as Record<string, unknown>) ?? {};
  const prof = (fields.prof as Record<string, unknown>) ?? {};
  const fam = (fields.fam as Record<string, unknown>) ?? {};

  const errors: string[] = [];
  if (!cog.neurotype) errors.push('No neurotype configured — using defaults');
  if (!pii.givenName) errors.push('No given name — persona display may be generic');

  const personaConfig: PHOSPersonaConfig = {
    displayName: (pii.preferredName as string) ?? (pii.givenName as string) ?? 'Operator',
    preferredName: (pii.preferredName as string) ?? '',
    pronouns: (pii.pronouns as string) ?? '',
    neurotype: (cog.neurotype as string) ?? 'Not specified',
    sensorySensitivity: (cog.sensorySensitivity as number) ?? 5,
    communicationStyle: (cog.communicationStyle as string) ?? 'Direct',
    modalityPreference: (comm.modality_order as string) ?? 'Written (async)',
    relationshipRole: (fam.role as string) ?? (prof.title as string) ?? 'Operator',
    accessibilityFlags: [],
    themePreferences: {
      density: (cog.sensorySensitivity as number) > 7 ? 'low' : 'medium',
      reducedMotion: (cog.sensorySensitivity as number) > 8,
      contrast: (cog.sensorySensitivity as number) > 9 ? 'high' : 'normal',
    },
  };

  return {
    getPersonaConfig: () => personaConfig,
    applyToUI: () => {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;
      root.setAttribute('data-p31-density', personaConfig.themePreferences.density);
      root.setAttribute('data-p31-reduced-motion', String(personaConfig.themePreferences.reducedMotion));
      root.setAttribute('data-p31-contrast', personaConfig.themePreferences.contrast);
      root.setAttribute('data-p31-neurotype', personaConfig.neurotype.toLowerCase().replace(/\s+/g, '-'));
      root.setAttribute('data-p31-sensory', String(personaConfig.sensorySensitivity));
    },
    getFieldErrors: () => errors,
  };
}

export function listenForCogPassChanges(onChange: (adapter: CogPassPHOSAdapter) => void): () => void {
  const handler = () => {
    const raw = localStorage.getItem('p31-cogpass-v1');
    if (!raw) return;
    try {
      const doc = JSON.parse(raw) as PassportDocument;
      const adapter = createCogPassAdapter(doc);
      onChange(adapter);
    } catch {
      // Silently ignore parse errors
    }
  };

  window.addEventListener('storage', handler);
  window.addEventListener('p31:cogpass-loaded', handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('p31:cogpass-loaded', handler);
  };
}
