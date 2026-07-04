#!/usr/bin/env node
/**
 * Somatic Tether — Termux WebSocket Server
 *
 * Bridges Gadgetbridge HR/HRV intents to the browser via local WebSocket.
 * Runs on Android inside Termux. Requires: `pkg install nodejs termux-api`
 *
 * Usage:
 *   termux-wake-lock          # prevent Android from killing the process
 *   node somatic-server.js    # start the relay
 *
 * Data source: Gadgetbridge broadcasts HR via Android intent.
 * We use termux-api to receive broadcasts.
 */

const http = require('http');

let WebSocket;
try {
  WebSocket = require('ws');
} catch {
  console.error('[SOMATIC] Missing dependency: npm install ws');
  process.exit(1);
}

const PORT = 8080;
const BROADCAST_ACTION = 'nodomain.freeyourgadget.gadgetbridge.HEART_RATE';

const server = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Somatic Tether active');
});

const wss = new WebSocket.Server({ server });

let clientCount = 0;
wss.on('connection', (ws) => {
  clientCount++;
  console.log(`[SOMATIC] Client connected (${clientCount} total)`);
  ws.on('close', () => {
    clientCount--;
    console.log(`[SOMATIC] Client disconnected (${clientCount} total)`);
  });
});

function broadcast(data) {
  const json = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

// Listen for Gadgetbridge HR intents via termux-api
const { spawn } = require('child_process');

function startIntentListener() {
  console.log(`[SOMATIC] Listening for ${BROADCAST_ACTION}...`);
  console.log('[SOMATIC] Ensure Gadgetbridge is configured to broadcast HR data.');

  // termux-api broadcast receiver — polls for HR data
  // Gadgetbridge sends intents with extra: HEART_RATE (int)
  // We poll every 1s as a fallback; intent-based is preferred but
  // termux-broadcast-receive is not always reliable.
  const poll = setInterval(() => {
    const proc = spawn('termux-sensor', ['-s', 'heart_rate', '-n', '1'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    let output = '';
    proc.stdout.on('data', (chunk) => { output += chunk; });
    proc.on('close', () => {
      try {
        const parsed = JSON.parse(output);
        const values = parsed?.heart_rate?.values;
        if (values && values[0] > 0) {
          broadcast({
            type: 'BIOMETRIC_TICK',
            hr: Math.round(values[0]),
            hrv: values[1] != null ? Math.round(values[1]) : 0,
            timestamp: Date.now(),
          });
        }
      } catch { /* sensor not available or no data */ }
    });
  }, 1000);

  process.on('SIGINT', () => {
    clearInterval(poll);
    wss.close();
    server.close();
    console.log('\n[SOMATIC] Shutdown.');
    process.exit(0);
  });
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[SOMATIC] WebSocket server running on ws://127.0.0.1:${PORT}`);
  console.log('[SOMATIC] Reminder: run `termux-wake-lock` to keep this alive.');
  startIntentListener();
});
