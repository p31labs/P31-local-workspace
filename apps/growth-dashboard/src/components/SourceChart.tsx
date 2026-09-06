import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { GlassCard } from '@p31/ui/chrome';
import type { Pilot } from '../types/pilot';

interface SourceChartProps {
  pilots: Pilot[];
}

const COLORS: Record<string, string> = {
  synthetic: '#A78BFA',
  test: '#A1A1AA',
  live: '#00F0FF',
};

export function SourceChart({ pilots }: SourceChartProps) {
  const data = [
    { name: 'Synthetic', value: pilots.filter((p) => p.source === 'synthetic').length },
    { name: 'Test', value: pilots.filter((p) => p.source === 'test').length },
    { name: 'Live', value: pilots.filter((p) => p.source === 'live').length },
  ].filter((d) => d.value > 0);

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-heading text-cloud uppercase tracking-wider mb-4">
        Source Distribution
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || '#666'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#12121A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#F5F5F7',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
