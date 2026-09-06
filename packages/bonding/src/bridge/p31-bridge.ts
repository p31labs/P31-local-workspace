/**
 * P31 Host Bridge — exposes design tokens, spoon level, and game state
 * to ArrowJS WASM sandboxed components.
 *
 * Usage (inside sandboxed ArrowJS code):
 *   import { getToken, getSpoonLevel } from 'host-bridge:p31';
 *   const cyan = getToken('accent-cyan');
 *   const spoons = getSpoonLevel();
 */

export interface P31Bridge {
  /** Get a CSS variable value from the host page */
  getToken(name: string): string;
  /** Get current spoon level (0-5) */
  getSpoonLevel(): number;
  /** Get the current brand name */
  getBrand(): string;
  /** Log a message to the host console (debug) */
  log(...args: unknown[]): void;
}

/**
 * Create a P31 host bridge for injection into ArrowJS WASM sandbox.
 * Call this once on app init and pass the result as the `hostBridge` argument.
 */
export function createP31Bridge(): P31Bridge {
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  const style = typeof getComputedStyle !== 'undefined' ? getComputedStyle(root!) : null;

  return {
    getToken(name: string): string {
      if (!style) return '';
      return style.getPropertyValue(`--p31-${name}`).trim();
    },

    getSpoonLevel(): number {
      if (!root) return 3;
      return parseInt(root.getAttribute('data-spoons') || '3', 10);
    },

    getBrand(): string {
      if (!root) return 'p31ca';
      return root.getAttribute('data-brand') || 'p31ca';
    },

    log(...args: unknown[]): void {
      if (typeof console !== 'undefined') {
        console.log('[P31:ArrowJS]', ...args);
      }
    },
  };
}

/**
 * Generate the sandbox import map string for injecting into ArrowJS
 * sandbox configuration.
 */
export function p31BridgeImportMap(): Record<string, unknown> {
  const bridge = createP31Bridge();
  return {
    'host-bridge:p31': bridge,
  };
}

/** P31 design token keys available via getToken() */
export const P31_TOKENS = [
  'accent-cyan',
  'accent-violet',
  'accent-gold',
  'accent-green',
  'accent-red',
  'text-primary',
  'text-secondary',
  'text-tertiary',
  'glass-bg',
  'glass-border',
  'glass-shadow',
  'radius-sm',
  'radius-md',
  'radius-lg',
  'radius-full',
] as const;
