import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { commit } from '@p31/canon/loom/commit';
import { readEvents } from '@p31/canon/loom/jsonl';
import { resolveLogPath } from '@p31/canon/loom/log-path';
import { ReplayGate, type LoomEventInput } from '@p31/canon/loom/gate';
import type { LoomEvent } from '@p31/canon/loom/events';

/**
 * The music maker's dev middleware — the log/presence split, concretely
 * (§6 of docs/MUSIC_MAKER_BUILD_PROMPT.md).
 *
 *   • COMMITTED path — POST /api/music/event forwards `input` to the canon's
 *     commit(), writing to the SAME shared log the Loom uses (resolveLogPath).
 *     Gate-validated, seq-stamped, hash-chained. This is the score.
 *   • EPHEMERAL path (Option A) — POST /api/music/ephemeral is ungated, never
 *     persisted, never gated. It fans out over the SAME SSE stream with a
 *     distinguishing `type: 'ephemeral'`, so a client that logs both to the
 *     console visibly tags which is which. The stream also tails committed
 *     events with Last-Event-ID resume, exactly like the Loom's /stream.
 *
 * ── THE DUAL PATH (read before changing this file) ─────────────────────────
 * This middleware is the LOCAL mirror only. The PRODUCTION transport is the
 * `worker/` Durable Object (music-presence), which serves the SAME client
 * contract: POST /event, POST /ephemeral, GET /events, and a live stream —
 * but over WebSocket Hibernation instead of SSE, and writing committed events
 * through the D1 log adapter, NOT this Node commit() (Node fs cannot run in
 * workerd). This is one production transport + one dev mirror — the build
 * prompt's "pick one, don't build both" rule is honored as written: only the
 * deployed worker is production. If you change an endpoint path or message
 * shape here, change it in worker/index.ts too; the client must not care
 * which transport it reached.
 */
function musicMiddleware(): Plugin {
  const logPath = resolveLogPath();
  // In-memory ephemeral fan-out. Nothing here ever touches disk or the gate.
  const ephemeralClients = new Set<import('node:http').ServerResponse>();

  return {
    name: 'music-maker-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/music', async (req, res, next) => {
        const path = new URL(req.url ?? '/', 'http://localhost').pathname;

        // ── Committed composition events ────────────────────────────────
        if (req.method === 'POST' && path === '/event') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const { input } = JSON.parse(body || '{}');
              const r = commit(logPath, input as LoomEventInput);
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

        // ── Ephemeral broadcast (ungated, never persisted) ──────────────
        if (req.method === 'POST' && path === '/ephemeral') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const msg = JSON.parse(body || '{}');
              const frame = `data: ${JSON.stringify(msg)}\n\n`;
              for (const client of ephemeralClients) {
                if (!client.writableEnded) client.write(frame);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ valid: true, ephemeral: true }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ valid: false, error: String(e) }));
            }
          });
          return;
        }

        // ── The single SSE stream: committed tail + ephemeral fan-out ───
        if (req.method === 'GET' && path === '/stream') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          });
          const header = req.headers['last-event-id'];
          const headerValue = Array.isArray(header) ? header[0] : header;
          const query = new URL(req.url ?? '/', 'http://localhost').searchParams.get('lastEventId');
          const resume = headerValue ?? query;
          let lastSeq =
            resume !== undefined && resume !== ''
              ? Number(resume)
              : readEvents(logPath).reduce((m, e) => Math.max(m, e.seq), -1);

          // Frames are UNNAMED data: lines so the client's single onmessage
          // handler receives them — the client discriminates ephemeral vs
          // committed by payload shape (type:'ephemeral'), not by SSE event
          // name. This mirrors the WebSocket transport's frame shape exactly
          // (worker/index.ts), so the two transports speak the same contract.
          const committedTail = setInterval(() => {
            for (const e of readEvents(logPath)) {
              if (e.seq > lastSeq) {
                lastSeq = e.seq;
                res.write(`id: ${e.seq}\ndata: ${JSON.stringify(e)}\n\n`);
              }
            }
          }, 250);

          // Ephemeral fan-out (pushed directly).
          ephemeralClients.add(res);
          req.on('close', () => {
            clearInterval(committedTail);
            ephemeralClients.delete(res);
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), musicMiddleware()],
  server: { port: 5291, host: true },
});