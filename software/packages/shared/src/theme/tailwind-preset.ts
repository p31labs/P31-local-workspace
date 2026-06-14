/**
 * Tailwind CSS preset (v4 compatible) derived from p31-universal-canon.json.
 *
 * Usage in any app's tailwind.config.mjs:
 *   import { p31Preset } from '@p31/shared/theme/tailwind-preset';
 *   export default { presets: [p31Preset], content: ['./src/** / *.{astro,tsx,ts}'] };
 *
 * For Tailwind v4 CSS-first configs:
 *   @import "tailwindcss";
 *   @config "../../tailwind.config.mjs";
 */

import {
  CANON_PALETTE,
  CANON_FONTS,
  CANON_SPACING,
  CANON_RADIUS,
  CANON_SHADOW,
  CANON_MOTION_DURATION,
  CANON_MOTION_EASING,
  CANON_Z_INDEX,
  CANON_FOCUS,
  CANON_APPEARANCES,
} from './canon';

const appHub = CANON_APPEARANCES.hub;
const appOrg = CANON_APPEARANCES.org;

export const p31Preset = {
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        inherit: 'inherit',

        // Brand palette (canon anchors)
        brand: {
          coral: CANON_PALETTE.coral,
          teal: CANON_PALETTE.teal,
          cyan: CANON_PALETTE.cyan,
          amber: CANON_PALETTE.amber,
          lavender: CANON_PALETTE.lavender,
          phosphorus: CANON_PALETTE.phosphorus,
          phosphor: CANON_PALETTE.phosphor,
          fuchsia: CANON_PALETTE.fuchsia,
        },

        // Hub appearance (dark mode)
        hub: {
          void: appHub.colors.void,
          surface: appHub.colors.surface,
          surface2: appHub.colors.surface2,
          cloud: appHub.colors.cloud,
          ink: appHub.colors.ink,
          muted: appHub.colors.muted,
          paper: appHub.colors.paper,
          coral: appHub.colors.coral,
          teal: appHub.colors.teal,
          cyan: appHub.colors.cyan,
          amber: appHub.colors.amber,
          lavender: appHub.colors.lavender,
          phosphor: appHub.colors.phosphor,
          phosphorus: appHub.colors.phosphorus,
          fuchsia: appHub.colors.fuchsia,
          glass: appHub.glass.surface,
          glassBorder: appHub.glass.border,
        },

        // Org appearance (light mode)
        org: {
          void: appOrg.colors.void,
          surface: appOrg.colors.surface,
          surface2: appOrg.colors.surface2,
          cloud: appOrg.colors.cloud,
          ink: appOrg.colors.ink,
          muted: appOrg.colors.muted,
          paper: appOrg.colors.paper,
          coral: appOrg.colors.coral,
          teal: appOrg.colors.teal,
          cyan: appOrg.colors.cyan,
          amber: appOrg.colors.amber,
          lavender: appOrg.colors.lavender,
          phosphor: appOrg.colors.phosphor,
          phosphorus: appOrg.colors.phosphorus,
          fuchsia: appOrg.colors.fuchsia,
          glass: appOrg.glass.surface,
          glassBorder: appOrg.glass.border,
        },
      },

      fontFamily: {
        sans: CANON_FONTS.sans,
        mono: CANON_FONTS.mono,
      },

      spacing: (() => {
        const s: Record<string, string> = {};
        for (const [k, v] of Object.entries(CANON_SPACING)) {
          s[k] = v;
        }
        return s;
      })(),

      borderRadius: (() => {
        const r: Record<string, string> = {};
        for (const [k, v] of Object.entries(CANON_RADIUS)) {
          r[k] = v;
        }
        return r;
      })(),

      boxShadow: {
        ...CANON_SHADOW,
      },

      zIndex: CANON_Z_INDEX,

      ringWidth: {
        DEFAULT: CANON_FOCUS.ringWidth,
      },
      ringOffsetWidth: {
        DEFAULT: CANON_FOCUS.ringOffset,
      },
      ringColor: {
        hub: CANON_FOCUS.hubRingColor,
        org: CANON_FOCUS.orgRingColor,
      },

      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },

      transitionDuration: {
        ...CANON_MOTION_DURATION,
      },
      transitionTimingFunction: {
        ...CANON_MOTION_EASING,
      },
    },
  },
};
