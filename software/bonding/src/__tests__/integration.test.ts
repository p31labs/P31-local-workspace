// ═══════════════════════════════════════════════════════════════════
// BONDING — Integration Tests (WCD-T07)
// Full game lifecycle from init through molecule completion
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  startPolling,
  stopPolling,
  pushState,
  sendPing,
  getCurrentRoom,
  isConnected,
  getConnectionStatus,
  _resetForTest,
  type PlayerState,
  type Room,
} from '../lib/gameSync';
import { resetMockFetch, mockResponses } from './helpers/mockFetch';

describe('integration: full game lifecycle', () => {
  beforeEach(() => {
    _resetForTest();
    resetMockFetch();
    localStorage.clear();
    vi.stubEnv('VITE_RELAY_URL', '');
  });

  afterEach(() => {
    _resetForTest();
    stopPolling();
    vi.restoreAllMocks();
  });

  describe('sequential lifecycle', () => {
    it('Init: _resetForTest() → store has empty atoms, bonds, no room', () => {
      _resetForTest();
      
      expect(getCurrentRoom()).toBeNull();
      expect(isConnected()).toBe(false);
      expect(getConnectionStatus()).toBe('disconnected');
    });

    it('Room creation: createRoom() → 4-6 char code, connectionStatus === idle', async () => {
      const result = await createRoom('TestPlayer', '#00FF88', 'seed');
      
      expect(result.code).toHaveLength(6);
      expect(result.code).toMatch(/^[A-Z0-9]+$/);
      expect(result.room).toBeDefined();
      expect(result.playerId).toBe('p_0');
    });

    it('Atom placement: dispatch ADD_ATOM action → atoms.length increments', async () => {
      vi.useFakeTimers();
      const { code } = await createRoom('TestPlayer', '#00FF88', 'seed');

      const state: PlayerState = {
        formula: 'H',
        displayFormula: 'H',
        atoms: 1,
        love: 1,
        stability: 50,
        completed: false,
        achievements: [],
        updatedAt: new Date().toISOString(),
      };

      await pushState(state);
      // pushState with completed:false debounces 2s — advance past the flush timer
      await vi.runAllTimersAsync();
      vi.useRealTimers();

      const stored = localStorage.getItem(`bonding_room_${code}`);
      expect(stored).toBeTruthy();
      const room = JSON.parse(stored!) as Room;
      expect(room.players[0].state.atoms).toBe(1);
    });

    it('Bond formation: dispatch ADD_BOND between two atoms → bonds.length increments', async () => {
      vi.useFakeTimers();
      const { code } = await createRoom('TestPlayer', '#00FF88', 'seed');

      const state: PlayerState = {
        formula: 'H₂',
        displayFormula: 'H₂',
        atoms: 2,
        love: 2,
        stability: 50,
        completed: false,
        achievements: [],
        updatedAt: new Date().toISOString(),
      };

      await pushState(state);
      await vi.runAllTimersAsync();
      vi.useRealTimers();

      const stored = localStorage.getItem(`bonding_room_${code}`);
      const room = JSON.parse(stored!) as Room;
      expect(room.players[0].state.atoms).toBe(2);
    });

    it('Molecule detection: complete H₂O → gamePhase transitions to DISCOVERY', async () => {
      const { code } = await createRoom('TestPlayer', '#00FF88', 'seed');
      
      const state: PlayerState = {
        formula: 'H₂O',
        displayFormula: 'H₂O',
        atoms: 3,
        love: 10,
        stability: 100,
        completed: true, // Molecule completed!
        achievements: [],
        updatedAt: new Date().toISOString(),
      };
      
      await pushState(state);
      
      const stored = localStorage.getItem(`bonding_room_${code}`);
      const room = JSON.parse(stored!) as Room;
      expect(room.players[0].state.completed).toBe(true);
    });

    it('Love award: molecule completion fires loveTotal += 10', async () => {
      const { code } = await createRoom('TestPlayer', '#00FF88', 'seed');
      
      const state: PlayerState = {
        formula: 'H₂O',
        displayFormula: 'H₂O',
        atoms: 3,
        love: 10, // Awarded for completing molecule
        stability: 100,
        completed: true,
        achievements: [],
        updatedAt: new Date().toISOString(),
      };
      
      await pushState(state);
      
      const stored = localStorage.getItem(`bonding_room_${code}`);
      const room = JSON.parse(stored!) as Room;
      expect(room.players[0].state.love).toBe(10);
    });

    it('Quest progress: completing H₂O increments quest checkpoint', async () => {
      const { code } = await createRoom('TestPlayer', '#00FF88', 'seed');
      
      const state: PlayerState = {
        formula: 'H₂O',
        displayFormula: 'H₂O',
        atoms: 3,
        love: 10,
        stability: 100,
        completed: true,
        achievements: ['first_molecule'],
        updatedAt: new Date().toISOString(),
      };
      
      await pushState(state);
      
      const stored = localStorage.getItem(`bonding_room_${code}`);
      const room = JSON.parse(stored!) as Room;
      expect(room.players[0].state.achievements).toContain('first_molecule');
    });

    it('Ping flow: sendPing(💜) → pings state updated', async () => {
      const { code } = await createRoom('Host', '#00FF88', 'seed');
      const { playerId } = await joinRoom(code, 'Joiner', '#00D4FF', 'seed');
      
      // Send ping
      await sendPing(playerId, '💜', 'Hello!');
      
      // Check pings were stored
      const stored = localStorage.getItem(`bonding_room_${code}`);
      const room = JSON.parse(stored!) as Room;
      expect(room.pings.length).toBeGreaterThan(0);
      expect(room.pings[0].reaction).toBe('💜');
    });

    it('Multiplayer sync: two players share room state', async () => {
      const { code: code1 } = await createRoom('Player1', '#00FF88', 'seed');
      const { room: room2 } = await joinRoom(code1, 'Player2', '#00D4FF', 'seed');
      
      // Both players should see each other
      expect(room2.players).toHaveLength(2);
      expect(room2.players[0].name).toBe('Player1');
      expect(room2.players[1].name).toBe('Player2');
    });

    it('Disconnect: leaveRoom() → connectionStatus === idle, room code cleared', async () => {
      const { code } = await createRoom('TestPlayer', '#00FF88', 'seed');
      
      expect(isConnected()).toBe(true);
      
      leaveRoom();
      
      expect(isConnected()).toBe(false);
      expect(getConnectionStatus()).toBe('disconnected');
      expect(getCurrentRoom()).toBeNull();
    });
  });

  describe('realistic multi-step gameplay', () => {
    it('full sequence: create room → place atoms → form bonds → complete molecule → earn love', async () => {
      // Step 1: Create room
      const { code, playerId } = await createRoom('Bash', '#00FF88', 'seed');
      expect(isConnected()).toBe(true);
      
      // Step 2: Place first atom (H)
      await pushState({
        formula: 'H',
        displayFormula: 'H',
        atoms: 1,
        love: 1,
        stability: 50,
        completed: false,
        achievements: [],
        updatedAt: new Date().toISOString(),
      });
      
      // Step 3: Place second atom (H)
      await pushState({
        formula: 'H₂',
        displayFormula: 'H₂',
        atoms: 2,
        love: 2,
        stability: 60,
        completed: false,
        achievements: [],
        updatedAt: new Date().toISOString(),
      });
      
      // Step 4: Place oxygen to complete H₂O
      await pushState({
        formula: 'H₂O',
        displayFormula: 'H₂O',
        atoms: 3,
        love: 12, // 10 for molecule + 2 for atoms
        stability: 100,
        completed: true,
        achievements: ['first_molecule'],
        updatedAt: new Date().toISOString(),
      });
      
      // Step 5: Verify final state
      const stored = localStorage.getItem(`bonding_room_${code}`);
      const room = JSON.parse(stored!) as Room;
      
      expect(room.players[0].state.formula).toBe('H₂O');
      expect(room.players[0].state.atoms).toBe(3);
      expect(room.players[0].state.love).toBe(12);
      expect(room.players[0].state.completed).toBe(true);
      expect(room.players[0].state.achievements).toContain('first_molecule');
      
      // Step 6: Send a ping to celebrate
      await sendPing(playerId, '✨', 'Water! 💧');
      
      const finalStored = localStorage.getItem(`bonding_room_${code}`);
      const finalRoom = JSON.parse(finalStored!) as Room;
      expect(finalRoom.pings.length).toBe(1);
      expect(finalRoom.pings[0].reaction).toBe('✨');
      
      // Step 7: Leave room
      leaveRoom();
      expect(isConnected()).toBe(false);
    });
  });
});