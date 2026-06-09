import React, { createContext, useContext, useState, useCallback } from 'react';

interface AtmosphereContextValue {
  spoons: number;
  setSpoons: (v: number) => void;
  grayRock: boolean;
  setGrayRock: (v: boolean) => void;
  currentSurface: string;
  setSurface: (s: string) => void;
}

const AtmosphereContext = createContext<AtmosphereContextValue | null>(null);

export function useAtmosphere(): AtmosphereContextValue {
  const ctx = useContext(AtmosphereContext);
  if (!ctx) {
    /* v8 ignore start */
    return {
      spoons: 5,
      setSpoons: () => {},
      grayRock: false,
      setGrayRock: () => {},
      currentSurface: 'IGNITION',
      setSurface: () => {},
    };
    /* v8 ignore stop */
  }
  return ctx;
}

export function AtmosphereProvider({
  initialSpoons = 5,
  initialSurface = 'IGNITION',
  children,
}: {
  initialSpoons?: number;
  initialSurface?: string;
  children: React.ReactNode;
}) {
  const [spoons, setSpoons] = useState(Math.max(0, Math.min(5, initialSpoons)));
  const [grayRock, setGrayRock] = useState(spoons === 0);
  const [currentSurface, setSurface] = useState(initialSurface);

  const handleSetSpoons = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(5, v));
    setSpoons(clamped);
    if (clamped === 0) setGrayRock(true);
  }, []);

  const handleSetGrayRock = useCallback((v: boolean) => {
    setGrayRock(v);
    if (v) setSpoons(0);
  }, []);

  return (
    <AtmosphereContext.Provider
      value={{ spoons, setSpoons: handleSetSpoons, grayRock, setGrayRock: handleSetGrayRock, currentSurface, setSurface }}
    >
      {children}
    </AtmosphereContext.Provider>
  );
}
