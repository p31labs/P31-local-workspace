import type { PassportDocument } from './audience-filter';

export type SchemaVersion = string;

export interface SchemaMigration {
  from: SchemaVersion;
  to: SchemaVersion;
  migrate(doc: unknown): unknown;
}

const MIGRATIONS: SchemaMigration[] = [];

export function registerMigration(migration: SchemaMigration): void {
  MIGRATIONS.push(migration);
}

export function getMigrationPath(from: SchemaVersion, to: SchemaVersion): SchemaMigration[] {
  return MIGRATIONS.filter(m => m.from === from && m.to === to);
}

export function normalize(passport: unknown): PassportDocument {
  if (!passport || typeof passport !== 'object') {
    throw new Error('Invalid passport: must be an object');
  }
  const doc = passport as Record<string, unknown>;
  const version = (doc.schema_version as string) ?? 'p31.cognitivePassport/1.0.0';

  let migrated = doc;
  if (version === 'p31.cognitivePassport/1.0.0') {
    migrated = migrateV1ToV11(migrated);
  }

  if (!migrated.fields || typeof migrated.fields !== 'object') {
    migrated.fields = {};
  }
  if (!migrated.profile) {
    migrated.profile = 'public';
  }
  if (!migrated.schema_version) {
    migrated.schema_version = 'p31.cognitivePassport/1.1.0';
  }
  if (!migrated.audience_matrix_version) {
    migrated.audience_matrix_version = '1.0.0';
  }

  return migrated as unknown as PassportDocument;
}

function migrateV1ToV11(doc: Record<string, unknown>): Record<string, unknown> {
  const fields = (doc.fields as Record<string, unknown>) ?? {};
  const provenance = (doc.provenance as Record<string, unknown>) ?? {};

  return {
    schema_version: 'p31.cognitivePassport/1.1.0',
    audience_matrix_version: '1.0.0',
    profile: doc.profile ?? 'public',
    fields: {
      ...fields,
      ...(provenance.hash_sha256 ? { gen: provenance } : {}),
    },
    provenance: {
      hash_sha256: provenance.hash_sha256 ?? '',
      iso_timestamp: provenance.iso_timestamp ?? new Date().toISOString(),
      schema_id: 'p31.cognitivePassport/1.1.0',
      migrated_from: '1.0.0',
    },
  };
}

export const SUPPORTED_VERSIONS: SchemaVersion[] = [
  'p31.cognitivePassport/1.0.0',
  'p31.cognitivePassport/1.1.0',
];

export function isVersionSupported(version: string): boolean {
  return SUPPORTED_VERSIONS.includes(version);
}
