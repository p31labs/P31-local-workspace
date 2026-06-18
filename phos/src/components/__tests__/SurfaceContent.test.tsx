import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtmosphereProvider } from '../AtmosphereProvider';
import { SurfaceContent } from '../SurfaceContent';

const renderSurface = (surface: string, spoons = 3) => {
  return render(
    <AtmosphereProvider initialSpoons={spoons} initialSurface={surface}>
      <SurfaceContent currentSurface={surface} setSurface={() => {}} spoons={spoons} />
    </AtmosphereProvider>
  );
};

describe('SurfaceContent', () => {
  it('should render GREETING surface', () => {
    renderSurface('GREETING');
    expect(screen.getByText('P³¹')).toBeTruthy();
  });

  it('should render THE_BUFFER surface', () => {
    renderSurface('THE_BUFFER');
    expect(screen.getByText('Somatic Buffer Engine')).toBeTruthy();
  });

  it('should render VAULT surface', () => {
    renderSurface('VAULT');
    expect(screen.getByText('PQC Protective Layer')).toBeTruthy();
  });

  it('should render ARCADE surface', () => {
    renderSurface('ARCADE');
    expect(screen.getByText('The Arcade Environment Hub')).toBeTruthy();
  });

  it('should render HEARTH surface', () => {
    renderSurface('HEARTH');
    expect(screen.getByText('Current Energy')).toBeTruthy();
    expect(screen.getByText('⚡ Log Energy')).toBeTruthy();
  });

  it('should render LEDGER surface', () => {
    renderSurface('LEDGER');
    expect(screen.getByText('PHOS BIFURCATED BALANCE LEDGER')).toBeTruthy();
  });

  it('should render ARCHIVE surface', () => {
    renderSurface('ARCHIVE');
    expect(screen.getByText('Sovereign Archive Search')).toBeTruthy();
  });

  it('should render SETTINGS surface', () => {
    renderSurface('SETTINGS');
    expect(screen.getByText('Reduce Motion')).toBeTruthy();
  });

  it('should show error for unknown surface', () => {
    renderSurface('NONEXISTENT');
    expect(screen.getByText(/ERR_SURFACE_NOT_BOUND/)).toBeTruthy();
  });

  it('should filter high-stress games at low spoons', () => {
    renderSurface('ARCADE', 1);
    const arcadeText = document.body.textContent || '';
    expect(arcadeText).toContain('Zen Mode');
    expect(arcadeText).not.toContain('Gridiron');
    expect(arcadeText).not.toContain('Orbital');
  });

  it('should render COMPASS surface', () => {
    renderSurface('COMPASS');
    expect(screen.getByText('Compass')).toBeTruthy();
    expect(screen.getByText('Family')).toBeTruthy();
    expect(screen.getByText('Build')).toBeTruthy();
  });

  it('should render IGNITION surface', () => {
    renderSurface('IGNITION');
    expect(screen.getByText(/Choose your entry point/)).toBeTruthy();
  });

  it('should render BONDING surface', () => {
    renderSurface('BONDING');
    expect(screen.getByText('LAUNCH_BONDING')).toBeTruthy();
  });

  it('should render NODE_ZERO surface', () => {
    renderSurface('NODE_ZERO');
    expect(screen.getByText('Node Zero Bridge')).toBeTruthy();
    expect(screen.getByText('DISCOVERING')).toBeTruthy();
  });

  it('should render GRID surface separately from NODE_ZERO', () => {
    renderSurface('GRID');
    expect(screen.getByText(/CONNECTION_GRID/)).toBeTruthy();
    expect(screen.getByText(/MESH_TOPOLOGY/)).toBeTruthy();
  });
});
