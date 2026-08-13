import { useState } from 'react';
import { useActiveFaceDataset, useDatasetStore } from '../store/datasetStore';
import type { NormalizedDataPoint } from '../engine/dataConnectors';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Serialize normalized points to CSV with the documented column order. */
export function pointsToCsv(points: NormalizedDataPoint[]): string {
  const header = 'id,value,category,label,timestamp,lat,lon,faceIndex,vertexIndex';
  const rows = points.map((point) => {
    const cells = [
      point.id ?? '',
      point.value ?? '',
      point.category ?? '',
      point.label ?? '',
      point.timestamp ?? '',
      point.location?.lat ?? '',
      point.location?.lon ?? '',
      point.faceIndex ?? '',
      point.vertexIndex ?? '',
    ];
    return cells.map((cell) => escapeCsvCell(String(cell))).join(',');
  });
  return [header, ...rows].join('\n');
}

export default function ExportButton() {
  const [captureUnavailable, setCaptureUnavailable] = useState(false);
  const activeDataset = useActiveFaceDataset();
  const datasets = useDatasetStore((s) => s.datasets);
  const dataset = activeDataset ?? datasets[0] ?? null;

  const handlePng = () => {
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas) throw new Error('no canvas found');
      const dataUrl = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.download = 'spaceship-earth.png';
      anchor.href = dataUrl;
      anchor.click();
    } catch {
      setCaptureUnavailable(true);
      window.setTimeout(() => setCaptureUnavailable(false), 1500);
    }
  };

  const handleCsv = () => {
    if (!dataset) return;
    const csv = pointsToCsv(dataset.data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.download = `${dataset.name}.csv`;
    anchor.href = url;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const buttonStyle: React.CSSProperties = {
    fontSize: 9,
    fontFamily: "'JetBrains Mono', monospace",
    borderRadius: 6,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e0e4ec',
    padding: '6px 10px',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button onClick={handlePng} style={buttonStyle} aria-label="Export dome as PNG">
        {captureUnavailable ? 'capture unavailable' : 'PNG'}
      </button>
      <button
        onClick={handleCsv}
        disabled={!dataset}
        style={{ ...buttonStyle, opacity: dataset ? 1 : 0.4, cursor: dataset ? 'pointer' : 'not-allowed' }}
        aria-label="Export dataset as CSV"
      >
        CSV
      </button>
    </div>
  );
}
