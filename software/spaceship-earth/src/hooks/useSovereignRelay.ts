/**
 * @file useSovereignRelay — React hook that lifecycle-manages the sovereign relay.
 *
 * Mount: opens the WebSocket connection via sovereignRelay.connect()
 * Update: re-connects when DID or room changes (new hello frame)
 * Unmount: disconnects cleanly
 *
 * The hook reads DID and current room from the sovereign store so callers
 * don't need to thread those values down manually.
 *
 * Usage (mount once at the SovereignShell level):
 *   useSovereignRelay();
 */

import { useEffect } from 'react';
import { useSovereignStore } from '../sovereign/useSovereignStore';
import * as relay from '../services/sovereignRelay';

export function useSovereignRelay(): void {
  const didKey    = useSovereignStore(s => s.didKey);
  const openRoom  = useSovereignStore(s => s.openOverlay);

  useEffect(() => {
    // No relay configured → silent no-op (VITE_RELAY_URL absent)
    if (!relay.isRelayConfigured()) return;

    const did  = didKey === 'UNINITIALIZED' ? null : didKey;
    const room = typeof openRoom === 'string' ? openRoom : null;

    relay.connect(did, room);
    relay.setRoom(room);

    return () => {
      relay.disconnect();
    };
    // Reconnect when DID changes (identity import) or room changes (hello refresh)
  }, [didKey, openRoom]);
}
