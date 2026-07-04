import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtmosphereProvider } from '../../AtmosphereProvider';
import AtomOrbitals from '../AtomOrbitals';

describe('AtomOrbitals', () => {
  it('should render a canvas element', () => {
    render(
      <AtmosphereProvider initialSpoons={3} initialSurface="BONDING">
        <AtomOrbitals />
      </AtmosphereProvider>
    );
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should be hidden from accessibility tree', () => {
    render(
      <AtmosphereProvider initialSpoons={3} initialSurface="BONDING">
        <AtomOrbitals />
      </AtmosphereProvider>
    );
    const canvas = document.querySelector('canvas');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render without crashing at crisis spoon level', () => {
    render(
      <AtmosphereProvider initialSpoons={0} initialSurface="BONDING">
        <AtomOrbitals />
      </AtmosphereProvider>
    );
    expect(document.querySelector('canvas')).toBeTruthy();
  });

  it('should render without crashing at max spoon level', () => {
    render(
      <AtmosphereProvider initialSpoons={5} initialSurface="BONDING">
        <AtomOrbitals />
      </AtmosphereProvider>
    );
    expect(document.querySelector('canvas')).toBeTruthy();
  });

  it('should call getContext on canvas', () => {
    render(
      <AtmosphereProvider initialSpoons={3} initialSurface="BONDING">
        <AtomOrbitals />
      </AtmosphereProvider>
    );
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
  });
});
