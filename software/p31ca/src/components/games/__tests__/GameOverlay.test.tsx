import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverlay } from '../GameOverlay';
import { type GameEngineState } from '../../lib/arcade-core/useGameEngine';

function makeEngineState(overrides: Partial<GameEngineState> = {}): GameEngineState {
  return {
    status: 'running',
    score: 42,
    spoons: 4,
    ...overrides,
  };
}

describe('GameOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders game title and score', () => {
    const state = makeEngineState();
    render(
      <GameOverlay gameId="test-game" gameTitle="Test Game" gameIcon="🎮" engineState={state} />
    );
    expect(screen.getByText('TEST GAME')).toBeDefined();
    expect(screen.getByText('SCORE: 42')).toBeDefined();
  });

  it('shows REST REQUIRED label when spoons <= 1', () => {
    const state = makeEngineState({ spoons: 1 });
    render(
      <GameOverlay gameId="test-game" gameTitle="Test Game" gameIcon="🎮" engineState={state} />
    );
    expect(screen.getByText('REST REQUIRED')).toBeDefined();
  });

  it('renders blocked dialog with a11y attributes when spoons critically low', () => {
    const state = makeEngineState({ spoons: 0 });
    render(
      <GameOverlay gameId="test-game" gameTitle="Test Game" gameIcon="🎮" engineState={state} />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Spoons critically low. Rest required.');
  });

  it('contains focusable element inside blocked dialog', () => {
    const state = makeEngineState({ spoons: 1 });
    render(
      <GameOverlay gameId="test-game" gameTitle="Test Game" gameIcon="🎮" engineState={state} />
    );
    const dialog = screen.getByRole('dialog');
    const focusable = dialog.querySelector('div');
    expect(focusable).toBeDefined();
  });

  it('traps Tab focus within blocked dialog', () => {
    const state = makeEngineState({ spoons: 1 });
    render(
      <GameOverlay gameId="test-game" gameTitle="Test Game" gameIcon="🎮" engineState={state} />
    );
    const dialog = screen.getByRole('dialog');
    const focusable = dialog.querySelector('div') as HTMLElement;

    focusable.focus();
    expect(document.activeElement).toBe(focusable);

    fireEvent.keyDown(focusable, { key: 'Tab' });
    expect(document.activeElement).toBe(focusable);
  });

  it('does not show blocked dialog when spoons > 1', () => {
    const state = makeEngineState({ spoons: 5 });
    render(
      <GameOverlay gameId="test-game" gameTitle="Test Game" gameIcon="🎮" engineState={state} />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
