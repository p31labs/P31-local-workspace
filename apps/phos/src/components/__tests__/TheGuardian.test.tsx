import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TheGuardian from '../TheGuardian';

describe('TheGuardian', () => {
  it('should render crisis screen', () => {
    render(<TheGuardian />);
    expect(screen.getByText('System suspended.')).toBeTruthy();
    expect(screen.getByText('GRAY_ROCK active. All surfaces isolated.')).toBeTruthy();
    expect(screen.getByText('Return when calmer.')).toBeTruthy();
  });

  it('should have black background and gray text', () => {
    const { container } = render(<TheGuardian />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('bg-black');
    expect(wrapper.className).toContain('text-gray-500');
  });

  it('should be centered', () => {
    const { container } = render(<TheGuardian />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('items-center');
    expect(wrapper.className).toContain('justify-center');
  });
});
