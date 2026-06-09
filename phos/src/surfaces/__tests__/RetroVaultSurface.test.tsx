import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RetroVaultSurface } from '../RetroVaultSurface';

const mockTheme = { name: 'QUANTUM', wrapper: '', orb: '', button: '', hud: '', input: '', container: '' };

describe('RetroVaultSurface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render vault title', () => {
    render(<RetroVaultSurface theme={mockTheme} spoons={3} />);
    expect(screen.getByText(/Retro-Vault Core Metrics/i)).toBeTruthy();
  });

  it('should show PQC badge', () => {
    render(<RetroVaultSurface theme={mockTheme} spoons={3} />);
    expect(screen.getByText('PQC Protective Layer')).toBeTruthy();
  });

  it('should render the surface container', () => {
    const { container } = render(<RetroVaultSurface theme={mockTheme} spoons={3} />);
    expect(container.querySelector('.space-y-4')).toBeTruthy();
  });

  it('should accept spoons prop without crashing', () => {
    render(<RetroVaultSurface theme={mockTheme} spoons={1} />);
    expect(screen.getByText(/Retro-Vault Core Metrics/i)).toBeTruthy();
  });

  it('should render without crashing at max spoons', () => {
    render(<RetroVaultSurface theme={mockTheme} spoons={5} />);
    expect(screen.getByText(/Retro-Vault Core Metrics/i)).toBeTruthy();
  });
});
