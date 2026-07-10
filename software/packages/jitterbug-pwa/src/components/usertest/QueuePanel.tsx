import React from 'react';
import { useUserTest } from '../../hooks/useUserTest';

export default function QueuePanel() {
  const { data } = useUserTest('sessions');
  const list = Array.isArray(data) ? data : [];
  const entered = list.filter((s: any) => !s.paid);
  const done = list.filter((s: any) => s.paid);
  return (
    <div className="glass-panel p-4">
      <h2 className="text-sm font-semibold text-quantum-cyan mb-3">Queue (depressed = unpaid)</h2>
      <p className="text-xs text-cloud">Entered / active: {entered.length}</p>
      <p className="text-xs text-cloud">Settled: {done.length}</p>
    </div>
  );
}
