import { useShipStore } from '../store/shipStore';
import { createCrossAppState } from '../hooks/useCrossAppState';
import HUDPill from './HUDPill';
import HUDPopover from './HUDPopover';

type Side = 'left' | 'right';

function Dock({ side }: { side: Side }) {
  const spoons = useShipStore((s) => s.spoons);
  if (spoons <= 1) return null;

  const section = side === 'left' ? useShipStore((s) => s.hudLeft) : useShipStore((s) => s.hudRight);

  const close = () => {
    if (side === 'left') {
      useShipStore.getState().setHudLeft(null);
    } else {
      useShipStore.getState().setHudRight(null);
    }
  };

  return (
    <div className={`hud-shell hud-shell--${side}${section ? ' hud-shell--open' : ''}`}>
      {section ? (
        <HUDPopover side={side} section={section} onClose={close} />
      ) : (
        <HUDPill side={side} />
      )}
    </div>
  );
}

function CrossAppIndicator() {
  createCrossAppState();
  const shellSpoons = useShipStore((s) => s.spoons);

  return (
    <div style={{
      position: 'fixed',
      top: 8,
      right: 8,
      padding: '4px 10px',
      background: 'rgba(0,0,0,0.6)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      fontSize: 10,
      color: '#8899aa',
      fontFamily: "'JetBrains Mono', monospace",
      zIndex: 50,
      pointerEvents: 'none',
    }}>
      shell: {shellSpoons}/5
    </div>
  );
}

export default function HUDShell() {
  return (
    <>
      <Dock side="left" />
      <Dock side="right" />
      <CrossAppIndicator />
    </>
  );
}
