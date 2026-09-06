import type { Pilot } from '../types/pilot';

const SYNC_API = 'https://pilot.p31ca.org/api/pilots/sync';

export async function fetchPilots(): Promise<Pilot[]> {
  const res = await fetch(SYNC_API, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Sync failed (${res.status}): ${res.statusText}`);
  }
  const data = (await res.json()) as Pilot[];
  return data;
}
