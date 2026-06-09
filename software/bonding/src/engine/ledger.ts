// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Engagement ledger: every action timestamped
//
// This is the Exhibit A log — objective quality evidence
// that the game IS the engagement between parent and child.
// Every atom placed, every bond formed, every molecule
// completed — timestamped, session-tagged, exportable.
//
// Emits p31:exhibit-a.log via MessageChannel when running
// inside the Hub sandbox.
// ═══════════════════════════════════════════════════════

import type { EngagementEvent } from '../types';

const SESSION_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

const events: EngagementEvent[] = [];

/**
 * Log a game event to the ledger.
 * Persists to localStorage and emits to parent frame (Hub sandbox).
 */
export function logEvent(
  eventType: EngagementEvent['eventType'],
  metadata: Record<string, unknown> = {},
): void {
  const event: EngagementEvent = {
    timestamp: new Date().toISOString(),
    gameId: '',
    sessionId: SESSION_ID,
    playerId: 0,
    playerName: '',
    eventType,
    metadata,
  };
  events.push(event);

  // Persist to localStorage
  try {
    localStorage.setItem('bonding:ledger', JSON.stringify(events));
  } catch {
    // Storage unavailable — swallow
  }

  // Emit to Hub sandbox via postMessage (p31:exhibit-a.log protocol)
  try {
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'p31:exhibit-a.log',
          payload: event,
        },
        '*',
      );
    }
  } catch {
    // Cross-origin blocked — swallow
  }
}

/**
 * Get all events in this session (read-only).
 */
export function getEvents(): readonly EngagementEvent[] {
  return events;
}

/**
 * Get current session ID.
 */
export function getSessionId(): string {
  return SESSION_ID;
}

/**
 * Export full ledger as formatted JSON string.
 */
export function exportLedgerJSON(): string {
  return JSON.stringify(events, null, 2);
}

/**
 * Get event count by type (for achievement triggers).
 */
export function getEventCount(eventType: EngagementEvent['eventType']): number {
  return events.filter((e) => e.eventType === eventType).length;
}
