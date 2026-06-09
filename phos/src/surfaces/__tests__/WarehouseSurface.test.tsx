import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WarehouseSurface } from '../WarehouseSurface';

vi.mock('@electric-sql/pglite', () => ({
  PGlite: vi.fn().mockImplementation(() => ({
    query: vi.fn().mockRejectedValue(new Error('DB unavailable')),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

const mockTheme = { name: 'QUANTUM' };

describe('WarehouseSurface', () => {
  it('should render warehouse title', () => {
    render(<WarehouseSurface theme={mockTheme} spoons={3} />);
    expect(screen.getByText(/Warehouse Service Interface/i)).toBeTruthy();
  });

  it('should show Live badge', () => {
    render(<WarehouseSurface theme={mockTheme} spoons={3} />);
    expect(screen.getByText('Live')).toBeTruthy();
  });

  it('should display metrics grid', () => {
    render(<WarehouseSurface theme={mockTheme} spoons={3} />);
    expect(screen.getByText('TOTAL_REGISTERED_ASSETS')).toBeTruthy();
    expect(screen.getByText('DELTA_SYNC_QUEUE')).toBeTruthy();
  });

  it('should show recent telemetry empty state', () => {
    render(<WarehouseSurface theme={mockTheme} spoons={3} />);
    expect(screen.getByText(/No recent scans caught in loop/i)).toBeTruthy();
  });

  it('should show DB offline error when pglite fails', async () => {
    render(<WarehouseSurface theme={mockTheme} spoons={3} />);
    await waitFor(() => {
      expect(screen.getByText(/WAREHOUSE_DB_OFFLINE/)).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should accept spoons prop without crashing', () => {
    render(<WarehouseSurface theme={mockTheme} spoons={1} />);
    expect(screen.getByText(/Warehouse Service Interface/i)).toBeTruthy();
  });
});
