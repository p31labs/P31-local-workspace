import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import CatchGame from '../CatchGame'

vi.mock('../AudioEngine', () => ({
  playCatch: vi.fn(),
  playMiss: vi.fn(),
  playSuccess: vi.fn(),
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

describe('CatchGame', () => {
  it('should render game title and initial score', () => {
    render(<CatchGame onBack={vi.fn()} />)
    expect(screen.getByText('Catch the Sparkle!')).toBeInTheDocument()
    expect(screen.getByText('Score: 0')).toBeInTheDocument()
  })

  it('should render difficulty selector with 3 options', () => {
    render(<CatchGame onBack={vi.fn()} />)
    expect(screen.getByText('Easy')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Hard')).toBeInTheDocument()
  })

  it('should show target emoji and instruction', () => {
    render(<CatchGame onBack={vi.fn()} />)
    expect(screen.getByText('Find this one:')).toBeInTheDocument()
    expect(document.querySelector('.game-target-emoji')).toBeTruthy()
  })

  it('should render game option buttons', () => {
    render(<CatchGame onBack={vi.fn()} />)
    const options = document.querySelectorAll('.game-option')
    expect(options.length).toBe(3)
  })

  it('should show threshold hint', () => {
    render(<CatchGame onBack={vi.fn()} />)
    expect(screen.getByText(/Get 5 to win/)).toBeInTheDocument()
  })

  it('should call onBack when BACK is clicked', () => {
    const onBack = vi.fn()
    render(<CatchGame onBack={onBack} />)
    fireEvent.click(screen.getByText('BACK'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('should show high score from localStorage', () => {
    localStorage.setItem('willow-catch-high', '15')
    render(<CatchGame onBack={vi.fn()} />)
    expect(screen.getByText(/High: 15/)).toBeInTheDocument()
  })

  it('should render win screen with stars when score reaches threshold', () => {
    render(<CatchGame onBack={vi.fn()} />)
    const target = document.querySelector('.game-target-emoji')!.textContent!
    const options = document.querySelectorAll('.game-option')
    for (let i = 0; i < 5; i++) {
      const btn = Array.from(options).find((b) => b.textContent === target)
      if (btn) fireEvent.click(btn)
    }
    expect(screen.getByText(/PLAY AGAIN/)).toBeInTheDocument()
    expect(screen.getByText(/CHOOSE ANOTHER GAME/)).toBeInTheDocument()
  })

  it('should show PLAY AGAIN and CHOOSE ANOTHER GAME buttons on game over', () => {
    render(<CatchGame onBack={vi.fn()} />)
    const target = document.querySelector('.game-target-emoji')!.textContent!
    const options = document.querySelectorAll('.game-option')
    for (let i = 0; i < 5; i++) {
      const btn = Array.from(options).find((b) => b.textContent === target)
      if (btn) fireEvent.click(btn)
    }
    expect(screen.getByText('PLAY AGAIN')).toBeInTheDocument()
    expect(screen.getByText('CHOOSE ANOTHER GAME')).toBeInTheDocument()
  })

  it('should switch difficulty and restart', () => {
    render(<CatchGame onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('Hard'))
    expect(screen.getByText('Score: 0')).toBeInTheDocument()
    expect(screen.getByText(/Get 12 to win/)).toBeInTheDocument()
  })

  it('should show score after catching correct target', () => {
    render(<CatchGame onBack={vi.fn()} />)
    const target = document.querySelector('.game-target-emoji')!.textContent!
    const options = document.querySelectorAll('.game-option')
    const btn = Array.from(options).find((b) => b.textContent === target)
    if (btn) fireEvent.click(btn)
    expect(screen.getByText('Score: 1')).toBeInTheDocument()
  })

  it('should show feedback emoji on miss', () => {
    render(<CatchGame onBack={vi.fn()} />)
    const options = document.querySelectorAll('.game-option')
    fireEvent.click(options[options.length - 1])
    const feedback = document.querySelector('.game-feedback')
    expect(feedback).toBeTruthy()
  })
})
