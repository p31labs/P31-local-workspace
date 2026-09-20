/** Child-facing colors shared by the authoring surface (Ch 4) and the
 *  artifact renderer (Ch 5). Not token names — the swatch is the icon, the
 *  word is the label. Adding a color here automatically appears in the
 *  picker and can be rendered by the artifact. */
export const CHILD_COLORS = [
  { name: 'Amber', token: '--p31-accent' },
  { name: 'Green', token: '--p31-accent-green' },
  { name: 'Pink', token: '--p31-accent-iris' },
] as const;

export type ChildColorName = (typeof CHILD_COLORS)[number]['name'];

/** Resolve a child-facing color name to its token, or null. */
export function colorTokenFor(name: string): string | null {
  return CHILD_COLORS.find((c) => c.name === name)?.token ?? null;
}