// Supervised stdio MCP client. Spawns a child MCP server and proxies
// JSON-RPC over stdio. Persistent ('stream') backends keep the child
// alive and correlate responses by id; 'batch' backends are spawned
// fresh per request (stdin closed after write). Crashed children are
// restarted with exponential backoff up to maxRestarts, then marked
// unhealthy and excluded from routing (spec MCP_MONETIZATION_GATEWAY §1.2).
import { spawn } from 'node:child_process';
import { REPO_ROOT } from './backends.mjs';

let _id = 1;
const genId = () => `br${_id++}`;

export class StdioBackend {
  constructor(config) {
    this.id = config.id;
    this.cmd = config.cmd;
    this.args = config.args;
    this.mode = config.mode || 'stream';
    this.optional = !!config.optional;
    this.cwd = REPO_ROOT;
    this.child = null;
    this.buffer = '';
    this.pending = new Map();
    this.healthy = false;
    this.initialized = false;
    this.tools = [];
    this.stopped = false;
    this.restarts = 0;
    this.maxRestarts = 5;
    this.timeoutMs = 8000;
  }

  start() {
    if (this.stopped) return;
    const child = spawn(this.cmd, this.args, {
      cwd: this.cwd,
      stdio: ['pipe', 'pipe', 'ignore'],
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });
    this.child = child;
    child.stdin.setDefaultEncoding('utf8');
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => this._onData(chunk));
    child.on('exit', (code) => this._onExit(code));
  }

  _onData(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';
    for (const line of lines) {
      const s = line.trim();
      if (!s) continue;
      let msg;
      try {
        msg = JSON.parse(s);
      } catch {
        continue;
      }
      if (msg.id != null && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id);
        clearTimeout(p.timer);
        this.pending.delete(msg.id);
        p.resolve(msg);
      }
    }
  }

  _onExit() {
    this.healthy = false;
    this.child = null;
    if (this.stopped) return;
    if (this.restarts >= this.maxRestarts) return; // give up: excluded from routing
    const delay = Math.min(1000 * 2 ** this.restarts, 8000);
    this.restarts++;
    setTimeout(() => this.start(), delay);
  }

  stop() {
    this.stopped = true;
    if (this.child) this.child.kill('SIGTERM');
  }

  _initialize() {
    if (this.initialized) return Promise.resolve();
    this.initialized = true;
    return this.request({ jsonrpc: '2.0', id: genId(), method: 'initialize', params: {} }, 6000)
      .then(() => undefined)
      .catch(() => {
        this.initialized = false; // allow retry
      });
  }

  // Returns the tools/list result for this backend (used by the router probe).
  async probe() {
    if (this.mode === 'batch') {
      const r = await this._batchRequest({ jsonrpc: '2.0', id: genId(), method: 'tools/list', params: {} });
      this.tools = r.result?.tools || [];
      this.healthy = Array.isArray(this.tools);
      return;
    }
    this.start();
    await this._initialize();
    const r = await this.request({ jsonrpc: '2.0', id: genId(), method: 'tools/list', params: {} }, 8000);
    this.tools = r.result?.tools || [];
    this.healthy = Array.isArray(this.tools);
  }

  request(msg, timeoutMs = this.timeoutMs) {
    if (this.mode === 'batch') return this._batchRequest(msg, timeoutMs);
    if (!this.child) return Promise.reject(new Error(`backend ${this.id} not running`));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(msg.id);
        reject(new Error(`timeout on ${this.id} for ${msg.method}`));
      }, timeoutMs);
      this.pending.set(msg.id, { resolve, reject, timer });
      this.child.stdin.write(JSON.stringify(msg) + '\n');
    });
  }

  _batchRequest(msg, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.cmd, this.args, {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'ignore'],
        env: { ...process.env, NODE_NO_WARNINGS: '1' },
      });
      let buf = '';
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`batch timeout on ${this.id}`));
      }, timeoutMs);
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (c) => (buf += c));
      child.on('close', () => {
        clearTimeout(timer);
        const lines = buf.split('\n').map((l) => l.trim()).filter(Boolean);
        const last = lines[lines.length - 1];
        if (!last) return reject(new Error(`no response from ${this.id}`));
        try {
          resolve(JSON.parse(last));
        } catch (e) {
          reject(e);
        }
      });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: genId(), method: 'initialize', params: {} }) + '\n');
      child.stdin.write(JSON.stringify(msg) + '\n');
      child.stdin.end();
    });
  }
}
