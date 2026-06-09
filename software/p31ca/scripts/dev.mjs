#!/usr/bin/env node
import { spawn } from 'child_process';
import os from 'os';

const isWindows = os.platform() === 'win32';

const astro = spawn(
  isWindows ? 'npm.cmd' : 'npm',
  ['run', 'dev'],
  { stdio: 'inherit' }
);

const cloudflared = spawn(
  'cloudflared',
  ['tunnel', '--url', 'http://localhost:4321'],
  { stdio: 'inherit' }
);

function shutdown() {
  console.log('Shutting down...');
  if (isWindows) {
    // On Windows, we need to kill the processes by their PID
    spawn('taskkill', ['/pid', astro.pid, '/f', '/t']);
    spawn('taskkill', ['/pid', cloudflared.pid, '/f', '/t']);
  } else {
    // On other platforms, sending SIGINT should be enough
    astro.kill('SIGINT');
    cloudflared.kill('SIGINT');
  }
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
