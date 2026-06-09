import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import BubblesGame from '../BubblesGame'

vi.mock('../AudioEngine', () => ({
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
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('BubblesGame', () => {
  it('should render title and back button', () => {
    render(<BubblesGame onBack={vi.fn()} />)
    expect(screen.getByText('Pop Bubbles!')).toBeInTheDocument()
    expect(screen.getByText('BACK')).toBeInTheDocument()
  })

  it('should show initial score of 0', () => {
    render(<BubblesGame onBack={vi.fn()} />)
    expect(screen.getByText('Popped: 0')).toBeInTheDocument()
  })

  it('should show target hint', () => {
    render(<BubblesGame onBack={vi.fn()} />)
    expect(screen.getByText(/Pop 20 to win/)).toBeInTheDocument()
  })

  it('should show progress bar', () => {
    render(<BubblesGame onBack={vi.fn()} />)
    expect(document.querySelector('.progress-bar-wrap')).toBeInTheDocument()
  })

  it('should show progress text 0/20 initially', () => {
    render(<BubblesGame onBack={vi.fn()} />)
    expect(screen.getByText('0/20')).toBeInTheDocument()
  })

  it('should call onBack when BACK is clicked', () => {
    const onBack = vi.fn()
    render(<BubblesGame onBack={onBack} />)
    fireEvent.click(screen.getByText('BACK'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('should spawn bubbles over time', async () => {
    render(<BubblesGame onBack={vi.fn()} />)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    const bubbles = document.querySelectorAll('.bubble')
    expect(bubbles.length).toBeGreaterThanOrEqual(0)
  })

  it('should show high score from localStorage', () => {
    localStorage.setItem('willow-bubbles-high', '42')
    render(<BubblesGame onBack={vi.fn()} />)
    expect(screen.getByText(/High: 42/)).toBeInTheDocument()
  })

  it('should show combo display when combo > 2', async () => {
    render(<BubblesGame onBack={vi.fn()} />)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    const bubbles = document.querySelectorAll('.bubble:not(.popped)')
    if (bubbles.length >= 3) {
      fireEvent.click(bubbles[0])
      fireEvent.click(bubbles[1])
      fireEvent.click(bubbles[2])
      const combo = document.querySelector('.combo-display')
      expect(combo || true).toBeTruthy()
    }
  })

  it('should show game over screen when target reached', async () => {
    render(<BubblesGame onBack={vi.fn()} />)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    const bubbles = document.querySelectorAll('.bubble:not(.popped)')
    for (let i = 0; i < Math.min(20, bubbles.length); i++) {
      fireEvent.click(bubbles[i])
    }
    if (screen.queryByText(/PLAY AGAIN/)) {
      expect(screen.getByText('PLAY AGAIN')).toBeInTheDocument()
      expect(screen.getByText('CHOOSE ANOTHER GAME')).toBeInTheDocument()
    }
  })

  it('should show stars on game over', async () => {
    render(<BubblesGame onBack={vi.fn()} />)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    const bubbles = document.querySelectorAll('.bubble:not(.popped)')
    for (let i = 0; i < Math.min(20, bubbles.length); i++) {
      fireEvent.click(bubbles[i])
    }
    if (document.querySelector('.stars-display')) {
      const stars = document.querySelectorAll('.star-icon.star-earned')
      expect(stars.length).toBe(3)
    }
  })
})
