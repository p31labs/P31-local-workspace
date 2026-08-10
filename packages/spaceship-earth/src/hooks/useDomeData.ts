/**
 * @file hooks/useDomeData.ts — React hook for dome data lifecycle
 *
 * Usage:
 *   const { faceData, loading, error, activeConnector, refresh, setConnector } = useDomeData();
 */

import { useEffect, useCallback } from 'react';
import { useDataStore } from '../store/dataStore';
import type { DataConnector } from '../engine/dataConnectors';

export function useDomeData() {
  const faceData = useDataStore((s) => s.faceData);
  const loading = useDataStore((s) => s.loading);
  const error = useDataStore((s) => s.error);
  const activeConnector = useDataStore((s) => s.activeConnector);
  const refresh = useDataStore((s) => s.refresh);
  const setActiveConnector = useDataStore((s) => s.setActiveConnector);
  const aggregation = useDataStore((s) => s.aggregation);
  const setAggregation = useDataStore((s) => s.setAggregation);

  const setConnector = useCallback(
    (connector: DataConnector | null) => {
      setActiveConnector(connector);
    },
    [setActiveConnector],
  );

  useEffect(() => {
    if (!activeConnector) return;
    refresh();
  }, [activeConnector, refresh]);

  return {
    faceData,
    loading,
    error,
    activeConnector,
    refresh,
    setConnector,
    aggregation,
    setAggregation,
  };
}
