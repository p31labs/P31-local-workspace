import React from 'react';

export default function SignalsPanel({ signals }: { signals: any }) {
  const items = [
    { label: 'Active Nodes', value: signals.activeNodes ?? 0 },
    { label: 'Sessions', value: signals.totalSessions ?? 0 },
    { label: 'Findings', value: signals.findingsCount ?? 0 },
    { label: 'Pending Pay', value: signals.pendingPayments ?? 0 },
    { label: 'Days to Aug 1', value: signals.daysLeft ?? '—' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3" role="status" aria-live="polite">
      {items.map((it) => (
        <div key={it.label} className="glass-panel p-4 text-center">
          <div className="text-2xl font-mono text-quantum-cyan">{it.value}</div>
          <div className="text-xs uppercase tracking-wide text-cloud mt-1">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
