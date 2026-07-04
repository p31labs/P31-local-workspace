#!/usr/bin/env node
/**
 * Locks `@p31/shared/geodesic-room-wire` to `geodesic-room/src/index.ts` wire constants
 * (schema id, shape cap, max WebSocket clients per room).
 *
 * Run: npm run verify:geodesic-room-wire
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const P31CA = resolve(__dir, '..');
const SOFTWARE = resolve(P31CA, '..');

const SHARED = resolve(SOFTWARE, 'packages/shared/src/geodesic-room-wire.ts');
const WORKER = resolve(SOFTWARE, 'geodesic-room/src/index.ts');

function fail(msg) {
  console.error('[FAIL] verify-geodesic-room-wire:', msg);
  process.exit(1);
}
function ok(msg) {
  console.log('[ OK ] verify-geodesic-room-wire:', msg);
}

if (!existsSync(SHARED)) {
  fail(`missing ${SHARED}`);
  process.exit(1);
}
if (!existsSync(WORKER)) {
  fail(`missing ${WORKER}`);
  process.exit(1);
}

const sharedSrc = readFileSync(SHARED, 'utf8');
const workerSrc = readFileSync(WORKER, 'utf8');

const mSharedSchema = sharedSrc.match(
  /export const GEODESIC_ROOM_WIRE_SCHEMA = ['"]([^'"]+)['"]/,
);
const mWorkerSchema = workerSrc.match(
  /const GEODESIC_ROOM_WIRE_SCHEMA = ['"]([^'"]+)['"]/,
);
if (!mSharedSchema || !mWorkerSchema) {
  fail('could not parse GEODESIC_ROOM_WIRE_SCHEMA in shared and/or worker');
  process.exit(1);
}
if (mSharedSchema[1] !== mWorkerSchema[1]) {
  fail(
    `schema mismatch: shared=${mSharedSchema[1]} worker=${mWorkerSchema[1]} — align both to the same p31.geodesicRoomWire/* string`,
  );
  process.exit(1);
}

const mShapeShared = sharedSrc.match(/shapeCap:\s*(\d+)/);
const mShapeWorker = workerSrc.match(/\bSHAPE_CAP\s*=\s*(\d+)/);
if (!mShapeShared || !mShapeWorker || mShapeShared[1] !== mShapeWorker[1]) {
  fail(
    `shape cap mismatch: shared shapeCap=${mShapeShared?.[1]} worker SHAPE_CAP=${mShapeWorker?.[1]}`,
  );
  process.exit(1);
}

const mWsShared = sharedSrc.match(/maxWebSocketClients:\s*(\d+)/);
const mWsWorker = workerSrc.match(/getWebSockets\(\)\.length\s*>=\s*(\d+)/);
if (!mWsShared || !mWsWorker || mWsShared[1] !== mWsWorker[1]) {
  fail(
    `max WebSocket clients mismatch: shared=${mWsShared?.[1]} worker gate=${mWsWorker?.[1]}`,
  );
  process.exit(1);
}

const mStrutShared = sharedSrc.match(/strutCap:\s*(\d+)/);
const mStrutWorker = workerSrc.match(/\bSTRUT_CAP\s*=\s*(\d+)/);
if (!mStrutShared || !mStrutWorker || mStrutShared[1] !== mStrutWorker[1]) {
  fail(
    `strut cap mismatch: shared strutCap=${mStrutShared?.[1]} worker STRUT_CAP=${mStrutWorker?.[1]}`,
  );
  process.exit(1);
}

ok(
  `${mSharedSchema[1]}; SHAPE_CAP=${mShapeShared[1]}; STRUT_CAP=${mStrutShared[1]}; maxWs=${mWsShared[1]} ✓`,
);
