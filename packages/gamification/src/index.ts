export {
  initAudio, playAtomNote, playBondInterval, playCompletionChord,
  playAchievementUnlock, playLoveChime, playPing, playPingEmoji,
  playQuestStep, playQuestComplete, playModeSelect, playReject,
  playSelectBlip, playWhoosh, playMissingNodeTone,
} from './sound';

export { spawnConfetti } from './confetti';

export {
  goodBond, badBond, place, snap, complete, achievement, ping,
} from './haptic';

export {
  getTierForAge, adaptFunFact, getElementPalette,
  type GrowthRingTier,
} from './growthRings';

export {
  evaluateAchievements, sumLoveFromResults,
  type AchievementContext, type AchievementResult,
} from './achievementEngine';

export {
  speak, greatJob, tryConnecting, youBuilt, newBadge,
  selectElement, placeAtom, bondAtoms, showHelp, celebrate,
  targetMolecule, setMuted, isSupported,
} from './voiceFeedback';

export {
  useEconomyStore, earnLove, initLoveSync, setShadowBridgeUrl, type LoveSource,
} from './economyStore';
