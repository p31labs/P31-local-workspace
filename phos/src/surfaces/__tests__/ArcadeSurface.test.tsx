import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArcadeSurface } from '../ArcadeSurface';

const mockTheme = {
  name: 'QUANTUM',
  button: 'bg-emerald-950/20 border border-emerald-500/40 text-emerald-400 rounded-none',
};

describe('ArcadeSurface', () => {
  it('should render game list', () => {
    render(<ArcadeSurface theme={mockTheme} spoons={5} />);
    expect(screen.getByText('P31 Smallball')).toBeTruthy();
    expect(screen.getByText('Liquid Sculptor')).toBeTruthy();
  });

  it('should filter high-stress games at low spoons', () => {
    render(<ArcadeSurface theme={mockTheme} spoons={1} />);
    expect(screen.queryByText('Gridiron Strategy')).toBeNull();
    expect(screen.queryByText('Orbital Drift')).toBeNull();
    expect(screen.getByText('P31 Smallball')).toBeTruthy();
  });

  it('should show all games at high spoons', () => {
    render(<ArcadeSurface theme={mockTheme} spoons={5} />);
    expect(screen.getByText('Gridiron Strategy')).toBeTruthy();
    expect(screen.getByText('Orbital Drift')).toBeTruthy();
  });

  it('should filter by category', () => {
    render(<ArcadeSurface theme={mockTheme} spoons={5} />);
    fireEvent.click(screen.getByText('sports'));
    expect(screen.getByText('P31 Smallball')).toBeTruthy();
    expect(screen.queryByText('Liquid Sculptor')).toBeNull();
  });

  it('should show Zen Mode warning at low spoons', () => {
    render(<ArcadeSurface theme={mockTheme} spoons={1} />);
    expect(screen.getByText(/Zen Mode/)).toBeTruthy();
  });

  it('should not show Zen Mode warning at high spoons', () => {
    render(<ArcadeSurface theme={mockTheme} spoons={5} />);
    expect(screen.queryByText(/Zen Mode/)).toBeNull();
  });
});
