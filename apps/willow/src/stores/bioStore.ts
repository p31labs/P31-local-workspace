export interface BioState {
  spoons: number;
  calcium: number;
  hrv: number;
  lastPing: number;
  presenceColor: string;
  moodHistory: Array<{ timestamp: number; mood: number }>;
}

export const DEFAULT_BIO: BioState = {
  spoons: 5,
  calcium: 8.2,
  hrv: 45,
  lastPing: 0,
  presenceColor: '#6CB4EE',
  moodHistory: [],
};

export function loadBio(): BioState {
  try {
    const raw = localStorage.getItem('willow-bio');
    if (!raw) return { ...DEFAULT_BIO };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_BIO, ...parsed };
  } catch {
    return { ...DEFAULT_BIO };
  }
}

export function saveBio(bio: BioState): void {
  localStorage.setItem('willow-bio', JSON.stringify(bio));
}

export function isLowSpoons(bio: BioState): boolean {
  return bio.spoons <= 2;
}

export function isCriticalSpoons(bio: BioState): boolean {
  return bio.spoons <= 1;
}

export function getMoodTrend(bio: BioState): 'stable' | 'rising' | 'falling' {
  const history = bio.moodHistory;
  if (history.length < 3) return 'stable';
  const recent = history.slice(-3);
  const avg = recent.reduce((s, m) => s + m.mood, 0) / recent.length;
  const older = history.slice(0, -3);
  if (older.length === 0) return 'stable';
  const olderAvg = older.reduce((s, m) => s + m.mood, 0) / older.length;
  if (avg > olderAvg + 0.5) return 'rising';
  if (avg < olderAvg - 0.5) return 'falling';
  return 'stable';
}

export function recordMood(bio: BioState, mood: number): BioState {
  const updated = {
    ...bio,
    moodHistory: [...bio.moodHistory, { timestamp: Date.now(), mood }].slice(-30),
    lastPing: Date.now(),
  };
  if (mood >= 3) {
    updated.spoons = Math.min(6, bio.spoons + 1);
  }
  return updated;
}

export function recordPing(bio: BioState): BioState {
  return {
    ...bio,
    spoons: Math.max(1, bio.spoons - 1),
    lastPing: Date.now(),
  };
}
