/**
 * P31 Genesis Block — Browser-side Daubert export
 * EXEC-06 / Gap I
 *
 * Call exportGenesisChain() from the browser console (or from a UI button)
 * to download the IndexedDB session backstop as a JSON file for offline
 * chain verification via genesis-daubert-export.mjs.
 *
 * Usage (browser console on bonding.p31ca.org):
 *   import('/genesis-export.js').then(m => m.exportGenesisChain())
 *
 * Or drop the downloadable snippet below into the console directly.
 */

import { get as idbGet } from 'idb-keyval';

const IDB_KEY_BACKSTOP = 'p31-session-backstop';

export interface SessionBackstop {
  sessionId: string;
  playerId: string;
  roomCode: string | null;
  startedAt: number;
  flushedSeq: number;
  events: Array<{
    seq: number;
    type: string;
    payload: Record<string, unknown>;
    ts: number;
    hash: string;
  }>;
  lastHash: string;
  sealed: boolean;
}

export async function exportGenesisChain(): Promise<void> {
  const backstop = await idbGet<SessionBackstop>(IDB_KEY_BACKSTOP);

  if (!backstop) {
    console.warn('[daubert] No session backstop found in IndexedDB. Start a BONDING session first.');
    return;
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    source: window.location.origin,
    sessions: [backstop],
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `genesis-chain-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`[daubert] Exported ${backstop.events.length} events from session ${backstop.sessionId}`);
  console.log('[daubert] Run: node genesis-daubert-export.mjs --input <downloaded-file>');
}

/**
 * Browser console snippet (no imports required):
 *
 * (async () => {
 *   const { get } = await import('https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm');
 *   const backstop = await get('p31-session-backstop');
 *   if (!backstop) { console.warn('No session data found'); return; }
 *   const blob = new Blob([JSON.stringify([backstop], null, 2)], {type:'application/json'});
 *   const a = Object.assign(document.createElement('a'), {
 *     href: URL.createObjectURL(blob),
 *     download: `genesis-${new Date().toISOString().slice(0,10)}.json`
 *   });
 *   document.body.appendChild(a); a.click(); document.body.removeChild(a);
 * })();
 */
