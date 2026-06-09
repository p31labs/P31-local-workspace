import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChaosIngest } from '../ChaosIngest';

vi.mock('../hooks/useEmbeddingWorker', () => ({
  useEmbeddingWorker: () => ({
    embed: vi.fn().mockResolvedValue({ embedding: new Array(768).fill(0.001) }),
  }),
}));

vi.mock('../lib/ChaosVault', () => ({
  getChaosVault: vi.fn().mockResolvedValue({
    query: vi.fn().mockResolvedValue({ rows: [] }),
  }),
}));

vi.mock('../lib/KarmaEngine', () => ({
  mintCredits: vi.fn(),
}));

const mockTheme = {
  name: 'QUANTUM',
  input: 'input-class',
  button: 'button-class',
};

describe('ChaosIngest', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render title and textarea', () => {
    render(<ChaosIngest theme={mockTheme} />);
    expect(screen.getByText('Somatic Buffer Engine')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ENTER_JOURNAL_ENTRY/)).toBeInTheDocument();
  });

  it('should show sanctuary placeholder in SANCTUARY mode', () => {
    render(<ChaosIngest theme={{ ...mockTheme, name: 'SANCTUARY' }} />);
    expect(screen.getByPlaceholderText(/Write anything here/)).toBeInTheDocument();
  });

  it('should show Isolated Origin badge', () => {
    render(<ChaosIngest theme={mockTheme} />);
    expect(screen.getByText('Isolated Origin')).toBeInTheDocument();
  });

  it('should show READY status initially', () => {
    render(<ChaosIngest theme={mockTheme} />);
    expect(screen.getByText('READY // WAITING FOR SENSOR DATA')).toBeInTheDocument();
  });

  it('should render the commit button', () => {
    render(<ChaosIngest theme={mockTheme} />);
    expect(screen.getByText('COMMIT_TO_VAULT')).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    const { container } = render(<ChaosIngest theme={mockTheme} />);
    expect(container.querySelector('textarea')).toBeTruthy();
  });

  it('should accept theme prop', () => {
    render(<ChaosIngest theme={{ ...mockTheme, name: 'SANCTUARY' }} />);
    expect(screen.getByText('Somatic Buffer Engine')).toBeInTheDocument();
  });
});
