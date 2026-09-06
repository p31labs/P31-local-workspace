export type { GameStore } from './types/GameStore.js';
export { LocalStorageGameStore, store } from './store/LocalStorageGameStore.js';

export type { TraitId, Trait, BaseballStats, FootballStats, TacticalStats, GameStats, PlayerCharacter } from './types/Player.js';
export { TRAIT_DEFINITIONS, statBase, xpToLevel, xpForLevel } from './types/Player.js';

export type { Team, AITeam, BaseballPosition, FootballPosition, BaseballLineupSlot, FootballLineupSlot } from './types/Team.js';
export { BASEBALL_POSITIONS, FOOTBALL_POSITIONS, TEAM_NAMES, TEAM_COLORS } from './types/Team.js';

export { generateKids, getKidById } from './data/players.js';

export type { TrainingGame, TrainingSession } from './engine/training.js';
export { runTraining, remainingTrainingSessions, allocateTrainingPoint } from './engine/training.js';

export type { Season, GameSchedule, GameResult, Standing, PlayoffMatchup } from './engine/season.js';
export { createSeason, getWeekGames, recordResult, resolvePlayoffMatchup, simAIGame, getTeamName } from './engine/season.js';

export type { PitchOutcome, AtBatResult, InningResult, SimulatedGame, FootballPlayResult, FootballDriveResult, SimulatedFootballGame } from './engine/simulation.js';
export { simulateAtBat, simulateBashballInning, simulateBashballGame, simulateFootballGame } from './engine/simulation.js';

export { mintLOVE, LOVE_REWARDS } from './love.js';

export { ParticleSystem } from './particles.js';
export type { Particle } from './particles.js';

export { playNote, playChord, playPad, playRiser, P31_F } from './sound.js';

export { fadeOut, fadeIn, animateValue } from './transitions.js';
