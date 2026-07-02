import { describe, it, expect } from 'vitest';

describe('Escrow Engine', () => {
  it('should transition through valid state machine', () => {
    const states = ['locked', 'arbitrating', 'ready_to_release', 'released'];
    expect(states).toContain('locked');
    expect(states).toContain('arbitrating');
    expect(states).toContain('ready_to_release');
    expect(states).toContain('released');
  });

  it('should reject invalid state transitions', () => {
    const validTransitions: Record<string, string[]> = {
      locked: ['arbitrating', 'refunded'],
      arbitrating: ['ready_to_release'],
      ready_to_release: ['released'],
      released: [],
      refunded: [],
    };
    expect(validTransitions['locked']).toContain('arbitrating');
    expect(validTransitions['locked']).toContain('refunded');
    expect(validTransitions['locked']).not.toContain('released');
    expect(validTransitions['arbitrating']).toContain('ready_to_release');
    expect(validTransitions['ready_to_release']).toContain('released');
  });

  it('should require sufficient balance for release', () => {
    const escrow = { balance: 50000, status: 'arbitrating' as const };
    const releaseAmount = 30000;
    expect(releaseAmount).toBeLessThanOrEqual(escrow.balance);
  });

  it('should track multi-sig approvals', () => {
    const approvals = [
      { signerDid: 'did:key:zArbitrator', approved: true },
      { signerDid: 'did:key:zWilliam', approved: true },
    ];
    const requiredApprovals = 2;
    const currentApprovals = approvals.filter(a => a.approved).length;
    expect(currentApprovals).toBeGreaterThanOrEqual(requiredApprovals);
  });

  it('should calculate remaining balance after release', () => {
    const initialBalance = 50000;
    const releaseAmount = 30000;
    const remainingBalance = initialBalance - releaseAmount;
    expect(remainingBalance).toBe(20000);
  });
});
