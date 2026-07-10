import React from 'react';
import { useUserTest } from '../../hooks/useUserTest';

export default function ParticipantTable() {
  const { data, loading } = useUserTest('participants');
  const participants = Array.isArray(data) ? data : [];
  return (
    <div className="glass-panel p-4">
      <h2 className="text-sm font-semibold text-quantum-cyan mb-3">Participants</h2>
      {loading ? (
        <p className="text-cloud text-sm">Loading…</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {participants.map((p: any) => (
            <li key={p.id} className="flex justify-between border-b border-white/5 py-1">
              <span className="text-white">{p.pseudonym}</span>
              <span className="text-cloud">{p.cohort} · {p.neurotype || '—'}</span>
            </li>
          ))}
          {participants.length === 0 && <li className="text-cloud">No participants yet.</li>}
        </ul>
      )}
    </div>
  );
}
