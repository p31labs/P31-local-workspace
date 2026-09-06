/**
 * Canonical brand palette – single source for coral and teal.
 * These values MUST match p31-universal-canon.json palette.
 */
export const CANON_BRAND = {
  coral: '#cc6247',
  teal: '#5DCAA5',
  cyan: '#4db8a8',
  amber: '#cda852',
  lavender: '#8b7cc9',
  phosphorus: '#3ba372',
  phosphor: '#00FF88',
  fuchsia: '#e879f9',
} as const;

export type CanonBrandKey = keyof typeof CANON_BRAND;
