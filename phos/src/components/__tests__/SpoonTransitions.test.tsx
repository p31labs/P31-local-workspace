import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AtmosphereProvider, useAtmosphere } from '../AtmosphereProvider';

function StateTestConsumer() {
  const { spoons, setSpoons, grayRock } = useAtmosphere();
  return (
    <div data-testid="state-container">
      <span data-testid="spoons-val">{spoons}</span>
      <span data-testid="grayrock-val">{grayRock ? 'true' : 'false'}</span>
      <button data-testid="set-spoons-btn" onClick={() => setSpoons(1)}>Set 1</button>
      <button data-testid="set-crisis-btn" onClick={() => setSpoons(0)}>Set 0</button>
    </div>
  );
}

describe('Atmosphere State Shift Architecture', () => {
  it('should mutate variables globally and handle internal clamping structures cleanly', () => {
    render(
      <AtmosphereProvider initialSpoons={3}>
        <StateTestConsumer />
      </AtmosphereProvider>
    );

    expect(screen.getByTestId('spoons-val').textContent).toBe('3');
    expect(screen.getByTestId('grayrock-val').textContent).toBe('false');

    fireEvent.click(screen.getByTestId('set-spoons-btn'));
    expect(screen.getByTestId('spoons-val').textContent).toBe('1');
    expect(screen.getByTestId('grayrock-val').textContent).toBe('false');

    fireEvent.click(screen.getByTestId('set-crisis-btn'));
    expect(screen.getByTestId('spoons-val').textContent).toBe('0');
    expect(screen.getByTestId('grayrock-val').textContent).toBe('true');
  });
});
