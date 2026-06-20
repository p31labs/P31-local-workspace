# CWP-PHOS-DEEPSEEK: PHOS Systems Hardening & Performance

## Context

PHOS (Phosphorus Human Operating Surface) is a production PWA at `phos.p31ca.org` — a cognitive prosthetic for neurodivergent users. Stack: Astro 5 + React 19 + Tailwind, deployed to Cloudflare Pages. 295 tests pass, build succeeds, but there are hardening gaps.

You do NOT have codebase access. All relevant code snippets are inlined below. Produce working code, config, or instructions only — no narration.

---

## 1. Fix `WarehouseSurface.tsx` — Type Bug

Line 26 uses `INITIAL_STATE` as a TypeScript type parameter. It's a value, not a type.

**Current (broken):**
```tsx
interface WarehouseState {
  stats: { totalItems: number; syncPending: number };
  recentLog: WarehouseItem[];
  allItems: WarehouseItem[];
  error: string | null;
}
const INITIAL_STATE: WarehouseState = { stats: { totalItems: 0, syncPending: 0 }, recentLog: [], allItems: [], error: null };
export function WarehouseSurface({ theme, spoons }: { theme: any; spoons: number }) {
  const [state, setState] = useState<INITIAL_STATE>(INITIAL_STATE);
```

**Fix:** Change `useState<INITIAL_STATE>(INITIAL_STATE)` to `useState<WarehouseState>(INITIAL_STATE)`.

---

## 2. Fix `RetroVaultSurface.tsx` — Duplicate Error Block

Lines 113-117 and 119-123 are identical:

```tsx
{error && !opfsPrompt && (
  <p className="text-[10px] font-mono text-purple-400 opacity-70 bg-purple-950/10 p-2 border border-purple-900/20 rounded">
    {error}
  </p>
)}

{error && !opfsPrompt && (
  <p className="text-[10px] font-mono text-purple-400 opacity-70 bg-purple-950/10 p-2 border border-purple-900/20 rounded">
    {error}
  </p>
)}
```

**Fix:** Remove the second duplicate block (lines 119-123).

---

## 3. Eliminate pglite `eval()` — CSP Violation in Production

Build output contains 4 `eval()` calls from `@electric-sql/pglite` bundled chunks. This forces `'unsafe-inline'` and `'wasm-unsafe-eval'` in the CSP header (`public/_headers`). The pglite eval is for Node.js fs polyfills that are dead code in browser context.

**Current CSP:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';
```

**Investigate and implement one of:**
- Vite config to tree-shake Node.js fs stubs from pglite during build: add `resolve.alias` entries for `fs`, `path`, `child_process` to `false` or empty modules in `astro.config.ts` or `vite.config.ts`
- Vite `optimizeDeps.exclude` pglite from pre-bundling so it gets processed correctly
- If eval is unavoidable, document exactly which pglite features trigger it and whether dropping them (e.g. `relaxedDurability`, `idb://` protocol) removes the eval
- Produce the exact change needed to `astro.config.ts` or create `vite.config.ts`

**Reference `astro.config.ts`:**
```ts
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  integrations: [react(), tailwind()],
  trailingSlash: 'always',
  vite: {
    optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  },
});
```

---

## 4. Embedding Worker — Request Dedup & Backpressure

`EmbeddingWorker.ts` and `useEmbeddingWorker.ts` implement a Web Worker for embedding generation via a local Ollama proxy. There is no request deduplication — if the same text is submitted twice simultaneously, two identical requests fire. There is also no queue backpressure — rapid-fire calls overload the 30s timeout.

**Current files:**

`src/hooks/EmbeddingWorker.ts`:
```ts
import { endpoints } from '../config/endpoints';
const VECTOR_PROXY = endpoints.vectorProxy;
const MODEL = 'nomic-embed-text:latest';
const DIMENSIONS = 768;
interface WorkerRequest { type: 'embed'; id: string; text: string; }
interface WorkerResponse { type: 'embed-result'; id: string; embedding: number[] | null; error?: string; }

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(VECTOR_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text, model: MODEL }),
  });
  if (!response.ok) throw new Error(`HTTP_VECTOR_ERR_${response.status}`);
  const json = await response.json();
  return json.data?.[0]?.embedding || new Array(DIMENSIONS).fill(0);
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  if (e.data.type === 'embed') {
    try {
      const embedding = await generateEmbedding(e.data.text);
      const resp: WorkerResponse = { type: 'embed-result', id: e.data.id, embedding };
      self.postMessage(resp);
    } catch (err) {
      const resp: WorkerResponse = { type: 'embed-result', id: e.data.id, embedding: null, error: err instanceof Error ? err.message : 'UNKNOWN_EMBED_ERROR' };
      self.postMessage(resp);
    }
  }
};
```

`src/hooks/useEmbeddingWorker.ts`:
```ts
import { useEffect, useRef, useCallback } from 'react';
type WorkerResult = { embedding: number[] | null; error?: string };
type PendingRequest = { resolve: (result: WorkerResult) => void; reject: (err: Error) => void; timer: ReturnType<typeof setTimeout>; };
const REQUEST_TIMEOUT = 30_000;

export function useEmbeddingWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
  const idCounter = useRef(0);

  useEffect(() => {
    const w = new Worker(new URL('./EmbeddingWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = w;
    w.onmessage = (e: MessageEvent<{ type: string; id: string; embedding: number[] | null; error?: string }>) => {
      if (e.data.type === 'embed-result') {
        const pending = pendingRef.current.get(e.data.id);
        if (pending) { clearTimeout(pending.timer); pendingRef.current.delete(e.data.id); }
        if (e.data.error) pending.resolve({ embedding: null, error: e.data.error });
        else pending.resolve({ embedding: e.data.embedding });
      }
    };
    w.onerror = (err) => {
      for (const [id, pending] of pendingRef.current.entries()) { clearTimeout(pending.timer); pending.reject(new Error('WORKER_FATAL')); pendingRef.current.delete(id); }
      err.preventDefault();
    };
    return () => { w.terminate(); workerRef.current = null; for (const [, pending] of pendingRef.current.entries()) { clearTimeout(pending.timer); pending.reject(new Error('WORKER_TERMINATED')); } pendingRef.current.clear(); };
  }, []);

  const embed = useCallback((text: string): Promise<WorkerResult> => {
    const w = workerRef.current;
    if (!w) return Promise.resolve({ embedding: null, error: 'WORKER_NOT_READY' });
    const id = `emb-${++idCounter.current}-${Date.now()}`;
    return new Promise<WorkerResult>((resolve, reject) => {
      const timer = setTimeout(() => { pendingRef.current.delete(id); resolve({ embedding: null, error: 'EMBED_TIMEOUT' }); }, REQUEST_TIMEOUT);
      pendingRef.current.set(id, { resolve, reject, timer });
      w.postMessage({ type: 'embed', id, text });
    });
  }, []);
  return { embed };
}
```

**Requirements:**
- Add request dedup: maintain a Map in the worker of `text -> Promise<embedding>`, return the same promise for identical text strings
- Add a queue with max concurrency (default: 2) so rapid calls queue instead of hammering Ollama
- Add a max queue length (default: 50), reject oldest entries when exceeded
- Propagate text content hash as dedup key (simple `hashCode()`: `str.split('').reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0)`)
- Keep 30s per-request timeout
- Ensure termination still rejects all pendings

---

## 5. Node Zero WebSocket — Backoff Jitter

`NodeZeroSurface.tsx` connects to `ws://node-zero.local:81` (ESP32-S3). Exponential backoff has no jitter, causing thundering herd if multiple tabs connect.

**Current backoff:**
```ts
function calcBackoff(retryCount: number): number {
  const exp = Math.min(retryCount, 6);
  const base = BASE_RETRY_MS * Math.pow(2, exp);
  return Math.min(base, MAX_RETRY_MS);
}
```

**Fix:** Add ±25% random jitter. `BASE_RETRY_MS=1000`, `MAX_RETRY_MS=30000`, `MAX_RETRIES=10`. Also: currently `MAX_RETRIES` causes permanent `failed` state. Instead, after 10 retries, switch to a poll interval (check every 60s) rather than giving up forever.

Full WebSocket connection code from `NodeZeroSurface.tsx` (lines 56-122):
```tsx
useEffect(() => {
  mounted.current = true;
  let ws: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    if (!mounted.current) return;
    setWsState('connecting');
    try {
      ws = new WebSocket('ws://node-zero.local:81');
      wsRef.current = ws;
      ws.onopen = () => { if (!mounted.current) { ws?.close(); return; } setWsState('connected'); setRetryCount(0); };
      ws.onmessage = (event) => {
        if (!mounted.current) return;
        try { const parsed = JSON.parse(event.data); updateUI(parsed); } catch {}
      };
      ws.onclose = () => {
        if (!mounted.current) return; wsRef.current = null;
        setRetryCount((prev) => {
          const next = prev + 1;
          if (next > MAX_RETRIES) { setWsState('failed'); return prev; }
          const backoff = calcBackoff(next);
          setWsState('backoff');
          retryTimer = setTimeout(connect, backoff);
          return next;
        });
      };
      ws.onerror = () => { ws?.close(); };
    } catch {
      if (mounted.current) { setWsState('dropped'); const backoff = calcBackoff(1); retryTimer = setTimeout(connect, backoff); }
    }
  }
  connect();
  return () => { mounted.current = false; if (retryTimer) clearTimeout(retryTimer); if (ws) { ws.onclose = null; ws.close(); } wsRef.current = null; };
}, [updateUI]);
```

**State machine:**
```ts
type WsState = 'idle' | 'connecting' | 'connected' | 'dropped' | 'backoff' | 'failed';
const MAX_RETRIES = 10;
const BASE_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;
```

---

## 6. KarmaEngine — Prevent PGlite Double-Init Race

`KarmaEngine.ts` has a race condition: if `getDb()` is called concurrently before the first `PGlite.create()` resolves, two PGlite instances can be created for the same `idb://p31-karma-ledger`. The `dbReady` pattern prevents multiple `PGlite.create()` calls but the `dbInstance` assignment inside the async IIFE means micro-tasks queued during creation see `dbInstance === null`.

**Current code (lines 17-65):**
```ts
let dbInstance: any = null;
let dbReady: Promise<any> | null = null;

async function getDb(): Promise<any> {
  if (dbInstance) return dbInstance;
  if (dbReady) return dbReady;
  dbReady = (async () => {
    try {
      const { PGlite } = await import('@electric-sql/pglite');
      const db = await PGlite.create(DB_CONN, { relaxedDurability: true });
      // ... table creation ...
      dbInstance = db;
      return db;
    } catch {
      try {
        const { PGlite } = await import('@electric-sql/pglite');
        const db = await PGlite.create('memory://');
        // ... table creation ...
        dbInstance = db;
        return db;
      } catch { dbReady = null; return null; }
    }
  })();
  return dbReady;
}
```

**Fix:** Mutex-guard the initialization. Pattern: if `dbReady` is non-null, race callers all await the same promise. But if the memory:// fallback also fails and resets `dbReady = null`, the next caller starts fresh. This is actually fine — the bug is only if two callers arrive before `dbReady` is assigned. Move `dbReady = (async ...)()` to immediately after the first `if (dbReady) return dbReady` check, or use a simpler `let initPromise: Promise<any> | null = null` with an atomic `if (!initPromise) initPromise = doInit()` pattern.

---

## 7. Service Worker — Hearth Cache Strategy

`sw-hearth.js` opens `caches.open('hearth-alerts')` on every pain alert. If the cache doesn't exist yet, this creates it. But `put()` inside a `try/catch` silently fails if the path format is wrong. The `last-pain` URL isn't a real URL path — it's used as a cache key directly.

**Current code** (`public/sw-hearth.js`):
```js
self.addEventListener('message', (e) => {
  if (e.data?.type === 'PAIN_ALERT') {
    const alert = e.data;
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) { client.postMessage({ type: 'PAIN_ALERT', ...alert }); }
    });
    if (alert.level >= 7) {
      self.registration.showNotification('⚠ Pain Alert', {
        body: `Pain level ${alert.level} detected. Spoon capacity reduced.`,
        icon: '/icon-192.png', badge: '/icon-192.png', tag: 'pain-alert', requireInteraction: true, data: alert,
      });
    }
    try {
      self.caches?.open('hearth-alerts').then((cache) => {
        cache.put('last-pain', new Response(JSON.stringify(alert), { headers: { 'Content-Type': 'application/json' } }));
      });
    } catch {}
  }
});
```

**Requirements:**
- Use a proper Request object as cache key: `new Request('/hearth/alerts/last-pain')`
- Add a timeout (5s) to cache operations so a stuck IndexedDB doesn't block the SW message handler
- Add a `fetch` event listener that serves `GET /hearth/alerts/last-pain` from cache for cross-tab recovery
- Fix TypeScript reference — change `<reference lib="webworker" />` to actual type imports or remove the reference (current file has `import {}` at the end which breaks in SW context without bundler)
- Keep the `push` and `notificationclick` handlers as-is

---

## 8. Sound Engine — Offload to AudioWorklet

`sound.ts` creates AudioContext/oscillators on the main thread. For a cognitive prosthetic targeting low-spoon users, audio processing should be offloaded to an AudioWorklet to avoid GC pauses from oscillator scheduling.

**Current architecture (322 lines, key excerpts):**
```ts
let ctx: AudioContext | null = null;
const LARMOR_HZ = 863;
const FREQ = { hydrogen: 2590, carbon: 647, oxygen: 1082, phosphor: 863, calcium: 422, sodium: 477 };

type SpoonProfile = { oscType: OscillatorType; volume: number; attack: number; decay: number };
function spoonProfile(spoons: number): SpoonProfile {
  if (spoons <= 2) return { oscType: 'sine', volume: 0.3, attack: 0.1, decay: 1.5 };
  if (spoons === 3) return { oscType: 'triangle', volume: 0.5, attack: 0.05, decay: 0.8 };
  return { oscType: 'sine', volume: 0.7, attack: 0.01, decay: 0.3 };
}
```

**Requirement:** Produce an AudioWorklet processor file (`public/audio/phos-processor.js`) and the integration code to load it. The worklet should:
- Accept control messages: `{ freq, volume, attack, decay, oscType }`
- Maintain spoon profile internally (most recent message sets the profile)
- Implement the pentatonic scale for spoon-change tones
- Keep 863 Hz Larmor grounding as base frequency
- Include a `detach()` message to cleanly release oscillator nodes
- Fall back gracefully to main-thread oscillators if AudioWorklet isn't supported (keep existing code as fallback)

---

## 9. ChaosVault — Cosine Similarity on Main Thread

`ChaosVault.ts` loads ALL embeddings from PGlite and computes cosine similarity in JS on the main thread. For vaults with 1000+ entries, this blocks the UI.

**Current query (lines 63-96):**
```ts
export async function querySimilarity(embedding: number[], limit = 3): Promise<Array<...>> {
  const db = await getChaosVault();
  if (!db) return [];
  const res = await db.query('SELECT source_door, raw_text, embedding_json FROM unified_knowledge_graph');
  // ... dotProduct/magnitude via reduce in JS ...
}
```

**Options (recommend the best one):**
- A) Approximate nearest neighbor via PGlite's pgvector extension (if available in WASM build)
- B) Move similarity computation to the existing Embedding Worker
- C) Use a Web Worker specifically for ANN search with a simple flat index that gets rebuilt on vault write
- D) Add LIMIT to the SQL query and use a simpler scoring (e.g. cosine similarity with pre-normalized vectors stored as `FLOAT32ARRAY`)

---

## 10. Add `tsconfig.json` to Enable Type Checking

**No `tsconfig.json` exists.** `npm run typecheck` runs `tsc --noEmit` with no config, producing no useful output. Astro injects its own TS config during build but standalone type checking is broken.

Create a `tsconfig.json` that extends Astro's auto-generated config and enables strict checking:

Requirements:
- Strict mode
- JSX: react-jsx
- Path alias `@` → `./src/*`
- Include `src/**/*.ts`, `src/**/*.tsx`
- Exclude `node_modules`, `dist`, `.astro`
- Target ES2022, module ESNext, moduleResolution bundler
- Reference `./.astro/types.d.ts` for Astro-generated types

---

## Output Format

For each item above, produce:
1. **The exact file diff** (or new file content for AudioWorklet/tsconfig)
2. **A one-line dependency note** if any npm packages are needed
3. **A test command** to verify nothing broke (e.g. `npx vitest run src/__tests__/relevant-test.ts`)

No commentary. No explanations. Ship the diffs.
