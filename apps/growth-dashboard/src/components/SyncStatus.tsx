interface SyncStatusProps {
  lastSync: string | undefined;
  isRefetching: boolean;
  onRefresh: () => void;
}

export function SyncStatus({ lastSync, isRefetching, onRefresh }: SyncStatusProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="text-xs text-muted font-heading uppercase tracking-wider">
        {lastSync
          ? `Last sync: ${new Date(lastSync).toLocaleString()}`
          : 'No sync yet'}
      </div>
      <button
        onClick={onRefresh}
        disabled={isRefetching}
        className="inline-flex items-center gap-2 text-xs font-heading uppercase tracking-wider px-3 py-1.5 rounded-lg bg-surface2 border border-white/10 text-cloud hover:border-quantum-cyan hover:text-quantum-cyan transition-colors disabled:opacity-60"
      >
        {isRefetching ? 'Refreshing...' : 'Refresh Now'}
      </button>
      {isRefetching && (
        <div className="animate-spin rounded-full h-3 w-3 border border-quantum-cyan border-t-transparent" />
      )}
    </div>
  );
}
