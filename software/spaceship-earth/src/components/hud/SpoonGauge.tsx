// spaceship-earth/src/components/hud/SpoonGauge.tsx
import { memo, useMemo } from 'react';

interface Props {
  spoons: number;
  maxSpoons: number;
  love: number;
  tier: string;
}

export const SpoonGauge = memo(function SpoonGauge({ spoons, maxSpoons, love, tier }: Props) {
  const tierColor = tier === 'REFLEX' ? '#FF4444' : tier === 'PATTERN' ? '#FFD700' : '#00FFFF';
  const pct = useMemo(() => `${Math.round((spoons / maxSpoons) * 100)}%`, [spoons, maxSpoons]);
  const loveStr = useMemo(() => love.toLocaleString(), [love]);

  return (
    <div className="glass-card spoon-gauge" role="status" aria-label={`${spoons} of ${maxSpoons} spoons`} style={{
      padding: '16px 20px',
      minHeight: '48px',
      minWidth: '200px',
      fontSize: '16px',
    }}>
      <div className="spoon-gauge-row" style={{ marginBottom: '8px' }}>
        <span className="spoon-gauge-label" style={{ fontSize: '16px', opacity: 0.8 }}>spoons</span>
        <span className="spoon-gauge-value" style={{ fontSize: '18px', fontWeight: '700' }}>{spoons}/{maxSpoons}</span>
        <span className="spoon-gauge-tier" style={{ 
          color: tierColor, 
          textShadow: `0 0 8px ${tierColor}44`,
          fontSize: '16px',
          fontWeight: '700',
          marginLeft: 'auto',
          letterSpacing: '1px'
        }}>
          {tier}
        </span>
      </div>
      <div className="progress-track spoon-gauge-track" role="progressbar" aria-valuenow={spoons} aria-valuemin={0} aria-valuemax={maxSpoons} aria-label="Spoon energy" style={{
        height: '6px',
        marginBottom: '8px',
      }}>
        <div className="progress-fill" style={{
          background: `linear-gradient(90deg, ${tierColor}, ${tierColor}88)`,
          width: pct,
          height: '100%',
          borderRadius: '3px',
        }} />
      </div>
      <div className="spoon-gauge-love">
        <span className="spoon-gauge-love-label" style={{ fontSize: '14px', opacity: 0.8 }}>LOVE</span>
        <span className="spoon-gauge-love-value" style={{ fontSize: '18px', fontWeight: '700', marginLeft: '8px' }}>{loveStr}</span>
      </div>
    </div>
  );
});
