import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsSurface } from '../SettingsSurface';
import { AtmosphereProvider } from '../../components/AtmosphereProvider';

const renderSettings = (spoons = 3) => {
  return render(
    <AtmosphereProvider initialSpoons={spoons} initialSurface="SETTINGS">
      <SettingsSurface />
    </AtmosphereProvider>
  );
};

describe('SettingsSurface', () => {
  it('should render settings title', () => {
    renderSettings();
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('should render Reduce Motion toggle', () => {
    renderSettings();
    expect(screen.getByText('Reduce Motion')).toBeTruthy();
  });

  it('should render GRAY ROCK toggle', () => {
    renderSettings();
    expect(screen.getByText('GRAY ROCK')).toBeTruthy();
  });

  it('should render Dev Mode toggle', () => {
    renderSettings();
    expect(screen.getByText('Dev Mode')).toBeTruthy();
  });

  it('should toggle Reduce Motion', () => {
    renderSettings();
    const toggle = screen.getByText('Reduce Motion')?.parentElement?.querySelector('button');
    if (toggle) {
      fireEvent.click(toggle);
      expect(toggle.className).toContain('bg-emerald-600');
    }
  });

  it('should show locked state during grayRock', () => {
    renderSettings(0);
    expect(screen.getByText('Settings locked.')).toBeTruthy();
  });
});
