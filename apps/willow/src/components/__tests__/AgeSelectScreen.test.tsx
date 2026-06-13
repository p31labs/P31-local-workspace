import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import AgeSelectScreen from '../AgeSelectScreen'

beforeEach(() => {
  localStorage.clear()
})

afterEach(cleanup)

describe('AgeSelectScreen', () => {
  it('should render all 3 age options', () => {
    render(<AgeSelectScreen onBack={vi.fn()} />)
    expect(screen.getByText('Willow (6)')).toBeInTheDocument()
    expect(screen.getByText('Auto')).toBeInTheDocument()
    expect(screen.getByText('Bash (10)')).toBeInTheDocument()
  })

  it('should render descriptions for each option', () => {
    render(<AgeSelectScreen onBack={vi.fn()} />)
    expect(screen.getByText('Pre-reader • Big visuals • Simple')).toBeInTheDocument()
    expect(screen.getByText('Adapts to you')).toBeInTheDocument()
    expect(screen.getByText('Games • Molecules • Badges')).toBeInTheDocument()
  })

  it('should select auto by default', () => {
    render(<AgeSelectScreen onBack={vi.fn()} />)
    const autoBtn = screen.getByText('Auto').closest('button')
    expect(autoBtn?.classList.contains('spoiler-active')).toBe(true)
  })

  it('should persist selected age to localStorage', () => {
    render(<AgeSelectScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('Willow (6)'))
    expect(localStorage.getItem('willow-age-mode')).toBe('willow')
  })

  it('should call onBack when BACK button is clicked', () => {
    const onBack = vi.fn()
    render(<AgeSelectScreen onBack={onBack} />)
    fireEvent.click(screen.getByText('BACK'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('should restore selected age from localStorage', () => {
    localStorage.setItem('willow-age-mode', 'bash')
    render(<AgeSelectScreen onBack={vi.fn()} />)
    const bashBtn = screen.getByText('Bash (10)').closest('button')
    expect(bashBtn?.classList.contains('spoiler-active')).toBe(true)
  })

  it('should highlight selected option with different background', () => {
    render(<AgeSelectScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('Bash (10)'))
    const bashBtn = screen.getByText('Bash (10)').closest('button')
    expect(bashBtn?.style.background).toBe('rgb(224, 247, 250)')
  })

  it('should render the header with emoji', () => {
    render(<AgeSelectScreen onBack={vi.fn()} />)
    expect(screen.getByText(/Who is using Willow/)).toBeInTheDocument()
  })
})
