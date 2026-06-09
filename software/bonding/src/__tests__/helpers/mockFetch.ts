// ═══════════════════════════════════════════════════════════════════
// BONDING — Mock Fetch for Tests
// Configurable fetch stub: returns room JSON, 404, or network failure
// Controls consecutiveFailures count for backoff testing
// Used by: gameSync, integration tests
// ═══════════════════════════════════════════════════════════════════

import { vi } from 'vitest';

export interface MockFetchConfig {
  /** Simulate network latency in ms */
  latency?: number;
  /** Return this status for all requests */
  status?: number;
  /** Response body to return (used when status is 200-299) */
  responseBody?: unknown;
  /** Throw an error instead of returning a response */
  throwError?: Error;
  /** Track consecutive failures */
  failureCount?: number;
  /** Auto-increment failure count on each call */
  autoFail?: boolean;
  /** URL-specific responses */
  responses?: Record<string, { status: number; body?: unknown }>;
}

let mockConfig: MockFetchConfig = {
  latency: 0,
  status: 200,
  responseBody: null,
  throwError: undefined,
  failureCount: 0,
  autoFail: false,
  responses: {},
};

let callCount = 0;

// Mock Response class
class MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  body: unknown;
  private _json: unknown;

  constructor(body: unknown, status: number = 200, statusText: string = 'OK') {
    this._json = body;
    this.ok = status >= 200 && status < 300;
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }

  json(): Promise<unknown> {
    return Promise.resolve(this._json);
  }

  text(): Promise<string> {
    return Promise.resolve(JSON.stringify(this._json));
  }
}

// Configure the mock
export function configureMockFetch(config: Partial<MockFetchConfig>): void {
  mockConfig = { ...mockConfig, ...config };
}

// Reset the mock to default state
export function resetMockFetch(): void {
  mockConfig = {
    latency: 0,
    status: 200,
    responseBody: null,
    throwError: undefined,
    failureCount: 0,
    autoFail: false,
    responses: {},
  };
  callCount = 0;
}

// Get current call count
export function getCallCount(): number {
  return callCount;
}

// Reset call count
export function resetCallCount(): void {
  callCount = 0;
}

// Create the mock fetch function
export function createMockFetch(): typeof fetch {
  return vi.fn(async (url: string | URL | Request, _init?: RequestInit): Promise<Response> => {
    callCount++;
    
    const urlStr = url.toString();
    
    // Check for URL-specific response first
    for (const [pattern, response] of Object.entries(mockConfig.responses)) {
      if (urlStr.includes(pattern)) {
        await delay(mockConfig.latency);
        return new MockResponse(response.body, response.status);
      }
    }
    
    // Handle configured throw error
    if (mockConfig.throwError) {
      throw mockConfig.throwError;
    }
    
    // Auto-fail mode: increment failure count and return error
    if (mockConfig.autoFail) {
      mockConfig.failureCount++;
      const status = mockConfig.status !== undefined ? mockConfig.status : 500;
      await delay(mockConfig.latency);
      return new MockResponse({ error: 'Network error' }, status);
    }
    
    // Check failure count threshold for triggering backoff
    if (mockConfig.failureCount > 0 && callCount <= mockConfig.failureCount) {
      const status = mockConfig.status !== undefined ? mockConfig.status : 500;
      await delay(mockConfig.latency);
      return new MockResponse({ error: 'Network error' }, status);
    }
    
    // Normal response
    const status = mockConfig.status !== undefined ? mockConfig.status : 200;
    await delay(mockConfig.latency);
    return new MockResponse(mockConfig.responseBody, status);
  });
}

// Helper to delay
function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();
}

// Predefined response factories
export const mockResponses = {
  // Success response for room creation
  createRoom: (code: string) => ({
    code,
    room: {
      code,
      players: [{
        id: 'p_0',
        name: 'Test Player',
        color: '#00FF88',
        mode: 'seed',
        joinedAt: new Date().toISOString(),
        state: {
          formula: '',
          displayFormula: '',
          atoms: 0,
          love: 0,
          stability: 0,
          completed: false,
          achievements: [],
          updatedAt: new Date().toISOString(),
        },
      }],
      pings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'waiting',
    },
  }),

  // Success response for room join
  joinRoom: (code: string, playerCount: number = 1) => ({
    room: {
      code,
      players: Array.from({ length: playerCount + 1 }, (_, i) => ({
        id: `p_${i}`,
        name: i === 0 ? 'Host' : 'Test Player',
        color: i === 0 ? '#00FF88' : '#00D4FF',
        mode: 'seed',
        joinedAt: new Date().toISOString(),
        state: {
          formula: '',
          displayFormula: '',
          atoms: 0,
          love: 0,
          stability: 0,
          completed: false,
          achievements: [],
          updatedAt: new Date().toISOString(),
        },
      })),
      pings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    },
  }),

  // Room fetch response
  getRoom: (code: string) => ({
    room: {
      code,
      players: [{
        id: 'p_0',
        name: 'Test Player',
        color: '#00FF88',
        mode: 'seed',
        joinedAt: new Date().toISOString(),
        state: {
          formula: 'H₂O',
          displayFormula: 'H₂O',
          atoms: 3,
          love: 10,
          stability: 100,
          completed: false,
          achievements: [],
          updatedAt: new Date().toISOString(),
        },
      }],
      pings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    },
  }),

  // 404 Not Found
  notFound: () => ({
    error: 'Room not found',
  }),

  // Room expired (special case)
  roomExpired: () => {
    const error = new Error('ROOM_EXPIRED');
    error.name = 'ROOM_EXPIRED';
    throw error;
  },
};

// Setup function to use in tests
export function setupMockFetch(): void {
  vi.stubGlobal('fetch', createMockFetch());
}

export function teardownMockFetch(): void {
  resetMockFetch();
  vi.restoreAllMocks();
}