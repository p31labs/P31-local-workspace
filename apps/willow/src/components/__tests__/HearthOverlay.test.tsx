import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import HearthOverlay from '../HearthOverlay'

vi.mock('../CompanionVoice', () => ({
  speak: vi.fn(),
  phosSpeakWelcome: vi.fn(),
}))

vi.mock('../FamilyMesh', () => ({
  FamilyMesh: () => <div data-testid="family-mesh" />,
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('HearthOverlay', () => {
  it('should render overlay with fire emoji for normal spoons', () => {
    render(<HearthOverlay onDismiss={vi.fn()} />)
    expect(screen.getByText('🔥')).toBeInTheDocument()
    expect(screen.getByText('Touch anywhere to send warmth')).toBeInTheDocument()
  })

  it('should render candle emoji for low spoons', () => {
    localStorage.setItem('willow-bio', JSON.stringify({ spoons: 1, calcium: 8.2, hrv: 45, lastPing: 0, presenceColor: '#6CB4EE', moodHistory: [] }))
    render(<HearthOverlay onDismiss={vi.fn()} />)
    expect(screen.getByText('🕯️')).toBeInTheDocument()
    expect(screen.getByText('Rest. You are held.')).toBeInTheDocument()
  })

  it('should render 6 spoon dots', () => {
    render(<HearthOverlay onDismiss={vi.fn()} />)
    expect(document.querySelectorAll('.hearth-spoon-dot').length).toBe(6)
  })

  it('should highlight active spoons', () => {
    localStorage.setItem('willow-bio', JSON.stringify({ spoons: 3, calcium: 8.2, hrv: 45, lastPing: 0, presenceColor: '#6CB4EE', moodHistory: [] }))
    render(<HearthOverlay onDismiss={vi.fn()} />)
    const dots = document.querySelectorAll('.hearth-spoon-dot')
    let activeCount = 0
    dots.forEach((dot) => { if (dot.classList.contains('spoon-on')) activeCount++ })
    expect(activeCount).toBe(3)
  })

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    render(<HearthOverlay onDismiss={onDismiss} />)
    fireEvent.click(screen.getByLabelText('Pick something'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('should render FamilyMesh component', () => {
    render(<HearthOverlay onDismiss={vi.fn()} />)
    expect(screen.getByTestId('family-mesh')).toBeInTheDocument()
  })

  it('should show 0 active spoons for critical state', () => {
    localStorage.setItem('willow-bio', JSON.stringify({ spoons: 0, calcium: 7.8, hrv: 30, lastPing: 0, presenceColor: '#6CB4EE', moodHistory: [] }))
    render(<HearthOverlay onDismiss={vi.fn()} />)
    const dots = document.querySelectorAll('.hearth-spoon-dot')
    let activeCount = 0
    dots.forEach((dot) => { if (dot.classList.contains('spoon-on')) activeCount++ })
    expect(activeCount).toBe(0)
  })
})
