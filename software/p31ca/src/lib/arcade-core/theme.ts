export const COLORS = {
  void: '#0f1115',
  voidLighter: '#161920',
  cloud: '#e8e6e3',
  cloud70: 'rgba(232, 230, 227, 0.7)',
  cloud40: 'rgba(232, 230, 227, 0.4)',
  white8: 'rgba(255, 255, 255, 0.08)',
  white5: 'rgba(255, 255, 255, 0.05)',
  white3: 'rgba(255, 255, 255, 0.03)',
  teal: '#4db8a8',
  tealDim: 'rgba(77, 184, 168, 0.3)',
  gold: '#cda852',
  rust: '#cc6247',
  purple: '#8b7cc9',
  green: '#3ba372',
  greenDim: 'rgba(59, 163, 114, 0.15)',
  greenBorder: 'rgba(59, 163, 114, 0.3)',
} as const;

export const SPOON_LEVEL_COLORS: Record<number, string> = {
  0: '#cc6247',
  1: '#cc6247',
  2: '#cda852',
  3: '#cda852',
  4: '#4db8a8',
  5: '#4db8a8',
  6: '#4db8a8',
  7: '#4db8a8',
  8: '#3ba372',
  9: '#3ba372',
  10: '#3ba372',
  11: '#3ba372',
  12: '#3ba372',
};

export const FONTS = {
  pixel: "'Press Start 2P', cursive",
  mono: "'JetBrains Mono', monospace",
  sans: "system-ui, -apple-system, sans-serif",
} as const;

export const SPACING = {
  header: 48,
  safeArea: 'env(safe-area-inset-top, 0px)',
} as const;

export const ARCADE_GAMES = [
  { id: 'hub', title: 'Arcade Hub', emoji: '🏛️', route: '/arcade/', color: COLORS.teal, desc: 'All games', spoonDifficulty: 3, tags: ['hub'] as const },
  { id: 'cybernetic-bonsai', title: 'Cybernetic Bonsai', emoji: '🌳', route: '/cybernetic-bonsai/', color: COLORS.teal, desc: 'Digital garden cultivation with PID mechanics', spoonDifficulty: 2, tags: ['relaxation', 'pid', 'growth'] as const },
  { id: 'abyssal-node', title: 'Abyssal Node', emoji: '🌊', route: '/abyssal-node/', color: COLORS.rust, desc: 'Gray-Scott reaction-diffusion', spoonDifficulty: 2, tags: ['ambient', 'reaction-diffusion', 'sensory'] as const },
  { id: 'quantum-lattice', title: 'Quantum Lattice', emoji: '⚛️', route: '/quantum-lattice/', color: COLORS.purple, desc: 'Posner molecule decoherence', spoonDifficulty: 3, tags: ['quantum', 'decoherence', 'focus'] as const },
  { id: 'freeze-breaker', title: 'Freeze Breaker', emoji: '🧊', route: '/freeze-breaker/', color: '#7ec8e3', desc: 'Executive dysfunction intervention', spoonDifficulty: 1, tags: ['regulation', 'executive-function', 'safe-mode'] as const },
  { id: 'smallball', title: 'Smallball', emoji: '⚾', route: '/arcade/smallball/', color: COLORS.rust, desc: '2.5D baseball with Markov chains', spoonDifficulty: 4, tags: ['sports', 'markov', 'classic'] as const },
  { id: 'gridiron', title: 'Gridiron', emoji: '🏈', route: '/arcade/gridiron/', color: COLORS.green, desc: 'Strategic football with energy management', spoonDifficulty: 5, tags: ['sports', 'strategy', 'energy'] as const },
  { id: 'cards', title: 'Card Table', emoji: '🃏', route: '/arcade/cards/', color: COLORS.purple, desc: 'Strategic card collection', spoonDifficulty: 4, tags: ['cards', 'game-theory', 'classic'] as const },
  { id: 'strategy', title: 'Strategy Board', emoji: '♟️', route: '/arcade/strategy/', color: COLORS.gold, desc: 'Tactical warfare simulation', spoonDifficulty: 6, tags: ['strategy', 'pathfinding', 'classic'] as const },
  { id: 'liquid', title: 'Liquid Sculptor', emoji: '💧', route: '/arcade/liquid/', color: COLORS.teal, desc: 'Fluid dynamics playground', spoonDifficulty: 3, tags: ['physics', 'creative', 'fluid'] as const },
] as const;

export type ArcadeGame = typeof ARCADE_GAMES[number];
export type ArcadeGameId = ArcadeGame['id'];
