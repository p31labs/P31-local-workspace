import { useEffect, useState } from 'react';

export function CalciumHUD() {
  const [calcium, setCalcium] = useState<number | null>(null);
  const [status, setStatus] = useState<'normal' | 'low' | 'critical' | 'unknown'>('unknown');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalcium = async () => {
      try {
        const res = await fetch(
          'https://bonding-relay.trimtab-signal.workers.dev/api/mesh/calcium-latest?subject_id=will'
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setCalcium(data.calcium);
        setError(null);
        
        // Determine status based on thresholds
        if (data.calcium < 8.0) {
          setStatus('critical');
        } else if (data.calcium < 8.5) {
          setStatus('low');
        } else {
          setStatus('normal');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === 'HTTP 404') {
          // No calcium data posted yet — silent degraded state
        } else {
          console.error('Failed to fetch calcium data:', err);
          setError('Failed to load calcium data');
        }
        setCalcium(null);
        setStatus('unknown');
      }
    };

    // Fetch immediately and then every 30 seconds
    fetchCalcium();
    const interval = setInterval(fetchCalcium, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="text-[10px] text-gray-500 flex items-center gap-2">
        <div className="w-4 h-4 rounded-sm bg-[#EF4444]/20" />
        <span>Ca: --</span>
      </div>
    );
  }

  const colorMap: Record<typeof status, string> = {
    normal: '#00D4FF', // cyan
    low: '#FBBF24',    // yellow
    critical: '#EF4444', // red
    unknown: '#6B7280', // gray
  };

  return (
    <div className="text-[10px] text-gray-500 flex items-center gap-2">
      <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: colorMap[status] }} />
      <span className={`whitespace-nowrap`}>
        Ca: {calcium !== null ? calcium.toFixed(1) : '--'} mg/dL
      </span>
    </div>
  );
}