import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import VoiceScreen from '../VoiceScreen'

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

describe('VoiceScreen', () => {
  it('should render title and back button', () => {
    render(<VoiceScreen onBack={vi.fn()} />)
    expect(screen.getByText('Voice Messages!')).toBeInTheDocument()
    expect(screen.getByText('BACK')).toBeInTheDocument()
  })

  it('should render record button with TAP TO RECORD text', () => {
    render(<VoiceScreen onBack={vi.fn()} />)
    expect(screen.getByText('TAP TO RECORD')).toBeInTheDocument()
  })

  it('should render 4 voice effect buttons', () => {
    render(<VoiceScreen onBack={vi.fn()} />)
    expect(screen.getByText('Normal')).toBeInTheDocument()
    expect(screen.getByText('Chipmunk')).toBeInTheDocument()
    expect(screen.getByText('Robot')).toBeInTheDocument()
    expect(screen.getByText('Deep')).toBeInTheDocument()
  })

  it('should show hint when no memos recorded', () => {
    render(<VoiceScreen onBack={vi.fn()} />)
    expect(screen.getByText(/Tap the button to record a message for Dad/)).toBeInTheDocument()
  })

  it('should call onBack when BACK is clicked', () => {
    const onBack = vi.fn()
    render(<VoiceScreen onBack={onBack} />)
    fireEvent.click(screen.getByText('BACK'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('should toggle recording state on button click', () => {
    render(<VoiceScreen onBack={vi.fn()} />)
    const recordBtn = screen.getByText('TAP TO RECORD')
    fireEvent.click(recordBtn)
    expect(screen.getByText('TAP TO STOP')).toBeInTheDocument()
    expect(screen.getByText('Recording...')).toBeInTheDocument()
  })

  it('should show recording indicator when recording', () => {
    render(<VoiceScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('TAP TO RECORD'))
    expect(document.querySelector('.recording-indicator')).toBeInTheDocument()
    expect(document.querySelector('.recording-dot')).toBeInTheDocument()
  })

  it('should stop recording when TAP TO STOP is clicked', () => {
    render(<VoiceScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('TAP TO RECORD'))
    fireEvent.click(screen.getByText('TAP TO STOP'))
    expect(screen.getByText('TAP TO RECORD')).toBeInTheDocument()
  })

  it('should select different effect', () => {
    render(<VoiceScreen onBack={vi.fn()} />)
    fireEvent.click(screen.getByText('Chipmunk'))
    expect(document.querySelector('.effect-active')).toBeTruthy()
  })
})
