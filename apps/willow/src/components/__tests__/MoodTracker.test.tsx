import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import MoodTracker from '../MoodTracker'

vi.mock('../AudioEngine', () => ({
  playPop: vi.fn(),
  playSuccess: vi.fn(),
  playStamp: vi.fn(),
  playBubblePop: vi.fn(),
  getCtx: () => ({
    createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, type: 'sine' }),
    createGain: () => ({ connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }),
    destination: {},
    currentTime: 0,
  }),
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('MoodTracker', () => {
  it('should render title and back button', () => {
    render(<MoodTracker onBack={vi.fn()} />)
    expect(screen.getByText('How are you?')).toBeInTheDocument()
    expect(screen.getByText('BACK')).toBeInTheDocument()
  })

  it('should render 5 mood buttons', () => {
    render(<MoodTracker onBack={vi.fn()} />)
    const moodBars = document.querySelectorAll('.mood-bar-btn')
    expect(moodBars.length).toBe(5)
  })

  it('should render all mood labels', () => {
    render(<MoodTracker onBack={vi.fn()} />)
    expect(screen.getByText('Tired')).toBeInTheDocument()
    expect(screen.getByText('Sad')).toBeInTheDocument()
    expect(screen.getByText('Okay')).toBeInTheDocument()
    expect(screen.getByText('Happy')).toBeInTheDocument()
    expect(screen.getByText('Amazing')).toBeInTheDocument()
  })

  it('should show spoon display', () => {
    render(<MoodTracker onBack={vi.fn()} />)
    expect(document.querySelector('.spoon-display')).toBeInTheDocument()
  })

  it('should call onBack when BACK is clicked', () => {
    const onBack = vi.fn()
    render(<MoodTracker onBack={onBack} />)
    fireEvent.click(screen.getByText('BACK'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('should show Why follow-up after selecting a mood', () => {
    render(<MoodTracker onBack={vi.fn()} />)
    const moodBars = document.querySelectorAll('.mood-bar-btn')
    fireEvent.click(moodBars[2])
    expect(screen.getByText(/Why do you feel/)).toBeInTheDocument()
  })

  it('should show reason buttons after selecting mood', () => {
    render(<MoodTracker onBack={vi.fn()} />)
    const moodBars = document.querySelectorAll('.mood-bar-btn')
    fireEvent.click(moodBars[0])
    const reasonBtns = document.querySelectorAll('.reason-btn')
    expect(reasonBtns.length).toBeGreaterThan(0)
  })

  it('should show SAVE button after selecting a reason', () => {
    render(<MoodTracker onBack={vi.fn()} />)
    const moodBars = document.querySelectorAll('.mood-bar-btn')
    fireEvent.click(moodBars[0])
    const reasonBtns = document.querySelectorAll('.reason-btn')
    if (reasonBtns.length > 0) {
      fireEvent.click(reasonBtns[0])
      expect(screen.getByText(/SAVE/)).toBeInTheDocument()
    }
  })

  it('should show encouragement after saving', () => {
    render(<MoodTracker onBack={vi.fn()} />)
    const moodBars = document.querySelectorAll('.mood-bar-btn')
    fireEvent.click(moodBars[3])
    const reasonBtns = document.querySelectorAll('.reason-btn')
    if (reasonBtns.length > 0) {
      fireEvent.click(reasonBtns[0])
      fireEvent.click(screen.getByText(/SAVE/))
      expect(document.querySelector('.encouragement')).toBeInTheDocument()
    }
  })

  it('should persist mood history to localStorage', () => {
    render(<MoodTracker onBack={vi.fn()} />)
    const moodBars = document.querySelectorAll('.mood-bar-btn')
    fireEvent.click(moodBars[3])
    const reasonBtns = document.querySelectorAll('.reason-btn')
    if (reasonBtns.length > 0) {
      fireEvent.click(reasonBtns[0])
      fireEvent.click(screen.getByText(/SAVE/))
      const stored = localStorage.getItem('willow-moods')
      expect(stored).toBeTruthy()
    }
  })

  it('should render mood chart when history exists', () => {
    const history = [
      { mood: 3, emoji: '😊', label: 'Happy', reason: 'Good day', timestamp: Date.now() - 86400000 },
      { mood: 4, emoji: '🤩', label: 'Amazing', reason: 'Great', timestamp: Date.now() - 172800000 },
      { mood: 2, emoji: '😢', label: 'Sad', reason: 'Bad', timestamp: Date.now() - 259200000 },
    ]
    localStorage.setItem('willow-moods', JSON.stringify(history))
    render(<MoodTracker onBack={vi.fn()} />)
    expect(document.querySelector('.mood-chart') || document.querySelector('.sparkline') || document.querySelector('[class*="chart"]')).toBeInTheDocument()
  })
})
