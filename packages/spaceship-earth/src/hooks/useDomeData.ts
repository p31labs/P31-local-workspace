/**
 * @file hooks/useDomeData.ts — React hook for dome data lifecycle
 *
 * Usage:
 *   const { faceData, vertexData, loading, error, activeConnector, refresh, setConnector } = useDomeData();
 */

import { useEffect, useCallback } from 'react';
import { useDataStore } from '../store/dataStore';
import type { DataConnector } from '../engine/dataConnectors';

export function useDomeData() {
  const faceData = useDataStore((s) => s.faceData);
  const vertexData = useDataStore((s) => s.vertexData);
  const loading = useDataStore((s) => s.loading);
  const error = useDataStore((s) => s.error);
  const activeConnector = useDataStore((s) => s.activeConnector);
  const refresh = useDataStore((s) => s.refresh);
  const setActiveConnector = useDataStore((s) => s.setActiveConnector);
  const aggregation = useDataStore((s) => s.aggregation);
  const setAggregation = useDataStore((s) => s.setAggregation);
  const timeSeries = useDataStore((s) => s.timeSeries);
  const isPlaying = useDataStore((s) => s.isPlaying);
  const currentTimeIndex = useDataStore((s) => s.currentTimeIndex);
  const setIsPlaying = useDataStore((s) => s.setIsPlaying);
  const setCurrentTimeIndex = useDataStore((s) => s.setCurrentTimeIndex);

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
    vertexData,
    loading,
    error,
    activeConnector,
    refresh,
    setConnector,
    aggregation,
    setAggregation,
    timeSeries,
    isPlaying,
    currentTimeIndex,
    setIsPlaying,
    setCurrentTimeIndex,
  };
}
