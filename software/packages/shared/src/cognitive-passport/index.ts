export { FIELD_GROUPS, PROFILE_IDS, FIELD_GROUP_LABELS, FIELD_GROUP_DESCRIPTIONS, PROFILE_LABELS, FIELD_GROUP_MESH_GATED, PROFILE_MESH_GATED, SCHEMA_VERSION, AUDIENCE_MATRIX_VERSION } from './schema/field-groups';
export type { FieldGroup, PassportProfileId } from './schema/field-groups';

export { AUDIENCE_MATRIX, matrixCellToExportRule, exportRulesForProfile, filterForAudience, requiresSerializationProfile } from './schema/audience-filter';
export type { MatrixCell, ExportRule, PassportDocument, AudienceFilterResult } from './schema/audience-filter';

export { validateFieldGroup, validatePassport, compose, required, pattern, maxLength, minLength, isEnum, range, isType } from './schema/validators';
export type { FieldError, Validator } from './schema/validators';

export { normalize, isVersionSupported, registerMigration } from './schema/schema-versions';
export type { SchemaVersion, SchemaMigration } from './schema/schema-versions';

export { computeGenesisHash, verifyGenesisHash, type GenesisAttestation } from './crypto/genesis';
export { generateEd25519Keypair, signPassport, verifySignature, type PassportSignature } from './crypto/sign';
export { generateKeypairCLI, exportPublicKey, type P31Keypair } from './crypto/keygen';
