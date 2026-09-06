import { } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';

interface AgeGateProps {
  onAgeSet: (age: number) => void;
}

const ages = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export function AgeGate({ onAgeSet }: AgeGateProps) {
  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <GlassCard className="p-8 max-w-sm w-full text-center">
        <h1 className="text-3xl font-bold text-quantum-cyan mb-2 font-mono-tech">Willow</h1>
        <p className="text-cloud/50 text-sm mb-6">How old are you?</p>
        <div className="grid grid-cols-3 gap-3">
          {ages.map((age) => (
            <GlowButton
              key={age}
              color="cyan"
              onClick={() => onAgeSet(age)}
              className="text-lg"
            >
              {age}
            </GlowButton>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
