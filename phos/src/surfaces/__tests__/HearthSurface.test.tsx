import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HearthSurface } from '../HearthSurface';
import { AtmosphereProvider } from '../../components/AtmosphereProvider';

const mockTheme = { name: 'QUANTUM' };

const renderWithProvider = (spoons: number) => {
  return render(
    <AtmosphereProvider initialSpoons={spoons} initialSurface="HEARTH">
      <HearthSurface theme={mockTheme} spoons={spoons} />
    </AtmosphereProvider>
  );
};

describe('HearthSurface', () => {
  it('should show 3 tabs at normal spoons', () => {
    renderWithProvider(4);
    expect(screen.getByText(/^overview$/i)).toBeTruthy();
    expect(screen.getByText(/^energy$/i)).toBeTruthy();
    expect(screen.getByText(/^kitchen$/i)).toBeTruthy();
  });

  it('should show simplified view at low spoons', () => {
    renderWithProvider(1);
    expect(screen.getByText('Hearth')).toBeTruthy();
    expect(screen.getByText(/How are you feeling/)).toBeTruthy();
    expect(screen.queryByText(/Current Energy/)).toBeNull();
  });

  it('should show recipe scaling in kitchen tab', () => {
    renderWithProvider(4);
    fireEvent.click(screen.getByText(/^kitchen$/i));
    expect(screen.getByText('1x')).toBeTruthy();
    expect(screen.getByText('8x')).toBeTruthy();
  });

  it('should show Current Energy in overview tab', () => {
    renderWithProvider(4);
    expect(screen.getByText('Current Energy')).toBeTruthy();
    expect(screen.getByText('⚡ Log Energy')).toBeTruthy();
    expect(screen.getByText('🍳 Kitchen')).toBeTruthy();
  });

  it('should switch to energy tab on button click', () => {
    renderWithProvider(4);
    fireEvent.click(screen.getByText('⚡ Log Energy'));
    expect(screen.getByText('Energy Level')).toBeTruthy();
    expect(screen.getByText(/Good|Moderate|Low/)).toBeTruthy();
  });

  it('should switch to kitchen tab on button click', () => {
    renderWithProvider(4);
    fireEvent.click(screen.getByText('🍳 Kitchen'));
    expect(screen.getByText('Sovereign Oat Base')).toBeTruthy();
    expect(screen.getByText(/Instructions/)).toBeTruthy();
  });

  it('should show energy warning at low energy level', () => {
    renderWithProvider(4);
    fireEvent.click(screen.getByText('⚡ Log Energy'));
    const slider = screen.getByDisplayValue('5') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '2' } });
    expect(screen.getByText(/Energy very low/)).toBeTruthy();
  });

  it('should show Moderate label for mid energy', () => {
    renderWithProvider(4);
    expect(screen.getByText(/Moderate/)).toBeTruthy();
  });

  it('should show simplified view at 2 spoons', () => {
    renderWithProvider(2);
    expect(screen.getByText(/How are you feeling/)).toBeTruthy();
  });

  it('should show full view at 3 spoons', () => {
    renderWithProvider(3);
    expect(screen.getByText('Current Energy')).toBeTruthy();
  });
});
