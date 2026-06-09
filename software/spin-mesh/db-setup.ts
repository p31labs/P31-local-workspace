/**
 * SpIn Mesh — Database Setup
 * 
 * Shared database initialization for demo nodes and PHOS UI.
 * Creates PGLite instance and sets up TinyBase synchronization.
 */

import PGLite from '@electric-sql/pglite';
import { createDatabase, Table } from 'tinybase';
import { createSyncHierarchy, createLocalChangesListener } from 'tinybase/sync';

export interface DbSetup {
  db: PGLite;
  store: ReturnType<typeof createDatabase>;
  intentsTable: Table;
}

/**
 * Initialize database and TinyBase sync for a given user.
 * Returns the database, store, and intents table for querying.
 */
export async function initializeDbAndSync(userId: string, doUrl: string): Promise<DbSetup> {
  // Initialize PGLite database
  const db = new PGLite(`spin-${userId}.db`);
  await db.connect();
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY, 
      doc JSONB
    );
    CREATE TABLE IF NOT EXISTS intents (
      user_id TEXT, 
      resource_id TEXT, 
      desired_resource_id TEXT,
      PRIMARY KEY(user_id, resource_id)
    );
    CREATE TABLE IF NOT EXISTS attestations (
      resource_id TEXT PRIMARY KEY,
      encoded_attestation TEXT
    );
  `);
  
  // Create TinyBase store that mirrors PGLite intents
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
  // Poll PGLite intents every 3s and diff against TinyBase store
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

  return { db, store, intentsTable };
}

interface IntentRow {
  userId: string;
  resourceId: string;
  desiredResourceId: string;
}