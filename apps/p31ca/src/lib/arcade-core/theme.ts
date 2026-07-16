export const COLORS = {
  void: '#0A0A0F',
  voidLighter: '#12121A',
  deepVoid: '#050508',
  cloud: '#F5F5F7',
  cloud70: 'rgba(245, 245, 247, 0.7)',
  cloud60: 'rgba(245, 245, 247, 0.6)',
  cloud50: 'rgba(245, 245, 247, 0.5)',
  cloud40: 'rgba(245, 245, 247, 0.4)',
  cloud35: 'rgba(245, 245, 247, 0.35)',
  cloud30: 'rgba(245, 245, 247, 0.3)',
  cloud25: 'rgba(245, 245, 247, 0.25)',
  cloud20: 'rgba(245, 245, 247, 0.2)',
  white15: 'rgba(255, 255, 255, 0.15)',
  white12: 'rgba(255, 255, 255, 0.12)',
  white10: 'rgba(255, 255, 255, 0.1)',
  white8: 'rgba(255, 255, 255, 0.08)',
  white6: 'rgba(255, 255, 255, 0.06)',
  white5: 'rgba(255, 255, 255, 0.05)',
  white4: 'rgba(255, 255, 255, 0.04)',
  white3: 'rgba(255, 255, 255, 0.03)',
  white2: 'rgba(255, 255, 255, 0.02)',
  teal: '#00F0FF',
  tealDim: 'rgba(0, 240, 255, 0.3)',
  gold: '#FBBF24',
  goldDim: 'rgba(251, 191, 36, 0.15)',
  goldBorder: 'rgba(251, 191, 36, 0.25)',
  rust: '#FB7185',
  rustDim: 'rgba(251, 113, 133, 0.12)',
  rustBorder: 'rgba(251, 113, 133, 0.2)',
  purple: '#A78BFA',
  purpleDim: 'rgba(167, 139, 250, 0.15)',
  purpleBorder: 'rgba(167, 139, 250, 0.2)',
  green: '#34D399',
  greenDim: 'rgba(52, 211, 153, 0.15)',
  greenBorder: 'rgba(52, 211, 153, 0.3)',
  ice: '#00F0FF',
  cardRed: '#FB7185',
  fieldGreen: '#34D399',
} as const;

export const SPOON_LEVEL_COLORS: Record<number, string> = {
  0: '#FB7185',
  1: '#FB7185',
  2: '#FBBF24',
  3: '#FBBF24',
  4: '#00F0FF',
  5: '#00F0FF',
  6: '#00F0FF',
  7: '#00F0FF',
  8: '#34D399',
  9: '#34D399',
  10: '#34D399',
  11: '#34D399',
  12: '#34D399',
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
  { id: 'freeze-breaker', title: 'Freeze Breaker', emoji: '🧊', route: '/freeze-breaker/', color: COLORS.ice, desc: 'Executive dysfunction intervention', spoonDifficulty: 1, tags: ['regulation', 'executive-function', 'safe-mode'] as const },
  { id: 'bashball', title: 'Bashball', emoji: '⚾', route: '/arcade/bashball/', color: COLORS.rust, desc: 'Baseball sim with Markov chains (dedicated to Bash)', spoonDifficulty: 4, tags: ['sports', 'markov', 'classic'] as const },
  { id: 'gridiron', title: 'Gridiron', emoji: '🏈', route: '/arcade/gridiron/', color: COLORS.green, desc: 'Strategic football with energy management', spoonDifficulty: 5, tags: ['sports', 'strategy', 'energy'] as const },
  { id: 'cards', title: 'Card Table', emoji: '🃏', route: '/arcade/cards/', color: COLORS.purple, desc: 'Strategic card collection', spoonDifficulty: 4, tags: ['cards', 'game-theory', 'classic'] as const },
  { id: 'strategy', title: 'Strategy Board', emoji: '♟️', route: '/arcade/strategy/', color: COLORS.gold, desc: 'Tactical warfare simulation', spoonDifficulty: 6, tags: ['strategy', 'pathfinding', 'classic'] as const },
  { id: 'liquid', title: 'Liquid Sculptor', emoji: '💧', route: '/arcade/liquid/', color: COLORS.teal, desc: 'Fluid dynamics playground', spoonDifficulty: 3, tags: ['physics', 'creative', 'fluid'] as const },
  { id: 'orbital', title: 'Orbital Drift', emoji: '🪐', route: '/arcade/orbital/', color: COLORS.purple, desc: 'Gravity simulation sandbox', spoonDifficulty: 5, tags: ['physics', 'sandbox', 'n-body'] as const },
  { id: 'poetry', title: 'Magnetic Poetry', emoji: '🧲', route: '/arcade/poetry/', color: COLORS.green, desc: 'Word field interactions', spoonDifficulty: 4, tags: ['creative', 'words', 'sandbox'] as const },
  { id: 'resonance', title: 'Resonance Rings', emoji: '🌊', route: '/arcade/resonance/', color: COLORS.rust, desc: 'Wave harmonic visualization', spoonDifficulty: 3, tags: ['audio', 'physics', 'visualization'] as const },
] as const;

export type ArcadeGame = typeof ARCADE_GAMES[number];
export type ArcadeGameId = ArcadeGame['id'];
