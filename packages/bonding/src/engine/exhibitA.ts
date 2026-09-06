// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Exhibit A: engagement logger
//
// Objective quality evidence that the game IS the
// engagement between parent and child. Every atom placed,
// every bond formed, every molecule completed — timestamped,
// player-tagged, exportable.
//
// Pure functions + event accumulator. localStorage-persisted.
// Clipboard + .txt download for court evidence export.
// ═══════════════════════════════════════════════════════

import {
  getGalleryCount,
  getTotalLove as getGalleryTotalLove,
  getUniqueFormulas,
  getGallery,
} from './gallery';
import { getSavedDiscoveries } from './discovery';

export type EngagementEventA =
  | {
      type: 'atom_placed';
      element: string;
      atomCount: number;
      formula: string;
      displayFormula: string;
      player: string;
      mode: string;
    }
  | {
      type: 'bond_formed';
      fromElement: string;
      toElement: string;
      formula: string;
      displayFormula: string;
      player: string;
    }
  | {
      type: 'molecule_completed';
      formula: string;
      displayFormula: string;
      moleculeName: string;
      atomCount: number;
      love: number;
      player: string;
      mode: string;
    }
  | {
      type: 'achievement_unlocked';
      achievementId: string;
      achievementName: string;
      love: number;
      player: string;
    }
  | {
      type: 'ping_sent';
      from: string;
      to: string;
      reaction: string;
      message?: string;
    }
  | {
      type: 'ping_received';
      from: string;
      to: string;
      reaction: string;
      message?: string;
    }
  | {
      type: 'message_sent';
      from: string;
      to: string;
      message: string;
      reaction: string;
    }
  | {
      type: 'message_received';
      from: string;
      to: string;
      message: string;
      reaction: string;
    }
  | {
      type: 'quest_step_completed';
      questId: string;
      questName: string;
      stepIndex: number;
      stepTarget: string;
      player: string;
    }
  | {
      type: 'quest_completed';
      questId: string;
      questName: string;
      love: number;
      player: string;
    }
  | {
      type: 'session_started';
      mode: string;
      roomCode: string | null;
      players: string[];
    }
  | {
      type: 'session_ended';
      duration: number;
      totalAtoms: number;
      totalLove: number;
      moleculesCompleted: number;
    };

export interface LogEntry {
  id: string;
  timestamp: string;
  event: EngagementEventA;
}

export interface SessionStats {
  totalEvents: number;
  totalAtoms: number;
  totalBonds: number;
  totalMolecules: number;
  totalAchievements: number;
  totalPingsSent: number;
  totalPingsReceived: number;
  totalLove: number;
  totalQuestSteps: number;
  questsCompleted: number;
  players: string[];
  modes: string[];
  firstEvent: string | null;
  lastEvent: string | null;
  durationSeconds: number;
}

const STORAGE_KEY = 'bonding_exhibit_a';
const MAX_ENTRIES = 5000;
const TRIM_BATCH = 1000;

let inMemoryLog: LogEntry[] = [];

function loadFromStorage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        inMemoryLog = parsed;
      }
    }
  } catch {
    inMemoryLog = [];
  }
}

function saveToStorage(): void {
  if (inMemoryLog.length > MAX_ENTRIES) {
    inMemoryLog = inMemoryLog.slice(TRIM_BATCH);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryLog));
  } catch {
    // Storage unavailable — swallow
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Log an engagement event.
 */
export function logEventA(event: EngagementEventA): LogEntry {
  const entry: LogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    event,
  };

  inMemoryLog.push(entry);
  saveToStorage();

  return entry;
}

/**
 * Get all log entries (copy).
 */
export function getLog(): LogEntry[] {
  return [...inMemoryLog];
}

/**
 * Get log entries by event type.
 */
export function getLogByType(type: EngagementEventA['type']): LogEntry[] {
  return inMemoryLog.filter(entry => entry.event.type === type);
}

/**
 * Export as JSON string.
 */
export function exportAsJSON(): string {
  return JSON.stringify(inMemoryLog, null, 2);
}

/**
 * Export as human-readable summary for Exhibit A evidence.
 */
export function exportAsSummary(): string {
  const stats = getSessionStats();
  const lines: string[] = [];

  lines.push('BONDING \u2014 Engagement Log (Exhibit A)');
  lines.push('========================================');

  if (stats.firstEvent && stats.lastEvent) {
    lines.push(`Session: ${formatTime(stats.firstEvent)} to ${formatTime(stats.lastEvent)}`);
    lines.push(`Duration: ${Math.round(stats.durationSeconds / 60)} minutes`);
  }

  if (stats.players.length > 0) {
    lines.push(`Players: ${stats.players.join(', ')}`);
  }

  if (stats.modes.length > 0) {
    lines.push(`Mode: ${stats.modes.join(', ')} ${getModeIcon(stats.modes[0] ?? '')}`);
  }

  lines.push('');
  lines.push('Activity Summary:');
  lines.push(`  Atoms placed: ${stats.totalAtoms}`);
  lines.push(`  Bonds formed: ${stats.totalBonds}`);
  lines.push(`  Molecules completed: ${stats.totalMolecules}`);
  lines.push(`  Achievements unlocked: ${stats.totalAchievements}`);
  lines.push(`  Pings exchanged: ${stats.totalPingsSent + stats.totalPingsReceived}`);
  lines.push(`  Quest steps: ${stats.totalQuestSteps}`);
  lines.push(`  Quests completed: ${stats.questsCompleted}`);
  lines.push(`  LOVE earned: ${stats.totalLove}`);

  // Molecules built
  const moleculeEvents = getLogByType('molecule_completed');
  if (moleculeEvents.length > 0) {
    lines.push('');
    lines.push('Molecules Built:');
    for (const entry of moleculeEvents) {
      const e = entry.event as Extract<EngagementEventA, { type: 'molecule_completed' }>;
      lines.push(`  ${formatTime(entry.timestamp)} \u2014 ${e.player} built ${e.displayFormula} (${e.moleculeName}) +${e.love} LOVE`);
    }
  }

  // Achievements
  const achievementEvents = getLogByType('achievement_unlocked');
  if (achievementEvents.length > 0) {
    lines.push('');
    lines.push('Achievements:');
    for (const entry of achievementEvents) {
      const e = entry.event as Extract<EngagementEventA, { type: 'achievement_unlocked' }>;
      lines.push(`  ${formatTime(entry.timestamp)} \u2014 ${e.player}: ${e.achievementName}`);
    }
  }

  // Quest completions
  const questEvents = getLogByType('quest_completed');
  if (questEvents.length > 0) {
    lines.push('');
    lines.push('Quests Completed:');
    for (const entry of questEvents) {
      const e = entry.event as Extract<EngagementEventA, { type: 'quest_completed' }>;
      lines.push(`  ${formatTime(entry.timestamp)} \u2014 ${e.player}: ${e.questName}`);
    }
  }

  // Gallery stats
  const galleryCount = getGalleryCount();
  if (galleryCount > 0) {
    const galleryLove = getGalleryTotalLove();
    const uniqueFormulas = getUniqueFormulas();
    const discoveries = getSavedDiscoveries();
    const galleryEntries = getGallery();

    lines.push('');
    lines.push('\u2550\u2550\u2550 Molecule Gallery \u2550\u2550\u2550');
    lines.push(`Total molecules built: ${galleryCount}`);
    lines.push(`Total L.O.V.E. earned: ${galleryLove}`);
    lines.push(`Unique formulas: ${uniqueFormulas.length}`);
    lines.push(`Discoveries named: ${discoveries.length}`);

    const recent = galleryEntries.slice(0, 10);
    if (recent.length > 0) {
      lines.push('');
      lines.push('Recent builds:');
      for (const entry of recent) {
        const time = formatTime(entry.completedAt);
        const disc = entry.isDiscovery ? ' \u2728' : '';
        const modeIcon = getModeIcon(entry.mode);
        lines.push(`  ${entry.displayFormula} (${entry.name}${disc}) \u2014 ${entry.mode} ${modeIcon} \u2014 ${time}`);
      }
    }
  }

  // Timeline
  lines.push('');
  lines.push('Full Timeline:');
  for (const entry of inMemoryLog) {
    const time = formatTime(entry.timestamp);
    const e = entry.event;

    switch (e.type) {
      case 'session_started':
        lines.push(`  ${time} \u2014 Session started (${e.mode}, ${e.roomCode ?? 'solo'}, players: ${e.players.join(', ')})`);
        break;
      case 'atom_placed':
        lines.push(`  ${time} \u2014 ${e.player} placed ${e.element}`);
        break;
      case 'bond_formed':
        lines.push(`  ${time} \u2014 Bond: ${e.fromElement}\u2014${e.toElement}`);
        break;
      case 'molecule_completed':
        lines.push(`  ${time} \u2014 ${e.player} completed ${e.displayFormula} (${e.moleculeName}) +${e.love} LOVE`);
        break;
      case 'achievement_unlocked':
        lines.push(`  ${time} \u2014 ${e.player} unlocked "${e.achievementName}" +${e.love} LOVE`);
        break;
      case 'ping_sent':
        lines.push(`  ${time} \u2014 ${e.from} sent ${e.reaction} to ${e.to}${e.message ? ` "${e.message}"` : ''}`);
        break;
      case 'ping_received':
        lines.push(`  ${time} \u2014 ${e.from} sent ${e.reaction} to ${e.to}${e.message ? ` "${e.message}"` : ''}`);
        break;
      case 'message_sent':
        lines.push(`  ${time} \u2014 ${e.from} to ${e.to}: "${e.message}" ${e.reaction}`);
        break;
      case 'message_received':
        lines.push(`  ${time} \u2014 ${e.from} to ${e.to}: "${e.message}" ${e.reaction}`);
        break;
      case 'quest_step_completed':
        lines.push(`  ${time} \u2014 ${e.player} quest step ${e.stepIndex + 1}: ${e.stepTarget}`);
        break;
      case 'quest_completed':
        lines.push(`  ${time} \u2014 ${e.player} completed ${e.questName} quest! +${e.love} LOVE`);
        break;
      case 'session_ended':
        lines.push(`  ${time} \u2014 Session ended (${e.duration}s, ${e.totalAtoms} atoms, ${e.totalLove} LOVE)`);
        break;
    }
  }

  return lines.join('\n');
}

/**
 * Clear log from memory and localStorage.
 */
export function clearLog(): void {
  inMemoryLog = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — swallow
  }
}

/**
 * Get session statistics.
 */
export function getSessionStats(): SessionStats {
  const totalEvents = inMemoryLog.length;
  const totalAtoms = getLogByType('atom_placed').length;
  const totalBonds = getLogByType('bond_formed').length;
  const totalMolecules = getLogByType('molecule_completed').length;
  const totalAchievements = getLogByType('achievement_unlocked').length;
  const totalPingsSent = getLogByType('ping_sent').length + getLogByType('message_sent').length;
  const totalPingsReceived = getLogByType('ping_received').length + getLogByType('message_received').length;
  const totalQuestSteps = getLogByType('quest_step_completed').length;
  const questsCompleted = getLogByType('quest_completed').length;

  const totalLove = inMemoryLog.reduce((sum, entry) => {
    const e = entry.event;
    if (e.type === 'molecule_completed') return sum + e.love;
    if (e.type === 'achievement_unlocked') return sum + e.love;
    return sum;
  }, 0);

  const players = Array.from(new Set(inMemoryLog.map(entry => {
    const e = entry.event;
    if (e.type === 'session_started') return e.players;
    if ('player' in e) return (e as { player: string }).player;
    return '';
  }).flat().filter(Boolean)));

  const modes = Array.from(new Set(inMemoryLog.map(entry => {
    const e = entry.event;
    if (e.type === 'session_started') return e.mode;
    if (e.type === 'atom_placed' || e.type === 'molecule_completed') return e.mode;
    return '';
  }).filter(Boolean)));

  const firstEvent = inMemoryLog.length > 0 ? inMemoryLog[0]!.timestamp : null;
  const lastEvent = inMemoryLog.length > 0 ? inMemoryLog[inMemoryLog.length - 1]!.timestamp : null;
  const durationSeconds = firstEvent && lastEvent
    ? new Date(lastEvent).getTime() - new Date(firstEvent).getTime()
    : 0;

  return {
    totalEvents,
    totalAtoms,
    totalBonds,
    totalMolecules,
    totalAchievements,
    totalPingsSent,
    totalPingsReceived,
    totalLove,
    totalQuestSteps,
    questsCompleted,
    players,
    modes,
    firstEvent,
    lastEvent,
    durationSeconds: Math.round(durationSeconds / 1000),
  };
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getModeIcon(mode: string): string {
  switch (mode) {
    case 'seed': return '\u{1F331}';
    case 'sprout': return '\u{1F33F}';
    case 'sapling': return '\u{1F333}';
    default: return '';
  }
}

// Initialize on module load
loadFromStorage();
