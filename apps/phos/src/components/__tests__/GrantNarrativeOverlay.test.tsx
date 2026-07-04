import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GrantNarrativeOverlay } from '../GrantNarrativeOverlay';

describe('GrantNarrativeOverlay', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render the overlay', () => {
    render(<GrantNarrativeOverlay />);
    expect(screen.getByText('PHOS-Sovereign')).toBeTruthy();
  });

  it('should show subtitle', () => {
    render(<GrantNarrativeOverlay />);
    expect(screen.getByText(/Cognitive Prosthetic Platform/i)).toBeTruthy();
  });

  it('should show Begin Demo Tour button', () => {
    render(<GrantNarrativeOverlay />);
    expect(screen.getByText('Begin Demo Tour')).toBeTruthy();
  });

  it('should show Skip button', () => {
    render(<GrantNarrativeOverlay />);
    expect(screen.getByText('Skip')).toBeTruthy();
  });

  it('should render close button', () => {
    render(<GrantNarrativeOverlay />);
    expect(screen.getByLabelText('Close overlay')).toBeTruthy();
  });

  it('should display feature list', () => {
    render(<GrantNarrativeOverlay />);
    expect(screen.getByText(/Spoon-First Architecture/i)).toBeTruthy();
    expect(screen.getByText(/Objective Quality Evidence/i)).toBeTruthy();
    expect(screen.getByText(/Four-Node Bridge/i)).toBeTruthy();
  });

  it('should dismiss on Skip button click', () => {
    render(<GrantNarrativeOverlay />);
    fireEvent.click(screen.getByText('Skip'));
    expect(screen.queryByText('PHOS-Sovereign')).toBeNull();
  });

  it('should dismiss on close button click', () => {
    render(<GrantNarrativeOverlay />);
    fireEvent.click(screen.getByLabelText('Close overlay'));
    expect(screen.queryByText('PHOS-Sovereign')).toBeNull();
  });

  it('should dismiss and return null after Begin Demo Tour', () => {
    const { container } = render(<GrantNarrativeOverlay />);
    fireEvent.click(screen.getByText('Begin Demo Tour'));
    expect(screen.queryByText('PHOS-Sovereign')).toBeNull();
    expect(container.innerHTML).toBe('');
  });

  it('should persist dismissal in localStorage', () => {
    render(<GrantNarrativeOverlay />);
    fireEvent.click(screen.getByText('Skip'));
    expect(localStorage.getItem('phos_demo_dismissed')).toBe('true');
  });

  it('should not render overlay if previously dismissed', () => {
    localStorage.setItem('phos_demo_dismissed', 'true');
    const { container } = render(<GrantNarrativeOverlay />);
    expect(screen.queryByText('PHOS-Sovereign')).toBeNull();
    expect(container.querySelector('.fixed.inset-0')).toBeNull();
  });
});
