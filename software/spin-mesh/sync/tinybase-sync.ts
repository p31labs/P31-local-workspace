/**
 * SpIn Mesh — TinyBase State Synchronization
 *
 * Bridges local PGLite changes to the remote Matchmaking DO via HTTP.
 * Automatically syncs `intents` table inserts/updates.
 */

import { createDatabase, Table } from 'tinybase';
import { createSyncHierarchy, createLocalChangesListener } from 'tinybase/sync';
import { PGLite } from '@electric-sql/pglite';

export interface SyncConfig {
  doUrl: string;           // Matchmaking DO base URL
  userId: string;          // local operator ID
  db: PGLite;              // PGLite instance
}

/**
 * Initialize sync: creates a TinyBase view over PGLite intents table
 * and starts a WebSocket connection (fallback to polling) to push changes.
 */
export function initSync({ doUrl, userId, db }: SyncConfig) {
  // Create a TinyBase database that mirrors PGLite intents
  const store = createDatabase();
  const intentsTable = store.setTable<IntentRow>('intents');

  // Load existing intents from PGLite into TinyBase
  const rows = db.prepare('SELECT user_id, resource_id, desired_resource_id FROM intents').all();
  for (const row of rows as any[]) {
    const key = `${row.user_id}|${row.resource_id}`;
    intentsTable.setRow(key, {
      userId: row.user_id,
      resourceId: row.resource_id,
      desiredResourceId: row.desired_resource_id,
    });
  }

  // Create sync hierarchy: PGLite → store → remote DO
  const sync = createSyncHierarchy({
    changesets: [
      {
        name: 'intents',
        getTable: (s) => s.getTable('intents'),
      },
    ],
    stores: [store],
  });

  // Listen for local changes and push to DO via HTTP POST
  createLocalChangesListener(sync, (changesetName, rowId, store, changeType) => {
    if (changesetName !== 'intents') return;
    const row = store.getRow(rowId);
    if (!row) return;

    // POST /intent with body {userId, resourceId, desiredResourceId}
    fetch(`${doUrl}/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: row.userId,
        resourceId: row.resourceId,
        desiredResourceId: row.desiredResourceId,
      }),
    }).catch(console.error);
  });

  // Also listen for PGLite direct changes (bypass TinyBase if needed)
  // For simplicity, we'll poll PGLite intents every 3s and diff against TinyBase store
  setInterval(() => {
    const remoteRows = db.prepare('SELECT user_id, resource_id, desired_resource_id FROM intents').all();
    for (const row of remoteRows as any[]) {
      const key = `${row.user_id}|${row.resource_id}`;
      if (!intentsTable.getRow(key)) {
        intentsTable.setRow(key, {
          userId: row.user_id,
          resourceId: row.resource_id,
          desiredResourceId: row.desired_resource_id,
        });
      }
    }
  }, 3000);
}

interface IntentRow {
  userId: string;
  resourceId: string;
  desiredResourceId: string;
}
