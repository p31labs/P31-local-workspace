// spaceship-earth/src/components/hud/CockpitHUD.tsx
import { memo } from 'react';
import { SpoonGauge } from './SpoonGauge';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface Props {
  spoons: number;
  maxSpoons: number;
  love: number;
  tier: string;
}

export const CockpitHUD = memo(function CockpitHUD({ spoons, maxSpoons, love, tier }: Props) {
  const isOnline = useOnlineStatus();

  return (
    <aside className="cockpit-hud" aria-label="Status gauges" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      <div style={{
        fontFamily: "var(--font-data)", fontSize: 9, letterSpacing: 2,
        padding: '4px 8px', borderRadius: 'var(--radius-sm)',
        background: isOnline ? 'var(--neon-ghost)' : 'rgba(255, 184, 0, 0.1)',
        color: isOnline ? 'var(--mint)' : 'var(--amber)',
        border: `1px solid ${isOnline ? 'var(--neon-ghost)' : 'var(--amber)44'}`,
        opacity: isOnline ? 0.6 : 1,
        transition: 'all var(--trans-base)',
        textShadow: isOnline ? 'none' : '0 0 8px var(--amber)',
        pointerEvents: 'auto',
      }}>
        {isOnline ? 'NETWORK: ONLINE' : 'NETWORK: OFFLINE'}
      </div>
      <SpoonGauge spoons={spoons} maxSpoons={maxSpoons} love={love} tier={tier} />
    </aside>
  );
});
