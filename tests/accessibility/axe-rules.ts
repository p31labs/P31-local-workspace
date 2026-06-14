export const AXE_RULES = {
  hub: {
    tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    rules: {
      'color-contrast': { enabled: true },
      'link-name': { enabled: true },
      'button-name': { enabled: true },
      'image-alt': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
      'aria-roles': { enabled: true },
      'heading-order': { enabled: true },
      'landmark-one-main': { enabled: true },
      'page-has-heading-one': { enabled: false },
      'region': { enabled: false },
    },
  },
};

export type AxePreset = keyof typeof AXE_RULES;
