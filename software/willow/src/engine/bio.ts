export const BIO_KEY = 'willow-bio';
export const DEFAULT_BIO = { spoons: 5, moodHistory: [] as string[] };

export interface BioState {
  spoons: number;
  moodHistory: string[];
}

export function loadBio(): BioState {
  try {
    const raw = localStorage.getItem(BIO_KEY);
    if (raw) return JSON.parse(raw) as BioState;
  } catch { /* corrupt */ }
  return { ...DEFAULT_BIO };
}

export function clampSpoons(v: number): number {
  return Math.max(0, Math.min(6, Math.round(v)));
}
