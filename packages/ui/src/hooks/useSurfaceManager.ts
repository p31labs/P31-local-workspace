/**
 * @file useSurfaceManager.ts — Synergy engine (CWP-2026-073).
 *
 * Tracks the single "hero" surface across the whole P31 mesh and broadcasts
 * focus changes to every other open vertex (V1–V4) via BroadcastChannel, so
 * opening Passport on one origin ghosts the same surface everywhere. Soft-ambient
 * by default: nothing is forced to hero until an explicit focus() is called.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type SurfaceFocusState = 'hero' | 'ghost' | 'true';

export interface SurfaceManager {
  activeSurface: string | null;
  focus: (surfaceId: string) => void;
  release: () => void;
}

type MeshMessage =
  | { type: 'FOCUS'; surfaceId: string; origin: string }
  | { type: 'RELEASE'; origin: string };

const CHANNEL = 'p31-mesh-surface';

export function useSurfaceManager(): SurfaceManager {
  const [activeSurface, setActiveSurface] = useState<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(CHANNEL);
    channelRef.current = ch;
    ch.onmessage = (ev: MessageEvent<MeshMessage>) => {
      if (ev.data.type === 'FOCUS') {
        // A surface gained focus elsewhere — demote our local view.
        const surfaceId = ev.data.surfaceId;
        setActiveSurface((cur) => (cur && cur !== surfaceId ? cur : surfaceId));
      } else if (ev.data.type === 'RELEASE') {
        setActiveSurface((cur) => (cur ? null : cur));
      }
    };
    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, []);

  const focus = useCallback((surfaceId: string) => {
    setActiveSurface(surfaceId);
    channelRef.current?.postMessage({ type: 'FOCUS', surfaceId, origin: window.location.origin } as MeshMessage);
  }, []);

  const release = useCallback(() => {
    setActiveSurface(null);
    channelRef.current?.postMessage({ type: 'RELEASE', origin: window.location.origin } as MeshMessage);
  }, []);

  return { activeSurface, focus, release };
}
