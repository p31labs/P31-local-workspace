import React from 'react';
import { useUserTest } from '../../hooks/useUserTest';

export default function DeadlineTracker() {
  const { data, loading } = useUserTest('deadlines');
  const deadlines = Array.isArray(data) ? data : [];
  return (
    <div className="glass-panel p-4">
      <h2 className="text-sm font-semibold text-quantum-cyan mb-3">Deadlines</h2>
      {loading ? (
        <p className="text-cloud text-sm">Loading…</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {deadlines.map((d: any) => (
            <li key={d.id} className="flex justify-between border-b border-white/5 py-1">
              <span className="text-white">{d.label}</span>
              <span className={d.met ? 'text-quantum-green' : 'text-cloud'}>
                {d.due_date || '—'} {d.met ? '✓' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
