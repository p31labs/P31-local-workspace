// packages/shared/src/theme/tokens/axis.ts

export const AXIS_COLORS = {
  // Four-axis system from cognitive passport
  body: '#FF9944',      // Health, medication, cognition
  mesh: '#44AAFF',      // People, relationships, community
  forge: '#44FFAA',     // Products, code, infrastructure
  shield: '#FF4466',    // Legal, benefits, protection
  
  // Axis variants
  bodyPrimary: '#FF9944',
  bodySecondary: '#FFB880',
  meshPrimary: '#44AAFF',
  meshSecondary: '#80CCFF',
  forgePrimary: '#44FFAA',
  forgeSecondary: '#80FFCC',
  shieldPrimary: '#FF4466',
  shieldSecondary: '#FF8099',
} as const;

export type AxisColorKey = keyof typeof AXIS_COLORS;