import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { usePilots } from '../hooks/usePilots';
import { MetricsCards } from './MetricsCards';
import { SourceChart } from './SourceChart';
import { StatusChart } from './StatusChart';
import { TrendChart } from './TrendChart';
import { PilotTable } from './PilotTable';
import { SyncStatus } from './SyncStatus';

export default function Dashboard() {
  const { data: pilots, isLoading, isRefetching, refetch, dataUpdatedAt } = usePilots();
  const queryClient = useQueryClient();

  const lastSync = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined;

  useEffect(() => {
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['pilots'] });
    }, 60_000);
    return () => clearInterval(id);
  }, [queryClient]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-10">
        <h1 className="text-h1 font-heading text-ink">Growth Dashboard</h1>
        <p className="text-cloud mt-2 text-body">
          Sovereign pilot onboarding metrics · Uyuni Salt Flats
        </p>
      </header>

      <SyncStatus
        lastSync={lastSync}
        isRefetching={isRefetching}
        onRefresh={() => refetch()}
      />

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-surface2 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80 bg-surface2 rounded-2xl" />
            <div className="h-80 bg-surface2 rounded-2xl" />
            <div className="h-80 bg-surface2 rounded-2xl md:col-span-2" />
          </div>
        </div>
      ) : pilots ? (
        <>
          <MetricsCards pilots={pilots} lastSync={lastSync} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <SourceChart pilots={pilots} />
            <StatusChart pilots={pilots} />
            <TrendChart pilots={pilots} />
          </div>
          <PilotTable pilots={pilots} />
        </>
      ) : (
        <div className="text-center text-muted py-12">Unable to load pilot data.</div>
      )}
    </div>
  );
}
