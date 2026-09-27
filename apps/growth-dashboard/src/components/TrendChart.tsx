import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '@p31ca/ui/chrome';
import type { Pilot } from '../types/pilot';

interface TrendChartProps {
  pilots: Pilot[];
}

export function TrendChart({ pilots }: TrendChartProps) {
  const points: { date: string; count: number }[] = [];
  const byDate = new Map<string, number>();
  for (const p of pilots) {
    if (!p.invited_at && !p.created_at) continue;
    const date = (p.invited_at || p.created_at!)!.split('T')[0];
    byDate.set(date, (byDate.get(date) || 0) + 1);
  }
  const sorted = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let running = 0;
  for (const [date, count] of sorted) {
    running += count;
    points.push({ date, count: running });
  }

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-heading text-cloud uppercase tracking-wider mb-4">
        Onboarding Trend
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke="#A1A1AA" fontSize={12} tickFormatter={(v) => v.slice(5)} />
          <YAxis stroke="#A1A1AA" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#12121A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#F5F5F7',
            }}
          />
          <Line type="monotone" dataKey="count" stroke="#A78BFA" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
