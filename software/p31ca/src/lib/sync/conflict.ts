export interface SyncConflict {
  table: string;
  id: string;
  localRow: Record<string, unknown>;
  remoteRow: Record<string, unknown>;
  conflictedAt: number;
}

export type ConflictResolution = 'keep-local' | 'keep-remote';

export function detectConflict(
  localRow: Record<string, unknown>,
  remoteRow: Record<string, unknown>,
): boolean {
  const localHash = hashRow(localRow);
  const remoteHash = hashRow(remoteRow);
  return localHash !== remoteHash;
}

function hashRow(row: Record<string, unknown>): string {
  const stable = Object.keys(row).sort().map((k) => `${k}:${row[k]}`).join('|');
  let h = 0;
  for (let i = 0; i < stable.length; i++) {
    h = Math.imul(31, h) + stable.charCodeAt(i) | 0;
  }
  return h.toString(16);
}
