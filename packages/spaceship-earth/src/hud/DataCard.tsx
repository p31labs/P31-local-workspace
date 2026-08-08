import { useEffect, useState, useRef } from 'react';
import { useShipStore } from '../store/shipStore';

export default function DataCard() {
  const selectedNode = useShipStore((s) => s.selectedNode);
  const nodeData = useShipStore((s) => s.nodeData);
  const coherence = useShipStore((s) => s.coherence);
  const spoons = useShipStore((s) => s.spoons);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => {
    if (selectedNode === null) return;
    const update = () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const s = cy * 1.2;
      const ix = selectedNode % 4;
      const iy = Math.floor(selectedNode / 4);
      const x = cx + (ix - 1.5) * (cx / 2.5);
      const y = cy + (iy - 1.5) * (cy / 2);
      setPos({ x: rect.left + x, y: rect.top + y });
      raf.current = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf.current);
  }, [selectedNode]);

  if (selectedNode === null) return null;

  const data = nodeData[selectedNode];
  if (!data) return null;

  return (
    <div style={{
      position: 'fixed', left: pos.x + 18, top: pos.y - 40,
      background: 'rgba(6,10,18,0.88)', backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
      padding: '14px 18px', color: '#e0e4ec',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11, minWidth: 160, pointerEvents: 'none',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      zIndex: 100,
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: data.color }}>
        {data.label}
      </div>
      <div style={{ fontSize: 9, color: '#6a7a8a', textTransform: 'uppercase', letterSpacing: 1 }}>
        {data.type}
      </div>
      <div style={{ marginTop: 8, color: '#66ccff', fontSize: 10 }}>
        Coherence {(coherence * 100).toFixed(0)}%
      </div>
      <div style={{ color: '#f59e0b', fontSize: 10 }}>
        Spoons {spoons}/5
      </div>
    </div>
  );
}
