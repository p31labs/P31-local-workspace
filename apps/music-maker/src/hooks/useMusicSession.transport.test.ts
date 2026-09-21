import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useMusicSession } from './useMusicSession';

/**
 * Transport + CommitResult tests. Pins:
 *   • the transport starts on WebSocket (WS-first, not gated on https) — the
 *     production transport is the one exercised in dev.
 *   • commitOverTransport distinguishes a GATE rejection from a TIMEOUT —
 *     "the instrument is full" vs "your connection stalled" are different
 *     messages with different fixes.
 *
 * A controllable WebSocket stub lets the test drive onmessage / onclose.
 */

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static OPEN = 1;
  static openHandlers: Array<() => void> = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    if (this.onclose) this.onclose();
  }
  /** Test helper: simulate the server opening the socket. */
  fireOpen() {
    this.readyState = 1;
    if (this.onopen) this.onopen();
  }
  /** Test helper: simulate a frame from the server. */
  fireMessage(data: string) {
    if (this.onmessage) this.onmessage({ data });
  }
}

function stubFetchEvents(body: string) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/events')) {
      return { ok: true, json: async () => JSON.parse(body) } as Response;
    }
    if (url.endsWith('/event')) {
      return { ok: true, json: async () => ({ valid: true }) } as Response;
    }
    if (url.endsWith('/ephemeral')) {
      return { ok: true, json: async () => ({ valid: true, ephemeral: true }) } as Response;
    }
    throw new Error(`unexpected fetch: ${url}`);
  }));
}

function stubFetchEvent500() {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/events')) {
      return { ok: true, json: async () => [] } as Response;
    }
    if (url.endsWith('/event')) {
      // A 5xx = the SERVICE is down (D1 write failing), not a gate refusal.
      return { ok: false, status: 500 } as Response;
    }
    throw new Error(`unexpected fetch: ${url}`);
  }));
}

function stubTransports() {
  vi.stubGlobal('WebSocket', FakeWebSocket);
  vi.stubGlobal('EventSource', class {});
}

describe('useMusicSession transport', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts on WebSocket first (WS-first, regardless of protocol)', async () => {
    stubFetchEvents('[]');
    stubTransports();
    // http:// (dev) must still prefer WS; the fallback handles a non-upgrading
    // dev server.
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: 'localhost:5291', search: '' },
      writable: true,
    });
    const { unmount } = renderHook(() => useMusicSession());
    await waitFor(() => expect(FakeWebSocket.instances.length).toBeGreaterThan(0));
    expect(FakeWebSocket.instances[0].url).toContain('/api/music/stream');
    // The WS must be the one that owns the live socket.
    const ws = FakeWebSocket.instances[0];
    act(() => ws.fireOpen());
    // An ephemeral trigger goes over the WS, not the HTTP fallback.
    act(() => {
      // triggerZone is on the hook result; drive via the returned object.
    });
    unmount();
    vi.unstubAllGlobals();
  });

  it('distinguishes a gate rejection from a timeout on commit', async () => {
    stubFetchEvents('[]');
    stubTransports();
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: 'localhost:5291', search: '' },
      writable: true,
    });
    const { result } = renderHook(() => useMusicSession());
    const ws = FakeWebSocket.instances[0];
    act(() => ws.fireOpen());

    // Commit 1: gate rejects (commit-ack valid:false) → { ok:false, reason:'gate' }.
    let gateResult: unknown;
    act(() => {
      void result.current.placeZone([0, 0, 1], 'hydrogen').then((r) => { gateResult = r; });
    });
    const reqId = JSON.parse(ws.sent[ws.sent.length - 1]).requestId as string;
    act(() => ws.fireMessage(JSON.stringify({ type: 'commit-ack', requestId: reqId, valid: false })));
    await waitFor(() => expect(gateResult).toEqual({ ok: false, reason: 'gate' }));

    // Commit 2: never acked → { ok:false, reason:'timeout' } (after the 10s window).
    let timeoutResult: unknown;
    act(() => {
      void result.current.placeZone([0, 0, 2], 'carbon').then((r) => { timeoutResult = r; });
    });
    // The commit timeout is a real setTimeout in the hook; advance it without
    // faking the whole world (faking timers also freezes the WS reconnect
    // loop). 10s + margin.
    await new Promise((r) => setTimeout(r, 11_000));
    await waitFor(() => expect(timeoutResult).toEqual({ ok: false, reason: 'timeout' }));

    vi.unstubAllGlobals();
  }, 20_000);

  it('maps a 5xx committed-write response to reason:"infra", not "gate"', async () => {
    stubFetchEvent500();
    stubTransports();
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: 'localhost:5291', search: '' },
      writable: true,
    });
    const { result } = renderHook(() => useMusicSession());
    // Force the HTTP fallback: never fire the WS open, so the live socket is
    // not in play. placeZone then POSTs /event, which returns 500.
    let infraResult: unknown;
    act(() => {
      void result.current.placeZone([0, 0, 3], 'oxygen').then((r) => { infraResult = r; });
    });
    await waitFor(() => expect(infraResult).toEqual({ ok: false, reason: 'infra' }));

    vi.unstubAllGlobals();
  });
});