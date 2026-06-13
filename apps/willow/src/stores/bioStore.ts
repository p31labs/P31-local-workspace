export interface MoodEntry {
  timestamp: number
  mood: number
}

export interface BioState {
  spoons: number
  calcium: number
  hrv: number
  lastPing: number
  presenceColor: string
  moodHistory: MoodEntry[]
}

const STORAGE_KEY = 'willow-bio'

const DEFAULTS: BioState = {
  spoons: 5,
  calcium: 8.2,
  hrv: 45,
  lastPing: 0,
  presenceColor: '#6CB4EE',
  moodHistory: [],
}

export function loadBio(): BioState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const stored = JSON.parse(raw)
    return { ...DEFAULTS, ...stored }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveBio(bio: BioState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bio))
}

export function isLowSpoons(bio: BioState): boolean {
  return bio.spoons <= 2
}

export function isCriticalSpoons(bio: BioState): boolean {
  return bio.spoons <= 1
}

export function getMoodTrend(bio: BioState): 'rising' | 'falling' | 'stable' {
  const { moodHistory } = bio
  if (moodHistory.length < 3) return 'stable'
  const third = Math.floor(moodHistory.length / 3)
  const firstThird = moodHistory.slice(0, third)
  const lastThird = moodHistory.slice(-third)
  const firstAvg = firstThird.reduce((s, e) => s + e.mood, 0) / third
  const lastAvg = lastThird.reduce((s, e) => s + e.mood, 0) / third
  if (lastAvg > firstAvg) return 'rising'
  if (lastAvg < firstAvg) return 'falling'
  return 'stable'
}

export function recordMood(bio: BioState, mood: number): BioState {
  const entry: MoodEntry = { timestamp: Date.now(), mood }
  let history = [...bio.moodHistory, entry]
  if (history.length > 30) {
    history = history.slice(history.length - 30)
  }
  let { spoons } = bio
  if (mood >= 3) {
    spoons = Math.min(spoons + 1, 6)
  }
  return {
    ...bio,
    moodHistory: history,
    spoons,
    lastPing: Date.now(),
  }
}

export function recordPing(bio: BioState): BioState {
  return {
    ...bio,
    spoons: Math.max(bio.spoons - 1, 1),
    lastPing: Date.now(),
  }
}
