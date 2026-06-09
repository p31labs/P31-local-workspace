import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AtmosphereProvider } from '../../AtmosphereProvider';
import DustMotes from '../DustMotes';

describe('DustMotes', () => {
  it('should render a canvas element', () => {
    render(
      <AtmosphereProvider initialSpoons={3} initialSurface="THE_BUFFER">
        <DustMotes />
      </AtmosphereProvider>
    );
    expect(document.querySelector('canvas')).toBeTruthy();
  });

  it('should be hidden from accessibility tree', () => {
    render(
      <AtmosphereProvider initialSpoons={3} initialSurface="THE_BUFFER">
        <DustMotes />
      </AtmosphereProvider>
    );
    expect(document.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render at crisis spoon level', () => {
    render(
      <AtmosphereProvider initialSpoons={0} initialSurface="THE_BUFFER">
        <DustMotes />
      </AtmosphereProvider>
    );
    expect(document.querySelector('canvas')).toBeTruthy();
  });

  it('should render at max spoon level', () => {
    render(
      <AtmosphereProvider initialSpoons={5} initialSurface="THE_BUFFER">
        <DustMotes />
      </AtmosphereProvider>
    );
    expect(document.querySelector('canvas')).toBeTruthy();
  });

  it('should call getContext on canvas', () => {
    render(
      <AtmosphereProvider initialSpoons={3} initialSurface="THE_BUFFER">
        <DustMotes />
      </AtmosphereProvider>
    );
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
  });
});
