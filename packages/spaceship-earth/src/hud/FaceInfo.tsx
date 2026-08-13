import { useActiveFaceData, useActiveFaceDataset, useActiveTimeline } from '../store/datasetStore';
import { useShipStore } from '../store/shipStore';
import { formatTimestampShort } from '../engine/timeSeries';

const MAX_METADATA_ROWS = 6;

function renderMetaValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export default function FaceInfo() {
  const selectedPort = useShipStore((s) => s.selectedPort);
  const faceData = useActiveFaceData();
  const dataset = useActiveFaceDataset();
  const timeline = useActiveTimeline();

  if (selectedPort === null || !dataset) return null;
  const face = faceData[selectedPort];
  if (!face) return null;
  if (face.value == null && !face.category) return null;

  const metaEntries = face.metadata
    ? Object.entries(face.metadata).filter(([, v]) => v !== undefined).slice(0, MAX_METADATA_ROWS)
    : [];
  const currentTs = timeline?.timestamps?.[timeline.currentTimeIndex];

  return (
    <div style={cardStyle}>
      <button
        onClick={() => useShipStore.getState().setSelectedPort(null)}
        style={closeBtn}
        aria-label="Close face inspector"
      >
        ✕
      </button>

      <div style={headerStyle}>
        <span style={swatchStyle(face.color)} aria-hidden="true" />
        Face {face.faceIndex}
      </div>

      <div style={datasetNameStyle}>{dataset.name}</div>

      {face.value !== null ? (
        <div style={valueStyle('#e0e4ec')}>{face.value}</div>
      ) : (
        <div style={valueStyle(face.color)}>{face.category}</div>
      )}

      {face.label && <div style={labelStyle}>{face.label}</div>}

      {currentTs !== undefined && (
        <div style={timeStyle}>t = {formatTimestampShort(currentTs)}</div>
      )}

      {metaEntries.length > 0 && (
        <div style={metaStyle}>
          {metaEntries.map(([key, val]) => (
            <div key={key} style={metaRowStyle}>
              <span style={metaKeyStyle}>{key}:</span>
              <span style={{ textAlign: 'right' }}>{renderMetaValue(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  minWidth: 200,
  maxWidth: 260,
  background: 'rgba(6,10,18,0.88)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '14px 18px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  color: '#e0e4ec',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 9,
  color: '#6a7a8a',
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 6,
};

function swatchStyle(color: string): React.CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: 2,
    background: color,
    border: '1px solid rgba(255,255,255,0.2)',
    flexShrink: 0,
  };
}

const datasetNameStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 10,
  color: '#22d3ee',
  marginBottom: 6,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

function valueStyle(color: string): React.CSSProperties {
  return {
    fontSize: 20,
    fontWeight: 700,
    color,
    lineHeight: 1.2,
    overflowWrap: 'anywhere',
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#8899aa',
  marginTop: 4,
};

const timeStyle: React.CSSProperties = {
  fontSize: 9,
  color: '#6a7a8a',
  marginTop: 6,
};

const metaStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 9,
  color: '#8899aa',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  paddingTop: 6,
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  marginTop: 2,
};

const metaKeyStyle: React.CSSProperties = {
  color: '#6a7a8a',
  flexShrink: 0,
};

const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 10,
  background: 'none',
  border: 'none',
  color: '#667788',
  cursor: 'pointer',
  fontSize: 12,
};
