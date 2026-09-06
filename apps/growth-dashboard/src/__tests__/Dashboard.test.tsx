import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../components/Dashboard';

vi.mock('@p31/ui/chrome', () => ({
  GlassCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('Dashboard', () => {
  it('renders heading', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    ) as unknown as typeof fetch;
    renderWithProviders(<Dashboard />);
    await waitFor(() => expect(screen.getByText('Growth Dashboard')).toBeTruthy());
  });

  it('shows metrics cards with zero counts', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    ) as unknown as typeof fetch;
    renderWithProviders(<Dashboard />);
    await waitFor(() => expect(screen.getByText('Total Pilots')).toBeTruthy());
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });

  it('renders pilot table with data', async () => {
    const pilots = [
      { id: 1, did: 'did:1', name: 'A', email: 'a@test.com', status: 'active' as const, source: 'synthetic' as const, created_at: '2026-01-01' },
      { id: 2, did: 'did:2', name: 'B', email: 'b@test.com', status: 'invited' as const, source: 'test' as const, created_at: '2026-01-02' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(pilots) }),
    ) as unknown as typeof fetch;
    renderWithProviders(<Dashboard />);
    await waitFor(() => expect(screen.getByText('A')).toBeTruthy());
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.getByText('[synthetic]')).toBeTruthy();
    expect(screen.getByText('[test]')).toBeTruthy();
  });
});
