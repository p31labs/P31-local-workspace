/**
 * @p31/canon-react — package face.
 *
 * No 'use client' directive. Components that use state, context, or
 * effects live in `./client`. Today Button carries no state, so both
 * entries export the same surface. The boundary is established now so
 * moving an export later isn't a breaking change.
 */
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Slot } from './Slot';
export type { SlotProps } from './Slot';