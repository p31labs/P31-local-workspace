// packages/shared/src/theme/tokens/animation.ts

export const ANIMATION_TOKENS = {
  duration: {
    instant: '0s',
    fast: '0.15s',
    normal: '0.2s',
    slow: '0.4s',
    slowest: '0.6s',
  },
  easing: {
    default: 'ease-out',
    enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
    exit: 'cubic-bezier(0.4, 0, 0.6, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

export type AnimationTokenKey = keyof typeof ANIMATION_TOKENS;

export default ANIMATION_TOKENS;