import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeZeroSurface } from '../NodeZeroSurface';

describe('NodeZeroSurface', () => {
  it('should show discovering state initially', () => {
    render(<NodeZeroSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(screen.getByText('DISCOVERING')).toBeTruthy();
    expect(screen.getByText(/Scanning local network/)).toBeTruthy();
  });

  it('should show CONNECTING status badge', () => {
    render(<NodeZeroSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(screen.getByText('CONNECTING')).toBeTruthy();
  });

  it('should show Node Zero Bridge header', () => {
    render(<NodeZeroSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(screen.getByText('Node Zero Bridge')).toBeTruthy();
  });

  it('should show help text in discovering state', () => {
    render(<NodeZeroSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(screen.getByText(/Scanning local network/)).toBeTruthy();
  });

  it('should render without crashing at low spoons', () => {
    render(<NodeZeroSurface theme={{ name: 'SANCTUARY' }} spoons={1} />);
    expect(screen.getByText('DISCOVERING')).toBeTruthy();
  });

  it('should render without crashing at max spoons', () => {
    render(<NodeZeroSurface theme={{ name: 'QUANTUM' }} spoons={5} />);
    expect(screen.getByText('DISCOVERING')).toBeTruthy();
  });

  it('should show discovering emoji/state text', () => {
    render(<NodeZeroSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(screen.getByText(/DISCOVERING/)).toBeTruthy();
  });

  it('should accept theme prop without crashing', () => {
    render(<NodeZeroSurface theme={{ name: 'CRISIS' }} spoons={0} />);
    expect(true).toBe(true);
  });

  it('should render the surface container', () => {
    const { container } = render(<NodeZeroSurface theme={{ name: 'QUANTUM' }} spoons={3} />);
    expect(container.querySelector('.space-y-4')).toBeTruthy();
  });
});
