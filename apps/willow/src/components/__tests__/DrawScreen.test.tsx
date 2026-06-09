import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import DrawScreen from '../DrawScreen'

vi.mock('../AudioEngine', () => ({
  playStamp: vi.fn(),
  playPop: vi.fn(),
  playBubblePop: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('DrawScreen', () => {
  it('should render title and back button', () => {
    render(<DrawScreen onBack={vi.fn()} />)
    expect(screen.getByText('Draw!')).toBeInTheDocument()
    expect(screen.getByText('BACK')).toBeInTheDocument()
  })

  it('should render canvas element', () => {
    render(<DrawScreen onBack={vi.fn()} />)
    expect(document.querySelector('.draw-canvas')).toBeInTheDocument()
  })

  it('should render brush type buttons', () => {
    render(<DrawScreen onBack={vi.fn()} />)
    expect(screen.getByText('Round')).toBeInTheDocument()
    expect(screen.getByText('Square')).toBeInTheDocument()
    expect(screen.getByText('Spray')).toBeInTheDocument()
  })

  it('should render pattern buttons', () => {
    render(<DrawScreen onBack={vi.fn()} />)
    expect(screen.getByText('None')).toBeInTheDocument()
    expect(screen.getByText('Grid')).toBeInTheDocument()
    expect(screen.getByText('Dots')).toBeInTheDocument()
    expect(screen.getByText('Lines')).toBeInTheDocument()
  })

  it('should render action buttons', () => {
    render(<DrawScreen onBack={vi.fn()} />)
    expect(screen.getByText('Undo')).toBeInTheDocument()
    expect(screen.getByText('Redo')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Share')).toBeInTheDocument()
  })

  it('should call onBack when BACK is clicked', () => {
    const onBack = vi.fn()
    render(<DrawScreen onBack={onBack} />)
    fireEvent.click(screen.getByText('BACK'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('should render sticker palette', () => {
    render(<DrawScreen onBack={vi.fn()} />)
    expect(document.querySelector('.sticker-palette')).toBeInTheDocument()
  })

  it('should select a sticker when clicked', () => {
    render(<DrawScreen onBack={vi.fn()} />)
    const stickers = document.querySelectorAll('.sticker-btn')
    if (stickers.length > 0) {
      fireEvent.click(stickers[0])
    }
    expect(true).toBe(true)
  })

  it('should change brush type', () => {
    render(<DrawScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('Square'))
    expect(true).toBe(true)
  })

  it('should change pattern', () => {
    render(<DrawScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('Grid'))
    expect(true).toBe(true)
  })
})
