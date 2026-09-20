import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { TraceScale, windowSlice } from './TraceScale'
import type { Trace } from '@p31/field'

afterEach(cleanup)

const DAY = 24 * 3600 * 1000
const NOW = 1700000000000

function trace(over: Partial<Trace> = {}): Trace {
  return {
    actor: 'agent-1',
    zone: 'z0',
    frame: 'structure',
    kind: 'propose',
    payload: { x: 1 },
    preImage: 'abc',
    postImage: 'def',
    coherence: 'in-lane',
    ts: NOW,
    ...over,
  }
}

function renderScale(traces: Trace[], onBack = vi.fn()) {
  const utils = render(<TraceScale traces={traces} zoneId="z0" onBack={onBack} />)
  return { ...utils, onBack }
}

describe('TraceScale', () => {
  it('sorts traces by ts ascending, not insertion order', () => {
    const { container } = renderScale([
      trace({ actor: 'late', ts: NOW + 10 }),
      trace({ actor: 'early', ts: NOW }),
    ])
    const rows = container.querySelectorAll('.ts-row')
    expect(rows[0].textContent).toContain('early')
    expect(rows[1].textContent).toContain('late')
  })

  it('renders the frame pill from a --p31-frame-* token, not a color', () => {
    const { container } = renderScale([trace({ frame: 'creation' })])
    const pill = container.querySelector('.ts-pill')
    expect(pill?.getAttribute('style')).toContain('var(--p31-frame-creation)')
  })

  it('renders a day divider when activity spans days', () => {
    const { container } = renderScale([
      trace({ ts: NOW }),
      trace({ ts: NOW + 2 * DAY }),
    ])
    expect(container.querySelectorAll('.ts-day').length).toBeGreaterThanOrEqual(2)
  })

  it('renders an explicit gap marker for a multi-hour wait', () => {
    const { container } = renderScale([
      trace({ ts: NOW }),
      trace({ ts: NOW + 4 * 3600 * 1000 }),
    ])
    const gap = container.querySelector('.ts-gap')
    expect(gap).toBeTruthy()
    expect(gap?.textContent).toBe('+4h')
  })

  it('windowSlice computes the visible window (jsdom has no layout to test through)', () => {
    expect(windowSlice(500, 28, 0, 400, 6)).toEqual({ start: 0, end: 21 })
    expect(windowSlice(500, 28, 5000, 400, 6)).toEqual({ start: 172, end: 199 })
    expect(windowSlice(500, 28, 14000, 400, 6)).toEqual({ start: 494, end: 500 })
  })

  it('renders plainly under the threshold (no windowing)', () => {
    const traces = Array.from({ length: 10 }, (_, i) => trace({ ts: NOW + i * 1000 }))
    const { container } = renderScale(traces)
    expect(container.querySelectorAll('.ts-row').length).toBe(10)
  })

  it('dispatches onBack from the back button', () => {
    const { onBack } = renderScale([trace()])
    fireEvent.click(screen.getByRole('button', { name: /z0/ }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})
