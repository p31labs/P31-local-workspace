import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { commit } from '@p31/canon/loom/commit';
import { readEvents } from '@p31/canon/loom/jsonl';
import { resolveLogPath } from '@p31/canon/loom/log-path';

const logPath = resolveLogPath();

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
  plugins: [react(), loomMiddleware()],
  server: { port: 5191, host: true },
});
