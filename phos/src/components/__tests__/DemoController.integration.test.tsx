import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AtmosphereProvider, useAtmosphere } from '../AtmosphereProvider';
import { DemoController } from '../DemoController';

function DemoHarness() {
  const { currentSurface, spoons, setSurface, setSpoons } = useAtmosphere();
  return (
    <div>
      <DemoController />
      <div data-testid="surface-display">{currentSurface}</div>
      <div data-testid="spoons-display">{spoons}</div>
    </div>
  );
}

describe('DemoController — integration with AtmosphereProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render demo control bar', () => {
    render(
      <AtmosphereProvider>
        <DemoHarness />
      </AtmosphereProvider>
    );
    expect(screen.getByText(/Spoon-Aware Entry Point/)).toBeInTheDocument();
  });

  it('should advance stage on next button click', () => {
    render(
      <AtmosphereProvider>
        <DemoHarness />
      </AtmosphereProvider>
    );
    const nextBtn = screen.getByLabelText('Next stage');
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Ignition Core/)).toBeInTheDocument();
  });

  it('should go back on previous button click', () => {
    render(
      <AtmosphereProvider>
        <DemoHarness />
      </AtmosphereProvider>
    );
    const prevBtn = screen.getByLabelText('Previous stage');
    fireEvent.click(prevBtn);
    expect(screen.getByText(/Settings & Customization/)).toBeInTheDocument();
  });

  it('should cycle through all 6 stages', () => {
    render(
      <AtmosphereProvider>
        <DemoHarness />
      </AtmosphereProvider>
    );

    const titles = [
      'Spoon-Aware Entry Point',
      'Ignition Core',
      'BONDING Chemistry Game',
      'The Buffer',
      'The Vault',
      'Settings & Customization',
    ];

    const nextBtn = screen.getByLabelText('Next stage');

    titles.forEach((title, i) => {
      expect(screen.getByText(new RegExp(title))).toBeInTheDocument();
      if (i < titles.length - 1) {
        fireEvent.click(nextBtn);
      }
    });
  });

  it('should auto-advance when playing', () => {
    render(
      <AtmosphereProvider>
        <DemoHarness />
      </AtmosphereProvider>
    );

    const playBtn = screen.getByLabelText('Play tour');
    fireEvent.click(playBtn);

    expect(screen.getByText(/Spoon-Aware Entry Point/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByText(/Ignition Core/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByText(/BONDING Chemistry Game/)).toBeInTheDocument();
  });

  it('should pause auto-advance', () => {
    render(
      <AtmosphereProvider>
        <DemoHarness />
      </AtmosphereProvider>
    );

    const playBtn = screen.getByLabelText('Play tour');
    fireEvent.click(playBtn);

    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.getByText(/Ignition Core/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Pause tour'));

    act(() => { vi.advanceTimersByTime(8000); });
    expect(screen.getByText(/Ignition Core/)).toBeInTheDocument();
  });

  it('dot navigation should go to specific stage', () => {
    render(
      <AtmosphereProvider>
        <DemoHarness />
      </AtmosphereProvider>
    );

    const dots = screen.getAllByLabelText(/Go to stage/);
    expect(dots).toHaveLength(6);

    fireEvent.click(dots[3]);
    expect(screen.getByText(/The Buffer/)).toBeInTheDocument();
  });
});
