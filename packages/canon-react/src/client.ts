'use client';

/**
 * @p31/canon-react/client — client boundary.
 *
 * Every export here is client-only. Components that use useState,
 * useEffect, useContext, or attach listeners at module scope must be
 * exported from this file, not from the package root.
 */

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';