/**
 * @p31/canon — loom/profiles.ts
 *
 * The human profile store. Lives OUTSIDE the append-only event log — the log
 * is an artifact record, not a person record. Age, gender, neurotype, digital
 * literacy, pronouns, and display names are never written to the log; only an
 * optional `humanId` reference rides on human-authored events, and the canvas
 * resolves it against this store to adapt presentation.
 *
 * Seal-safety by construction: this module takes an ABSOLUTE profiles
 * directory from its caller and never derives it from the log path. The seal
 * gate (`check-loom-seal.mjs`) only flags writes that target
 * `LOOM_LOG` / `resolveLogPath()` / `events.jsonl`. A write to
 * `.loom/profiles/<id>.json` is a separate store, not a hidden log append, so
 * the seal is not involved.
 *
 * Storage: `<absProfilesDir>/<id>.json`, one file per human, keyed by the
 * stable opaque `id` (not a name — a name is display data, not identity).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

export interface HumanProfile {
  /** Stable opaque id. Never a display name. */
  id: string;
  displayName?: string;
  /** Free-form, e.g. "they/them". No default; absent means "not set". */
  pronouns?: string;
  /** Presentation preferences. All optional; defaults are the neutral baseline. */
  presentation?: {
    letterSpacing?: 'normal' | 'wide' | 'extra-wide';
    lineSpacing?: 'normal' | 'loose';
    motion?: 'full' | 'reduced' | 'none';
    density?: 'compact' | 'comfortable' | 'spacious';
    colorSaturation?: 'normal' | 'muted';
    literalLabels?: boolean;
  };
  /** Coarse tier for progressive disclosure. Fluid — the canvas may promote. */
  tier?: 'beginner' | 'intermediate' | 'advanced';
  /** Consent flags. Nothing is shared with agents unless true. */
  shareWithAgents?: {
    tier: boolean;
    presentation: boolean;
  };
}

/** Read a profile, or null when the id has no file. */
export function readProfile(absProfilesDir: string, id: string): HumanProfile | null {
  const path = `${absProfilesDir}/${id}.json`;
  try {
    const text = readFileSync(path, 'utf8');
    const parsed = JSON.parse(text) as HumanProfile;
    return { ...parsed, id };
  } catch {
    return null;
  }
}

/** Write a profile (id is taken from the profile, not the path). */
export function writeProfile(absProfilesDir: string, profile: HumanProfile): void {
  const path = `${absProfilesDir}/${profile.id}.json`;
  mkdirSync(absProfilesDir, { recursive: true });
  writeFileSync(path, JSON.stringify(profile, null, 2));
}
