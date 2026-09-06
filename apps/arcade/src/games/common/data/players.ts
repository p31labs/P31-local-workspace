import type { PlayerCharacter, TraitId } from '../types/Player.js';
import { TRAIT_DEFINITIONS, statBase } from '../types/Player.js';

interface KidSeed {
  name: string;
  avatar: string;
  age: number;
  bio: string;
  spoon: number;
  traits: TraitId[];
}

const KID_SEEDS: KidSeed[] = [
  { name: 'Ember',    avatar: '🔥', age: 10, spoon: 2, bio: 'A focused pitcher who stays calm when the game is on the line. Prefers structure and routine.',                   traits: ['focused', 'calm'] },
  { name: 'Dash',     avatar: '💨', age: 9,  spoon: 4, bio: 'A speedy infielder who never stops moving. Sees the game as an adventure.',                                      traits: ['energetic', 'quick'] },
  { name: 'Tess',     avatar: '💥', age: 11, spoon: 3, bio: 'A power hitter who loves the big swing. Believes every at-bat is a new story.',                                 traits: ['bold', 'spirited'] },
  { name: 'Rex',      avatar: '🦊', age: 10, spoon: 3, bio: 'A creative bunter who invents trick plays. Thinks three moves ahead.',                                           traits: ['creative', 'clever'] },
  { name: 'Luna',     avatar: '🌙', age: 9,  spoon: 1, bio: 'A resilient catcher who never gives up. Finds strength in quiet moments.',                                       traits: ['resilient', 'steady'] },
  { name: 'Zane',     avatar: '⚡', age: 12, spoon: 5, bio: 'An energetic outfielder who covers every gap. Plays like every game is the last.',                               traits: ['energetic', 'daring'] },
  { name: 'Iris',     avatar: '👁️', age: 11, spoon: 2, bio: 'A strategic base runner who reads pitchers perfectly. Sees patterns others miss.',                               traits: ['strategic', 'perceptive'] },
  { name: 'Finn',     avatar: '⚓', age: 10, spoon: 3, bio: 'A reliable fielder who never makes errors. The steady anchor of any defense.',                                    traits: ['steady', 'supportive'] },
  { name: 'Nova',     avatar: '✨', age: 11, spoon: 3, bio: 'A power pitcher with a high strikeout rate. Channels intensity into precision.',                                 traits: ['intense', 'focused'] },
  { name: 'Eli',      avatar: '⏳', age: 9,  spoon: 1, bio: 'A patient hitter who draws walks. Understands that waiting is a strategy too.',                                 traits: ['patient', 'methodical'] },
  { name: 'Skye',     avatar: '🎨', age: 10, spoon: 4, bio: 'A creative switch-hitter who paints the corners. Expresses through play.',                                       traits: ['creative', 'playful'] },
  { name: 'Kai',      avatar: '🚀', age: 12, spoon: 4, bio: 'A daring baserunner who takes extra bases. Calculates risk like a game theorist.',                              traits: ['daring', 'determined'] },
  { name: 'Jade',     avatar: '🦎', age: 10, spoon: 3, bio: 'An adaptable utility player who can play any position. Thrives in chaos.',                                       traits: ['adaptable', 'quick'] },
  { name: 'Ash',      avatar: '💙', age: 9,  spoon: 2, bio: 'A supportive teammate who lifts everyone up. The heart of the dugout.',                                         traits: ['supportive', 'calm'] },
  { name: 'Raine',    avatar: '🧘', age: 11, spoon: 2, bio: 'A calm presence in the lineup. Uses breathing techniques between pitches.',                                    traits: ['calm', 'perceptive'] },
  { name: 'Jett',     avatar: '💪', age: 12, spoon: 5, bio: 'A determined competitor who plays best when trailing. Fueled by the comeback.',                                 traits: ['determined', 'intense'] },
  { name: 'Sage',     avatar: '📋', age: 10, spoon: 3, bio: 'A methodical pitcher who studies hitter tendencies. Treats preparation as art.',                                  traits: ['methodical', 'strategic'] },
  { name: 'Blaze',    avatar: '🔥', age: 11, spoon: 5, bio: 'An intense slugger who feeds off the crowd. Turns energy into exit velocity.',                                   traits: ['intense', 'bold'] },
  { name: 'River',    avatar: '🎪', age: 9,  spoon: 4, bio: 'A playful infielder who makes defense fun. Keeps the team loose in tense moments.',                               traits: ['playful', 'quick'] },
  { name: 'Quinn',    avatar: '🛡️', age: 10, spoon: 3, bio: 'A resilient closer who locks down the ninth. Uses sensory tools to stay regulated.',                             traits: ['resilient', 'focused'] },
];

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

export function generateKids(seed?: string): PlayerCharacter[] {
  const rng = mulberry32(seed ? hashStr(seed) : Date.now());
  const kids: PlayerCharacter[] = [];

  for (let i = 0; i < KID_SEEDS.length; i++) {
    const s = KID_SEEDS[i];
    const id = `kid-${s.name.toLowerCase()}-${i}`;

    const traits = s.traits.map(id => TRAIT_DEFINITIONS[id]);

    const stats = {
      hitting:  clamp(statBase(s.spoon) + variant(rng(), 10), 10, 99),
      power:    clamp(statBase(s.spoon) + variant(rng(), 10), 10, 99),
      speed:    clamp(statBase(s.spoon) + variant(rng(), 10), 10, 99),
      fielding: clamp(statBase(s.spoon) + variant(rng(), 10), 10, 99),
      pitching: clamp(statBase(s.spoon) + variant(rng(), 10), 10, 99),
    };

    kids.push({
      id,
      name: s.name,
      avatar: s.avatar,
      age: s.age,
      bio: s.bio,
      spoon: s.spoon,
      traits,
      stats,
      footballStats: {
        throwing: clamp(statBase(s.spoon) + variant(rng(), 12), 10, 99),
        catching: clamp(statBase(s.spoon) + variant(rng(), 12), 10, 99),
        speed:     clamp(stats.speed + variant(rng(), 5), 10, 99),
        blocking:  clamp(statBase(s.spoon) + variant(rng(), 12), 10, 99),
        tackling:  clamp(statBase(s.spoon) + variant(rng(), 12), 10, 99),
      },
      tacticalStats: {
        attack:     clamp(statBase(s.spoon) + variant(rng(), 12), 10, 99),
        defense:    clamp(statBase(s.spoon) + variant(rng(), 12), 10, 99),
        movement:   clamp(stats.speed + variant(rng(), 5), 10, 99),
        tactics:    clamp(statBase(s.spoon) + variant(rng(), 12), 10, 99),
        leadership: clamp(statBase(s.spoon) + variant(rng(), 12), 10, 99),
      },
      level: 1,
      xp: 0,
      unlockedAt: new Date().toISOString(),
    });
  }

  return kids;
}

export function getKidById(kids: PlayerCharacter[], id: string): PlayerCharacter | undefined {
  return kids.find(k => k.id === id);
}

function variant(rng: number, range: number): number {
  return (rng - 0.5) * 2 * range;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}
