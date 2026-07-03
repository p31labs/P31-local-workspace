import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OpenLedgerSurface } from '../OpenLedgerSurface';

vi.mock('../../lib/OpenLedger', () => ({
  getRoutingLogs: vi.fn().mockResolvedValue([]),
  getRoutingStats: vi.fn().mockResolvedValue({ total: 0, localRate: 0, avgConfidence: 0 }),
}));

vi.mock('../../lib/KarmaEngine', () => ({
  getBalanceAtomic: vi.fn().mockResolvedValue(0),
  getLedgerHistory: vi.fn().mockResolvedValue([]),
}));

describe('OpenLedgerSurface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the open ledger header', () => {
    render(<OpenLedgerSurface spoons={3} />);
    expect(screen.getByText('OPEN LEDGER')).toBeInTheDocument();
    expect(screen.getByText('SOVEREIGN TRANSPARENCY DASHBOARD — ZERO TELEMETRY')).toBeInTheDocument();
  });

  it('should show empty state when no routing logs exist', async () => {
    render(<OpenLedgerSurface spoons={3} />);
    await act(async () => {});
    expect(screen.getByText('No routing activity yet.')).toBeInTheDocument();
  });

  it('should display routing stats cards', async () => {
    const { getRoutingStats } = await import('../../lib/OpenLedger');
    vi.mocked(getRoutingStats).mockResolvedValue({ total: 42, localRate: 0.85, avgConfidence: 0.78 });

    render(<OpenLedgerSurface spoons={3} />);
    await act(async () => {});
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('85.0%')).toBeInTheDocument();
    expect(screen.getByText('0.78')).toBeInTheDocument();
  });

  it('should show routing log entries', async () => {
    const { getRoutingLogs } = await import('../../lib/OpenLedger');
    vi.mocked(getRoutingLogs).mockResolvedValue([
      {
        id: 'route_1',
        promptHash: 'abc123',
        route: 'local',
        confidence: 0.92,
        entropy: 0.4,
        variance: 0.2,
        semantic: 0.8,
        abstention: 0.0,
        tier: 'local',
        timestamp: Date.now(),
      },
      {
        id: 'route_2',
        promptHash: 'def456',
        route: 'edge',
        confidence: 0.35,
        entropy: 0.8,
        variance: 0.6,
        semantic: 0.3,
        abstention: 0.4,
        tier: 'edge',
        timestamp: Date.now(),
      },
    ]);

    render(<OpenLedgerSurface spoons={3} />);
    await act(async () => {});
    expect(screen.getByText(/LOCAL/)).toBeInTheDocument();
    expect(screen.getByText(/\bEDGE\b/)).toBeInTheDocument();
    expect(screen.getByText(/92%/)).toBeInTheDocument();
    expect(screen.getByText(/35%/)).toBeInTheDocument();
  });
});
