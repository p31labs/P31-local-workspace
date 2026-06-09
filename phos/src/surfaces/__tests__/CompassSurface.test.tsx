import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompassSurface } from '../CompassSurface';
import { AtmosphereProvider } from '../../components/AtmosphereProvider';

const renderCompass = (spoons = 3) => {
  return render(
    <AtmosphereProvider initialSpoons={spoons} initialSurface="COMPASS">
      <CompassSurface />
    </AtmosphereProvider>
  );
};

describe('CompassSurface', () => {
  it('should render compass title', () => {
    renderCompass();
    expect(screen.getByText('Compass')).toBeTruthy();
  });

  it('should show direction question at normal spoons', () => {
    renderCompass(3);
    expect(screen.getByText(/Where do you need to go/)).toBeTruthy();
  });

  it('should show 4 destinations at normal spoons', () => {
    renderCompass(3);
    expect(screen.getByText('Family')).toBeTruthy();
    expect(screen.getByText('Build')).toBeTruthy();
    expect(screen.getByText('Knowledge')).toBeTruthy();
    expect(screen.getByText('Safe Room')).toBeTruthy();
  });

  it('should show only 2 destinations at 1 spoon', () => {
    renderCompass(1);
    expect(screen.getByText('Family')).toBeTruthy();
    expect(screen.getByText('Build')).toBeTruthy();
    expect(screen.queryByText('Knowledge')).toBeNull();
    expect(screen.queryByText('Safe Room')).toBeNull();
  });

  it('should show 4 destinations at 2 spoons (not low)', () => {
    // Compass uses spoons <= 1 for low energy filter, so 2 spoons = full list
    renderCompass(2);
    expect(screen.getByText('Family')).toBeTruthy();
    expect(screen.getByText('Build')).toBeTruthy();
    expect(screen.getByText('Knowledge')).toBeTruthy();
    expect(screen.getByText('Safe Room')).toBeTruthy();
  });

  it('should show low energy text at 1 spoon', () => {
    renderCompass(1);
    expect(screen.getByText(/Low energy. Simple choices./)).toBeTruthy();
  });

  it('should show offline during grayRock', () => {
    renderCompass(0);
    expect(screen.getByText('Compass offline.')).toBeTruthy();
  });

  it('should not show title during grayRock', () => {
    renderCompass(0);
    expect(screen.queryByText('Compass')).toBeNull();
  });

  it('should navigate on button click', () => {
    renderCompass(3);
    fireEvent.click(screen.getByText('Family'));
    fireEvent.click(screen.getByText('Knowledge'));
  });

  it('should show icons alongside labels', () => {
    renderCompass(3);
    const familyBtn = screen.getByText('Family').closest('button');
    expect(familyBtn?.textContent).toContain('♥');
  });
});
