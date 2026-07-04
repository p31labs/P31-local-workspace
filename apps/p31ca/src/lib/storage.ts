import { set, get, del, keys, createStore } from 'idb-keyval';

const logStore = createStore('p31-logs', 'log-index');

/**
 * Log a self-care action for a given route to IndexedDB.
 * Keys are namespaced as `${route}:log:${timestamp}`.
 */
export async function logAction(route: string, action: string): Promise<void> {
  const key = `${route}:log:${Date.now()}`;
  await set(key, { action, ts: Date.now() }, logStore);
  
  // Also maintain an index of keys for this route for efficient enumeration
  const indexKey = `${route}:log-index`;
  const existingKeys = await get(indexKey, logStore) || [];
  await set(indexKey, [...existingKeys, key], logStore);
}

/**
 * Fetch all log entries for a route (most recent first).
 */
export async function getLogs(route: string): Promise<Array<{action: string; ts: number}>> {
  try {
    const indexKey = `${route}:log-index`;
    const keys = await get(indexKey, logStore) || [];
    
    // Fetch all log entries
    const entries = await Promise.all(
      keys.map(key => get(key, logStore))
    );
    
    // Filter out null/undefined entries and sort by timestamp (most recent first)
    return entries
      .filter((entry): entry is {action: string; ts: number} => entry !== null)
      .sort((a, b) => b.ts - a.ts);
  } catch (error) {
    console.warn(`Failed to get logs for route ${route}:`, error);
    return [];
  }
}

/**
 * Clear all logs for a route (admin/debug).
 */
export async function clearLogs(route: string): Promise<void> {
  try {
    const indexKey = `${route}:log-index`;
    const keys = await get(indexKey, logStore) || [];
    
    // Delete all log entries
    await Promise.all(
      keys.map(key => del(key, logStore))
    );
    
    // Clear the index
    await del(indexKey, logStore);
  } catch (error) {
    console.warn(`Failed to clear logs for route ${route}:`, error);
  }
}
