import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Companion } from '../components/Companion';

// Mock fetch globally
beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: 'Hi!' }) });
});

describe('Companion', () => {
  it('renders star button initially', () => {
    render(<Companion />);
    expect(screen.getByRole('button', { name: /open chat companion/i })).toBeTruthy();
  });

  it('does not show chat panel initially', () => {
    render(<Companion />);
    expect(screen.queryByText(/Star Buddy/i)).toBeNull();
  });

  it('opens chat panel when star button clicked', () => {
    render(<Companion />);
    fireEvent.click(screen.getByRole('button', { name: /open chat companion/i }));
    expect(screen.getByText(/Star Buddy/i)).toBeTruthy();
  });

  it('shows initial greeting message', () => {
    render(<Companion />);
    fireEvent.click(screen.getByRole('button', { name: /open chat companion/i }));
    expect(screen.getByText(/magical star friend/i)).toBeTruthy();
  });

  it('closes panel when close button clicked', () => {
    render(<Companion />);
    fireEvent.click(screen.getByRole('button', { name: /open chat companion/i }));
    expect(screen.getByText(/Star Buddy/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /close chat/i }));
    expect(screen.queryByText(/Star Buddy/i)).toBeNull();
  });

  it('sends a message when input is typed and send clicked', async () => {
    render(<Companion />);
    fireEvent.click(screen.getByRole('button', { name: /open chat companion/i }));
    const input = screen.getByPlaceholderText(/Say something/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('sends a message on Enter key', async () => {
    render(<Companion />);
    fireEvent.click(screen.getByRole('button', { name: /open chat companion/i }));
    const input = screen.getByPlaceholderText(/Say something/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Test')).toBeTruthy();
  });

  it('star button reappears after closing', () => {
    render(<Companion />);
    fireEvent.click(screen.getByRole('button', { name: /open chat companion/i }));
    fireEvent.click(screen.getByRole('button', { name: /close chat/i }));
    expect(screen.getByRole('button', { name: /open chat companion/i })).toBeTruthy();
  });
});
