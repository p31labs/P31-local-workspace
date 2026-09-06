import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '@p31/ui/chrome';
import type { Pilot } from '../types/pilot';

interface StatusChartProps {
  pilots: Pilot[];
}

export function StatusChart({ pilots }: StatusChartProps) {
  const data = [
    { name: 'Active', count: pilots.filter((p) => p.status === 'active').length },
    { name: 'Invited', count: pilots.filter((p) => p.status === 'invited').length },
    { name: 'Pending', count: pilots.filter((p) => p.status === 'pending').length },
  ];

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-heading text-cloud uppercase tracking-wider mb-4">
        Pilot Status
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="#A1A1AA" fontSize={12} />
          <YAxis stroke="#A1A1AA" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#12121A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#F5F5F7',
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#00F0FF" />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
