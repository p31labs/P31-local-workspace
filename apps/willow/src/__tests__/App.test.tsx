import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock fetch globally
beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: 'Hi!' }) });
});

describe('Willow App', () => {
  it('renders the main heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Willow/i })).toBeTruthy();
  });

  it('renders the subtitle prompt', () => {
    render(<App />);
    expect(screen.getByText(/Tap to play/i)).toBeTruthy();
  });

  it('renders five activity buttons', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /voice/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /draw/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /magic/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /feelings/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /family/i })).toBeTruthy();
  });

  it('opens VoicePanel when VOICE button clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /voice/i }));
    expect(screen.getByRole('heading', { name: /Voice Message/i })).toBeTruthy();
  });

  it('opens DrawPanel when DRAW button clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /draw/i }));
    expect(screen.getByRole('heading', { name: /Draw a Picture/i })).toBeTruthy();
  });

  it('opens FamilyPanel when FAMILY button clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /family/i }));
    expect(screen.getByRole('heading', { name: /^Family$/i })).toBeTruthy();
  });

  it('closes panel via close button', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /voice/i }));
    expect(screen.getByRole('heading', { name: /Voice Message/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('heading', { name: /Voice Message/i })).toBeNull();
  });

  it('has accessible star companion button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /open chat companion/i })).toBeTruthy();
  });

  it('renders footer with P31 Labs', () => {
    render(<App />);
    expect(screen.getByText(/P31 Labs/i)).toBeTruthy();
  });
});
