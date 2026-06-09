import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import FamilyScreen from '../FamilyScreen'
import { FamilyMesh } from '../FamilyMesh'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('FamilyScreen', () => {
  it('should render title and back button', () => {
    render(<FamilyScreen onBack={vi.fn()} />)
    expect(screen.getByText('Family')).toBeInTheDocument()
    expect(screen.getByText('BACK')).toBeInTheDocument()
  })

  it('should render 4 family contact cards', () => {
    render(<FamilyScreen onBack={vi.fn()} />)
    expect(screen.getByText('Dad')).toBeInTheDocument()
    expect(screen.getByText('Nana')).toBeInTheDocument()
    expect(screen.getByText('Uncle Tony')).toBeInTheDocument()
    expect(screen.getByText('Auntie')).toBeInTheDocument()
  })

  it('should show hint text', () => {
    render(<FamilyScreen onBack={vi.fn()} />)
    expect(screen.getByText(/Tap someone to say hi/)).toBeInTheDocument()
  })

  it('should show calling state when contact is tapped', () => {
    render(<FamilyScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('Dad'))
    expect(screen.getByText('Calling...')).toBeInTheDocument()
  })

  it('should call onBack when BACK is clicked', () => {
    const onBack = vi.fn()
    render(<FamilyScreen onBack={onBack} />)
    fireEvent.click(screen.getByText('BACK'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('should persist last contact time', () => {
    render(<FamilyScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('Dad'))
    const stored = localStorage.getItem('willow-last-contact')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.Dad).toBeTruthy()
  })

  it('should show avatar initials', () => {
    render(<FamilyScreen onBack={vi.fn()} />)
    expect(document.querySelectorAll('.avatar-letter').length).toBe(4)
  })

  it('should show ripple effect on contact tap', () => {
    render(<FamilyScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('Dad'))
    expect(document.querySelector('.ripple-effect')).toBeInTheDocument()
  })

  it('should show last contact time after tapping', () => {
    render(<FamilyScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('Dad'))
    expect(screen.getByText('Just now')).toBeInTheDocument()
  })
})

describe('FamilyMesh', () => {
  it('should render family presence title', () => {
    render(<FamilyMesh />)
    expect(screen.getByText('Family Presence')).toBeInTheDocument()
  })

  it('should render 3 family members', () => {
    render(<FamilyMesh />)
    expect(screen.getByText('Bash')).toBeInTheDocument()
    expect(screen.getByText('Willow')).toBeInTheDocument()
    expect(screen.getByText('Dad')).toBeInTheDocument()
  })

  it('should show online status for online members', () => {
    render(<FamilyMesh />)
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('should show last seen for offline members', () => {
    render(<FamilyMesh />)
    const lastSeenEls = screen.getAllByText(/Last seen/)
    expect(lastSeenEls.length).toBeGreaterThan(0)
  })

  it('should show mood for members with mood data', () => {
    render(<FamilyMesh />)
    expect(screen.getByText(/Feeling good/)).toBeInTheDocument()
  })

  it('should render avatars', () => {
    render(<FamilyMesh />)
    const avatars = document.querySelectorAll('.family-avatar-emoji')
    expect(avatars.length).toBe(3)
  })

  it('should show online dot for online members', () => {
    render(<FamilyMesh />)
    const onlineDots = document.querySelectorAll('.online-dot')
    expect(onlineDots.length).toBeGreaterThan(0)
  })
})
