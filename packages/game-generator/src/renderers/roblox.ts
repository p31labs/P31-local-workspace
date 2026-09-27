import { generateLuau, generateP31Skin, type GameSnapshot } from '@p31ca/game-engine';
import type { GameDefinition } from '../schema';

export function renderRoblox(def: GameDefinition): {
  luau: string;
  partCount: number;
  weldCount: number;
} {
  const snapshot = buildSnapshotFromDefinition(def);
  const skin = generateP31Skin();
  const { luau, partCount, weldCount } = generateLuau(snapshot);
  return {
    luau: skin + '\n\n' + luau,
    partCount,
    weldCount,
  };
}

function buildSnapshotFromDefinition(def: GameDefinition): GameSnapshot {
  const now = new Date().toISOString();

  return {
    version: 1 as const,
    player: {
      nodeId: 'generator',
      displayName: def.game.name,
      tier: 'seedling' as const,
      xp: 0,
      level: 1,
      completedChallenges: [],
      badges: [],
      buildStreak: 0,
      longestStreak: 0,
      lastBuildDate: now.split('T')[0],
      structureIds: ['generated'],
      totalPiecesPlaced: 0,
      dailyQuests: [],
      createdAt: now,
    },
    structures: [
      {
        id: 'generated',
        name: def.game.name,
        pieces: [],
        rigidity: {
          vertices: 4,
          edges: 6,
          maxwellThreshold: 6,
          coherence: 0.8,
          isRigid: true,
          degreesOfFreedom: 0,
          isOverConstrained: false,
        },
        color: def.ui?.theme?.primary || '#4ade80',
      },
    ],
    activeChallenge: null,
    snapshotAt: now,
  };
}
