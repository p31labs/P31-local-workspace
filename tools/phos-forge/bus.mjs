import { createServer } from 'net';
import { appendFileSync, existsSync, mkdirSync, renameSync, unlinkSync, chmodSync } from 'fs';
import { dirname } from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = '/tmp/phos-forge/events.jsonl';
const SOCKET_PATH = '/tmp/phos-forge/bus.sock';
const MAX_EVENTS = 10000;

// Ensure directory exists
mkdirSync(dirname(LOG_PATH), { recursive: true });

let eventCount = 0;
const listeners = [];

export function emitEvent(type, payload) {
  const event = {
    type,
    payload,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID(),
  };
  const line = JSON.stringify(event) + '\n';

  appendFileSync(LOG_PATH, line);
  eventCount++;

  for (const listener of listeners) {
    try {
      listener.write(line);
    } catch {
      // ignore dead sockets
    }
  }

  if (eventCount > MAX_EVENTS) {
    const rotated = LOG_PATH + '.1';
    if (existsSync(rotated)) unlinkSync(rotated);
    renameSync(LOG_PATH, rotated);
    eventCount = 0;
  }

  return event;
}

// Unix domain socket listener — only when run as main
const IS_MAIN = process.argv[1] === fileURLToPath(import.meta.url);

if (IS_MAIN) {
  const server = createServer((socket) => {
    listeners.push(socket);
    socket.on('close', () => {
      const idx = listeners.indexOf(socket);
      if (idx !== -1) listeners.splice(idx, 1);
    });
    socket.on('error', () => {});
  });

  server.listen(SOCKET_PATH, () => {
    try {
      chmodSync(SOCKET_PATH, 0o666);
    } catch {
      // ignore chmod errors
    }
  });
}

// CLI interface
const args = process.argv.slice(2);
if (args.length >= 2 && args[0] === 'emit') {
  const type = args[1];
  const payloadStr = args.slice(2).join(' ');
  let parsed = {};
  try {
    parsed = JSON.parse(payloadStr);
  } catch {
    parsed = { message: payloadStr };
  }

  const ev = emitEvent(type, parsed);
  console.log(JSON.stringify(ev));
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`📡 PHOS Forge event bus listening on ${SOCKET_PATH}`);
  console.log(`   Events logged to ${LOG_PATH}`);
  console.log('   Usage: node bus.mjs emit <type> <json-payload>');
}
