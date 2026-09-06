import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../packages/ui/src/**/*.stories.@(ts|tsx)',
    '../packages/design-core/src/generated/**/*.stories.@(ts|tsx)',
    './docs/**/*.mdx',
  ],
  addons: ['@storybook/addon-essentials'],
  framework: { name: '@storybook/react-vite', options: {} },
  staticDirs: [],
};

export default config;
