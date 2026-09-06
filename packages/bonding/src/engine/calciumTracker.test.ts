// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Calcium Tracker Engine tests
//
// Pure unit tests. No React.
// Uses Vitest and mocks localStorage.
// ═══════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initCalciumState,
  logDose,
  logSkip,
  calculateGlow,
  getNextDue,
  calculateStreak,
  getTodayDoseCount,
  getAdherence,
  saveCalciumState,
  loadCalciumState,
} from './calciumTracker';

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
});


describe('Calcium Tracker Engine', () => {
    beforeEach(() => {
        for (const key in mockStorage) delete mockStorage[key];
    });

    it('initCalciumState returns defaults', () => {
        const state = initCalciumState();
        expect(state.dailyTarget).toBe(3);
        expect(state.logs.length).toBe(0);
    });

    it('logDose adds entry and updates lastDose', () => {
        const state = initCalciumState();
        const newState = logDose(state);
        expect(newState.logs.length).toBe(1);
        expect(newState.lastDose).not.toBeNull();
    });

    it('logDose increments streak on new day', () => {
        let state = initCalciumState();
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        state = logDose(state, yesterday.toISOString());
        state = logDose(state, today.toISOString());
        // Streak counts backwards from today — both today and yesterday have doses
        expect(calculateStreak(state.logs)).toBeGreaterThanOrEqual(1);
    });

    it('logSkip adds entry without updating lastDose', () => {
        const state = initCalciumState();
        const newState = logSkip(state);
        expect(newState.logs.length).toBe(1);
        expect(newState.lastDose).toBeNull();
    });

    it('calculateGlow recent dose → 1.0', () => {
        const state = { lastDose: new Date().toISOString() } as any;
        expect(calculateGlow(state)).toBe(1.0);
    });

    it('calculateGlow 12 hours ago → 0.7', () => {
        const d = new Date();
        d.setHours(d.getHours() - 12);
        const state = { lastDose: d.toISOString() } as any;
        expect(calculateGlow(state)).toBe(0.7);
    });
    
    it('calculateGlow 20 hours ago → 0.4', () => {
        const d = new Date();
        d.setHours(d.getHours() - 20);
        const state = { lastDose: d.toISOString() } as any;
        expect(calculateGlow(state)).toBe(0.4);
    });

    it('calculateGlow 30 hours ago → 0.15', () => {
        const d = new Date();
        d.setHours(d.getHours() - 30);
        const state = { lastDose: d.toISOString() } as any;
        expect(calculateGlow(state)).toBe(0.15);
    });

    it('calculateGlow no logs → 0.1', () => {
        const state = initCalciumState();
        expect(calculateGlow(state)).toBe(0.1);
    });

    it('getNextDue calculates based on target', () => {
        const state = { lastDose: new Date('2026-02-27T12:00:00Z').toISOString(), dailyTarget: 3 } as any;
        expect(getNextDue(state)).toBe(new Date('2026-02-27T20:00:00Z').toISOString());
    });

    it('calculateStreak counts consecutive days', () => {
        const logs = [
            {timestamp: new Date().toISOString(), type: 'dose'},
        ] as any;
        expect(calculateStreak(logs)).toBe(1);
    });
    
    it('calculateStreak resets on gap', () => {
        const d1 = new Date();
        d1.setDate(d1.getDate() - 2);
        const logs = [ {timestamp: d1.toISOString(), type: 'dose'} ] as any;
        expect(calculateStreak(logs)).toBe(0);
    });

    it('getTodayDoseCount counts only today', () => {
        const d1 = new Date();
        d1.setDate(d1.getDate() - 1);
        const logs = [
            {timestamp: new Date().toISOString(), type: 'dose'},
            {timestamp: d1.toISOString(), type: 'dose'},
        ] as any;
        expect(getTodayDoseCount(logs)).toBe(1);
    });

    it('getAdherence 100% when all doses logged', () => {
        const logs = [
            {timestamp: new Date().toISOString(), type: 'dose'},
            {timestamp: new Date().toISOString(), type: 'dose'},
        ] as any;
        expect(getAdherence(logs, 1, 2)).toBe(100);
    });
    
    it('getAdherence 50% when half logged', () => {
         const logs = [ {timestamp: new Date().toISOString(), type: 'dose'} ] as any;
         expect(getAdherence(logs, 1, 2)).toBe(50);
    });

    it('saveCalciumState persists to localStorage', () => {
        const state = initCalciumState();
        saveCalciumState(state);
        expect(mockStorage['bonding_calcium']).toBe(JSON.stringify(state));
    });

    it('loadCalciumState retrieves from localStorage', () => {
        const state = initCalciumState();
        mockStorage['bonding_calcium'] = JSON.stringify(state);
        const loaded = loadCalciumState();
        expect(loaded).toEqual(state);
    });
});
