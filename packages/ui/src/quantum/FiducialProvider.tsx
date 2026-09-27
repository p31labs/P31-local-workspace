import { createContext, useContext, type ReactNode } from 'react';
import { sicPovmFiducial } from '@p31ca/quantum-core/sic-povm';
import { TETRA } from '@p31ca/design-core/math';

export interface FiducialContextValue {
  fiducialVector: [number, number];
  tetraConstants: typeof TETRA;
  sicFiducial: number;
}

const FiducialContext = createContext<FiducialContextValue | null>(null);

export interface FiducialProviderProps {
  children: ReactNode;
}

export function FiducialProvider({ children }: FiducialProviderProps) {
  const fid = sicPovmFiducial();
  const value: FiducialContextValue = {
    fiducialVector: fid,
    tetraConstants: TETRA,
    sicFiducial: Math.sqrt(0.5),
  };
  return <FiducialContext.Provider value={value}>{children}</FiducialContext.Provider>;
}

export function useFiducial(): FiducialContextValue {
  const ctx = useContext(FiducialContext);
  if (!ctx) throw new Error('useFiducial must be used within FiducialProvider');
  return ctx;
}
