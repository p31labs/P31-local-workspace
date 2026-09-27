import '@p31ca/design-core/css/base.css';
import '@p31ca/design-core/css/glass.css';
import '@p31ca/design-core/css/motion.css';
import '@p31ca/design-core/css/typography.css';
import '@p31ca/ui/chrome.css';

import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    backgrounds: { default: 'void', values: [{ name: 'void', value: '#0A0A0F' }] },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [],
};

export default preview;
