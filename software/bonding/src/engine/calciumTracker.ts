// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Calcium Tracker Engine
//
// Tracks calcium logging and maps it to molecule glow intensity.
// ═══════════════════════════════════════════════════════

export interface CalciumLog {
  id: string;
  timestamp: string;
  type: 'dose' | 'skip' | 'late';
  notes?: string;
}

export interface CalciumState {
  logs: CalciumLog[];
  lastDose: string | null;
  streak: number;
  glowIntensity: number;
  nextDueAt: string | null;
  dailyTarget: number;
}

const STORAGE_KEY = 'bonding_calcium';

export function initCalciumState(dailyTarget = 3): CalciumState {
  return {
    logs: [],
    lastDose: null,
    streak: 0,
    glowIntensity: 0.1,
    nextDueAt: null,
    dailyTarget,
  };
}

export function logDose(state: CalciumState, timestamp = new Date().toISOString()): CalciumState {
  const newLog: CalciumLog = { id: String(Date.now()), timestamp, type: 'dose' };
  const logs = [...state.logs, newLog];
  const streak = calculateStreak(logs);
  const nextDueAt = getNextDue({ ...state, lastDose: timestamp });
  const glowIntensity = calculateGlow({ ...state, lastDose: timestamp });
  
  return { ...state, logs, streak, lastDose: timestamp, nextDueAt, glowIntensity };
}

export function logSkip(state: CalciumState, timestamp = new Date().toISOString()): CalciumState {
  const newLog: CalciumLog = { id: String(Date.now()), timestamp, type: 'skip' };
  return { ...state, logs: [...state.logs, newLog] };
}

export function calculateGlow(state: CalciumState): number {
  if (!state.lastDose) return 0.1;
  const hoursSince = (Date.now() - new Date(state.lastDose).getTime()) / 3600000;
  if (hoursSince <= 8) return 1.0;
  if (hoursSince <= 16) return 0.7;
  if (hoursSince <= 24) return 0.4;
  return 0.15;
}

export function getNextDue(state: CalciumState): string | null {
    if (!state.lastDose) return null;
    const intervalHours = 24 / state.dailyTarget;
    const nextDueDate = new Date(new Date(state.lastDose).getTime() + intervalHours * 3600000);
    return nextDueDate.toISOString();
}

export function calculateStreak(logs: CalciumLog[]): number {
    const doseDays = new Set(logs.filter(l => l.type === 'dose').map(l => l.timestamp.split('T')[0]).filter(Boolean as any));
    if (doseDays.size === 0) return 0;

    let streak = 0;
    let today = new Date();
    while (true) {
        const dateStr = today.toISOString().split('T')[0];
        if (dateStr && doseDays.has(dateStr)) {
            streak++;
            today.setDate(today.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

export function getTodayDoseCount(logs: CalciumLog[], now = new Date()): number {
    const todayStr = now.toISOString().split('T')[0];
    return logs.filter(l => l.type === 'dose' && l.timestamp.startsWith(todayStr!)).length;
}

export function getAdherence(logs: CalciumLog[], days: number, dailyTarget: number): number {
    let totalDoses = 0;
    const now = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        totalDoses += getTodayDoseCount(logs, d);
    }
    const expected = days * dailyTarget;
    return Math.round((totalDoses / expected) * 100);
}

export function saveCalciumState(state: CalciumState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { console.error("Failed to save calcium state", e); }
}

export function loadCalciumState(): CalciumState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Failed to load calcium state", e);
    return null;
  }
}
