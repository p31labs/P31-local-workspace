/**
 * @file SovereignBadge — local-first / sync / PQC key status.
 * Shows PGlite local DB state, Yjs sync state, and PQC key readiness.
 * When offline: "Sovereign — all data local."
 *
 * @a2ui-component SovereignBadge
 * @a2ui-props pgliteReady boolean - Local database ready
 * @a2ui-props syncState "synced" | "syncing" | "offline" - Yjs sync state
 * @a2ui-props pqcReady boolean - PQC key material ready
 */

import { GOVERNANCE } from '../math/colors.js';

export type SyncState = 'synced' | 'syncing' | 'offline';

export interface SovereignBadgeProps {
  pgliteReady?: boolean;
  syncState?: SyncState;
  pqcReady?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SYNC_LABEL: Record<SyncState, string> = { synced: 'synced', syncing: 'syncing…', offline: 'all data local' };

export function SovereignBadge({ pgliteReady = true, syncState = 'offline', pqcReady = true, className, style }: SovereignBadgeProps) {
  const syncColor = syncState === 'synced'
    ? GOVERNANCE.chainVerified
    : syncState === 'syncing'
      ? GOVERNANCE.chainPending
      : GOVERNANCE.agentAccent;

  return (
    <span
      className={`p31-sovereign-badge inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs ${className || ''}`}
      style={style}
      title={pqcReady ? 'Post-quantum keys ready' : 'PQC keys pending'}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${syncState === 'offline' ? '' : 'bg-current'}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${syncState === 'offline' ? 'bg-transparent' : 'bg-current'}`} style={{ color: syncColor }} />
      </span>
      <span className="font-medium text-slate-200">Sovereign</span>
      {syncState === 'offline' ? (
        <span className={`text-[${GOVERNANCE.agentAccent}]`}>— all data local</span>
      ) : (
        <span className="font-mono text-slate-400">{SYNC_LABEL[syncState]}</span>
      )}
      {pqcReady ? <span className={`text-[10px] font-mono uppercase tracking-wide text-[${GOVERNANCE.chainVerified}]`}>ML-DSA</span> : null}
    </span>
  );
}

export default SovereignBadge;