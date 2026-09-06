import type { ZephyrComponent } from '../types';

export const meta: ZephyrComponent = {
  name: 'SpoonDial',
  path: 'zephyr/SpoonDial/SpoonDial.zephyr.html',
  description: 'Range slider for energy/spoon level (0–5) with visual dot indicators',
  tags: ['spoon', 'energy', 'slider', 'range', 'control'],
  category: 'input',
  tokens: [
    '--z-range-track-height',
    '--z-range-track-bg',
    '--z-range-thumb-size',
    '--z-range-thumb-bg',
    '--z-range-fill-bg',
    '--p31-text-secondary',
    '--p31-accent-cyan',
    '--p31-accent-violet',
    '--p31-glass-border',
  ],
  mcp: {
    tool: 'spoonDial',
    type: 'control',
    range: [0, 5],
    target: 'spoon-dial',
  },
};

export default meta;
