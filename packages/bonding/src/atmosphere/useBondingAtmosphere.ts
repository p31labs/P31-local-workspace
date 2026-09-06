import { useEffect, useState } from "react";
import {
  resolveBondingAtmosphere,
  applyBondingRampDom,
  coherenceFromBondingAtmosphere,
  type ResolvedBondingAtmosphere,
} from "./bondingAtmosphere";

const DEFAULT_COHERENCE = 6.5 / 12;

export function useBondingAtmosphere(): {
  coherence: number;
  resolved: ResolvedBondingAtmosphere | null;
  ready: boolean;
} {
  const [resolved, setResolved] = useState<ResolvedBondingAtmosphere | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void resolveBondingAtmosphere().then((r) => {
      if (cancelled) return;
      setResolved(r);
      applyBondingRampDom(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (resolved === undefined) {
    return { coherence: DEFAULT_COHERENCE, resolved: null, ready: false };
  }
  return {
    coherence: coherenceFromBondingAtmosphere(resolved),
    resolved,
    ready: true,
  };
}
