
// ═══════════════════════════════════════════════════════════════════
// BONDING — Test Setup
// ═══════════════════════════════════════════════════════════════════
import { vi } from 'vitest';

// Browser API stubs - guarded for node environment
if (typeof globalThis.window !== 'undefined') {
  Object.defineProperty(globalThis.window, 'innerWidth', { value: 1024 });
  Object.defineProperty(globalThis.window, 'innerHeight', { value: 768 });
  Object.defineProperty(globalThis.window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

vi.mock('idb-keyval', () => ({
  get: vi.fn(() => Promise.resolve(null)),
  set: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve()),
  keys: vi.fn(() => Promise.resolve([])),
  clear: vi.fn(() => Promise.resolve()),
}));

vi.mock('../engine/sound', () => ({
  playAtomNote: vi.fn(), playBondInterval: vi.fn(), playCompletionChord: vi.fn(),
  playWhoosh: vi.fn(), playAchievementUnlock: vi.fn(), playLoveChime: vi.fn(),
  playPing: vi.fn(), playPingEmoji: vi.fn(), playQuestStep: vi.fn(), playQuestComplete: vi.fn(),
  playModeSelect: vi.fn(), playSelectBlip: vi.fn(), playReject: vi.fn(), initAudio: vi.fn(),
  isMuted: vi.fn(() => false), setMuted: vi.fn(),
}));
vi.mock('../engine/haptic', () => ({
  haptic: { snap: vi.fn(), goodBond: vi.fn(), place: vi.fn(), complete: vi.fn(), achievement: vi.fn(), ping: vi.fn() },
}));
vi.mock('../engine/ledger', () => ({ logEvent: vi.fn() }));
vi.mock('../engine/exhibitA', () => ({
  logEventA: vi.fn(), getLog: vi.fn(() => []), getLogByType: vi.fn(() => []),
  exportAsJSON: vi.fn(() => '[]'), exportAsSummary: vi.fn(() => ''), clearLog: vi.fn(),
  getSessionStats: vi.fn(() => ({ totalEvents: 0, totalAtoms: 0, totalBonds: 0, totalMolecules: 0,
    totalAchievements: 0, totalPingsSent: 0, totalPingsReceived: 0, totalLove: 0, totalQuestSteps: 0,
    questsCompleted: 0, players: [], modes: [], firstEvent: null, lastEvent: null, durationSeconds: 0 })),
}));
vi.mock('../engine/achievementEngine', () => ({ evaluateAchievements: vi.fn(() => []) }));
vi.mock('../lib/gameSync', () => ({
  createRoom: vi.fn(() => Promise.resolve({ code: 'TEST01', room: {}, playerId: 'p_0' })),
  joinRoom: vi.fn(() => Promise.resolve({ room: {}, playerId: 'p_1' })),
  leaveRoom: vi.fn(), pushState: vi.fn(() => Promise.resolve()), sendPing: vi.fn(() => Promise.resolve()),
  startPolling: vi.fn(), stopPolling: vi.fn(), getCurrentRoom: vi.fn(() => null), getMyPlayerId: vi.fn(() => null),
  isConnected: vi.fn(() => false), getConnectionStatus: vi.fn(() => 'disconnected'),
  onSyncEvent: vi.fn(() => () => {}), _resetForTest: vi.fn(),
}));
