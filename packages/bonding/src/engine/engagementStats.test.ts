// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Engagement Statistics Engine tests
//
// Pure unit tests. No React. No game imports.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  computeEngagementReport,
  generateCourtSummary,
  formatDuration,
  groupEventsBySession,
  ExhibitAEvent,
} from './engagementStats';
import type { GalleryEntry } from './gallery';

const mockEvent = (timestamp: string, type: string, metadata: object = {}): ExhibitAEvent => ({
  id: Math.random().toString(),
  timestamp,
  event: { type, ...metadata } as any,
});

const mockGalleryEntry = (completedAt: string, name: string, love: number, isDiscovery = false): GalleryEntry => ({
    id: Math.random().toString(),
    formula: name,
    displayFormula: name,
    name,
    atoms: 3,
    love,
    achievements: [],
    mode: 'seed',
    playerName: 'Will',
    completedAt,
    isDiscovery,
});


describe('Engagement Statistics Engine', () => {
    const events: ExhibitAEvent[] = [
        mockEvent('2026-03-10T10:00:00Z', 'atom_placed', { element: 'H' }),
        mockEvent('2026-03-10T10:01:00Z', 'atom_placed', { element: 'O' }),
        mockEvent('2026-03-10T10:02:00Z', 'molecule_completed'),
        mockEvent('2026-03-10T10:33:00Z', 'ping_sent'), // New session
        mockEvent('2026-03-11T11:00:00Z', 'atom_placed', { element: 'C' }),
        mockEvent('2026-03-11T11:01:00Z', 'ping_received'),
        mockEvent('2026-03-11T11:02:00Z', 'message_sent', { message: 'hi' }),
    ];
    const gallery: GalleryEntry[] = [
        mockGalleryEntry('2026-03-10T10:02:00Z', 'H2O', 25),
        mockGalleryEntry('2026-03-11T12:00:00Z', 'CO2', 25, true),
    ];

    it('computeEngagementReport returns all required fields', () => {
        const report = computeEngagementReport(events, gallery);
        expect(Object.keys(report).length).toBe(28);
    });
    
    it('totalSessions counts correctly with 30min gap rule', () => {
        const report = computeEngagementReport(events, gallery);
        expect(report.totalSessions).toBe(3);
    });

    it('totalMoleculesBuilt matches gallery length', () => {
        const report = computeEngagementReport(events, gallery);
        expect(report.totalMoleculesBuilt).toBe(2);
    });

    it('totalLoveEarned sums gallery love values', () => {
        const report = computeEngagementReport(events, gallery);
        expect(report.totalLoveEarned).toBe(50);
    });

    it('totalAtomsPlaced counts atom_placed events', () => {
        const report = computeEngagementReport(events, gallery);
        expect(report.totalAtomsPlaced).toBe(3);
    });
    
    it('totalPingsSent counts ping_sent events', () => {
        const report = computeEngagementReport(events, gallery);
        expect(report.totalPingsSent).toBe(1);
    });
    
    it('totalMessagesExchanged counts events with message metadata', () => {
        const report = computeEngagementReport(events, gallery);
        expect(report.totalMessagesExchanged).toBe(1);
    });
    
    it('averageSessionLength computes correctly', () => {
        const report = computeEngagementReport(events, gallery);
        // 2min + 0min + 2min = 4min total. 4/3 = 1.33 => 1m
        expect(report.averageSessionLength).toBe('1m');
    });

    it('uniqueElements deduplicates across events', () => {
        const report = computeEngagementReport(events, gallery);
        expect(report.uniqueElements).toEqual(['C', 'H', 'O']);
    });

    it('activeDays counts unique dates', () => {
        const report = computeEngagementReport(events, gallery);
        expect(report.activeDays).toBe(2);
    });

    it('dailyBreakdown groups correctly by date', () => {
        const report = computeEngagementReport(events, gallery);
        expect(report.dailyBreakdown.length).toBe(2);
        expect(report.dailyBreakdown[0]?.date).toBe('2026-03-10');
        expect(report.dailyBreakdown[1]?.date).toBe('2026-03-11');
        expect(report.dailyBreakdown[0]?.sessions).toBe(2);
        expect(report.dailyBreakdown[0]?.molecules).toBe(1);
    });

    it('formatDuration handles 0ms', () => {
        expect(formatDuration(0)).toBe('0m');
    });

    it('formatDuration handles minutes only', () => {
        expect(formatDuration(120000)).toBe('2m');
    });

    it('formatDuration handles hours and minutes', () => {
        expect(formatDuration(3720000)).toBe('1h 2m');
    });

    it('groupEventsBySession splits on 30min gap', () => {
        const sessions = groupEventsBySession(events);
        expect(sessions.length).toBe(3);
    });

    it('groupEventsBySession keeps close events together', () => {
        const sessions = groupEventsBySession(events);
        expect(sessions[0]?.length).toBe(3);
        expect(sessions[1]?.length).toBe(1);
        expect(sessions[2]?.length).toBe(3);
    });

    it('generateCourtSummary produces headline string', () => {
        const report = computeEngagementReport(events, gallery);
        const summary = generateCourtSummary(report);
        expect(summary.headline).toBe('3 sessions across 2 days — 2 molecules built together');
    });

    it('generateCourtSummary narrative includes molecule count', () => {
        const report = computeEngagementReport(events, gallery);
        const summary = generateCourtSummary(report);
        expect(summary.narrative).toContain('2 molecules');
    });

    it('generateCourtSummary keyMetrics has 7 entries', () => {
        const report = computeEngagementReport(events, gallery);
        const summary = generateCourtSummary(report);
        expect(summary.keyMetrics.length).toBe(7);
    });
    
    it('empty events returns zeroed report', () => {
        const report = computeEngagementReport([], []);
        expect(report.totalSessions).toBe(0);
        expect(report.totalPlayTime).toBe('0m');
    });
});
