import React from 'react';
import { useBrainDumpStream } from '../hooks/useBrainDumpStream';

interface StatusDashboardProps {
  id: string;
}

export function StatusDashboard({ id }: StatusDashboardProps) {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const { status, loading, eventLog } = useBrainDumpStream(id, API_URL);

  const isTerminal = status?.status === 'completed' || status?.status === 'failed';

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 p-4 rounded">
        <h2 className="text-xl font-semibold">
          Status: <span className="font-mono">{status?.status || 'connecting...'}</span>
          {loading && !isTerminal && <span className="ml-2 text-xs text-slate-400 animate-pulse">(live)</span>}
        </h2>
        {status?.error && <p className="text-red-400 text-sm">Error: {status.error}</p>}

        {status?.axes && status.axes.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Axes ({status.axes.length})</h3>
            <ul className="grid grid-cols-2 gap-2 mt-2">
              {status.axes.map((axis: any, idx: number) => {
                const latest = eventLog
                  .slice()
                  .reverse()
                  .find((ev) => ev.event === 'status' && ev.data?.axes?.some((a: any) => a.id === axis.id || a.letter === axis.letter));
                const axisStatus = latest?.data?.axes?.find((a: any) => a.id === axis.id || a.letter === axis.letter);
                const statusColor = axisStatus?.status === 'completed' ? 'text-green-400'
                  : axisStatus?.status === 'failed' ? 'text-red-400'
                  : axisStatus?.status === 'running' ? 'text-yellow-400'
                  : 'text-slate-400';
                return (
                  <li key={axis.id || idx} className={`bg-slate-700 p-2 rounded text-sm ${statusColor}`}>
                    <span className="font-semibold">{axis.letter || axis.id}</span> {axis.name || axis.id}
                    {axisStatus?.status && <span className="ml-1 text-xs">({axisStatus.status})</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {status?.convergence && (
          <div className="mt-4 p-3 bg-slate-700 rounded">
            <p className="font-bold">
              Convergence: <span className={status.convergence.overall === 'PASS' ? 'text-green-400' : 'text-red-400'}>
                {status.convergence.overall}
              </span>
            </p>
            {status.convergence.nextSteps?.length > 0 && (
              <ul className="text-sm mt-1">
                {status.convergence.nextSteps.map((step: string, i: number) => (
                  <li key={i}>• {step}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isTerminal && (
          <div className="mt-4">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-medium"
            >
              New Brain Dump
            </button>
          </div>
        )}
      </div>

      {eventLog.length > 0 && (
        <details className="bg-slate-800 border border-slate-700 rounded">
          <summary className="p-3 text-sm font-medium cursor-pointer text-slate-300">Event Log ({eventLog.length})</summary>
          <div className="p-3 pt-0 space-y-1 max-h-60 overflow-y-auto">
            {eventLog.map((ev, i) => (
              <div key={i} className="text-xs font-mono text-slate-400">
                [{ev.event}] {ev.message || (ev.data ? JSON.stringify(ev.data).slice(0, 120) : '')}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
