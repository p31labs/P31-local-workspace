// workers/sync/index.ts
// Cloudflare Worker for P31 Multi-Device Sync
// Implements server-side CRDT merge for EXEC-01 (Gap B)

import * as Y from 'yjs';

export interface Env {
  SYNC_STATE: DurableObjectNamespace<SyncState>;
  P31_SYNC_SECRET: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://p31ca.org',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-P31-Namespace, X-P31-Device',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !(await validateHMAC(authHeader, env.P31_SYNC_SECRET))) {
      return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS });
    }

    const namespace = request.headers.get('X-P31-Namespace');
    const deviceId = request.headers.get('X-P31-Device');

    if (!namespace || !deviceId) {
      return new Response('Missing headers', { status: 400, headers: CORS_HEADERS });
    }

    const validNamespaces = ['p31:operator', 'p31:family:cage', 'p31:child:sj', 'p31:child:wj', 'p31:legal'];
    if (!validNamespaces.includes(namespace)) {
      return new Response('Invalid namespace', { status: 400, headers: CORS_HEADERS });
    }

    const id = env.SYNC_STATE.idFromName(namespace);
    const stub = env.SYNC_STATE.get(id);

    try {
      if (path === '/push' && request.method === 'POST') {
        const update = new Uint8Array(await request.arrayBuffer());
        await stub.pushUpdate(deviceId, update);
        return new Response('OK', { status: 200, headers: CORS_HEADERS });
      }

      if (path === '/pull' && request.method === 'POST') {
        const stateVector = new Uint8Array(await request.arrayBuffer());
        const diff = await stub.getDiff(stateVector, deviceId);
        return new Response(diff, { status: 200, headers: CORS_HEADERS });
      }

      return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
    } catch (error) {
      console.error('Sync error:', error);
      return new Response('Internal Error', { status: 500, headers: CORS_HEADERS });
    }
  },
};

// HMAC-SHA256 validation using WebCrypto (available in Cloudflare Workers)
async function validateHMAC(authHeader: string, secret: string): Promise<boolean> {
  // Expected format: "Bearer <hex-encoded-HMAC>"
  if (!authHeader.startsWith('Bearer ')) return false;
  const provided = authHeader.slice(7);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  try {
    const providedBytes = Uint8Array.from(
      provided.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) ?? []
    );
    // Verify against a fixed challenge — client derives HMAC from secret + date (UTC day)
    const challenge = encoder.encode(new Date().toISOString().slice(0, 10));
    return await crypto.subtle.verify('HMAC', key, providedBytes, challenge);
  } catch {
    return false;
  }
}

// Durable Object: One per namespace, holds canonical Yjs state
export class SyncState {
  private state: DurableObjectState;
  private doc: Y.Doc;
  private initialized = false;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.doc = new Y.Doc();
    // Restore persisted state before handling any requests
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<Uint8Array>('doc_state');
      if (stored) {
        Y.applyUpdate(this.doc, stored);
      }
      this.initialized = true;
    });
  }

  async fetch(request: Request): Promise<Response> {
    return new Response('Durable Object active', { status: 200 });
  }

  async pushUpdate(deviceId: string, update: Uint8Array): Promise<void> {
    Y.applyUpdate(this.doc, update);
    await this.state.storage.put(`last_seen:${deviceId}`, Date.now());
    // Persist full document state (128KB DO storage limit — sufficient for Yjs state vectors)
    await this.state.storage.put('doc_state', Y.encodeStateAsUpdate(this.doc));
  }

  async getDiff(stateVector: Uint8Array, deviceId: string): Promise<Uint8Array> {
    await this.state.storage.put(`last_seen:${deviceId}`, Date.now());
    return Y.encodeStateAsUpdate(this.doc, stateVector);
  }
}
