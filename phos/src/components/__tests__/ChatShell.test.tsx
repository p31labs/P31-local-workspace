import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock scrollTo for jsdom
Element.prototype.scrollTo = vi.fn() as any;

let mockSpoons = 3;
let mockGrayRock = false;
let mockSurface = 'GREETING';
const mockSetSpoons = vi.fn((v: number) => { mockSpoons = Math.max(0, Math.min(5, v)); mockGrayRock = v === 0; });
const mockSetSurface = vi.fn((s: string) => { mockSurface = s; });

vi.mock('../AtmosphereProvider', () => ({
  useAtmosphere: () => ({
    get spoons() { return mockSpoons; },
    get grayRock() { return mockGrayRock; },
    get currentSurface() { return mockSurface; },
    setSpoons: mockSetSpoons,
    setGrayRock: vi.fn(),
    setSurface: mockSetSurface,
  }),
  AtmosphereProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../EscapeHatch', () => ({
  EscapeHatch: ({ hudOpen }: { hudOpen: boolean }) =>
    hudOpen ? <div data-testid="escape-hatch" /> : null,
}));

vi.mock('../SurfaceContent', () => ({
  SurfaceContent: () => <div data-testid="surface-content" />,
}));

vi.mock('../SurfaceErrorBoundary', () => ({
  SurfaceErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../TheGuardian', () => ({
  default: () => <div data-testid="the-guardian">GRAY_ROCK active</div>,
}));

vi.mock('../../lib/ChaosVault', () => ({
  getChaosVault: vi.fn().mockResolvedValue({
    query: vi.fn().mockResolvedValue({ rows: [] }),
  }),
  ingestToChaosVault: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/EventLogger', () => ({
  addLog: vi.fn(),
}));

vi.mock('../../lib/IntentEngine', () => ({
  routeIntent: vi.fn().mockReturnValue('GREETING'),
  parseRagQuery: vi.fn().mockReturnValue(null),
}));

let ChatShell: React.ComponentType;

describe('ChatShell', () => {
  beforeAll(async () => {
    const mod = await import('../ChatShell');
    ChatShell = mod.default;
  });

  beforeEach(() => {
    mockSpoons = 3;
    mockGrayRock = false;
    mockSurface = 'GREETING';
    mockSetSpoons.mockClear();
    mockSetSurface.mockClear();
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ChatShell />);
    expect(container).toBeTruthy();
  });

  it('renders the top bar with menu toggle', () => {
    render(<ChatShell />);
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
  });

  it('renders the chat input', () => {
    render(<ChatShell />);
    expect(screen.getByLabelText('Chat input')).toBeInTheDocument();
  });

  it('renders the BreathingCloud canvas', () => {
    const { container } = render(<ChatShell />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders empty state message when no messages', () => {
    render(<ChatShell />);
    expect(screen.getByText(/state your intent/i)).toBeInTheDocument();
  });

  it('renders submit button disabled when input is empty', () => {
    render(<ChatShell />);
    const submitBtn = screen.getByLabelText('Send message');
    expect(submitBtn).toBeDisabled();
  });

  it('renders submit button enabled when input has text', async () => {
    render(<ChatShell />);
    const input = screen.getByLabelText('Chat input');
    await userEvent.type(input, 'hello');
    const submitBtn = screen.getByLabelText('Send message');
    expect(submitBtn).not.toBeDisabled();
  });

  it('adds a user message on submit', async () => {
    render(<ChatShell />);
    const input = screen.getByLabelText('Chat input');
    const submitBtn = screen.getByLabelText('Send message');

    await userEvent.type(input, 'hello');
    await userEvent.click(submitBtn);

    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('clears input after submit', async () => {
    render(<ChatShell />);
    const input = screen.getByLabelText('Chat input') as HTMLInputElement;

    await userEvent.type(input, 'hello');
    await userEvent.click(screen.getByLabelText('Send message'));

    expect(input.value).toBe('');
  });

  it('routes intent on submit', async () => {
    const { routeIntent } = await import('../../lib/IntentEngine');
    render(<ChatShell />);
    const input = screen.getByLabelText('Chat input');

    await userEvent.type(input, 'hello');
    await userEvent.click(screen.getByLabelText('Send message'));

    expect(routeIntent).toHaveBeenCalledWith('hello', 3);
  });

  it('renders voice input button', () => {
    render(<ChatShell />);
    expect(screen.getByLabelText('Voice input')).toBeInTheDocument();
  });

  it('renders spoon count in status bar', () => {
    render(<ChatShell />);
    expect(screen.getByText(/3\/5/)).toBeInTheDocument();
  });

  it('shows TheGuardian when spoons are 0', () => {
    mockSpoons = 0;
    mockGrayRock = true;
    render(<ChatShell />);
    expect(screen.getByTestId('the-guardian')).toBeInTheDocument();
  });

  it('toggles HUD when menu button clicked', async () => {
    render(<ChatShell />);
    expect(screen.queryByTestId('escape-hatch')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Toggle menu'));
    expect(screen.getByTestId('escape-hatch')).toBeInTheDocument();
  });

  it('sets spoons to 0 when 0 key is pressed', () => {
    render(<ChatShell />);
    act(() => { fireEvent.keyDown(window, { key: '0' }); });
    expect(mockSetSpoons).toHaveBeenCalledWith(0);
  });

  it('closes HUD on Escape', async () => {
    render(<ChatShell />);
    await userEvent.click(screen.getByLabelText('Toggle menu'));
    expect(screen.getByTestId('escape-hatch')).toBeInTheDocument();

    act(() => { fireEvent.keyDown(window, { key: 'Escape' }); });
    expect(screen.queryByTestId('escape-hatch')).not.toBeInTheDocument();
  });

  it('processes /ask queries through parseRagQuery', async () => {
    const { parseRagQuery } = await import('../../lib/IntentEngine');
    (parseRagQuery as ReturnType<typeof vi.fn>).mockReturnValue('test query');

    render(<ChatShell />);
    const input = screen.getByLabelText('Chat input');
    await userEvent.type(input, '/ask test query');
    await userEvent.click(screen.getByLabelText('Send message'));

    expect(parseRagQuery).toHaveBeenCalledWith('/ask test query');
  });
});
