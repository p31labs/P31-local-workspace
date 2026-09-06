/**
 * @file cradle.ts — Cosmic Cradle alignment data.
 * July 19–24, 2026: Jupiter, Uranus, Neptune, Pluto all at 10° of their signs.
 * A "Barbault Basket" — never before recorded in human history.
 */

export interface CradlePlanet {
  name: string;
  sign: string;
  degree: string;
  color: string;
  emoji: string;
  role: string;
  description: string;
}

export const CRADLE_PLANETS: CradlePlanet[] = [
  {
    name: 'Jupiter',
    sign: 'Cancer',
    degree: '10°',
    color: '#fbbf24',
    emoji: '🟡',
    role: 'Expansion',
    description: 'Growth, nurturing, idealism. Jupiter in Cancer expands the heart — a wave of protective, generative energy.',
  },
  {
    name: 'Uranus',
    sign: 'Taurus',
    degree: '10°',
    color: '#00f0ff',
    emoji: '🔵',
    role: 'Breakthrough',
    description: 'Revolution, innovation, sudden change. Uranus in Taurus shakes the material world — new financial systems, new bodies.',
  },
  {
    name: 'Neptune',
    sign: 'Pisces',
    degree: '10°',
    color: '#a78bfa',
    emoji: '🟣',
    role: 'Vision',
    description: 'Dissolution, spiritual awakening, artistic inspiration. Neptune in Pisces dissolves old paradigms into a higher vision.',
  },
  {
    name: 'Pluto',
    sign: 'Capricorn',
    degree: '10°',
    color: '#34d399',
    emoji: '🟢',
    role: 'Transformation',
    description: 'Power, rebirth, the collapse of the old. Pluto in Capricorn tears down corrupt structures to make way for the new.',
  },
];

export const CRADLE_TOUR = [
  'The Cosmic Cradle is a rare planetary alignment — four planets at the same degree of their signs, forming a semi‑hexagon in sacred geometry.',
  'Jupiter, Uranus, Neptune, and Pluto occupy 10° of their signs. They form six aspects — an exact mirror of K₄ topology: 4 vertices, 6 edges.',
  'This configuration has never been recorded in human history. The Barbault Basket signals "a change for the better."',
  'The Grand Trine in Earth signs — Moon in Virgo, Uranus in Taurus, Pluto in Capricorn — grounds this energy in the material world.',
  'P31 Labs aligns with this window. The ecosystem launches alongside a cosmic turning point — the civilization of our new mini Great Year at last becomes adult.',
];

export const CRADLE_PEAK = new Date('2026-07-19T00:00:00Z');
export const CRADLE_END = new Date('2026-07-25T00:00:00Z');

export function getCradleCountdown() {
  const now = new Date();
  const diff = CRADLE_PEAK.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes, isActive: now >= CRADLE_PEAK && now < CRADLE_END, isPast: now >= CRADLE_END };
}

export const GRAND_TRINE = {
  name: 'Grand Trine (Earth)',
  planets: ['Moon (Virgo)', 'Uranus (Taurus)', 'Pluto (Capricorn)'],
  description: 'The Moon is the activating force — the Divine reaching out a helping hand. This trine grounds the Cradle in material reality.',
};

export const TALENT_TRINES = [
  { name: 'Jupiter–Uranus–Neptune', description: 'Expansion, breakthrough, and vision in harmonic flow.' },
  { name: 'Uranus–Neptune–Pluto', description: 'Breakthrough dissolving old structures, power transformed.' },
];

export const ASPECTS = [
  'Jupiter opposite Pluto — expansion meets transformation',
  'Jupiter sextile Uranus — growth through innovation',
  'Uranus sextile Neptune — vision through breakthrough',
  'Neptune sextile Pluto — dissolution through power',
  'Jupiter trine Neptune (talent) — expansion through vision',
  'Pluto trine Uranus (talent) — transformation through revolution',
];
