import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtmosphereProvider } from '../../components/AtmosphereProvider';
import { GreetingSurface } from '../GreetingSurface';

const renderGreeting = (spoons = 3) => {
  return render(
    <AtmosphereProvider initialSpoons={spoons} initialSurface="GREETING">
      <GreetingSurface />
    </AtmosphereProvider>
  );
};

describe('GreetingSurface', () => {
  it('should render P31 logo', () => {
    renderGreeting();
    expect(screen.getByText('P³¹')).toBeTruthy();
  });

  it('should show spoon count', () => {
    renderGreeting(3);
    expect(screen.getByText('spoons: 3/5')).toBeTruthy();
  });

  it('should render Enter button', () => {
    renderGreeting();
    expect(screen.getByText('Enter')).toBeTruthy();
  });

  it('should render Compass button', () => {
    renderGreeting();
    expect(screen.getByText(/Comp.*ass/i)).toBeTruthy();
  });

  it('should show offline during grayRock', () => {
    renderGreeting(0);
    expect(screen.getByText('System suspended.')).toBeTruthy();
  });

  it('should not show logo during grayRock', () => {
    renderGreeting(0);
    expect(screen.queryByText('P³¹')).toBeNull();
  });

  it('should render Ko-fi link', () => {
    renderGreeting();
    expect(screen.getByText('Support P31')).toBeTruthy();
  });

  it('should show correct spoon count for max spoons', () => {
    renderGreeting(5);
    expect(screen.getByText('spoons: 5/5')).toBeTruthy();
  });

  it('should show correct spoon count for min spoons', () => {
    renderGreeting(1);
    expect(screen.getByText('spoons: 1/5')).toBeTruthy();
  });

  it('should render Enter and Compass as separate buttons', () => {
    renderGreeting();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });
});
