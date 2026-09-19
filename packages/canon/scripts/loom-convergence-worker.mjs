import { parentPort, workerData } from 'node:worker_threads';
import { readEvents } from '../src/loom/jsonl.ts';
import { reduce, initialState } from '../src/loom/events.ts';
import { canonicalize } from '../src/loom/gate.ts';

const { logPath } = workerData;
const events = readEvents(logPath);
let state = initialState();
for (const e of events) state = reduce(state, e);
parentPort.postMessage(canonicalize(state));
