/**
 * Package version — single source of truth.
 * Updated by the release workflow on tag push.
 */

export const VERSION = '0.0.1' as const;

export function getVersion(): string {
  return VERSION;
}
