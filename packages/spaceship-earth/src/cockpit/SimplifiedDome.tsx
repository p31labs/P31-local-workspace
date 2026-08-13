import { useState, useRef, useMemo, useCallback } from 'react';
import { DOME_FACE_CENTROIDS, DOME_EDGES, DOME_VERTICES } from '../math/domeMap';
import { useShipStore } from '../store/shipStore';
import { useActiveFaceData } from '../store/datasetStore';

const FACE_RADIUS = 2.5;
const SELECTED_RADIUS = 4.5;
const EDGE_COLOR = 'rgba(34,211,238,0.12)';
const DEFAULT_COLOR = 'rgba(34,211,238,0.35)';
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 5;
const TOOLTIP_OFFSET = 12;

function project(v: readonly [number, number, number]): [number, number] {
  const [x, y, z] = v;
  const d = 28 - z;
  const f = 14;
  return [x * f / d, (y - 6) * f / d];
}

export default function SimplifiedDome() {
  const selectedPort = useShipStore((s) => s.selectedPort);
  const hoveredPort = useShipStore((s) => s.hoveredPort);
  const setSelectedPort = useShipStore((s) => s.setSelectedPort);
  const setHoveredPort = useShipStore((s) => s.setHoveredPort);
  const setSelectedNode = useShipStore((s) => s.setSelectedNode);
  const coherence = useShipStore((s) => s.coherence);
  const dockedPorts = useShipStore((s) => s.dockedPorts);

  const faceData = useActiveFaceData();

  const faceMap = useMemo(() => {
    const map = new Map<number, (typeof faceData)[0]>();
    for (const fd of faceData) map.set(fd.faceIndex, fd);
    return map;
  }, [faceData]);

  const projectedCentroids = useMemo(() => {
    return DOME_FACE_CENTROIDS.map((v, i) => {
      const [px, py] = project(v);
      return { x: px, y: py, faceIndex: i as number };
    });
  }, []);

  const projectedEdges = useMemo(() => {
    return DOME_EDGES.map(([a, b]) => {
      const [ax, ay] = project(DOME_VERTICES[a as number]);
      const [bx, by] = project(DOME_VERTICES[b as number]);
      return { x1: ax, y1: ay, x2: bx, y2: by };
    });
  }, []);

  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of projectedCentroids) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }, [projectedCentroids]);

  const defaultWidth = bounds.maxX - bounds.minX + 24;
  const defaultHeight = bounds.maxY - bounds.minY + 24;

  const [viewBox, setViewBox] = useState({
    x: bounds.minX - 12,
    y: bounds.minY - 12,
    width: defaultWidth,
    height: defaultHeight,
  });

  const dragRef = useRef<{
    startX: number;
    startY: number;
    vbStartX: number;
    vbStartY: number;
  } | null>(null);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    faceIndex: number;
  } | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgWidth = rect.width;
    const svgHeight = rect.height;

    const mouseVBX = viewBox.x + ((e.clientX - rect.left) / svgWidth) * viewBox.width;
    const mouseVBY = viewBox.y + ((e.clientY - rect.top) / svgHeight) * viewBox.height;

    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const newWidth = Math.max(defaultWidth * ZOOM_MIN, Math.min(defaultWidth * ZOOM_MAX, viewBox.width * factor));
    const newHeight = Math.max(defaultHeight * ZOOM_MIN, Math.min(defaultHeight * ZOOM_MAX, viewBox.height * factor));

    const newX = mouseVBX - ((e.clientX - rect.left) / svgWidth) * newWidth;
    const newY = mouseVBY - ((e.clientY - rect.top) / svgHeight) * newHeight;

    setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
  }, [viewBox, defaultWidth, defaultHeight]);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      vbStartX: viewBox.x,
      vbStartY: viewBox.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [viewBox]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;
      const dx = (e.clientX - dragRef.current.startX) * scaleX;
      const dy = (e.clientY - dragRef.current.startY) * scaleY;
      setViewBox({
        x: dragRef.current.vbStartX - dx,
        y: dragRef.current.vbStartY - dy,
        width: viewBox.width,
        height: viewBox.height,
      });
    }

    if (hoveredPort !== null) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = rect.width / viewBox.width;
      const scaleY = rect.height / viewBox.height;
      setTooltip({
        x: rect.left + (e.clientX - rect.left),
        y: rect.top + (e.clientY - rect.top),
        faceIndex: hoveredPort,
      });
    }
  }, [hoveredPort, viewBox]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const handleFaceMove = useCallback((e: React.PointerEvent<SVGCircleElement>, faceIndex: number) => {
    if (!dragRef.current) {
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = rect.width / viewBox.width;
      const scaleY = rect.height / viewBox.height;
      setTooltip({
        x: rect.left + (e.clientX - rect.left),
        y: rect.top + (e.clientY - rect.top),
        faceIndex,
      });
    }
  }, [viewBox]);

  const handleFaceClick = useCallback((faceIndex: number) => {
    setSelectedNode(null);
    setSelectedPort(faceIndex);
  }, [setSelectedNode, setSelectedPort]);

  const getFill = useCallback((faceIndex: number): string => {
    const fd = faceMap.get(faceIndex);
    if (!fd) return DEFAULT_COLOR;
    if (fd.color) return fd.color;
    if (fd.value !== null && fd.value !== undefined) {
      const t = Math.max(0, Math.min(1, (fd.value as number) / 100));
      const r = Math.round(34 + t * (255 - 34));
      const g = Math.round(211 + t * (255 - 211));
      const b = Math.round(238 + t * (238 - 238));
      return `rgba(${r},${g},${b},${0.3 + t * 0.5})`;
    }
    return DEFAULT_COLOR;
  }, [faceMap]);

  const glowGradientId = 'coherence-glow';

  return (
    <>
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="simplified-dome"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          dragRef.current = null;
          setTooltip(null);
        }}
        role="img"
        aria-label="Simplified 2D dome view"
      >
        <defs>
          <radialGradient id={glowGradientId}>
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={coherence * 0.6} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </radialGradient>
        </defs>

        <g stroke={EDGE_COLOR} strokeWidth="0.4">
          {projectedEdges.map((e, i) => (
            <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
          ))}
        </g>

        {projectedCentroids.map((p) => {
          const isSelected = p.faceIndex === selectedPort;
          const isHovered = p.faceIndex === hoveredPort;
          const r = isSelected ? SELECTED_RADIUS : FACE_RADIUS;
          const fill = getFill(p.faceIndex);
          const isDocked = dockedPorts.includes(p.faceIndex);

          return (
            <circle
              key={p.faceIndex}
              cx={p.x}
              cy={p.y}
              r={r}
              fill={fill}
              stroke={isSelected ? '#ffffff' : isHovered ? '#ffcc44' : 'rgba(255,255,255,0.12)'}
              strokeWidth={isSelected ? 0.8 : 0.25}
              className="dome-face"
              style={{ cursor: 'pointer' }}
              onClick={() => handleFaceClick(p.faceIndex)}
              onPointerEnter={() => setHoveredPort(p.faceIndex)}
              onPointerLeave={() => {
                setHoveredPort(null);
                setTooltip(null);
              }}
              onPointerMove={(e) => handleFaceMove(e, p.faceIndex)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={`url(#${glowGradientId})`}
                opacity={coherence}
                pointerEvents="none"
              />
              {(isSelected || isHovered) && (
                <title>{`Port ${p.faceIndex}${isDocked ? ' (docked)' : ''}`}</title>
              )}
            </circle>
          );
        })}
      </svg>

      {tooltip && hoveredPort !== null && (() => {
        const fd = faceMap.get(tooltip.faceIndex);
        const isDocked = dockedPorts.includes(tooltip.faceIndex);
        const label = fd?.label ?? `Face ${tooltip.faceIndex}`;
        const value = fd?.value ?? null;
        return (
          <div
            className="dome-tooltip"
            style={{ left: tooltip.x + TOOLTIP_OFFSET, top: tooltip.y + TOOLTIP_OFFSET }}
          >
            <div className="dome-tooltip-title">{label}</div>
            <div className="dome-tooltip-port">Port {tooltip.faceIndex}</div>
            {value !== null && value !== undefined && (
              <div className="dome-tooltip-value">Value: {value}</div>
            )}
            {isDocked && <div className="dome-tooltip-docked">Docked</div>}
          </div>
        );
      })()}
    </>
  );
}
