import { useShipStore } from '../store/shipStore';
import DataControls from './DataControls';
import DatasetPanel from './DatasetPanel';
import ExportButton from './ExportButton';
import TimeControls from './TimeControls';
import FaceInfo from './FaceInfo';
import DunaBoard from './DunaBoard';
import SystemBoard from './SystemBoard';
import LedController from './LedController';
import Legend from './Legend';

type Side = 'left' | 'right';

const TITLES: Record<string, string> = {
  data: 'Data',
  system: 'System',
  hardware: 'Hardware',
};

export default function HUDPopover({ side, section, onClose }: { side: Side; section: 'data' | 'system' | 'hardware'; onClose: () => void }) {
  const setHudLeft = useShipStore((s) => s.setHudLeft);
  const setHudRight = useShipStore((s) => s.setHudRight);

  return (
    <div className={`hud-popover hud-popover--${side}`}>
      <div className="hud-popover-header">
        <span className="hud-popover-title">{TITLES[section]}</span>
        <button className="hud-popover-close" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </div>
      <div className="hud-popover-body" data-panel={section}>
        {side === 'left' && section === 'data' && (
          <div className="hud-section">
            <div data-panel="datacontrols"><DataControls /></div>
            <div data-panel="dataset"><DatasetPanel /></div>
            <TimeControls />
            <ExportButton />
            <FaceInfo />
          </div>
        )}
        {side === 'right' && section === 'system' && (
          <div className="hud-section">
            <div data-panel="duna"><DunaBoard /></div>
            <div data-panel="system"><SystemBoard /></div>
            <Legend />
          </div>
        )}
        {side === 'right' && section === 'hardware' && (
          <div className="hud-section">
            <div data-panel="led"><LedController /></div>
          </div>
        )}
      </div>
    </div>
  );
}
