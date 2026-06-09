import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadBio,
  saveBio,
  isLowSpoons,
  isCriticalSpoons,
  getMoodTrend,
  recordMood,
  recordPing,
  type BioState,
} from '../stores/bioStore'

const DEFAULT_BIO: BioState = {
  spoons: 5,
  calcium: 8.2,
  hrv: 45,
  lastPing: 0,
  presenceColor: '#6CB4EE',
  moodHistory: [],
}

beforeEach(() => {
  localStorage.clear()
})

describe('loadBio', () => {
  it('should return defaults when no stored data', () => {
    const bio = loadBio()
    expect(bio.spoons).toBe(5)
    expect(bio.calcium).toBe(8.2)
    expect(bio.hrv).toBe(45)
    expect(bio.presenceColor).toBe('#6CB4EE')
    expect(bio.moodHistory).toEqual([])
  })

  it('should load stored bio data', () => {
    const stored: BioState = { ...DEFAULT_BIO, spoons: 2, calcium: 7.8, moodHistory: [{ timestamp: 100, mood: 3 }] }
    localStorage.setItem('willow-bio', JSON.stringify(stored))
    const bio = loadBio()
    expect(bio.spoons).toBe(2)
    expect(bio.calcium).toBe(7.8)
    expect(bio.moodHistory).toHaveLength(1)
  })

  it('should merge stored data with defaults', () => {
    localStorage.setItem('willow-bio', JSON.stringify({ spoons: 1 }))
    const bio = loadBio()
    expect(bio.spoons).toBe(1)
    expect(bio.calcium).toBe(8.2)
  })

  it('should return defaults on corrupt JSON', () => {
    localStorage.setItem('willow-bio', 'not-json{{{')
    const bio = loadBio()
    expect(bio.spoons).toBe(5)
  })
})

describe('saveBio', () => {
  it('should persist bio to localStorage', () => {
    const bio: BioState = { ...DEFAULT_BIO, spoons: 3 }
    saveBio(bio)
    const raw = localStorage.getItem('willow-bio')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.spoons).toBe(3)
  })

  it('should overwrite previous data', () => {
    saveBio({ ...DEFAULT_BIO, spoons: 1 })
    saveBio({ ...DEFAULT_BIO, spoons: 4 })
    const bio = loadBio()
    expect(bio.spoons).toBe(4)
  })
})

describe('isLowSpoons', () => {
  it('should return true for 0 spoons', () => {
    expect(isLowSpoons({ ...DEFAULT_BIO, spoons: 0 })).toBe(true)
  })

  it('should return true for 1 spoon', () => {
    expect(isLowSpoons({ ...DEFAULT_BIO, spoons: 1 })).toBe(true)
  })

  it('should return true for 2 spoons', () => {
    expect(isLowSpoons({ ...DEFAULT_BIO, spoons: 2 })).toBe(true)
  })

  it('should return false for 3 spoons', () => {
    expect(isLowSpoons({ ...DEFAULT_BIO, spoons: 3 })).toBe(false)
  })

  it('should return false for 5 spoons', () => {
    expect(isLowSpoons({ ...DEFAULT_BIO, spoons: 5 })).toBe(false)
  })
})

describe('isCriticalSpoons', () => {
  it('should return true for 0 spoons', () => {
    expect(isCriticalSpoons({ ...DEFAULT_BIO, spoons: 0 })).toBe(true)
  })

  it('should return true for 1 spoon', () => {
    expect(isCriticalSpoons({ ...DEFAULT_BIO, spoons: 1 })).toBe(true)
  })

  it('should return false for 2 spoons', () => {
    expect(isCriticalSpoons({ ...DEFAULT_BIO, spoons: 2 })).toBe(false)
  })

  it('should return false for 3 spoons', () => {
    expect(isCriticalSpoons({ ...DEFAULT_BIO, spoons: 3 })).toBe(false)
  })
})

describe('getMoodTrend', () => {
  it('should return stable with no history', () => {
    expect(getMoodTrend(DEFAULT_BIO)).toBe('stable')
  })

  it('should return stable with less than 3 entries', () => {
    const bio: BioState = { ...DEFAULT_BIO, moodHistory: [{ timestamp: 1, mood: 3 }, { timestamp: 2, mood: 5 }] }
    expect(getMoodTrend(bio)).toBe('stable')
  })

  it('should return rising when recent mood is higher', () => {
    const bio: BioState = {
      ...DEFAULT_BIO,
      moodHistory: [
        { timestamp: 1, mood: 1 },
        { timestamp: 2, mood: 1 },
        { timestamp: 3, mood: 1 },
        { timestamp: 4, mood: 1 },
        { timestamp: 5, mood: 5 },
        { timestamp: 6, mood: 5 },
        { timestamp: 7, mood: 5 },
      ],
    }
    expect(getMoodTrend(bio)).toBe('rising')
  })

  it('should return falling when recent mood is lower', () => {
    const bio: BioState = {
      ...DEFAULT_BIO,
      moodHistory: [
        { timestamp: 1, mood: 5 },
        { timestamp: 2, mood: 5 },
        { timestamp: 3, mood: 5 },
        { timestamp: 4, mood: 5 },
        { timestamp: 5, mood: 1 },
        { timestamp: 6, mood: 1 },
        { timestamp: 7, mood: 1 },
      ],
    }
    expect(getMoodTrend(bio)).toBe('falling')
  })

  it('should return stable when mood is unchanged', () => {
    const bio: BioState = {
      ...DEFAULT_BIO,
      moodHistory: [
        { timestamp: 1, mood: 3 },
        { timestamp: 2, mood: 3 },
        { timestamp: 3, mood: 3 },
        { timestamp: 4, mood: 3 },
        { timestamp: 5, mood: 3 },
      ],
    }
    expect(getMoodTrend(bio)).toBe('stable')
  })
})

describe('recordMood', () => {
  it('should add mood to history', () => {
    const result = recordMood(DEFAULT_BIO, 4)
    expect(result.moodHistory).toHaveLength(1)
    expect(result.moodHistory[0].mood).toBe(4)
  })

  it('should increase spoons for mood >= 3', () => {
    const result = recordMood(DEFAULT_BIO, 3)
    expect(result.spoons).toBe(6)
  })

  it('should not increase spoons for mood < 3', () => {
    const result = recordMood(DEFAULT_BIO, 2)
    expect(result.spoons).toBe(5)
  })

  it('should cap spoons at 6', () => {
    const bio: BioState = { ...DEFAULT_BIO, spoons: 6 }
    const result = recordMood(bio, 5)
    expect(result.spoons).toBe(6)
  })

  it('should trim history to last 30 entries', () => {
    const history = Array.from({ length: 30 }, (_, i) => ({ timestamp: i, mood: 3 }))
    const bio: BioState = { ...DEFAULT_BIO, moodHistory: history }
    const result = recordMood(bio, 4)
    expect(result.moodHistory).toHaveLength(30)
  })

  it('should update lastPing timestamp', () => {
    const before = Date.now()
    const result = recordMood(DEFAULT_BIO, 3)
    expect(result.lastPing).toBeGreaterThanOrEqual(before)
  })
})

describe('recordPing', () => {
  it('should update lastPing timestamp', () => {
    const before = Date.now()
    const result = recordPing(DEFAULT_BIO)
    expect(result.lastPing).toBeGreaterThanOrEqual(before)
  })

  it('should decrease spoons by 1', () => {
    const result = recordPing(DEFAULT_BIO)
    expect(result.spoons).toBe(4)
  })

  it('should not decrease spoons below 1', () => {
    const bio: BioState = { ...DEFAULT_BIO, spoons: 1 }
    const result = recordPing(bio)
    expect(result.spoons).toBe(1)
  })
})
