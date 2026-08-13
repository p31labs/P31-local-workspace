import { useCallback } from 'react';
import { useDatasetStore } from '../store/datasetStore';
import { sourceRegistry } from '../engine/sourceRegistry';

export default function DataControls() {
  const isLoading = useDatasetStore((s) => s.isLoading);
  const lastError = useDatasetStore((s) => s.lastError);
  const datasets = useDatasetStore((s) => s.datasets);
  const activeFaceId = useDatasetStore((s) => s.activeFaceDatasetId);
  const activeVertexId = useDatasetStore((s) => s.activeVertexDatasetId);
  const clearAll = useDatasetStore((s) => s.clearAll);
  const buckyMode = useDatasetStore((s) => s.buckyMode);
  const setBuckyMode = useDatasetStore((s) => s.setBuckyMode);

  const activeConnectorId =
    datasets.find((d) => d.id === activeVertexId)?.connectorId ??
    datasets.find((d) => d.id === activeFaceId)?.connectorId;

  const load = useCallback((id: string) => {
    void sourceRegistry.load(id);
  }, []);

  const clearData = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const activePersonal = activeConnectorId === 'personal-constellation';
  const activeFood = activeConnectorId?.startsWith('hapi-food');
  const activePop = activeConnectorId?.startsWith('hapi-pop');

  return (
    <div className="data-controls">
      <div className="data-controls-label">Data Sources</div>

      {datasets.length === 0 && (
        <div style={{ fontSize: 9, color: '#667788', textAlign: 'center', padding: '8px 0 12px' }}>
          Select a data source to begin, or upload your own.
        </div>
      )}

      <div className="data-controls-row">
        <button onClick={() => load('personal-constellation')} disabled={isLoading} className={`data-btn${activePersonal ? ' data-btn-primary' : ' data-btn-ghost'}`}>
          {isLoading && activePersonal ? 'Loading...' : 'Personal'}
        </button>

        <button onClick={() => load('hapi-food-security')} disabled={isLoading} className={`data-btn${activeFood ? ' data-btn-primary' : ' data-btn-ghost'}`}>
          {isLoading && activeFood ? 'Loading...' : 'Hunger Map'}
        </button>

        <button onClick={() => load('hapi-population')} disabled={isLoading} className={`data-btn${activePop ? ' data-btn-primary' : ' data-btn-ghost'}`}>
          {isLoading && activePop ? 'Loading...' : 'Population'}
        </button>

        <button onClick={clearData} disabled={isLoading} className="data-btn data-btn-clear">
          Clear
        </button>

        <button onClick={() => setBuckyMode(!buckyMode)} className={`data-btn${buckyMode ? ' data-btn-primary' : ' data-btn-ghost'}`}>
          {buckyMode ? 'Bucky: On' : 'Bucky'}
        </button>
      </div>

      {lastError && (
        <div className="data-controls-error">{lastError}</div>
      )}

      {activeConnectorId && !lastError && (
        <div className="data-controls-status">{sourceRegistry.get(activeConnectorId)?.name ?? activeConnectorId}</div>
      )}
    </div>
  );
}
