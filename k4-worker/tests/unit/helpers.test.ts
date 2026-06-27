import { describe, it, expect } from 'vitest';

function calculateEngagementDelta(eventType: string, _payload: Record<string, unknown>): number {
  switch (eventType) {
    case 'ATOM_PLACED': return 0.02;
    case 'PING_SENT': return 0.05;
    case 'MOLECULE_COMPLETED': return 0.15;
    case 'SESSION_START': return 0.1;
    case 'SESSION_END': return -0.05;
    default: return 0.0;
  }
}

describe('K4 Engagement Delta — Restorative Topology', () => {
  it('awards the largest delta for MOLECULE_COMPLETED', () => {
    const delta = calculateEngagementDelta('MOLECULE_COMPLETED', {});
    expect(delta).toBeGreaterThan(calculateEngagementDelta('SESSION_START', {}));
    expect(delta).toBeGreaterThan(calculateEngagementDelta('PING_SENT', {}));
    expect(delta).toBe(0.15);
  });

  it('gives a small positive delta for ATOM_PLACED', () => {
    expect(calculateEngagementDelta('ATOM_PLACED', {})).toBe(0.02);
  });

  it('gives a moderate positive delta for PING_SENT', () => {
    expect(calculateEngagementDelta('PING_SENT', {})).toBe(0.05);
  });

  it('gives session start delta', () => {
    expect(calculateEngagementDelta('SESSION_START', {})).toBe(0.1);
  });

  it('applies a small negative delta for SESSION_END', () => {
    expect(calculateEngagementDelta('SESSION_END', {})).toBe(-0.05);
  });

  it('returns zero for unknown event types', () => {
    expect(calculateEngagementDelta('UNKNOWN_EVENT', {})).toBe(0);
  });

  it('ignores payload content', () => {
    const withPayload = calculateEngagementDelta('MOLECULE_COMPLETED', { formula: 'H2O', atoms: 3 });
    const empty = calculateEngagementDelta('MOLECULE_COMPLETED', {});
    expect(withPayload).toBe(empty);
  });
});
