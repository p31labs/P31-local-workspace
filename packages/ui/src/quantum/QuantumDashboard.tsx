import { SICMeasurement } from './SICMeasurement';
import { PosnerViz } from './PosnerViz';
import { K4Topology } from './K4Topology';

export function QuantumDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-quantum="dashboard">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-widest text-cloud/40 uppercase">SIC-POVM</h3>
        <SICMeasurement />
      </div>
      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-widest text-cloud/40 uppercase">Posner Molecule</h3>
        <PosnerViz />
      </div>
      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-widest text-cloud/40 uppercase">K4 Topology</h3>
        <K4Topology />
      </div>
    </div>
  );
}
