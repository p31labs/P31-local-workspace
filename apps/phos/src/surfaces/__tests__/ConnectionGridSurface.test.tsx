import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionGridSurface } from '../ConnectionGridSurface';

describe('ConnectionGridSurface', () => {
  it('should render mesh topology header', () => {
    render(<ConnectionGridSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(screen.getByText(/CONNECTION_GRID/)).toBeTruthy();
  });

  it('should show LIVE badge', () => {
    render(<ConnectionGridSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(screen.getByText('LIVE')).toBeTruthy();
  });

  it('should show online node count', () => {
    render(<ConnectionGridSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(screen.getByText(/\d+\/\d+ ONLINE/)).toBeTruthy();
  });

  it('should render node buttons', () => {
    render(<ConnectionGridSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(screen.getByText('PHOS Core')).toBeTruthy();
    expect(screen.getByText('CF Edge')).toBeTruthy();
  });

  it('should render canvas element', () => {
    const { container } = render(<ConnectionGridSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });
});
