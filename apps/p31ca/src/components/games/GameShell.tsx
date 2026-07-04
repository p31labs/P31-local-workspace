import { useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export interface GameShellProps {
  children: React.ReactNode;
  routeName: string;
  suppressEbc?: boolean;
  cameraZ?: number;
  className?: string;
}

/**
 * SafeModeFallback: renders minimal UI when safe mode is active
 */
function SafeModeFallback() {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-p31-void">
      <div className="glass-panel p-8 max-w-md text-center">
        <h2 className="text-p31-cyan text-xl font-bold mb-4">Safe Mode</h2>
        <p className="text-p31-cloud-70 mb-4">
          Reduced motion and simplified visuals are active.
        </p>
        <div className="space-y-2">
          <button className="w-full bg-p31-teal/20 hover:bg-p31-teal/30 text-p31-teal px-4 py-3 rounded">
            Log Water
          </button>
          <button className="w-full bg-p31-teal/20 hover:bg-p31-teal/30 text-p31-teal px-4 py-3 rounded">
            Log Break
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * LatticeScene: the actual 3D content
 */
function LatticeScene({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * GameShell: main container
 */
export function GameShell({ children, routeName, suppressEbc = false, cameraZ = 5, className = '' }: GameShellProps) {
  const [mounted, setMounted] = useState(false);
  const [safeMode, setSafeMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for safe mode triggers
    const checkSafe = () => {
      const storage = localStorage.getItem('p31_safe_mode');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return storage === '1' || reduced;
    };
    setSafeMode(checkSafe());
  }, []);

  const handlePointerMissed = useCallback(() => {
    // Optional: subtle feedback
  }, []);

  // SSR / initial render: placeholder to avoid hook errors
  if (!mounted) {
    return <div className={`fixed inset-0 bg-p31-void ${className}`} />;
  }

  // Safe mode on client: simple UI, no heavy canvas
  if (safeMode) {
    return <SafeModeFallback />;
  }

  return (
    <div className={`relative min-h-screen ${className}`}>
      <Canvas
        flat
        onPointerMissed={handlePointerMissed}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 10 }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, cameraZ]} fov={50} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        {children}
      </Canvas>
    </div>
  );
}

export default GameShell;