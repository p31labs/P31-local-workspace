import React, { Suspense } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DeviceProvider } from '../../context/DeviceContext';
import { AtmosphereProvider } from '../AtmosphereProvider';
import { SurfaceContent } from '../SurfaceContent';

const renderSurface = (surface: string, spoons = 3) => {
  return render(
    <DeviceProvider>
      <AtmosphereProvider initialSpoons={spoons} initialSurface={surface}>
        <Suspense fallback={<div>Loading...</div>}>
          <SurfaceContent currentSurface={surface} setSurface={() => {}} spoons={spoons} />
        </Suspense>
      </AtmosphereProvider>
    </DeviceProvider>
  );
};

describe('SurfaceContent', () => {
  it('should render GREETING surface', () => {
    renderSurface('GREETING');
    expect(screen.getByText('P³¹')).toBeTruthy();
  });

  it('should render THE_BUFFER surface', async () => {
    renderSurface('THE_BUFFER');
    expect(await screen.findByText('Somatic Buffer Engine')).toBeTruthy();
  });

  it('should render VAULT surface', () => {
    renderSurface('VAULT');
    expect(screen.getByText('PQC Protective Layer')).toBeTruthy();
  });

  it('should render ARCADE surface', async () => {
    renderSurface('ARCADE');
    expect(await screen.findByText('The Arcade Environment Hub')).toBeTruthy();
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

  it('should render ARCHIVE surface', async () => {
    renderSurface('ARCHIVE');
    expect(await screen.findByText('Sovereign Archive Search')).toBeTruthy();
  });

  it('should render SETTINGS surface', () => {
    renderSurface('SETTINGS');
    expect(screen.getByText('Reduce Motion')).toBeTruthy();
  });

  it('should show error for unknown surface', () => {
    renderSurface('NONEXISTENT');
    expect(screen.getByText(/ERR_SURFACE_NOT_BOUND/)).toBeTruthy();
  });

  it('should filter high-stress games at low spoons', async () => {
    renderSurface('ARCADE', 1);
    expect(await screen.findByText(/Zen Mode/)).toBeTruthy();
    expect(screen.queryByText('Gridiron')).toBeNull();
    expect(screen.queryByText('Orbital')).toBeNull();
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

  it('should render GRID surface separately from NODE_ZERO', async () => {
    renderSurface('GRID');
    expect(await screen.findByText(/CONNECTION_GRID/)).toBeTruthy();
    expect(await screen.findByText(/MESH_TOPOLOGY/)).toBeTruthy();
  });
});
