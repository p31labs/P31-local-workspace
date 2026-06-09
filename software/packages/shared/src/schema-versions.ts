/**
 * SCHEMA_VERSIONS — cross-schema version registry for @p31/shared.
 *
 * Single source of truth for all wire protocol schema versions.
 * When any schema bumps, update the entry here. verify:cognitive-passport-schema
 * and verify:cars-wire check these values against deployed artifacts.
 *
 * Format: 'p31.<schemaName>/<semver>' — matches the `as const` strings
 * defined in each individual schema file.
 */

import { COGNITIVE_PASSPORT_SCHEMA } from './cognitive-passport-schema';
import { COGNITIVE_PASSPORT_AUDIENCE_MATRIX_VERSION } from './cognitive-passport-profiles';
import { CARS_WIRE_SCHEMA } from './cars-wire';
import { GEODESIC_BUILD_SNAPSHOT_SCHEMA } from './geodesic-build-snapshot';
import { GEODESIC_ROOM_WIRE_SCHEMA } from './geodesic-room-wire';

export const SCHEMA_VERSIONS = {
  cognitivePassport:              COGNITIVE_PASSPORT_SCHEMA,
  cognitivePassportAudienceMatrix: `p31.cognitivePassportAudienceMatrix/${COGNITIVE_PASSPORT_AUDIENCE_MATRIX_VERSION}` as const,
  carsWire:                       CARS_WIRE_SCHEMA,
  geodesicBuildSnapshot:          GEODESIC_BUILD_SNAPSHOT_SCHEMA,
  geodesicRoomWire:               GEODESIC_ROOM_WIRE_SCHEMA,
} as const;

export type SchemaName = keyof typeof SCHEMA_VERSIONS;
export type SchemaId = (typeof SCHEMA_VERSIONS)[SchemaName];
