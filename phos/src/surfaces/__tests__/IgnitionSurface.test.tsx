import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AtmosphereProvider } from '../../components/AtmosphereProvider';
import { IgnitionSurface } from '../IgnitionSurface';

const renderIgnition = (spoons = 3) => {
  return render(
    <AtmosphereProvider initialSpoons={spoons} initialSurface="IGNITION">
      <IgnitionSurface />
    </AtmosphereProvider>
  );
};

describe('IgnitionSurface', () => {
  it('should render ignition title', () => {
    renderIgnition();
    expect(screen.getByText('Ignition')).toBeTruthy();
  });

  it('should render all 4 navigation buttons', () => {
    renderIgnition();
    expect(screen.getByText('Apps')).toBeTruthy();
    expect(screen.getByText('Family')).toBeTruthy();
    expect(screen.getByText('Build')).toBeTruthy();
    expect(screen.getByText('Knowledge')).toBeTruthy();
  });

  it('should show offline during grayRock', () => {
    renderIgnition(0);
    expect(screen.getByText('Ignition offline.')).toBeTruthy();
  });

  it('should not show title during grayRock', () => {
    renderIgnition(0);
    expect(screen.queryByText('Ignition')).toBeNull();
  });

  it('should render Ko-fi link', () => {
    renderIgnition();
    expect(screen.getByText('Support P31')).toBeTruthy();
  });

  it('should show welcome message', () => {
    renderIgnition();
    expect(screen.getByText(/Welcome to PHOS/)).toBeTruthy();
    expect(screen.getByText(/Choose your entry point/)).toBeTruthy();
  });

  it('should render 4 buttons in grid layout', () => {
    renderIgnition();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
  });

  it('should not show content during grayRock', () => {
    renderIgnition(0);
    expect(screen.queryByText(/Choose your entry point/)).toBeNull();
    expect(screen.queryByText('Apps')).toBeNull();
  });
});
