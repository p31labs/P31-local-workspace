/**
 * @file cockpit/BuckyView.tsx — Full-screen Dymaxion net overlay.
 *
 * Unfolds the dome into the verified Wikipedia icosahedron net and renders it
 * as an SVG: base-cell outlines, one circle per dome face (coloured from the
 * active dataset), connection arcs between linked faces, and click-to-select
 * that mirrors the 3D dome's port selection.
 */

import { useEffect, useMemo } from 'react';
import { buildDymaxionNet, buildConnectionSegments } from '../engine/dymaxion';
import { useDatasetStore, useActiveFaceData } from '../store/datasetStore';
import { useShipStore } from '../store/shipStore';

const PAD = 8;
const FACE_RADIUS = 1.6;
const SELECTED_RADIUS = 2.6;

export default function BuckyView() {
  const buckyMode = useDatasetStore((s) => s.buckyMode);
  const setBuckyMode = useDatasetStore((s) => s.setBuckyMode);

  const faceData = useActiveFaceData();

  const selectedPort = useShipStore((s) => s.selectedPort);
  const hoveredPort = useShipStore((s) => s.hoveredPort);
  const setSelectedPort = useShipStore((s) => s.setSelectedPort);
  const setHoveredPort = useShipStore((s) => s.setHoveredPort);
  const setSelectedNode = useShipStore((s) => s.setSelectedNode);
  const spoons = useShipStore((s) => s.spoons);

  const net = useMemo(() => buildDymaxionNet(faceData), [faceData]);
  const segments = useMemo(() => buildConnectionSegments(faceData, net), [faceData, net]);

  useEffect(() => {
    if (!buckyMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBuckyMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [buckyMode, setBuckyMode]);

  if (!buckyMode) return null;

  const { minX, minY, maxX, maxY } = net.bounds;
  const viewBox = `${minX - PAD} ${minY - PAD} ${net.width + PAD * 2} ${net.height + PAD * 2}`;
  const motionAllowed = spoons >= 2;

  const handleFaceClick = (faceIndex: number) => {
    setSelectedNode(null);
    setSelectedPort(faceIndex);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(3,6,10,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button
        onClick={() => setBuckyMode(false)}
        aria-label="Close Dymaxion map"
        style={{
          position: 'absolute',
          top: 16,
          right: 20,
          background: 'rgba(255,255,255,0.06)',
          color: '#9fb0c3',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: '8px 14px',
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          zIndex: 510,
        }}
      >
        Close (Esc)
      </button>

      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '1400px',
          maxHeight: '95vh',
          overflow: 'hidden',
        }}
        role="img"
        aria-label="Dymaxion net of the Spaceship Earth dome"
      >
        {/* Base cell outlines */}
        {net.cells.map((cell) => {
          const [a, b, c] = cell.corners;
          return (
            <polygon
              key={cell.baseFace}
              points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
              fill="rgba(34,211,238,0.03)"
              stroke="rgba(34,211,238,0.28)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Connection arcs */}
        <g fill="none">
          {segments.map((seg, i) => {
            const mx = (seg.x1 + seg.x2) / 2;
            const my = (seg.y1 + seg.y2) / 2;
            const dx = seg.x2 - seg.x1;
            const dy = seg.y2 - seg.y1;
            const len = Math.hypot(dx, dy) || 1;
            const bow = Math.min(6, len * 0.12);
            const cx = mx - (dy / len) * bow;
            const cy = my + (dx / len) * bow;
            return (
              <path
                key={`${seg.from}-${seg.to}-${i}`}
                d={`M ${seg.x1},${seg.y1} Q ${cx},${cy} ${seg.x2},${seg.y2}`}
                stroke="rgba(167,139,250,0.55)"
                strokeWidth={0.6}
              />
            );
          })}
        </g>

        {/* Face circles */}
        {net.points.map((p) => {
          const isSelected = p.faceIndex === selectedPort;
          const isHovered = p.faceIndex === hoveredPort;
          const r = isSelected ? SELECTED_RADIUS : FACE_RADIUS;
          return (
            <circle
              key={p.faceIndex}
              cx={p.x}
              cy={p.y}
              r={r}
              fill={p.color}
              stroke={isSelected ? '#ffffff' : isHovered ? '#ffcc44' : 'rgba(255,255,255,0.25)'}
              strokeWidth={isSelected ? 0.9 : 0.35}
              opacity={0.92}
              style={{
                cursor: 'pointer',
                transition: motionAllowed ? 'r 120ms ease, stroke-width 120ms ease' : 'none',
              }}
              onClick={() => handleFaceClick(p.faceIndex)}
              onPointerEnter={() => setHoveredPort(p.faceIndex)}
              onPointerLeave={() => setHoveredPort(null)}
            >
              {(isSelected || isHovered) && p.label && (
                <title>{p.label}</title>
              )}
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
