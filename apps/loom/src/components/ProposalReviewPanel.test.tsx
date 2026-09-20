import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ProposalReviewPanel } from './ProposalReviewPanel'
import type { Proposal } from '@p31/canon/loom/events'

afterEach(cleanup)

const proposal: Proposal = {
  id: 'p-1',
  node: '--p31-accent',
  body: { color: 'var(--p31-accent)' },
  author: 'agent-1',
  status: 'pending',
  revision: 0,
  reviews: [],
  revisionSurvival: [],
  overallSurvival: 1,
}

function renderPanel(overrides: Partial<Parameters<typeof ProposalReviewPanel>[0]> = {}) {
  const props = {
    proposal,
    tier: 'beginner' as const,
    reason: '',
    notYet: false,
    onApprove: vi.fn(),
    onReject: vi.fn(),
    onReasonChange: vi.fn(),
    onToggleNotYet: vi.fn(),
    ...overrides,
  }
  render(<ProposalReviewPanel {...props} />)
  return props
}

describe('ProposalReviewPanel', () => {
  it('beginner tier, notYet=false, shows the "Not yet" gate and no reason input', () => {
    renderPanel()
    expect(screen.getByText('Not yet')).toBeTruthy()
    expect(screen.queryByPlaceholderText('reason (optional)')).toBeNull()
    expect(screen.getByText('Looks good')).toBeTruthy()
  })

  it('clicking "Not yet" dispatches onToggleNotYet', () => {
    const props = renderPanel()
    fireEvent.click(screen.getByText('Not yet'))
    expect(props.onToggleNotYet).toHaveBeenCalledOnce()
  })

  it('beginner tier, notYet=true, shows reason input + Reject, hides "Not yet"', () => {
    renderPanel({ notYet: true })
    expect(screen.getByPlaceholderText('reason (optional)')).toBeTruthy()
    expect(screen.getByText('Reject')).toBeTruthy()
    expect(screen.queryByText('Not yet')).toBeNull()
  })

  it('advanced tier renders the raw body and keeps the reason input', () => {
    renderPanel({ tier: 'advanced' })
    const pre = screen.getByText((content, el) => el?.tagName === 'PRE' && content.includes('var(--p31-accent)'))
    expect(pre).toBeTruthy()
    expect(screen.getByPlaceholderText('reason (optional)')).toBeTruthy()
  })

  it('approve label follows the tier via approveLabel', () => {
    renderPanel({ tier: 'advanced' })
    expect(screen.getByText('Approve')).toBeTruthy()
  })

  it('clicking approve dispatches onApprove', () => {
    const props = renderPanel()
    fireEvent.click(screen.getByText('Looks good'))
    expect(props.onApprove).toHaveBeenCalledOnce()
  })

  it('typing in the reason input dispatches onReasonChange', () => {
    const props = renderPanel({ notYet: true })
    fireEvent.change(screen.getByPlaceholderText('reason (optional)'), {
      target: { value: 'wrong mass' },
    })
    expect(props.onReasonChange).toHaveBeenCalledWith('wrong mass')
  })

  it('clicking Reject dispatches onReject with the current reason', () => {
    const props = renderPanel({ notYet: true, reason: 'wrong mass' })
    fireEvent.click(screen.getByText('Reject'))
    expect(props.onReject).toHaveBeenCalledWith('wrong mass')
  })

  it('clicking Reject with an empty reason dispatches onReject with an empty string', () => {
    const props = renderPanel({ notYet: true, reason: '' })
    fireEvent.click(screen.getByText('Reject'))
    expect(props.onReject).toHaveBeenCalledWith('')
  })
})
