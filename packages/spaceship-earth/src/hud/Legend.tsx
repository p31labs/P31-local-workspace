import { useActiveFaceDataset, useActiveFaceData } from '../store/datasetStore';
import { defaultColorScale } from '../engine/faceMapper';
import type { FaceData } from '../engine/dataConnectors';
import type { Dataset } from '../engine/datasetTypes';

const GRADIENT_STOPS = 24;

/**
 * Sample the dome's exact color scale into a list of `rgb(...)` strings,
 * one per evenly spaced value between `min` and `max`. The legend bar is
 * built from these stops so it always matches the colored dome faces.
 */
export function buildGradientStops(min: number, max: number, count: number = GRADIENT_STOPS): string[] {
  if (count <= 0) return [];
  const n = count === 1 ? 1 : count;
  const stops: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    stops.push(defaultColorScale(min + (max - min) * t, min, max));
  }
  return stops;
}

/** Compact, high-contrast number formatting for legend min/max labels. */
export function formatLegendLabel(value: number): string {
  if (!Number.isFinite(value)) return '\u2013';
  const abs = Math.abs(value);
  if (abs >= 1000 || (abs > 0 && abs < 0.01)) return value.toExponential(2);
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

/** Deduplicated category list (first-seen order) for the categorical legend. */
export function collectLegendCategories(data: FaceData[]): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const face of data) {
    if (face.category && !seen.has(face.category)) {
      seen.add(face.category);
      categories.push(face.category);
    }
  }
  return categories;
}

export default function Legend() {
  const dataset: Dataset | null = useActiveFaceDataset();
  const faceData = useActiveFaceData();

  if (!dataset || faceData.length === 0) return null;

  const values = faceData.map((f) => f.value).filter((v): v is number => v !== null);
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const isCategory = !!dataset.schema?.hasCategory;
  const categories = isCategory ? collectLegendCategories(faceData) : [];
  const unit =
    dataset.metadata && typeof dataset.metadata.unit === 'string' && dataset.metadata.unit
      ? dataset.metadata.unit
      : undefined;
  const gradient = `linear-gradient(to right, ${buildGradientStops(min, max).join(', ')})`;

  return (
    <div style={panelStyle}>
      <div style={nameStyle}>{dataset.name}</div>
      {isCategory ? (
        <div style={chipRowStyle}>
          {categories.map((c) => (
            <span key={c} style={chipStyle}>{c}</span>
          ))}
        </div>
      ) : (
        <>
          <div style={barStyle(gradient)} aria-hidden="true" />
          <div style={labelsRowStyle}>
            <span style={{ color: '#e0e4ec' }}>{formatLegendLabel(min)}</span>
            {unit && <span style={unitStyle}>{unit}</span>}
            <span style={{ color: '#e0e4ec' }}>{formatLegendLabel(max)}</span>
          </div>
        </>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(6,10,18,0.92)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '12px 14px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  color: '#e0e4ec',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  pointerEvents: 'auto',
};

const nameStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 10,
  color: '#e0e4ec',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

function barStyle(gradient: string): React.CSSProperties {
  return {
    height: 12,
    borderRadius: 6,
    marginTop: 8,
    background: gradient,
    border: '1px solid rgba(255,255,255,0.1)',
  };
}

const labelsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 4,
  fontWeight: 600,
};

const unitStyle: React.CSSProperties = {
  color: '#6a7a8a',
  fontWeight: 400,
};

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
  marginTop: 8,
};

const chipStyle: React.CSSProperties = {
  background: 'rgba(34,211,238,0.12)',
  color: '#22d3ee',
  border: '1px solid rgba(34,211,238,0.35)',
  borderRadius: 4,
  padding: '2px 6px',
  fontSize: 9,
  fontWeight: 600,
  lineHeight: 1.4,
};
