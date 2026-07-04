import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonPulse, SurfaceSkeleton, DemoSkeleton } from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('SkeletonPulse should render with default class', () => {
    const { container } = render(<SkeletonPulse />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('bg-white/5');
  });

  it('SkeletonPulse should accept custom className', () => {
    const { container } = render(<SkeletonPulse className="h-10 w-20" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('h-10');
    expect(el.className).toContain('w-20');
  });

  it('SurfaceSkeleton should render placeholder bars', () => {
    const { container } = render(<SurfaceSkeleton />);
    const bars = container.querySelectorAll('.animate-pulse');
    expect(bars.length).toBeGreaterThan(5);
  });

  it('DemoSkeleton should render demo placeholder', () => {
    const { container } = render(<DemoSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});
