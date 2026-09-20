import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { commit } from '@p31/canon/loom/commit';
import { commitWeft } from '@p31/canon/loom/commitWeft';
import { readEvents } from '@p31/canon/loom/jsonl';
import { readWeft } from '@p31/canon/loom/weft';
import { resolveLogPath } from '@p31/canon/loom/log-path';
import { readProfile } from '@p31/canon/loom/profiles';
import { ReplayGate, type LoomEventInput } from '@p31/canon/loom/gate';
import type { LoomEvent } from '@p31/canon/loom/events';
import { dirname, join } from 'node:path';

const logPath = resolveLogPath();
const weftPath = join(dirname(logPath), 'weft.jsonl');
// The profile store sits next to the log directory, NOT inside the log. It is
// a separate store keyed by humanId; the log only carries the id reference.
const profilesDir = join(dirname(logPath), 'profiles');

/**
 * Dev-only middleware. The canvas writes only through POST /api/loom/event,
 * which forwards `body.input` to commit() — structured so a future
 * authenticated wrapper can override `input.writer` before the call.
 */
function loomMiddleware(): Plugin {
  return {
    name: 'loom-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/loom', (req, res, next) => {
        const path = new URL(req.url ?? '/', 'http://localhost').pathname;

        if (req.method === 'POST' && path === '/event') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              // `input.humanId` is client-asserted. There is no authentication.
              // A future authenticated wrapper sets it server-side from the
              // session before commit(); the client value is advisory only.
              const { input } = JSON.parse(body || '{}');
              const r = commit(logPath, input);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = r.valid ? 200 : 400;
              res.end(JSON.stringify(r.valid ? { valid: true, event: r.event } : { valid: false, error: r.error }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ valid: false, error: String(e) }));
            }
          });
          return;
        }

        if (req.method === 'GET' && path === '/events') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(readEvents(logPath)));
          return;
        }

        // Weft: the operational read log. POST writes a read (commitWeft);
        // GET returns the reads (readWeft). Same client-asserted humanId
        // caveat as /event — advisory until an authenticated wrapper lands.
        if (req.method === 'POST' && path === '/weft') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const { input } = JSON.parse(body || '{}');
              const r = commitWeft(weftPath, input);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = r.valid ? 200 : 400;
              res.end(JSON.stringify(r.valid ? { valid: true, event: r.event } : { valid: false, error: r.error }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ valid: false, error: String(e) }));
            }
          });
          return;
        }

        if (req.method === 'GET' && path === '/weft') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(readWeft(weftPath)));
          return;
        }

        if (req.method === 'GET' && path.startsWith('/profile/')) {
          const id = decodeURIComponent(path.slice('/profile/'.length));
          const profile = id ? readProfile(profilesDir, id) : null;
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = profile ? 200 : 404;
          res.end(JSON.stringify(profile));
          return;
        }

        if (req.method === 'GET' && path === '/stream') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          });
          // Honor Last-Event-ID so an EventSource reconnect resumes where it
          // dropped, not at the head. Events committed during the disconnect
          // window must not be silently lost.
          const header = req.headers['last-event-id'];
          const lastEventId = Array.isArray(header) ? header[0] : header;
          let lastSeq =
            lastEventId !== undefined && lastEventId !== ''
              ? Number(lastEventId)
              : readEvents(logPath).reduce((m, e) => Math.max(m, e.seq), -1);
          const timer = setInterval(() => {
            for (const e of readEvents(logPath)) {
              if (e.seq > lastSeq) {
                lastSeq = e.seq;
                res.write(`id: ${e.seq}\ndata: ${JSON.stringify(e)}\n\n`);
              }
            }
          }, 250);
          req.on('close', () => clearInterval(timer));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), loomMiddleware(), snapshotPlugin()],
  server: { port: 5191, host: true },
});

/** A fixed, gate-validated human+agent session, so a static deploy (no /api)
 *  still renders a live-looking field. Node names are real registry ids. */
const DEMO_EVENTS: LoomEventInput[] = [
  { writer: 'human', kind: 'focus', node: '--p31-accent' },
  { writer: 'agent', kind: 'traverse', from: '--p31-accent', to: '.a2-data-card', reason: 'referenced-by' },
  { writer: 'agent', kind: 'traverse', from: '--p31-accent', to: '.a2-data-card-action', reason: 'styled-by' },
  { writer: 'agent', kind: 'propose', id: 'prop_demo_1', node: '.a2-data-card', body: { rounded: true, size: 'lg' } },
  { writer: 'agent', kind: 'traverse', from: '.a2-data-card', to: '.a2-data-card-header', reason: 'nested-in' },
  { writer: 'agent', kind: 'presence', node: '.a2-data-card-action', attention: 0.7 },
  { writer: 'agent', kind: 'review', agent: 'demo-reviewer', proposalId: 'prop_demo_1', decision: 'approve', revision: 0 },
  { writer: 'human', kind: 'focus', node: '.a2-data-card-action' },
  { writer: 'agent', kind: 'traverse', from: '.a2-data-card-action', to: '--p31-accent-gold', reason: 'uses-token' },
  { writer: 'agent', kind: 'traverse', from: '.a2-data-card-header', to: '--p31-accent-green', reason: 'uses-token' },
];

/** Fold the demo session through the gate (validates + stamps seq) and spread
 *  timestamps over the last ~45 min so the field has structure. Used by both
 *  the build-time snapshot plugin and the dev server route, so the seed is
 *  identical wherever it is served. */
function buildSeedEvents(): LoomEvent[] {
  const gate = new ReplayGate();
  for (const input of DEMO_EVENTS) {
    const r = gate.append(input);
    if (!r.valid) throw new Error(`demo event ${input.kind} failed: ${r.error}`);
  }
  const log = gate.getLog();
  const n = log.length;
  return log.map((e, i) => ({
    ...e,
    ts: new Date(Date.now() - (n - 1 - i) * 5 * 60 * 1000).toISOString(),
  }));
}

/** Build-time snapshot: fold the demo session through the gate (validates +
 *  stamps seq) and emit it as a static asset the client can fall back to when
 *  /api/loom/events 404s. In dev, a configureServer route serves the SAME
 *  fold at /events.seed.json, so the docs log pane works on `pnpm dev` too. */
function snapshotPlugin(): Plugin {
  return {
    name: 'loom-snapshot',
    configureServer(server) {
      server.middlewares.use('/events.seed.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(buildSeedEvents()));
      });
    },
    generateBundle() {
      const events = buildSeedEvents();
      this.emitFile({ type: 'asset', fileName: 'events.seed.json', source: JSON.stringify(events) });
    },
  };
}
