export interface Rng {
  (): number;
  int(max: number): number;
  clone(): Rng;
  readonly seed: number;
}

export function createMulberry32(seed: number): Rng {
  let state = seed | 0;

  const raw = (): number => {
    state = (state + 0x6D2B79F5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = Object.assign(
    () => raw(),
    {
      int(max: number): number {
        return (raw() * max) | 0;
      },
      clone(): Rng {
        return createMulberry32(state);
      },
      get seed(): number {
        return state;
      },
    },
  );

  return rng;
}

export function seedFromString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}
