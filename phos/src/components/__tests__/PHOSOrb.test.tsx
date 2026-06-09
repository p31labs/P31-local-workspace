import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtmosphereProvider } from '../AtmosphereProvider';
import PHOSOrb from '../PHOSOrb';

const renderWithProvider = (spoons: number) => {
  return render(
    <AtmosphereProvider initialSpoons={spoons} initialSurface="GREETING">
      <PHOSOrb />
    </AtmosphereProvider>
  );
};

describe('PHOSOrb', () => {
  it('should render orb at default spoons (3)', () => {
    const { container } = renderWithProvider(3);
    const orb = container.querySelector('[aria-label="PHOS Orb"]');
    expect(orb).toBeTruthy();
    expect(orb?.className).toContain('bg-emerald-400');
    expect(orb?.className).toContain('animate-pulse');
  });

  it('should scale size with spoons', () => {
    const { container: c1 } = renderWithProvider(1);
    const { container: c5 } = renderWithProvider(5);
    const orb1 = c1.querySelector('[aria-label="PHOS Orb"]');
    const orb5 = c5.querySelector('[aria-label="PHOS Orb"]');
    expect(orb1?.getAttribute('style')).toContain('80');
    expect(orb5?.getAttribute('style')).toContain('112');
  });

  it('should show gray orb during crisis mode', () => {
    const { container } = renderWithProvider(0);
    const orb = container.querySelector('.bg-gray-800');
    expect(orb).toBeTruthy();
    expect(orb?.className).toContain('shadow-none');
    expect(orb?.className).toContain('w-16');
    expect(orb?.className).toContain('h-16');
  });

  it('should have aria-label', () => {
    const { container } = renderWithProvider(3);
    const orb = container.querySelector('[aria-label="PHOS Orb"]');
    expect(orb).toBeTruthy();
  });
});
