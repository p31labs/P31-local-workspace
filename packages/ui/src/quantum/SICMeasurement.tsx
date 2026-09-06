import { useEffect, useState, useRef } from 'react';
import { sicPovmProbabilities, sicPovmFidelity } from '@p31/quantum-core/sic-povm';

const COLORS = ['#00F0FF', '#A78BFA', '#FBBF24', '#34D399'];
const LABELS = ['|ψ₁⟩', '|ψ₂⟩', '|ψ₃⟩', '|ψ₄⟩'];

export interface SICMeasurementProps {
  rho?: [number, number, number, number];
  onMeasure?: (probs: number[]) => void;
  interval?: number;
  interactive?: boolean;
}

export function SICMeasurement({
  rho = [0.5, 0, 0, 0.5],
  onMeasure,
  interval = 2000,
  interactive = true,
}: SICMeasurementProps) {
  const [probs, setProbs] = useState<number[]>(() => sicPovmProbabilities(rho));
  const [isMeasuring, setIsMeasuring] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fidelity = sicPovmFidelity();
  const isSIC = Math.abs(fidelity - 1 / 3) < 1e-10;

  const measure = () => {
    const p = sicPovmProbabilities(rho);
    setProbs(p);
    onMeasure?.(p);
    setIsMeasuring(true);
    setTimeout(() => setIsMeasuring(false), 300);
  };

  useEffect(() => {
    if (interval > 0) {
      timerRef.current = setInterval(measure, interval);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [interval, rho]);

  return (
    <div className="sic-gauge" style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 12,
          fontSize: 10,
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.2)',
        }}
      >
        SIC-POVM d=2 &bull; overlap {fidelity.toFixed(4)}
        {isSIC && ' ✓'}
      </div>

      {probs.map((p, i) => (
        <div
          key={i}
          className={`outcome ${isMeasuring ? 'measuring' : ''}`}
          style={{
            backgroundColor: isMeasuring ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: isMeasuring ? `1px solid ${COLORS[i]}` : '1px solid transparent',
            cursor: interactive ? 'pointer' : 'default',
          }}
          onClick={() => interactive && measure()}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: COLORS[i] }}>
            {(p * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>
            {LABELS[i]}
          </div>
          <div className="bar" style={{ width: `${p * 100}%`, background: COLORS[i] }} />
        </div>
      ))}

      <button
        onClick={measure}
        style={{
          position: 'absolute',
          bottom: 8,
          right: 12,
          padding: '4px 12px',
          fontSize: 10,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          fontFamily: 'monospace',
        }}
      >
        ✦ measure
      </button>
    </div>
  );
}
