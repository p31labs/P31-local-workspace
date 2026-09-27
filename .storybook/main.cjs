const path = require('path');

const config = {
  stories: ['../packages/ui/src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  framework: { name: '@storybook/react-vite', options: {} },
  async viteFinal(viteConfig) {
    viteConfig.resolve = viteConfig.resolve || {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      '@p31ca/ui': path.resolve(__dirname, '../packages/ui/src'),
      '@p31ca/design-core': path.resolve(__dirname, '../packages/design-core/src'),
    };
    return viteConfig;
  },
};

module.exports = config;
