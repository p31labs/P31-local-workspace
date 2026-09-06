import React from 'react';
import { useUserTest } from '../../hooks/useUserTest';

export default function FindingsList() {
  const { data, loading } = useUserTest('findings');
  const findings = Array.isArray(data) ? data : [];
  return (
    <div className="glass-panel p-4">
      <h2 className="text-sm font-semibold text-quantum-cyan mb-3">Findings</h2>
      {loading ? (
        <p className="text-cloud text-sm">Loading…</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {findings.map((f: any) => (
            <li key={f.id} className="border-b border-white/5 py-1">
              <span className="text-white">S{f.severity} · {f.category || 'general'}</span>
              <p className="text-cloud text-xs">{f.description || ''}</p>
            </li>
          ))}
          {findings.length === 0 && <li className="text-cloud">No findings yet.</li>}
        </ul>
      )}
    </div>
  );
}
