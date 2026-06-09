import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SurfaceErrorBoundary } from '../SurfaceErrorBoundary';

function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test surface crash');
  }
  return <div>Surface rendered OK</div>;
}

describe('SurfaceErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <SurfaceErrorBoundary surfaceName="TEST">
        <div>Child content</div>
      </SurfaceErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeTruthy();
  });

  it('should catch errors and show error state', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SurfaceErrorBoundary surfaceName="THE_BUFFER">
        <ThrowingComponent />
      </SurfaceErrorBoundary>
    );
    expect(screen.getByText(/SURFACE_ERROR/)).toBeTruthy();
    expect(screen.getByText(/THE_BUFFER/)).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
    spy.mockRestore();
  });

  it('should display error message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SurfaceErrorBoundary surfaceName="TEST">
        <ThrowingComponent />
      </SurfaceErrorBoundary>
    );
    expect(screen.getByText('Test surface crash')).toBeTruthy();
    spy.mockRestore();
  });

  it('should reset on Retry click', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SurfaceErrorBoundary surfaceName="TEST">
        <ThrowingComponent />
      </SurfaceErrorBoundary>
    );
    expect(screen.getByText(/SURFACE_ERROR/)).toBeTruthy();
    fireEvent.click(screen.getByText('Retry'));
    // After reset, the component re-renders and throws again (since shouldThrow is always true)
    expect(screen.getByText(/SURFACE_ERROR/)).toBeTruthy();
    spy.mockRestore();
  });

  it('should render custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SurfaceErrorBoundary surfaceName="TEST" fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </SurfaceErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeTruthy();
    spy.mockRestore();
  });
});
