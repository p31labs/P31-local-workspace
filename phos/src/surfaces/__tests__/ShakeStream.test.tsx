import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShakeStream } from '../ShakeStream';

const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
vi.mock('../lib/ChaosVault', () => ({
  getChaosVault: vi.fn().mockResolvedValue({ query: mockQuery }),
}));

describe('ShakeStream', () => {
  it('should render search input', () => {
    render(<ShakeStream theme={{ name: 'QUANTUM' }} initialQuery="" />);
    expect(screen.getByPlaceholderText('Search your journal...')).toBeTruthy();
    expect(screen.getByText('SEARCH')).toBeTruthy();
  });

  it('should disable search when query is empty', () => {
    render(<ShakeStream theme={{ name: 'QUANTUM' }} initialQuery="" />);
    const btn = screen.getByText('SEARCH');
    expect(btn.getAttribute('disabled')).not.toBeNull();
  });

  it('should enable search when query is entered', () => {
    render(<ShakeStream theme={{ name: 'QUANTUM' }} initialQuery="" />);
    const input = screen.getByPlaceholderText('Search your journal...');
    fireEvent.change(input, { target: { value: 'test query' } });
    const btn = screen.getByText('SEARCH');
    expect(btn.getAttribute('disabled')).toBeNull();
  });

  it('should not show results container initially', () => {
    render(<ShakeStream theme={{ name: 'QUANTUM' }} initialQuery="" />);
    expect(screen.queryByText(/Enter a search term/)).toBeNull();
  });

  it('should set initial query from props', () => {
    render(<ShakeStream theme={{ name: 'QUANTUM' }} initialQuery="hello" />);
    const input = screen.getByPlaceholderText('Search your journal...') as HTMLInputElement;
    expect(input.value).toBe('hello');
  });

  it('should show STOP button during loading', () => {
    render(<ShakeStream theme={{ name: 'QUANTUM' }} initialQuery="test" />);
    fireEvent.click(screen.getByText('SEARCH'));
    expect(screen.queryByText('STOP')).toBeTruthy();
  });

  it('should render the search surface without crashing', () => {
    render(<ShakeStream theme={{ name: 'QUANTUM' }} initialQuery="" />);
    expect(screen.getByPlaceholderText('Search your journal...')).toBeTruthy();
  });

  it('should handle query input change', () => {
    render(<ShakeStream theme={{ name: 'QUANTUM' }} initialQuery="" />);
    const input = screen.getByPlaceholderText('Search your journal...');
    fireEvent.change(input, { target: { value: 'hello world' } });
    expect((input as HTMLInputElement).value).toBe('hello world');
  });
});
