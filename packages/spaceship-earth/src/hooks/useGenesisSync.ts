// useGenesisSync — Boot-time state hydration + debounced push to spaceship-relay.
// Reads/writes via Ed25519-signed payloads to /state/:did.

import { useEffect, useRef } from 'react';
import { useSovereignStore } from '../sovereign/useSovereignStore';
import * as genesis from '../services/genesisIdentity';

const RELAY_URL = 'https://spaceship-relay.trimtab-signal.workers.dev';
const DEBOUNCE_MS = 2_000;
const FETCH_TIMEOUT = 10_000;

interface SyncPayload {
  love: number;
  spoons: number;
  careScore: number;
  timestamp: number;
}

async function fetchWithAbort(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Pull latest state from relay. Returns the payload if remote is newer, null otherwise.
 */
async function pullState(did: string): Promise<SyncPayload | null> {
  const setStatus = useSovereignStore.getState().setGenesisSyncStatus;
  setStatus('syncing');

  try {
    const res = await fetchWithAbort(
      `${RELAY_URL}/state/${encodeURIComponent(did)}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      FETCH_TIMEOUT,
    );

    if (res.status === 404) {
      setStatus('synced');
      return null; // No remote state yet
    }

    if (!res.ok) {
      setStatus('error');
      return null;
    }

    const data = await res.json() as { payload: SyncPayload };
    setStatus('synced');
    return data.payload;
  } catch {
    setStatus('offline');
    return null;
  }
}

/**
 * Push signed state to relay.
 */
async function pushState(did: string, payload: SyncPayload): Promise<string | null> {
  const setStatus = useSovereignStore.getState().setGenesisSyncStatus;
  setStatus('syncing');

  try {
    const canonical = JSON.stringify(payload);
    const dataBytes = new TextEncoder().encode(canonical);
    const sigBytes = await genesis.sign(dataBytes);
    const signature = genesis.toHex(sigBytes);

    const res = await fetchWithAbort(
      `${RELAY_URL}/state/${encodeURIComponent(did)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, signature }),
      },
      FETCH_TIMEOUT,
    );

    if (!res.ok) {
      setStatus('error');
      return null;
    }

    const data = await res.json() as { serverHash?: string };
    setStatus('synced');
    return data.serverHash ?? null;
  } catch {
    setStatus('offline');
    return null;
  }
}

export function useGenesisSync() {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didRef = useRef<string | null>(null);
  const lastPushRef = useRef<string | null>(null);

  // Boot identity + initial pull
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const did = await genesis.boot();
        if (!mounted) return;
        didRef.current = did;

        // Update DID in sovereign store (replaces random hex placeholder)
        useSovereignStore.setState({ didKey: did });

        // Pull remote state
        const remote = await pullState(did);
        if (!mounted || !remote) return;

        // Compare timestamps — remote wins if newer
        const localTs = Date.now();
        if (remote.timestamp > localTs - 60_000) {
          // Remote is recent (within 60s of now) — hydrate local state
          useSovereignStore.setState({
            love: remote.love,
            spoons: remote.spoons,
          });
          console.log('[GenesisSync] hydrated from remote, ts:', remote.timestamp);
        }
      } catch (err) {
        console.error('[GenesisSync] boot/pull failed:', err);
        useSovereignStore.getState().setGenesisSyncStatus('error');
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Debounced push on love/spoons change
  useEffect(() => {
    const unsub = useSovereignStore.subscribe(
      (state) => {
        const did = didRef.current;
        if (!did) return;

        const fingerprint = `${state.love}:${state.spoons}`;
        if (fingerprint === lastPushRef.current) return;

        // Debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
          const s = useSovereignStore.getState();
          const payload: SyncPayload = {
            love: s.love,
            spoons: s.spoons,
            careScore: 0, // Will be populated from wallet when available
            timestamp: Date.now(),
          };

          const serverHash = await pushState(did, payload);
          if (serverHash) {
            lastPushRef.current = fingerprint;
            console.log('[GenesisSync] pushed, serverHash:', serverHash);
          }
        }, DEBOUNCE_MS);
      },
    );

    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
}
