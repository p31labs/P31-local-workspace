import { GlassCard } from '@p31/ui/chrome';
import type { Pilot } from '../types/pilot';

interface MetricsCardsProps {
  pilots: Pilot[];
  lastSync?: string | null;
}

export function MetricsCards({ pilots, lastSync }: MetricsCardsProps) {
  const total = pilots.length;
  const active = pilots.filter((p) => p.status === 'active').length;
  const invited = pilots.filter((p) => p.status === 'invited').length;
  const live = pilots.filter((p) => p.source === 'live').length;
  const synthetic = pilots.filter((p) => p.source === 'synthetic').length;
  const test = pilots.filter((p) => p.source === 'test').length;

  const cards = [
    { label: 'Total Pilots', value: total, accent: '' },
    { label: 'Active', value: active, accent: 'text-quantum-green' },
    { label: 'Invited', value: invited, accent: 'text-quantum-gold' },
    { label: 'Live', value: live, accent: 'text-quantum-cyan' },
    { label: 'Synthetic', value: synthetic, accent: 'text-quantum-violet' },
    { label: 'Test', value: test, accent: 'text-muted' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {cards.map((card) => (
        <GlassCard key={card.label} className="p-5 text-center">
          <div className={`text-3xl font-bold font-heading ${card.accent}`}>
            {card.value}
          </div>
          <div className="text-xs text-cloud uppercase tracking-wider mt-1">
            {card.label}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
