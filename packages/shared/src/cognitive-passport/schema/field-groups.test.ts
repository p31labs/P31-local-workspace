import { describe, it, expect } from 'vitest';

import {
  FIELD_GROUPS,
  PROFILE_IDS,
  FIELD_GROUP_LABELS,
  PROFILE_LABELS,
  FIELD_GROUP_MESH_GATED,
  PROFILE_MESH_GATED,
  SCHEMA_VERSION,
  AUDIENCE_MATRIX_VERSION,
} from './field-groups';

describe('field-groups', () => {
  it('exports exactly 18 field groups', () => {
    expect(FIELD_GROUPS.length).toBe(18);
  });

  it('exports exactly 12 profile IDs', () => {
    expect(PROFILE_IDS.length).toBe(12);
  });

  it('every field group has a label', () => {
    for (const fg of FIELD_GROUPS) {
      expect(FIELD_GROUP_LABELS[fg]).toBeDefined();
      expect(FIELD_GROUP_LABELS[fg].length).toBeGreaterThan(0);
    }
  });

  it('every profile has a label', () => {
    for (const pid of PROFILE_IDS) {
      expect(PROFILE_LABELS[pid]).toBeDefined();
      expect(PROFILE_LABELS[pid].length).toBeGreaterThan(0);
    }
  });

  it('mesh-gated field groups exist in FIELD_GROUPS', () => {
    for (const fg of FIELD_GROUP_MESH_GATED) {
      expect(FIELD_GROUPS.includes(fg)).toBe(true);
    }
  });

  it('mesh-gated profiles exist in PROFILE_IDS', () => {
    for (const pid of PROFILE_MESH_GATED) {
      expect(PROFILE_IDS.includes(pid)).toBe(true);
    }
  });

  it('schema version matches expected format', () => {
    expect(SCHEMA_VERSION).toMatch(/^p31\.cognitivePassport\/\d+\.\d+\.\d+$/);
  });

  it('audience matrix version is semver', () => {
    expect(AUDIENCE_MATRIX_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('field group labels are unique', () => {
    const labels = FIELD_GROUPS.map(fg => FIELD_GROUP_LABELS[fg]);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('profile labels are unique', () => {
    const labels = PROFILE_IDS.map(pid => PROFILE_LABELS[pid]);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
