// Type declarations for JavaScript modules in bonding app

declare module './hooks/useHashRouter' {
  export interface HashRouterResult {
    currentRoom: string;
    navigate: (room: string) => void;
  }
  export default function useHashRouter(): HashRouterResult;
}

declare module './hooks/useGeolocationTracking' {
  export interface GeoPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  }
  export interface GeolocationTrackingResult {
    position: GeoPosition | null;
    error: string | null;
    distance: number; // meters from origin
    isWithinRange: boolean; // within 50m threshold
    watchPosition: () => void;
    clearWatch: () => void;
  }
  export default function useGeolocationTracking(originLat: number, originLng: number, thresholdMeters?: number): GeolocationTrackingResult;
}

declare module './hooks/useFrequencySynthesis' {
  export interface FrequencySynthesisResult {
    isPlaying: boolean;
    play: (frequency?: number, duration?: number) => void;
    stop: () => void;
    setBaseFrequency: (hz: number) => void;
  }
  export default function useFrequencySynthesis(baseFrequency?: number): FrequencySynthesisResult;
}

declare module './components/ColliderMode' {
  import { FC } from 'react';
  const ColliderMode: FC<{ className?: string }>;
  export default ColliderMode;
}

// Dynamic import from spaceship-earth - stub for type checking
declare module '@p31/spaceship-earth/services/sovereignRelay' {
  export function sendCelebration(payload: { type: string; formula: string }): Promise<void>;
}
// WebGPU: use @webgpu/types in tsconfig "types" (devDependency)
