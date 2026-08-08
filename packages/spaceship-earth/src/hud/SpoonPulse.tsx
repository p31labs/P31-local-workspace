import { useEffect, useRef, useState } from 'react';
import { useShipStore } from '../store/shipStore';

export default function SpoonPulse() {
  const spoons = useShipStore((s) => s.spoons);
  const [t, setT] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    let start = performance.now();
    const loop = () => {
      setT((performance.now() - start) / 1000);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const getColor = () => {
    if (spoons >= 4) return '#22d3ee';
    if (spoons >= 2) return '#f59e0b';
    if (spoons >= 1) return '#f87171';
    return '#ef4444';
  };

  const size = 22 + 6 * (spoons / 5);
  const color = getColor();
  const pulse = 0.5 + 0.5 * Math.sin(t * (1 + (5 - spoons) * 0.4));

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: 28,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 40% 35%, ${color}44, ${color}11)`,
      boxShadow: `0 0 18px ${color}33, 0 0 36px ${color}18`,
      opacity: 0.55 + 0.4 * pulse,
      transition: 'width 0.6s ease, height 0.6s ease',
      pointerEvents: 'none',
      zIndex: 100,
    }} />
  );
}
