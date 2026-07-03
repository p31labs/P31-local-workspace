import React, { useMemo } from 'react';

interface StarfieldProps {
  spoons: number;
  theme: string;
  activeNodes: number[];
}

const SmartStarfield = React.memo(({ spoons, theme, activeNodes }: StarfieldProps) => {
  const nodes = useMemo(() => {
    if (spoons === 0 || theme === 'crisis') return [];

    const baseCount =
      theme === 'sanctuary' ? 25 :
      theme === 'bridge' ? 45 :
      75;

    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4;
    const scaled = Math.min(baseCount, Math.max(15, Math.floor(baseCount * (cores / 8))));

    return Array.from({ length: scaled }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.85 ? 3 : 1.5,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * -20,
    }));
  }, [theme, spoons]);

  if (spoons === 0 || nodes.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {nodes.map((node) => {
        const isActive = activeNodes.includes(node.id);
        return (
          <div
            key={node.id}
            className="absolute rounded-full"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              animation: `drift ${node.duration}s ease-in-out infinite`,
              animationDelay: `${node.delay}s`,
              backgroundColor: 'var(--phos-primary)',
              opacity: isActive ? 1 : 0.15,
              boxShadow: isActive ? '0 0 20px 6px var(--phos-accent)' : 'none',
              transition: 'opacity 400ms ease-out, transform 400ms ease-out, box-shadow 400ms ease-out',
              transform: isActive ? 'scale(2.5)' : 'scale(1)',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
            }}
          />
        );
      })}
    </div>
  );
});

SmartStarfield.displayName = 'SmartStarfield';
export { SmartStarfield as Starfield };
