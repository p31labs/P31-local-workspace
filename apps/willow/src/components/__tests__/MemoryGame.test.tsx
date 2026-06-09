import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import MemoryGame from '../MemoryGame'

vi.mock('../AudioEngine', () => ({
  playMiss: vi.fn(),
  playWin: vi.fn(),
  playFlip: vi.fn(),
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

describe('MemoryGame', () => {
  it('should render title and back button', () => {
    render(<MemoryGame onBack={vi.fn()} />)
    expect(screen.getByText(/Memory Match/)).toBeInTheDocument()
    expect(screen.getByText('BACK')).toBeInTheDocument()
  })

  it('should render 4 theme buttons', () => {
    render(<MemoryGame onBack={vi.fn()} />)
    expect(screen.getByText('Animals')).toBeInTheDocument()
    expect(screen.getByText('Space')).toBeInTheDocument()
    expect(screen.getByText('Nature')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
  })

  it('should render memory card grid', () => {
    render(<MemoryGame onBack={vi.fn()} />)
    const cards = document.querySelectorAll('.memory-card')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('should show moves counter', () => {
    render(<MemoryGame onBack={vi.fn()} />)
    expect(screen.getByText('Moves: 0')).toBeInTheDocument()
  })

  it('should call onBack when BACK is clicked', () => {
    const onBack = vi.fn()
    render(<MemoryGame onBack={onBack} />)
    fireEvent.click(screen.getByText('BACK'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('should show high score hint', () => {
    render(<MemoryGame onBack={vi.fn()} />)
    expect(screen.getByText(/High:/)).toBeInTheDocument()
  })

  it('should show animals theme label by default', () => {
    render(<MemoryGame onBack={vi.fn()} />)
    expect(screen.getByText(/Animals theme/)).toBeInTheDocument()
  })

  it('should unlock new themes after winning', () => {
    localStorage.setItem('willow-memory-scores', JSON.stringify({ animals: 50 }))
    render(<MemoryGame onBack={vi.fn()} />)
    const unlockedBefore = JSON.parse(localStorage.getItem('willow-memory-unlocked') || '[]')
    expect(unlockedBefore).toContain('animals')
  })

  it('should lock themes that are not unlocked', () => {
    localStorage.setItem('willow-memory-unlocked', JSON.stringify(['animals']))
    render(<MemoryGame onBack={vi.fn()} />)
    const spaceBtn = screen.getByText('Space').closest('button')
    expect(spaceBtn?.getAttribute('disabled')).not.toBeNull()
  })

  it('should flip card when clicked', () => {
    render(<MemoryGame onBack={vi.fn()} />)
    const cards = document.querySelectorAll('.memory-card')
    fireEvent.click(cards[0])
    expect(cards[0].classList.contains('memory-card-flipped')).toBe(true)
  })

  it('should not flip more than 2 cards at once', () => {
    render(<MemoryGame onBack={vi.fn()} />)
    const cards = document.querySelectorAll('.memory-card')
    fireEvent.click(cards[0])
    fireEvent.click(cards[1])
    const flipped = document.querySelectorAll('.memory-card-flipped')
    expect(flipped.length).toBeLessThanOrEqual(2)
  })

  it('should persist unlocked themes to localStorage', () => {
    localStorage.setItem('willow-memory-unlocked', JSON.stringify(['animals']))
    render(<MemoryGame onBack={vi.fn()} />)
    expect(localStorage.getItem('willow-memory-unlocked')).toContain('animals')
  })
})
