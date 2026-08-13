/**
 * @file hooks/useSessionMetrics.ts
 *
 * Collects wellbeing-focused session metrics. All data is stored locally
 * (memory + optional IndexedDB). No telemetry leaves the device.
 *
 * Metrics:
 *   - TTFI: time from mount to first user interaction
 *   - Spoon transitions: every change of data-spoons attribute
 *   - Undo rate: undo events per minute
 *   - Rest entry/exit: timestamps for crisis mode
 *   - Session duration: total time from mount to unmount
 *
 * Success metrics (from research):
 *   - TTFI <3s at spoons>=3, <15s at spoons<=2
 *   - Undo rate <0.5 per minute
 *   - Rest efficiency: >80% of rest sessions exit within 120s
 *   - State stability: user overrides <15%
 */

import { useEffect, useRef } from 'react';
import { useShipStore } from '../store/shipStore';
import { useHistoryStore } from '../store/useHistoryStore';

export interface SessionMetrics {
  ttfi: number | null;
  spoonTransitions: { from: number; to: number; timestamp: number }[];
  undoCount: number;
  sessionStart: number;
  sessionEnd: number | null;
  restEntries: { timestamp: number; duration: number | null }[];
}

const DB_NAME = 'p31-session-metrics';
const STORE_NAME = 'sessions';
const MAX_RECORDS = 50;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'sessionStart' });
      }
    };
  });
}

async function persistMetrics(metrics: SessionMetrics) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(metrics);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();

    // Prune old records
    const all = await new Promise<any[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (all.length > MAX_RECORDS) {
      all.sort((a, b) => a.sessionStart - b.sessionStart);
      const toDelete = all.slice(0, all.length - MAX_RECORDS);
      const delTx = db.transaction(STORE_NAME, 'readwrite');
      const delStore = delTx.objectStore(STORE_NAME);
      toDelete.forEach((r) => delStore.delete(r.sessionStart));
      await new Promise<void>((resolve, reject) => {
        delTx.oncomplete = () => resolve();
        delTx.onerror = () => reject(delTx.error);
      });
    }
  } catch {
    // IndexedDB not available — metrics stay in memory only
  }
}

export function useSessionMetrics() {
  const spoons = useShipStore((s) => s.spoons);
  const undoCount = useHistoryStore((s) => s.entries.length);
  const prevSpoonsRef = useRef(spoons);
  const ttfiRef = useRef<number | null>(null);
  const sessionStartRef = useRef(Date.now());
  const restEntryRef = useRef<{ timestamp: number; duration: number | null } | null>(null);
  const transitionsRef = useRef<{ from: number; to: number; timestamp: number }[]>([]);
  const undoSnapshotRef = useRef(0);

  // TTFI: first interaction within 30s of mount
  useEffect(() => {
    const handler = () => {
      if (ttfiRef.current === null) {
        ttfiRef.current = Date.now() - sessionStartRef.current;
      }
    };
    window.addEventListener('click', handler, { once: true });
    window.addEventListener('touchstart', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('keydown', handler);
    };
  }, []);

  // Track spoon transitions
  useEffect(() => {
    if (spoons !== prevSpoonsRef.current) {
      const prev = prevSpoonsRef.current;
      transitionsRef.current.push({ from: prev, to: spoons, timestamp: Date.now() });
      prevSpoonsRef.current = spoons;

      // Track rest mode entry/exit
      if (spoons === 0 && !restEntryRef.current) {
        restEntryRef.current = { timestamp: Date.now(), duration: null };
      } else if (spoons > 0 && restEntryRef.current) {
        restEntryRef.current.duration = Date.now() - restEntryRef.current.timestamp;
        restEntryRef.current = null;
      }
    }
  }, [spoons]);

  // Persist on unmount
  useEffect(() => {
    return () => {
      const metrics: SessionMetrics = {
        ttfi: ttfiRef.current,
        spoonTransitions: transitionsRef.current,
        undoCount: undoSnapshotRef.current,
        sessionStart: sessionStartRef.current,
        sessionEnd: Date.now(),
        restEntries: restEntryRef.current ? [restEntryRef.current] : [],
      };
      void persistMetrics(metrics);
    };
  }, []);

  // Update undo snapshot periodically
  useEffect(() => {
    const interval = setInterval(() => {
      undoSnapshotRef.current = undoCount;
    }, 5000);
    return () => clearInterval(interval);
  }, [undoCount]);

  return {
    getMetrics: (): SessionMetrics => ({
      ttfi: ttfiRef.current,
      spoonTransitions: transitionsRef.current,
      undoCount: undoSnapshotRef.current,
      sessionStart: sessionStartRef.current,
      sessionEnd: null,
      restEntries: restEntryRef.current ? [restEntryRef.current] : [],
    }),
  };
}
