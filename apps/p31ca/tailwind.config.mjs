import { p31Preset } from '@p31/shared/theme/tailwind-preset';

export default {
  presets: [p31Preset],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        /** Keep hub-specific accent that's not in the canon */
        hubRose: '#E8636F',
        hubNav: '#080810',
      },
    },
  },
};
