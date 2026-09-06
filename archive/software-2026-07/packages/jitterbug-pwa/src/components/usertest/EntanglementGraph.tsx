import React from 'react';
import { useUserTest } from '../../hooks/useUserTest';

export default function EntanglementGraph() {
  const { data: participants } = useUserTest('participants');
  const { data: sessions } = useUserTest('sessions');
  const ps = Array.isArray(participants) ? participants : [];
  const ss = Array.isArray(sessions) ? sessions : [];
  const W = 320;
  const H = Math.max(160, (ps.length + 1) * 32);
  return (
    <div className="glass-panel p-4">
      <h2 className="text-sm font-semibold text-quantum-cyan mb-3">Entanglements</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label="Participant to session relationships">
        {ps.map((p: any, i: number) => {
          const y = (i + 1) * (H / (ps.length + 1));
          const sess = ss.filter((s: any) => s.participant_id === p.id);
          return (
            <g key={p.id}>
              <circle cx={30} cy={y} r={6} fill="var(--color-quantum-cyan)" />
              <text x={42} y={y + 4} fill="white" fontSize={10}>{p.pseudonym}</text>
              {sess.map((s: any, j: number) => {
                const sx = 30 + ((j + 1) * (W - 80) / (sess.length + 1));
                return (
                  <line key={s.id} x1={36} y1={y} x2={sx} y2={y}
                    stroke="var(--color-quantum-cyan)" strokeOpacity={0.4} />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
