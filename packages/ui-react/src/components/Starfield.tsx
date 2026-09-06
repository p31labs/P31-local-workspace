import React, { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';

export interface StarfieldProps {
  /** Declarative wrapper over the imperative mountStarfield() API. */
  spoons?: number;
  voltage?: 'GREEN' | 'AMBER' | 'RED' | 'BLUE';
  safeMode?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Starfield({ spoons, voltage, safeMode, className = '', style }: StarfieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    import('@p31/design-core/starfield').then(({ mountStarfield }) => {
      if (cancelled || !containerRef.current) return;
      instanceRef.current = mountStarfield(containerRef.current, { spoons, voltage, safeMode });
    });

    return () => {
      cancelled = true;
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [spoons, voltage, safeMode]);

  return <div ref={containerRef} className={`starfield-bg ${className}`.trim()} style={style} aria-hidden="true" />;
}

export default Starfield;
