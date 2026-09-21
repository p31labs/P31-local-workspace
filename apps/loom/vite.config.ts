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
import { hashRecord, verifyChain, GENESIS_PREV_HASH, type ChainRecord } from '@p31/canon/loom/hash-chain';
import { loomHeadAnchor, sbtAnchor, LOVE_GENESIS_HASH, type SbtBlock } from '@p31/canon/loom/anchor';
import { fetchCareProof } from './functions/api/loom/_lib/love';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const logPath = resolveLogPath();
// The dev chain sidecar: the D1-row equivalent (seq, ts, data, prev_hash),
// stored one record per line next to the log. The JSONL holds the events the
// canon owns; the sidecar holds the chain links the trust endpoints verify.
// Tampering a JSONL line (or a sidecar line) breaks the chain.
const chainPath = logPath.replace(/\.jsonl$/, '.chain.jsonl');
const weftPath = join(dirname(logPath), 'weft.jsonl');
// The profile store sits next to the log directory, NOT inside the log. It is
// a separate store keyed by humanId; the log only carries the id reference.
const profilesDir = join(dirname(logPath), 'profiles');

/** Read the dev chain sidecar as a record list, sorted ascending by seq. */
function readChain(): ChainRecord[] {
  if (!existsSync(chainPath)) return [];
  return readFileSync(chainPath, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as ChainRecord)
    .sort((a, b) => a.seq - b.seq);
}

/** Rebuild the whole chain sidecar from the canonical event log. Used when the
 *  log has events but the sidecar is missing or out of sync (e.g. a test that
 *  clears the JSONL but not the sidecar, or the first run after this feature
 *  landed). Deterministic: given the same log, the same sidecar is produced. */
async function rebuildChain(logEvents: LoomEvent[]): Promise<ChainRecord[]> {
  const records: ChainRecord[] = [];
  let prevHash = GENESIS_PREV_HASH;
  for (const e of logEvents) {
    const record: ChainRecord = { seq: e.seq, ts: e.ts, data: JSON.stringify(e), prev_hash: prevHash };
    records.push(record);
    prevHash = await hashRecord(record);
  }
  return records;
}

/** Append one record to the dev chain sidecar (create if missing). */
function appendChain(record: ChainRecord): void {
  mkdirSync(dirname(chainPath), { recursive: true });
  writeFileSync(chainPath, readChain().concat([record]).map((r) => JSON.stringify(r)).join('\n') + '\n');
}

// Dev-only SBT anchor store. The deployed Function persists to D1
// (sbt_anchors table); the dev server keeps an in-memory Map so the e2e suite
// can exercise the same linkage + witness semantics without a database.
// Keyed by DID -> array of anchored blocks { block, entryHash }.
const sbtAnchors = new Map<string, Array<{ block: SbtBlock; entryHash: string }>>();

function lastSbtAnchor(did: string): { block: SbtBlock; entryHash: string } | null {
  const arr = sbtAnchors.get(did);
  return arr && arr.length ? arr[arr.length - 1] : null;
}

function insertSbtAnchor(did: string, block: SbtBlock, entryHash: string): boolean {
  const arr = sbtAnchors.get(did) ?? [];
  if (arr.some((a) => a.block.hash === block.hash)) return false; // idempotent
  arr.push({ block, entryHash });
  sbtAnchors.set(did, arr);
  return true;
}

/** Overwrite the chain sidecar with a full rebuild (bootstrap / desync fix). */
function writeChain(records: readonly ChainRecord[]): void {
  mkdirSync(dirname(chainPath), { recursive: true });
  writeFileSync(chainPath, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
}

/**
 * After the log has grown by one committed event, extend the chain sidecar by
 * exactly that record. The sidecar is APPEND-ONLY in normal operation — the
 * prev_hash of the new record is the hash of the current head, mirroring the
 * D1 adapter (INSERT with prev_hash = hash of the previous row). Only when the
 * sidecar has desynced from the log (missing/stale — e.g. a seeded log before
 * this feature, or a test that clears the JSONL) is the whole chain rebuilt.
 */
async function extendChain(logEvents: LoomEvent[]): Promise<void> {
  let chain = readChain();
  // logEvents already includes the just-committed event. If the sidecar is
  // behind by exactly that one event, append it; otherwise rebuild.
  if (chain.length === logEvents.length - 1) {
    const head = chain.length ? await hashRecord(chain[chain.length - 1]) : GENESIS_PREV_HASH;
    const event = logEvents[logEvents.length - 1];
    const record: ChainRecord = { seq: event.seq, ts: event.ts, data: JSON.stringify(event), prev_hash: head };
    appendChain(record);
  } else {
    writeChain(await rebuildChain(logEvents));
  }
}

/**
 * Dev-only middleware. The canvas writes only through POST /api/loom/event,
 * which forwards `body.input` to commit() — structured so a future
 * authenticated wrapper can override `input.writer` before the call.
 */
function loomMiddleware(): Plugin {
  return {
    name: 'loom-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/loom', async (req, res, next) => {
        const path = new URL(req.url ?? '/', 'http://localhost').pathname;

        if (req.method === 'POST' && path === '/event') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', async () => {
            try {
              // `input.humanId` is client-asserted. There is no authentication.
              // A future authenticated wrapper sets it server-side from the
              // session before commit(); the client value is advisory only.
              const { input } = JSON.parse(body || '{}');
              const r = commit(logPath, input);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = r.valid ? 200 : 400;
              if (r.valid) {
                // Keep the dev chain sidecar in lockstep with the log — one
                // appended record per committed event, linked to the head.
                await extendChain(readEvents(logPath));
              }
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

        // Trust layer: recompute the prev_hash chain over the log and the
        // sidecar. A dev log that was seeded before this feature (or a test
        // that clears the JSONL) is rebuilt deterministically on demand.
        if (req.method === 'GET' && path === '/verify') {
          const logEvents = readEvents(logPath);
          let chain = readChain();
          if (chain.length !== logEvents.length) chain = await rebuildChain(logEvents);
          verifyChain(chain)
            .then((verdict) => {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store');
              res.end(JSON.stringify(verdict));
            })
            .catch((e) => {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ valid: false, error: String(e) }));
            });
          return;
        }

        if (req.method === 'GET' && path.startsWith('/provenance/')) {
          const target = Number(decodeURIComponent(path.slice('/provenance/'.length)));
          if (!Number.isInteger(target) || target < 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'seq must be a non-negative integer' }));
            return;
          }
          const logEvents = readEvents(logPath);
          let chain = readChain();
          if (chain.length !== logEvents.length) chain = await rebuildChain(logEvents);
          const upto = chain.filter((r) => r.seq <= target);
          if (upto.length === 0 || upto[upto.length - 1].seq !== target) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `no event at seq ${target}` }));
            return;
          }
          const verdict = await verifyChain(chain);
          const sliceVerdict = await verifyChain(upto);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(
            JSON.stringify({
              target,
              chain: upto,
              verified: verdict.valid,
              brokenAt: verdict.brokenAt,
              head: sliceVerdict.head,
            }),
          );
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

        if (req.method === 'GET' && path === '/anchor') {
          const logEvents = readEvents(logPath);
          let chain = readChain();
          if (chain.length !== logEvents.length) chain = await rebuildChain(logEvents);
          const verdict = await verifyChain(chain);

          // LOVE chain head, live. Outage -> genesis.
          let loveHead = LOVE_GENESIS_HASH;
          try {
            const r = await fetch(`${process.env.LOVE_LEDGER_URL ?? 'https://love-ledger.p31ca.org'}/api/love/chain`);
            if (r.ok) {
              const { chain: loveChain } = (await r.json()) as { chain: Array<{ entry_hash: string }> };
              loveHead = loveChain?.[0]?.entry_hash ?? LOVE_GENESIS_HASH;
            }
          } catch {
            // ledger unreachable
          }

          const anchor = await loomHeadAnchor(
            {
              loomHead: verdict.head,
              loomSeq: verdict.checked,
              brokenAt: verdict.brokenAt,
              verified: verdict.valid,
              anchoredAt: new Date().toISOString(),
            },
            loveHead,
          );
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(
            JSON.stringify({
              ...anchor,
              status: 'dry-run',
              writePath: 'awaits dedicated service-to-service token (see docs/LOVE_INTEGRATION.md)',
            }),
          );
          return;
        }

        if (req.method === 'POST' && path === '/anchor/sbt') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}') as { did?: string; block?: SbtBlock };
              const did = parsed?.did;
              const block = parsed?.block;
              if (!did || !block || !/^[0-9a-f]{64}$/.test(block.hash)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'did and a valid 64-hex block.hash are required' }));
                return;
              }
              if (!Number.isInteger(block.blockNumber) || block.blockNumber < 0) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'block.blockNumber must be a non-negative integer' }));
                return;
              }

              // Per-DID linkage (dev mirror of the D1 Function).
              const last = lastSbtAnchor(did);
              if (last && last.block.hash === block.hash) {
                // Idempotent retry of the same block.
                const entryPrev = last.entryHash;
                const anchor = await sbtAnchor(did, block, entryPrev);
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'no-store');
                res.end(JSON.stringify({ ...anchor, anchored: false, inserted: false }));
                return;
              }
              if (block.blockNumber > 0) {
                if (!last || block.prevHash !== last.block.hash) {
                  res.statusCode = 409;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: `linkage broken: block ${block.blockNumber} prevHash does not match last anchored hash for ${did}` }));
                  return;
                }
              } else if (last) {
                res.statusCode = 409;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: `genesis already anchored for ${did}` }));
                return;
              }

              const entryPrev = last?.entryHash ?? LOVE_GENESIS_HASH;
              const anchor = await sbtAnchor(did, block, entryPrev);
              const inserted = insertSbtAnchor(did, block, anchor.entryHash);

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store');
              res.end(JSON.stringify({ ...anchor, anchored: inserted, inserted }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(e) }));
            }
          });
          return;
        }

        if (req.method === 'GET' && path.startsWith('/love/')) {
          const did = decodeURIComponent(path.slice('/love/'.length));
          if (!did) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'did is required' }));
            return;
          }
          const proof = await fetchCareProof({}, did);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(proof));
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
          // window must not be silently lost. Manual reconnects (mobile
          // backoff) cannot set the header, so a ?lastEventId= query param is
          // honored as a fallback.
          const header = req.headers['last-event-id'];
          const headerValue = Array.isArray(header) ? header[0] : header;
          const query = new URL(req.url ?? '/', 'http://localhost').searchParams.get('lastEventId');
          const resume = headerValue ?? query;
          let lastSeq =
            resume !== undefined && resume !== ''
              ? Number(resume)
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
