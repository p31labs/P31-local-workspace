import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EscapeHatch } from '../EscapeHatch';

const mockTheme = {
  name: 'QUANTUM',
  button: 'btn-class',
  hud: 'hud-class',
};

const mockSurfaceNames: Record<string, string> = {
  GREETING: 'Greeting', GRID: 'Grid', VAULT: 'Vault', ARCADE: 'Arcade',
  HEARTH: 'Hearth', THE_BUFFER: 'Buffer', NODE_ZERO: 'Node Zero', ARCHIVE: 'Archive',
};

const defaultProps = {
  theme: mockTheme,
  hudOpen: false,
  currentSurface: 'GREETING',
  spoons: 3,
  surfaceNames: mockSurfaceNames,
  onToggleHud: vi.fn(),
  onSetSpoons: vi.fn(),
  onSetSurface: vi.fn(),
};

describe('EscapeHatch', () => {
  it('should render the HUD toggle button', () => {
    render(<EscapeHatch {...defaultProps} />);
    expect(screen.getByLabelText('Toggle HUD (press H)')).toBeTruthy();
  });

  it('should display the theme name', () => {
    render(<EscapeHatch {...defaultProps} />);
    expect(screen.getByText(/QUANTUM/)).toBeTruthy();
  });

  it('should call onToggleHud when header button is clicked', () => {
    const onToggleHud = vi.fn();
    render(<EscapeHatch {...defaultProps} onToggleHud={onToggleHud} />);
    fireEvent.click(screen.getByLabelText('Toggle HUD (press H)'));
    expect(onToggleHud).toHaveBeenCalledTimes(1);
  });

  it('should show spoon configuration when HUD is open', () => {
    render(<EscapeHatch {...defaultProps} hudOpen={true} />);
    expect(screen.getByText('Spoon Configuration')).toBeTruthy();
  });

  it('should hide HUD panel visually when closed', () => {
    render(<EscapeHatch {...defaultProps} hudOpen={false} />);
    const panel = document.getElementById('hud-panel');
    expect(panel).toBeTruthy();
    // Panel is in DOM but hidden via max-h-0 opacity-0
    expect(panel?.className).toContain('max-h-0');
  });

  it('should show HUD panel visually when open', () => {
    render(<EscapeHatch {...defaultProps} hudOpen={true} />);
    const panel = document.getElementById('hud-panel');
    expect(panel?.className).toContain('max-h-[400px]');
  });

  it('should render all 6 spoon buttons', () => {
    render(<EscapeHatch {...defaultProps} hudOpen={true} />);
    for (let i = 0; i <= 5; i++) {
      expect(screen.getByLabelText(new RegExp(`${i} spoons`))).toBeTruthy();
    }
  });

  it('should call onSetSpoons when a spoon button is clicked', () => {
    const onSetSpoons = vi.fn();
    render(<EscapeHatch {...defaultProps} hudOpen={true} onSetSpoons={onSetSpoons} />);
    fireEvent.click(screen.getByLabelText('5 spoons'));
    expect(onSetSpoons).toHaveBeenCalledWith(5);
  });

  it('should render all 8 surface navigation buttons', () => {
    render(<EscapeHatch {...defaultProps} hudOpen={true} />);
    expect(screen.getByText('GREETING')).toBeTruthy();
    expect(screen.getByText('GRID')).toBeTruthy();
    expect(screen.getByText('VAULT')).toBeTruthy();
    expect(screen.getByText('ARCADE')).toBeTruthy();
    expect(screen.getByText('HEARTH')).toBeTruthy();
    expect(screen.getByText('BUFFER')).toBeTruthy();
    expect(screen.getByText('NODE_ZERO')).toBeTruthy();
    expect(screen.getByText('ARCHIVE')).toBeTruthy();
  });

  it('should call onSetSurface when a surface button is clicked', () => {
    const onSetSurface = vi.fn();
    render(<EscapeHatch {...defaultProps} hudOpen={true} onSetSurface={onSetSurface} />);
    fireEvent.click(screen.getByText('VAULT'));
    expect(onSetSurface).toHaveBeenCalledWith('VAULT');
  });

  it('should render CRISIS_MODE button', () => {
    render(<EscapeHatch {...defaultProps} hudOpen={true} />);
    expect(screen.getByText('CRISIS_MODE')).toBeTruthy();
  });

  it('should call onSetSpoons with 0 when CRISIS_MODE is clicked', () => {
    const onSetSpoons = vi.fn();
    render(<EscapeHatch {...defaultProps} hudOpen={true} onSetSpoons={onSetSpoons} />);
    fireEvent.click(screen.getByText('CRISIS_MODE'));
    expect(onSetSpoons).toHaveBeenCalledWith(0);
  });

  it('should show keyboard shortcut hints', () => {
    render(<EscapeHatch {...defaultProps} hudOpen={true} />);
    expect(screen.getByText(/H: toggle HUD · 0: crisis · Esc: reset/)).toBeTruthy();
  });

  it('should set aria-expanded on toggle button', () => {
    render(<EscapeHatch {...defaultProps} hudOpen={true} />);
    expect(screen.getByLabelText('Toggle HUD (press H)').getAttribute('aria-expanded')).toBe('true');
  });

  it('should highlight current surface button', () => {
    render(<EscapeHatch {...defaultProps} hudOpen={true} currentSurface="VAULT" />);
    const vaultBtn = screen.getByText('VAULT');
    expect(vaultBtn.getAttribute('aria-selected')).toBe('true');
  });

  it('should mark current spoon as checked', () => {
    render(<EscapeHatch {...defaultProps} hudOpen={true} spoons={3} />);
    expect(screen.getByLabelText('3 spoons').getAttribute('aria-checked')).toBe('true');
  });
});
