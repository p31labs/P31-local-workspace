const React = require('react');

require('@p31/design-core/css/tokens.css');

const preview = {
  parameters: {
    backgrounds: {
      default: 'void',
      values: [
        { name: 'void', value: '#0A0A0F' },
        { name: 'light', value: '#F8FAFC' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    spoons: {
      description: 'Spoon level (0–5)',
      defaultValue: 5,
      toolbar: {
        title: 'Spoons',
        icon: 'accessibility',
        items: [
          { value: 0, title: '0 — Crisis' },
          { value: 1, title: '1 — Minimal' },
          { value: 2, title: '2 — Low' },
          { value: 3, title: '3 — Moderate' },
          { value: 4, title: '4 — High' },
          { value: 5, title: '5 — Full' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const spoons = context.globals.spoons ?? 5;
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-spoons', String(spoons));
      }
      return React.createElement(
        'div',
        {
          style: {
            background: 'var(--p31-bg, #0A0A0F)',
            minHeight: '100vh',
            padding: 'var(--p31-spacing-lg, 24px)',
            fontFamily: 'var(--p31-font-sans, system-ui, sans-serif)',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              maxWidth: '1200px',
              margin: '0 auto',
              background: 'var(--p31-glass-bg, oklch(100% 0.01 240 / 0.04))',
              backdropFilter: 'blur(var(--p31-blur-standard, 12px))',
              WebkitBackdropFilter: 'blur(var(--p31-blur-standard, 12px))',
              border: '1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.08))',
              borderRadius: 'var(--p31-glass-radius, 24px)',
              padding: 'var(--p31-spacing-lg, 24px)',
              boxShadow: 'var(--p31-glass-shadow, 0 8px 32px rgba(0,0,0,0.15))',
            },
          },
          React.createElement(Story, null),
        ),
      );
    },
  ],
};

module.exports = preview;
