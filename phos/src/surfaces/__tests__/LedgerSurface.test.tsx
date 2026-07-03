import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { LedgerSurface } from '../LedgerSurface';

vi.mock('../../lib/KarmaEngine', () => ({
  getBalanceAtomic: vi.fn().mockResolvedValue(0),
  getLedgerHistory: vi.fn().mockResolvedValue([]),
  verifyLedgerIntegrity: vi.fn().mockResolvedValue({ valid: true, count: 0 }),
}));

vi.mock('../../lib/K4Bridge', () => ({
  K4Bridge: {
    fetchFeatures: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../lib/api/ledger', () => ({
  fetchLoveBalance: vi.fn().mockResolvedValue({ did: 'did:key:local', balance: 100, staked: 0, earned: 0, reputation: 50 }),
}));

const mockTheme = { name: 'QUANTUM', wrapper: '', orb: '', button: '', hud: '', input: '', container: '' };

describe('LedgerSurface', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render bifurcated ledger header', () => {
    render(<LedgerSurface theme={mockTheme} />);
    expect(screen.getByText('PHOS BIFURCATED BALANCE LEDGER')).toBeInTheDocument();
  });

  it('should show Tranche 1 operational section', () => {
    render(<LedgerSurface theme={mockTheme} />);
    expect(screen.getByText(/Tranche 1: Operational Base Payroll/)).toBeInTheDocument();
    expect(screen.getByText(/SABLIER STREAM RATE/)).toBeInTheDocument();
    expect(screen.getByText(/DEFERRED SLICING PIE DEBT/)).toBeInTheDocument();
  });

  it('should show Tranche 3 ontological section', () => {
    render(<LedgerSurface theme={mockTheme} />);
    expect(screen.getByText(/Tranche 3: Ontological Care Ledger/)).toBeInTheDocument();
    expect(screen.getByText(/FOUNDING NODE DIVIDEND WEIGHT/)).toBeInTheDocument();
    expect(screen.getAllByText(/ACCUMULATED L.O.V.E. BALANCE/).length).toBeGreaterThanOrEqual(1);
  });

  it('should show chain integrity indicator', async () => {
    render(<LedgerSurface theme={mockTheme} />);
    await waitFor(() => {
      expect(screen.getByText(/CHAIN INTEGRITY/)).toBeInTheDocument();
    });
    expect(screen.getByText(/✓ VALID/)).toBeInTheDocument();
  });

  it('should show signed transaction entries', async () => {
    const { getLedgerHistory } = await import('../../lib/KarmaEngine');
    vi.mocked(getLedgerHistory).mockResolvedValue([
      { kind: 'DAILY_CHECK_IN', delta: 5, timestamp: Date.now() - 60000, signature: 'abc123def456', prevSignature: 'GENESIS' },
    ]);

    render(<LedgerSurface theme={mockTheme} />);
    await waitFor(() => {
      expect(screen.getByText(/DAILY_CHECK_IN/)).toBeInTheDocument();
    });
  });

  it('should show tampered indicator if integrity fails', async () => {
    const { verifyLedgerIntegrity } = await import('../../lib/KarmaEngine');
    vi.mocked(verifyLedgerIntegrity).mockResolvedValue({ valid: false, count: 5 });

    render(<LedgerSurface theme={mockTheme} />);
    await waitFor(() => {
      expect(screen.getByText(/⚠ TAMPERED/)).toBeInTheDocument();
    });
  });
});
