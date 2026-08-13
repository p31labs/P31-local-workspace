import { useCallback } from 'react';
import { useShipStore } from '../store/shipStore';

type Side = 'left' | 'right';

const LEFT_BUTTONS: { id: 'data'; icon: string; label: string }[] = [
  { id: 'data', icon: '📊', label: 'Data' },
];

const RIGHT_BUTTONS: { id: 'system' | 'hardware'; icon: string; label: string }[] = [
  { id: 'system', icon: '📈', label: 'System' },
  { id: 'hardware', icon: '🔌', label: 'Hardware' },
];

export default function HUDPill({ side }: { side: Side }) {
  const leftSection = useShipStore((s) => s.hudLeft);
  const rightSection = useShipStore((s) => s.hudRight);
  const setHudLeft = useShipStore((s) => s.setHudLeft);
  const setHudRight = useShipStore((s) => s.setHudRight);

  const handleToggle = useCallback(
    (id: 'data' | 'system' | 'hardware') => {
      if (side === 'left') {
        setHudLeft(id === 'data' ? (leftSection === id ? null : id) : null);
      } else {
        const next = (id === 'system' || id === 'hardware') ? id : null;
        setHudRight(rightSection === id ? null : next);
      }
    },
    [side, leftSection, rightSection, setHudLeft, setHudRight],
  );

  const buttons = side === 'left' ? LEFT_BUTTONS : RIGHT_BUTTONS;
  const active = side === 'left' ? leftSection : rightSection;

  return (
    <div className={`hud-pill hud-pill--${side}`}>
      {buttons.map(({ id, icon, label }) => (
        <button
          key={id}
          className={`hud-pill-btn${active === id ? ' active' : ''}`}
          onClick={() => handleToggle(id)}
          aria-label={label}
          title={label}
        >
          <span className="hud-pill-icon" aria-hidden="true">
            {icon}
          </span>
          <span className="hud-pill-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
