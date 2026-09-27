/**
 * Ecosystem-wide A11y baseline.
 * All portals must pass these rules. Portal-specific overrides are documented in their own e2e/.
 *
 * Source: @p31ca/design-core/e2e/a11y.baseline.ts
 * Consumed by: all portal e2e/a11y.spec.ts via package resolution
 */

export interface A11yException {
  rule: string;
  selector: string;
  reason: string;
  portals: string[];
}

export interface A11yBaseline {
  axe: string[];
  ibm: string[];
  exceptions: A11yException[];
}

export const A11Y_BASELINE: A11yBaseline = {
  axe: [
    'aria-allowed-attr',
    'aria-hidden-focus',
    'aria-required-attr',
    'button-name',
    'color-contrast',
    'form-field-multiple-labels',
    'image-alt',
    'label',
    'landmark-no-duplicate-banner',
    'link-name',
    'page-has-heading-one',
  ],
  ibm: ['all'],
  exceptions: [
    {
      rule: 'color-contrast',
      selector: '.mood-button',
      reason:
        'Best achievable: --p31-text (92%) on --p31-surface (18.5%) = 4.13:1, below AA normal 4.5:1. Fixed from 3.29:1 by switching --p31-text-secondary to --p31-text (docs/24)',
      portals: ['qpj'],
    },
  ],
};

export function getExceptionsForPortal(portalName: string): A11yException[] {
  return A11Y_BASELINE.exceptions.filter((e) => e.portals.includes(portalName));
}

export function getEnabledRules(portalName: string): { axe: string[]; ibm: string[] } {
  const portalExceptions = getExceptionsForPortal(portalName);
  const disabledRules = new Set(portalExceptions.map((e) => e.rule));

  return {
    axe: A11Y_BASELINE.axe.filter((r) => !disabledRules.has(r)),
    ibm: A11Y_BASELINE.ibm.filter((r) => !disabledRules.has(r)),
  };
}
