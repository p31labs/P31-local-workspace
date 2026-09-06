import type { Meta, StoryObj } from '@storybook/react';
import { SkipLink } from '../chrome/SkipLink';

const meta: Meta<typeof SkipLink> = { component: SkipLink, title: 'Accessibility/SkipLink' };
export default meta;
type Story = StoryObj<typeof SkipLink>;
export const Default: Story = {};
